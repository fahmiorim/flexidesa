/**
 * Konstanta tipe mutasi penduduk.
 *
 * Modul murni ini dipakai bersama oleh skema database dan domain penduduk agar
 * domain tidak perlu mengimpor `@/db` (batas lapisan antar-domain).
 */
export const RESIDENT_MUTATION_TYPES = [
  "birth",
  "death",
  "move_out",
  "move_in",
  "missing",
  "change",
] as const;

export type ResidentMutationType = (typeof RESIDENT_MUTATION_TYPES)[number];
export type MutationType = ResidentMutationType;

export const RESIDENT_MUTATION_TYPE_LABELS: Record<ResidentMutationType, string> = {
  birth: "Kelahiran",
  death: "Kematian",
  move_out: "Pindah Keluar",
  move_in: "Pindah Masuk/Datang",
  missing: "Hilang",
  change: "Perubahan Data",
};
