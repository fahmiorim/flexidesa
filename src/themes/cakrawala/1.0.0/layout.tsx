import type { ThemeLayoutProps } from "../../types";
import styles from "./theme.module.css";

/**
 * Paket `cakrawala@1.0.0` — terang-editorial berasas kertas.
 *
 * Halaman publik sudah merender header dan hero bersama yang membaca token
 * tema aktif, sehingga paket ini tidak merender header/hero kedua. Identitas
 * Cakrawala dibentuk lewat token terang (kertas gading, serif tajuk, aksen
 * bata, hijau botol penanda kedua) dan aturan `.tema` di
 * `theme.module.css`. Tidak ada bilah samping: konten mengalir dalam satu
 * kolom editorial selebar kertas.
 */
export default function CakrawalaLayout(props: ThemeLayoutProps) {
  return (
    <div className={styles.tema} data-tema="cakrawala" data-gaya={props.tema?.style ?? "terang"}>
      <section className={styles.konten}>{props.children}</section>
    </div>
  );
}
