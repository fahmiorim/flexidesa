import "server-only";

/**
 * Use case lembaga desa dan anggotanya.
 *
 * Lembaga desa, kategori (master) lembaga, anggota, serta data cetak
 * dan kop lembaga.
 * Izin ditegakkan di use case dan desa diambil dari sesi.
 */

import { getIdentitasByVillage } from "@/features/info-desa/desa/application/get-identitas";
import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { tenant } from "@/features/info-desa/pemerintahan/application/konteks";
import {
  validasiAnggotaLembaga,
  validasiMasterLembaga,
  validasiProfilLembaga,
} from "@/features/info-desa/pemerintahan/domain/lembaga-desa";
import {
  listBerkasDokumen,
  listDokumenPemerintahan,
} from "@/features/info-desa/pemerintahan/infrastructure/dokumen-repository";
import {
  countLembagaByMaster,
  deleteAnggota,
  deleteLembaga,
  deleteMasterLembaga,
  getAnggota,
  getAnggotaLembagaByResident,
  getLembaga,
  getLembagaByKode,
  getMasterLembaga,
  getMasterLembagaByNama,
  getNomorAnggotaLembaga,
  insertAnggota,
  insertLembaga,
  insertMasterLembaga,
  listAnggota,
  listFotoAnggota,
  listKetuaLembaga,
  listLembaga,
  listMasterLembaga,
  listPendudukLembaga,
  updateAnggota,
  updateLembaga,
  updateMasterLembaga,
  type AnggotaValues,
  type LembagaValues,
  type MasterLembagaValues,
} from "@/features/info-desa/pemerintahan/infrastructure/lembaga-repository";
import {
  getPendudukTenant,
  getSekretarisAktif,
} from "@/features/info-desa/pemerintahan/infrastructure/perangkat-repository";
import { hapusMedia } from "@/features/media/infrastructure/media-storage";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { requirePermission, requireUser } from "@/lib/dal";
import { validationError } from "@/lib/errors";

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
