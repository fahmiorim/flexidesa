import type { Metadata } from "next";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { getBukuPembangunan } from "@/features/pembangunan-aset/pembangunan/application/use-cases";
import {
  buildBukuPembangunan,
  totalBukuPembangunan,
} from "@/features/pembangunan-aset/pembangunan/domain/buku-pembangunan";
import {
  formatAnggaran,
  statusPembangunanLabel,
} from "@/features/pembangunan-aset/pembangunan/domain/pembangunan";

export const metadata: Metadata = { title: "Buku Administrasi Pembangunan" };

export default async function BukuPembangunanPage({
  searchParams,
}: {
  searchParams: Promise<{ tahun?: string }>;
}) {
  const params = await searchParams;
  const tahunParam = Number(params.tahun);
  const tahun =
    Number.isInteger(tahunParam) && tahunParam >= 2000 && tahunParam <= 2100 ? tahunParam : null;

  const rows = await getBukuPembangunan(tahun);
  const buku = buildBukuPembangunan(rows);
  const total = totalBukuPembangunan(buku);

  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Buku Administrasi Pembangunan</>}
        deskripsi={<>Rekap tahunan proyek pembangunan desa beserta anggaran dan progresnya.</>}
        aksi={
          <ButtonLink
            variant="secondary"
            href={tahun ? `/pembangunan/buku/ekspor?tahun=${tahun}` : "/pembangunan/buku/ekspor"}
          >
            Unduh CSV
          </ButtonLink>
        }
      />
      <section className="dashboard-stats" aria-label="Ringkasan buku pembangunan">
        <article className="modul-card">
          <span>Jumlah proyek</span>
          <strong>{total.jumlahProyek.toLocaleString("id-ID")}</strong>
        </article>
        <article className="modul-card">
          <span>Selesai</span>
          <strong>{total.selesai.toLocaleString("id-ID")}</strong>
        </article>
        <article className="modul-card">
          <span>Total anggaran</span>
          <strong>{formatAnggaran(String(total.totalAnggaran))}</strong>
        </article>
        <article className="modul-card">
          <span>Progres rata-rata</span>
          <strong>{total.progresRataRata}%</strong>
        </article>
      </section>
      <TableCard
        description={`${buku.length.toLocaleString("id-ID")} tahun anggaran tercatat.`}
        filter={
          <form className="modul-filter-row" method="get">
            <FormField
              defaultValue={tahun ? String(tahun) : ""}
              kind="select"
              label="Tahun anggaran"
              name="tahun"
              options={[
                { value: "", label: "Semua tahun" },
                ...buku.map((item) => ({ value: String(item.tahun), label: String(item.tahun) })),
              ]}
            />
            <Button type="submit">Terapkan</Button>
          </form>
        }
        title="Rekap per Tahun Anggaran"
      >
        {buku.length ? (
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  <HeaderCell>Tahun</HeaderCell>
                  <HeaderCell>Proyek</HeaderCell>
                  <HeaderCell>Selesai</HeaderCell>
                  <HeaderCell>Berjalan</HeaderCell>
                  <HeaderCell>Rencana</HeaderCell>
                  <HeaderCell>Anggaran</HeaderCell>
                  <HeaderCell>Progres</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {buku.map((item) => (
                  <Row key={item.tahun}>
                    <Cell>
                      <strong>{item.tahun}</strong>
                    </Cell>
                    <Cell>{item.jumlahProyek}</Cell>
                    <Cell>{item.selesai}</Cell>
                    <Cell>{item.berjalan}</Cell>
                    <Cell>{item.rencana}</Cell>
                    <Cell>{formatAnggaran(String(item.totalAnggaran))}</Cell>
                    <Cell>{item.progresRataRata}%</Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        ) : (
          <p className="modul-empty">
            Belum ada proyek pembangunan. Catat kegiatan lewat menu Kegiatan &amp; Pembangunan.
          </p>
        )}
      </TableCard>
      {buku.map((item) => (
        <TableCard
          description={`${item.jumlahProyek} proyek · ${formatAnggaran(String(item.totalAnggaran))} · progres rata-rata ${item.progresRataRata}%.`}
          key={item.tahun}
          title={`Rincian Proyek ${item.tahun}`}
        >
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  <HeaderCell>Judul</HeaderCell>
                  <HeaderCell>Lokasi</HeaderCell>
                  <HeaderCell>Sumber Dana</HeaderCell>
                  <HeaderCell>Anggaran</HeaderCell>
                  <HeaderCell>Volume</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Progres</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {item.proyek.map((proyek) => (
                  <Row key={proyek.id}>
                    <Cell>
                      <strong>{proyek.judul}</strong>
                    </Cell>
                    <Cell>{proyek.lokasi ?? "—"}</Cell>
                    <Cell>{proyek.sumberDana ?? "—"}</Cell>
                    <Cell>{formatAnggaran(proyek.anggaran)}</Cell>
                    <Cell>
                      {proyek.volume ?? "—"} {proyek.satuan ?? ""}
                    </Cell>
                    <Cell>{statusPembangunanLabel(proyek.status)}</Cell>
                    <Cell>{proyek.progres}%</Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        </TableCard>
      ))}
    </div>
  );
}
