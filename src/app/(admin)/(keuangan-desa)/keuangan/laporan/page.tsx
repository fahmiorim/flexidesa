import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import {
  getLaporanKeuangan,
  getLaporanRealisasiResmi,
} from "@/features/keuangan-desa/keuangan/application/keuangan-use-cases";
import { formatRupiah } from "@/features/keuangan-desa/keuangan/domain/keuangan";

import styles from "../keuangan.module.css";

export const metadata = { title: "Laporan Keuangan" };

type Props = { searchParams: Promise<{ tahun?: string }> };

export default async function LaporanKeuanganPage({ searchParams }: Props) {
  const params = await searchParams;
  const tahunParam = Number(params.tahun);
  const tahun =
    Number.isInteger(tahunParam) && tahunParam >= 2000 && tahunParam <= 2100
      ? tahunParam
      : undefined;
  const [data, resmi] = await Promise.all([
    getLaporanKeuangan(tahun),
    getLaporanRealisasiResmi(tahun),
  ]);
  const akun = new Map(data.baris.map((row) => [row.kode, row]));
  const belanja = akun.get("5");
  const persen = belanja?.persen ?? 0;
  return (
    <main className={styles.page}>
      <PageHeading
        judul={<>Laporan Keuangan</>}
        deskripsi={<>Laporan realisasi APBDes dan keuangan desa.</>}
      />
      <form method="get" className={styles.filterForm}>
        <FormField
          defaultValue={String(data.tahun)}
          kind="select"
          label="Tahun anggaran"
          name="tahun"
          options={data.tersedia.map((y) => ({ value: String(y), label: String(y) }))}
        />
        <Button type="submit" variant="secondary">
          Tampilkan
        </Button>
      </form>
      <section className={styles.metrics}>
        <article className={styles.metricPrimary}>
          <span>Realisasi Pendapatan APBDes {data.tahun}</span>
          <strong>{formatRupiah(akun.get("4")?.realisasi ?? "0")}</strong>
          <small>Realisasi pada akun pendapatan</small>
        </article>
        <article className={styles.metric}>
          <span>Pendapatan</span>
          <strong>{formatRupiah(akun.get("4")?.realisasi ?? "0")}</strong>
          <small>{(akun.get("4")?.persen ?? 0).toFixed(1)}% dari pagu</small>
        </article>
        <article className={styles.metric}>
          <span>Belanja</span>
          <strong>{formatRupiah(belanja?.realisasi ?? "0")}</strong>
          <small>{persen.toFixed(1)}% dari pagu</small>
        </article>
        <article className={styles.metric}>
          <span>Pembiayaan Netto</span>
          <strong>{formatRupiah(akun.get("6")?.realisasi ?? "0")}</strong>
          <small>Realisasi pembiayaan</small>
        </article>
        <article className={styles.metric}>
          <span>Serapan Belanja</span>
          <strong>{persen.toFixed(1)}%</strong>
          <small>Realisasi dibanding pagu</small>
        </article>
      </section>
      <section className={styles.panel}>
        <div className={styles.panelHeading}>
          <div>
            <h2>Laporan Realisasi APBDes Tahun {data.tahun}</h2>
            <p>Ringkasan pendapatan, belanja, dan pembiayaan berdasarkan rekening APBDes.</p>
          </div>
          <div className={styles.exportLinks}>
            <a href={"/keuangan/laporan/ekspor?tahun=" + data.tahun}>Unduh CSV</a>
            <a href={"/keuangan/laporan/ekspor-excel?tahun=" + data.tahun}>Unduh Excel</a>
          </div>
        </div>
        <TableScroll className={styles.tableWrap}>
          <Table className={styles.dataTable}>
            <THead>
              <Row>
                <HeaderCell>Kode</HeaderCell>
                <HeaderCell>Uraian</HeaderCell>
                <HeaderCell className={styles.number}>Pagu (Rp)</HeaderCell>
                <HeaderCell className={styles.number}>Realisasi (Rp)</HeaderCell>
                <HeaderCell className={styles.number}>Sisa (Rp)</HeaderCell>
                <HeaderCell>Serapan</HeaderCell>
              </Row>
            </THead>
            <TBody>
              {data.baris.map((row) => (
                <Row key={row.kode}>
                  <Cell>
                    <b>{row.kode}</b>
                  </Cell>
                  <Cell>{row.uraian}</Cell>
                  <Cell className={styles.number}>{formatRupiah(row.anggaran)}</Cell>
                  <Cell className={styles.number}>{formatRupiah(row.realisasi)}</Cell>
                  <Cell className={styles.number}>{formatRupiah(row.selisih)}</Cell>
                  <Cell>{row.persen.toFixed(1)}%</Cell>
                </Row>
              ))}
            </TBody>
          </Table>
        </TableScroll>
      </section>
      <section className={styles.panel}>
        <div className={styles.panelHeading}>
          <div>
            <h2>Realisasi per Bidang</h2>
            <p>Rincian belanja menurut bidang APBDes.</p>
          </div>
        </div>
        <TableScroll className={styles.tableWrap}>
          <Table className={styles.dataTable}>
            <THead>
              <Row>
                <HeaderCell>Kode</HeaderCell>
                <HeaderCell>Bidang</HeaderCell>
                <HeaderCell className={styles.number}>Pagu (Rp)</HeaderCell>
                <HeaderCell className={styles.number}>Realisasi (Rp)</HeaderCell>
                <HeaderCell>Serapan</HeaderCell>
              </Row>
            </THead>
            <TBody>
              {data.bidang.map((row) => (
                <Row key={row.kode}>
                  <Cell>{row.kode}</Cell>
                  <Cell>{row.uraian}</Cell>
                  <Cell className={styles.number}>{formatRupiah(row.anggaran)}</Cell>
                  <Cell className={styles.number}>{formatRupiah(row.realisasi)}</Cell>
                  <Cell>
                    <div className={styles.progress}>
                      <i style={{ width: Math.min(100, row.persen) + "%" }} />
                    </div>
                    <small>{row.persen.toFixed(1)}%</small>
                  </Cell>
                </Row>
              ))}
            </TBody>
          </Table>
        </TableScroll>
      </section>
      <section className={styles.panel}>
        <div className={styles.panelHeading}>
          <div>
            <h2>Struktur Laporan Realisasi</h2>
            <p>
              Rekap resmi mencakup jumlah per akun, surplus/defisit, pembiayaan netto, dan SiLPA.
            </p>
          </div>
          <span className={styles.status}>Tahun {resmi.tahun}</span>
        </div>
        <div className={styles.reportTree}>
          {resmi.laporan.blok.map((blok) => (
            <div className={styles.reportBlock} key={blok.akun.kode}>
              <div>
                <span>{blok.akun.kode}</span>
                <strong>{blok.akun.uraian}</strong>
                <b>{formatRupiah(blok.total.realisasi)}</b>
              </div>
              {blok.baris.map((row) => (
                <div className={styles.reportLine} key={row.kode}>
                  <span>{row.kode}</span>
                  <strong>{row.uraian}</strong>
                  <b>{formatRupiah(row.realisasi)}</b>
                </div>
              ))}
            </div>
          ))}
          {[
            ["Surplus / Defisit", resmi.laporan.surplus],
            ["Pembiayaan Netto", resmi.laporan.pembiayaanNetto],
            ["SiLPA Tahun Berjalan", resmi.laporan.silpa],
          ].map(([label, item]) => (
            <div className={styles.reportSummary} key={String(label)}>
              <span />
              <strong>{String(label)}</strong>
              <b>{formatRupiah((item as { realisasi: string }).realisasi)}</b>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
