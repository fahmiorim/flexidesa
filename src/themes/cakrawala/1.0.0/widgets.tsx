import Image from "next/image";
import Link from "next/link";

import type { ThemeWidgetProps, ThemeWidgets } from "../../types";
import styles from "./theme.module.css";

/**
 * Widget paket `cakrawala@1.0.0`.
 *
 * Cakrawala menampilkan jam dan statistik sebagai kartu di bilah samping, dan
 * memakai gambar fallback tenant ketika foto asli tidak tersedia.
 */
function JamCakrawala({ villageName }: ThemeWidgetProps) {
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

function StatistikCakrawala(_props: ThemeWidgetProps) {
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

function FotoFallbackCakrawala({ fotoUrl }: ThemeWidgetProps & { fotoUrl: string | null }) {
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

export const widgetCakrawala: ThemeWidgets = {
  jam: JamCakrawala,
  statistik: StatistikCakrawala,
  fotoFallback: FotoFallbackCakrawala,
};
