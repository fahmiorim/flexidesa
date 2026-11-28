import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";

/**
 * Domain Rekapitulasi Kehadiran.
 *
 * Daftar catatan kehadiran perangkat dengan filter rentang tanggal,
 * perangkat, dan status, plus kolom Total Waktu (selisih jam keluar −
 * jam masuk).
 */

/** Slug modul sekaligus resource izin (lihat template tenant). */
export const REKAPITULASI_KEHADIRAN_RESOURCE = RESOURCES.rekapitulasiKehadiran;

/** Filter daftar rekapitulasi. */
export interface FilterRekapitulasi {
  /** Tanggal awal `YYYY-MM-DD`, `null` berarti tanpa batas bawah. */
  dari: string | null;
  /** Tanggal akhir `YYYY-MM-DD`, `null` berarti tanpa batas atas. */
  sampai: string | null;
  perangkatId: number | null;
  /** Status mentah dari catatan kehadiran; `null` berarti semua status. */
  status: string | null;
}

const TANGGAL_ISO = /^\d{4}-\d{2}-\d{2}$/;

function tanggalValid(nilai: string | null): string | null {
  if (!nilai || !TANGGAL_ISO.test(nilai)) return null;
  const parsed = new Date(`${nilai}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : nilai;
}

/**
 * Baca filter dari query string.
 *
 * Nilai yang tidak valid diabaikan (menjadi `null`) agar halaman tetap tampil
 * alih-alih gagal; berbeda dari ekspor yang menolak parameter rusak.
 */
export function bacaFilterRekapitulasi(params: {
  dari?: string | null;
  sampai?: string | null;
  perangkat?: string | null;
  status?: string | null;
}): FilterRekapitulasi {
  const perangkat = Number(params.perangkat);
  return {
    dari: tanggalValid(params.dari ?? null),
    sampai: tanggalValid(params.sampai ?? null),
    perangkatId: Number.isInteger(perangkat) && perangkat > 0 ? perangkat : null,
    status: params.status && params.status.trim() !== "" ? params.status.trim() : null,
  };
}

/** Selisih jam masuk–keluar dalam `HH:MM`. */
export function totalWaktu(jamMasuk: string | null, jamKeluar: string | null): string {
  if (!jamMasuk || !jamKeluar) return "-";

  const [masukJam, masukMenit] = jamMasuk.split(":").map(Number);
  const [keluarJam, keluarMenit] = jamKeluar.split(":").map(Number);
  if (
    masukJam === undefined ||
    masukMenit === undefined ||
    keluarJam === undefined ||
    keluarMenit === undefined ||
    [masukJam, masukMenit, keluarJam, keluarMenit].some((nilai) => Number.isNaN(nilai))
  ) {
    return "-";
  }

  let selisih = keluarJam * 60 + keluarMenit - (masukJam * 60 + masukMenit);
  // Lewat tengah malam: hitung sebagai hari berikutnya.
  if (selisih < 0) selisih += 24 * 60;

  const jam = Math.floor(selisih / 60);
  const menit = selisih % 60;
  return `${String(jam).padStart(2, "0")}:${String(menit).padStart(2, "0")}`;
}

/** Label status yang ditampilkan pada kolom Status. */
export function statusRekapitulasi(
  status: string | null,
  jamMasuk: string | null,
  jamKeluar: string | null,
): string {
  const bersih = (status ?? "").trim();
  if (bersih !== "") {
    return bersih.charAt(0).toUpperCase() + bersih.slice(1).replace(/_/g, " ");
  }

  // Status diturunkan dari jam saat kolom status kosong.
  if (jamMasuk && jamKeluar) return "Hadir";
  if (jamMasuk) return "Lupa melapor keluar";
  return "Belum ditentukan";
}

/** Satu baris rekapitulasi untuk tabel dan ekspor. */
export interface BarisRekapitulasi {
  id: number;
  nama: string;
  jabatan: string;
  /** Tanggal `YYYY-MM-DD`. */
  tanggal: string;
  /** Jam `HH:MM`, `null` bila belum tercatat. */
  jamMasuk: string | null;
  jamKeluar: string | null;
  totalWaktu: string;
  status: string;
}

/** Format tanggal Indonesia untuk tampilan (mis. `25 November 2026`). */
export function tanggalIndonesia(tanggal: string): string {
  const parsed = new Date(`${tanggal}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return tanggal;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

/** Judul kolom ekspor. */
export const JUDUL_EKSPOR_REKAPITULASI = [
  "Nama",
  "Jabatan",
  "Tanggal",
  "Jam Masuk",
  "Jam Keluar",
  "Total Waktu",
  "Status Kehadiran",
] as const;
