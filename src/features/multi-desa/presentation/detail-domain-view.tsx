import Image from "next/image";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import type { DetailDomainPlatform } from "@/features/multi-desa/application/pemantauan-domain-use-cases";
import { klasifikasiJenisDomain } from "@/features/multi-desa/domain/jenis-domain";
import type { DataDns } from "@/features/multi-desa/domain/status-dns";
import { LABEL_STATUS_SSL, type DataSsl } from "@/features/multi-desa/domain/status-ssl";
import type { ActionState } from "@/lib/action-state";

import {
  Badge,
  mediaUrl,
  Tabs,
  type RiwayatDomainRow,
  type TabDetailDomain,
} from "./detail-domain-bagian";
import { DetailDomainNetworkActions } from "./detail-domain-network-actions";
import { InformasiOverview } from "./detail-domain-overview";
import { TabDns, TabRedirect, TabRiwayat, TabSsl, TabVerifikasi } from "./detail-domain-tabs";
import { ResetAksesAdmin, type HasilResetAksesAdmin } from "./reset-akses-admin-tenant";

export type { RiwayatDomainRow, TabDetailDomain } from "./detail-domain-bagian";

export function DetailDomainView({
  data,
  tab,
  riwayat,
  totalRiwayat,
  aksiDns,
  aksiSsl,
  aksiReset,
  baseDomain,
}: {
  data: DetailDomainPlatform;
  tab: TabDetailDomain;
  riwayat: readonly RiwayatDomainRow[];
  totalRiwayat: number;
  aksiDns: (domainId: number) => Promise<ActionState<DataDns>>;
  aksiSsl: (domainId: number) => Promise<ActionState<DataSsl>>;
  aksiReset: (
    state: ActionState<HasilResetAksesAdmin>,
    formData: FormData,
  ) => Promise<ActionState<HasilResetAksesAdmin>>;
  baseDomain: string;
}) {
  const lokasi = [data.desa.district, data.desa.regency].filter(Boolean).join(", ");
  const domainUtama = data.aliases.find((item) => item.isPrimary)?.domain ?? data.domain.domain;
  const judul = data.desa.name ?? `Desa #${data.desa.id}`;
  const jenisDomain = klasifikasiJenisDomain(data.domain.domain, baseDomain, data.desa.slug);

  return (
    <>
      <PageHeading
        wadah="div"
        kelas="platform-page-header"
        isiJudul={
          <div className="platform-page-heading">
            <div>
              <h1>Detail Domain — {judul}</h1>
              <p>Informasi dan pengaturan domain, DNS, SSL, serta riwayat perubahan.</p>
            </div>
          </div>
        }
      />

      <div className="platform-row-actions domain-detail-toolbar">
        <a
          className="button button-secondary"
          href={`https://${data.domain.domain}`}
          rel="noreferrer"
          target="_blank"
        >
          <span aria-hidden="true">↗</span> Buka Website
        </a>
        <DetailDomainNetworkActions aksiDns={aksiDns} aksiSsl={aksiSsl} domainId={data.domain.id} />
        <ResetAksesAdmin
          aksi={aksiReset}
          className="domain-network-actions"
          formClassName="domain-network-buttons"
          villageId={data.domain.villageId}
        />
        <Link
          aria-label="Kembali ke daftar domain"
          className="button button-secondary"
          href="/super-admin/domain"
        >
          <span aria-hidden="true">←</span> Kembali
        </Link>
      </div>

      <section aria-labelledby="identitas-domain" className="domain-detail-hero">
        <div className="domain-detail-identity">
          {mediaUrl(data.desa.logo, data.desa.id) ? (
            <Image
              alt=""
              className="domain-detail-logo"
              height={64}
              src={mediaUrl(data.desa.logo, data.desa.id) ?? "/images/logo.png"}
              unoptimized
              width={64}
            />
          ) : (
            <span aria-hidden="true" className="domain-detail-logo is-fallback">
              {judul.charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <span className="domain-detail-eyebrow">Tenant desa</span>
            <h2 id="identitas-domain">{judul}</h2>
            <p>{lokasi || "Wilayah desa belum diisi"}</p>
            <p className="domain-detail-muted">
              Tenant #{data.desa.id}
              {data.desa.code ? ` · Kode desa ${data.desa.code}` : ""}
            </p>
            <p className="domain-detail-current">
              <span className="domain-detail-mono">{data.domain.domain}</span>
              <Badge tone={data.domain.isPrimary ? "success" : "info"}>
                {data.domain.isPrimary ? "Utama" : "Alias"}
              </Badge>
            </p>
          </div>
        </div>
        <dl className="domain-detail-hero-facts">
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
            <dt>Jenis domain</dt>
            <dd>
              <Badge tone="info">{jenisDomain === "subdomain" ? "Subdomain" : "Custom"}</Badge>
              <span className="domain-detail-muted">
                {data.domain.isPrimary ? "Domain utama" : "Alias"}
              </span>
            </dd>
          </div>
          <div>
            <dt>Status tenant</dt>
            <dd>
              <Badge tone={data.desa.active ? "success" : "danger"}>
                {data.desa.active ? "Aktif" : "Nonaktif"}
              </Badge>
            </dd>
          </div>
          <div>
            <dt>SSL</dt>
            <dd>
              <Badge
                tone={
                  data.ssl.status === "aktif"
                    ? "success"
                    : data.ssl.status === "segera-expired"
                      ? "warning"
                      : data.ssl.status === "bermasalah"
                        ? "danger"
                        : "neutral"
                }
              >
                {LABEL_STATUS_SSL[data.ssl.status]}
              </Badge>
            </dd>
          </div>
        </dl>
      </section>

      <Tabs
        domainId={data.domain.id}
        jumlahAlias={data.aliases.length}
        jumlahDns={data.dns.addresses.length}
        jumlahRiwayat={totalRiwayat}
        tab={tab}
      />

      {tab === "informasi" ? (
        <InformasiOverview data={data} riwayat={riwayat} totalRiwayat={totalRiwayat} />
      ) : null}
      {tab === "dns" ? <TabDns data={data} /> : null}
      {tab === "ssl" ? <TabSsl data={data} /> : null}
      {tab === "redirect" ? <TabRedirect data={data} /> : null}
      {tab === "verifikasi" ? <TabVerifikasi data={data} /> : null}
      {tab === "riwayat" ? (
        <TabRiwayat rows={riwayat} total={totalRiwayat} villageId={data.domain.villageId} />
      ) : null}
    </>
  );
}
