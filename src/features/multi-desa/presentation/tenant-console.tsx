"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { FormField } from "@/components/ui/form-field";
import { Pagination } from "@/components/ui/pagination";
import { SecondaryText } from "@/components/ui/secondary-text";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyRow, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import type { StatusRetensi } from "@/features/multi-desa/domain/lifecycle-tenant";
import {
  cocokStatusTenant,
  STATUS_TENANT_FILTER,
  type StatusTenantFilter,
} from "@/features/multi-desa/domain/status-tenant-filter";

import type { AksiKonsol, DesaKonsolRow, DomainKonsolRow } from "./kontrak-konsol-tenant";
import { PanelKelola } from "./panel-kelola-tenant";

export type { AksiKonsol, DesaKonsolRow, DomainKonsolRow } from "./kontrak-konsol-tenant";

const tanggal = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });
const angka = new Intl.NumberFormat("id-ID");

const TAB_STATUS: readonly { nilai: StatusTenantFilter; label: string }[] = [
  { nilai: "semua", label: "Semua tenant" },
  { nilai: "aktif", label: "Aktif" },
  { nilai: "nonaktif", label: "Nonaktif" },
  { nilai: "siap-purge", label: "Siap purge" },
];

const LABEL_RETENSI: Record<StatusRetensi, string> = {
  aktif: "—",
  "masa-tenggang": "Masa tenggang",
  "siap-purge": "Siap purge",
  "sudah-purge": "Sudah di-purge",
};

function RetensiBadge({ desa }: { desa: DesaKonsolRow }) {
  const tone =
    desa.statusRetensi === "aktif"
      ? "success"
      : desa.statusRetensi === "masa-tenggang"
        ? "warning"
        : desa.statusRetensi === "siap-purge"
          ? "danger"
          : "neutral";

  const label =
    desa.statusRetensi === "masa-tenggang" && desa.hariMenujuPurge !== null
      ? `Tenggang ${angka.format(desa.hariMenujuPurge)} hari`
      : LABEL_RETENSI[desa.statusRetensi];

  return <StatusBadge tone={tone}>{label}</StatusBadge>;
}

export function TenantConsole({
  desa,
  domain,
  statusAwal,
  queryAwal = "",
  aksi,
}: {
  desa: DesaKonsolRow[];
  domain: DomainKonsolRow[];
  /** Nilai awal dari query param; halaman memberi `key={statusAwal}` agar URL menang. */
  statusAwal: StatusTenantFilter;
  /** Kata kunci awal dari pencarian top bar (`?q=`). */
  queryAwal?: string;
  aksi: AksiKonsol;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(queryAwal);
  const [status, setStatus] = useState<StatusTenantFilter>(statusAwal);
  const [kecamatan, setKecamatan] = useState("semua");
  const [tema, setTema] = useState("semua");
  const [perHalaman, setPerHalaman] = useState(10);
  const [halaman, setHalaman] = useState(1);
  const [terbuka, setTerbuka] = useState<number | null>(null);

  const pilihStatus = (nilai: StatusTenantFilter) => {
    setStatus(nilai);
    setHalaman(1);
    // Simpan filter di URL agar bisa dibagikan dan tahan refresh. Kata kunci
    // dari top bar dipertahankan supaya tab tidak diam-diam menghapusnya.
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (nilai !== "semua") params.set("status", nilai);
    const suffix = params.toString();
    router.replace(suffix ? `${pathname}?${suffix}` : pathname, { scroll: false });
  };

  const jumlahStatus = useMemo(() => {
    return Object.fromEntries(
      STATUS_TENANT_FILTER.map((nilai) => [
        nilai,
        desa.filter((item) => cocokStatusTenant(item, nilai)).length,
      ]),
    ) as Record<StatusTenantFilter, number>;
  }, [desa]);

  const opsiKecamatan = useMemo(() => {
    const unik = desa
      .map((item) => item.district?.trim())
      .filter((item): item is string => Boolean(item));
    return [...new Set(unik)].sort((a, b) => a.localeCompare(b, "id-ID"));
  }, [desa]);

  const opsiTema = useMemo(() => {
    const label = new Map<string, string>();
    for (const item of desa) {
      const slug = item.tema?.trim();
      if (!slug) continue;
      const nama = item.temaNama?.trim() || slug;
      label.set(slug, item.temaVersi ? `${nama} v${item.temaVersi}` : nama);
    }
    return [...label.entries()].sort((a, b) => a[1].localeCompare(b[1], "id-ID"));
  }, [desa]);

  const adaTanpaKecamatan = desa.some((item) => !item.district?.trim());
  const adaTanpaTema = desa.some((item) => !item.tema?.trim());

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");

    return desa.filter((item) => {
      const searchable = [
        item.name,
        item.code,
        item.domain,
        item.slug,
        item.district,
        item.temaNama,
        item.tema,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("id-ID");

      const cocokKecamatan =
        kecamatan === "semua" ||
        (kecamatan === "__tanpa__" ? !item.district?.trim() : item.district?.trim() === kecamatan);
      const cocokTema =
        tema === "semua" ||
        (tema === "__tanpa__" ? !item.tema?.trim() : item.tema?.trim() === tema);

      return (
        cocokKecamatan &&
        cocokTema &&
        cocokStatusTenant(item, status) &&
        (!normalizedQuery || searchable.includes(normalizedQuery))
      );
    });
  }, [desa, kecamatan, query, status, tema]);

  const totalHalaman = Math.max(1, Math.ceil(filtered.length / perHalaman));
  const halamanAktif = Math.min(halaman, totalHalaman);
  const mulai = (halamanAktif - 1) * perHalaman;
  const terlihat = filtered.slice(mulai, mulai + perHalaman);
  const nomorAkhir = Math.min(mulai + perHalaman, filtered.length);

  return (
    <>
      <Tabs
        active={status}
        items={TAB_STATUS.map((tab) => ({
          id: tab.nilai,
          label: tab.label,
          count: jumlahStatus[tab.nilai],
        }))}
        label="Filter status desa"
        onSelect={pilihStatus}
      />
      <div className="ui-toolbar">
        <FormField
          className="ui-toolbar-search"
          containerClassName="ui-toolbar-search"
          id="tenant-q"
          label="Cari nama desa, kode, slug, domain, atau kecamatan"
          placeholder="Cari desa, domain, atau kode..."
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setHalaman(1);
          }}
        />
        <FormField
          className="ui-toolbar-filter"
          containerClassName="ui-toolbar-filter"
          id="tenant-kecamatan"
          kind="select"
          label="Kecamatan"
          options={[
            { value: "semua", label: "Semua kecamatan" },
            ...opsiKecamatan.map((item) => ({ value: item, label: item })),
            ...(adaTanpaKecamatan ? [{ value: "__tanpa__", label: "Belum diisi" }] : []),
          ]}
          value={kecamatan}
          onChange={(event) => {
            setKecamatan(event.target.value);
            setHalaman(1);
          }}
        />
        <FormField
          className="ui-toolbar-filter"
          containerClassName="ui-toolbar-filter"
          id="tenant-tema"
          kind="select"
          label="Tema"
          options={[
            { value: "semua", label: "Semua tema" },
            ...opsiTema.map(([slug, label]) => ({ value: slug, label })),
            ...(adaTanpaTema ? [{ value: "__tanpa__", label: "Belum memilih tema" }] : []),
          ]}
          value={tema}
          onChange={(event) => {
            setTema(event.target.value);
            setHalaman(1);
          }}
        />
      </div>

      <TableScroll frame>
        <Table>
          <THead>
            <Row>
              <HeaderCell scope="col">#</HeaderCell>
              <HeaderCell scope="col">Desa</HeaderCell>
              <HeaderCell scope="col">Domain</HeaderCell>
              <HeaderCell scope="col">Kecamatan</HeaderCell>
              <HeaderCell scope="col">Tema</HeaderCell>
              <HeaderCell scope="col">Pengguna</HeaderCell>
              <HeaderCell scope="col">Kuota media</HeaderCell>
              <HeaderCell scope="col">Terdaftar</HeaderCell>
              <HeaderCell scope="col">Status</HeaderCell>
              <HeaderCell scope="col">Aksi</HeaderCell>
            </Row>
          </THead>
          <TBody>
            {terlihat.length > 0 ? (
              terlihat.map((item, index) => (
                <TrTenant
                  key={item.id}
                  nomor={mulai + index + 1}
                  desa={item}
                  domain={domain}
                  aksi={aksi}
                  terbuka={terbuka === item.id}
                  onToggle={() =>
                    setTerbuka((sebelumnya) => (sebelumnya === item.id ? null : item.id))
                  }
                />
              ))
            ) : (
              <EmptyRow colSpan={10}>
                {desa.length === 0
                  ? "Belum ada tenant desa yang terdaftar."
                  : "Tidak ada desa yang sesuai dengan pencarian atau filter."}
              </EmptyRow>
            )}
          </TBody>
        </Table>
      </TableScroll>

      <Pagination
        label="Navigasi halaman tenant"
        onPageChange={setHalaman}
        page={halamanAktif}
        pageCount={totalHalaman}
        pageSize={
          <FormField
            className="ui-toolbar-filter"
            containerClassName="ui-toolbar-filter"
            id="tenant-per-halaman"
            kind="select"
            label="Baris per halaman"
            options={[10, 25, 50].map((jumlah) => ({
              value: String(jumlah),
              label: `${jumlah} / halaman`,
            }))}
            value={String(perHalaman)}
            onChange={(event) => {
              setPerHalaman(Number(event.target.value));
              setHalaman(1);
            }}
          />
        }
        summary={
          <span>
            {totalHalaman > 1
              ? `Menampilkan ${angka.format(mulai + 1)}–${angka.format(nomorAkhir)} dari ${angka.format(filtered.length)} desa`
              : `Menampilkan ${angka.format(filtered.length)} dari ${angka.format(desa.length)} desa`}
          </span>
        }
      />
    </>
  );
}

function TrTenant({
  nomor,
  desa,
  domain,
  aksi,
  terbuka,
  onToggle,
}: {
  nomor: number;
  desa: DesaKonsolRow;
  domain: DomainKonsolRow[];
  aksi: AksiKonsol;
  terbuka: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr>
        <td className="tenant-row-number">{nomor}</td>
        <td className="tenant-cell-name">
          <strong>{desa.name || "Tanpa nama"}</strong>
          <SecondaryText>
            Kode: {desa.code || "—"}
            {desa.slug ? ` · ${desa.slug}` : ""}
          </SecondaryText>
        </td>
        <td>{desa.domain || <SecondaryText>Belum diatur</SecondaryText>}</td>
        <td>{desa.district || <SecondaryText>Belum diisi</SecondaryText>}</td>
        <td>
          {desa.temaNama || desa.tema ? (
            <>
              <span>{desa.temaNama || desa.tema}</span>
              <SecondaryText>
                {desa.tema}
                {desa.temaVersi ? ` · v${desa.temaVersi}` : ""}
              </SecondaryText>
            </>
          ) : (
            <SecondaryText>Belum memilih</SecondaryText>
          )}
        </td>
        <td>{angka.format(desa.pengguna)}</td>
        <td>
          {desa.kuotaMediaMb === null ? (
            <SecondaryText>Tanpa batas</SecondaryText>
          ) : (
            `${angka.format(desa.kuotaMediaMb)} MB`
          )}
        </td>
        <td>{tanggal.format(new Date(desa.createdAt))}</td>
        <td>
          <StatusBadge tone={desa.active ? "success" : "warning"}>
            {desa.active ? "Aktif" : "Nonaktif"}
          </StatusBadge>
          {desa.statusRetensi !== "aktif" ? (
            <SecondaryText>
              <RetensiBadge desa={desa} />
            </SecondaryText>
          ) : null}
        </td>
        <td>
          <div className="ui-toolbar-actions">
            <ButtonLink
              aria-label={`Detail ${desa.name || "tenant"}`}
              href={`/super-admin/tenant/${desa.id}`}
              variant="secondary"
            >
              Detail
            </ButtonLink>
            <Button
              aria-expanded={terbuka}
              aria-label={`${terbuka ? "Tutup" : "Kelola"} ${desa.name || "tenant"}`}
              variant="secondary"
              onClick={onToggle}
              type="button"
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
              {terbuka ? "Tutup" : "Kelola"}
            </Button>
          </div>
        </td>
      </tr>
      {terbuka ? (
        <tr className="tenant-panel-row">
          <td colSpan={10}>
            <PanelKelola desa={desa} domain={domain} aksi={aksi} />
          </td>
        </tr>
      ) : null}
    </>
  );
}
