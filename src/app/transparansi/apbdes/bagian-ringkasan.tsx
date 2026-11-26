import type { CSSProperties } from "react";

import { formatRupiah } from "@/features/keuangan-desa/keuangan/domain/keuangan";

import styles from "./apbdes.module.css";
import { JudulSeksi, persen, type LaporanApbdes } from "./bagian-apbdes";

type BarisBidang = LaporanApbdes["bidang"][number];
type DonutBidang = BarisBidang & { color: string; start: number; end: number };

export function RingkasanApbdes({
  laporan,
  namaDesa,
  totalPendapatan,
  totalBelanja,
  totalPembiayaan,
}: {
  laporan: LaporanApbdes;
  namaDesa: string | null;
  totalPendapatan: string;
  totalBelanja: string;
  totalPembiayaan: string;
}) {
  return (
    <section id="apbdes" className={styles.panel}>
      <JudulSeksi
        ikon="▥"
        judul={"Ringkasan APBDes Tahun " + laporan.tahun}
        keterangan={"Rencana pendapatan, belanja, dan pembiayaan " + (namaDesa ?? "desa") + "."}
      />
      <div className={styles.summaryCards}>
        <article className={styles.incomeCard}>
          <span>↓</span>
          <div>
            <small>Pendapatan Desa</small>
            <strong>{formatRupiah(totalPendapatan)}</strong>
          </div>
        </article>
        <article className={styles.expenseCard}>
          <span>↑</span>
          <div>
            <small>Belanja Desa</small>
            <strong>{formatRupiah(totalBelanja)}</strong>
          </div>
        </article>
        <article className={styles.financeCard}>
          <span>=</span>
          <div>
            <small>Pembiayaan (Netto)</small>
            <strong>{formatRupiah(totalPembiayaan)}</strong>
          </div>
        </article>
      </div>
    </section>
  );
}

export function KomposisiBelanja({
  donut,
  donutStyle,
  totalBelanja,
  komposisiTotal,
}: {
  donut: DonutBidang[];
  donutStyle: CSSProperties | undefined;
  totalBelanja: string;
  komposisiTotal: number;
}) {
  return (
    <section className={styles.panel}>
      <JudulSeksi
        ikon="▱"
        judul="Komposisi Belanja Desa"
        keterangan="Alokasi anggaran berdasarkan bidang belanja."
      />
      {donut.length ? (
        <div className={styles.composition}>
          <div className={styles.donutWrap}>
            <div className={styles.donut} style={donutStyle}>
              <div>
                <small>Total Belanja</small>
                <strong>{formatRupiah(totalBelanja)}</strong>
              </div>
            </div>
          </div>
          <div className={styles.legend}>
            {donut.map((row) => (
              <div key={row.kode}>
                <i style={{ background: row.color }} />
                <span>{row.uraian}</span>
                <strong>{formatRupiah(row.anggaran)}</strong>
                <small>
                  {persen(komposisiTotal ? (Number(row.anggaran) / komposisiTotal) * 100 : 0)}
                </small>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className={styles.empty}>
          Rincian bidang belanja belum tersedia untuk tahun anggaran ini.
        </p>
      )}
    </section>
  );
}
