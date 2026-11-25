/**
 * Kesalahan aplikasi yang bertipe.
 *
 * Alasan memakai kelas ini (bukan melempar `Error` polos):
 * - pemanggil bisa membedakan kesalahan yang "diharapkan" (validasi, akses
 *   ditolak) dari bug tak terduga;
 * - pesan aman untuk ditampilkan ke pengguna terpisah dari detail internal;
 * - kode kesalahan dapat dipetakan ke status HTTP secara terpusat.
 */
export type AppErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL";

const DEFAULT_MESSAGES: Record<AppErrorCode, string> = {
  UNAUTHENTICATED: "Sesi Anda telah berakhir. Silakan masuk kembali.",
  FORBIDDEN: "Anda tidak memiliki hak akses untuk tindakan ini.",
  NOT_FOUND: "Data yang diminta tidak ditemukan.",
  VALIDATION: "Data yang dikirim tidak valid.",
  CONFLICT: "Data bertentangan dengan data yang sudah ada.",
  RATE_LIMITED: "Terlalu banyak permintaan. Coba lagi beberapa saat.",
  INTERNAL: "Terjadi kesalahan pada server.",
};

export class AppError extends Error {
  readonly code: AppErrorCode;

  /** Detail tambahan yang aman untuk pengguna (mis. peta kesalahan field). */
  readonly details?: Record<string, unknown>;

  constructor(
    code: AppErrorCode,
    message?: string,
    options?: { cause?: unknown; details?: Record<string, unknown> },
  ) {
    super(message ?? DEFAULT_MESSAGES[code], { cause: options?.cause });
    this.name = "AppError";
    this.code = code;
    this.details = options?.details;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * True bila error adalah pelanggaran unique key dari MySQL (`ER_DUP_ENTRY`).
 *
 * Pemeriksaan "sudah dipakai" sebelum insert (check-then-insert) tidak dapat
 * menutup celah bersamaan: dua request dapat sama-sama lolos pemeriksaan
 * lalu salah satu menabrak unique index. Tangkap kondisi ini dan petakan ke
 * `conflict()` agar pengguna menerima 409, bukan error 500 mentah.
 */
export function isDuplicateKeyError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const penyebab = (error as { cause?: unknown }).cause ?? error;
  if (typeof penyebab !== "object" || penyebab === null) return false;
  const kode = (penyebab as { code?: unknown }).code;
  const errno = (penyebab as { errno?: unknown }).errno;
  return kode === "ER_DUP_ENTRY" || errno === 1062;
}

/** Status HTTP yang sesuai untuk tiap kode kesalahan. */
export function appErrorStatus(code: AppErrorCode): number {
  switch (code) {
    case "UNAUTHENTICATED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "VALIDATION":
      return 422;
    case "CONFLICT":
      return 409;
    case "RATE_LIMITED":
      return 429;
    case "INTERNAL":
      return 500;
  }
}

// --- Pabrik kesalahan ringkas ---------------------------------------------

export const unauthenticated = (message?: string) => new AppError("UNAUTHENTICATED", message);
export const forbidden = (message?: string) => new AppError("FORBIDDEN", message);
export const notFound = (message?: string) => new AppError("NOT_FOUND", message);
export const conflict = (message?: string) => new AppError("CONFLICT", message);

export const validationError = (
  message?: string,
  details?: Record<string, unknown>,
  cause?: unknown,
) => new AppError("VALIDATION", message, { details, cause });
