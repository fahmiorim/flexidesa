import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import {
  getLaporanTriwulan,
  listKeuangan,
} from "@/features/keuangan-desa/keuangan/application/keuangan-use-cases";
import {
  formatRupiah,
  isInputRow,
  realisasiPersen,
} from "@/features/keuangan-desa/keuangan/domain/keuangan";

import { simpanRealisasiKeuanganAction, simpanRealisasiTriwulanAction } from "../actions";
import styles from "../keuangan.module.css";

export const metadata = { title: "Realisasi Anggaran" };

type Props = { searchParams: Promise<{ tahun?: string }> };

export default async function RealisasiPage({ searchParams }: Props) {
  const params = await searchParams;
  const tahunParam = Number(params.tahun);
  const tahun =
    Number.isInteger(tahunParam) && tahunParam >= 2000 && tahunParam <= 2100
      ? tahunParam
      : undefined;
  const [data, triwulan] = await Promise.all([listKeuangan(tahun), getLaporanTriwulan(tahun)]);
  const rows = data.rows.filter(
    (row) => isInputRow(row.templateUuid) && !["4", "5", "6"].includes(row.templateUuid),
  );
  const akun = new Map(data.rows.map((row) => [row.templateUuid, row]));
  return (
    <main className={styles.page}>
      <PageHeading
        judul={<>Realisasi Anggaran</>}
        deskripsi={<>Catat dan pantau realisasi pendapatan serta belanja terhadap APBDes.</>}
      />
      <section className={styles.metrics}>
        <article className={styles.metricPrimary}>
          <span>Total Pagu {data.tahun}</span>
          <strong>{formatRupiah(akun.get("4")?.anggaran ?? "0")}</strong>
          <small>Anggaran pendapatan</small>
        </article>
        <article className={styles.metric}>
          <span>Realisasi Pendapatan</span>
          <strong>{formatRupiah(akun.get("4")?.realisasi ?? "0")}</strong>
          <small>
            {realisasiPersen(
              akun.get("4")?.anggaran ?? "0",
              akun.get("4")?.realisasi ?? "0",
            ).toFixed(1)}
            %
          </small>
        </article>
        <article className={styles.metric}>
          <span>Realisasi Belanja</span>
          <strong>{formatRupiah(akun.get("5")?.realisasi ?? "0")}</strong>
          <small>
            {realisasiPersen(
              akun.get("5")?.anggaran ?? "0",
              akun.get("5")?.realisasi ?? "0",
            ).toFixed(1)}
            %
          </small>
        </article>
        <article className={styles.metric}>
          <span>Sisa Belanja</span>
          <strong>
            {formatRupiah(
              (
                Number(akun.get("5")?.anggaran ?? 0) - Number(akun.get("5")?.realisasi ?? 0)
              ).toString(),
            )}
          </strong>
          <small>Dari pagu belanja</small>
        </article>
        <article className={styles.metric}>
          <span>Bidang Belanja</span>
          <strong>{triwulan.baris.length} bidang</strong>
          <small>Rekap triwulan</small>
        </article>
      </section>
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
      <form action={simpanRealisasiKeuanganAction} className={styles.panel}>
        <input type="hidden" name="tahun" value={data.tahun} />
        <div className={styles.panelHeading}>
          <div>
            <h2>Input Realisasi Tahun {data.tahun}</h2>
            <p>Isi realisasi rekening kegiatan. Akun induk dihitung otomatis dari rincian.</p>
          </div>
          <Button type="submit">Simpan Realisasi</Button>
        </div>
        <TableScroll className={styles.tableWrap}>
          <Table className={styles.dataTable}>
            <THead>
              <Row>
                <HeaderCell>Kode</HeaderCell>
                <HeaderCell>Uraian</HeaderCell>
                <HeaderCell className={styles.number}>Pagu (Rp)</HeaderCell>
                <HeaderCell className={styles.number}>Realisasi (Rp)</HeaderCell>
                <HeaderCell>Serapan</HeaderCell>
              </Row>
            </THead>
            <TBody>
              {rows.map((row) => (
                <Row key={row.templateUuid}>
                  <Cell>
                    <b>{row.templateUuid}</b>
                  </Cell>
                  <Cell>{row.uraian}</Cell>
                  <Cell className={styles.number}>{formatRupiah(row.anggaran)}</Cell>
                  <Cell className={styles.number}>
                    <input
                      className={styles.moneyInput}
                      type="number"
                      min="0"
                      step="1"
                      name={"realisasi:" + row.templateUuid}
                      defaultValue={Number(row.realisasi)}
                      aria-label={"Realisasi " + row.uraian}
                    />
                  </Cell>
                  <Cell>
                    <div className={styles.progress}>
                      <i
                        style={{
                          width: Math.min(100, realisasiPersen(row.anggaran, row.realisasi)) + "%",
                        }}
                      />
                    </div>
                  </Cell>
                </Row>
              ))}
            </TBody>
          </Table>
        </TableScroll>
      </form>
      <form action={simpanRealisasiTriwulanAction} className={styles.panel}>
        <input type="hidden" name="tahun" value={triwulan.tahun} />
        <div className={styles.panelHeading}>
          <div>
            <h2>Realisasi Belanja per Triwulan</h2>
            <p>Masukkan realisasi per bidang sesuai data pelaksanaan dan SPJ.</p>
          </div>
          <Button type="submit">Simpan Triwulan</Button>
        </div>
        <TableScroll className={styles.tableWrap}>
          <Table className={styles.dataTable}>
            <THead>
              <Row>
                <HeaderCell>Bidang</HeaderCell>
                <HeaderCell className={styles.number}>TW I</HeaderCell>
                <HeaderCell className={styles.number}>TW II</HeaderCell>
                <HeaderCell className={styles.number}>TW III</HeaderCell>
                <HeaderCell className={styles.number}>TW IV</HeaderCell>
              </Row>
            </THead>
            <TBody>
              {triwulan.baris.map((row) => (
                <Row key={row.kode}>
                  <Cell>
                    <b>{row.kode}</b> {row.uraian}
                  </Cell>
                  {(["tw1", "tw2", "tw3", "tw4"] as const).map((key) => (
                    <Cell className={styles.number} key={key}>
                      <input
                        className={styles.moneyInput}
                        type="number"
                        min="0"
                        step="1"
                        name={key + ":" + row.kode}
                        defaultValue={Number(row[key])}
                        aria-label={key + " " + row.uraian}
                      />
                    </Cell>
                  ))}
                </Row>
              ))}
            </TBody>
          </Table>
        </TableScroll>
      </form>
    </main>
  );
}
