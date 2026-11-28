import type { ThemeLayoutProps } from "../../types";
import styles from "./theme.module.css";

/**
 * Paket kompatibilitas `arunika@1.0.0`.
 *
 * Mempertahankan tampilan token saat ini (header + footer bersama dari
 * `public-site-layout.tsx` tetap menjadi render utama halaman). Layout ini
 * hanya membungkus konten utama dengan kerangka tema: band identitas desa
 * di atas dan pemisah pada bawah, tanpa mengubah field atau data.
 */
export default function ArunikaLayout(props: ThemeLayoutProps) {
  return (
    <div className={styles.tema} data-tema={props.tema?.layout ?? "klasik"}>
      <div className={styles.informasi}>
        <p className={styles.judul}>{props.villageName ?? "Sistem Informasi Desa"}</p>
        {props.location ? <p className={styles.lokasi}>{props.location}</p> : null}
      </div>
      <section className={styles.konten}>{props.children}</section>
    </div>
  );
}
