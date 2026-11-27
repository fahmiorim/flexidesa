import Image from "next/image";
import Link from "next/link";

import type { ThemeWidgetProps, ThemeWidgets } from "../../types";
import styles from "./theme.module.css";

/**
 * Widget paket `natra@1.0.0`.
 *
 * Natra menampilkan jam dan statistik sebagai kartu di bilah samping, dan
 * memakai gambar fallback tenant ketika foto asli tidak tersedia.
 */
function JamNatra({ villageName }: ThemeWidgetProps) {
  const sekarang = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
  return (
    <div className={styles.widget} data-widget="jam">
      <span>Waktu setempat</span>
      <strong>
        {sekarang} <small>WIB</small>
      </strong>
      <small>{villageName ?? "Desa"}</small>
    </div>
  );
}

function StatistikNatra(_props: ThemeWidgetProps) {
  return (
    <div className={styles.widget} data-widget="statistik">
      <span>Data desa</span>
      <strong>
        <Link href="/statistik">Statistik Desa →</Link>
      </strong>
      <small>Jumlah penduduk, pekerjaan, dan pendidikan.</small>
    </div>
  );
}

function FotoFallbackNatra({ fotoUrl }: ThemeWidgetProps & { fotoUrl: string | null }) {
  if (!fotoUrl) {
    return <div className={styles.fotoFallback} data-widget="foto-fallback" aria-hidden="true" />;
  }
  return (
    <Image
      className={styles.fotoFallback}
      src={fotoUrl}
      alt="Foto tidak tersedia"
      data-widget="foto-fallback"
      height={120}
      width={120}
      unoptimized
    />
  );
}

export const widgetNatra: ThemeWidgets = {
  jam: JamNatra,
  statistik: StatistikNatra,
  fotoFallback: FotoFallbackNatra,
};
