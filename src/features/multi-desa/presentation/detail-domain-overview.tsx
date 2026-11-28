import Image from "next/image";
import Link from "next/link";

import type { DetailDomainPlatform } from "@/features/multi-desa/application/pemantauan-domain-use-cases";
import { LABEL_STATUS_DNS, type DataDns } from "@/features/multi-desa/domain/status-dns";
import {
  hariMenujuKedaluwarsaSsl,
  LABEL_STATUS_SSL,
  type DataSsl,
} from "@/features/multi-desa/domain/status-ssl";
import { mediaUrl } from "@/lib/media-url";

import {
  Badge,
  DnsRecords,
  RiwayatTable,
  tanggalAtau,
  tanggalWaktuAtau,
  type RiwayatDomainRow,
} from "./detail-domain-bagian";
import { PlatformCard } from "./platform-ui";

function StatusDomainCard({ data }: { data: DetailDomainPlatform }) {
  const domainUtama = data.aliases.find((item) => item.isPrimary)?.domain ?? data.domain.domain;
  const jenis = data.domain.isPrimary ? "Domain utama" : "Alias";
  const pemeriksaan = [data.dns.checkedAt, data.ssl.checkedAt]
    .filter((nilai): nilai is Date => nilai instanceof Date)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  return (
    <PlatformCard title="Status Domain">
      <dl className="domain-detail-kv">
        <div>
          <dt>Status tenant</dt>
          <dd>
            <Badge tone={data.desa.active ? "success" : "danger"}>
              {data.desa.active ? "Aktif" : "Nonaktif"}
            </Badge>
          </dd>
        </div>
        <div>
          <dt>Peran domain</dt>
          <dd>
            <Badge tone={data.domain.isPrimary ? "info" : "neutral"}>{jenis}</Badge>
          </dd>
        </div>
        <div>
          <dt>Domain utama</dt>
          <dd>
            <a
              className="domain-detail-link"
              href={`https://${domainUtama}`}
              rel="noreferrer"
              target="_blank"
            >
              {domainUtama}
              <span aria-hidden="true">↗</span>
            </a>
          </dd>
        </div>
        <div>
          <dt>Akses website</dt>
          <dd>
            <a
              className="domain-detail-link"
              href={`https://${data.domain.domain}`}
              rel="noreferrer"
              target="_blank"
            >
              Buka Website
              <span aria-hidden="true">↗</span>
            </a>
          </dd>
        </div>
        <div>
          <dt>Dibuat</dt>
          <dd>{tanggalWaktuAtau(data.domain.createdAt)}</dd>
        </div>
        <div>
          <dt>Pemeriksaan terakhir</dt>
          <dd>{tanggalWaktuAtau(pemeriksaan)}</dd>
        </div>
      </dl>
    </PlatformCard>
  );
}

export function StatusSslCard({ ssl }: { ssl: DataSsl }) {
  const hari = hariMenujuKedaluwarsaSsl(ssl.validTo);
  const tone =
    ssl.status === "aktif"
      ? "success"
      : ssl.status === "segera-expired"
        ? "warning"
        : ssl.status === "bermasalah"
          ? "danger"
          : "neutral";

  return (
    <PlatformCard
      actions={
        <Link className="platform-card-link" href="?tab=ssl">
          Detail →
        </Link>
      }
      title="Status SSL"
    >
      <dl className="domain-detail-kv">
        <div>
          <dt>Status</dt>
          <dd>
            <Badge tone={tone}>{LABEL_STATUS_SSL[ssl.status]}</Badge>
          </dd>
        </div>
        <div>
          <dt>Masa berlaku</dt>
          <dd>
            {ssl.validTo ? (
              <>
                {tanggalAtau(ssl.validTo)}
                {hari !== null ? <span className="domain-detail-muted"> ({hari} hari)</span> : null}
              </>
            ) : (
              "Belum terbaca"
            )}
          </dd>
        </div>
        <div>
          <dt>Penerbit</dt>
          <dd>{ssl.issuer ?? "Belum terbaca"}</dd>
        </div>
        <div>
          <dt>Auto renew</dt>
          <dd className="domain-detail-muted">Tidak dikelola aplikasi</dd>
        </div>
        <div>
          <dt>Diperiksa</dt>
          <dd>{tanggalWaktuAtau(ssl.checkedAt)}</dd>
        </div>
      </dl>
      {ssl.error ? (
        <p className="domain-detail-alert" role="status">
          {ssl.error}
        </p>
      ) : null}
      <p className="domain-detail-note">
        Aplikasi hanya memeriksa sertifikat yang sudah terpasang. Penerbitan dan perpanjangan
        sertifikat tetap dilakukan di server/reverse proxy.
      </p>
    </PlatformCard>
  );
}

function PreviewCard({ data }: { data: DetailDomainPlatform }) {
  const logo = mediaUrl(data.desa.logo, data.desa.id);
  const lokasi = [data.desa.district, data.desa.regency, data.desa.province]
    .filter(Boolean)
    .join(", ");
  const inisial = (data.desa.name ?? "Desa").trim().charAt(0).toUpperCase();

  return (
    <PlatformCard
      actions={
        <a
          className="platform-card-link"
          href={`https://${data.domain.domain}`}
          rel="noreferrer"
          target="_blank"
        >
          Buka Website →
        </a>
      }
      title="Pratinjau Website"
    >
      <div className="domain-site-preview">
        <div className="domain-site-browser">
          <span aria-hidden="true" className="domain-site-dots">
            <i />
            <i />
            <i />
          </span>
          <span>{data.domain.domain}</span>
        </div>
        <div className="domain-site-hero">
          <span className="domain-site-eyebrow">Website Resmi Desa</span>
          <div className="domain-site-title">
            {logo ? (
              <Image alt="" height={44} src={logo} unoptimized width={44} />
            ) : (
              <span aria-hidden="true" className="domain-site-logo">
                {inisial}
              </span>
            )}
            <div>
              <h3>{data.desa.name ?? `Desa #${data.desa.id}`}</h3>
              <p>{lokasi || "Wilayah desa belum diisi"}</p>
            </div>
          </div>
          <span className="domain-site-cta">Lihat Profil Desa →</span>
        </div>
        <dl className="domain-site-meta">
          <div>
            <dt>Domain</dt>
            <dd>{data.domain.domain}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{data.desa.active ? "Aktif" : "Nonaktif"}</dd>
          </div>
          <div>
            <dt>SSL</dt>
            <dd>{LABEL_STATUS_SSL[data.ssl.status]}</dd>
          </div>
        </dl>
      </div>
      <p className="domain-detail-note">
        Pratinjau disusun dari identitas tenant dan domain aktif, bukan tangkapan layar situs.
      </p>
    </PlatformCard>
  );
}

function DnsOverviewCard({ dns }: { dns: DataDns }) {
  return (
    <PlatformCard
      actions={
        <Link className="platform-card-link" href="?tab=dns">
          Detail DNS →
        </Link>
      }
      title="DNS Records"
    >
      <div className="domain-detail-card-toolbar">
        <Badge
          tone={
            dns.status === "normal" ? "success" : dns.status === "bermasalah" ? "danger" : "neutral"
          }
        >
          {LABEL_STATUS_DNS[dns.status]}
        </Badge>
        <span className="domain-detail-muted">
          {dns.addresses.length > 0 ? `${dns.addresses.length} alamat tersimpan` : "Belum ada data"}
        </span>
      </div>
      <DnsRecords dns={dns} ringkas />
      <p className="domain-detail-note">
        Cache pemeriksaan menyimpan alamat A/AAAA. Record CNAME/TXT/MX dan TTL belum disimpan.
      </p>
    </PlatformCard>
  );
}

export function RingkasanTeknisCard({ dns }: { dns: DataDns }) {
  const alamat =
    dns.addresses.length === 0
      ? "Belum diperiksa"
      : dns.addresses.length === 1
        ? dns.addresses[0]
        : `${dns.addresses[0]} +${dns.addresses.length - 1}`;

  return (
    <PlatformCard title="Ringkasan Teknis">
      <dl className="domain-detail-kv is-compact">
        <div>
          <dt>Arahkan ke (IP)</dt>
          <dd className="domain-detail-mono">{alamat}</dd>
        </div>
        <div>
          <dt>Web server</dt>
          <dd className="domain-detail-muted">Tidak tersedia</dd>
        </div>
        <div>
          <dt>Status DNS</dt>
          <dd>
            <Badge
              tone={
                dns.status === "normal"
                  ? "success"
                  : dns.status === "bermasalah"
                    ? "danger"
                    : "neutral"
              }
            >
              {LABEL_STATUS_DNS[dns.status]}
            </Badge>
          </dd>
        </div>
        <div>
          <dt>Propagasi DNS</dt>
          <dd className="domain-detail-muted">Tidak diukur</dd>
        </div>
        <div>
          <dt>Masa respons</dt>
          <dd className="domain-detail-muted">Tidak diukur</dd>
        </div>
      </dl>
    </PlatformCard>
  );
}

function PengaturanCard({ data }: { data: DetailDomainPlatform }) {
  const domainUtama = data.aliases.find((item) => item.isPrimary)?.domain ?? data.domain.domain;

  return (
    <PlatformCard title="Pengaturan Domain">
      <ul className="domain-setting-list">
        <li>
          <div>
            <strong>Domain utama</strong>
            <span>{domainUtama}</span>
          </div>
          {data.domain.isPrimary ? (
            <Badge tone="success">Aktif</Badge>
          ) : (
            <Badge tone="neutral">Diatur di Konsol Tenant</Badge>
          )}
        </li>
        <li>
          <div>
            <strong>Redirect ke HTTPS</strong>
            <span>Belum tersedia sebagai pengaturan konsol.</span>
          </div>
          <Badge tone="neutral">Belum tersedia</Badge>
        </li>
        <li>
          <div>
            <strong>WWW → Non-WWW</strong>
            <span>Belum tersedia sebagai pengaturan konsol.</span>
          </div>
          <Badge tone="neutral">Belum tersedia</Badge>
        </li>
        <li>
          <div>
            <strong>Akses maintenance</strong>
            <span>Belum tersedia sebagai pengaturan domain.</span>
          </div>
          <Badge tone="neutral">Belum tersedia</Badge>
        </li>
      </ul>
      <p className="domain-detail-note">
        Pengaturan domain utama dan alias dikelola dari Konsol Tenant. Toggle redirect dan
        maintenance belum disimpan oleh aplikasi.
      </p>
    </PlatformCard>
  );
}

function RiwayatOverviewCard({
  rows,
  total,
}: {
  rows: readonly RiwayatDomainRow[];
  total: number;
}) {
  return (
    <PlatformCard
      actions={
        <Link className="platform-card-link" href="?tab=riwayat">
          Lihat semua ({total}) →
        </Link>
      }
      title="Riwayat Perubahan Terbaru"
    >
      <RiwayatTable rows={rows.slice(0, 5)} />
    </PlatformCard>
  );
}

export function InformasiOverview({
  data,
  riwayat,
  totalRiwayat,
}: {
  data: DetailDomainPlatform;
  riwayat: readonly RiwayatDomainRow[];
  totalRiwayat: number;
}) {
  return (
    <div className="domain-detail-grid">
      <div className="domain-detail-column">
        <StatusDomainCard data={data} />
        <StatusSslCard ssl={data.ssl} />
      </div>
      <div className="domain-detail-column is-wide">
        <PreviewCard data={data} />
        <DnsOverviewCard dns={data.dns} />
        <RiwayatOverviewCard rows={riwayat} total={totalRiwayat} />
      </div>
      <div className="domain-detail-column">
        <RingkasanTeknisCard dns={data.dns} />
        <PengaturanCard data={data} />
      </div>
    </div>
  );
}
