import type { listLaporanDokumenApbdesPublik } from "@/features/keuangan-desa/keuangan/application/laporan-dokumen-publik-use-cases";
import type { getLaporanApbdesPublik } from "@/features/keuangan-desa/keuangan/application/laporan-publik-use-cases";

import styles from "./apbdes.module.css";

export type LaporanApbdes = Awaited<ReturnType<typeof getLaporanApbdesPublik>>;
export type DokumenApbdes = Awaited<ReturnType<typeof listLaporanDokumenApbdesPublik>>[number];

export const palette = ["#1684f5", "#b64bf0", "#16b84b", "#f5a400", "#ed39a8"];

export function persen(value: number) {
  return value.toLocaleString("id-ID", { maximumFractionDigits: 2 }) + "%";
}

export function JudulSeksi({
  ikon,
  judul,
  keterangan,
}: {
  ikon: string;
  judul: string;
  keterangan?: string;
}) {
  return (
    <div className={styles.sectionTitle}>
      <span className={styles.titleIcon}>{ikon}</span>
      {keterangan ? (
        <div>
          <h2>{judul}</h2>
          <p>{keterangan}</p>
        </div>
      ) : (
        <h2>{judul}</h2>
      )}
    </div>
  );
}
