import "server-only";

/**
 * Use case cuti dan kuota cuti.
 *
 * Pengajuan cuti, keputusan persetujuan, ringkasan kuota, dan penetapan
 * kuota cuti pegawai.
 */

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import {
  PENGAJUAN_IZIN_RESOURCE,
  PERSETUJUAN_IZIN_RESOURCE,
} from "@/features/kehadiran/kehadiran/domain/pengajuan-izin";
import {
  getPengaturanKehadiran as ambilPengaturanKehadiran,
  getCuti,
  getCutiBertabrakan,
  getKuotaCuti,
  getLampiranCuti,
  getPegawai,
  getPegawaiAktif,
  getPegawaiByUserEmail,
  insertCuti,
  listCutiTahun,
  listPegawaiAktifRingkas,
  sumCutiTahunanDisetujui,
  updateStatusCuti,
  upsertKuotaCuti,
} from "@/features/kehadiran/kepegawaian/infrastructure/kepegawaian-repository";
import { bacaMedia } from "@/features/media/infrastructure/media-storage";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { requireUser } from "@/lib/dal";
import { validationError } from "@/lib/errors";

import { village } from "./konteks";
import { sinkronkanPegawaiPerangkat } from "./pegawai";
import { hitungHariKerja, tahunLokal, tanggalLokal, tanggalValid } from "./tanggal";

export async function daftarCuti(tahun = tahunLokal()) {
  const { villageId } = await village(PENGAJUAN_IZIN_RESOURCE);
  await sinkronkanPegawaiPerangkat(villageId);
  return listCutiTahun(villageId, tahun);
}

export async function ajukanCuti(input: {
  pegawaiId: number;
  jenis: string;
  mulai: string;
  selesai: string;
  alasan: string;
  lampiran?: string | null;
}) {
  const user = await requireUser();
  const villageId = await resolveVillageId(user);
  const canManage = hasPermission(user.permissions, PERSETUJUAN_IZIN_RESOURCE, "update");
  if (!canManage) {
    const pegawaiAkun = await getPegawaiByUserEmail(villageId, user.email);
    if (!pegawaiAkun || pegawaiAkun.id !== input.pegawaiId)
      throw new Error("Anda hanya dapat mengajukan cuti/izin untuk akun pegawai yang terhubung.");
  }
  if (!input.alasan.trim()) throw new Error("Alasan cuti/izin wajib diisi.");
  if (!tanggalValid(input.mulai) || !tanggalValid(input.selesai))
    throw new Error("Tanggal cuti/izin tidak valid.");
  if (input.mulai < tanggalLokal()) throw new Error("Tanggal mulai tidak boleh di masa lalu.");
  if (input.jenis === "cuti_tahunan" && input.mulai.slice(0, 4) !== input.selesai.slice(0, 4))
    throw new Error("Cuti tahunan harus berada dalam satu tahun kalender.");
  const pengaturan = await ambilPengaturanKehadiran(villageId);
  let hariLibur: number[] = [0, 6];
  try {
    const parsed = JSON.parse(pengaturan?.hariLibur ?? "[0,6]");
    if (
      Array.isArray(parsed) &&
      parsed.every((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    )
      hariLibur = [...new Set(parsed)];
  } catch {
    /* gunakan akhir pekan sebagai fallback */
  }
  const durasi = hitungHariKerja(input.mulai, input.selesai, hariLibur);
  if (durasi < 1)
    throw new Error("Rentang pengajuan tidak mencakup hari kerja sesuai pengaturan desa.");
  if (await getCutiBertabrakan(villageId, input.pegawaiId, input.mulai, input.selesai))
    throw new Error(
      "Pegawai sudah memiliki pengajuan cuti/izin yang bertabrakan pada tanggal tersebut.",
    );
  if (
    !["cuti_tahunan", "cuti_sakit", "izin", "cuti_penting", "dinas_luar_kota", "lainnya"].includes(
      input.jenis,
    )
  )
    throw new Error("Jenis cuti/izin tidak valid.");
  if (!(await getPegawaiAktif(villageId, input.pegawaiId)))
    throw new Error("Pegawai aktif tidak ditemukan.");
  if (input.jenis === "cuti_tahunan") {
    const tahun = Number(input.mulai.slice(0, 4));
    const quota = await getKuotaCuti(villageId, input.pegawaiId, tahun);
    const total = quota?.total ?? 12;
    const used = await sumCutiTahunanDisetujui(villageId, input.pegawaiId, tahun);
    if (used + durasi > total) throw new Error("Pengajuan melebihi sisa kuota cuti tahunan.");
  }
  await insertCuti(villageId, {
    pegawaiId: input.pegawaiId,
    jenis: input.jenis,
    mulai: input.mulai,
    selesai: input.selesai,
    durasi,
    alasan: input.alasan.trim(),
    lampiran: input.lampiran ?? null,
  });
}

export async function putuskanCuti(id: number, status: "disetujui" | "ditolak", catatan: string) {
  const { user, villageId } = await village(PERSETUJUAN_IZIN_RESOURCE, "update");
  const request = await getCuti(villageId, id);
  if (!request) throw validationError("Pengajuan tidak ditemukan.");
  if (request.status !== "menunggu") throw validationError("Pengajuan ini sudah diputuskan.");
  if (status === "disetujui" && request.jenis === "cuti_tahunan") {
    const year = Number(request.mulai.slice(0, 4));
    const quota = await getKuotaCuti(villageId, request.pegawaiId, year);
    const used = await sumCutiTahunanDisetujui(villageId, request.pegawaiId, year);
    if (used + request.durasi > (quota?.total ?? 12))
      throw validationError("Kuota cuti tidak mencukupi untuk persetujuan ini.");
  }
  await updateStatusCuti(villageId, id, {
    status,
    catatan: catatan || null,
    diputuskanOleh: user.id,
    diputuskanAt: new Date(),
  });
}

export async function ringkasanKuotaCuti(tahun = tahunLokal()) {
  const { villageId } = await village(PENGAJUAN_IZIN_RESOURCE);
  await sinkronkanPegawaiPerangkat(villageId);
  const pegawai = await listPegawaiAktifRingkas(villageId);
  const hasil = [];
  for (const person of pegawai) {
    const quota = await getKuotaCuti(villageId, person.id, tahun);
    const terpakai = await sumCutiTahunanDisetujui(villageId, person.id, tahun);
    hasil.push({ ...person, total: quota?.total ?? 12, terpakai });
  }
  return hasil;
}

export async function simpanKuotaCuti(pegawaiId: number, tahun: number, total: number) {
  const { villageId } = await village(PERSETUJUAN_IZIN_RESOURCE, "update");
  if (!Number.isInteger(total) || total < 0 || total > 365)
    throw new Error("Kuota cuti tidak valid.");
  const used = await sumCutiTahunanDisetujui(villageId, pegawaiId, tahun);
  if (total < used)
    throw new Error("Kuota baru tidak boleh lebih kecil dari cuti yang sudah terpakai.");
  if (!(await getPegawai(villageId, pegawaiId))) throw new Error("Pegawai tidak ditemukan.");
  await upsertKuotaCuti(villageId, pegawaiId, tahun, total);
}

export async function bacaLampiranCutiData(id: number) {
  const { villageId } = await village(PENGAJUAN_IZIN_RESOURCE);
  const request = await getLampiranCuti(villageId, id);
  if (!request?.lampiran) return null;
  const isi = await bacaMedia(request.lampiran);
  return { id, isi, ekstensi: request.lampiran.split(".").pop()?.toLowerCase() ?? "" };
}

/** Hapus berkas absensi/cuti yang batal tersimpan atau sudah tidak dipakai. */
