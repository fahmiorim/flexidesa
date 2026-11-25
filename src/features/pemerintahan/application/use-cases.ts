import "server-only";

import { getIdentitasByVillage } from "@/features/desa/application/get-identitas";
import { resolveVillageId } from "@/features/desa/application/resolve-village";
import { sinkronkanKepalaDesa } from "@/features/identitas-desa/infrastructure/identitas-desa-repository";
import {
  hitungUrutPerangkat,
  isJenisJabatan,
  normalisasiFlagPejabat,
  validasiPejabatStruktural,
} from "@/features/pemerintahan/domain/aparat-desa";
import {
  validasiAnggotaLembaga,
  validasiMasterLembaga,
  validasiProfilLembaga,
} from "@/features/pemerintahan/domain/lembaga-desa";
import {
  cariPendudukAparat,
  clearAtasanPerangkat,
  clearAtasanPerangkatBanyak,
  countAreaByLayer,
  countLembagaByMaster,
  countPerangkatByJabatan,
  deleteAnggota,
  deleteArea,
  deleteDokumen,
  deleteJabatan,
  deleteLembaga,
  deleteMasterLembaga,
  deletePerangkat,
  deletePerangkatBanyak,
  deletePolygon,
  deleteRiwayat,
  getAnggota,
  getAnggotaLembagaByResident,
  getArea,
  getDokumen,
  getJabatan,
  getJabatanBySlug,
  getJabatanDetail,
  getLembaga,
  getLembagaByKode,
  getLembagaStatusPublik,
  getMasterLembaga,
  getMasterLembagaByNama,
  getMaxUrutPerangkat,
  getNomorAnggotaLembaga,
  getPendudukTenant,
  getPerangkat,
  getPerangkatByNik,
  getPerangkatByNip,
  getPerangkatByTagIdCard,
  getPerangkatStatus,
  getPolygon,
  getProfilDesa,
  getRiwayat,
  getSekretarisAktif,
  insertAnggota,
  insertArea,
  insertDokumen,
  insertJabatan,
  insertLembaga,
  insertMasterLembaga,
  insertPerangkat,
  insertPolygon,
  insertRiwayat,
  listAnggota,
  listArea,
  listBerkasDokumen,
  listBerkasDokumenPerangkatBanyak,
  listDokumenPemerintahan,
  listFotoAnggota,
  listJabatanRingkas,
  listKetuaLembaga,
  listLembaga,
  listMasterLembaga,
  listPendudukLembaga,
  listPerangkat,
  listPerangkatWilayah,
  listPolygon,
  listRiwayatJabatan,
  listWilayahAdministratif,
  updateAnggota,
  updateArea,
  updateDokumen,
  updateJabatan,
  updateLembaga,
  updateMasterLembaga,
  updatePerangkat,
  updatePolygon,
  updateRiwayat,
  upsertProfilWilayah,
  type AnggotaValues,
  type AreaValues,
  type DokumenValues,
  type LembagaValues,
  type MasterLembagaValues,
  type PerangkatValues,
  type PolygonValues,
  type RiwayatValues,
} from "@/features/pemerintahan/infrastructure/pemerintahan-repository";
import { bacaMedia, hapusMedia } from "@/features/publik/infrastructure/media-storage";
import { hasPermission } from "@/features/rbac/application/authorization";
import { requirePermission, requireUser } from "@/lib/dal";
import { validationError } from "@/lib/errors";

async function tenant(resource: string, action: "read" | "update" | "delete" = "read") {
  const user = await requirePermission(resource, action);
  return resolveVillageId(user);
}

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

export async function getLembagaDesaData() {
  const user = await requirePermission("lembaga-desa", "read");
  const villageId = await resolveVillageId(user);
  const [rows, anggota, dokumen, penduduk, master] = await Promise.all([
    listLembaga(villageId),
    listAnggota(villageId),
    listDokumenPemerintahan(villageId),
    listPendudukLembaga(villageId),
    listMasterLembaga(villageId),
  ]);
  const akses = {
    ubah: hasPermission(user.permissions, "lembaga-desa", "update"),
    hapus: hasPermission(user.permissions, "lembaga-desa", "delete"),
  };
  return { rows, anggota, dokumen, penduduk, master, akses };
}

/** Data halaman pengelolaan kategori (master) lembaga beserta jumlah pemakaian. */
export async function getMasterLembagaData() {
  const user = await requirePermission("lembaga-desa", "read");
  const villageId = await resolveVillageId(user);
  const [rows, lembaga] = await Promise.all([listMasterLembaga(villageId), listLembaga(villageId)]);
  const akses = {
    ubah: hasPermission(user.permissions, "lembaga-desa", "update"),
    hapus: hasPermission(user.permissions, "lembaga-desa", "delete"),
  };
  return { rows, lembaga, akses };
}

/**
 * Identitas desa dan Sekretaris Desa untuk kop serta blok tanda tangan
 * dokumen cetak modul pemerintahan.
 *
 * Hanya memerlukan sesi pengguna: izin baca modul tetap diperiksa oleh masing-
 * masing halaman cetak sebelum fungsi ini dipanggil.
 */
export async function getKopCetakData() {
  const user = await requireUser();
  const villageId = await resolveVillageId(user);
  const [desa, sekretaris] = await Promise.all([
    getIdentitasByVillage(villageId),
    getSekretarisAktif(villageId),
  ]);
  return { desa, sekretaris };
}

export async function getLembagaCetakData() {
  const villageId = await tenant("lembaga-desa");
  const [rows, anggota, master, ketua, desa, sekretaris] = await Promise.all([
    listLembaga(villageId),
    listAnggota(villageId),
    listMasterLembaga(villageId),
    listKetuaLembaga(villageId),
    getIdentitasByVillage(villageId),
    getSekretarisAktif(villageId),
  ]);
  return { rows, anggota, master, ketua, desa, sekretaris };
}

export async function simpanMasterLembaga(id: number | null, input: MasterLembagaValues) {
  const villageId = await tenant("lembaga-desa", "update");
  validasiMasterLembaga(input);
  const nama = input.nama.trim();
  if (await getMasterLembagaByNama(villageId, nama, id)) {
    throw validationError("Nama kategori sudah digunakan pada desa ini.");
  }
  const values: MasterLembagaValues = {
    nama,
    deskripsi: input.deskripsi ?? null,
    urut: input.urut ?? 0,
  };
  if (id) {
    if (!(await getMasterLembaga(villageId, id)))
      throw validationError("Kategori lembaga tidak ditemukan pada desa aktif.");
    await updateMasterLembaga(villageId, id, values);
  } else await insertMasterLembaga(villageId, values);
}

export async function hapusMasterLembaga(id: number) {
  const villageId = await tenant("lembaga-desa", "delete");
  if (!(await getMasterLembaga(villageId, id)))
    throw validationError("Kategori lembaga tidak ditemukan pada desa aktif.");
  if (await countLembagaByMaster(villageId, id)) {
    throw validationError(
      "Kategori tidak dapat dihapus karena masih dipakai lembaga. Pindahkan lembaga ke kategori lain terlebih dahulu.",
    );
  }
  await deleteMasterLembaga(villageId, id);
}

export async function hapusMasterLembagaMasal(ids: number[]) {
  const villageId = await tenant("lembaga-desa", "delete");
  if (!ids.length) throw validationError("Pilih kategori yang akan dihapus.");
  // Periksa semua kategori lebih dulu agar tidak ada penghapusan sebagian.
  for (const id of ids) {
    if (!(await getMasterLembaga(villageId, id)))
      throw validationError("Kategori lembaga tidak ditemukan pada desa aktif.");
    if (await countLembagaByMaster(villageId, id))
      throw validationError(
        "Tidak ada kategori yang dihapus karena sebagian masih dipakai lembaga. Pindahkan lembaga ke kategori lain terlebih dahulu.",
      );
  }
  for (const id of ids) await deleteMasterLembaga(villageId, id);
}

export async function simpanLembagaDesa(id: number | null, input: LembagaValues) {
  const villageId = await tenant("lembaga-desa", "update");
  validasiProfilLembaga(input);
  if (!input.masterId) throw validationError("Kategori lembaga wajib dipilih.");
  if (!(await getMasterLembaga(villageId, input.masterId)))
    throw validationError("Kategori lembaga tidak ditemukan pada desa aktif.");
  const kode = input.kode?.trim() ?? "";
  if (await getLembagaByKode(villageId, kode, id)) {
    throw validationError("Kode lembaga sudah digunakan pada desa ini.");
  }
  if (input.ketuaResidentId && !(await getPendudukTenant(villageId, input.ketuaResidentId))) {
    throw validationError("Ketua yang dipilih tidak ditemukan pada desa aktif.");
  }
  if (!["bpd", "lpm", "pkk", "karang-taruna", "bumdes", "lainnya"].includes(input.jenis ?? ""))
    throw validationError("Jenis lembaga tidak valid.");
  if (!["aktif", "nonaktif"].includes(input.status ?? ""))
    throw validationError("Status lembaga tidak valid.");
  if (
    input.masaBaktiMulai &&
    input.masaBaktiSelesai &&
    input.masaBaktiSelesai < input.masaBaktiMulai
  ) {
    throw validationError("Akhir masa bakti tidak boleh sebelum tanggal mulai.");
  }
  if (id) {
    const before = await getLembaga(villageId, id);
    if (!before) throw validationError("Lembaga tidak ditemukan pada desa aktif.");
    // `logo` undefined berarti admin tidak mengunggah/menghapus logo, sehingga
    // logo lama dipertahankan; null berarti logo memang diminta dihapus.
    const logo = input.logo === undefined ? before.logo : input.logo;
    await updateLembaga(villageId, id, { ...input, logo });
    if (before.logo && logo !== before.logo) await hapusMedia(before.logo);
  } else await insertLembaga(villageId, { ...input, logo: input.logo ?? null });
}

export async function hapusLembagaDesa(id: number) {
  const villageId = await tenant("lembaga-desa", "delete");
  const lembaga = await getLembaga(villageId, id);
  const members = await listFotoAnggota(villageId, id);
  const docs = await listBerkasDokumen(villageId, { lembagaId: id });
  await deleteLembaga(villageId, id);
  await Promise.all([
    ...(lembaga?.logo ? [hapusMedia(lembaga.logo)] : []),
    ...members.flatMap((x) => (x.foto ? [hapusMedia(x.foto)] : [])),
    ...docs.map((x) => hapusMedia(x.berkas)),
  ]);
}

export async function simpanAnggotaLembaga(id: number | null, input: AnggotaValues) {
  const villageId = await tenant("lembaga-desa", "update");
  if (!(await getLembaga(villageId, input.lembagaId)))
    throw validationError("Lembaga tidak ditemukan pada desa aktif.");
  validasiAnggotaLembaga(input);
  if (!input.residentId) throw validationError("Penduduk anggota wajib dipilih.");
  const resident = await getPendudukTenant(villageId, input.residentId);
  if (!resident) throw validationError("Penduduk yang dipilih tidak ditemukan pada desa aktif.");
  if (
    input.nomorAnggota &&
    (await getNomorAnggotaLembaga(villageId, input.lembagaId, input.nomorAnggota, id))
  ) {
    throw validationError("Nomor anggota sudah digunakan pada lembaga ini.");
  }
  // OpenSID menjadikan pasangan lembaga + penduduk unik; cegah orang yang sama
  // tercatat dua kali pada satu lembaga.
  if (await getAnggotaLembagaByResident(villageId, input.lembagaId, input.residentId, id)) {
    throw validationError("Penduduk ini sudah terdaftar sebagai anggota lembaga tersebut.");
  }
  input = { ...input, nama: resident.nama };
  if (input.periodeMulai && input.periodeSelesai && input.periodeSelesai < input.periodeMulai) {
    throw validationError("Akhir periode anggota tidak boleh sebelum tanggal mulai.");
  }
  if (id) {
    const before = await getAnggota(villageId, id);
    if (!before) throw validationError("Anggota tidak ditemukan pada desa aktif.");
    // Path foto tidak boleh berasal dari payload klien: pertahankan berkas lama
    // bila form tidak mengunggah foto baru.
    const foto = input.foto === undefined ? before.foto : input.foto;
    await updateAnggota(villageId, id, { ...input, foto });
    if (before.foto && before.foto !== foto) await hapusMedia(before.foto);
  } else await insertAnggota(villageId, { ...input, foto: input.foto ?? null });
}

export async function hapusAnggotaLembaga(id: number) {
  const villageId = await tenant("lembaga-desa", "delete");
  const member = await getAnggota(villageId, id);
  await deleteAnggota(villageId, id);
  if (member?.foto) await hapusMedia(member.foto);
}

export async function getWilayahPemerintahanData() {
  const villageId = await tenant("wilayah");
  const [wilayah, shapes, layers, officials, profil] = await Promise.all([
    listWilayahAdministratif(villageId),
    listArea(villageId),
    listPolygon(villageId),
    listPerangkatWilayah(villageId),
    getProfilDesa(villageId),
  ]);
  return { ...wilayah, shapes, layers, officials, profil };
}

export async function simpanAreaPeta(id: number | null, input: AreaValues) {
  const villageId = await tenant("wilayah", "update");
  if (!input.nama.trim()) throw validationError("Nama area GIS wajib diisi.");
  let fotoSebelumnya: string | null = null;
  if (id) {
    const existing = await getArea(villageId, id);
    if (!existing) throw validationError("Area GIS tidak ditemukan pada desa aktif.");
    fotoSebelumnya = existing.foto;
  }
  if (input.refPolygon && !(await getPolygon(villageId, input.refPolygon))) {
    throw validationError("Layer polygon tidak ditemukan pada desa aktif.");
  }
  if (input.path) {
    let geo: { type?: string; coordinates?: unknown };
    try {
      geo = JSON.parse(input.path) as { type?: string; coordinates?: unknown };
    } catch {
      throw validationError("Format GeoJSON tidak valid.");
    }
    if (
      !geo ||
      geo.type !== "Polygon" ||
      !Array.isArray(geo.coordinates) ||
      !geo.coordinates.length
    ) {
      throw validationError("Geometri harus berupa GeoJSON Polygon yang valid.");
    }
    const validRing = (ring: unknown): boolean => {
      if (!Array.isArray(ring) || ring.length < 4) return false;
      const validPoint = (point: unknown) =>
        Array.isArray(point) &&
        point.length >= 2 &&
        Number.isFinite(Number(point[0])) &&
        Number.isFinite(Number(point[1])) &&
        Number(point[0]) >= -180 &&
        Number(point[0]) <= 180 &&
        Number(point[1]) >= -90 &&
        Number(point[1]) <= 90;
      if (!ring.every(validPoint)) return false;
      const first = ring[0] as unknown[];
      const last = ring[ring.length - 1] as unknown[];
      return Number(first[0]) === Number(last[0]) && Number(first[1]) === Number(last[1]);
    };
    if (!(geo.coordinates as unknown[]).every(validRing)) {
      throw validationError(
        "Setiap ring Polygon harus memiliki minimal empat titik, koordinat longitude/latitude valid, dan titik awal yang sama dengan titik akhir.",
      );
    }
  }
  if (id) {
    await updateArea(villageId, id, input);
    if (fotoSebelumnya && fotoSebelumnya !== input.foto) await hapusMedia(fotoSebelumnya);
  } else await insertArea(villageId, input);
}

export async function hapusAreaPeta(id: number) {
  const villageId = await tenant("wilayah", "delete");
  const area = await getArea(villageId, id);
  await deleteArea(villageId, id);
  if (area?.foto) await hapusMedia(area.foto);
}

export async function simpanJabatanPerangkat(
  id: number | null,
  nama: string,
  urut: number,
  jenis: string = "lainnya",
  tupoksi: string | null = null,
) {
  const villageId = await tenant("perangkat-desa", "update");
  if (!nama.trim()) throw validationError("Nama jabatan wajib diisi.");
  if (!isJenisJabatan(jenis)) throw validationError("Jenis jabatan tidak valid.");
  if (id && !(await getJabatan(villageId, id)))
    throw validationError("Jabatan tidak ditemukan pada desa aktif.");
  if (
    jenis !== "lainnya" &&
    (await listJabatanRingkas(villageId)).some((row) => row.jenis === jenis && row.id !== id)
  )
    throw validationError(
      jenis === "kades"
        ? "Jabatan Kepala Desa sudah didefinisikan."
        : "Jabatan Sekretaris Desa sudah didefinisikan.",
    );
  const slug = nama
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!slug) throw validationError("Nama jabatan tidak valid.");
  const duplicate = await getJabatanBySlug(villageId, slug);
  if (duplicate && duplicate.id !== id)
    throw validationError("Jabatan dengan nama tersebut sudah terdaftar.");
  const values = {
    nama,
    slug,
    jenis,
    tupoksi: tupoksi?.trim() ? tupoksi.trim() : null,
    urut,
  };
  if (id) await updateJabatan(villageId, id, values);
  else await insertJabatan(villageId, values);
  // Perubahan jenis jabatan dapat mengubah siapa yang menjadi kepala desa.
  await sinkronkanKepalaDesa(villageId);
}

export async function hapusJabatanPerangkat(id: number) {
  const villageId = await tenant("perangkat-desa", "delete");
  const jabatan = await getJabatanDetail(villageId, id);
  if (!jabatan) throw validationError("Jabatan tidak ditemukan pada desa aktif.");
  if (jabatan.jenis !== "lainnya")
    throw validationError("Jabatan Kepala Desa dan Sekretaris Desa tidak dapat dihapus.");
  if (await countPerangkatByJabatan(villageId, id)) {
    throw validationError(
      "Jabatan masih dipakai perangkat desa. Pindahkan jabatan perangkat terlebih dahulu.",
    );
  }
  await deleteJabatan(villageId, id);
}

export async function simpanRiwayatJabatan(id: number | null, input: RiwayatValues) {
  const villageId = await tenant("perangkat-desa", "update");
  if (!(await getPerangkat(villageId, input.perangkatId)))
    throw validationError("Perangkat tidak ditemukan pada desa aktif.");
  if (!input.jabatan.trim()) throw validationError("Nama jabatan pada riwayat wajib diisi.");
  if (input.mulai && input.selesai && input.selesai < input.mulai)
    throw validationError("Tanggal akhir riwayat tidak boleh sebelum tanggal mulai.");
  if (id) {
    if (!(await getRiwayat(villageId, id)))
      throw validationError("Riwayat jabatan tidak ditemukan pada desa aktif.");
    await updateRiwayat(villageId, id, input);
  } else await insertRiwayat(villageId, input);
}

export async function hapusRiwayatJabatan(id: number) {
  const villageId = await tenant("perangkat-desa", "delete");
  await deleteRiwayat(villageId, id);
}

export async function unggahDokumenPemerintahan(input: DokumenValues) {
  if (Boolean(input.perangkatId) === Boolean(input.lembagaId)) {
    throw validationError("Dokumen harus terhubung ke tepat satu perangkat atau lembaga.");
  }
  if (!input.judul.trim() || !input.berkas.trim()) {
    throw validationError("Judul dan berkas dokumen wajib diisi.");
  }
  const villageId = await tenant(input.perangkatId ? "perangkat-desa" : "lembaga-desa", "update");
  if (input.perangkatId && !(await getPerangkat(villageId, input.perangkatId))) {
    throw validationError("Perangkat tidak ditemukan pada desa aktif.");
  }
  if (input.lembagaId && !(await getLembaga(villageId, input.lembagaId))) {
    throw validationError("Lembaga tidak ditemukan pada desa aktif.");
  }
  await insertDokumen(villageId, input);
}

export async function hapusDokumenPemerintahan(id: number) {
  const user = await requireUser();
  const villageId = await resolveVillageId(user);
  const document = await getDokumen(villageId, id);
  if (!document) return;
  await requirePermission(document.perangkatId ? "perangkat-desa" : "lembaga-desa", "delete");
  await deleteDokumen(villageId, id);
  await hapusMedia(document.berkas);
}

export async function simpanLayerPeta(id: number | null, input: PolygonValues) {
  const villageId = await tenant("wilayah", "update");
  if (!input.nama.trim()) throw validationError("Nama layer wajib diisi.");
  if (!input.color || !/^#[0-9a-fA-F]{6}$/.test(input.color))
    throw validationError("Warna layer harus berupa kode HEX.");
  if (id && !(await getPolygon(villageId, id)))
    throw validationError("Layer peta tidak ditemukan pada desa aktif.");
  const values = {
    nama: input.nama,
    color: input.color,
    enabled: input.enabled,
    sortOrder: input.sortOrder,
  };
  if (id) await updatePolygon(villageId, id, values);
  else await insertPolygon(villageId, { ...values, tipe: 0, parrent: 0 });
}

export async function hapusLayerPeta(id: number) {
  const villageId = await tenant("wilayah", "delete");
  if (await countAreaByLayer(villageId, id)) {
    throw validationError(
      "Layer masih dipakai area peta. Pindahkan atau hapus area terkait terlebih dahulu.",
    );
  }
  await deletePolygon(villageId, id);
}

export async function ubahMetadataDokumenPemerintahan(
  id: number,
  input: { judul: string; nomor: string | null; tanggal: string | null; tampilPublik: boolean },
) {
  const user = await requireUser();
  const villageId = await resolveVillageId(user);
  const document = await getDokumen(villageId, id);
  if (!document) throw validationError("Dokumen tidak ditemukan.");
  await requirePermission(document.perangkatId ? "perangkat-desa" : "lembaga-desa", "update");
  await updateDokumen(villageId, id, { ...input, berkas: document.berkas });
}

/**
 * Ambil isi dokumen pemerintahan dengan kontrol akses yang sama seperti route
 * unduhan: dokumen publik hanya terbuka bila pemiliknya masih tampil, dokumen
 * privat wajib melewati permission dan desa sesi yang sama.
 *
 * Mengembalikan `null` untuk semua kegagalan agar route tidak membocorkan
 * keberadaan dokumen tenant lain.
 */
export async function unduhDokumenPemerintahanData(
  villageId: number,
  documentId: number,
): Promise<{ id: number; isi: Buffer; ekstensi: string } | null> {
  const document = await getDokumen(villageId, documentId);
  if (!document) return null;

  // Dokumen publik tetap harus mengikuti status publik pemiliknya. Flag
  // dokumen saja tidak boleh membuka berkas milik perangkat/lembaga tersembunyi.
  if (Boolean(document.perangkatId) === Boolean(document.lembagaId)) return null;
  if (document.tampilPublik) {
    if (document.perangkatId) {
      const owner = await getPerangkatStatus(villageId, document.perangkatId);
      if (owner?.status !== "aktif") return null;
    } else if (document.lembagaId) {
      const owner = await getLembagaStatusPublik(villageId, document.lembagaId);
      if (owner?.status !== "aktif" || !owner.tampilPublik) return null;
    }
  } else {
    const resource = document.perangkatId ? "perangkat-desa" : "lembaga-desa";
    const user = await requirePermission(resource, "read");
    const sesiVillageId = await resolveVillageId(user);
    if (sesiVillageId !== villageId) return null;
  }

  try {
    const isi = await bacaMedia(document.berkas);
    const ekstensi = document.berkas.split(".").pop()?.toLowerCase() ?? "bin";
    return { id: document.id, isi, ekstensi };
  } catch {
    return null;
  }
}

export async function simpanProfilWilayah(input: {
  luasWilayah: string | null;
  batasUtara: string | null;
  batasSelatan: string | null;
  batasTimur: string | null;
  batasBarat: string | null;
  ketinggian: string | null;
  suhuRataRata: string | null;
  curahHujan: string | null;
  topografi: string | null;
}) {
  const villageId = await tenant("wilayah", "update");
  if (
    input.luasWilayah &&
    (!Number.isFinite(Number(input.luasWilayah)) || Number(input.luasWilayah) < 0)
  ) {
    throw validationError("Luas wilayah harus berupa angka positif.");
  }
  await upsertProfilWilayah(villageId, input);
}
