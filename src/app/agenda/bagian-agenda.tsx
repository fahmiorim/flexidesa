import type { agendaBulan } from "@/features/info-desa/agenda/application/agenda-use-cases";

export type AgendaItem = Awaited<ReturnType<typeof agendaBulan>>[number];

export const BULAN = [
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
];
export const KATEGORI = [
  "umum",
  "rapat",
  "sosialisasi",
  "keagamaan",
  "kesehatan",
  "lingkungan",
  "pelatihan",
  "pendidikan",
  "olahraga",
  "pemerintahan",
];

export function dateParts(value: string) {
  const [year = 1970, month = 1, day = 1] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return {
    day: new Intl.DateTimeFormat("id-ID", { day: "2-digit", timeZone: "UTC" }).format(date),
    month: new Intl.DateTimeFormat("id-ID", { month: "short", timeZone: "UTC" }).format(date),
    year,
  };
}
