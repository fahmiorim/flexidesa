/**
 * Kebijakan impersonasi Super Admin.
 *
 * Keputusan yang disepakati:
 * - Pendekatan overlay pada sesi yang sama: sesi tetap milik super admin,
 *   identitas efektif diganti ke administrator desa target. Tidak ada
 *   penukaran cookie/token.
 * - Full mutasi: super admin dapat mengubah data desa seperti admin desa;
 *   audit mencatat super admin sebagai pelaku (`realActorId`).
 * - Hanya administrator desa (role `administrator`) yang dapat diimpersonasi.
 * - Batas keras 1 jam, tidak diperpanjang otomatis.
 *
 * Fungsi di sini murni (tanpa I/O) agar kebijakan dapat diuji tanpa database.
 */

/** Batas keras satu sesi impersonasi, dalam menit. */
export const DURASI_IMPERSONASI_MENIT = 60;

/** Batas keras satu sesi impersonasi, dalam milidetik. */
export const DURASI_IMPERSONASI_MS = DURASI_IMPERSONASI_MENIT * 60_000;

/** Kadaluarsa impersonasi dimulai dari `sekarang` (bawaan: waktu berjalan). */
export function kadaluarsaImpersonasi(sekarang: Date = new Date()): Date {
  return new Date(sekarang.getTime() + DURASI_IMPERSONASI_MS);
}

/** Apakah konteks impersonasi masih berlaku pada `sekarang`. */
export function impersonasiBerlaku(kadaluarsa: Date | null, sekarang: Date = new Date()): boolean {
  return kadaluarsa !== null && kadaluarsa > sekarang;
}
