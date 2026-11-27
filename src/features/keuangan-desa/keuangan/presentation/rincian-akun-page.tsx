import type { ReactNode } from "react";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import {
  formatMoney,
  formatRupiah,
  kodeDepth,
  realisasiPersen,
  toMinor,
  type KeuanganBarisDTO,
} from "@/features/keuangan-desa/keuangan/domain/keuangan";

/**
 * Halaman rincian satu akun APBDes (pendapatan/belanja/pembiayaan).
 *
 * Hanya menampilkan data yang sudah ada di tabel `keuangan`; penyuntingan pagu
 * dan realisasi tetap dilakukan di APBDes/Realisasi agar aturan agregasi induk
 * hanya punya satu pintu tulis.
 */

export interface RincianAkunProps {
  akunKode: string;
  judul: string;
  deskripsi: ReactNode;
  tahun: number;
  tersedia: number[];
  rows: KeuanganBarisDTO[];
  labelKolom: string;
}

export function RincianAkunPage({
  akunKode,
  judul,
  deskripsi,
  tahun,
  tersedia,
  rows,
  labelKolom,
}: RincianAkunProps) {
  const akun = rows.find((row) => row.templateUuid === akunKode);
  const rincian = rows
    .filter((row) => row.templateUuid.startsWith(`${akunKode}.`))
    .filter((row) => kodeDepth(row.templateUuid) <= 3)
    .sort((a, b) => a.templateUuid.localeCompare(b.templateUuid));

  const pagu = akun?.anggaran ?? "0";
  const realisasi = akun?.realisasi ?? "0";
  const sisa = formatMoney(toMinor(pagu) - toMinor(realisasi));
  const persen = realisasiPersen(pagu, realisasi);

  return (
    <div className="modul-page">
      <PageHeading
        judul={<>{judul}</>}
        deskripsi={deskripsi}
        aksi={
          <>
            <ButtonLink variant="secondary" href={`/keuangan/apbdes?tahun=${tahun}`}>
              Ubah Pagu di APBDes
            </ButtonLink>
            <ButtonLink variant="secondary" href={`/keuangan/realisasi?tahun=${tahun}`}>
              Input Realisasi
            </ButtonLink>
          </>
        }
      />
      <section className="dashboard-stats" aria-label={`Ringkasan ${judul}`}>
        <article className="modul-card">
          <span>Pagu {tahun}</span>
          <strong>{formatRupiah(pagu)}</strong>
        </article>
        <article className="modul-card">
          <span>Realisasi</span>
          <strong>{formatRupiah(realisasi)}</strong>
        </article>
        <article className="modul-card">
          <span>Sisa pagu</span>
          <strong>{formatRupiah(sisa)}</strong>
        </article>
        <article className="modul-card">
          <span>Serapan</span>
          <strong>{persen.toFixed(1)}%</strong>
        </article>
      </section>
      <TableCard
        description={`${rincian.length.toLocaleString("id-ID")} ${labelKolom} pada tahun ${tahun}.`}
        filter={
          <form className="modul-filter-row" method="get">
            <FormField
              defaultValue={String(tahun)}
              kind="select"
              label="Tahun anggaran"
              name="tahun"
              options={
                tersedia.length
                  ? tersedia.map((item) => ({ value: String(item), label: String(item) }))
                  : [{ value: String(tahun), label: String(tahun) }]
              }
            />
            <Button type="submit">Terapkan</Button>
          </form>
        }
        title={`Rincian ${judul}`}
      >
        {rincian.length ? (
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  <HeaderCell>Kode</HeaderCell>
                  <HeaderCell>Uraian</HeaderCell>
                  <HeaderCell>Pagu</HeaderCell>
                  <HeaderCell>Realisasi</HeaderCell>
                  <HeaderCell>Sisa</HeaderCell>
                  <HeaderCell>Serapan</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {rincian.map((row) => {
                  const sisaBaris = formatMoney(toMinor(row.anggaran) - toMinor(row.realisasi));
                  return (
                    <Row key={row.templateUuid}>
                      <Cell>{row.templateUuid}</Cell>
                      <Cell>
                        <span style={{ paddingLeft: (kodeDepth(row.templateUuid) - 2) * 14 }}>
                          {row.uraian}
                        </span>
                      </Cell>
                      <Cell>{formatRupiah(row.anggaran)}</Cell>
                      <Cell>{formatRupiah(row.realisasi)}</Cell>
                      <Cell>{formatRupiah(sisaBaris)}</Cell>
                      <Cell>{realisasiPersen(row.anggaran, row.realisasi).toFixed(1)}%</Cell>
                    </Row>
                  );
                })}
              </TBody>
            </Table>
          </TableScroll>
        ) : (
          <p className="modul-empty">
            Belum ada rincian {labelKolom} pada tahun {tahun}. Isi pagu lewat menu APBDes.
          </p>
        )}
      </TableCard>
    </div>
  );
}
