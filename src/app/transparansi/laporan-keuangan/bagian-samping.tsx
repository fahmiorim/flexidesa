import Link from "next/link";

import { formatRupiah } from "@/features/keuangan-desa/keuangan/domain/keuangan";

import {
  persen,
  type Kuartal,
  type LaporanKeuangan,
  type TriwulanKeuangan,
} from "./bagian-laporan";
import styles from "./laporan-keuangan.module.css";

export function GrafikRealisasi({
  serapan,
  realisasiBelanja,
  sisaBelanjaTampil,
}: {
  serapan: number;
  realisasiBelanja: string;
  sisaBelanjaTampil: string;
}) {
  return (
    <section className={styles.panel + " " + styles.donutPanel}>
      <div className={styles.sectionTitle}>
        <span>◔</span>
        <div>
          <h2>Grafik Realisasi Anggaran</h2>
          <p>Persentase realisasi belanja tahunan.</p>
        </div>
      </div>
      <div
        className={styles.donut}
        style={{ background: "conic-gradient(#7528ee " + serapan + "%, #e6d9ff 0)" }}
      >
        <div>
          <small>Realisasi</small>
          <strong>{persen(serapan)}</strong>
        </div>
      </div>
      <div className={styles.legend}>
        <span>
          <i />
          Realisasi <b>{formatRupiah(realisasiBelanja)}</b>
        </span>
        <span>
          <i />
          Sisa anggaran <b>{sisaBelanjaTampil}</b>
        </span>
      </div>
    </section>
  );
}

export function GrafikTriwulan({
  quarters,
  maxQuarter,
  totalBelanja,
}: {
  quarters: Kuartal[];
  maxQuarter: number;
  totalBelanja: string;
}) {
  return (
    <section className={styles.panel}>
      <div className={styles.sectionTitle}>
        <span>▥</span>
        <div>
          <h2>Realisasi Penyerapan per Triwulan</h2>
          <p>Akumulasi nilai triwulan dibanding pagu anggaran.</p>
        </div>
      </div>
      <div className={styles.quarterChart}>
        {quarters.map((quarter) => (
          <div className={styles.quarter} key={quarter.label}>
            <strong>
              {persen(
                Number(totalBelanja) > 0 ? (Number(quarter.value) / Number(totalBelanja)) * 100 : 0,
              )}
            </strong>
            <div className={styles.barTrack}>
              <i style={{ height: (Number(quarter.value) / maxQuarter) * 100 + "%" }} />
            </div>
            <b>{quarter.label}</b>
            <small>{quarter.period}</small>
          </div>
        ))}
      </div>
      <p className={styles.note}>
        Triwulan tanpa pencatatan ditampilkan sebagai Rp0, bukan estimasi.
      </p>
    </section>
  );
}

export function InfoLaporan({
  laporan,
  dokumenCount,
  triwulan,
}: {
  laporan: LaporanKeuangan;
  dokumenCount: number;
  triwulan: TriwulanKeuangan;
}) {
  return (
    <section className={styles.panel + " " + styles.infoPanel}>
      <div className={styles.sectionTitle}>
        <span>ⓘ</span>
        <div>
          <h2>Informasi Laporan</h2>
          <p>Keterangan data yang ditampilkan.</p>
        </div>
      </div>
      <dl>
        <div>
          <dt>Tahun anggaran</dt>
          <dd>{laporan.tahun}</dd>
        </div>
        <div>
          <dt>Dokumen diserahkan</dt>
          <dd>{dokumenCount}</dd>
        </div>
        <div>
          <dt>Realisasi triwulan</dt>
          <dd>{triwulan.baris.length} bidang</dd>
        </div>
      </dl>
      <Link href={"/transparansi/apbdes?tahun=" + laporan.tahun}>Lihat APBDes lengkap　→</Link>
    </section>
  );
}
