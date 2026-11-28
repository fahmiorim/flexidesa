import Link from "next/link";
import type { ReactNode } from "react";

import { PageHeading } from "@/components/shell/page-heading";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { BarList, DonutChart, TrendChart } from "@/components/ui/chart";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard, StatGrid, type StatTone } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { headerPlatform } from "@/features/navigation/domain/header-platform";

import type { DistribusiPlatformItem } from "../domain/ringkasan-platform";
import type { TitikTrenTenant } from "../domain/tren-tenant";

/**
 * Kerangka visual konsol platform.
 *
 * Komponen ini hanya penyesuai tipis: seluruh elemen visual (kartu, grid,
 * statistik, grafik, keadaan kosong, badge) berasal dari `src/components/ui/`.
 * Identitas halaman diambil dari `HEADER_PLATFORM` lewat `PlatformPageHeader`.
 */

export function PlatformPageHeader({
  path,
  actions,
  judul,
  deskripsi,
  backHref,
  backLabel,
}: {
  /** Rute halaman; judul dan deskripsi diambil dari `HEADER_PLATFORM`. */
  path: string;
  /** Aksi tambahan di kanan header, mis. tombol tambah tenant. */
  actions?: ReactNode;
  /** Judul dinamis, mis. nama template pada halaman detail. */
  judul?: string;
  deskripsi?: string;
  /** Tautan kembali di atas judul. */
  backHref?: string;
  backLabel?: string;
}) {
  const { title, description, aksi } = headerPlatform(path);

  return (
    <PageHeading
      wadah="div"
      kelas="ui-page-header"
      isiJudul={
        <div className="ui-page-heading">
          {backHref ? (
            <Link className="ui-back-link" href={backHref} key="kembali">
              ← {backLabel ?? "Kembali"}
            </Link>
          ) : null}
          <div key="judul">
            <h1>{judul ?? title}</h1>
            <p>{deskripsi ?? description}</p>
          </div>
        </div>
      }
      aksi={
        aksi || actions ? (
          <div className="ui-page-actions">
            {aksi ? (
              <Link className="button button-secondary" href={aksi.href} key="aksi-header">
                {aksi.label}
              </Link>
            ) : null}
            {actions}
          </div>
        ) : null
      }
    />
  );
}

/** Kartu panel bersama; `flush` dipakai bila isi kartu berupa tabel penuh. */
export function PlatformCard({
  title,
  description,
  actions,
  flush = false,
  children,
}: {
  title?: string;
  description?: ReactNode;
  actions?: ReactNode;
  flush?: boolean;
  children: ReactNode;
}) {
  return (
    <Card variant="panel">
      {title ? (
        <CardHeader
          aksi={actions}
          className="ui-card-head-bordered"
          description={description}
          key="kepala"
          title={title}
        />
      ) : null}
      <CardBody className={flush ? "is-flush" : ""} key="isi">
        {children}
      </CardBody>
    </Card>
  );
}

/** Grid kartu statistik halaman konsol. */
export function PlatformStatGrid({
  children,
  columns = 5,
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5 | 6;
}) {
  return (
    <StatGrid ariaLabel="Ringkasan angka" columns={columns}>
      {children}
    </StatGrid>
  );
}

/** Kartu KPI konsol; meneruskan seluruh nada ke `StatCard`. */
export function PlatformStat({
  label,
  value,
  note,
  icon,
  tone = "ungu",
}: {
  label: string;
  value: ReactNode;
  note: ReactNode;
  icon: ReactNode;
  tone?: StatTone;
}) {
  return (
    <StatCard
      icon={icon}
      label={label}
      note={note}
      tone={tone}
      utama={tone === "ungu"}
      value={value}
    />
  );
}

/** Grafik pertumbuhan kumulatif. */
export function PlatformTrend({ points }: { points: readonly TitikTrenTenant[] }) {
  return <TrendChart points={points} />;
}

/** Donat distribusi tema/tenant. */
export function PlatformDonut({
  items,
  total,
  centerLabel,
  centerValue,
}: {
  items: readonly DistribusiPlatformItem[];
  total: number;
  centerLabel: string;
  centerValue: ReactNode;
}) {
  return (
    <DonutChart
      centerLabel={centerLabel}
      centerValue={centerValue}
      items={items}
      kosong={
        <PlatformEmpty
          description="Tema aktif akan muncul setelah desa memilih tema publik."
          title="Belum ada tema aktif"
        />
      }
      total={total}
    />
  );
}

/** Daftar bilah distribusi tenant per kategori. */
export function PlatformBarList({
  items,
  labelKosong,
}: {
  items: readonly DistribusiPlatformItem[];
  labelKosong: string;
}) {
  return <BarList items={items} labelKosong={labelKosong} satuan="desa" />;
}

/** Keadaan kosong konsol. */
export function PlatformEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return <EmptyState action={action} description={description} title={title} />;
}

/** Badge status aktif/nonaktif. */
export function PlatformStatus({ aktif, label }: { aktif: boolean; label: string }) {
  return <StatusBadge tone={aktif ? "success" : "warning"}>{label}</StatusBadge>;
}
