import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { FormField } from "@/components/ui/form-field";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { listSuratWithMeta } from "@/features/pelayanan-persuratan/surat/application/daftar-surat";
import {
  LETTER_STATUS_LABELS,
  LETTER_STATUSES,
  type LetterStatus,
} from "@/features/pelayanan-persuratan/surat/domain/surat";

export const metadata: Metadata = { title: "Pembuatan & Pengelolaan Surat" };

type SearchParams = Promise<{ q?: string; status?: string; page?: string }>;

const FORMAT_TANGGAL = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function statusValid(value: string | undefined): LetterStatus | null {
  return value && (LETTER_STATUSES as readonly string[]).includes(value)
    ? (value as LetterStatus)
    : null;
}

function angkaHalaman(value: string | undefined): number {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : 1;
}

function chipStatus(status: LetterStatus): string {
  if (status === "issued") return "hijau";
  if (status === "verifikasi") return "ungu";
  if (status === "cancelled") return "merah";
  return "netral";
}

export default async function SuratPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filter = {
    search: (params.q ?? "").trim().slice(0, 100),
    status: statusValid(params.status),
    page: angkaHalaman(params.page),
    pageSize: 20,
  };
  const hasil = await listSuratWithMeta(filter);
  const total = hasil.total;
  const draft = hasil.recap
    .filter((item) => item.status === "draft")
    .reduce((sum, item) => sum + item.total, 0);
  const verifikasi = hasil.recap
    .filter((item) => item.status === "verifikasi")
    .reduce((sum, item) => sum + item.total, 0);
  const terbit = hasil.recap
    .filter((item) => item.status === "issued")
    .reduce((sum, item) => sum + item.total, 0);
  const batal = hasil.recap
    .filter((item) => item.status === "cancelled")
    .reduce((sum, item) => sum + item.total, 0);

  const query = new URLSearchParams();
  if (filter.search) query.set("q", filter.search);
  if (filter.status) query.set("status", filter.status);
  const hrefPage = (page: number) => {
    const next = new URLSearchParams(query);
    next.set("page", String(page));
    return `/layanan-surat/persuratan/surat?${next.toString()}`;
  };

  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Pembuatan & Pengelolaan Surat</>}
        deskripsi={<>Kelola surat resmi desa dan penerbitannya.</>}
      />

      <StatGrid columns={4}>
        <StatCard
          icon="▤"
          label="Total Surat"
          utama
          note="Seluruh periode"
          value={hasil.recap.reduce((sum, item) => sum + item.total, 0).toLocaleString("id-ID")}
        />
        <StatCard
          icon="◷"
          label="Konsep"
          note="Belum diajukan"
          tone="biru"
          value={draft.toLocaleString("id-ID")}
        />
        <StatCard
          icon="⇄"
          label="Menunggu Verifikasi"
          note="Antrean persetujuan"
          value={verifikasi.toLocaleString("id-ID")}
        />
        <StatCard
          icon="✓"
          label="Surat Terbit"
          note="Siap dicetak"
          tone="hijau"
          value={terbit.toLocaleString("id-ID")}
        />
        <StatCard
          icon="×"
          label="Dibatalkan"
          note="Tidak diterbitkan"
          tone="merah"
          value={batal.toLocaleString("id-ID")}
        />
      </StatGrid>

      <TableCard
        title="Daftar Surat"
        description={`${total.toLocaleString("id-ID")} surat ditemukan · ${hasil.pageSize} data per halaman`}
        actions={
          <>
            <ButtonLink size="sm" variant="secondary" href="/layanan-surat/persuratan/dashboard">
              Dashboard
            </ButtonLink>
            <ButtonLink size="sm" variant="secondary" href="/layanan-surat/persuratan/verifikasi">
              Verifikasi
            </ButtonLink>
            <ButtonLink size="sm" variant="secondary" href="/layanan-surat/persuratan/jenis-surat">
              Template
            </ButtonLink>
            <ButtonLink size="sm" variant="secondary" href="/layanan-surat/persuratan/arsip">
              Arsip
            </ButtonLink>
            <ButtonLink size="sm" href="/layanan-surat/persuratan/surat/baru">
              ＋ Buat Surat Baru
            </ButtonLink>
          </>
        }
        filter={
          <form method="get" action="/layanan-surat/persuratan/surat" className="modul-filter-row">
            <FormField
              label="Kata kunci"
              name="q"
              type="search"
              maxLength={100}
              defaultValue={filter.search}
              placeholder="Nomor, jenis, nama pemohon..."
            />
            <FormField
              label="Status surat"
              kind="select"
              name="status"
              defaultValue={filter.status ?? ""}
              options={[
                { value: "", label: "Semua status" },
                ...LETTER_STATUSES.map((status) => ({
                  value: status,
                  label: LETTER_STATUS_LABELS[status],
                })),
              ]}
            />
            <Button type="submit">Terapkan Filter</Button>
          </form>
        }
      >
        {hasil.rows.length === 0 ? (
          <div
            style={{
              display: "grid",
              justifyItems: "center",
              gap: 8,
              padding: "42px 20px",
              textAlign: "center",
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 28 }}>
              ▤
            </span>
            <strong>Belum ada surat pada filter ini</strong>
            <p className="modul-muted">Buat surat baru atau ubah kata kunci pencarian.</p>
            <ButtonLink variant="primary" href="/layanan-surat/persuratan/surat/baru">
              Buat Surat Baru
            </ButtonLink>
          </div>
        ) : (
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  <HeaderCell scope="col">Nomor Surat</HeaderCell>
                  <HeaderCell scope="col">Jenis Surat</HeaderCell>
                  <HeaderCell scope="col">Pemohon</HeaderCell>
                  <HeaderCell scope="col">Tanggal</HeaderCell>
                  <HeaderCell scope="col">Status</HeaderCell>
                  <HeaderCell scope="col">TTE</HeaderCell>
                  <HeaderCell scope="col">Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {hasil.rows.map((row) => (
                  <Row key={row.id}>
                    <Cell className="modul-mono">{row.number ?? "Belum bernomor"}</Cell>
                    <Cell>
                      <strong>{row.typeName}</strong>
                      {row.purpose ? <span className="modul-muted">{row.purpose}</span> : null}
                    </Cell>
                    <Cell>{row.residentName ?? "—"}</Cell>
                    <Cell>{FORMAT_TANGGAL.format(new Date(`${row.letterDate}T00:00:00`))}</Cell>
                    <Cell>
                      <span className="beranda-chip" data-tone={chipStatus(row.status)}>
                        {LETTER_STATUS_LABELS[row.status]}
                      </span>
                    </Cell>
                    <Cell>
                      <span className="beranda-chip" data-tone={row.tte ? "hijau" : "netral"}>
                        {row.tte ? "Tertanda" : "—"}
                      </span>
                    </Cell>
                    <Cell>
                      <Link
                        href={`/layanan-surat/persuratan/surat/${row.id}`}
                        style={{
                          color: "var(--color-brand)",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Detail →
                      </Link>
                    </Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        )}
        {hasil.pageCount > 1 ? (
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
              Halaman {hasil.page} dari {hasil.pageCount}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              {hasil.page > 1 ? (
                <ButtonLink variant="secondary" href={hrefPage(hasil.page - 1)}>
                  Sebelumnya
                </ButtonLink>
              ) : null}
              {hasil.page < hasil.pageCount ? (
                <ButtonLink variant="secondary" href={hrefPage(hasil.page + 1)}>
                  Berikutnya
                </ButtonLink>
              ) : null}
            </div>
          </div>
        ) : null}
      </TableCard>
    </div>
  );
}
