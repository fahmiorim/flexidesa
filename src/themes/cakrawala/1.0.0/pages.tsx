import type { SurfaceKey, ThemePageProps } from "../../types";
import styles from "./theme.module.css";

/**
 * Renderer per surface untuk paket `cakrawala@1.0.0`.
 *
 * Beranda, hero, footer, dan profil memakai komponen native paket ini;
 * renderer di sini adalah pembungkus kolom editorial untuk surface lain
 * (konten, data, media, layanan) serta cadangan beranda/profil bila
 * komponen native tidak dipakai. Setiap surface bertanda `data-surface`
 * agar test/CI dapat membuktikan paket ini menyediakan renderer untuk
 * semua surface wajib.
 */
function Permukaan({ surface, children }: ThemePageProps & { surface: SurfaceKey }) {
  return (
    <section data-surface={surface} data-tema="cakrawala" className={styles.konten}>
      {children}
    </section>
  );
}

export function BerandaCakrawala(props: ThemePageProps) {
  return <Permukaan {...props} surface="beranda" />;
}
export function ProfilCakrawala(props: ThemePageProps) {
  return <Permukaan {...props} surface="profil" />;
}
export function KontenCakrawala(props: ThemePageProps) {
  return <Permukaan {...props} surface="konten" />;
}
export function DataCakrawala(props: ThemePageProps) {
  return <Permukaan {...props} surface="data" />;
}
export function MediaCakrawala(props: ThemePageProps) {
  return <Permukaan {...props} surface="media" />;
}
export function LayananCakrawala(props: ThemePageProps) {
  return <Permukaan {...props} surface="layanan" />;
}

export const halamanCakrawala: Record<SurfaceKey, (props: ThemePageProps) => React.ReactNode> = {
  beranda: BerandaCakrawala,
  profil: ProfilCakrawala,
  konten: KontenCakrawala,
  data: DataCakrawala,
  media: MediaCakrawala,
  layanan: LayananCakrawala,
};
