"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
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

function nomorHalaman(aktif: number, total: number): (number | "elipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const nomor = [...new Set([1, total, aktif - 1, aktif, aktif + 1])]
    .filter((item) => item >= 1 && item <= total)
    .sort((a, b) => a - b);
  const hasil: (number | "elipsis")[] = [];

  for (const item of nomor) {
    const sebelumnya = hasil[hasil.length - 1];
    if (typeof sebelumnya === "number" && item - sebelumnya > 1) hasil.push("elipsis");
    hasil.push(item);
  }

  return hasil;
}

function RetensiBadge({ desa }: { desa: DesaKonsolRow }) {
  const kelas =
    desa.statusRetensi === "aktif"
      ? "tenant-status is-active"
      : desa.statusRetensi === "masa-tenggang"
        ? "tenant-status is-grace"
        : desa.statusRetensi === "siap-purge"
          ? "tenant-status is-ready"
          : "tenant-status is-purged";

  const label =
    desa.statusRetensi === "masa-tenggang" && desa.hariMenujuPurge !== null
      ? `Tenggang ${angka.format(desa.hariMenujuPurge)} hari`
      : LABEL_RETENSI[desa.statusRetensi];

  return (
    <span className={kelas}>
      <span aria-hidden="true" />
      {label}
    </span>
  );
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
      <div className="tenant-tabs-row">
        <div aria-label="Filter status desa" className="platform-tabs" role="group">
          {TAB_STATUS.map((tab) => (
            <button
              aria-pressed={status === tab.nilai}
              className="platform-tab"
              key={tab.nilai}
              onClick={() => pilihStatus(tab.nilai)}
              type="button"
            >
              {tab.label}
              <span className="platform-tab-count">{angka.format(jumlahStatus[tab.nilai])}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="tenant-toolbar">
        <label className="tenant-search tenant-search-dengan-ikon">
          <span className="sr-only">Cari nama desa, kode, slug, domain, atau kecamatan</span>
          <span aria-hidden="true" className="tenant-search-icon">
            <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <circle cx="10.8" cy="10.8" r="6.4" />
              <path d="m15.6 15.6 4 4" />
            </svg>
          </span>
          <input
            className="form-input"
            type="search"
            placeholder="Cari desa, domain, atau kode..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setHalaman(1);
            }}
          />
        </label>
        <select
          aria-label="Filter kecamatan"
          className="form-input tenant-filter"
          value={kecamatan}
          onChange={(event) => {
            setKecamatan(event.target.value);
            setHalaman(1);
          }}
        >
          <option value="semua">Semua kecamatan</option>
          {opsiKecamatan.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
          {adaTanpaKecamatan ? <option value="__tanpa__">Belum diisi</option> : null}
        </select>
        <select
          aria-label="Filter tema"
          className="form-input tenant-filter"
          value={tema}
          onChange={(event) => {
            setTema(event.target.value);
            setHalaman(1);
          }}
        >
          <option value="semua">Semua tema</option>
          {opsiTema.map(([slug, label]) => (
            <option key={slug} value={slug}>
              {label}
            </option>
          ))}
          {adaTanpaTema ? <option value="__tanpa__">Belum memilih tema</option> : null}
        </select>
      </div>

      <TableScroll className="tenant-table-scroll">
        <Table className="tenant-table tenant-table-list">
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
              <Row>
                <Cell className="tenant-empty" colSpan={10}>
                  {desa.length === 0
                    ? "Belum ada tenant desa yang terdaftar."
                    : "Tidak ada desa yang sesuai dengan pencarian atau filter."}
                </Cell>
              </Row>
            )}
          </TBody>
        </Table>
      </TableScroll>

      {filtered.length > 0 ? (
        <div className="tenant-pagination">
          <div className="tenant-pagination-summary">
            <span>
              {totalHalaman > 1
                ? `Menampilkan ${angka.format(mulai + 1)}–${angka.format(nomorAkhir)} dari ${angka.format(filtered.length)} desa`
                : `Menampilkan ${angka.format(filtered.length)} dari ${angka.format(desa.length)} desa`}
            </span>
            <span className="sr-only">
              Halaman {angka.format(halamanAktif)} dari {angka.format(totalHalaman)}
            </span>
          </div>
          <div
            aria-label="Navigasi halaman tenant"
            className="tenant-pagination-pages"
            role="group"
          >
            <button
              aria-label="Halaman sebelumnya"
              className="tenant-page-button"
              disabled={halamanAktif <= 1}
              onClick={() => setHalaman(halamanAktif - 1)}
              type="button"
            >
              ‹
            </button>
            {nomorHalaman(halamanAktif, totalHalaman).map((item, index) =>
              item === "elipsis" ? (
                <span className="tenant-page-ellipsis" key={`elipsis-${index}`}>
                  …
                </span>
              ) : (
                <button
                  aria-current={item === halamanAktif ? "page" : undefined}
                  aria-label={`Halaman ${item}`}
                  className="tenant-page-button"
                  key={item}
                  onClick={() => setHalaman(item)}
                  type="button"
                >
                  {item}
                </button>
              ),
            )}
            <button
              aria-label="Halaman berikutnya"
              className="tenant-page-button"
              disabled={halamanAktif >= totalHalaman}
              onClick={() => setHalaman(halamanAktif + 1)}
              type="button"
            >
              ›
            </button>
          </div>
          <label className="tenant-page-size">
            <span className="sr-only">Baris per halaman</span>
            <select
              className="form-input"
              value={perHalaman}
              onChange={(event) => {
                setPerHalaman(Number(event.target.value));
                setHalaman(1);
              }}
            >
              {[10, 25, 50].map((jumlah) => (
                <option key={jumlah} value={jumlah}>
                  {jumlah} / halaman
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
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
          <span className="tenant-secondary">
            Kode: {desa.code || "—"}
            {desa.slug ? ` · ${desa.slug}` : ""}
          </span>
        </td>
        <td>{desa.domain || <span className="tenant-secondary">Belum diatur</span>}</td>
        <td>{desa.district || <span className="tenant-secondary">Belum diisi</span>}</td>
        <td>
          {desa.temaNama || desa.tema ? (
            <>
              <span>{desa.temaNama || desa.tema}</span>
              <span className="tenant-secondary">
                {desa.tema}
                {desa.temaVersi ? ` · v${desa.temaVersi}` : ""}
              </span>
            </>
          ) : (
            <span className="tenant-secondary">Belum memilih</span>
          )}
        </td>
        <td>{angka.format(desa.pengguna)}</td>
        <td>
          {desa.kuotaMediaMb === null ? (
            <span className="tenant-secondary">Tanpa batas</span>
          ) : (
            `${angka.format(desa.kuotaMediaMb)} MB`
          )}
        </td>
        <td>{tanggal.format(new Date(desa.createdAt))}</td>
        <td>
          <span className={desa.active ? "tenant-status is-active" : "tenant-status is-inactive"}>
            <span aria-hidden="true" />
            {desa.active ? "Aktif" : "Nonaktif"}
          </span>
          {desa.statusRetensi !== "aktif" ? (
            <span className="tenant-secondary tenant-status-note">
              <RetensiBadge desa={desa} />
            </span>
          ) : null}
        </td>
        <td>
          <button
            aria-expanded={terbuka}
            aria-label={`${terbuka ? "Tutup" : "Kelola"} ${desa.name || "tenant"}`}
            className="button button-secondary tenant-expand tenant-row-action"
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
          </button>
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
