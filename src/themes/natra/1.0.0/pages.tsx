import type { SurfaceKey, ThemePageProps } from "../../types";
import styles from "./theme.module.css";

/**
 * Renderer per surface untuk paket `natra@1.0.0`.
 *
 * Konten dirender di dalam kolom konten bilah samping Natra; setiap surface
 * bertanda `data-surface` agar test/CI dapat membuktikan paket ini
 * menyediakan renderer untuk semua surface wajib.
 */
function Permukaan({ surface, children }: ThemePageProps & { surface: SurfaceKey }) {
  return (
    <section data-surface={surface} data-tema="natra" className={styles.konten}>
      {children}
    </section>
  );
}

export function BerandaNatra(props: ThemePageProps) {
  return <Permukaan {...props} surface="beranda" />;
}
export function ProfilNatra(props: ThemePageProps) {
  return <Permukaan {...props} surface="profil" />;
}
export function KontenNatra(props: ThemePageProps) {
  return <Permukaan {...props} surface="konten" />;
}
export function DataNatra(props: ThemePageProps) {
  return <Permukaan {...props} surface="data" />;
}
export function MediaNatra(props: ThemePageProps) {
  return <Permukaan {...props} surface="media" />;
}
export function LayananNatra(props: ThemePageProps) {
  return <Permukaan {...props} surface="layanan" />;
}

export const halamanNatra: Record<SurfaceKey, (props: ThemePageProps) => React.ReactNode> = {
  beranda: BerandaNatra,
  profil: ProfilNatra,
  konten: KontenNatra,
  data: DataNatra,
  media: MediaNatra,
  layanan: LayananNatra,
};
