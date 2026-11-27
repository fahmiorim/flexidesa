import type { SurfaceKey, ThemePageProps } from "../../types";

/**
 * Renderer per surface untuk paket `esensi@1.0.0` (kompatibilitas token).
 *
 * Mempertahankan susunan halaman bersama yang sudah ada; setiap surface
 * dibungkus section netral bertanda `data-surface` agar test/CI dapat
 * membuktikan paket ini menyediakan renderer untuk semua surface wajib.
 */
function Permukaan({ surface, children }: ThemePageProps & { surface: SurfaceKey }) {
  return <section data-surface={surface}>{children}</section>;
}

export function BerandaEsensi(props: ThemePageProps) {
  return <Permukaan {...props} surface="beranda" />;
}
export function ProfilEsensi(props: ThemePageProps) {
  return <Permukaan {...props} surface="profil" />;
}
export function KontenEsensi(props: ThemePageProps) {
  return <Permukaan {...props} surface="konten" />;
}
export function DataEsensi(props: ThemePageProps) {
  return <Permukaan {...props} surface="data" />;
}
export function MediaEsensi(props: ThemePageProps) {
  return <Permukaan {...props} surface="media" />;
}
export function LayananEsensi(props: ThemePageProps) {
  return <Permukaan {...props} surface="layanan" />;
}

export const halamanEsensi: Record<SurfaceKey, (props: ThemePageProps) => React.ReactNode> = {
  beranda: BerandaEsensi,
  profil: ProfilEsensi,
  konten: KontenEsensi,
  data: DataEsensi,
  media: MediaEsensi,
  layanan: LayananEsensi,
};
