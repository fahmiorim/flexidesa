import Link from "next/link";

import type { DetailDomainPlatform } from "@/features/multi-desa/application/pemantauan-domain-use-cases";
import { LABEL_STATUS_DNS } from "@/features/multi-desa/domain/status-dns";
import type { DomainDesaRow } from "@/features/multi-desa/infrastructure/kelola-desa-repository";

import {
  Badge,
  DnsRecords,
  RiwayatTable,
  tanggalAtau,
  tanggalWaktuAtau,
  type RiwayatDomainRow,
} from "./detail-domain-bagian";
import { RingkasanTeknisCard, StatusSslCard } from "./detail-domain-overview";
import { PlatformCard } from "./platform-ui";

export function TabDns({ data }: { data: DetailDomainPlatform }) {
  return (
    <div className="domain-detail-tab-layout">
      <PlatformCard
        actions={
          <Badge
            tone={
              data.dns.status === "normal"
                ? "success"
                : data.dns.status === "bermasalah"
                  ? "danger"
                  : "neutral"
            }
          >
            {LABEL_STATUS_DNS[data.dns.status]}
          </Badge>
        }
        title="DNS Records"
      >
        <DnsRecords dns={data.dns} />
        <p className="domain-detail-note">
          {" "}
          Sumber data adalah cache pemeriksaan DNS terakhir. Status normal berarti salah satu alamat
          A/AAAA cocok dengan IP server platform; bila IP platform belum diketahui, target tidak
          diperiksa. TTL, CNAME, TXT, MX, dan record lain belum diambil.
        </p>
        {data.dns.error ? (
          <p className="domain-detail-alert" role="status">
            {data.dns.error}
          </p>
        ) : null}
      </PlatformCard>
      <RingkasanTeknisCard dns={data.dns} />
    </div>
  );
}

export function TabSsl({ data }: { data: DetailDomainPlatform }) {
  return (
    <div className="domain-detail-tab-layout">
      <StatusSslCard ssl={data.ssl} />
      <PlatformCard title="Yang diperiksa">
        <dl className="domain-detail-kv is-compact">
          <div>
            <dt>Valid dari</dt>
            <dd>{tanggalAtau(data.ssl.validFrom)}</dd>
          </div>
          <div>
            <dt>Valid sampai</dt>
            <dd>{tanggalAtau(data.ssl.validTo)}</dd>
          </div>
          <div>
            <dt>Penerbit</dt>
            <dd>{data.ssl.issuer ?? "Belum terbaca"}</dd>
          </div>
          <div>
            <dt>Pemeriksaan</dt>
            <dd>{tanggalWaktuAtau(data.ssl.checkedAt)}</dd>
          </div>
        </dl>
        <p className="domain-detail-note">
          Pemeriksaan TLS memakai handshake dengan verifikasi sertifikat. Aplikasi tidak mematikan
          verifikasi TLS dan tidak menerbitkan sertifikat.
        </p>
      </PlatformCard>
    </div>
  );
}

function DaftarAlias({
  aliases,
  domainId,
}: {
  aliases: readonly DomainDesaRow[];
  domainId: number;
}) {
  return (
    <div className="domain-detail-table-wrap">
      <table className="tenant-table domain-alias-table">
        <thead>
          <tr>
            <th>Domain</th>
            <th>Peran</th>
            <th>Ditambahkan</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {aliases.map((alias) => (
            <tr key={alias.id}>
              <td>
                <a
                  className="domain-detail-link"
                  href={`https://${alias.domain}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  {alias.domain}
                  <span aria-hidden="true">↗</span>
                </a>
              </td>
              <td>
                <Badge tone={alias.isPrimary ? "success" : "neutral"}>
                  {alias.isPrimary ? "Utama" : "Alias"}
                </Badge>
              </td>
              <td>{tanggalAtau(alias.createdAt)}</td>
              <td>
                {alias.id === domainId ? (
                  <span className="domain-detail-muted">Sedang dilihat</span>
                ) : alias.isPrimary ? (
                  <span className="domain-detail-muted">—</span>
                ) : (
                  <Link className="domain-detail-link" href={`/super-admin/domain/${alias.id}`}>
                    Lihat detail
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TabRedirect({ data }: { data: DetailDomainPlatform }) {
  return (
    <div className="domain-detail-tab-layout is-single">
      <PlatformCard
        actions={
          <Link className="button button-secondary" href="/super-admin/tenant/tambah">
            Tambah Tenant
          </Link>
        }
        title={`Domain & Alias (${data.aliases.length})`}
      >
        <DaftarAlias aliases={data.aliases} domainId={data.domain.id} />
        <p className="domain-detail-note">
          Semua host di atas milik tenant yang sama. Perubahan domain utama dan penghapusan alias
          dilakukan dari Konsol Tenant. Redirect HTTPS, WWW, dan maintenance belum tersedia sebagai
          pengaturan konsol.
        </p>
      </PlatformCard>
    </div>
  );
}

export function TabVerifikasi({ data }: { data: DetailDomainPlatform }) {
  const dnsSiap = data.dns.status === "normal";
  const sslSiap = data.ssl.status === "aktif" || data.ssl.status === "segera-expired";

  return (
    <div className="domain-detail-tab-layout is-single">
      <PlatformCard title="Verifikasi Domain">
        <p className="domain-detail-lead">
          Verifikasi kepemilikan domain belum diimplementasikan. Pemeriksaan DNS memastikan host
          mengarah ke server platform; pemeriksaan itu tidak membuktikan kontrol atas domain.
        </p>
        <ul className="domain-check-list">
          <li>
            <span className={`domain-check-icon${dnsSiap ? " is-done" : ""}`} aria-hidden="true">
              {dnsSiap ? "✓" : "!"}
            </span>
            <div>
              <strong>DNS mengarah ke server platform</strong>
              <span>{dnsSiap ? "Terpenuhi berdasarkan cache DNS." : "Belum terpenuhi."}</span>
            </div>
            <Badge tone={dnsSiap ? "success" : "warning"}>
              {dnsSiap ? "Terpenuhi" : "Perlu dicek"}
            </Badge>
          </li>
          <li>
            <span className={`domain-check-icon${sslSiap ? " is-done" : ""}`} aria-hidden="true">
              {sslSiap ? "✓" : "!"}
            </span>
            <div>
              <strong>Sertifikat TLS dapat diverifikasi</strong>
              <span>
                {sslSiap ? "Sertifikat terbaca dari handshake nyata." : "Belum terpenuhi."}
              </span>
            </div>
            <Badge tone={sslSiap ? "success" : "warning"}>
              {sslSiap ? "Terpenuhi" : "Perlu dicek"}
            </Badge>
          </li>
          <li>
            <span className="domain-check-icon" aria-hidden="true">
              ×
            </span>
            <div>
              <strong>Challenge kepemilikan domain</strong>
              <span>Belum ada record TXT atau endpoint HTTP challenge yang dikelola aplikasi.</span>
            </div>
            <Badge tone="neutral">Belum tersedia</Badge>
          </li>
        </ul>
        <p className="domain-detail-note">
          Jangan menampilkan status “terverifikasi” sebelum mekanisme challenge dan pencatatan
          hasilnya benar-benar tersedia.
        </p>
      </PlatformCard>
    </div>
  );
}

export function TabRiwayat({
  rows,
  total,
  villageId,
}: {
  rows: readonly RiwayatDomainRow[];
  total: number;
  villageId: number;
}) {
  return (
    <div className="domain-detail-tab-layout is-single">
      <PlatformCard
        actions={
          <Link className="button button-secondary" href={`/super-admin/audit?desa=${villageId}`}>
            Buka audit trail
          </Link>
        }
        description={`${total} peristiwa tenant terbaru. Tabel ini memuat peristiwa tenant, bukan hanya perubahan domain.`}
        title="Riwayat Perubahan"
      >
        <RiwayatTable rows={rows} />
      </PlatformCard>
    </div>
  );
}
