import "server-only";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import {
  lampiranWajib,
  PENGAJUAN_IZIN_RESOURCE,
  pengajuanIzinFormSchema,
  PERSETUJUAN_IZIN_RESOURCE,
  type PengajuanIzinRow,
} from "@/features/kehadiran/kehadiran/domain/pengajuan-izin";
import {
  deleteCuti,
  getCuti,
  getPegawaiAktif,
  getPegawaiByUserEmail,
  listCutiTahun,
  listPegawaiAktifRingkas,
} from "@/features/kehadiran/kepegawaian/infrastructure/kepegawaian-repository";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { requirePermission, requireUser } from "@/lib/dal";
import { notFound, validationError } from "@/lib/errors";

import { ajukanCuti, putuskanCuti } from "./cuti";

/**
 * Use case Pengajuan Izin dan Persetujuan Izin (modul Kehadiran).
 *
 * Keduanya memakai mesin cuti/izin yang sama dengan halaman Absensi &
 * Kepegawaian → Cuti & Izin, sehingga aturan durasi hari kerja, bentrok
 * tanggal, dan kuota cuti tahunan tidak ditulis dua kali.
 */

function tahunLokal(): number {
  return Number(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date()).slice(0, 4),
  );
}

function keBaris(row: Awaited<ReturnType<typeof listCutiTahun>>[number]): PengajuanIzinRow {
  return {
    id: row.id,
    pegawaiId: row.pegawaiId,
    nama: row.nama,
    jabatan: row.jabatan,
    jenis: row.jenis,
    mulai: row.mulai,
    selesai: row.selesai,
    durasi: row.durasi,
    keterangan: row.alasan,
    lampiran: row.lampiran,
    status: row.status,
    catatan: row.catatan,
    createdAt: row.createdAt.toISOString(),
  };
}

export interface PengajuanIzinPageData {
  /** Pegawai yang tertaut ke akun yang sedang masuk; `null` bila belum tertaut. */
  pegawaiAkun: { id: number; nama: string } | null;
  /** Pengguna berwenang memutuskan boleh mengajukan untuk pegawai lain. */
  bolehPilihPegawai: boolean;
  pegawai: { id: number; nama: string; jabatan: string | null }[];
  rows: PengajuanIzinRow[];
  tahun: number;
}

/** Data halaman Kehadiran → Pengajuan Izin (pengajuan milik akun sendiri). */
export async function getPengajuanIzinData(tahun = tahunLokal()): Promise<PengajuanIzinPageData> {
  const user = await requirePermission(PENGAJUAN_IZIN_RESOURCE, "read");
  const villageId = await resolveVillageId(user);
  const bolehPilihPegawai = hasPermission(user.permissions, PERSETUJUAN_IZIN_RESOURCE, "update");

  const [pegawaiAkun, rows, pegawai] = await Promise.all([
    getPegawaiByUserEmail(villageId, user.email),
    listCutiTahun(villageId, tahun),
    bolehPilihPegawai ? listPegawaiAktifRingkas(villageId) : Promise.resolve([]),
  ]);

  const milikSendiri = pegawaiAkun ? rows.filter((row) => row.pegawaiId === pegawaiAkun.id) : [];

  return {
    pegawaiAkun,
    bolehPilihPegawai,
    pegawai: pegawai.map((item) => ({ id: item.id, nama: item.nama, jabatan: item.jabatan })),
    rows: milikSendiri.map(keBaris),
    tahun,
  };
}

/**
 * Data halaman Kehadiran → Persetujuan Izin (seluruh pengajuan desa).
 *
 * Tanpa `tahun`, seluruh pengajuan ditampilkan seperti daftar OpenSID, agar
 * pengajuan yang menyeberang tahun tetap dapat diputuskan.
 */
export async function getPersetujuanIzinData(
  tahun: number | null = null,
): Promise<PengajuanIzinRow[]> {
  const user = await requirePermission(PERSETUJUAN_IZIN_RESOURCE, "read");
  const villageId = await resolveVillageId(user);
  const rows = await listCutiTahun(villageId, tahun);
  return rows.map(keBaris);
}

/**
 * Ajukan izin/sakit/cuti.
 *
 * Pengguna biasa hanya dapat mengajukan untuk dirinya (akun harus tertaut ke
 * data pegawai). Pemegang izin persetujuan boleh memilih pegawai lain, sama
 * seperti halaman Cuti & Izin.
 */
export async function ajukanPengajuanIzin(input: {
  pegawaiId?: number;
  jenis: string;
  mulai: string;
  selesai: string;
  keterangan: string;
  lampiran: string | null;
}): Promise<{ id: number | null }> {
  // OpenSID membiarkan setiap pamong mengajukan izin untuk dirinya, jadi cukup
  // login seperti `ajukanCuti`; batas "hanya diri sendiri" dijaga di bawah.
  const user = await requireUser();
  const villageId = await resolveVillageId(user);

  const parsed = pengajuanIzinFormSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const pesan = issue?.message ?? "Data pengajuan tidak valid.";
    const field = issue?.path.join(".") || "_form";
    throw validationError(pesan, { [field]: [pesan] });
  }

  const bolehPilihPegawai = hasPermission(user.permissions, PERSETUJUAN_IZIN_RESOURCE, "update");

  let pegawaiId = input.pegawaiId ?? null;
  if (pegawaiId === null || !bolehPilihPegawai) {
    const pegawaiAkun = await getPegawaiByUserEmail(villageId, user.email);
    if (!pegawaiAkun) {
      throw validationError(
        "Akun Anda belum tertaut ke data pegawai. Minta administrator mengisi email akun pada profil pegawai.",
        { pegawaiId: ["Akun belum tertaut ke data pegawai."] },
      );
    }
    if (pegawaiId !== null && pegawaiId !== pegawaiAkun.id && !bolehPilihPegawai) {
      throw validationError("Anda hanya dapat mengajukan izin untuk akun pegawai yang tertaut.", {
        pegawaiId: ["Pengajuan hanya untuk akun sendiri."],
      });
    }
    pegawaiId = pegawaiAkun.id;
  }

  if (!(await getPegawaiAktif(villageId, pegawaiId))) {
    throw validationError("Pegawai aktif tidak ditemukan.", {
      pegawaiId: ["Pegawai aktif tidak ditemukan."],
    });
  }

  const pesanLampiran =
    lampiranWajib(parsed.data.jenis) && !input.lampiran
      ? "Lampiran surat dokter wajib untuk pengajuan sakit."
      : null;
  if (pesanLampiran) throw validationError(pesanLampiran, { lampiran: [pesanLampiran] });

  await ajukanCuti({
    pegawaiId,
    jenis: parsed.data.jenis,
    mulai: parsed.data.mulai,
    selesai: parsed.data.selesai,
    alasan: parsed.data.keterangan,
    lampiran: input.lampiran,
  });

  return { id: null };
}

/** Batalkan pengajuan sendiri yang masih menunggu keputusan. */
export async function batalkanPengajuanIzin(id: number): Promise<{ id: number }> {
  const user = await requireUser();
  const villageId = await resolveVillageId(user);

  const row = await getCuti(villageId, id);
  if (!row) throw notFound("Pengajuan izin tidak ditemukan.");

  const bolehPilihPegawai = hasPermission(user.permissions, PERSETUJUAN_IZIN_RESOURCE, "update");
  if (!bolehPilihPegawai) {
    const pegawaiAkun = await getPegawaiByUserEmail(villageId, user.email);
    if (!pegawaiAkun || pegawaiAkun.id !== row.pegawaiId) {
      throw notFound("Pengajuan izin tidak ditemukan.");
    }
  }
  if (row.status !== "menunggu") {
    throw validationError("Pengajuan hanya dapat dibatalkan selama status masih menunggu.");
  }

  await deleteCuti(villageId, id);
  return { id };
}

/** Setujui atau tolak pengajuan; `putuskanCuti` memeriksa kuota cuti tahunan. */
export async function putuskanPengajuanIzin(
  id: number,
  status: "disetujui" | "ditolak",
  catatan: string,
): Promise<{ id: number }> {
  await requirePermission(PERSETUJUAN_IZIN_RESOURCE, "update");
  await putuskanCuti(id, status, catatan);
  return { id };
}
