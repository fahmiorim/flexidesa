import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import {
  Cell,
  HeaderCell,
  Row,
  Table,
  TableScroll,
  TBody,
  TFoot,
  THead,
} from "@/components/ui/table";
import { formatRupiah } from "@/features/keuangan-desa/keuangan/domain/keuangan";
import {
  getLaporanInventaris,
  getNeracaAset,
} from "@/features/pembangunan-aset/inventaris/application/inventaris-use-cases";
import { INVENTARIS_KONDISI_LABELS } from "@/features/pembangunan-aset/inventaris/domain/inventaris";

import styles from "../inventaris.module.css";

export const metadata = { title: "Laporan & Statistik Inventaris" };

export default async function LaporanInventarisPage() {
  const [laporan, neracaData] = await Promise.all([getLaporanInventaris(), getNeracaAset()]);
  const n = neracaData.neraca;
  const totalDepresiasi = laporan.items.reduce((s, x) => s + Number(x.akumulasiPenyusutan ?? 0), 0);
  const totalNilaiBuku = laporan.items.reduce(
    (s, x) => s + Number(x.nilaiBuku ?? x.nilaiAkhir ?? 0),
    0,
  );
  return (
    <main className={styles.page}>
      <PageHeading
        judul={<>Laporan &amp; Statistik Aset</>}
        deskripsi={<>Rekap jumlah, kondisi, nilai perolehan, dan neraca kekayaan aset desa.</>}
      />
      <section className={styles.metrics}>
        <article className={`${styles.metric} ${styles.metricPrimary}`}>
          <span>Total Nilai Aset</span>
          <strong>{formatRupiah(n.grandTotal)}</strong>
          <small>Nilai tercatat</small>
        </article>
        <article className={styles.metric}>
          <span>Jumlah Barang</span>
          <strong>{laporan.rekap.total.jumlahBarang}</strong>
          <small>Catatan inventaris aktif</small>
        </article>
        <article className={styles.metric}>
          <span>Total Unit</span>
          <strong>{Number(laporan.rekap.total.totalUnit).toLocaleString("id-ID")}</strong>
          <small>Akumulasi jumlah barang</small>
        </article>
        <article className={styles.metric}>
          <span>Nilai Kondisi Baik</span>
          <strong>{formatRupiah(n.totalPerKondisi.baik)}</strong>
          <small>{INVENTARIS_KONDISI_LABELS.baik}</small>
        </article>
        <article className={styles.metric}>
          <span>Akumulasi Penyusutan</span>
          <strong>{formatRupiah(totalDepresiasi.toFixed(2))}</strong>
          <small>Saldo penyusutan berjalan</small>
        </article>
        <article className={styles.metric}>
          <span>Nilai Buku Bersih</span>
          <strong>{formatRupiah(totalNilaiBuku.toFixed(2))}</strong>
          <small>Nilai perolehan dikurangi penyusutan</small>
        </article>
      </section>
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <h2>Neraca Aset per Kategori &amp; Kondisi</h2>
            <p>Nilai tercatat aset berdasarkan klasifikasi dan kondisi terakhir.</p>
          </div>
          <Link className={styles.primary} href="/inventaris/laporan/ekspor">
            Export CSV ↓
          </Link>
        </div>
        <TableScroll className={styles.tableWrap}>
          <Table className={styles.table}>
            <THead>
              <Row>
                <HeaderCell>Kategori</HeaderCell>
                <HeaderCell>Jumlah Barang</HeaderCell>
                <HeaderCell>Total Unit</HeaderCell>
                <HeaderCell>Baik (Rp)</HeaderCell>
                <HeaderCell>Rusak Ringan (Rp)</HeaderCell>
                <HeaderCell>Rusak Berat (Rp)</HeaderCell>
                <HeaderCell>Dalam Perbaikan (Rp)</HeaderCell>
                <HeaderCell>Akumulasi Penyusutan</HeaderCell>
                <HeaderCell>Nilai Buku</HeaderCell>
                <HeaderCell>Total Nilai</HeaderCell>
              </Row>
            </THead>
            <TBody>
              {n.baris.map((x) => {
                const group = laporan.items.filter(
                  (item) => (item.kategoriId ?? null) === (x.kategoriId ?? null),
                );
                const depresiasi = group.reduce(
                  (s, item) => s + Number(item.akumulasiPenyusutan ?? 0),
                  0,
                );
                const buku = group.reduce(
                  (s, item) => s + Number(item.nilaiBuku ?? item.nilaiAkhir ?? 0),
                  0,
                );
                return (
                  <Row key={x.kategoriId ?? x.nama}>
                    <Cell>
                      <strong>{x.nama}</strong>
                    </Cell>
                    <Cell>{x.jumlahBarang}</Cell>
                    <Cell>{Number(x.totalUnit).toLocaleString("id-ID")}</Cell>
                    <Cell>{formatRupiah(x.nilaiPerKondisi.baik)}</Cell>
                    <Cell>{formatRupiah(x.nilaiPerKondisi.rusak_ringan)}</Cell>
                    <Cell>{formatRupiah(x.nilaiPerKondisi.rusak_berat)}</Cell>
                    <Cell>{formatRupiah(x.nilaiPerKondisi.dalam_perbaikan)}</Cell>
                    <Cell>{formatRupiah(depresiasi.toFixed(2))}</Cell>
                    <Cell>{formatRupiah(buku.toFixed(2))}</Cell>
                    <Cell>
                      <strong>{formatRupiah(x.totalNilai)}</strong>
                    </Cell>
                  </Row>
                );
              })}
            </TBody>
            <TFoot>
              <Row>
                <HeaderCell>Total</HeaderCell>
                <HeaderCell>{n.baris.reduce((s, x) => s + x.jumlahBarang, 0)}</HeaderCell>
                <HeaderCell>
                  {Number(laporan.rekap.total.totalUnit).toLocaleString("id-ID")}
                </HeaderCell>
                <HeaderCell>{formatRupiah(n.totalPerKondisi.baik)}</HeaderCell>
                <HeaderCell>{formatRupiah(n.totalPerKondisi.rusak_ringan)}</HeaderCell>
                <HeaderCell>{formatRupiah(n.totalPerKondisi.rusak_berat)}</HeaderCell>
                <HeaderCell>{formatRupiah(n.totalPerKondisi.dalam_perbaikan)}</HeaderCell>
                <HeaderCell>{formatRupiah(totalDepresiasi.toFixed(2))}</HeaderCell>
                <HeaderCell>{formatRupiah(totalNilaiBuku.toFixed(2))}</HeaderCell>
                <HeaderCell>{formatRupiah(n.grandTotal)}</HeaderCell>
              </Row>
            </TFoot>
          </Table>
        </TableScroll>
      </section>
      <section className={styles.grid}>
        <article className={styles.panel}>
          <h2>Rekap per Kategori</h2>
          {laporan.rekap.baris.map((x) => (
            <div key={x.kategoriId ?? x.nama} className={styles.statLine}>
              <span>
                {x.nama} · {x.jumlahBarang} barang
              </span>
              <strong>{formatRupiah(x.totalNilai)}</strong>
            </div>
          ))}
        </article>
        <article className={styles.panel}>
          <h2>Komposisi Nilai per Kondisi</h2>
          {(["baik", "rusak_ringan", "rusak_berat", "dalam_perbaikan"] as const).map((k) => (
            <div key={k} style={{ marginBottom: 14 }}>
              <div className={styles.statLine}>
                <span>{INVENTARIS_KONDISI_LABELS[k]}</span>
                <strong>{formatRupiah(n.totalPerKondisi[k])}</strong>
              </div>
              <div className={styles.bar}>
                <i
                  style={{
                    width:
                      (Number(n.grandTotal)
                        ? (Number(n.totalPerKondisi[k]) / Number(n.grandTotal)) * 100
                        : 0) + "%",
                  }}
                />
              </div>
            </div>
          ))}
        </article>
      </section>
    </main>
  );
}
