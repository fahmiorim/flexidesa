import Link from "next/link";
import type { ReactNode } from "react";

import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import type { DataDns } from "@/features/multi-desa/domain/status-dns";
import { AUDIT_EVENT_LABELS, type AuditEvent } from "@/features/pengaturan/audit/domain/audit";

import { PlatformEmpty } from "./platform-ui";

export type TabDetailDomain = "informasi" | "dns" | "ssl" | "redirect" | "verifikasi" | "riwayat";

export interface RiwayatDomainRow {
  id: number;
  event: string;
  actorName: string | null;
  resource: string;
  resourceId: string | null;
  details: string | null;
  createdAt: Date;
}

const TAB: readonly { id: TabDetailDomain; label: string }[] = [
  { id: "informasi", label: "Informasi & Overview" },
  { id: "dns", label: "DNS Records" },
  { id: "ssl", label: "SSL & Keamanan" },
  { id: "redirect", label: "Redirect & Alias" },
  { id: "verifikasi", label: "Verifikasi Domain" },
  { id: "riwayat", label: "Riwayat Perubahan" },
];

const tanggal = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });
const tanggalWaktu = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });

export function mediaUrl(value: string | null | undefined, villageId: number): string | null {
  if (!value) return null;

  const segments = value.split(/[\\/]/).filter(Boolean);
  if (
    segments.length === 0 ||
    segments.some((segment) => segment === "." || segment === ".." || segment.includes(".."))
  ) {
    return null;
  }

  const path = segments[0] === String(villageId) ? segments : [String(villageId), ...segments];
  return `/api/publik/media/${path.map(encodeURIComponent).join("/")}`;
}

export function tanggalAtau(nilai: Date | null | undefined, kosong = "Belum tersedia"): string {
  return nilai ? tanggal.format(nilai) : kosong;
}

export function tanggalWaktuAtau(
  nilai: Date | null | undefined,
  kosong = "Belum diperiksa",
): string {
  return nilai ? tanggalWaktu.format(nilai) : kosong;
}

export function labelPeristiwa(event: string): string {
  return event in AUDIT_EVENT_LABELS ? AUDIT_EVENT_LABELS[event as AuditEvent] : event;
}

function detailPeristiwa(row: RiwayatDomainRow): string {
  if (row.details) {
    try {
      const parsed = JSON.parse(row.details) as Record<string, unknown>;
      const domain = parsed.domain;
      const aksi = parsed.aksi;
      if (typeof domain === "string") {
        return [typeof aksi === "string" ? aksi : null, domain].filter(Boolean).join(" · ");
      }
    } catch {
      // Detail audit bukan JSON yang dapat dibaca; jatuh ke resource di bawah.
    }
  }

  return [row.resource, row.resourceId].filter(Boolean).join(" · ") || "—";
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "success" | "warning" | "danger" | "info" | "neutral";
}) {
  return <span className={`domain-badge is-${tone}`}>{children}</span>;
}

export function Tabs({
  domainId,
  tab,
  jumlahDns,
  jumlahAlias,
  jumlahRiwayat,
}: {
  domainId: number;
  tab: TabDetailDomain;
  jumlahDns: number;
  jumlahAlias: number;
  jumlahRiwayat: number;
}) {
  const jumlah: Partial<Record<TabDetailDomain, number>> = {
    dns: jumlahDns,
    redirect: jumlahAlias,
    riwayat: jumlahRiwayat,
  };

  return (
    <nav aria-label="Bagian detail domain" className="domain-detail-tabs">
      {TAB.map((item) => {
        const href =
          item.id === "informasi"
            ? `/super-admin/domain/${domainId}`
            : `/super-admin/domain/${domainId}?tab=${item.id}`;
        const aktif = item.id === tab;
        const total = jumlah[item.id];

        return (
          <Link
            aria-current={aktif ? "page" : undefined}
            className={`domain-detail-tab${aktif ? " is-active" : ""}`}
            href={href}
            key={item.id}
          >
            <span>{item.label}</span>
            {typeof total === "number" && total > 0 ? (
              <span className="domain-detail-tab-count">{total}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function DnsRecords({ dns, ringkas = false }: { dns: DataDns; ringkas?: boolean }) {
  const records = dns.addresses.map((address, index) => ({
    key: `${address}-${index}`,
    tipe: address.includes(":") ? "AAAA" : "A",
    host: "@",
    nilai: address,
  }));

  if (records.length === 0) {
    return (
      <PlatformEmpty
        description={
          dns.error ??
          "Jalankan Cek DNS untuk menyimpan alamat hasil resolusi. Tidak ada alamat contoh yang ditampilkan."
        }
        title="Belum ada record tersimpan"
      />
    );
  }

  return (
    <TableScroll className="domain-detail-table-wrap">
      <Table className="tenant-table domain-record-table">
        <THead>
          <Row>
            <HeaderCell>Tipe</HeaderCell>
            <HeaderCell>Nama Host</HeaderCell>
            <HeaderCell>Nilai / Tujuan</HeaderCell>
            {ringkas ? null : <HeaderCell>TTL</HeaderCell>}
          </Row>
        </THead>
        <TBody>
          {records.map((record) => (
            <Row key={record.key}>
              <Cell>
                <Badge tone="info">{record.tipe}</Badge>
              </Cell>
              <Cell>{record.host}</Cell>
              <Cell className="domain-record-value">{record.nilai}</Cell>
              {ringkas ? null : <Cell className="domain-detail-muted">Tidak disimpan</Cell>}
            </Row>
          ))}
        </TBody>
      </Table>
    </TableScroll>
  );
}

export function RiwayatTable({ rows }: { rows: readonly RiwayatDomainRow[] }) {
  if (rows.length === 0) {
    return (
      <PlatformEmpty
        description="Belum ada peristiwa audit tenant yang tercatat untuk domain ini."
        title="Riwayat masih kosong"
      />
    );
  }

  return (
    <TableScroll className="domain-detail-table-wrap">
      <Table className="tenant-table domain-history-table">
        <THead>
          <Row>
            <HeaderCell>Tanggal &amp; Waktu</HeaderCell>
            <HeaderCell>Aktivitas</HeaderCell>
            <HeaderCell>Detail</HeaderCell>
            <HeaderCell>Oleh</HeaderCell>
          </Row>
        </THead>
        <TBody>
          {rows.map((row) => (
            <Row key={row.id}>
              <Cell>{tanggalWaktu.format(row.createdAt)}</Cell>
              <Cell>
                <Badge tone="info">{labelPeristiwa(row.event)}</Badge>
              </Cell>
              <Cell>{detailPeristiwa(row)}</Cell>
              <Cell>{row.actorName ?? "Sistem"}</Cell>
            </Row>
          ))}
        </TBody>
      </Table>
    </TableScroll>
  );
}
