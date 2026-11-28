/**
 * Impor data penduduk dari berkas CSV/XLSX.
 *
 * Aturan di berkas ini murni (tanpa `db`/sesi) supaya mudah diuji. Header
 * memakai nama kolom yang lazim pada ekspor data desa, sehingga berkas
 * hasil ekspor desa dapat dipakai langsung tanpa diubah. Nilai katalog (agama,
 * pendidikan, pekerjaan, dst.) dicocokkan berdasarkan **nama**, bukan id,
 * karena id katalog berbeda antar instalasi.
 */

import ExcelJS from "exceljs";

import {
  DISABILITIES,
  DISABILITY_LABELS,
  INSURANCE_LABELS,
  INSURANCES,
  KB_METHOD_LABELS,
  KB_METHODS,
  KTP_EL_LABELS,
  KTP_ELS,
  pendudukFormSchema,
  PREGNANCY_STATUS_LABELS,
  PREGNANCY_STATUSES,
  STATUS_REKAM_LABELS,
  STATUS_REKAMS,
  type PendudukFormInput,
} from "@/features/kependudukan/penduduk/domain/penduduk";
import { bacaTabelImpor, petakanKolom, type BarisImpor, type KolomImpor } from "@/lib/spreadsheet";

/** Batas jumlah baris data per berkas agar satu unggahan tidak mengunci server. */
const MAKS_BARIS_IMPOR_PENDUDUK = 2000;

/** Kunci kolom impor penduduk. */
export type KunciImporPenduduk =
  | "nik"
  | "nama"
  | "jenisKelamin"
  | "tempatLahir"
  | "tanggalLahir"
  | "agama"
  | "pendidikan"
  | "pendidikanSedang"
  | "pekerjaan"
  | "statusKawin"
  | "hubunganKeluarga"
  | "golonganDarah"
  | "kewarganegaraan"
  | "statusPenduduk"
  | "statusTinggal"
  | "alamat"
  | "dusun"
  | "rw"
  | "rt"
  | "alamatSekarang"
  | "latitude"
  | "longitude"
  | "telepon"
  | "nikAyah"
  | "namaAyah"
  | "nikIbu"
  | "namaIbu"
  | "noKk"
  | "aktaLahir"
  | "aktaKawin"
  | "tanggalKawin"
  | "aktaCerai"
  | "tanggalCerai"
  | "paspor"
  | "masaBerlakuPaspor"
  | "kitas"
  | "suku"
  | "ktpEl"
  | "statusRekam"
  | "tagIdCard"
  | "cacat"
  | "caraKb"
  | "hamil"
  | "asuransi"
  | "noAsuransi"
  | "keterangan";

/**
 * Kolom yang dibaca dari berkas.
 *
 * Label utama mengikuti judul kolom ekspor data desa; alias menerima variasi umum
 * (singkatan, spasi/tanda hubung berbeda, atau nama kolom berbahasa Inggris).
 */
export const KOLOM_IMPOR_PENDUDUK: readonly KolomImpor<KunciImporPenduduk>[] = [
  {
    kunci: "nik",
    label: "NIK",
    alias: ["nik penduduk", "national id", "national_id"],
    wajib: true,
  },
  { kunci: "nama", label: "Nama", alias: ["nama lengkap", "name"], wajib: true },
  {
    kunci: "jenisKelamin",
    label: "Jenis Kelamin",
    alias: ["sex", "gender", "jenis_kelamin"],
    wajib: true,
  },
  { kunci: "tempatLahir", label: "Tempat Lahir", alias: ["tempatlahir", "birth place"] },
  { kunci: "tanggalLahir", label: "Tanggal Lahir", alias: ["tanggallahir", "birth date"] },
  { kunci: "agama", label: "Agama", alias: ["agama_id", "religion"] },
  { kunci: "pendidikan", label: "Pendidikan", alias: ["pendidikan kk", "pendidikan_kk_id"] },
  {
    kunci: "pendidikanSedang",
    label: "Pendidikan Sedang Ditempuh",
    alias: ["pendidikan sedang", "pendidikan_sedang_id"],
  },
  { kunci: "pekerjaan", label: "Pekerjaan", alias: ["pekerjaan_id", "occupation"] },
  { kunci: "statusKawin", label: "Status Kawin", alias: ["status kawin", "status_kawin"] },
  {
    kunci: "hubunganKeluarga",
    label: "Hubungan Dalam Keluarga",
    alias: ["hubungan keluarga", "kk_level", "shdk"],
  },
  { kunci: "golonganDarah", label: "Golongan Darah", alias: ["golongan_darah_id", "blood type"] },
  {
    kunci: "kewarganegaraan",
    label: "Kewarganegaraan",
    alias: ["warganegara", "warganegara_id", "citizenship"],
  },
  {
    kunci: "statusPenduduk",
    label: "Status Penduduk",
    alias: ["status", "status dasar", "status_dasar", "life status"],
  },
  {
    kunci: "statusTinggal",
    label: "Status Tempat Tinggal",
    alias: ["status tinggal", "status_penduduk"],
  },
  { kunci: "alamat", label: "Alamat", alias: ["alamat kk", "address"] },
  { kunci: "dusun", label: "Dusun", alias: ["dusun"] },
  { kunci: "rw", label: "RW", alias: ["rw"] },
  { kunci: "rt", label: "RT", alias: ["rt"] },
  {
    kunci: "alamatSekarang",
    label: "Alamat Sekarang",
    alias: ["alamat_sekarang", "alamat sekarang"],
  },
  { kunci: "latitude", label: "Latitude", alias: ["lat", "latitude"] },
  { kunci: "longitude", label: "Longitude", alias: ["lng", "longitude"] },
  { kunci: "telepon", label: "Telepon", alias: ["no telepon", "nomor telepon", "phone"] },
  { kunci: "nikAyah", label: "NIK Ayah", alias: ["ayah_nik", "nik ayah"] },
  { kunci: "namaAyah", label: "Nama Ayah", alias: ["ayah nama", "nama_ayah"] },
  { kunci: "nikIbu", label: "NIK Ibu", alias: ["ibu_nik", "nik ibu"] },
  { kunci: "namaIbu", label: "Nama Ibu", alias: ["ibu nama", "nama_ibu"] },
  { kunci: "noKk", label: "No. KK", alias: ["nomor kk", "no kk", "no_kk", "kk"] },
  { kunci: "aktaLahir", label: "Akta Lahir", alias: ["akta_lahir"] },
  { kunci: "aktaKawin", label: "Akta Perkawinan", alias: ["akta_perkawinan"] },
  {
    kunci: "tanggalKawin",
    label: "Tanggal Perkawinan",
    alias: ["tanggalperkawinan", "tanggal_perkawinan"],
  },
  { kunci: "aktaCerai", label: "Akta Perceraian", alias: ["akta_perceraian"] },
  {
    kunci: "tanggalCerai",
    label: "Tanggal Perceraian",
    alias: ["tanggalperceraian", "tanggal_perceraian"],
  },
  { kunci: "paspor", label: "No. Paspor", alias: ["dokumen_pasport", "dokumen_paspor"] },
  {
    kunci: "masaBerlakuPaspor",
    label: "Tanggal Akhir Paspor",
    alias: ["tanggal_akhir_paspor"],
  },
  { kunci: "kitas", label: "No. KITAS", alias: ["dokumen_kitas"] },
  { kunci: "suku", label: "Suku/Etnis", alias: ["suku", "ethnicity"] },
  {
    kunci: "ktpEl",
    label: "Status Kepemilikan Identitas",
    alias: ["ktp_el", "ktp el", "status kepemilikan identitas"],
  },
  {
    kunci: "statusRekam",
    label: "Status Rekam KTP",
    alias: ["status_rekam", "status rekam"],
  },
  { kunci: "tagIdCard", label: "Tag ID Card", alias: ["tag_id_card", "tag id card"] },
  { kunci: "cacat", label: "Disabilitas", alias: ["cacat_id", "cacat"] },
  { kunci: "caraKb", label: "Cara KB", alias: ["cara_kb_id", "cara kb"] },
  { kunci: "hamil", label: "Status Kehamilan", alias: ["hamil", "status kehamilan"] },
  {
    kunci: "asuransi",
    label: "Asuransi Kesehatan",
    alias: ["id_asuransi", "id asuransi"],
  },
  { kunci: "noAsuransi", label: "Nomor Asuransi", alias: ["no_asuransi", "no asuransi"] },
  { kunci: "keterangan", label: "Keterangan", alias: ["ket", "notes"] },
];

/** Pilihan katalog untuk mencocokkan nilai teks pada berkas. */
export interface KatalogImpor {
  religions: readonly { id: number; name: string }[];
  educations: readonly { id: number; name: string }[];
  occupations: readonly { id: number; name: string }[];
  maritalStatuses: readonly { id: number; name: string }[];
  familyRelations: readonly { id: number; name: string }[];
  bloodTypes: readonly { id: number; name: string }[];
  citizenships: readonly { id: number; name: string }[];
  /** Nomor KK desa ini beserta id-nya. */
  families: readonly { id: number; number: string }[];
}

/** Satu baris yang lolos validasi dan siap disimpan. */
interface BarisSiapImporPenduduk {
  /** Nomor baris data (1 = baris pertama di bawah header). */
  baris: number;
  input: PendudukFormInput;
  /** Wilayah dari kolom dusun/RW/RT; diselesaikan menjadi `regionId` oleh use case. */
  wilayah: { dusun: string; rw: string; rt: string } | null;
}

/** Hasil validasi seluruh berkas. */
interface HasilValidasiImporPenduduk {
  siap: BarisSiapImporPenduduk[];
  galat: { baris: number; pesan: string }[];
  /** Header berkas yang tidak dikenali. */
  headerTakDikenal: string[];
}

/** Normalisasi nama untuk pencocokan katalog/header. */
function normal(nilai: string): string {
  return nilai.normalize("NFKD").replace(/\s+/g, " ").trim().toUpperCase();
}

/** Hanya angka (untuk NIK, NIK orang tua, dan nomor KK). */
function hanyaAngka(nilai: string): string {
  return nilai.replace(/[^0-9]/g, "");
}

/** Ubah tanggal `dd-mm-yyyy`, `dd/mm/yyyy`, atau `yyyy-mm-dd` menjadi ISO. */
export function normalisasiTanggal(nilai: string): string {
  const teks = nilai.trim();
  if (teks === "") return "";

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(teks);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const lokal = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(teks);
  if (lokal) {
    const hari = lokal[1]!.padStart(2, "0");
    const bulan = lokal[2]!.padStart(2, "0");
    return `${lokal[3]}-${bulan}-${hari}`;
  }

  return teks;
}

/** Terima `L`, `LAKI-LAKI`, `PRIA`, `MALE`, kode 1/2, dan padanannya. */
export function normalisasiJenisKelamin(nilai: string): "male" | "female" | null {
  const teks = normal(nilai);
  if (["1", "L", "LAKI-LAKI", "LAKI LAKI", "PRIA", "MALE", "M"].includes(teks)) return "male";
  if (["2", "P", "PEREMPUAN", "WANITA", "FEMALE", "F"].includes(teks)) return "female";
  return null;
}

/** Terima status dasar ekspor data desa maupun nilai internal. */
function normalisasiStatusPenduduk(nilai: string): PendudukFormInput["lifeStatus"] | null {
  const teks = normal(nilai);
  const peta: Record<string, PendudukFormInput["lifeStatus"]> = {
    "": "alive",
    "1": "alive",
    "2": "deceased",
    "3": "moved",
    "4": "missing",
    "6": "departed",
    "9": "invalid",
    HIDUP: "alive",
    ALIVE: "alive",
    MATI: "deceased",
    MENINGGAL: "deceased",
    DECEASED: "deceased",
    PINDAH: "moved",
    MOVED: "moved",
    HILANG: "missing",
    MISSING: "missing",
    PERGI: "departed",
    DEPARTED: "departed",
    "TIDAK VALID": "invalid",
    INVALID: "invalid",
  };
  return peta[teks] ?? null;
}

/** Cocokkan nilai enum dari kode angka, nilai internal, atau label ekspor. */
function cocokEnum<T extends string>(
  nilai: string,
  kode: Readonly<Record<string, T>>,
  nilaiValid: readonly T[],
  label: Readonly<Record<T, string>>,
): T | null {
  const teks = normal(nilai);
  if (teks === "") return null;
  if (kode[teks]) return kode[teks]!;
  for (const value of nilaiValid) if (normal(value) === teks) return value;
  for (const value of nilaiValid) if (normal(label[value]) === teks) return value;
  return null;
}

/** Status kepemilikan identitas: kode 1/2/3 atau labelnya. */
export function normalisasiKtpEl(nilai: string): PendudukFormInput["ktpEl"] {
  return cocokEnum(
    nilai,
    { "1": "belum", "2": "ktpEl", "3": "kia" } as const,
    KTP_ELS,
    KTP_EL_LABELS,
  );
}

/** Status rekam KTP: kode 1–8 atau labelnya. */
export function normalisasiStatusRekam(nilai: string): PendudukFormInput["statusRekam"] {
  return cocokEnum(
    nilai,
    {
      "1": "belumWajib",
      "2": "belumRekam",
      "3": "sudahRekam",
      "4": "cardPrinted",
      "5": "printReadyRecord",
      "6": "cardShipped",
      "7": "sentForCardPrinting",
      "8": "cardIssued",
    } as const,
    STATUS_REKAMS,
    STATUS_REKAM_LABELS,
  );
}

/** Disabilitas: kode 1–7 atau labelnya. */
export function normalisasiDisabilitas(nilai: string): PendudukFormInput["disability"] {
  return cocokEnum(
    nilai,
    {
      "1": "physical",
      "2": "blind",
      "3": "deafSpeech",
      "4": "mental",
      "5": "physicalMental",
      "6": "other",
      "7": "none",
    } as const,
    DISABILITIES,
    DISABILITY_LABELS,
  );
}

/** Cara KB: kode 1–7, 99, 100 atau labelnya. */
export function normalisasiCaraKb(nilai: string): PendudukFormInput["kbMethod"] {
  return cocokEnum(
    nilai,
    {
      "1": "pill",
      "2": "iud",
      "3": "injection",
      "4": "condom",
      "5": "implant",
      "6": "femaleSterilization",
      "7": "maleSterilization",
      "99": "other",
      "100": "none",
    } as const,
    KB_METHODS,
    KB_METHOD_LABELS,
  );
}

/** Status kehamilan: kode 1/2 atau labelnya. */
export function normalisasiStatusHamil(nilai: string): PendudukFormInput["pregnancyStatus"] {
  return cocokEnum(
    nilai,
    { "1": "pregnant", "2": "notPregnant" } as const,
    PREGNANCY_STATUSES,
    PREGNANCY_STATUS_LABELS,
  );
}

/** Asuransi: kode 1–4, 99 atau labelnya. */
export function normalisasiAsuransi(nilai: string): PendudukFormInput["insurance"] {
  return cocokEnum(
    nilai,
    {
      "1": "none",
      "2": "bpjsPbi",
      "3": "bpjsNonPbi",
      "4": "bpjsRegional",
      "99": "other",
    } as const,
    INSURANCES,
    INSURANCE_LABELS,
  );
}

/** Terima status tempat tinggal tetap/tidak tetap. */
function normalisasiStatusTinggal(
  nilai: string,
): PendudukFormInput["residenceStatus"] | null {
  const teks = normal(nilai);
  if (teks === "" || ["TETAP", "PERMANEN", "PERMANENT"].includes(teks)) return "permanent";
  if (["TIDAK TETAP", "NON PERMANEN", "SEMENTARA", "TEMPORARY"].includes(teks)) return "temporary";
  return null;
}

/**
 * Cocokkan teks katalog ke id.
 *
 * Nilai angka yang kebetulan sama dengan id juga diterima agar berkas hasil
 * ekspor FlexiDesa sendiri bisa diimpor ulang. Kecocokan nama diutamakan.
 */
function cocokKatalog(nilai: string, opsi: readonly { id: number; name: string }[]): number | null {
  const teks = nilai.trim();
  if (teks === "") return null;

  const nama = normal(teks);
  const berdasarNama = opsi.find((item) => normal(item.name) === nama);
  if (berdasarNama) return berdasarNama.id;

  if (/^\d+$/.test(teks)) {
    const id = Number(teks);
    const berdasarId = opsi.find((item) => item.id === id);
    if (berdasarId) return berdasarId.id;
  }

  return null;
}

/** Daftar nama katalog untuk pesan galat yang membantu pengguna. */
function daftarNama(opsi: readonly { id: number; name: string }[]): string {
  return opsi.map((item) => item.name).join(", ");
}

interface KonteksValidasi {
  katalog: KatalogImpor;
  /** NIK yang sudah ada di desa ini (dicek use case sebelum validasi). */
  nikTerdaftar: ReadonlySet<string>;
  /** Nomor KK desa ini yang sudah punya kepala keluarga. */
  kkSudahAdaKepala: ReadonlySet<number>;
}

/**
 * Validasi seluruh baris impor dan petakan ke input formulir penduduk.
 *
 * Semua baris harus valid sebelum impor dijalankan (all-or-nothing) agar desa
 * tidak menerima data setengah jadi ketika satu baris bermasalah.
 */
export function validasiImporPenduduk(
  baris: readonly BarisImpor<KunciImporPenduduk>[],
  konteks: KonteksValidasi,
): HasilValidasiImporPenduduk {
  const { katalog } = konteks;
  const galat: { baris: number; pesan: string }[] = [];
  const siap: BarisSiapImporPenduduk[] = [];
  const nikTerlihat = new Set<string>();
  const kepalaPerKk = new Map<number, number>();

  const kkByNumber = new Map(katalog.families.map((item) => [hanyaAngka(item.number), item.id]));

  const kepalaRelationId =
    katalog.familyRelations.find((item) => normal(item.name) === "KEPALA KELUARGA")?.id ?? 1;

  for (const row of baris) {
    const pesan: string[] = [];
    const v = row.nilai;

    const nik = hanyaAngka(v.nik);
    if (nik !== "" && nikTerlihat.has(nik)) pesan.push(`NIK ${nik} duplikat di dalam berkas.`);
    if (nik !== "" && konteks.nikTerdaftar.has(nik)) pesan.push(`NIK ${nik} sudah terdaftar.`);
    if (nik !== "") nikTerlihat.add(nik);

    const gender = normalisasiJenisKelamin(v.jenisKelamin);
    if (!gender) pesan.push(`Jenis kelamin "${v.jenisKelamin}" tidak dikenal (L/P).`);

    const kkNumber = hanyaAngka(v.noKk);
    const familyId = kkNumber === "" ? null : (kkByNumber.get(kkNumber) ?? null);
    if (kkNumber !== "" && familyId === null) {
      pesan.push(`Nomor KK ${kkNumber} tidak ditemukan di desa ini.`);
    }

    const agamaId = cocokKatalog(v.agama, katalog.religions);
    if (v.agama.trim() !== "" && agamaId === null) {
      pesan.push(`Agama "${v.agama}" tidak dikenal (${daftarNama(katalog.religions)}).`);
    }

    const pendidikanId = cocokKatalog(v.pendidikan, katalog.educations);
    if (v.pendidikan.trim() !== "" && pendidikanId === null) {
      pesan.push(`Pendidikan "${v.pendidikan}" tidak dikenal.`);
    }

    const pendidikanSedangId = cocokKatalog(v.pendidikanSedang, katalog.educations);
    if (v.pendidikanSedang.trim() !== "" && pendidikanSedangId === null) {
      pesan.push(`Pendidikan sedang ditempuh "${v.pendidikanSedang}" tidak dikenal.`);
    }

    const pekerjaanId = cocokKatalog(v.pekerjaan, katalog.occupations);
    if (v.pekerjaan.trim() !== "" && pekerjaanId === null) {
      pesan.push(`Pekerjaan "${v.pekerjaan}" tidak dikenal.`);
    }

    const statusKawinId = cocokKatalog(v.statusKawin, katalog.maritalStatuses);
    if (v.statusKawin.trim() !== "" && statusKawinId === null) {
      pesan.push(`Status kawin "${v.statusKawin}" tidak dikenal.`);
    }

    const hubunganId = cocokKatalog(v.hubunganKeluarga, katalog.familyRelations);
    if (v.hubunganKeluarga.trim() !== "" && hubunganId === null) {
      pesan.push(`Hubungan dalam keluarga "${v.hubunganKeluarga}" tidak dikenal.`);
    }

    const darahId = cocokKatalog(v.golonganDarah, katalog.bloodTypes);
    if (v.golonganDarah.trim() !== "" && darahId === null) {
      pesan.push(`Golongan darah "${v.golonganDarah}" tidak dikenal.`);
    }

    const wargaId = cocokKatalog(v.kewarganegaraan, katalog.citizenships);
    if (v.kewarganegaraan.trim() !== "" && wargaId === null) {
      pesan.push(`Kewarganegaraan "${v.kewarganegaraan}" tidak dikenal.`);
    }

    const statusPenduduk = normalisasiStatusPenduduk(v.statusPenduduk);
    if (statusPenduduk === null) {
      pesan.push(`Status penduduk "${v.statusPenduduk}" tidak dikenal.`);
    }

    const statusTinggal = normalisasiStatusTinggal(v.statusTinggal);
    if (statusTinggal === null) {
      pesan.push(`Status tempat tinggal "${v.statusTinggal}" tidak dikenal.`);
    }

    const ktpEl = normalisasiKtpEl(v.ktpEl);
    if (v.ktpEl.trim() !== "" && ktpEl === null) {
      pesan.push(`Status kepemilikan identitas "${v.ktpEl}" tidak dikenal.`);
    }

    const statusRekam = normalisasiStatusRekam(v.statusRekam);
    if (v.statusRekam.trim() !== "" && statusRekam === null) {
      pesan.push(`Status rekam KTP "${v.statusRekam}" tidak dikenal.`);
    }

    const disabilitas = normalisasiDisabilitas(v.cacat);
    if (v.cacat.trim() !== "" && disabilitas === null) {
      pesan.push(`Disabilitas "${v.cacat}" tidak dikenal.`);
    }

    const caraKb = normalisasiCaraKb(v.caraKb);
    if (v.caraKb.trim() !== "" && caraKb === null) {
      pesan.push(`Cara KB "${v.caraKb}" tidak dikenal.`);
    }

    const statusHamil = normalisasiStatusHamil(v.hamil);
    if (v.hamil.trim() !== "" && statusHamil === null) {
      pesan.push(`Status kehamilan "${v.hamil}" tidak dikenal.`);
    }

    const asuransi = normalisasiAsuransi(v.asuransi);
    if (v.asuransi.trim() !== "" && asuransi === null) {
      pesan.push(`Asuransi "${v.asuransi}" tidak dikenal.`);
    }

    const dusun = v.dusun.trim();
    const rw = v.rw.trim();
    const rt = v.rt.trim();
    if (dusun === "" && (rw !== "" || rt !== "")) {
      pesan.push("Dusun wajib diisi bila RW atau RT diisi.");
    }
    if (dusun.length > 100) pesan.push("Nama dusun maksimal 100 karakter.");
    if (rw.length > 10) pesan.push("RW maksimal 10 karakter.");
    if (rt.length > 10) pesan.push("RT maksimal 10 karakter.");
    const wilayah = dusun === "" ? null : { dusun, rw, rt };

    const latitude = v.latitude.trim();
    const longitude = v.longitude.trim();
    if ((latitude === "") !== (longitude === "")) {
      pesan.push("Latitude dan longitude harus diisi berpasangan.");
    }
    if (
      latitude !== "" &&
      (!Number.isFinite(Number(latitude)) || Math.abs(Number(latitude)) > 90)
    ) {
      pesan.push(`Latitude "${latitude}" harus berupa angka antara -90 dan 90.`);
    }
    if (
      longitude !== "" &&
      (!Number.isFinite(Number(longitude)) || Math.abs(Number(longitude)) > 180)
    ) {
      pesan.push(`Longitude "${longitude}" harus berupa angka antara -180 dan 180.`);
    }

    if (familyId !== null && hubunganId === kepalaRelationId) {
      const sebelumnya = kepalaPerKk.get(familyId) ?? 0;
      kepalaPerKk.set(familyId, sebelumnya + 1);
      if (sebelumnya > 0) pesan.push("KK yang sama memiliki lebih dari satu kepala keluarga.");
      if (konteks.kkSudahAdaKepala.has(familyId)) {
        pesan.push("KK tersebut sudah memiliki kepala keluarga terdaftar.");
      }
    }

    const input = {
      nationalId: nik,
      familyId,
      name: v.nama.trim(),
      gender: gender ?? "",
      birthPlace: v.tempatLahir.trim(),
      birthDate: normalisasiTanggal(v.tanggalLahir),
      religionId: agamaId === null ? null : String(agamaId),
      educationId: pendidikanId === null ? null : String(pendidikanId),
      educationSedangId: pendidikanSedangId === null ? null : String(pendidikanSedangId),
      occupationId: pekerjaanId === null ? null : String(pekerjaanId),
      maritalStatusId: statusKawinId === null ? null : String(statusKawinId),
      familyRelationId: hubunganId === null ? null : String(hubunganId),
      bloodTypeId: darahId === null ? null : String(darahId),
      citizenshipId: wargaId === null ? null : String(wargaId),
      residenceStatus: statusTinggal ?? "",
      lifeStatus: statusPenduduk ?? "",
      regionId: null,
      address: v.alamat.trim(),
      currentAddress: v.alamatSekarang.trim(),
      latitude,
      longitude,
      ktpEl,
      statusRekam,
      idCardTag: v.tagIdCard.trim(),
      disability: disabilitas,
      kbMethod: caraKb,
      pregnancyStatus: statusHamil,
      insurance: asuransi,
      insuranceNumber: v.noAsuransi.trim(),
      phone: v.telepon.trim(),
      fatherName: v.namaAyah.trim(),
      motherName: v.namaIbu.trim(),
      fatherNationalId: hanyaAngka(v.nikAyah),
      motherNationalId: hanyaAngka(v.nikIbu),
      birthCertificateNumber: v.aktaLahir.trim(),
      marriageCertificateNumber: v.aktaKawin.trim(),
      marriageDate: normalisasiTanggal(v.tanggalKawin),
      divorceCertificateNumber: v.aktaCerai.trim(),
      divorceDate: normalisasiTanggal(v.tanggalCerai),
      passportNumber: v.paspor.trim(),
      passportExpiryDate: normalisasiTanggal(v.masaBerlakuPaspor),
      kitasNumber: v.kitas.trim(),
      ethnicity: v.suku.trim(),
      notes: v.keterangan.trim(),
    };

    if (pesan.length === 0) {
      const hasil = pendudukFormSchema.safeParse(input);
      if (!hasil.success) {
        for (const issue of hasil.error.issues) {
          pesan.push(`${issue.path.join(".") || "data"}: ${issue.message}`);
        }
      } else {
        siap.push({ baris: row.baris, input: hasil.data, wilayah });
        continue;
      }
    }

    galat.push({ baris: row.baris, pesan: pesan.join(" ") });
  }

  return { siap, galat, headerTakDikenal: [] };
}

/** Baca berkas lalu petakan kolomnya ke kunci impor penduduk. */
export async function bacaBerkasImporPenduduk(
  isi: Buffer,
  namaBerkas: string,
): Promise<{
  baris: BarisImpor<KunciImporPenduduk>[];
  galat: { baris: number; pesan: string }[];
  headerTakDikenal: string[];
}> {
  const tabel = await bacaTabelImpor(isi, namaBerkas);
  const hasil = petakanKolom(tabel, KOLOM_IMPOR_PENDUDUK);

  if (hasil.baris.length > MAKS_BARIS_IMPOR_PENDUDUK) {
    return {
      baris: [],
      galat: [
        {
          baris: 0,
          pesan: `Maksimal ${MAKS_BARIS_IMPOR_PENDUDUK} baris per berkas. Pecah berkas menjadi beberapa bagian.`,
        },
      ],
      headerTakDikenal: hasil.headerTakDikenal,
    };
  }

  return {
    baris: hasil.baris,
    galat: hasil.galat,
    headerTakDikenal: hasil.headerTakDikenal,
  };
}

/** Template Excel kosong berisi header dan contoh nilai katalog. */
export async function buatTemplateImporPenduduk(katalog: KatalogImpor): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Penduduk");

  sheet.columns = KOLOM_IMPOR_PENDUDUK.map((kolom) => ({
    header: kolom.label,
    key: kolom.kunci,
    width: Math.max(14, kolom.label.length + 4),
  }));
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const petunjuk = workbook.addWorksheet("Petunjuk");
  petunjuk.columns = [
    { header: "Kolom", key: "kolom", width: 32 },
    { header: "Wajib", key: "wajib", width: 8 },
    { header: "Nilai yang diterima", key: "nilai", width: 90 },
  ];
  petunjuk.getRow(1).font = { bold: true };

  const nilaiKatalog = (opsi: readonly { name: string }[]) =>
    opsi.map((item) => item.name).join(", ");

  for (const kolom of KOLOM_IMPOR_PENDUDUK) {
    let nilai = "Teks bebas";
    if (kolom.kunci === "jenisKelamin") nilai = "L / P (atau Laki-laki / Perempuan)";
    if (
      ["tanggalLahir", "tanggalKawin", "tanggalCerai", "masaBerlakuPaspor"].includes(kolom.kunci)
    ) {
      nilai = "dd-mm-yyyy atau yyyy-mm-dd";
    }
    if (kolom.kunci === "agama") nilai = nilaiKatalog(katalog.religions);
    if (kolom.kunci === "pendidikan" || kolom.kunci === "pendidikanSedang") {
      nilai = nilaiKatalog(katalog.educations);
    }
    if (kolom.kunci === "pekerjaan") nilai = nilaiKatalog(katalog.occupations);
    if (kolom.kunci === "statusKawin") nilai = nilaiKatalog(katalog.maritalStatuses);
    if (kolom.kunci === "hubunganKeluarga") nilai = nilaiKatalog(katalog.familyRelations);
    if (kolom.kunci === "golonganDarah") nilai = nilaiKatalog(katalog.bloodTypes);
    if (kolom.kunci === "kewarganegaraan") nilai = nilaiKatalog(katalog.citizenships);
    if (kolom.kunci === "statusPenduduk") {
      nilai = "Hidup, Mati, Pindah, Hilang, Pergi, Tidak Valid (kosong = Hidup)";
    }
    if (kolom.kunci === "statusTinggal") nilai = "Tetap, Tidak Tetap (kosong = Tetap)";
    if (kolom.kunci === "noKk") nilai = "Nomor KK yang sudah terdaftar di desa ini";
    if (kolom.kunci === "dusun") {
      nilai = "Nama dusun; wilayah dusun/RW/RT dibuat otomatis bila belum ada";
    }
    if (kolom.kunci === "rw" || kolom.kunci === "rt") {
      nilai = "Boleh kosong; dusun wajib diisi bila RW/RT diisi";
    }
    if (kolom.kunci === "latitude") nilai = "Angka -90 s.d. 90; isi berpasangan dengan longitude";
    if (kolom.kunci === "longitude") {
      nilai = "Angka -180 s.d. 180; isi berpasangan dengan latitude";
    }
    if (kolom.kunci === "ktpEl") nilai = "Belum, KTP-EL, KIA (atau kode 1/2/3)";
    if (kolom.kunci === "statusRekam") {
      nilai = `${Object.values(STATUS_REKAM_LABELS).join(", ")} (atau kode 1–8)`;
    }
    if (kolom.kunci === "cacat") {
      nilai = `${Object.values(DISABILITY_LABELS).join(", ")} (atau kode 1–7)`;
    }
    if (kolom.kunci === "caraKb") {
      nilai = `${Object.values(KB_METHOD_LABELS).join(", ")} (atau kode 1–7, 99, 100)`;
    }
    if (kolom.kunci === "hamil") nilai = "Hamil, Tidak Hamil (atau kode 1/2)";
    if (kolom.kunci === "asuransi") {
      nilai = `${Object.values(INSURANCE_LABELS).join(", ")} (atau kode 1–4, 99)`;
    }
    if (kolom.kunci === "tagIdCard") nilai = "10–17 angka";

    petunjuk.addRow({ kolom: kolom.label, wajib: kolom.wajib ? "Ya" : "", nilai });
  }
  petunjuk.addRow({
    kolom: "Sheet Contoh",
    wajib: "",
    nilai:
      "Contoh satu baris lengkap. Salin formatnya ke sheet Penduduk; sheet Contoh tidak ikut diimpor.",
  });

  // Sheet terpisah agar contoh tidak pernah ikut terbaca sebagai data impor
  // (impor hanya membaca sheet pertama, "Penduduk").
  const contoh = workbook.addWorksheet("Contoh");
  contoh.columns = KOLOM_IMPOR_PENDUDUK.map((kolom) => ({
    header: kolom.label,
    key: kolom.kunci,
    width: Math.max(14, kolom.label.length + 4),
  }));
  contoh.getRow(1).font = { bold: true };
  contoh.views = [{ state: "frozen", ySplit: 1 }];
  contoh.addRow({
    nik: "3201010101010001",
    nama: "Contoh Penduduk",
    jenisKelamin: "L",
    tempatLahir: "Contoh Kota",
    tanggalLahir: "1990-01-01",
    agama: katalog.religions[0]?.name ?? "Islam",
    pendidikan: katalog.educations[0]?.name ?? "SLTA/Sederajat",
    pekerjaan: katalog.occupations[0]?.name ?? "Petani",
    statusKawin: katalog.maritalStatuses[0]?.name ?? "Belum Kawin",
    hubunganKeluarga: "Kepala Keluarga",
    golonganDarah: katalog.bloodTypes[0]?.name ?? "O",
    kewarganegaraan: katalog.citizenships[0]?.name ?? "Warga Negara Indonesia",
    noKk: katalog.families[0]?.number ?? "3201010101010001",
    dusun: "Dusun Contoh",
    rw: "01",
    rt: "02",
    alamat: "Jl. Contoh No. 1",
    alamatSekarang: "Jl. Contoh No. 1",
    telepon: "081234567890",
    nikAyah: "3201010101010002",
    namaAyah: "Ayah Contoh",
    nikIbu: "3201010101010003",
    namaIbu: "Ibu Contoh",
    aktaLahir: "AK-0001",
    ktpEl: "KTP-EL",
    statusRekam: "Sudah Rekam",
    tagIdCard: "1234567890",
    cacat: "Tidak Cacat",
    caraKb: "Tidak Menggunakan",
    hamil: "Tidak Hamil",
    asuransi: "Tidak/Belum Punya",
    statusPenduduk: "Hidup",
    statusTinggal: "Tetap",
    suku: "Contoh",
    latitude: "-6.200000",
    longitude: "106.816666",
    keterangan: "Baris contoh; jangan diimpor apa adanya.",
  });
  contoh.getRow(2).font = { italic: true, color: { argb: "FF6B7280" } };

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

/** Saran nama berkas template. */
export function namaBerkasTemplatePenduduk(): string {
  return "Template-Impor-Penduduk.xlsx";
}
