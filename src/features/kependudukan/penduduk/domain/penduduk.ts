import { z } from "zod";

import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import {
  isBlankSelection,
  optionalDigits,
  optionalIsoDate,
  optionalSelectId,
  optionalText,
  type IdOption,
  type LabelOption,
} from "@/lib/forms";

/** Slug resource RBAC untuk modul penduduk (harus sama dengan `modules.slug`). */
export const PENDUDUK_RESOURCE = RESOURCES.penduduk;

/**
 * `family_relations.id` untuk "KEPALA KELUARGA".
 *
 * Ditempatkan di domain penduduk karena aturan "satu kepala per KK" ditegakkan
 * saat menyimpan penduduk; fitur keluarga memakainya untuk menurunkan kepala KK.
 */
export const HEAD_OF_FAMILY_RELATION_ID = 1;

// --- Kosakata domain (nilai disimpan dalam bahasa Inggris, label Indonesia) ---

export const GENDERS = ["male", "female"] as const;
export type Gender = (typeof GENDERS)[number];

export const GENDER_LABELS: Readonly<Record<Gender, string>> = {
  male: "Laki-laki",
  female: "Perempuan",
};

/** Status tempat tinggal: tetap (terdaftar di desa ini) atau tidak tetap. */
export const RESIDENCE_STATUSES = ["permanent", "temporary"] as const;
export type ResidenceStatus = (typeof RESIDENCE_STATUSES)[number];

export const RESIDENCE_STATUS_LABELS: Readonly<Record<ResidenceStatus, string>> = {
  permanent: "Tetap",
  temporary: "Tidak Tetap",
};

/** Status dasar kependudukan. */
export const LIFE_STATUSES = [
  "alive",
  "deceased",
  "moved",
  "missing",
  "departed",
  "invalid",
] as const;
export type LifeStatus = (typeof LIFE_STATUSES)[number];

export const LIFE_STATUS_LABELS: Readonly<Record<LifeStatus, string>> = {
  alive: "Hidup",
  deceased: "Mati",
  moved: "Pindah",
  missing: "Hilang",
  departed: "Pergi",
  invalid: "Tidak Valid",
};

/** Penduduk berstatus `alive` dihitung sebagai warga aktif desa. */
export function isActiveResident(status: LifeStatus): boolean {
  return status === "alive";
}

/** Penduduk terdaftar sebagai kepala keluarga pada sebuah KK. */
export function isHeadOfFamily(
  penduduk: Pick<PendudukDTO, "familyId" | "familyRelationId">,
): boolean {
  return penduduk.familyId !== null && penduduk.familyRelationId === HEAD_OF_FAMILY_RELATION_ID;
}

// --- Data tambahan --------------------------------------------------------

/** Status kepemilikan identitas elektronik (`ktp_el`). */
export const KTP_ELS = ["belum", "ktpEl", "kia"] as const;
export type KtpEl = (typeof KTP_ELS)[number];
export const KTP_EL_LABELS: Readonly<Record<KtpEl, string>> = {
  belum: "Belum",
  ktpEl: "KTP-EL",
  kia: "KIA",
};

/** Status perekaman KTP (`status_rekam`). */
export const STATUS_REKAMS = [
  "belumWajib",
  "belumRekam",
  "sudahRekam",
  "cardPrinted",
  "printReadyRecord",
  "cardShipped",
  "sentForCardPrinting",
  "cardIssued",
] as const;
export type StatusRekam = (typeof STATUS_REKAMS)[number];
export const STATUS_REKAM_LABELS: Readonly<Record<StatusRekam, string>> = {
  belumWajib: "Belum Wajib",
  belumRekam: "Belum Rekam",
  sudahRekam: "Sudah Rekam",
  cardPrinted: "Card Printed",
  printReadyRecord: "Print Ready Record",
  cardShipped: "Card Shipped",
  sentForCardPrinting: "Sent for Card Printing",
  cardIssued: "Card Issued",
};

/** Tempat dilahirkan (`tempat_dilahirkan`). */
export const BIRTH_PLACE_TYPES = ["hospital", "puskesmas", "polindes", "home", "other"] as const;
type BirthPlaceType = (typeof BIRTH_PLACE_TYPES)[number];
export const BIRTH_PLACE_TYPE_LABELS: Readonly<Record<BirthPlaceType, string>> = {
  hospital: "RS/RB",
  puskesmas: "Puskesmas",
  polindes: "Polindes",
  home: "Rumah",
  other: "Lainnya",
};

/** Jenis kelahiran (`jenis_kelahiran`). */
export const BIRTH_TYPES = ["single", "twin2", "twin3", "twin4"] as const;
type BirthType = (typeof BIRTH_TYPES)[number];
export const BIRTH_TYPE_LABELS: Readonly<Record<BirthType, string>> = {
  single: "Tunggal",
  twin2: "Kembar 2",
  twin3: "Kembar 3",
  twin4: "Kembar 4",
};

/** Penolong kelahiran (`penolong_kelahiran`). */
export const BIRTH_ASSISTANTS = ["doctor", "midwifeNurse", "traditional", "other"] as const;
type BirthAssistant = (typeof BIRTH_ASSISTANTS)[number];
export const BIRTH_ASSISTANT_LABELS: Readonly<Record<BirthAssistant, string>> = {
  doctor: "Dokter",
  midwifeNurse: "Bidan/Perawat",
  traditional: "Dukun",
  other: "Lainnya",
};

/** Cara menghubungi warga (`hubung_warga`). */
export const CONTACT_METHODS = ["sms", "email", "telegram"] as const;
type ContactMethod = (typeof CONTACT_METHODS)[number];
export const CONTACT_METHOD_LABELS: Readonly<Record<ContactMethod, string>> = {
  sms: "SMS",
  email: "Email",
  telegram: "Telegram",
};

/** Jenis disabilitas (`cacat_id`). */
export const DISABILITIES = [
  "physical",
  "blind",
  "deafSpeech",
  "mental",
  "physicalMental",
  "other",
  "none",
] as const;
export type Disability = (typeof DISABILITIES)[number];
export const DISABILITY_LABELS: Readonly<Record<Disability, string>> = {
  physical: "Cacat Fisik",
  blind: "Cacat Netra/Buta",
  deafSpeech: "Cacat Rungu/Wicara",
  mental: "Cacat Mental/Jiwa",
  physicalMental: "Cacat Fisik dan Mental",
  other: "Cacat Lainnya",
  none: "Tidak Cacat",
};

/** Penyakit menahun (`sakit_menahun_id`). */
export const CHRONIC_ILLNESSES = [
  "heart",
  "liver",
  "lungs",
  "cancer",
  "stroke",
  "diabetes",
  "kidney",
  "malaria",
  "leprosy",
  "hivAids",
  "mentalDisorder",
  "tuberculosis",
  "asthma",
  "zoonotic",
  "none",
] as const;
export type ChronicIllness = (typeof CHRONIC_ILLNESSES)[number];
export const CHRONIC_ILLNESS_LABELS: Readonly<Record<ChronicIllness, string>> = {
  heart: "Jantung",
  liver: "Lever",
  lungs: "Paru-paru",
  cancer: "Kanker",
  stroke: "Stroke",
  diabetes: "Diabetes Melitus",
  kidney: "Ginjal",
  malaria: "Malaria",
  leprosy: "Lepra/Kusta",
  hivAids: "HIV/AIDS",
  mentalDisorder: "Gila/Stress",
  tuberculosis: "TBC",
  asthma: "Asma",
  zoonotic: "Zoonotik",
  none: "Tidak Ada/Tidak Sakit",
};

/** Alat kontrasepsi yang dipakai (`cara_kb_id`). */
export const KB_METHODS = [
  "pill",
  "iud",
  "injection",
  "condom",
  "implant",
  "femaleSterilization",
  "maleSterilization",
  "other",
  "none",
] as const;
export type KbMethod = (typeof KB_METHODS)[number];
export const KB_METHOD_LABELS: Readonly<Record<KbMethod, string>> = {
  pill: "Pil",
  iud: "IUD",
  injection: "Suntik",
  condom: "Kondom",
  implant: "Susuk KB",
  femaleSterilization: "Sterilisasi Wanita",
  maleSterilization: "Sterilisasi Pria",
  other: "Lainnya",
  none: "Tidak Menggunakan",
};

/** Status kehamilan (`hamil`). */
export const PREGNANCY_STATUSES = ["pregnant", "notPregnant"] as const;
export type PregnancyStatus = (typeof PREGNANCY_STATUSES)[number];
export const PREGNANCY_STATUS_LABELS: Readonly<Record<PregnancyStatus, string>> = {
  pregnant: "Hamil",
  notPregnant: "Tidak Hamil",
};

/** Jenis asuransi kesehatan (`id_asuransi`). */
export const INSURANCES = ["none", "bpjsPbi", "bpjsNonPbi", "bpjsRegional", "other"] as const;
export type Insurance = (typeof INSURANCES)[number];
export const INSURANCE_LABELS: Readonly<Record<Insurance, string>> = {
  none: "Tidak/Belum Punya",
  bpjsPbi: "BPJS Penerima Bantuan Iuran",
  bpjsNonPbi: "BPJS Non Penerima Bantuan Iuran",
  bpjsRegional: "BPJS Bantuan Daerah",
  other: "Asuransi Lainnya",
};

/** Status kepesertaan asuransi kesehatan (`status_asuransi`). */
export const ACTIVE_STATUSES = ["active", "inactive"] as const;
export type ActiveStatus = (typeof ACTIVE_STATUSES)[number];
export const ACTIVE_STATUS_LABELS: Readonly<Record<ActiveStatus, string>> = {
  active: "Aktif",
  inactive: "Tidak Aktif",
};

/** Kemampuan membaca huruf (`bahasa_id`). */
export const LITERACIES = [
  "latin",
  "regional",
  "arab",
  "arabLatin",
  "arabRegional",
  "arabLatinRegional",
] as const;
type Literacy = (typeof LITERACIES)[number];
export const LITERACY_LABELS: Readonly<Record<Literacy, string>> = {
  latin: "Latin",
  regional: "Daerah",
  arab: "Arab",
  arabLatin: "Arab dan Latin",
  arabRegional: "Arab dan Daerah",
  arabLatinRegional: "Arab, Latin dan Daerah",
};

/**
 * Pilihan enum opsional: kosong menjadi `null`.
 *
 * Nilai `"none"` sengaja tidak dianggap kosong karena beberapa enum penduduk
 * memakainya sebagai pilihan sah (mis. "Tidak Cacat" pada disabilitas).
 */
function optionalEnumValue<const T extends readonly [string, ...string[]]>(
  values: T,
  pesan: string,
) {
  return z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? null : value),
    z.enum(values, { error: pesan }).nullable(),
  );
}

/** Angka bulat opsional dalam rentang tertentu. */
function optionalRange(min: number, max: number, pesan: string) {
  return z.preprocess(
    (value) => (isBlankSelection(value) ? null : value),
    z.coerce.number().int().min(min, pesan).max(max, pesan).nullable(),
  );
}

// --- Validasi formulir -----------------------------------------------------

/** Angka opsional dengan panjang tertentu (untuk tag kartu identitas). */
function optionalDigitsRange(min: number, max: number) {
  return z.preprocess(
    (value) => (isBlankSelection(value) ? null : value),
    z
      .string()
      .trim()
      .regex(new RegExp(`^\\d{${min},${max}}$`), `Harus ${min}–${max} angka.`)
      .nullable(),
  );
}

/** Koordinat opsional dalam bentuk teks desimal, mis. "-6.200000". */
function optionalCoordinate(limit: number, pesan: string) {
  return z.preprocess(
    (value) => (isBlankSelection(value) ? null : value),
    z
      .string()
      .trim()
      .max(30, "Maksimal 30 karakter.")
      .refine((value) => {
        if (value === "") return true;
        const angka = Number(value);
        return Number.isFinite(angka) && Math.abs(angka) <= limit;
      }, pesan)
      .nullable(),
  );
}

/** Teks opsional; nilai kosong disimpan sebagai null. */
function optionalParitasText(max: number) {
  return z.preprocess(
    (value) => (value === null || value === undefined ? "" : value),
    z
      .string()
      .trim()
      .max(max, `Maksimal ${max} karakter.`)
      .transform((value) => value || null),
  );
}

/** Skema validasi input penduduk (dipakai di server action). */
export const pendudukFormSchema = z.object({
  nationalId: optionalDigits(16),
  familyId: optionalSelectId,
  name: z.string().trim().min(1, "Nama wajib diisi.").max(100, "Maksimal 100 karakter."),
  gender: z.preprocess(
    (value) => (isBlankSelection(value) ? "" : value),
    z.enum(GENDERS, { error: "Jenis kelamin wajib dipilih." }),
  ),
  birthPlace: optionalText(100),
  birthDate: optionalIsoDate,
  ktpEl: optionalEnumValue(KTP_ELS, "Status kepemilikan identitas tidak valid."),
  statusRekam: optionalEnumValue(STATUS_REKAMS, "Status rekam tidak valid."),
  idCardTag: optionalDigitsRange(10, 17),
  ktpIssuedPlace: optionalParitasText(150),
  ktpIssuedDate: optionalIsoDate,
  previousFamilyNumber: optionalParitasText(30),
  arrivalPurpose: optionalParitasText(500),
  birthTime: optionalParitasText(5),
  birthPlaceType: optionalEnumValue(BIRTH_PLACE_TYPES, "Tempat dilahirkan tidak valid."),
  birthType: optionalEnumValue(BIRTH_TYPES, "Jenis kelahiran tidak valid."),
  birthChildNumber: optionalRange(1, 20, "Anak ke harus antara 1 dan 20."),
  birthAssistant: optionalEnumValue(BIRTH_ASSISTANTS, "Penolong kelahiran tidak valid."),
  birthWeightGram: optionalRange(1, 999999, "Berat lahir tidak valid."),
  birthLengthCm: optionalRange(1, 999, "Panjang lahir tidak valid."),
  religionId: optionalSelectId,
  educationId: optionalSelectId,
  educationSedangId: optionalSelectId,
  occupationId: optionalSelectId,
  migrantWorker: optionalParitasText(100),
  maritalStatusId: optionalSelectId,
  familyRelationId: optionalSelectId,
  bloodTypeId: optionalSelectId,
  citizenshipId: optionalSelectId,
  originCountry: optionalParitasText(10),
  adat: optionalParitasText(150),
  marga: optionalParitasText(150),
  residenceStatus: z.enum(RESIDENCE_STATUSES, { error: "Status tempat tinggal tidak valid." }),
  lifeStatus: z.enum(LIFE_STATUSES, { error: "Status kependudukan tidak valid." }),
  regionId: optionalSelectId,
  address: optionalText(255),
  previousAddress: optionalParitasText(200),
  currentAddress: optionalParitasText(200),
  latitude: optionalCoordinate(90, "Latitude harus antara -90 dan 90."),
  longitude: optionalCoordinate(180, "Longitude harus antara -180 dan 180."),
  phone: optionalText(30),
  email: optionalParitasText(50),
  telegram: optionalParitasText(100),
  contactMethod: optionalEnumValue(CONTACT_METHODS, "Cara menghubungi warga tidak valid."),
  fatherName: optionalText(100),
  motherName: optionalText(100),
  fatherNationalId: optionalDigits(16),
  motherNationalId: optionalDigits(16),
  birthCertificateNumber: optionalParitasText(40),
  marriageCertificateNumber: optionalParitasText(40),
  marriageDate: optionalIsoDate,
  divorceCertificateNumber: optionalParitasText(40),
  divorceDate: optionalIsoDate,
  passportNumber: optionalParitasText(45),
  passportExpiryDate: optionalIsoDate,
  kitasNumber: optionalParitasText(45),
  ethnicity: optionalParitasText(150),
  disability: optionalEnumValue(DISABILITIES, "Jenis disabilitas tidak valid."),
  chronicIllness: optionalEnumValue(CHRONIC_ILLNESSES, "Penyakit menahun tidak valid."),
  kbMethod: optionalEnumValue(KB_METHODS, "Cara KB tidak valid."),
  pregnancyStatus: optionalEnumValue(PREGNANCY_STATUSES, "Status kehamilan tidak valid."),
  insurance: optionalEnumValue(INSURANCES, "Asuransi kesehatan tidak valid."),
  insuranceNumber: optionalParitasText(100),
  insuranceStatus: optionalEnumValue(ACTIVE_STATUSES, "Status asuransi tidak valid."),
  bpjsEmploymentNumber: optionalParitasText(100),
  literacy: optionalEnumValue(LITERACIES, "Kemampuan membaca huruf tidak valid."),
  notes: optionalParitasText(255),
});

export type PendudukFormInput = z.infer<typeof pendudukFormSchema>;

// --- Bentuk data untuk UI --------------------------------------------------

/** Bentuk data penduduk yang dikirim ke UI (tanpa kolom internal). */
export interface PendudukDTO {
  id: number;
  nationalId: string | null;
  /** Kartu Keluarga (KK) tempat penduduk terdaftar; `null` bila belum ditautkan. */
  familyId: number | null;
  name: string;
  gender: Gender;
  birthPlace: string | null;
  birthDate: string | null;
  ktpEl: KtpEl | null;
  statusRekam: StatusRekam | null;
  idCardTag: string | null;
  ktpIssuedPlace: string | null;
  ktpIssuedDate: string | null;
  previousFamilyNumber: string | null;
  arrivalPurpose: string | null;
  birthTime: string | null;
  birthPlaceType: BirthPlaceType | null;
  birthType: BirthType | null;
  birthChildNumber: number | null;
  birthAssistant: BirthAssistant | null;
  birthWeightGram: number | null;
  birthLengthCm: number | null;
  religionId: number | null;
  educationId: number | null;
  /** Pendidikan yang sedang ditempuh (bisa berbeda dari pendidikan terakhir). */
  educationSedangId: number | null;
  occupationId: number | null;
  migrantWorker: string | null;
  maritalStatusId: number | null;
  familyRelationId: number | null;
  bloodTypeId: number | null;
  citizenshipId: number | null;
  originCountry: string | null;
  adat: string | null;
  marga: string | null;
  residenceStatus: ResidenceStatus;
  lifeStatus: LifeStatus;
  regionId: number | null;
  address: string | null;
  previousAddress: string | null;
  currentAddress: string | null;
  latitude: string | null;
  longitude: string | null;
  phone: string | null;
  email: string | null;
  telegram: string | null;
  contactMethod: ContactMethod | null;
  fatherName: string | null;
  motherName: string | null;
  fatherNationalId: string | null;
  motherNationalId: string | null;
  birthCertificateNumber: string | null;
  marriageCertificateNumber: string | null;
  marriageDate: string | null;
  divorceCertificateNumber: string | null;
  divorceDate: string | null;
  passportNumber: string | null;
  passportExpiryDate: string | null;
  kitasNumber: string | null;
  ethnicity: string | null;
  disability: Disability | null;
  chronicIllness: ChronicIllness | null;
  kbMethod: KbMethod | null;
  pregnancyStatus: PregnancyStatus | null;
  insurance: Insurance | null;
  insuranceNumber: string | null;
  insuranceStatus: ActiveStatus | null;
  bpjsEmploymentNumber: string | null;
  literacy: Literacy | null;
  notes: string | null;
}

/** Baris tabel penduduk: DTO lengkap ditambah data turunan hasil join. */
export interface PendudukListRow extends PendudukDTO {
  religionName: string | null;
  educationName: string | null;
  occupationName: string | null;
  maritalStatusName: string | null;
  /** Nomor Kartu Keluarga yang ditautkan (hasil join), untuk ditampilkan. */
  familyNumber: string | null;
  regionLabel: string | null;
  /** Waktu data tercatat; dipakai kolom "Tgl Terdaftar". */
  createdAt: Date;
}

/** Satu pilihan katalog pada select formulir. */
export type ReferenceOption = IdOption;

/** Pilihan wilayah dengan label siap tampil. */
type RegionOption = LabelOption;

/** Seluruh data referensi yang dibutuhkan formulir penduduk. */
export interface PendudukReferenceData {
  religions: ReferenceOption[];
  educations: ReferenceOption[];
  occupations: ReferenceOption[];
  maritalStatuses: ReferenceOption[];
  familyRelations: ReferenceOption[];
  bloodTypes: ReferenceOption[];
  citizenships: ReferenceOption[];
  /** Kartu Keluarga pada desa ini, untuk menautkan penduduk ke sebuah KK. */
  families: LabelOption[];
  regions: RegionOption[];
  /** Daftar dusun/RW/RT yang benar-benar dipakai, untuk filter lanjutan. */
  dusun: string[];
  rw: string[];
  rt: string[];
}

// --- Filter daftar penduduk ------------------------------------------------

/**
 * Filter lanjutan daftar penduduk.
 *
 * Semua nilai kosong diwakili `null` (atau string kosong) agar satu bentuk data
 * dipakai bersama oleh halaman admin, ekspor CSV, dan use case.
 */
export interface PendudukFilter {
  search: string;
  lifeStatus: LifeStatus | null;
  gender: Gender | null;
  /** Status penduduk (tetap/pendatang); bernama `status_penduduk`. */
  residenceStatus: ResidenceStatus | null;
  religionId: number | null;
  educationId: number | null;
  occupationId: number | null;
  maritalStatusId: number | null;
  dusun: string;
  rw: string;
  rt: string;
  umurMin: number | null;
  umurMax: number | null;
  /**
   * Jenis disabilitas. Nilai `none` mencakup penduduk tanpa isian disabilitas,
   * sama seperti kolom "Tidak Cacat" pada laporan yang dihitung sebagai sisa.
   */
  disability: Disability | null;
  /** Hanya penduduk dengan penyakit menahun selain "Tidak Ada/Tidak Sakit". */
  chronicIllness: boolean;
  pregnancyStatus: PregnancyStatus | null;
}

type NilaiParam = string | string[] | undefined;

function ambilTeks(param: NilaiParam): string {
  if (Array.isArray(param)) return param[0]?.trim() ?? "";
  return param?.trim() ?? "";
}

/** Angka pilihan katalog (> 0); nilai tidak valid dianggap kosong. */
function ambilId(param: NilaiParam): number | null {
  const teks = ambilTeks(param);
  if (teks === "") return null;
  const angka = Number(teks);
  return Number.isInteger(angka) && angka > 0 ? angka : null;
}

/** Batas umur (>= 0); nilai tidak valid dianggap kosong. */
function ambilUmur(param: NilaiParam): number | null {
  const teks = ambilTeks(param);
  if (teks === "") return null;
  const angka = Number(teks);
  return Number.isInteger(angka) && angka >= 0 ? angka : null;
}

/** Filter kosong (tanpa batasan apa pun). */
export function filterPendudukKosong(): PendudukFilter {
  return {
    search: "",
    lifeStatus: null,
    gender: null,
    residenceStatus: null,
    religionId: null,
    educationId: null,
    occupationId: null,
    maritalStatusId: null,
    dusun: "",
    rw: "",
    rt: "",
    umurMin: null,
    umurMax: null,
    disability: null,
    chronicIllness: false,
    pregnancyStatus: null,
  };
}

/**
 * Ubah query string halaman menjadi filter yang tervalidasi.
 *
 * Nilai yang tidak dikenal (status/jenis kelamin salah tulis, id bukan angka)
 * diabaikan alih-alih menggagalkan halaman, sehingga tautan lama tetap bekerja.
 */
export function parseFilterPenduduk(params: Record<string, NilaiParam>): PendudukFilter {
  const status = ambilTeks(params.status);
  const gender = ambilTeks(params.gender);
  const tempatTinggal = ambilTeks(params.tempatTinggal);
  const disabilitas = ambilTeks(params.disabilitas);
  const kehamilan = ambilTeks(params.hamil);

  return {
    search: ambilTeks(params.q),
    lifeStatus: (LIFE_STATUSES as readonly string[]).includes(status)
      ? (status as LifeStatus)
      : null,
    gender: (GENDERS as readonly string[]).includes(gender) ? (gender as Gender) : null,
    residenceStatus: (RESIDENCE_STATUSES as readonly string[]).includes(tempatTinggal)
      ? (tempatTinggal as ResidenceStatus)
      : null,
    religionId: ambilId(params.religionId),
    educationId: ambilId(params.educationId),
    occupationId: ambilId(params.occupationId),
    maritalStatusId: ambilId(params.maritalStatusId),
    dusun: ambilTeks(params.dusun),
    rw: ambilTeks(params.rw),
    rt: ambilTeks(params.rt),
    umurMin: ambilUmur(params.umurMin),
    umurMax: ambilUmur(params.umurMax),
    disability: (DISABILITIES as readonly string[]).includes(disabilitas)
      ? (disabilitas as Disability)
      : null,
    chronicIllness: ambilTeks(params.sakitMenahun) === "ada",
    pregnancyStatus: (PREGNANCY_STATUSES as readonly string[]).includes(kehamilan)
      ? (kehamilan as PregnancyStatus)
      : null,
  };
}

/** Query string dari filter (tanpa parameter halaman). */
export function filterKeSearchParams(filter: PendudukFilter): URLSearchParams {
  const query = new URLSearchParams();

  if (filter.search) query.set("q", filter.search);
  if (filter.lifeStatus) query.set("status", filter.lifeStatus);
  if (filter.gender) query.set("gender", filter.gender);
  if (filter.residenceStatus) query.set("tempatTinggal", filter.residenceStatus);
  if (filter.religionId !== null) query.set("religionId", String(filter.religionId));
  if (filter.educationId !== null) query.set("educationId", String(filter.educationId));
  if (filter.occupationId !== null) query.set("occupationId", String(filter.occupationId));
  if (filter.maritalStatusId !== null) query.set("maritalStatusId", String(filter.maritalStatusId));
  if (filter.dusun) query.set("dusun", filter.dusun);
  if (filter.rw) query.set("rw", filter.rw);
  if (filter.rt) query.set("rt", filter.rt);
  if (filter.umurMin !== null) query.set("umurMin", String(filter.umurMin));
  if (filter.umurMax !== null) query.set("umurMax", String(filter.umurMax));
  if (filter.disability) query.set("disabilitas", filter.disability);
  if (filter.chronicIllness) query.set("sakitMenahun", "ada");
  if (filter.pregnancyStatus) query.set("hamil", filter.pregnancyStatus);

  return query;
}

/** Jumlah filter aktif selain pencarian, untuk lencana di UI. */
export function hitungFilterPenduduk(filter: PendudukFilter): number {
  const nilai = [
    filter.lifeStatus,
    filter.gender,
    filter.residenceStatus,
    filter.religionId,
    filter.educationId,
    filter.occupationId,
    filter.maritalStatusId,
    filter.dusun,
    filter.rw,
    filter.rt,
    filter.umurMin,
    filter.umurMax,
    filter.disability,
    filter.chronicIllness ? "ada" : null,
    filter.pregnancyStatus,
  ];
  return nilai.filter((item) => item !== null && item !== "").length;
}

// --- Pembantu tampilan -----------------------------------------------------

/**
 * Usia dalam tahun penuh pada tanggal `today`.
 * Mengembalikan `null` bila tanggal lahir kosong, tidak valid, atau di masa depan.
 */
export function calculateAge(birthDate: string | null, today: Date = new Date()): number | null {
  if (!birthDate) return null;

  const born = new Date(`${birthDate}T00:00:00Z`);
  if (Number.isNaN(born.getTime()) || born.getTime() > today.getTime()) return null;

  let age = today.getUTCFullYear() - born.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - born.getUTCMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < born.getUTCDate())) {
    age -= 1;
  }

  return age;
}

/**
 * Samarkan NIK agar layar admin tidak memaparkan nomor identitas penuh.
 * Enam digit awal dan dua digit akhir dipertahankan untuk membantu pencocokan
 * manual tanpa membuka data pribadi secara utuh.
 */
export function samarkanNik(nik: string | null): string {
  if (!nik) return "—";
  if (nik.length < 8) return "••••••••";
  return `${nik.slice(0, 6)}••••••${nik.slice(-2)}`;
}

/** Label ringkas penduduk untuk judul dialog konfirmasi. */
export function pendudukLabel(row: Pick<PendudukDTO, "name" | "nationalId">): string {
  return row.nationalId ? `${row.name} (NIK ${row.nationalId})` : row.name;
}
