import type {
  BulananAnakRow,
  IbuHamilRow,
} from "@/features/kependudukan/kesehatan/domain/kesehatan";

/** Ringkasan KIA yang dibutuhkan tabel pemantauan. */
export interface KiaRingkas {
  noKia: string;
  ibuName: string | null;
  anakId: number | null;
}

/** Penduduk ringkas untuk kolom jenis kelamin dan tanggal lahir anak. */
export interface PendudukRingkas {
  id: number;
  name: string;
  gender: "male" | "female";
  birthDate: string | null;
}

/**
 * Label indikator konvergensi pencegahan stunting.
 *
 * Urutan dan istilah mengikuti form OpenSID
 * (`pemantauan_ibu_hamil_form.blade.php` dan `pemantauan_anak_form.blade.php`)
 * agar tabel pemantauan menampilkan indikator yang sama urutannya.
 */
export const INDIKATOR_IBU_HAMIL: Array<{ key: keyof IbuHamilRow; label: string }> = [
  { key: "pemeriksaanKehamilan", label: "Pemeriksaan Kehamilan" },
  { key: "konsumsiPilFe", label: "Dapat & Konsumsi Pil Fe" },
  { key: "pemeriksaanNifas", label: "Pemeriksaan Nifas" },
  { key: "konselingGizi", label: "Konseling Gizi (Kelas IH)" },
  { key: "kunjunganRumah", label: "Kunjungan Rumah" },
  { key: "aksesAirBersih", label: "Kepemilikan Akses Air Bersih" },
  { key: "kepemilikanJamban", label: "Kepemilikan Jamban" },
  { key: "jaminanKesehatan", label: "Jaminan Kesehatan" },
];

export const INDIKATOR_ANAK: Array<{ key: keyof BulananAnakRow; label: string }> = [
  { key: "pemberianImunisasiDasar", label: "Pemberian Imunisasi Dasar" },
  { key: "pengukuranBeratBadan", label: "Pengukuran Berat Badan" },
  { key: "pengukuranTinggiBadan", label: "Pengukuran Tinggi Badan" },
  { key: "konselingGiziAyah", label: "Konseling Gizi Ayah" },
  { key: "konselingGiziIbu", label: "Konseling Gizi Ibu" },
  { key: "kunjunganRumah", label: "Kunjungan Rumah" },
  { key: "airBersih", label: "Kepemilikan Akses Air Bersih" },
  { key: "kepemilikanJamban", label: "Kepemilikan Jamban Sehat" },
  { key: "aktaLahir", label: "Akta Lahir" },
  { key: "jaminanKesehatan", label: "Jaminan Kesehatan" },
  { key: "pengasuhanPaud", label: "Pengasuhan (PAUD)" },
];

const tanggal = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

/** Tanggal periksa dari kolom `created_at`; tampil "—" bila kosong. */
export function formatTanggal(nilai: Date | string | null | undefined): string {
  if (!nilai) return "—";
  const date = nilai instanceof Date ? nilai : new Date(nilai);
  return Number.isNaN(date.getTime()) ? "—" : tanggal.format(date);
}

/**
 * Tanggal periksa efektif: kolom isian operator bila ada, selain itu `created_at`.
 *
 * OpenSID menyimpan tanggal periksa di `created_at`; FlexiDesa menyediakan kolom
 * khusus agar operator boleh mengoreksi tanggal tanpa mengubah riwayat baris.
 */
export function tanggalPeriksaEfektif(
  tanggalPeriksa: string | null | undefined,
  createdAt: Date | string | null | undefined,
): Date | string | null | undefined {
  return tanggalPeriksa && tanggalPeriksa !== "" ? tanggalPeriksa : createdAt;
}

/** Tanggal lahir singkat (dd-mm-yyyy) untuk kolom tabel. */
export function formatTanggalLahir(nilai: string | null | undefined): string {
  if (!nilai) return "—";
  const date = new Date(`${nilai}T00:00:00Z`);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

/** Nama bulan Indonesia untuk pilihan filter periode. */
export const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

/** Tahun dari `created_at`, dipakai menyusun pilihan filter tahun. */
export function periodeTahun(nilai: Date | string | null | undefined): number | null {
  if (!nilai) return null;
  const date = nilai instanceof Date ? nilai : new Date(nilai);
  return Number.isNaN(date.getTime()) ? null : date.getFullYear();
}

/**
 * Cocokkan `created_at` dengan filter bulan/tahun.
 *
 * Tabel pemantauan FlexiDesa tidak menyimpan kolom periode terpisah seperti
 * OpenSID, jadi bulan/tahun periksa dibaca dari waktu pencatatan baris.
 */
export function cocokPeriode(
  nilai: Date | string | null | undefined,
  bulan: string,
  tahun: string,
): boolean {
  if (bulan === "" && tahun === "") return true;
  if (!nilai) return false;
  const date = nilai instanceof Date ? nilai : new Date(nilai);
  if (Number.isNaN(date.getTime())) return false;
  if (bulan !== "" && date.getMonth() + 1 !== Number(bulan)) return false;
  if (tahun !== "" && date.getFullYear() !== Number(tahun)) return false;
  return true;
}
