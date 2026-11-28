"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { FormField } from "@/components/ui/form-field";
import { Pagination } from "@/components/ui/pagination";
import { SecondaryText } from "@/components/ui/secondary-text";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Cell,
  EmptyRow,
  HeaderCell,
  Row,
  Table,
  TableScroll,
  TBody,
  THead,
} from "@/components/ui/table";
import type { JenisDomain } from "@/features/multi-desa/domain/jenis-domain";
import {
  LABEL_STATUS_DNS,
  type DataDns,
  type StatusDns,
} from "@/features/multi-desa/domain/status-dns";
import {
  hariMenujuKedaluwarsaSsl,
  LABEL_STATUS_SSL,
  type DataSsl,
  type StatusSsl,
} from "@/features/multi-desa/domain/status-ssl";

/**
 * Daftar domain lintas desa untuk halaman **Desa & Domain → Daftar domain**.
 *
 * Semua status berasal dari cache pemeriksaan DNS/TLS nyata. Domain yang belum
 * pernah diperiksa ditandai "Belum diperiksa", bukan dianggap aktif.
 */

interface DomainConsoleRow {
  id: number;
  villageId: number;
  villageName: string;
  villageSlug: string | null;
  villageDistrict: string | null;
  villageActive: boolean;
  domain: string;
  jenis: JenisDomain;
  isPrimary: boolean;
  createdAt: Date;
  dns: DataDns;
  ssl: DataSsl;
}

type FilterJenis = "semua" | JenisDomain;
type FilterStatus = "semua" | "aktif" | "nonaktif";
type FilterSsl = "semua" | StatusSsl;

interface NilaiFilter {
  kecamatan: string;
  jenis: FilterJenis;
  status: FilterStatus;
  ssl: FilterSsl;
}

const FILTER_AWAL: NilaiFilter = {
  kecamatan: "semua",
  jenis: "semua",
  status: "semua",
  ssl: "semua",
};

const angka = new Intl.NumberFormat("id-ID");
const tanggal = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const PILIHAN_BARIS = [10, 25, 50] as const;

export function DomainConsole({
  rows,
  queryAwal = "",
}: {
  rows: DomainConsoleRow[];
  queryAwal?: string;
}) {
  const [query, setQuery] = useState(queryAwal);
  const [filter, setFilter] = useState<NilaiFilter>(FILTER_AWAL);
  const [draft, setDraft] = useState<NilaiFilter>(FILTER_AWAL);
  const [halaman, setHalaman] = useState(1);
  const [perHalaman, setPerHalaman] = useState<number>(10);

  const pilihanKecamatan = useMemo(
    () =>
      [
        ...new Set(
          rows.map((item) => item.villageDistrict).filter((item): item is string => Boolean(item)),
        ),
      ].sort((a, b) => a.localeCompare(b, "id")),
    [rows],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");

    return rows.filter((item) => {
      const searchable = [
        item.villageName,
        item.villageSlug,
        item.domain,
        item.dns.addresses.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("id-ID");

      const cocokKecamatan =
        filter.kecamatan === "semua" || item.villageDistrict === filter.kecamatan;
      const cocokJenis = filter.jenis === "semua" || item.jenis === filter.jenis;
      const cocokStatus =
        filter.status === "semua" ||
        (filter.status === "aktif" ? item.villageActive : !item.villageActive);
      const cocokSsl = filter.ssl === "semua" || item.ssl.status === filter.ssl;

      return (
        cocokKecamatan &&
        cocokJenis &&
        cocokStatus &&
        cocokSsl &&
        (!normalizedQuery || searchable.includes(normalizedQuery))
      );
    });
  }, [filter, query, rows]);

  const totalHalaman = Math.max(1, Math.ceil(filtered.length / perHalaman));
  const halamanAktif = Math.min(halaman, totalHalaman);
  const mulai = (halamanAktif - 1) * perHalaman;
  const terlihat = filtered.slice(mulai, mulai + perHalaman);
  const nomorAkhir = Math.min(mulai + perHalaman, filtered.length);

  function ubahFilter(aksi: () => void) {
    aksi();
    setHalaman(1);
  }

  function ubahDraft(patch: Partial<NilaiFilter>) {
    setDraft((sebelumnya) => ({ ...sebelumnya, ...patch }));
  }

  function terapkanFilter() {
    setFilter(draft);
    setHalaman(1);
  }

  const filterBerubah =
    draft.kecamatan !== filter.kecamatan ||
    draft.jenis !== filter.jenis ||
    draft.status !== filter.status ||
    draft.ssl !== filter.ssl;

  return (
    <>
      <div className="ui-toolbar domain-toolbar">
        <FormField
          className="ui-toolbar-search"
          containerClassName="ui-toolbar-search"
          id="domain-q"
          label="Cari nama desa, domain, atau tenant"
          placeholder="Cari nama desa, domain, atau tenant..."
          type="search"
          value={query}
          onChange={(event) => ubahFilter(() => setQuery(event.target.value))}
        />
        <FormField
          className="ui-toolbar-filter"
          containerClassName="ui-toolbar-filter"
          id="domain-kecamatan"
          kind="select"
          label="Kecamatan"
          options={[
            { value: "semua", label: "Semua Kecamatan" },
            ...pilihanKecamatan.map((item) => ({ value: item, label: item })),
          ]}
          value={draft.kecamatan}
          onChange={(event) => ubahDraft({ kecamatan: event.target.value })}
        />
        <FormField
          className="ui-toolbar-filter"
          containerClassName="ui-toolbar-filter"
          id="domain-jenis"
          kind="select"
          label="Jenis domain"
          options={[
            { value: "semua", label: "Semua Jenis Domain" },
            { value: "subdomain", label: "Subdomain" },
            { value: "custom", label: "Custom" },
          ]}
          value={draft.jenis}
          onChange={(event) => ubahDraft({ jenis: event.target.value as FilterJenis })}
        />
        <FormField
          className="ui-toolbar-filter"
          containerClassName="ui-toolbar-filter"
          id="domain-status"
          kind="select"
          label="Status desa"
          options={[
            { value: "semua", label: "Semua Status" },
            { value: "aktif", label: "Aktif" },
            { value: "nonaktif", label: "Nonaktif" },
          ]}
          value={draft.status}
          onChange={(event) => ubahDraft({ status: event.target.value as FilterStatus })}
        />
        <FormField
          className="ui-toolbar-filter"
          containerClassName="ui-toolbar-filter"
          id="domain-ssl"
          kind="select"
          label="Status SSL"
          options={[
            { value: "semua", label: "Semua SSL" },
            { value: "aktif", label: "Aktif" },
            { value: "segera-expired", label: "Segera expired" },
            { value: "bermasalah", label: "Bermasalah" },
            { value: "belum-diperiksa", label: "Belum diperiksa" },
          ]}
          value={draft.ssl}
          onChange={(event) => ubahDraft({ ssl: event.target.value as FilterSsl })}
        />
        <div className="ui-toolbar-actions">
          <Button onClick={terapkanFilter} type="button" variant="secondary">
            <svg
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
            >
              <path d="M4 5h16l-6.2 7.2V20l-3.6-2v-5.8Z" />
            </svg>
            Filter{filterBerubah ? " •" : ""}
          </Button>
        </div>
      </div>

      <TableScroll frame>
        <Table className="domain-table">
          <THead>
            <Row>
              <HeaderCell scope="col">#</HeaderCell>
              <HeaderCell scope="col">Nama Desa / Tenant</HeaderCell>
              <HeaderCell scope="col">Alamat Domain</HeaderCell>
              <HeaderCell scope="col">Jenis</HeaderCell>
              <HeaderCell scope="col">Status DNS</HeaderCell>
              <HeaderCell scope="col">Status SSL</HeaderCell>
              <HeaderCell scope="col">Masa Berlaku SSL</HeaderCell>
              <HeaderCell scope="col">Domain Utama</HeaderCell>
              <HeaderCell scope="col">Status</HeaderCell>
              <HeaderCell scope="col">Aksi</HeaderCell>
            </Row>
          </THead>
          <TBody>
            {terlihat.length > 0 ? (
              terlihat.map((item, index) => (
                <Row key={item.id}>
                  <Cell className="tenant-row-number">{mulai + index + 1}</Cell>
                  <Cell className="tenant-cell-name">
                    <strong>{item.villageName}</strong>
                    <SecondaryText>
                      {item.villageSlug ? `Slug: ${item.villageSlug}` : "Slug belum diisi"}
                    </SecondaryText>
                  </Cell>
                  <Cell>
                    <div className="domain-host">
                      <a href={`https://${item.domain}`} rel="noreferrer" target="_blank">
                        {item.domain}
                      </a>
                      <a
                        aria-label={`Buka ${item.domain}`}
                        className="domain-open"
                        href={`https://${item.domain}`}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <svg
                          aria-hidden="true"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.8}
                          viewBox="0 0 24 24"
                        >
                          <path d="M14 4h6v6" />
                          <path d="M20 4 11 13" />
                          <path d="M18 14v5.2A1.8 1.8 0 0 1 16.2 21H5.8A1.8 1.8 0 0 1 4 19.2V8.8A1.8 1.8 0 0 1 5.8 7H11" />
                        </svg>
                      </a>
                    </div>
                  </Cell>
                  <Cell>
                    <span
                      className={
                        item.jenis === "subdomain"
                          ? "domain-type is-subdomain"
                          : "domain-type is-custom"
                      }
                    >
                      {item.jenis === "subdomain" ? "Subdomain" : "Custom"}
                    </span>
                  </Cell>
                  <Cell>
                    <span
                      className={`domain-check ${kelasStatusDns(item.dns.status)}`}
                      title={
                        item.dns.error ??
                        (item.dns.addresses.length > 0 ? item.dns.addresses.join(", ") : undefined)
                      }
                    >
                      <span aria-hidden="true" />
                      {LABEL_STATUS_DNS[item.dns.status]}
                    </span>
                  </Cell>
                  <Cell>
                    <span
                      className={`domain-check ${kelasStatusSsl(item.ssl.status)}`}
                      title={
                        item.ssl.error ??
                        (item.ssl.issuer ? `Issuer: ${item.ssl.issuer}` : undefined)
                      }
                    >
                      <span aria-hidden="true" />
                      {LABEL_STATUS_SSL[item.ssl.status]}
                    </span>
                  </Cell>
                  <Cell>
                    {item.ssl.validTo ? (
                      <>
                        <span>{tanggal.format(new Date(item.ssl.validTo))}</span>
                        <SecondaryText>{teksSisaHari(item.ssl.validTo)}</SecondaryText>
                      </>
                    ) : (
                      <SecondaryText>
                        {item.ssl.status === "belum-diperiksa"
                          ? "Belum diperiksa"
                          : "Tidak terbaca"}
                      </SecondaryText>
                    )}
                  </Cell>
                  <Cell>
                    <span className={item.isPrimary ? "domain-kind is-primary" : "domain-kind"}>
                      {item.isPrimary ? "Utama" : "Alias"}
                    </span>
                  </Cell>
                  <Cell>
                    <StatusBadge tone={item.villageActive ? "success" : "warning"}>
                      {item.villageActive ? "Aktif" : "Nonaktif"}
                    </StatusBadge>
                  </Cell>
                  <Cell>
                    <ButtonLink
                      aria-label={`Detail domain ${item.domain}`}
                      variant="secondary"
                      href={`/super-admin/domain/${item.id}`}
                    >
                      <svg
                        aria-hidden="true"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        viewBox="0 0 24 24"
                      >
                        <path d="M2.5 12s3.6-6 9.5-6 9.5 6 9.5 6-3.6 6-9.5 6-9.5-6-9.5-6Z" />
                        <circle cx="12" cy="12" r="2.8" />
                      </svg>
                      Kelola
                    </ButtonLink>
                  </Cell>
                </Row>
              ))
            ) : (
              <EmptyRow colSpan={10}>
                {rows.length === 0
                  ? "Belum ada domain terdaftar."
                  : "Tidak ada domain yang sesuai dengan pencarian atau filter."}
              </EmptyRow>
            )}
          </TBody>
        </Table>
      </TableScroll>

      <Pagination
        onPageChange={setHalaman}
        page={halamanAktif}
        pageCount={totalHalaman}
        pageSize={
          <FormField
            className="ui-toolbar-filter"
            containerClassName="ui-toolbar-filter"
            id="domain-per-halaman"
            kind="select"
            label="Baris per halaman"
            options={PILIHAN_BARIS.map((jumlah) => ({
              value: String(jumlah),
              label: `${jumlah} / halaman`,
            }))}
            value={String(perHalaman)}
            onChange={(event) => ubahFilter(() => setPerHalaman(Number(event.target.value)))}
          />
        }
        summary={
          <span>
            {filtered.length > 1
              ? `Menampilkan ${angka.format(mulai + 1)}–${angka.format(nomorAkhir)} dari ${angka.format(filtered.length)} domain`
              : `Menampilkan ${angka.format(filtered.length)} dari ${angka.format(rows.length)} domain`}
          </span>
        }
      />
    </>
  );
}

function kelasStatusDns(status: StatusDns): string {
  if (status === "normal") return "is-ok";
  if (status === "bermasalah") return "is-bad";
  return "is-unchecked";
}

function kelasStatusSsl(status: StatusSsl): string {
  if (status === "aktif") return "is-ok";
  if (status === "segera-expired") return "is-warn";
  if (status === "bermasalah") return "is-bad";
  return "is-unchecked";
}

function teksSisaHari(validTo: Date): string {
  const hari = hariMenujuKedaluwarsaSsl(new Date(validTo));
  if (hari === null) return "";
  if (hari < 0) return "Sudah kedaluwarsa";
  if (hari === 0) return "Hari ini";
  return `${angka.format(hari)} hari`;
}
