/**
 * Ekspor data penduduk dengan cakupan 44 kolom.
 *
 * Header memakai nama kolom ekspor apa adanya agar berkas dapat diimpor
 * balik. Nilai katalog dan enum ditulis sebagai label; kolom dusun/RW/RT
 * dipisah.
 */

import {
  DISABILITY_LABELS,
  GENDER_LABELS,
  INSURANCE_LABELS,
  KB_METHOD_LABELS,
  KTP_EL_LABELS,
  LIFE_STATUS_LABELS,
  PREGNANCY_STATUS_LABELS,
  STATUS_REKAM_LABELS,
  type PendudukDTO,
} from "@/features/kependudukan/penduduk/domain/penduduk";

/** Baris penduduk lengkap dengan nama katalog dan komponen wilayah. */
export interface PendudukEksporRow extends PendudukDTO {
  religionName: string | null;
  educationName: string | null;
  educationSedangName: string | null;
  occupationName: string | null;
  maritalStatusName: string | null;
  familyRelationName: string | null;
  bloodTypeName: string | null;
  citizenshipName: string | null;
  familyNumber: string | null;
  dusun: string | null;
  rw: string | null;
  rt: string | null;
}

/** Urutan dan nama header ekspor. */
export const KOLOM_EKSPOR_PENDUDUK = [
  "alamat",
  "dusun",
  "rw",
  "rt",
  "nama",
  "no_kk",
  "nik",
  "sex",
  "tempatlahir",
  "tanggallahir",
  "agama_id",
  "pendidikan_kk_id",
  "pendidikan_sedang_id",
  "pekerjaan_id",
  "status_kawin",
  "kk_level",
  "warganegara_id",
  "ayah_nik",
  "nama_ayah",
  "ibu_nik",
  "nama_ibu",
  "golongan_darah_id",
  "akta_lahir",
  "dokumen_pasport",
  "tanggal_akhir_paspor",
  "dokumen_kitas",
  "akta_perkawinan",
  "tanggalperkawinan",
  "akta_perceraian",
  "tanggalperceraian",
  "cacat_id",
  "cara_kb_id",
  "hamil",
  "ktp_el",
  "status_rekam",
  "alamat_sekarang",
  "status_dasar",
  "suku",
  "tag_id_card",
  "id_asuransi",
  "no_asuransi",
  "lat",
  "lng",
  "ket",
] as const;

function teks(nilai: string | null | undefined): string {
  return nilai ?? "";
}

function label<T extends string>(nilai: T | null, labels: Readonly<Record<T, string>>): string {
  return nilai ? labels[nilai] : "";
}

/** Satu baris siap ditulis ke CSV, mengikuti urutan `KOLOM_EKSPOR_PENDUDUK`. */
export function barisEksporPenduduk(row: PendudukEksporRow): string[] {
  return [
    teks(row.address),
    teks(row.dusun),
    teks(row.rw),
    teks(row.rt),
    row.name,
    teks(row.familyNumber),
    teks(row.nationalId),
    GENDER_LABELS[row.gender],
    teks(row.birthPlace),
    teks(row.birthDate),
    teks(row.religionName),
    teks(row.educationName),
    teks(row.educationSedangName),
    teks(row.occupationName),
    teks(row.maritalStatusName),
    teks(row.familyRelationName),
    teks(row.citizenshipName),
    teks(row.fatherNationalId),
    teks(row.fatherName),
    teks(row.motherNationalId),
    teks(row.motherName),
    teks(row.bloodTypeName),
    teks(row.birthCertificateNumber),
    teks(row.passportNumber),
    teks(row.passportExpiryDate),
    teks(row.kitasNumber),
    teks(row.marriageCertificateNumber),
    teks(row.marriageDate),
    teks(row.divorceCertificateNumber),
    teks(row.divorceDate),
    label(row.disability, DISABILITY_LABELS),
    label(row.kbMethod, KB_METHOD_LABELS),
    label(row.pregnancyStatus, PREGNANCY_STATUS_LABELS),
    label(row.ktpEl, KTP_EL_LABELS),
    label(row.statusRekam, STATUS_REKAM_LABELS),
    teks(row.currentAddress),
    LIFE_STATUS_LABELS[row.lifeStatus],
    teks(row.ethnicity),
    teks(row.idCardTag),
    label(row.insurance, INSURANCE_LABELS),
    teks(row.insuranceNumber),
    teks(row.latitude),
    teks(row.longitude),
    teks(row.notes),
  ];
}
