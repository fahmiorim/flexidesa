import type { SurfaceKey, ThemePageProps } from "../../types";

/**
 * Renderer per surface untuk paket `arunika@1.0.0` (kompatibilitas token).
 *
 * Mempertahankan susunan halaman bersama yang sudah ada; setiap surface
 * dibungkus section netral bertanda `data-surface` agar test/CI dapat
 * membuktikan paket ini menyediakan renderer untuk semua surface wajib.
 */
function Permukaan({ surface, children }: ThemePageProps & { surface: SurfaceKey }) {
  return <section data-surface={surface}>{children}</section>;
}

export function BerandaArunika(props: ThemePageProps) {
  return <Permukaan {...props} surface="beranda" />;
}
export function ProfilArunika(props: ThemePageProps) {
  return <Permukaan {...props} surface="profil" />;
}
export function KontenArunika(props: ThemePageProps) {
  return <Permukaan {...props} surface="konten" />;
}
export function DataArunika(props: ThemePageProps) {
  return <Permukaan {...props} surface="data" />;
}
export function MediaArunika(props: ThemePageProps) {
  return <Permukaan {...props} surface="media" />;
}
export function LayananArunika(props: ThemePageProps) {
  return <Permukaan {...props} surface="layanan" />;
}

export const halamanArunika: Record<SurfaceKey, (props: ThemePageProps) => React.ReactNode> = {
  beranda: BerandaArunika,
  profil: ProfilArunika,
  konten: KontenArunika,
  data: DataArunika,
  media: MediaArunika,
  layanan: LayananArunika,
};
