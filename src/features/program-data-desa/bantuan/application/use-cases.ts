import "server-only";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { formatWilayahLabel } from "@/features/info-desa/wilayah/domain/wilayah";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import {
  BANTUAN_RESOURCE,
  buildProgramSlug,
  pesertaFormSchema,
  SASARAN_KELOMPOK,
  SASARAN_KELUARGA,
  SASARAN_PENDUDUK,
  SASARAN_RUMAH_TANGGA,
  type BantuanDetail,
  type BantuanDTO,
  type BantuanFormInput,
  type PesertaFormInput,
  type PesertaReferenceData,
} from "@/features/program-data-desa/bantuan/domain/bantuan";
import {
  normalisasiKode,
  rencanaImporPeserta,
  type BarisImporPeserta,
} from "@/features/program-data-desa/bantuan/domain/impor-peserta";
import {
  bantuanSlugExists,
  countPesertaByProgram,
  deleteAllPesertaByProgram,
  deleteBantuan as deleteBantuanRow,
  deletePeserta as deletePesertaRow,
  findAlamatSasaran,
  findBantuanById,
  findKelompokSasaran,
  findPendudukSasaran,
  insertBantuan as insertBantuanRow,
  insertPeserta as insertPesertaRow,
  listBantuan as listBantuanRows,
  listKelompokSasaran,
  listKeluargaSasaran,
  listPendudukSasaran,
  listPesertaProgram,
  listPesertaSasaranIds,
  listRumahTanggaSasaran,
  listSasaranImpor,
  listSebaranWilayah,
  updateBantuan as updateBantuanRow,
  updatePeserta as updatePesertaRow,
  type BantuanListResult,
} from "@/features/program-data-desa/bantuan/infrastructure/bantuan-repository";
import { requirePermission } from "@/lib/dal";
import { conflict, notFound } from "@/lib/errors";

/**
 * Lapisan aplikasi (use case) untuk bantuan sosial.
 *
 * Setiap use case menegakkan izinnya sendiri lewat `requirePermission`, sehingga
 * pemanggil mana pun (Server Action, Route Handler, skrip) ikut terlindungi.
 * Aturan yang bersifat lintas-data — slug unik, larangan menghapus program yang
 * masih berpeserta, dan kesesuaian sasaran dengan kandidat — ditegakkan di sini.
 */

export interface ListBantuanParams {
  search: string;
  page: number;
  pageSize: number;
}

export async function listBantuan(params: ListBantuanParams): Promise<BantuanListResult> {
  const user = await requirePermission(BANTUAN_RESOURCE, "read");
  const villageId = await resolveVillageId(user);

  return listBantuanRows({ villageId, ...params });
}

/**
 * Slug program yang bebas.
 *
 * Slug dibentuk dari nama, lalu diberi akhiran angka bila sudah dipakai program
 * lain di desa yang sama. Indeks unik `(village_id, slug)` tetap menjadi
 * pengaman terakhir.
 */
async function slugBebas(
  villageId: number,
  nama: string,
  excludeId: number | null,
): Promise<string> {
  const dasar = buildProgramSlug(nama);

  for (let langkah = 0; langkah < 200; langkah += 1) {
    const kandidat = langkah === 0 ? dasar : `${dasar}-${langkah + 1}`;
    if (!(await bantuanSlugExists(villageId, kandidat, excludeId))) {
      return kandidat;
    }
  }

  throw conflict("Tidak dapat membentuk slug program yang unik.");
}

/** Program yang berada di desa pengguna, atau gagal bila tidak ada. */
async function getScopedProgram(villageId: number, id: number): Promise<BantuanDTO> {
  const program = await findBantuanById(villageId, id);
  if (!program) throw notFound("Program bantuan tidak ditemukan.");
  return program;
}

/** Tambah program bantuan baru. */
export async function createBantuan(input: BantuanFormInput): Promise<number> {
  const user = await requirePermission(BANTUAN_RESOURCE, "create");
  const villageId = await resolveVillageId(user);

  const slug = await slugBebas(villageId, input.nama, null);
  return insertBantuanRow(villageId, slug, input);
}

export async function updateBantuan(id: number, input: BantuanFormInput): Promise<void> {
  const user = await requirePermission(BANTUAN_RESOURCE, "update");
  const villageId = await resolveVillageId(user);

  await getScopedProgram(villageId, id);

  const slug = await slugBebas(villageId, input.nama, id);
  await updateBantuanRow(villageId, id, slug, input);
}

/**
 * Hapus program.
 *
 * Program yang masih punya peserta **tidak boleh** dihapus agar riwayat
 * penerimaan tidak hilang tanpa jejak; kosongkan pesertanya terlebih dahulu.
 */
export async function deleteBantuan(id: number): Promise<void> {
  const user = await requirePermission(BANTUAN_RESOURCE, "delete");
  const villageId = await resolveVillageId(user);

  await getScopedProgram(villageId, id);

  const peserta = await countPesertaByProgram(villageId, id);
  if (peserta > 0) {
    throw conflict(
      `Program tidak dapat dihapus karena masih memiliki ${peserta} peserta. Kosongkan peserta terlebih dahulu.`,
    );
  }

  await deleteBantuanRow(villageId, id);
}

/**
 * Data pendukung halaman rincian program.
 *
 * Kandidat sasaran hanya dimuat bila pengguna berhak mengubah data — sekaligus
 * menghemat dua query untuk pengguna baca-saja.
 */
export async function getBantuanDetail(programId: number): Promise<BantuanDetail> {
  const user = await requirePermission(BANTUAN_RESOURCE, "read");
  const villageId = await resolveVillageId(user);

  const program = await getScopedProgram(villageId, programId);
  const canManage = hasPermission(user.permissions, BANTUAN_RESOURCE, "update");

  const [peserta, sebaran, reference] = await Promise.all([
    listPesertaProgram(villageId, program),
    listSebaranWilayah(villageId, program),
    canManage ? getReferenceKandidat(villageId, program) : Promise.resolve(emptyReference()),
  ]);

  return { program, peserta, reference, sebaranWilayah: sebaran, canManage };
}

function emptyReference(): PesertaReferenceData {
  return { penduduk: [], keluarga: [], rumahTangga: [], kelompok: [] };
}

/** Kandidat sasaran yang belum menjadi peserta program. */
async function getReferenceKandidat(
  villageId: number,
  program: BantuanDTO,
): Promise<PesertaReferenceData> {
  const reference = emptyReference();

  if (program.sasaran === SASARAN_KELUARGA) {
    reference.keluarga = await listKeluargaSasaran(villageId, program.id);
  } else if (program.sasaran === SASARAN_RUMAH_TANGGA) {
    reference.rumahTangga = await listRumahTanggaSasaran(villageId, program.id);
  } else if (program.sasaran === SASARAN_KELOMPOK) {
    reference.kelompok = await listKelompokSasaran(villageId, program.id);
  } else if (program.sasaran === SASARAN_PENDUDUK) {
    reference.penduduk = await listPendudukSasaran(villageId, program.id);
  }

  return reference;
}

/**
 * Tambahkan seorang peserta ke program.
 *
 * Sasaran yang dipilih divalidasi terhadap **kandidat yang tersedia** untuk
 * program tersebut, sehingga tidak mungkin menautkan sasaran desa lain atau
 * sasaran yang sudah menjadi peserta. Data kartu yang dibiarkan kosong diisi
 * dari data master sebagai nilai awal.
 */
export async function tambahPeserta(programId: number, input: PesertaFormInput): Promise<void> {
  const user = await requirePermission(BANTUAN_RESOURCE, "update");
  const villageId = await resolveVillageId(user);

  const program = await getScopedProgram(villageId, programId);
  if (input.sasaranId === null || input.sasaranId === undefined) {
    throw new Error("Pilih sasaran penerima bantuan terlebih dahulu.");
  }
  const sudahTerdaftar = await listPesertaSasaranIds(villageId, programId, program.sasaran);
  if (sudahTerdaftar.includes(input.sasaranId)) {
    throw conflict("Sasaran ini sudah menjadi peserta pada program tersebut.");
  }

  const lengkap = await lengkapiKartu(villageId, program.sasaran, input.sasaranId, input);
  await insertPesertaRow(villageId, programId, program.sasaran, input.sasaranId, lengkap);
}

/**
 * Isi snapshot kartu dari data master bila pengguna mengosongkannya.
 *
 * Untuk sasaran penduduk, NIK/nama/tempat/tanggal lahir/alamat diambil dari
 * baris penduduk. Untuk keluarga & rumah tangga hanya alamat yang tersedia di
 * master, sisanya dibiarkan kosong agar tidak salah mengisi identitas orang.
 */
async function lengkapiKartu(
  villageId: number,
  sasaran: number,
  sasaranId: number,
  input: PesertaFormInput,
): Promise<PesertaFormInput> {
  const lengkap: PesertaFormInput = { ...input };

  if (sasaran === SASARAN_PENDUDUK) {
    const penduduk = await findPendudukSasaran(villageId, sasaranId);
    if (penduduk) {
      lengkap.kartuNik ??= penduduk.nationalId;
      lengkap.kartuNama ||= penduduk.name;
      lengkap.kartuTempatLahir ||= penduduk.birthPlace ?? "";
      lengkap.kartuTanggalLahir ??= penduduk.birthDate;
      if (!lengkap.kartuAlamat) {
        lengkap.kartuAlamat = penduduk.address || wilayahLabel(penduduk);
      }
    }
  } else if (sasaran === SASARAN_KELOMPOK) {
    const target = await findKelompokSasaran(villageId, sasaranId);
    if (target) {
      lengkap.kartuNama ||= target.name;
      lengkap.nomorKartu ||= target.decreeNumber ?? target.code ?? "";
    }
  } else if (sasaran === SASARAN_KELUARGA || sasaran === SASARAN_RUMAH_TANGGA) {
    if (!lengkap.kartuAlamat) {
      const alamat = await findAlamatSasaran(
        villageId,
        sasaran === SASARAN_KELUARGA ? "keluarga" : "rumah-tangga",
        sasaranId,
      );
      if (alamat) lengkap.kartuAlamat = alamat;
    }
  }

  return lengkap;
}

/** Label wilayah penduduk, atau string kosong bila wilayahnya belum diisi. */
function wilayahLabel(wilayah: {
  dusun: string | null;
  rw: string | null;
  rt: string | null;
}): string {
  if (!wilayah.dusun && !wilayah.rw && !wilayah.rt) return "";
  return formatWilayahLabel({
    dusun: wilayah.dusun ?? "",
    rw: wilayah.rw ?? "",
    rt: wilayah.rt ?? "",
  });
}

/** Keluarkan seorang peserta dari program. */
export async function hapusPeserta(programId: number, pesertaId: number): Promise<void> {
  const user = await requirePermission(BANTUAN_RESOURCE, "delete");
  const villageId = await resolveVillageId(user);

  await getScopedProgram(villageId, programId);
  await deletePesertaRow(villageId, programId, pesertaId);
}

/**
 * Perbarui snapshot kartu seorang peserta.
 *
 * Hanya kolom `card_*` yang boleh diubah; kolom sasaran (penduduk/keluarga/
 * rumah tangga/kelompok) tidak berubah — ganti peserta berarti keluarkan dulu.
 */
export async function updatePeserta(
  programId: number,
  pesertaId: number,
  input: Partial<PesertaFormInput>,
): Promise<void> {
  const user = await requirePermission(BANTUAN_RESOURCE, "update");
  const villageId = await resolveVillageId(user);

  await getScopedProgram(villageId, programId);
  const updated = await updatePesertaRow(villageId, programId, pesertaId, input);
  if (!updated) throw notFound("Peserta tidak ditemukan.");
}

/** Hapus semua peserta sebuah program (pembersihan massal). */
export async function hapusSemuaPeserta(programId: number): Promise<void> {
  const user = await requirePermission(BANTUAN_RESOURCE, "delete");
  const villageId = await resolveVillageId(user);

  await getScopedProgram(villageId, programId);
  await deleteAllPesertaByProgram(villageId, programId);
}

/** Ringkasan hasil impor peserta untuk umpan balik ke pengguna. */
export interface ImporPesertaResult {
  diimpor: number;
  sudahTerdaftar: number;
  ganda: number;
  ditolak: number;
  tidakDitemukan: string[];
}

/**
 * Impor peserta ke sebuah program dari baris berkas.
 *
 * Setiap baris dicocokkan dengan sasaran desa menurut kode identitasnya
 * (NIK / No. KK / No. RTM / kode kelompok). Baris yang tidak dikenal atau sudah
 * terdaftar dilaporkan tanpa menggagalkan baris lain, dan snapshot kartu diisi
 * dari data master seperti penambahan peserta manual.
 */
export async function imporPesertaBantuan(
  programId: number,
  rows: readonly BarisImporPeserta[],
): Promise<ImporPesertaResult> {
  const user = await requirePermission(BANTUAN_RESOURCE, "create");
  const villageId = await resolveVillageId(user);

  const program = await getScopedProgram(villageId, programId);
  const [sasaran, terdaftar] = await Promise.all([
    listSasaranImpor(villageId, program.sasaran),
    listPesertaSasaranIds(villageId, programId, program.sasaran),
  ]);

  const rencana = rencanaImporPeserta(rows, sasaran, new Set(terdaftar));

  let diimpor = 0;
  for (const item of rencana.siap) {
    // Dilewatkan skema yang sama dengan formulir agar nilai kosong dinormalisasi
    // (mis. tanggal kosong → null) sebelum snapshot kartu dilengkapi.
    const input = pesertaFormSchema.parse({
      programId: String(programId),
      sasaranId: String(item.id),
      nomorKartu: item.nomorKartu,
      kartuNik: "",
      kartuNama: item.namaKartu,
      kartuTempatLahir: "",
      kartuTanggalLahir: "",
      kartuAlamat: "",
    });

    const lengkap = await lengkapiKartu(villageId, program.sasaran, item.id, input);
    await insertPesertaRow(villageId, programId, program.sasaran, item.id, lengkap);
    diimpor += 1;
  }

  return {
    diimpor,
    sudahTerdaftar: rencana.sudahTerdaftar.length,
    ganda: rencana.ditolak.length,
    ditolak: rencana.ditolak.length,
    tidakDitemukan: rencana.tidakDitemukan,
  };
}

/** Kode sasaran pada berkas yang sudah dinormalisasi (dipakai test/UI). */
export { normalisasiKode };
