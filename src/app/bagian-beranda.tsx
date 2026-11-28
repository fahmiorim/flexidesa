import type { getIdentitasFromRequest } from "@/features/info-desa/desa/application/resolve-village";
import type { getStatistikDesa } from "@/features/info-desa/desa/application/statistik-desa";
import type {
  daftarBerita,
  daftarDokumenPublik,
  daftarPerangkatPublik,
} from "@/features/info-desa/publik/application/konten-publik";
import type { hitungRekapIdm } from "@/features/program-data-desa/idm/domain/idm";

export type DesaPublik = Awaited<ReturnType<typeof getIdentitasFromRequest>>;
export type StatistikDesa = Awaited<ReturnType<typeof getStatistikDesa>>;
export type PerangkatBeranda = Awaited<ReturnType<typeof daftarPerangkatPublik>>[number];
export type BeritaBeranda = Awaited<ReturnType<typeof daftarBerita>>[number];
export type PengumumanBeranda = Awaited<ReturnType<typeof daftarDokumenPublik>>[number];
export type RekapIdm = ReturnType<typeof hitungRekapIdm>;

export function cleanText(value: string | null | undefined, limit = 320): string {
  return (value ?? "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

export function dateLabel(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

export function namaLengkap(perangkat: PerangkatBeranda | undefined): string {
  if (!perangkat) return "";
  return [perangkat.gelarDepan, perangkat.nama, perangkat.gelarBelakang].filter(Boolean).join(" ");
}
