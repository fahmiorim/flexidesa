/**
 * Utilitas tanggal kepegawaian.
 *
 * Semua tanggal dihitung pada zona Asia/Jakarta agar absensi dan cuti tidak
 * bergeser mengikuti zona server.
 */

export function tanggalLokal(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

export function tahunLokal(): number {
  return Number(tanggalLokal().slice(0, 4));
}

export function tanggalValid(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + "T00:00:00Z");
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function hitungHariKerja(
  mulai: string,
  selesai: string,
  hariLibur: number[] = [0, 6],
): number {
  const [sy = 0, sm = 0, sd = 0] = mulai.split("-").map(Number);
  const [ey = 0, em = 0, ed = 0] = selesai.split("-").map(Number);
  const start = Date.UTC(sy, sm - 1, sd);
  const end = Date.UTC(ey, em - 1, ed);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start)
    throw new Error("Rentang tanggal tidak valid.");
  let total = 0;
  for (let day = start; day <= end; day += 86400000) {
    const weekday = new Date(day).getUTCDay();
    if (!hariLibur.includes(weekday)) total += 1;
  }
  return total;
}
