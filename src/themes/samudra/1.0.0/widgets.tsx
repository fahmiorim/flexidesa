import Image from "next/image";
import Link from "next/link";

import type { ThemeWidgetProps, ThemeWidgets } from "../../types";
import styles from "./theme.module.css";

/**
 * Widget paket `samudra@1.0.0`.
 *
 * Berbeda dari Cakrawala, widget di sini hidup di bilah atas yang ringkas:
 * jam tampil sebagai teks sebaris, statistik sebagai tautan pendek, dan foto
 * fallback mengisi bidang gambar tanpa kartu.
 */
function JamSamudra({ villageName }: ThemeWidgetProps) {
  const sekarang = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
  return (
    <p className={styles.jam} data-widget="jam">
      <span className={styles.jamLabel}>Waktu setempat</span>
      <strong>
        {sekarang} <small>WIB</small>
      </strong>
      <span className={styles.jamDesa}>{villageName ?? "Desa"}</span>
    </p>
  );
}

function StatistikSamudra(_props: ThemeWidgetProps) {
  return (
    <p className={styles.statistik} data-widget="statistik">
      <Link href="/statistik">Statistik desa →</Link>
    </p>
  );
}

function FotoFallbackSamudra({ fotoUrl }: ThemeWidgetProps & { fotoUrl: string | null }) {
  if (!fotoUrl) {
    return <div className={styles.fotoFallback} data-widget="foto-fallback" aria-hidden="true" />;
  }
  return (
    <Image
      className={styles.fotoFallback}
      src={fotoUrl}
      alt="Foto tidak tersedia"
      data-widget="foto-fallback"
      height={160}
      width={280}
      unoptimized
    />
  );
}

export const widgetSamudra: ThemeWidgets = {
  jam: JamSamudra,
  statistik: StatistikSamudra,
  fotoFallback: FotoFallbackSamudra,
};
