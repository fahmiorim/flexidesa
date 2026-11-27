import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { FormField } from "@/components/ui/form-field";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { listArsipNomorSuratData } from "@/features/pelayanan-persuratan/surat/application/arsip";

export const metadata: Metadata = { title: "Arsip & Riwayat Surat" };
type SearchParams = Promise<{
  q?: string;
  tahun?: string;
  jenis?: string;
  klasifikasi?: string;
  page?: string;
}>;
const TANGGAL = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
function angka(raw?: string) {
  const n = Number(raw);
  return Number.isSafeInteger(n) && n > 0 ? n : undefined;
}
function tanggal(value: Date | string) {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : TANGGAL.format(d);
}

export default async function ArsipSuratPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filter = {
    search: (params.q ?? "").trim().slice(0, 100),
    year: angka(params.tahun),
    typeId: angka(params.jenis),
    classificationId: angka(params.klasifikasi),
    page: angka(params.page) ?? 1,
  };
  const result = await listArsipNomorSuratData(filter);
  const query = new URLSearchParams();
  if (filter.search) query.set("q", filter.search);
  if (filter.year) query.set("tahun", String(filter.year));
  if (filter.typeId) query.set("jenis", String(filter.typeId));
  if (filter.classificationId) query.set("klasifikasi", String(filter.classificationId));
  const pageHref = (page: number) => {
    const next = new URLSearchParams(query);
    next.set("page", String(page));
    return `/layanan-surat/persuratan/arsip?${next.toString()}`;
  };
  const tahunSekarang = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, i) => tahunSekarang - i);
  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Arsip & Riwayat Surat</>}
        deskripsi={<>Telusuri arsip nomor surat resmi yang telah diterbitkan oleh desa.</>}
      />
      <StatGrid columns={4}>
        <StatCard
          icon="▤"
          label="Total Arsip"
          utama
          note="Nomor resmi terbit"
          value={result.total.toLocaleString("id-ID")}
        />
        <StatCard
          icon="✓"
          label="Periode dipilih"
          note="Filter periode"
          tone="hijau"
          value={filter.year ?? tahunSekarang}
        />
        <StatCard
          icon="▧"
          label="Jenis Surat"
          note="Katalog desa"
          tone="biru"
          value={result.jenis.length}
        />
        <StatCard
          icon="☷"
          label="Klasifikasi"
          note="Kategori surat"
          tone="oranye"
          value={result.klasifikasi.length}
        />
      </StatGrid>
      <TableCard
        title="Arsip nomor surat"
        description="Telusuri nomor dan jenis surat resmi yang telah diterbitkan."
        actions={
          <>
            <ButtonLink
              size="sm"
              variant="secondary"
              href={`/layanan-surat/persuratan/arsip/ekspor?${query.toString()}`}
            >
              ↓ Ekspor CSV
            </ButtonLink>
            <Link href="/layanan-surat/persuratan/arsip" className="table-action-link">
              Reset filter
            </Link>
          </>
        }
        filter={
          <form method="get" action="/layanan-surat/persuratan/arsip" className="modul-filter-row">
            <FormField
              label="Kata kunci"
              name="q"
              type="search"
              maxLength={100}
              defaultValue={filter.search}
              placeholder="Nomor atau jenis surat..."
            />
            <FormField
              label="Tahun"
              kind="select"
              name="tahun"
              defaultValue={filter.year ? String(filter.year) : ""}
              options={[
                { value: "", label: "Semua tahun" },
                ...years.map((year) => ({ value: String(year), label: String(year) })),
              ]}
            />
            <FormField
              label="Jenis surat"
              kind="select"
              name="jenis"
              defaultValue={filter.typeId ? String(filter.typeId) : ""}
              options={[
                { value: "", label: "Semua jenis" },
                ...result.jenis.map((item) => ({ value: String(item.id), label: item.name })),
              ]}
            />
            <FormField
              label="Klasifikasi"
              kind="select"
              name="klasifikasi"
              defaultValue={filter.classificationId ? String(filter.classificationId) : ""}
              options={[
                { value: "", label: "Semua klasifikasi" },
                ...result.klasifikasi.map((item) => ({
                  value: String(item.id),
                  label: `${item.code} — ${item.name}`,
                })),
              ]}
            />
            <Button variant="primary" type="submit">
              Terapkan
            </Button>
          </form>
        }
      >
        {result.rows.length === 0 ? (
          <div className="modul-empty">
            <strong>Belum ada arsip pada filter ini</strong>
            <p className="modul-muted">
              Arsip otomatis terbentuk setelah surat disetujui dan diterbitkan.
            </p>
            <ButtonLink variant="secondary" href="/layanan-surat/persuratan/surat">
              Lihat Pengelolaan Surat
            </ButtonLink>
          </div>
        ) : (
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  <HeaderCell>Nomor surat</HeaderCell>
                  <HeaderCell>Jenis surat</HeaderCell>
                  <HeaderCell>Nomor urut</HeaderCell>
                  <HeaderCell>Tahun</HeaderCell>
                  <HeaderCell>Tanggal terbit</HeaderCell>
                  <HeaderCell>Dokumen</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {result.rows.map((row) => (
                  <Row key={row.id}>
                    <Cell className="modul-mono">
                      <strong>{row.number}</strong>
                    </Cell>
                    <Cell>{row.typeName}</Cell>
                    <Cell>{row.sequence}</Cell>
                    <Cell>{row.year}</Cell>
                    <Cell>{tanggal(row.issuedAt)}</Cell>
                    <Cell>
                      {row.letterId ? (
                        <Link
                          href={`/layanan-surat/persuratan/surat/${row.letterId}`}
                          className="table-action-link"
                        >
                          Detail / PDF →
                        </Link>
                      ) : (
                        <span className="modul-muted">Arsip nomor saja</span>
                      )}
                    </Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        )}
        <div
          className="modul-total"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span>
            {result.total.toLocaleString("id-ID")} arsip · Halaman {result.page}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            {result.page > 1 ? (
              <ButtonLink variant="secondary" href={pageHref(result.page - 1)}>
                Sebelumnya
              </ButtonLink>
            ) : null}
            {result.page * result.pageSize < result.total ? (
              <ButtonLink variant="secondary" href={pageHref(result.page + 1)}>
                Berikutnya
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </TableCard>
      <p className="modul-muted">
        Sumber: arsip nomor resmi. Aktivitas hanya tampil bila tercatat di audit.
      </p>
    </div>
  );
}
