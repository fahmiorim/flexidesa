import Link from "next/link";

import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardBody, CardGrid, CardHeader } from "@/components/ui/card";
import { DefinitionItem, DefinitionList } from "@/components/ui/definition-list";
import { EmptyState } from "@/components/ui/empty-state";
import { SecondaryText } from "@/components/ui/secondary-text";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import type { DetailTenant } from "@/features/multi-desa/application/tenant-detail-use-cases";
import { AUDIT_EVENT_LABELS, type AuditEvent } from "@/features/pengaturan/audit/domain/audit";

import { PenggunaDesaConsole, type AksiPenggunaDesa } from "./pengguna-desa-console";
import { PlatformStatus } from "./platform-ui";

export type TabDetailTenant =
  "informasi" | "domain" | "paket-tema" | "pengguna" | "retensi" | "riwayat";

const TAB: readonly { id: TabDetailTenant; label: string }[] = [
  { id: "informasi", label: "Informasi" },
  { id: "domain", label: "Domain" },
  { id: "paket-tema", label: "Paket & Tema" },
  { id: "pengguna", label: "Pengguna" },
  { id: "retensi", label: "Kuota & Retensi" },
  { id: "riwayat", label: "Riwayat" },
];

const tanggal = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });
const waktu = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });
const angka = new Intl.NumberFormat("id-ID");

const LABEL_RETENSI: Record<DetailTenant["statusRetensi"], string> = {
  aktif: "Aktif — tanpa masa tenggang",
  "masa-tenggang": "Masa tenggang berjalan",
  "siap-purge": "Siap di-purge",
  "sudah-purge": "Sudah di-purge",
};

function nadaRetensi(status: DetailTenant["statusRetensi"]) {
  if (status === "aktif") return "success" as const;
  if (status === "masa-tenggang") return "warning" as const;
  if (status === "siap-purge") return "danger" as const;
  return "neutral" as const;
}

export function DetailTenantView({
  data,
  tab,
  aksiPengguna,
}: {
  data: DetailTenant;
  tab: TabDetailTenant;
  aksiPengguna: AksiPenggunaDesa;
}) {
  const { desa } = data;
  const judul = desa.name || `Desa #${desa.id}`;
  const href = (id: TabDetailTenant) =>
    id === "informasi"
      ? `/super-admin/tenant/${desa.id}`
      : `/super-admin/tenant/${desa.id}?tab=${id}`;

  return (
    <>
      <div className="ui-page-header">
        <div className="ui-page-heading">
          <Link className="ui-back-link" href="/super-admin/tenant">
            ← Tenant
          </Link>
          <div>
            <h1>Detail Tenant — {judul}</h1>
            <p>Profil desa, domain, paket, pengguna, kuota, dan riwayat dalam satu halaman.</p>
          </div>
        </div>
        <div className="ui-page-actions">
          <ButtonLink variant="secondary" href="/super-admin/domain">
            Lihat domain
          </ButtonLink>
          <ButtonLink variant="primary" href="/super-admin/tenant">
            Konsol tenant
          </ButtonLink>
        </div>
      </div>

      <StatGrid ariaLabel="Ringkasan tenant" columns={5}>
        <StatCard
          label="Status tenant"
          note={desa.active ? "Dapat diakses publik" : "Diblokir dari publik"}
          tone={desa.active ? "hijau" : "merah"}
          value={desa.active ? "Aktif" : "Nonaktif"}
        />
        <StatCard
          label="Domain"
          note={data.domain.length > 0 ? "Termasuk alias" : "Belum berdomain"}
          tone="biru"
          value={angka.format(data.domain.length)}
        />
        <StatCard
          label="Pengguna"
          note="Akun desa terdaftar"
          tone="ungu"
          value={angka.format(data.pengguna.length)}
        />
        <StatCard
          label="Penduduk"
          note="Tercatat pada profil desa"
          tone="oranye"
          value={angka.format(desa.penduduk)}
        />
        <StatCard
          label="Retensi"
          note={
            data.hariMenujuPurge !== null
              ? `${angka.format(data.hariMenujuPurge)} hari menuju purge`
              : "Tidak ada purge terjadwal"
          }
          tone="biru"
          value={data.statusRetensi === "aktif" ? "Aktif" : "Tenggang"}
        />
      </StatGrid>

      <Card variant="panel">
        <CardHeader className="ui-card-head-bordered">
          <Tabs
            active={tab}
            items={TAB.map((item) => ({
              id: item.id,
              label: item.label,
              href: href(item.id),
              count:
                item.id === "domain"
                  ? data.domain.length
                  : item.id === "pengguna"
                    ? data.pengguna.length
                    : undefined,
            }))}
            label="Bagian detail tenant"
          />
        </CardHeader>
        <CardBody>
          {tab === "informasi" ? (
            <CardGrid columns={2}>
              <Card variant="panel">
                <CardHeader title="Identitas desa" />
                <CardBody>
                  <DefinitionList>
                    <DefinitionItem label="Nama">{judul}</DefinitionItem>
                    <DefinitionItem label="Kode desa">{desa.code ?? "—"}</DefinitionItem>
                    <DefinitionItem label="Slug">{desa.slug ?? "—"}</DefinitionItem>
                    <DefinitionItem label="Kecamatan">
                      {desa.district ?? "Belum diisi"}
                    </DefinitionItem>
                    <DefinitionItem label="Kabupaten">
                      {desa.regency ?? "Belum diisi"}
                    </DefinitionItem>
                    <DefinitionItem label="Terdaftar">
                      {tanggal.format(new Date(desa.createdAt))}
                    </DefinitionItem>
                  </DefinitionList>
                </CardBody>
              </Card>
              <Card variant="panel">
                <CardHeader title="Akses & tema" />
                <CardBody>
                  <DefinitionList>
                    <DefinitionItem label="Tema website">
                      {desa.tema
                        ? `${desa.temaNama ?? desa.tema}${desa.temaVersi ? ` · v${desa.temaVersi}` : ""}`
                        : "Belum memilih tema"}
                    </DefinitionItem>
                    <DefinitionItem label="Paket langganan">
                      {data.paket?.nama
                        ? `${data.paket.nama}${data.paket.versi ? ` · v${data.paket.versi}` : ""}`
                        : "Belum ditetapkan"}
                    </DefinitionItem>
                    <DefinitionItem label="Status">
                      <PlatformStatus
                        aktif={desa.active}
                        label={desa.active ? "Aktif" : "Nonaktif"}
                      />
                    </DefinitionItem>
                  </DefinitionList>
                </CardBody>
              </Card>
            </CardGrid>
          ) : null}

          {tab === "domain" ? (
            data.domain.length > 0 ? (
              <TableScroll>
                <Table>
                  <THead>
                    <Row>
                      <HeaderCell scope="col">Domain</HeaderCell>
                      <HeaderCell scope="col">Peran</HeaderCell>
                      <HeaderCell scope="col">Aksi</HeaderCell>
                    </Row>
                  </THead>
                  <TBody>
                    {data.domain.map((item) => (
                      <Row key={item.id}>
                        <Cell>{item.domain}</Cell>
                        <Cell>
                          <StatusBadge tone={item.isPrimary ? "success" : "neutral"}>
                            {item.isPrimary ? "Utama" : "Alias"}
                          </StatusBadge>
                        </Cell>
                        <Cell>
                          <ButtonLink variant="secondary" href={`/super-admin/domain/${item.id}`}>
                            Detail domain
                          </ButtonLink>
                        </Cell>
                      </Row>
                    ))}
                  </TBody>
                </Table>
              </TableScroll>
            ) : (
              <EmptyState
                description="Tambahkan domain lewat panel kelola tenant agar website desa dapat diakses publik."
                title="Belum ada domain"
              />
            )
          ) : null}

          {tab === "paket-tema" ? (
            <CardGrid columns={2}>
              <Card variant="panel">
                <CardHeader
                  aksi={
                    <ButtonLink variant="secondary" href="/super-admin/paket/tenant">
                      Ubah paket
                    </ButtonLink>
                  }
                  title="Paket langganan"
                />
                <CardBody>
                  <DefinitionList>
                    <DefinitionItem label="Paket">
                      {data.paket?.nama ?? "Belum ditetapkan"}
                    </DefinitionItem>
                    <DefinitionItem label="Slug">{data.paket?.slug ?? "—"}</DefinitionItem>
                    <DefinitionItem label="Versi">
                      {data.paket?.versi ? `v${data.paket.versi}` : "—"}
                    </DefinitionItem>
                  </DefinitionList>
                </CardBody>
              </Card>
              <Card variant="panel">
                <CardHeader
                  aksi={
                    <ButtonLink variant="secondary" href="/super-admin/template/penggunaan">
                      Distribusi tema
                    </ButtonLink>
                  }
                  title="Tema website"
                />
                <CardBody>
                  <DefinitionList>
                    <DefinitionItem label="Tema aktif">
                      {desa.temaNama ?? desa.tema ?? "Belum memilih"}
                    </DefinitionItem>
                    <DefinitionItem label="Slug">{desa.tema ?? "—"}</DefinitionItem>
                    <DefinitionItem label="Versi">
                      {desa.temaVersi ? `v${desa.temaVersi}` : "—"}
                    </DefinitionItem>
                  </DefinitionList>
                </CardBody>
              </Card>
            </CardGrid>
          ) : null}

          {tab === "pengguna" ? (
            <PenggunaDesaConsole
              aksi={aksiPengguna}
              pengguna={data.pengguna}
              tampilkanDesa={false}
            />
          ) : null}

          {tab === "retensi" ? (
            <CardGrid columns={2}>
              <Card variant="panel">
                <CardHeader title="Kuota media & status" />
                <CardBody>
                  <DefinitionList>
                    <DefinitionItem label="Kuota media">
                      {desa.kuotaMediaMb === null
                        ? "Tanpa batas"
                        : `${angka.format(desa.kuotaMediaMb)} MB`}
                    </DefinitionItem>
                    <DefinitionItem label="Status retensi">
                      <StatusBadge tone={nadaRetensi(data.statusRetensi)}>
                        {LABEL_RETENSI[data.statusRetensi]}
                      </StatusBadge>
                    </DefinitionItem>
                    <DefinitionItem label="Nonaktif sejak">
                      {desa.nonaktifSejak ? tanggal.format(new Date(desa.nonaktifSejak)) : "—"}
                    </DefinitionItem>
                    <DefinitionItem label="Purge">
                      {desa.purgedAt ? tanggal.format(new Date(desa.purgedAt)) : "Belum"}
                    </DefinitionItem>
                  </DefinitionList>
                  <p className="form-help">
                    Perubahan kuota, ekspor data, dan purge dijalankan dari panel kelola tenant agar
                    konfirmasi berlapis tetap satu tempat.
                  </p>
                  <ButtonLink variant="secondary" href="/super-admin/tenant">
                    Buka panel kelola
                  </ButtonLink>
                </CardBody>
              </Card>
              <Card variant="panel">
                <CardHeader title="Ringkasan data" />
                <CardBody>
                  <DefinitionList>
                    <DefinitionItem label="Penduduk">{angka.format(desa.penduduk)}</DefinitionItem>
                    <DefinitionItem label="Jenis surat">
                      {angka.format(desa.jenisSurat)}
                    </DefinitionItem>
                    <DefinitionItem label="Akun pengguna">
                      {angka.format(data.pengguna.length)}
                    </DefinitionItem>
                    <DefinitionItem label="Ekspor berlaku">
                      {desa.adaEksporBerlaku ? "Tersedia" : "Belum ada"}
                    </DefinitionItem>
                  </DefinitionList>
                </CardBody>
              </Card>
            </CardGrid>
          ) : null}

          {tab === "riwayat" ? (
            data.audit.rows.length > 0 ? (
              <TableScroll>
                <Table>
                  <THead>
                    <Row>
                      <HeaderCell scope="col">Waktu</HeaderCell>
                      <HeaderCell scope="col">Peristiwa</HeaderCell>
                      <HeaderCell scope="col">Aktor</HeaderCell>
                      <HeaderCell scope="col">Resource</HeaderCell>
                    </Row>
                  </THead>
                  <TBody>
                    {data.audit.rows.map((baris) => (
                      <Row key={baris.id}>
                        <Cell>{waktu.format(new Date(baris.createdAt))}</Cell>
                        <Cell>
                          {AUDIT_EVENT_LABELS[baris.event as AuditEvent] ?? baris.event}
                          <SecondaryText>{baris.event}</SecondaryText>
                        </Cell>
                        <Cell>{baris.actorName ?? "Sistem"}</Cell>
                        <Cell>
                          {baris.resource}
                          {baris.resourceId ? (
                            <SecondaryText>#{baris.resourceId}</SecondaryText>
                          ) : null}
                        </Cell>
                      </Row>
                    ))}
                  </TBody>
                </Table>
              </TableScroll>
            ) : (
              <EmptyState
                description="Peristiwa audit tenant akan muncul setelah ada perubahan data."
                title="Belum ada riwayat"
              />
            )
          ) : null}
        </CardBody>
      </Card>
    </>
  );
}
