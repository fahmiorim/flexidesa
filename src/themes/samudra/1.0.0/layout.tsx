import type { ThemeLayoutProps } from "../../types";
import styles from "./theme.module.css";

/**
 * Paket `samudra@1.0.0`.
 *
 * Halaman publik sudah merender header dan hero bersama (`PublicSiteHeader`,
 * `HeroBeranda`) yang membaca token tema aktif. Paket ini karena itu tidak
 * merender header/hero kedua — sebelumnya muncul dua bilah dan dua hero.
 * Identitas Samudra dibentuk lewat token (hero gelap teal, permukaan gelap)
 * dan aturan `.tema` di `theme.module.css` yang memberi pemisah bagian dan
 * panel gelap pada konten bersama.
 */
export default function SamudraLayout(props: ThemeLayoutProps) {
  return (
    <div className={styles.tema} data-tema="samudra" data-gaya={props.tema?.style ?? "terang"}>
      <section className={styles.konten}>{props.children}</section>
    </div>
  );
}
