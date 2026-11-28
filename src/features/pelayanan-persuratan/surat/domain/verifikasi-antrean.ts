import {
  nextVerificationStep,
  tahapanUntukRole,
  VERIFICATION_STEPS,
  type LetterStatus,
  type VerificationStep,
} from "./surat";

/**
 * Domain antrean Verifikasi Surat.
 *
 * Halaman ini dipakai sekretaris desa (tahap sekdes) dan kepala desa (tahap
 * kades) — juga operator — untuk melihat surat yang menunggu persetujuan
 * berjenjang. Urutan tahap tetap mengandalkan `nextVerificationStep`.
 */

/** Cakupan antrean: tahap pengguna, semua tahap, atau satu tahap tertentu. */
export type ScopeVerifikasi = "saya" | "semua" | VerificationStep;

/** Kolom minimal surat untuk menentukan tahap aktif. */
export interface SuratUntukVerifikasi {
  status: LetterStatus;
  verifikasiOperator: boolean | null;
  verifikasiSekdes: boolean | null;
  verifikasiKades: boolean | null;
}

/** Baris antrean lengkap dengan tahap aktif dan kewenangan pengguna. */
interface BarisAntreanVerifikasi<T extends SuratUntukVerifikasi> {
  surat: T;
  /** Tahap yang sedang menunggu; `null` bila tidak ada tahap aktif. */
  langkah: VerificationStep | null;
  /** Apakah role pengguna boleh menyetujui tahap aktif ini. */
  bolehVerifikasi: boolean;
}

export function susunAntreanVerifikasi<T extends SuratUntukVerifikasi>(
  rows: readonly T[],
  roleSlug: string | null,
  isSuperadmin: boolean,
): BarisAntreanVerifikasi<T>[] {
  const tahapPengguna = tahapanUntukRole(roleSlug, isSuperadmin);

  return rows
    .map((surat) => {
      const langkah = nextVerificationStep(surat);
      return {
        surat,
        langkah,
        bolehVerifikasi: langkah !== null && tahapPengguna.includes(langkah),
      };
    })
    .filter((item) => item.langkah !== null);
}

/** Saring antrean menurut cakupan yang dipilih pengguna. */
export function saringAntreanVerifikasi<T extends SuratUntukVerifikasi>(
  antrean: readonly BarisAntreanVerifikasi<T>[],
  scope: ScopeVerifikasi,
  roleSlug: string | null,
  isSuperadmin: boolean,
): BarisAntreanVerifikasi<T>[] {
  if (scope === "semua") return [...antrean];

  const tahapPengguna = tahapanUntukRole(roleSlug, isSuperadmin);
  const tahap = scope === "saya" ? tahapPengguna : [scope];

  return antrean.filter((item) => item.langkah !== null && tahap.includes(item.langkah));
}

/** Jumlah antrean pada setiap tahap (untuk kartu ringkasan). */
export function hitungAntreanPerTahap<T extends SuratUntukVerifikasi>(
  antrean: readonly BarisAntreanVerifikasi<T>[],
): Record<VerificationStep, number> {
  const hasil: Record<VerificationStep, number> = { operator: 0, sekdes: 0, kades: 0 };
  for (const item of antrean) {
    if (item.langkah !== null) hasil[item.langkah] += 1;
  }
  return hasil;
}

export { VERIFICATION_STEPS };
