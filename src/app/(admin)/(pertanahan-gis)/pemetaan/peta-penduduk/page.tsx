import type { Metadata } from "next";

import { PageHeading } from "@/components/shell/page-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { getPetaPenduduk } from "@/features/pertanahan-gis/gis/application/use-cases";

export const metadata: Metadata = { title: "Peta Penduduk" };

export default async function PetaPendudukPage() {
  const data = await getPetaPenduduk();
  const tertinggi = Math.max(1, ...data.perDusun.map((row) => row.total));

  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Peta Penduduk</>}
        deskripsi={<>Sebaran penduduk desa menurut wilayah dusun.</>}
        aksi={
          <ButtonLink variant="secondary" href="/pemetaan/peta">
            Buka Pemetaan Umum
          </ButtonLink>
        }
      />
      <section className="dashboard-stats" aria-label="Ringkasan sebaran penduduk">
        <article className="modul-card">
          <span>Total penduduk</span>
          <strong>{data.total.toLocaleString("id-ID")}</strong>
        </article>
        <article className="modul-card">
          <span>Laki-laki</span>
          <strong>{data.lakiLaki.toLocaleString("id-ID")}</strong>
        </article>
        <article className="modul-card">
          <span>Perempuan</span>
          <strong>{data.perempuan.toLocaleString("id-ID")}</strong>
        </article>
        <article className="modul-card">
          <span>Wilayah terisi</span>
          <strong>{data.perDusun.length.toLocaleString("id-ID")}</strong>
        </article>
      </section>
      <TableCard
        description="Batang menunjukkan proporsi jumlah penduduk tiap dusun terhadap dusun terpadat."
        title="Sebaran per Dusun"
      >
        {data.perDusun.length ? (
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  <HeaderCell>Dusun</HeaderCell>
                  <HeaderCell>Penduduk</HeaderCell>
                  <HeaderCell>Laki-laki</HeaderCell>
                  <HeaderCell>Perempuan</HeaderCell>
                  <HeaderCell>Kepala Keluarga</HeaderCell>
                  <HeaderCell>Proporsi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {data.perDusun.map((row) => (
                  <Row key={row.label}>
                    <Cell>
                      <strong>{row.label}</strong>
                    </Cell>
                    <Cell>{row.total.toLocaleString("id-ID")}</Cell>
                    <Cell>{row.lakiLaki.toLocaleString("id-ID")}</Cell>
                    <Cell>{row.perempuan.toLocaleString("id-ID")}</Cell>
                    <Cell>{row.keluarga.toLocaleString("id-ID")}</Cell>
                    <Cell>
                      <div
                        aria-label={`${row.label}: ${row.total} penduduk`}
                        className="progress"
                        role="img"
                      >
                        <i style={{ width: Math.round((row.total / tertinggi) * 100) + "%" }} />
                      </div>
                      <small>
                        {data.total > 0 ? ((row.total / data.total) * 100).toFixed(1) : "0.0"}%
                      </small>
                    </Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        ) : (
          <p className="modul-empty">
            Belum ada data wilayah pada penduduk. Lengkapi wilayah di Data Penduduk agar sebaran
            tampil.
          </p>
        )}
      </TableCard>
    </div>
  );
}
