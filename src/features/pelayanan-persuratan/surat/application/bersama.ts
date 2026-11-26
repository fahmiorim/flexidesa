import "server-only";

/**
 * Use case pembantu bersama persuratan.
 *
 * Pemuat jenis surat, penduduk, pengikut, dan nilai isian yang dipakai
 * beberapa alur persuratan.
 */

import { type IdentitasDesa } from "@/features/info-desa/desa/application/kontrak";
import {
  getPendudukSuratData,
  listAnggotaKeluargaSurat,
  listPendudukSuratByIds,
  type AnggotaKeluargaSuratRow,
  type PendudukSuratData,
} from "@/features/kependudukan/penduduk/application/kontrak";
import { calculateAge, GENDER_LABELS } from "@/features/kependudukan/penduduk/domain/penduduk";
import {
  buildIsianValues,
  isianErrorsToFieldErrors,
  parseIsianFields,
  parseNilaiIsian,
  validateIsianValues,
  type IsianField,
} from "@/features/pelayanan-persuratan/surat/domain/isian";
import {
  buildPengikutPlaceholders,
  KUNCI_ISIAN_LUAR,
  KUNCI_ISIAN_PENGIKUT,
  parsePendudukLuar,
  parsePengikutIds,
  serializePendudukLuar,
  serializePengikutIds,
  type PendudukLuarSurat,
} from "@/features/pelayanan-persuratan/surat/domain/pengikut";
import {
  buildKlgPlaceholders,
  formatTanggalIndonesia,
  formatTanggalSurat,
  hitungBerlakuSampai,
  parseDaftarLampiran,
  type AnggotaKeluargaSurat,
  type JenisSuratDTO,
  type SuratDetail,
} from "@/features/pelayanan-persuratan/surat/domain/surat";
import { terbilangIsi } from "@/features/pelayanan-persuratan/surat/domain/terbilang";
import { getJenisSurat } from "@/features/pelayanan-persuratan/surat/infrastructure/master-repository";
import type { Pengaturan } from "@/features/pengaturan/pengaturan/domain/pengaturan";
import { conflict, validationError } from "@/lib/errors";

export function text(value: string | null | undefined): string {
  return value && value.trim() !== "" ? value : "-";
}

export function toAnggotaKeluarga(
  rows: readonly AnggotaKeluargaSuratRow[],
): AnggotaKeluargaSurat[] {
  return rows.map((row) => ({
    nik: row.nationalId,
    nama: row.name,
    jenisKelamin: GENDER_LABELS[row.gender],
    tempatLahir: row.birthPlace,
    tanggalLahir: formatTanggalIndonesia(row.birthDate),
    usia: String(calculateAge(row.birthDate) ?? "-"),
    agama: row.religionName,
    pendidikan: row.educationName,
    pendidikanSedang: row.educationSedangName,
    pekerjaan: row.occupationName,
    statusKawin: row.maritalStatusName,
    hubunganKk: row.familyRelationName,
    kewarganegaraan: row.citizenshipName,
    golonganDarah: row.bloodTypeName,
    alamat: row.address,
    namaAyah: row.fatherName,
    namaIbu: row.motherName,
    nikAyah: row.fatherNationalId,
    nikIbu: row.motherNationalId,
  }));
}

export async function loadAnggotaKeluarga(
  villageId: number,
  penduduk: PendudukSuratData | null,
): Promise<AnggotaKeluargaSurat[]> {
  if (!penduduk?.familyId) return [];
  const rows = await listAnggotaKeluargaSurat(villageId, penduduk.familyId);
  return toAnggotaKeluarga(rows);
}

export function buildValues(
  surat: SuratDetail,
  jenis: JenisSuratDTO,
  desa: IdentitasDesa,
  penduduk: PendudukSuratData | null,
  anggotaKeluarga: readonly AnggotaKeluargaSurat[],
  pengikutSurat: { pengikut: readonly AnggotaKeluargaSurat[]; luar: readonly PendudukLuarSurat[] },
  number: string,
  pengaturan: Pengaturan,
): Record<string, string> {
  // Format tanggal surat mengikuti Pengaturan Surat (Indonesia/DMY/ISO).
  const formatTanggal = (nilai: string | null | undefined) =>
    formatTanggalSurat(pengaturan.suratFormatTanggal, nilai ?? null);
  const effectiveLetterDate = surat.letterDate ?? "-";
  // Masa berlaku mengikuti satuannya (hari/minggu/bulan/tahun), bukan selalu bulan.
  const berlakuSampai =
    hitungBerlakuSampai(effectiveLetterDate, jenis.validityMonths, jenis.satuanMasaBerlaku) ??
    effectiveLetterDate;

  const values: Record<string, string> = {
    // Nilai isian dinamis ditempatkan lebih dulu; placeholder bawaan menang bila kodenya sama.
    ...parseNilaiIsian(surat.nilaiIsian),
    nama_desa: text(desa.namaDesa),
    kode_desa: text(desa.kodeDesa),
    nama_kecamatan: text(desa.namaKecamatan),
    nama_kabupaten: text(desa.namaKabupaten),
    nama_propinsi: text(desa.namaPropinsi),
    alamat_kantor: text(desa.alamatKantor),
    telepon_desa: text(desa.telepon),
    email_desa: text(desa.emailDesa),
    nama: text(penduduk?.name),
    nik: text(penduduk?.nationalId),
    tempat_lahir: text(penduduk?.birthPlace),
    tanggal_lahir: formatTanggalIndonesia(penduduk?.birthDate),
    jenis_kelamin: penduduk ? GENDER_LABELS[penduduk.gender] : "-",
    agama: text(penduduk?.religionName),
    pekerjaan: text(penduduk?.occupationName),
    akta_lahir: text(penduduk?.birthCertificateNumber),
    akta_kawin: text(penduduk?.marriageCertificateNumber),
    tanggal_kawin: formatTanggalIndonesia(penduduk?.marriageDate),
    akta_cerai: text(penduduk?.divorceCertificateNumber),
    tanggal_cerai: formatTanggalIndonesia(penduduk?.divorceDate),
    nomor_paspor: text(penduduk?.passportNumber),
    tanggal_akhir_paspor: formatTanggalIndonesia(penduduk?.passportExpiryDate),
    nomor_kitas: text(penduduk?.kitasNumber),
    suku: text(penduduk?.ethnicity),
    keterangan_penduduk: text(penduduk?.notes),
    alamat: text(penduduk?.address),
    no_kk: text(penduduk?.familyNumber),
    nomor_surat: number,
    format_nomor_surat: number,
    tanggal_surat: formatTanggal(effectiveLetterDate),
    keperluan: text(surat.purpose ?? "-"),
    berlaku_sampai: formatTanggal(berlakuSampai),
    lampiran: parseDaftarLampiran(jenis.lampiran).join(", "),
    ...buildKlgPlaceholders(anggotaKeluarga),
    // Tambahkan data pengikut surat dan penduduk luar.
    ...buildPengikutPlaceholders(pengikutSurat.pengikut, pengikutSurat.luar),
    // Tambahkan padanan kata untuk isian angka.
    ...terbilangIsi(parseNilaiIsian(surat.nilaiIsian)),
  };

  return terapkanKodeKosong(values, pengaturan);
}

/**
 * Ganti nilai kosong ("-") dengan teks dari Pengaturan Surat.
 *
 * Parity `ganti_data_kosong` OpenSID; hanya placeholder bawaan yang disentuh,
 * nilai isian dinamis milik petugas dibiarkan apa adanya.
 */

export function terapkanKodeKosong(
  values: Record<string, string>,
  pengaturan: Pengaturan,
): Record<string, string> {
  const kosong = pengaturan.suratGantiDataKosong;
  if (!kosong || kosong === "-") return values;
  for (const [kunci, nilai] of Object.entries(values)) {
    if (nilai === "-") values[kunci] = kosong;
  }
  return values;
}

export async function loadJenis(villageId: number, typeId: number): Promise<JenisSuratDTO> {
  const jenis = await getJenisSurat(villageId, typeId);
  if (!jenis) throw conflict("Jenis surat tidak ditemukan.");
  if (!jenis.isActive) throw conflict("Jenis surat sedang tidak aktif.");
  return jenis;
}

export async function ensureResident(
  villageId: number,
  jenis: JenisSuratDTO,
  residentId: number | null,
): Promise<void> {
  if (residentId === null) {
    if (jenis.requiresResident) throw conflict("Penduduk wajib dipilih untuk jenis surat ini.");
    return;
  }

  const penduduk = await getPendudukSuratData(villageId, residentId);
  if (!penduduk) throw conflict("Penduduk yang dipilih tidak ditemukan pada desa ini.");
}

export function resolveIsianValues(
  jenis: JenisSuratDTO,
  raw: Readonly<Record<string, string>>,
): { fields: IsianField[]; values: Record<string, string> } {
  const fields = parseIsianFields(jenis.formIsian);
  const values = buildIsianValues(fields, raw);
  const errors = validateIsianValues(fields, values);

  if (Object.keys(errors).length > 0) {
    throw validationError(
      "Lengkapi isian surat yang wajib diisi.",
      isianErrorsToFieldErrors(errors),
    );
  }

  return { fields, values };
}

/**
 * Gabungkan nilai tersembunyi pengikut & penduduk luar ke peta isian.
 *
 * Disimpan sebagai kunci `__pengikut`/`__luar` (lihat domain/pengikut.ts);
 * hanya diisi bila datanya tidak kosong agar JSON tetap ringkas.
 */

export function denganPengikut(
  values: Record<string, string>,
  pengikut: readonly number[],
  luar: readonly PendudukLuarSurat[],
): Record<string, string> {
  const hasil = { ...values };
  const csv = serializePengikutIds(pengikut);
  if (csv !== "") hasil[KUNCI_ISIAN_PENGIKUT] = csv;
  if (luar.length > 0) hasil[KUNCI_ISIAN_LUAR] = serializePendudukLuar(luar);
  return hasil;
}

/**
 * Baca data pengikut surat & penduduk luar dari nilai isian tersimpan.
 *
 * Pengikut berupa id penduduk yang dimuat ulang dari database warga terkait;
 * penduduk luar langsung dibaca dari baris JSON.
 */

export async function loadPengikutSurat(
  villageId: number,
  nilaiIsian: string | null,
): Promise<{ pengikut: AnggotaKeluargaSurat[]; luar: PendudukLuarSurat[] }> {
  const isian = parseNilaiIsian(nilaiIsian);
  const ids = parsePengikutIds(isian[KUNCI_ISIAN_PENGIKUT]);
  const luar = parsePendudukLuar(isian[KUNCI_ISIAN_LUAR]);
  if (ids.length === 0) return { pengikut: [], luar };

  const rows = await listPendudukSuratByIds(villageId, ids);
  return { pengikut: toAnggotaKeluarga(rows), luar };
}
