import "server-only";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
/**
 * Use case aparat/perangkat desa.
 *
 * Perangkat desa: daftar, cari penduduk, simpan/hapus (termasuk massal),
 * status aktif & kehadiran, penandatangan, dan susunan bagan organisasi.
 * Izin ditegakkan di use case dan desa diambil dari sesi.
 */

import { sinkronkanKepalaDesa } from "@/features/info-desa/identitas-desa/application/kontrak";
import { tenant } from "@/features/info-desa/pemerintahan/application/konteks";
import {
  hitungUrutPerangkat,
  normalisasiFlagPejabat,
  validasiPejabatStruktural,
} from "@/features/info-desa/pemerintahan/domain/aparat-desa";
import {
  listBerkasDokumen,
  listBerkasDokumenPerangkatBanyak,
  listDokumenPemerintahan,
} from "@/features/info-desa/pemerintahan/infrastructure/dokumen-repository";
import {
  getJabatanDetail,
  listRiwayatJabatan,
} from "@/features/info-desa/pemerintahan/infrastructure/jabatan-repository";
import {
  cariPendudukAparat,
  clearAtasanPerangkat,
  clearAtasanPerangkatBanyak,
  deletePerangkat,
  deletePerangkatBanyak,
  getMaxUrutPerangkat,
  getPendudukTenant,
  getPerangkat,
  getPerangkatByNik,
  getPerangkatByNip,
  getPerangkatByTagIdCard,
  insertPerangkat,
  listJabatanRingkas,
  listPerangkat,
  updatePerangkat,
  type PerangkatValues,
} from "@/features/info-desa/pemerintahan/infrastructure/perangkat-repository";
import { hapusMedia } from "@/features/media/infrastructure/media-storage";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { requirePermission } from "@/lib/dal";
import { validationError } from "@/lib/errors";

/** Kunci media sosial aparat yang diterima dari form. */
const KUNCI_MEDIA_SOSIAL = [
  "facebook",
  "instagram",
  "twitter",
  "tiktok",
  "youtube",
  "telegram",
  "whatsapp",
] as const;

/**
 * Menyaring media sosial agar hanya berisi kunci yang dikenal dan nilai teks
 * pendek. Nilai kosong dibuang supaya kolom tidak menyimpan objek tanpa isi.
 */
function rapikanMediaSosial(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const hasil: Record<string, string> = {};
  for (const kunci of KUNCI_MEDIA_SOSIAL) {
    const isi = (value as Record<string, unknown>)[kunci];
    if (typeof isi !== "string") continue;
    const teks = isi.trim().slice(0, 200);
    if (teks) hasil[kunci] = teks;
  }
  return Object.keys(hasil).length ? hasil : null;
}

type BarisPerangkat = Awaited<ReturnType<typeof listPerangkat>>[number];

/** Meringkas baris aparat menjadi data yang dibutuhkan aturan pejabat. */
function ringkasPejabat(rows: readonly BarisPerangkat[], excludeId: number | null = null) {
  return rows
    .filter((row) => row.id !== excludeId)
    .map((row) => ({
      id: row.id,
      nama: row.nama,
      jenis: row.jenisJabatan ?? "lainnya",
      status: row.status,
      ttdAn: row.ttdAn,
      ttdUb: row.ttdUb,
      statusPejabat: row.statusPejabat,
    }));
}

export async function getPerangkatDesaData() {
  const user = await requirePermission("perangkat-desa", "read");
  const villageId = await resolveVillageId(user);
  const [rows, jabatan, riwayat, dokumen] = await Promise.all([
    listPerangkat(villageId),
    listJabatanRingkas(villageId),
    listRiwayatJabatan(villageId),
    listDokumenPemerintahan(villageId),
  ]);
  const akses = {
    ubah: hasPermission(user.permissions, "perangkat-desa", "update"),
    hapus: hasPermission(user.permissions, "perangkat-desa", "delete"),
  };
  return { rows, jabatan, riwayat, dokumen, akses };
}

/** Pencarian penduduk untuk form aparat; hanya penduduk hidup di desa aktif. */

export async function cariPendudukUntukPerangkat(q: string) {
  const user = await requirePermission("perangkat-desa", "read");
  const villageId = await resolveVillageId(user);
  return cariPendudukAparat(villageId, q);
}

export async function simpanPerangkatDesa(id: number | null, input: PerangkatValues) {
  const villageId = await tenant("perangkat-desa", "update");
  if (!input.nama.trim()) throw validationError("Nama perangkat wajib diisi.");
  if (!["aktif", "nonaktif"].includes(input.status ?? ""))
    throw validationError("Status perangkat tidak valid.");
  if (input.nik && !/^\d{16}$/.test(input.nik))
    throw validationError("NIK harus terdiri dari 16 digit.");
  if (input.nik && (await getPerangkatByNik(villageId, input.nik, id)))
    throw validationError("NIK sudah digunakan oleh perangkat desa lain.");
  if (input.nip && (await getPerangkatByNip(villageId, input.nip, id)))
    throw validationError("NIP sudah digunakan oleh perangkat desa lain.");
  // OpenSID mewajibkan Tag ID Card unik di seluruh data pamong.
  if (input.tagIdCard && (await getPerangkatByTagIdCard(villageId, input.tagIdCard, id)))
    throw validationError("Tag ID Card sudah digunakan oleh perangkat desa lain.");
  if (
    input.tanggalPengangkatan &&
    input.tanggalPemberhentian &&
    input.tanggalPemberhentian < input.tanggalPengangkatan
  ) {
    throw validationError("Tanggal pemberhentian tidak boleh sebelum tanggal pengangkatan.");
  }
  if (id) {
    const existing = await getPerangkat(villageId, id);
    if (!existing) throw validationError("Perangkat tidak ditemukan pada desa aktif.");
  }
  let jenisJabatan = "lainnya";
  if (input.jabatanId) {
    const jabatan = await getJabatanDetail(villageId, input.jabatanId);
    if (!jabatan) throw validationError("Jabatan tidak ditemukan pada desa aktif.");
    jenisJabatan = jabatan.jenis;
  }
  if (input.residentId && !(await getPendudukTenant(villageId, input.residentId))) {
    throw validationError("Penduduk yang dipilih tidak ditemukan pada desa aktif.");
  }
  if (input.atasanId === id)
    throw validationError("Perangkat tidak dapat menjadi atasan dirinya sendiri.");
  if (input.atasanId) {
    let currentId: number | null = input.atasanId;
    const visited = new Set<number>();
    while (currentId !== null) {
      if (currentId === id)
        throw validationError("Relasi atasan membentuk siklus pada struktur organisasi.");
      if (visited.has(currentId))
        throw validationError("Struktur organisasi yang dipilih sudah memiliki relasi melingkar.");
      visited.add(currentId);
      const parent = await getPerangkat(villageId, currentId);
      if (!parent) throw validationError("Atasan tidak ditemukan pada desa aktif.");
      if (parent.status !== "aktif")
        throw validationError("Atasan langsung harus merupakan perangkat yang berstatus aktif.");
      currentId = parent.atasanId;
    }
  }
  const pejabat = normalisasiFlagPejabat({
    jenis: jenisJabatan,
    status: input.status ?? "aktif",
    ttdAn: input.ttdAn ?? false,
    ttdUb: input.ttdUb ?? false,
    statusPejabat: input.statusPejabat ?? false,
  });
  validasiPejabatStruktural(pejabat, ringkasPejabat(await listPerangkat(villageId), id));
  // OpenSID menetapkan urutan tetap: Kepala Desa 1, Sekretaris Desa 2, dan
  // aparat baru lainnya memperoleh nomor terakhir.
  const urutOtomatis = hitungUrutPerangkat({
    jenis: jenisJabatan,
    id,
    urut: input.urut ?? 0,
    urutTerakhir: await getMaxUrutPerangkat(villageId),
  });
  const data = {
    ...input,
    urut: urutOtomatis,
    foto: input.foto ?? null,
    ...pejabat,
    mediaSosial: rapikanMediaSosial(input.mediaSosial),
  };
  if (id) {
    const before = await getPerangkat(villageId, id);
    // Path foto tidak boleh berasal dari payload klien: pertahankan berkas lama
    // bila form tidak mengunggah foto baru.
    if (input.foto === undefined) data.foto = before?.foto ?? null;
    await updatePerangkat(villageId, id, data);
    if (before?.foto && before.foto !== data.foto) await hapusMedia(before.foto);
  } else await insertPerangkat(villageId, data);
  await sinkronkanKepalaDesa(villageId);
}

export async function hapusPerangkatDesa(id: number) {
  const villageId = await tenant("perangkat-desa", "delete");
  const person = await getPerangkat(villageId, id);
  const docs = await listBerkasDokumen(villageId, { perangkatId: id });
  await clearAtasanPerangkat(villageId, id);
  await deletePerangkat(villageId, id);
  await sinkronkanKepalaDesa(villageId);
  if (person?.foto) await hapusMedia(person.foto);
  await Promise.all(docs.map((doc) => hapusMedia(doc.berkas)));
}

/** Hapus banyak aparat sekaligus dengan satu operasi database. */

export async function hapusPerangkatDesaMasal(ids: number[]) {
  const villageId = await tenant("perangkat-desa", "delete");
  const unik = [...new Set(ids)];
  if (!unik.length) throw validationError("Pilih aparat yang akan dihapus.");
  const rows = (await listPerangkat(villageId)).filter((row) => unik.includes(row.id));
  if (!rows.length) throw validationError("Aparat yang dipilih tidak ditemukan pada desa aktif.");
  const idTarget = rows.map((row) => row.id);
  const docs = await listBerkasDokumenPerangkatBanyak(villageId, idTarget);
  await clearAtasanPerangkatBanyak(villageId, idTarget);
  await deletePerangkatBanyak(villageId, idTarget);
  await sinkronkanKepalaDesa(villageId);
  await Promise.all([
    ...rows.flatMap((row) => (row.foto ? [hapusMedia(row.foto)] : [])),
    ...docs.map((doc) => hapusMedia(doc.berkas)),
  ]);
}

async function barisPerangkatAktif(villageId: number, id: number) {
  const rows = await listPerangkat(villageId);
  const row = rows.find((item) => item.id === id);
  if (!row) throw validationError("Perangkat tidak ditemukan pada desa aktif.");
  return { row, rows };
}

/** Mengubah status aktif/nonaktif aparat beserta normalisasi flag pejabat. */

export async function ubahStatusPerangkat(id: number, status: string) {
  const villageId = await tenant("perangkat-desa", "update");
  if (!["aktif", "nonaktif"].includes(status))
    throw validationError("Status perangkat tidak valid.");
  const { row, rows } = await barisPerangkatAktif(villageId, id);
  const pejabat = normalisasiFlagPejabat({
    jenis: row.jenisJabatan ?? "lainnya",
    status,
    ttdAn: row.ttdAn,
    ttdUb: row.ttdUb,
    statusPejabat: row.statusPejabat,
  });
  validasiPejabatStruktural(pejabat, ringkasPejabat(rows, id));
  await updatePerangkat(villageId, id, pejabat);
  await sinkronkanKepalaDesa(villageId);
}

/** Mengubah status kehadiran aparat tanpa mengubah status aktif. */

export async function ubahKehadiranPerangkat(id: number, hadir: boolean) {
  const villageId = await tenant("perangkat-desa", "update");
  const { row } = await barisPerangkatAktif(villageId, id);
  if (row.status !== "aktif")
    throw validationError("Status kehadiran hanya dapat diubah untuk perangkat aktif.");
  await updatePerangkat(villageId, id, { kehadiran: hadir });
}

/**
 * Menetapkan penandatangan surat: `an` (atas nama), `ub` (untuk beliau), atau
 * `null` untuk melepas keduanya. Aturan jenis jabatan tetap ditegakkan.
 */

export async function tetapkanPenandatangan(id: number, jenis: "an" | "ub" | null) {
  const villageId = await tenant("perangkat-desa", "update");
  const { row, rows } = await barisPerangkatAktif(villageId, id);
  const pejabat = normalisasiFlagPejabat({
    jenis: row.jenisJabatan ?? "lainnya",
    status: row.status,
    ttdAn: jenis === "an",
    ttdUb: jenis === "ub",
    statusPejabat: row.statusPejabat,
  });
  if (jenis && row.status !== "aktif")
    throw validationError("Penandatangan surat harus perangkat berstatus aktif.");
  if (jenis === "an" && !pejabat.ttdAn)
    throw validationError("Penandatangan a.n hanya dapat ditetapkan pada Sekretaris Desa.");
  if (jenis === "ub" && !pejabat.ttdUb)
    throw validationError(
      "Penandatangan u.b tidak dapat ditetapkan pada Kepala Desa atau Sekretaris Desa.",
    );
  validasiPejabatStruktural(pejabat, ringkasPejabat(rows, id));
  await updatePerangkat(villageId, id, pejabat);
}

/** Menyimpan susunan bagan organisasi untuk satu aparat. */

export async function simpanBaganPerangkat(
  id: number,
  input: {
    atasanId: number | null;
    baganTingkat: number | null;
    baganOffset: string | null;
    baganLayout: string | null;
    baganWarna: string | null;
  },
) {
  const villageId = await tenant("perangkat-desa", "update");
  await barisPerangkatAktif(villageId, id);
  if (input.atasanId !== null) {
    if (input.atasanId === id)
      throw validationError("Perangkat tidak dapat menjadi atasan dirinya sendiri.");
    const atasan = await barisPerangkatAktif(villageId, input.atasanId);
    if (atasan.row.status !== "aktif")
      throw validationError("Atasan langsung harus merupakan perangkat yang berstatus aktif.");
    let currentId: number | null = input.atasanId;
    const visited = new Set<number>();
    while (currentId !== null) {
      if (currentId === id)
        throw validationError("Relasi atasan membentuk siklus pada struktur organisasi.");
      if (visited.has(currentId))
        throw validationError("Struktur organisasi yang dipilih sudah memiliki relasi melingkar.");
      visited.add(currentId);
      const parent = await getPerangkat(villageId, currentId);
      if (!parent) throw validationError("Atasan tidak ditemukan pada desa aktif.");
      if (parent.status !== "aktif")
        throw validationError("Atasan langsung harus merupakan perangkat yang berstatus aktif.");
      currentId = parent.atasanId;
    }
  }
  const layout = input.baganLayout;
  if (layout && !["hanging", "normal"].includes(layout))
    throw validationError("Tata letak bagan tidak valid.");
  const warna = input.baganWarna;
  if (warna && !/^#[0-9a-fA-F]{6}$/.test(warna))
    throw validationError("Warna bagan harus berupa kode heksadesimal, mis. #FFFFFF.");
  const offset = input.baganOffset;
  if (offset && !/^-?\d{1,3}%$/.test(offset))
    throw validationError("Geser bagan harus berupa persentase, mis. -75% atau 75%.");
  await updatePerangkat(villageId, id, {
    atasanId: input.atasanId,
    baganTingkat: input.baganTingkat,
    baganOffset: offset,
    baganLayout: layout,
    baganWarna: warna,
  });
}
