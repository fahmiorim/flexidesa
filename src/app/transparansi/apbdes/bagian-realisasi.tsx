import { formatRupiah } from "@/features/keuangan-desa/keuangan/domain/keuangan";

import styles from "./apbdes.module.css";
import { palette, persen, type LaporanApbdes } from "./bagian-apbdes";

export function RealisasiAnggaran({
  laporan,
  realisasiBelanja,
  persenRealisasi,
  sisaBelanjaTampil,
}: {
  laporan: LaporanApbdes;
  realisasiBelanja: string;
  persenRealisasi: number;
  sisaBelanjaTampil: string;
}) {
  return (
    <section id="realisasi" className={styles.panel}>
      <div className={styles.sectionTitle}>
        <span className={styles.titleIcon}>▥</span>
        <div>
          <h2>Realisasi Anggaran {laporan.tahun}</h2>
          <p>Perbandingan rencana dan realisasi yang telah dicatat pada tahun anggaran ini.</p>
        </div>
        <span className={styles.periodTag}>Tahunan</span>
      </div>
      <div className={styles.realizationCards}>
        <article>
          <span>▤</span>
          <div>
            <small>Realisasi Belanja</small>
            <strong>{formatRupiah(realisasiBelanja)}</strong>
          </div>
        </article>
        <article>
          <span>%</span>
          <div>
            <small>Persentase</small>
            <strong>{persen(persenRealisasi)}</strong>
          </div>
        </article>
        <article>
          <span>◷</span>
          <div>
            <small>Sisa Anggaran</small>
            <strong>{formatRupiah(sisaBelanjaTampil)}</strong>
          </div>
        </article>
      </div>
      {laporan.bidang.length ? (
        <div className={styles.realizationList}>
          {laporan.bidang.map((row, index) => (
            <div className={styles.realizationRow} key={row.kode}>
              <span className={styles.rowIcon} style={{ color: palette[index % palette.length] }}>
                ✥
              </span>
              <strong>{row.uraian}</strong>
              <div className={styles.progressTrack}>
                <i
                  style={{
                    width: Math.min(100, Math.max(0, row.persen)) + "%",
                    background: palette[index % palette.length],
                  }}
                />
              </div>
              <span>
                {formatRupiah(row.realisasi)} / {formatRupiah(row.anggaran)}
              </span>
              <b>{persen(row.persen)}</b>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Belum ada rincian realisasi per bidang.</p>
      )}
    </section>
  );
}
