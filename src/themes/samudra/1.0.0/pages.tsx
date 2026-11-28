import type { SurfaceKey, ThemePageProps } from "../../types";
import styles from "./theme.module.css";

/**
 * Renderer per surface untuk paket `samudra@1.0.0`.
 *
 * Beranda memakai komposisi sendiri: sambutan + statistik di atas, lalu dua
 * kolom — berita dan profil di kolom utama, akses cepat dan tautan terkait di
 * rel samping — dan banner IDM menutup halaman. Semua bagian tetap berasal
 * dari slot server yang sama, jadi tidak ada field yang hilang; hanya
 * susunannya yang berbeda. Bila slot tidak tersedia (pemanggil lama), paket
 * jatuh ke pembungkus netral.
 *
 * Surface lain memakai kolom terpusat agar teks mudah dibaca.
 */
function Permukaan({ surface, children }: ThemePageProps & { surface: SurfaceKey }) {
  return (
    <div
      data-surface={surface}
      data-tema="samudra"
      className={surface === "beranda" ? styles.permukaanLebar : styles.permukaan}
    >
      {children}
    </div>
  );
}

export function BerandaSamudra({ slots, children, ...props }: ThemePageProps) {
  if (!slots || Object.keys(slots).length === 0) {
    return (
      <Permukaan {...props} surface="beranda">
        {children}
      </Permukaan>
    );
  }
  return (
    <div data-surface="beranda" data-tema="samudra" className={styles.beranda}>
      {slots.sambutan ? <div className={styles.blokPenuh}>{slots.sambutan}</div> : null}
      <div className={styles.duaKolom}>
        <div className={styles.utama}>
          {slots.berita}
          {slots.profil}
        </div>
        <aside className={styles.sisi} aria-label="Akses cepat dan tautan terkait">
          {slots.akses}
          {slots.tautan}
        </aside>
      </div>
      {slots.idm ? <div className={styles.blokPenuh}>{slots.idm}</div> : null}
    </div>
  );
}

export function ProfilSamudra(props: ThemePageProps) {
  return <Permukaan {...props} surface="profil" />;
}
export function KontenSamudra(props: ThemePageProps) {
  return <Permukaan {...props} surface="konten" />;
}
export function DataSamudra(props: ThemePageProps) {
  return <Permukaan {...props} surface="data" />;
}
export function MediaSamudra(props: ThemePageProps) {
  return <Permukaan {...props} surface="media" />;
}
export function LayananSamudra(props: ThemePageProps) {
  return <Permukaan {...props} surface="layanan" />;
}

export const halamanSamudra: Record<SurfaceKey, (props: ThemePageProps) => React.ReactNode> = {
  beranda: BerandaSamudra,
  profil: ProfilSamudra,
  konten: KontenSamudra,
  data: DataSamudra,
  media: MediaSamudra,
  layanan: LayananSamudra,
};
