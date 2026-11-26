import { formatRupiah } from "@/features/keuangan-desa/keuangan/domain/keuangan";

import { persen, type DokumenLaporan, type LaporanKeuangan } from "./bagian-laporan";
import styles from "./laporan-keuangan.module.css";

export function MetaLaporan({
  laporan,
  dokumen,
}: {
  laporan: LaporanKeuangan;
  dokumen: DokumenLaporan[];
}) {
  return (
    <section className={styles.metaGrid}>
      <article className={styles.documentStatus}>
        <span className={styles.fileIcon}>▤</span>
        <div>
          <strong>APBDes Tahun {laporan.tahun}</strong>
          <small className={dokumen.length ? styles.published : styles.pending}>
            {dokumen.length ? "✓　Dokumen dipublikasikan" : "Belum ada dokumen diserahkan"}
          </small>
        </div>
      </article>
      <article className={styles.metaItem}>
        <span>▦</span>
        <div>
          <strong>Periode Laporan</strong>
          <small>
            Data tahun anggaran {laporan.tahun}; realisasi triwulan mengikuti pencatatan yang
            tersedia.
          </small>
        </div>
      </article>
      <article className={styles.metaItem}>
        <span>▣</span>
        <div>
          <strong>Dokumen Publik</strong>
          <small>{dokumen.length} dokumen APBDes telah diserahkan untuk tahun ini.</small>
        </div>
      </article>
    </section>
  );
}

export function MetrikLaporan({
  laporan,
  totalPendapatan,
  totalBelanja,
  realisasiBelanja,
  sisaBelanjaTampil,
  serapan,
}: {
  laporan: LaporanKeuangan;
  totalPendapatan: string;
  totalBelanja: string;
  realisasiBelanja: string;
  sisaBelanjaTampil: string;
  serapan: number;
}) {
  return (
    <section className={styles.metrics}>
      <article className={styles.income}>
        <span>⇩</span>
        <div>
          <small>Pendapatan</small>
          <strong>{formatRupiah(totalPendapatan)}</strong>
          <em>Anggaran tahun {laporan.tahun}</em>
        </div>
      </article>
      <article className={styles.expense}>
        <span>▣</span>
        <div>
          <small>Belanja</small>
          <strong>{formatRupiah(totalBelanja)}</strong>
          <em>Anggaran tahun {laporan.tahun}</em>
        </div>
      </article>
      <article className={styles.realized}>
        <span>▥</span>
        <div>
          <small>Realisasi Belanja</small>
          <strong>{formatRupiah(realisasiBelanja)}</strong>
          <em>{persen(serapan)} dari anggaran</em>
        </div>
      </article>
      <article className={styles.remaining}>
        <span>⚖</span>
        <div>
          <small>Sisa Anggaran</small>
          <strong>{sisaBelanjaTampil}</strong>
          <em>{persen(Math.max(0, 100 - serapan))} belum terserap</em>
        </div>
      </article>
    </section>
  );
}
