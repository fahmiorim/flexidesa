import "server-only";

import { getIdentitas } from "@/features/desa/application/get-identitas";
import { resolveVillageId } from "@/features/desa/application/resolve-village";
import { getSekretarisAktif } from "@/features/pemerintahan/infrastructure/pemerintahan-repository";
import {
  bacaFormIsian,
  labelSasaran,
  parseFilterTerdata,
  SASARAN_KELUARGA,
  SASARAN_LABELS,
  SASARAN_PENDUDUK,
  SUPLEMEN_RESOURCE,
  type ListSuplemenParams,
  type ListSuplemenResult,
  type SuplemenCreateInput,
  type SuplemenFormField,
  type SuplemenOption,
  type SuplemenSasaranOption,
  type SuplemenTerdataFilter,
  type SuplemenTerdataInput,
  type SuplemenTerdataRow,
  type SuplemenTerdataUpdateInput,
  type SuplemenUpdateInput,
  type WilayahFilterOptions,
} from "@/features/penduduk/domain/suplemen";
import {
  buildSuplemenCsv,
  buildSuplemenImporTemplateCsv,
  buildSuplemenRekapCsv,
  hitungRekapSuplemen,
  suplemenFilename,
  suplemenRekapFilename,
} from "@/features/penduduk/domain/suplemen-berkas";
import {
  addSuplemenTerdata,
  addSuplemenTerdataImpor,
  cariSasaranSuplemen,
  countSuplemenTerdata,
  createSuplemen,
  deleteSuplemen,
  findKeluargaIdsByNumber,
  findPendudukIdsByNik,
  getReferensiIsianOptions,
  getSasaranTerdataDetail,
  getSuplemenById,
  getSuplemenTerdataById,
  listSuplemen,
  listSuplemenKeluargaOptions,
  listSuplemenPendudukOptions,
  listSuplemenRekap,
  listSuplemenTerdata,
  listWilayahFilterOptions,
  removeSuplemenTerdata,
  removeSuplemenTerdataMassal,
  updateSuplemen,
  updateSuplemenTerdata,
} from "@/features/penduduk/infrastructure/suplemen-repository";
import { requirePermission } from "@/lib/dal";

const HALAMAN_SUPLEMEN = "/penduduk/suplemen";

/** Label sasaran suplemen (1 = penduduk, 2 = keluarga). */
export function labelSasaranSuplemen(sasaran: number): string {
  return labelSasaran(sasaran);
}

/** Opsi filter sasaran (hanya penduduk & keluarga, seperti OpenSID). */
export const OPSI_SASARAN = [SASARAN_PENDUDUK, SASARAN_KELUARGA].map((nilai) => ({
  value: nilai,
  label: SASARAN_LABELS[nilai] ?? "Penduduk",
}));

// --- Daftar ---------------------------------------------------------------

export interface SuplemenDaftarData {
  hasil: ListSuplemenResult;
  filter: { search: string; sasaran: number | null };
}

/** Data halaman daftar Data Suplemen (butuh izin baca). */
export async function getDaftarSuplemenData(
  params: ListSuplemenParams,
): Promise<SuplemenDaftarData> {
  const user = await requirePermission(SUPLEMEN_RESOURCE, "read");
  const villageId = await resolveVillageId(user);

  return {
    hasil: await listSuplemen(villageId, params),
    filter: {
      search: params.search ?? "",
      sasaran: params.sasaran ?? null,
    },
  };
}

// --- Form suplemen --------------------------------------------------------

export interface SuplemenFormData {
  suplemen: {
    id: number;
    nama: string;
    sasaran: number;
    keterangan: string | null;
    formIsian: SuplemenFormField[];
    terdataCount: number;
  } | null;
}

/** Data form tambah/ubah suplemen; `null` berarti membuat data baru. */
export async function getFormSuplemenData(id: number | null): Promise<SuplemenFormData> {
  const user = await requirePermission(SUPLEMEN_RESOURCE, "read");
  const villageId = await resolveVillageId(user);

  if (id === null) return { suplemen: null };

  const suplemen = await getSuplemenById(villageId, id);
  if (!suplemen) return { suplemen: null };

  return {
    suplemen: {
      id: suplemen.id,
      nama: suplemen.nama,
      sasaran: suplemen.sasaran,
      keterangan: suplemen.keterangan,
      formIsian: bacaFormIsian(suplemen.formIsian),
      terdataCount: await countSuplemenTerdata(villageId, id),
    },
  };
}

export async function createSuplemenUseCase(
  villageId: number,
  input: SuplemenCreateInput,
): Promise<number> {
  return createSuplemen(villageId, input);
}

/**
 * Ubah suplemen.
 *
 * Paritas OpenSID: sasaran tidak boleh diubah bila sudah ada terdata, karena
 * baris terdata lama menunjuk jenis sasaran yang berbeda.
 */
export async function updateSuplemenUseCase(
  villageId: number,
  input: SuplemenUpdateInput,
): Promise<void> {
  const existing = await getSuplemenById(villageId, input.id);
  if (!existing) throw new Error("Data suplemen tidak ditemukan.");

  if (existing.sasaran !== input.sasaran) {
    const jumlah = await countSuplemenTerdata(villageId, input.id);
    if (jumlah > 0) {
      throw new Error(
        "Sasaran tidak dapat diubah karena suplemen ini sudah memiliki data terdata.",
      );
    }
  }

  await updateSuplemen(villageId, input);
}

/** Hapus suplemen; ditolak bila masih memiliki peserta (paritas OpenSID). */
export async function deleteSuplemenUseCase(villageId: number, id: number): Promise<void> {
  const existing = await getSuplemenById(villageId, id);
  if (!existing) throw new Error("Data suplemen tidak ditemukan.");

  const jumlah = await countSuplemenTerdata(villageId, id);
  if (jumlah > 0) {
    throw new Error("Suplemen tidak dapat dihapus karena masih memiliki peserta.");
  }

  await deleteSuplemen(villageId, id);
}

// --- Rincian & terdata ----------------------------------------------------

export interface SuplemenRincianData {
  suplemen: {
    id: number;
    nama: string;
    sasaran: number;
    keterangan: string | null;
    formIsian: SuplemenFormField[];
  };
  rows: SuplemenTerdataRow[];
  wilayah: WilayahFilterOptions;
}

/** Halaman rincian: profil suplemen + daftar terdata sesuai filter. */
export async function getRincianSuplemenData(
  suplemenId: number,
  filter: SuplemenTerdataFilter,
): Promise<SuplemenRincianData | null> {
  const user = await requirePermission(SUPLEMEN_RESOURCE, "read");
  const villageId = await resolveVillageId(user);

  const suplemen = await getSuplemenById(villageId, suplemenId);
  if (!suplemen) return null;

  const [rows, wilayah] = await Promise.all([
    listSuplemenTerdata(villageId, suplemenId, filter),
    listWilayahFilterOptions(villageId),
  ]);

  return {
    suplemen: {
      id: suplemen.id,
      nama: suplemen.nama,
      sasaran: suplemen.sasaran,
      keterangan: suplemen.keterangan,
      formIsian: bacaFormIsian(suplemen.formIsian),
    },
    rows,
    wilayah,
  };
}

/** Detail satu suplemen beserta seluruh terdata (dipakai ekspor). */
export async function getSuplemenDetailUseCase(villageId: number, suplemenId: number) {
  const suplemen = await getSuplemenById(villageId, suplemenId);
  if (!suplemen) return null;

  const terdata = await listSuplemenTerdata(villageId, suplemenId);
  return { suplemen, terdata };
}

export async function getSuplemenTerdataUseCase(
  villageId: number,
  suplemenId: number,
  filter?: SuplemenTerdataFilter,
): Promise<SuplemenTerdataRow[]> {
  return listSuplemenTerdata(villageId, suplemenId, filter);
}

export async function addSuplemenTerdataUseCase(
  villageId: number,
  input: SuplemenTerdataInput,
): Promise<void> {
  await addSuplemenTerdata(villageId, input);
}

export async function updateSuplemenTerdataUseCase(
  villageId: number,
  input: SuplemenTerdataUpdateInput,
): Promise<void> {
  await updateSuplemenTerdata(villageId, input);
}

export async function removeSuplemenTerdataUseCase(villageId: number, id: number): Promise<void> {
  await removeSuplemenTerdata(villageId, id);
}

export async function removeSuplemenTerdataMassalUseCase(
  villageId: number,
  suplemenId: number,
  ids: readonly number[],
): Promise<number> {
  return removeSuplemenTerdataMassal(villageId, suplemenId, ids);
}

/** Data form tambah/ubah terdata beserta sasaran terpilih & blok konfirmasi. */
export async function getFormTerdataData(
  suplemenId: number,
  options: { terdataId?: number; sasaranId?: number },
): Promise<{
  suplemen: SuplemenRincianData["suplemen"];
  terdata: SuplemenTerdataRow | null;
  sasaranDetail: Awaited<ReturnType<typeof getSasaranTerdataDetail>>;
} | null> {
  const user = await requirePermission(SUPLEMEN_RESOURCE, "read");
  const villageId = await resolveVillageId(user);

  const suplemen = await getSuplemenById(villageId, suplemenId);
  if (!suplemen) return null;

  const profil: SuplemenRincianData["suplemen"] = {
    id: suplemen.id,
    nama: suplemen.nama,
    sasaran: suplemen.sasaran,
    keterangan: suplemen.keterangan,
    formIsian: bacaFormIsian(suplemen.formIsian),
  };

  if (options.terdataId) {
    const terdata = await getSuplemenTerdataById(villageId, suplemenId, options.terdataId);
    return { suplemen: profil, terdata, sasaranDetail: null };
  }

  if (options.sasaranId) {
    const detail = await getSasaranTerdataDetail(villageId, suplemen.sasaran, options.sasaranId);
    return { suplemen: profil, terdata: null, sasaranDetail: detail };
  }

  return { suplemen: profil, terdata: null, sasaranDetail: null };
}

/** Pencarian warga untuk pemilih terdata (paritas Select2 AJAX OpenSID). */
export async function cariSasaranSuplemenData(
  suplemenId: number,
  cari: string,
): Promise<SuplemenSasaranOption[]> {
  const user = await requirePermission(SUPLEMEN_RESOURCE, "read");
  const villageId = await resolveVillageId(user);

  const suplemen = await getSuplemenById(villageId, suplemenId);
  if (!suplemen) return [];

  return cariSasaranSuplemen(villageId, suplemenId, suplemen.sasaran, cari);
}

// --- Ekspor, impor, cetak -------------------------------------------------

/** Ekspor terdata sebuah suplemen sebagai CSV (kolom mengikuti data). */
export async function exportSuplemenUseCase(
  villageId: number,
  suplemenId: number,
): Promise<{ csv: string; filename: string } | null> {
  const detail = await getSuplemenDetailUseCase(villageId, suplemenId);
  if (!detail) return null;

  const desa = await getIdentitas();
  const sasaranLabel = labelSasaranSuplemen(detail.suplemen.sasaran);

  return {
    csv: buildSuplemenCsv({
      namaDesa: desa?.namaDesa ?? null,
      namaSuplemen: detail.suplemen.nama,
      sasaranLabel,
      keterangan: detail.suplemen.keterangan,
      rows: detail.terdata.map((row) => ({
        peserta: row.nik ?? row.nomorKk ?? "",
        nama: row.nama ?? "",
        tempatLahir: row.tempatLahir ?? "",
        tanggalLahir: row.tanggalLahir ?? "",
        alamat: row.alamat ?? "",
        keterangan: row.keterangan ?? "",
        isian: row.isian,
      })),
    }),
    filename: suplemenFilename(detail.suplemen.nama),
  };
}

/** Contoh format impor terdata (CSV) untuk sebuah suplemen. */
export async function exportTemplateImporUseCase(
  villageId: number,
  suplemenId: number,
): Promise<{ csv: string; filename: string } | null> {
  const suplemen = await getSuplemenById(villageId, suplemenId);
  if (!suplemen) return null;

  const fields = bacaFormIsian(suplemen.formIsian);
  return {
    csv: buildSuplemenImporTemplateCsv({
      sasaranLabel: labelSasaranSuplemen(suplemen.sasaran),
      kolomIsian: fields.map((field) => field.label),
    }),
    filename: `format-impor-${suplemenFilename(suplemen.nama).replace(/^suplemen-/, "")}`,
  };
}

/**
 * Impor terdata suplemen dari berkas.
 *
 * Kolom tetap hanya "NIK / No. KK" (menyesuaikan sasaran); kolom "Keterangan"
 * mengisi kolom keterangan, kolom lain menjadi isian dinamis.
 */
export async function imporSuplemenUseCase(
  villageId: number,
  suplemenId: number,
  rows: readonly { sasaran: string; isian: Record<string, string> }[],
): Promise<{ ditambahkan: number; dilewati: number; tidakDitemukan: string[] }> {
  const suplemen = await getSuplemenById(villageId, suplemenId);
  if (!suplemen) throw new Error("Suplemen tidak ditemukan.");

  const sasaranPenduduk = suplemen.sasaran !== SASARAN_KELUARGA;
  const kunci = rows.map((row) => row.sasaran);

  const peta = sasaranPenduduk
    ? await findPendudukIdsByNik(villageId, kunci)
    : await findKeluargaIdsByNumber(villageId, kunci);

  let ditambahkan = 0;
  let dilewati = 0;
  const tidakDitemukan: string[] = [];

  for (const row of rows) {
    const sasaranId = peta.get(row.sasaran);
    if (!sasaranId) {
      tidakDitemukan.push(row.sasaran);
      continue;
    }

    // Kolom "Keterangan" pada berkas menjadi kolom keterangan, bukan isian
    // dinamis (paritas kolom B format impor OpenSID).
    const { keterangan, isian } = pisahkanKeterangan(row.isian);

    const berhasil = await addSuplemenTerdataImpor(
      villageId,
      suplemenId,
      sasaranPenduduk
        ? { pendudukId: sasaranId, keluargaId: null }
        : { pendudukId: null, keluargaId: sasaranId },
      isian,
      keterangan,
    );

    if (berhasil) ditambahkan += 1;
    else dilewati += 1;
  }

  return { ditambahkan, dilewati, tidakDitemukan };
}

/** Pisahkan kolom keterangan dari isian dinamis (tanpa mengubah objek asal). */
export function pisahkanKeterangan(isian: Record<string, string>): {
  keterangan: string | null;
  isian: Record<string, string>;
} {
  const salinan = { ...isian };
  let keterangan: string | null = null;

  for (const kunci of Object.keys(salinan)) {
    if (kunci.trim().toLowerCase() === "keterangan") {
      keterangan = (salinan[kunci] ?? "").trim().slice(0, 100) || null;
      delete salinan[kunci];
    }
  }

  return { keterangan, isian: salinan };
}

/**
 * Data cetak/unduh daftar terdata (kop desa + penandatangan).
 *
 * OpenSID meminta penandatangan lewat dialog; FlexiDesa memakai pejabat aktif
 * sebagai bawaan — Kepala Desa (mengetahui) dan Sekretaris Desa.
 */
export async function getCetakSuplemenData(
  suplemenId: number,
  filter: SuplemenTerdataFilter,
): Promise<{
  suplemen: SuplemenRincianData["suplemen"];
  rows: SuplemenTerdataRow[];
  desa: Awaited<ReturnType<typeof getIdentitas>>;
  sekretaris: Awaited<ReturnType<typeof getSekretarisAktif>>;
} | null> {
  const user = await requirePermission(SUPLEMEN_RESOURCE, "read");
  const villageId = await resolveVillageId(user);

  const data = await getRincianSuplemenData(suplemenId, filter);
  if (!data) return null;

  const [desa, sekretaris] = await Promise.all([getIdentitas(), getSekretarisAktif(villageId)]);

  return { suplemen: data.suplemen, rows: data.rows, desa, sekretaris };
}

/** Ekspor terdata sesuai filter aktif (dipakai tombol Unduh pada halaman cetak). */
export async function exportFilteredSuplemenUseCase(
  suplemenId: number,
  filter: SuplemenTerdataFilter,
): Promise<{ csv: string; filename: string } | null> {
  const data = await getCetakSuplemenData(suplemenId, filter);
  if (!data) return null;

  return {
    csv: buildSuplemenCsv({
      namaDesa: data.desa?.namaDesa ?? null,
      namaSuplemen: data.suplemen.nama,
      sasaranLabel: labelSasaranSuplemen(data.suplemen.sasaran),
      keterangan: data.suplemen.keterangan,
      rows: data.rows.map((row) => ({
        peserta: row.nik ?? row.nomorKk ?? "",
        nama: row.nama ?? "",
        tempatLahir: row.tempatLahir ?? "",
        tanggalLahir: row.tanggalLahir ?? "",
        alamat: row.alamat ?? "",
        keterangan: row.keterangan ?? "",
        isian: row.isian,
      })),
    }),
    filename: suplemenFilename(data.suplemen.nama),
  };
}

/** Rekapitulasi seluruh suplemen desa. */
export async function getRekapSuplemenUseCase(villageId: number) {
  const [rows, desa] = await Promise.all([listSuplemenRekap(villageId), getIdentitas()]);

  return {
    rekap: hitungRekapSuplemen(rows, labelSasaranSuplemen),
    namaDesa: desa?.namaDesa ?? null,
  };
}

/** Ekspor rekapitulasi suplemen sebagai CSV. */
export async function exportRekapSuplemenUseCase(
  villageId: number,
): Promise<{ csv: string; filename: string }> {
  const { rekap, namaDesa } = await getRekapSuplemenUseCase(villageId);

  return {
    csv: buildSuplemenRekapCsv({ namaDesa, rekap }),
    filename: suplemenRekapFilename(namaDesa),
  };
}

export async function getSuplemenReferencesUseCase(villageId: number): Promise<{
  penduduk: SuplemenOption[];
  keluarga: SuplemenOption[];
}> {
  const [penduduk, keluarga] = await Promise.all([
    listSuplemenPendudukOptions(villageId),
    listSuplemenKeluargaOptions(villageId),
  ]);
  return { penduduk, keluarga };
}

/** Pilihan referensi untuk kolom isian `select-otomatis`. */
export async function getReferensiIsianSuplemenData(): Promise<Record<string, string[]>> {
  const user = await requirePermission(SUPLEMEN_RESOURCE, "read");
  const villageId = await resolveVillageId(user);
  return getReferensiIsianOptions(villageId);
}

/** Path halaman rincian sebuah suplemen (dipakai redirect aksi). */
export function rincianSuplemenPath(id: number): string {
  return `${HALAMAN_SUPLEMEN}/${id}`;
}

/** Parse filter terdata dari query string halaman/cetak. */
export function filterTerdataDariQuery(searchParams: URLSearchParams): SuplemenTerdataFilter {
  return parseFilterTerdata(searchParams);
}
