import type { Metadata } from "next";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { getBukuKasUmum } from "@/features/keuangan-desa/keuangan/application/penatausahaan-use-cases";
import { formatRupiah } from "@/features/keuangan-desa/keuangan/domain/keuangan";

export const metadata: Metadata = { title: "Buku Kas Umum" };

export default async function BukuKasUmumPage({
  searchParams,
}: {
  searchParams: Promise<{ tahun?: string }>;
}) {
  const params = await searchParams;
  const tahunParam = Number(params.tahun);
  const data = await getBukuKasUmum(
    Number.isInteger(tahunParam) && tahunParam >= 2000 && tahunParam <= 2100
      ? tahunParam
      : undefined,
  );
  const { buku } = data;

  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Buku Kas Umum</>}
        deskripsi={<>Rekapitulasi mutasi kas desa tahun anggaran {data.tahun}.</>}
        aksi={
          <ButtonLink variant="secondary" href={`/keuangan/penatausahaan?tahun=${data.tahun}`}>
            Kelola Jurnal
          </ButtonLink>
        }
      />
      <section className="dashboard-stats" aria-label="Ringkasan buku kas">
        <article className="modul-card">
          <span>Saldo awal</span>
          <strong>{formatRupiah(buku.saldoAwal)}</strong>
        </article>
        <article className="modul-card">
          <span>Total penerimaan</span>
          <strong>{formatRupiah(buku.totalDebet)}</strong>
        </article>
        <article className="modul-card">
          <span>Total pengeluaran</span>
          <strong>{formatRupiah(buku.totalKredit)}</strong>
        </article>
        <article className="modul-card">
          <span>Saldo akhir</span>
          <strong>{formatRupiah(buku.saldoAkhir)}</strong>
        </article>
      </section>
      <TableCard
        description={`${buku.baris.length.toLocaleString("id-ID")} mutasi. Saldo dihitung berurutan menurut tanggal dan nomor catatan.`}
        filter={
          <form className="modul-filter-row" method="get">
            <FormField
              defaultValue={String(data.tahun)}
              kind="select"
              label="Tahun anggaran"
              name="tahun"
              options={
                data.tersedia.length
                  ? data.tersedia.map((tahun) => ({ value: String(tahun), label: String(tahun) }))
                  : [{ value: String(data.tahun), label: String(data.tahun) }]
              }
            />
            <Button type="submit">Terapkan</Button>
          </form>
        }
        title="Rincian Buku Kas"
      >
        {buku.baris.length ? (
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  <HeaderCell>Tanggal</HeaderCell>
                  <HeaderCell>Kode Rekening</HeaderCell>
                  <HeaderCell>Uraian</HeaderCell>
                  <HeaderCell>Penerimaan</HeaderCell>
                  <HeaderCell>Pengeluaran</HeaderCell>
                  <HeaderCell>Saldo</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {buku.baris.map((row) => (
                  <Row key={row.id}>
                    <Cell>{row.tanggal}</Cell>
                    <Cell>{row.kodeRekening}</Cell>
                    <Cell>
                      <strong>{row.uraian}</strong>
                      {row.referensi ? (
                        <>
                          <br />
                          <small>{row.referensi}</small>
                        </>
                      ) : null}
                    </Cell>
                    <Cell>{formatRupiah(row.debet)}</Cell>
                    <Cell>{formatRupiah(row.kredit)}</Cell>
                    <Cell>{formatRupiah(row.saldo)}</Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        ) : (
          <p className="modul-empty">
            Belum ada mutasi pada tahun {data.tahun}. Catat mutasi lewat menu Penatausahaan agar
            buku kas terisi.
          </p>
        )}
      </TableCard>
    </div>
  );
}
