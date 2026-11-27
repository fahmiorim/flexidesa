import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { listKeuangan } from "@/features/keuangan-desa/keuangan/application/keuangan-use-cases";
import {
  formatMoney,
  formatRupiah,
  isInputRow,
  kodeDepth,
  toMinor,
} from "@/features/keuangan-desa/keuangan/domain/keuangan";

import { simpanPaguApbdesAction } from "../actions";
import styles from "../keuangan.module.css";

export const metadata = { title: "APBDes" };

type Props = { searchParams: Promise<{ tahun?: string }> };

export default async function ApbdesPage({ searchParams }: Props) {
  const params = await searchParams;
  const tahunParam = Number(params.tahun);
  const tahun =
    Number.isInteger(tahunParam) && tahunParam >= 2000 && tahunParam <= 2100
      ? tahunParam
      : undefined;
  const data = await listKeuangan(tahun);
  const akun = new Map(data.rows.map((row) => [row.templateUuid, row]));
  const surplus =
    toMinor(akun.get("4")?.anggaran ?? "0") -
    toMinor(akun.get("5")?.anggaran ?? "0") +
    toMinor(akun.get("6")?.anggaran ?? "0");
  return (
    <main className={styles.page}>
      <PageHeading
        judul={<>APBDes</>}
        deskripsi={<>Kelola Anggaran Pendapatan dan Belanja Desa per tahun anggaran.</>}
      />
      <section className={styles.metrics}>
        <article className={styles.metricPrimary}>
          <span>Total APBDes {data.tahun}</span>
          <strong>{formatRupiah(akun.get("4")?.anggaran ?? "0")}</strong>
          <small>Pagu pendapatan desa</small>
        </article>
        <article className={styles.metric}>
          <span>Pendapatan</span>
          <strong>{formatRupiah(akun.get("4")?.anggaran ?? "0")}</strong>
          <small>Rencana pendapatan</small>
        </article>
        <article className={styles.metric}>
          <span>Belanja</span>
          <strong>{formatRupiah(akun.get("5")?.anggaran ?? "0")}</strong>
          <small>Rencana belanja</small>
        </article>
        <article className={styles.metric}>
          <span>Pembiayaan Netto</span>
          <strong>{formatRupiah(akun.get("6")?.anggaran ?? "0")}</strong>
          <small>Anggaran pembiayaan</small>
        </article>
        <article className={styles.metric}>
          <span>Surplus / Defisit Anggaran</span>
          <strong>{formatRupiah(formatMoney(surplus))}</strong>
          <small>Pendapatan − belanja + pembiayaan</small>
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
      <form action={simpanPaguApbdesAction} className={styles.panel}>
        <input type="hidden" name="tahun" value={data.tahun} />
        <div className={styles.panelHeading}>
          <div>
            <h2>Rincian APBDes Tahun Anggaran {data.tahun}</h2>
            <p>
              Isi pagu pada rekening yang dapat diinput. Nilai induk dihitung otomatis dari rincian.
            </p>
          </div>
          <Button type="submit">Simpan APBDes</Button>
        </div>
        <TableScroll className={styles.tableWrap}>
          <Table className={styles.dataTable}>
            <THead>
              <Row>
                <HeaderCell>Kode</HeaderCell>
                <HeaderCell>Uraian</HeaderCell>
                <HeaderCell className={styles.number}>Pagu Anggaran (Rp)</HeaderCell>
                <HeaderCell className={styles.number}>Realisasi Saat Ini (Rp)</HeaderCell>
              </Row>
            </THead>
            <TBody>
              {data.rows
                .filter((row) => !["1", "2", "3", "7"].includes(row.templateUuid))
                .map((row) => (
                  <Row key={row.templateUuid}>
                    <Cell>
                      <b>{row.templateUuid}</b>
                    </Cell>
                    <Cell>
                      <span
                        className={
                          kodeDepth(row.templateUuid) === 1 ? styles.accountStrong : undefined
                        }
                        style={{ paddingLeft: (kodeDepth(row.templateUuid) - 1) * 15 }}
                      >
                        {row.uraian}
                      </span>
                    </Cell>
                    <Cell className={styles.number}>
                      {isInputRow(row.templateUuid) ? (
                        <input
                          className={styles.moneyInput}
                          type="number"
                          min="0"
                          step="1"
                          name={"anggaran:" + row.templateUuid}
                          defaultValue={Number(row.anggaran)}
                          aria-label={"Pagu " + row.uraian}
                        />
                      ) : (
                        formatRupiah(row.anggaran)
                      )}
                    </Cell>
                    <Cell className={styles.number}>{formatRupiah(row.realisasi)}</Cell>
                  </Row>
                ))}
            </TBody>
          </Table>
        </TableScroll>
        <div className={styles.formFooter}>
          <span>Perubahan pagu tidak menghapus nilai realisasi yang sudah tercatat.</span>
          <Button type="submit">Simpan Perubahan</Button>
        </div>
      </form>
    </main>
  );
}
