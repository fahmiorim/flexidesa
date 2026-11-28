import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardBody, CardGrid, CardHeader } from "@/components/ui/card";
import { BarList, DonutChart } from "@/components/ui/chart";
import { DefinitionItem, DefinitionList } from "@/components/ui/definition-list";
import { EmptyState } from "@/components/ui/empty-state";
import { SecondaryText } from "@/components/ui/secondary-text";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { ambilKesehatanPlatform } from "@/features/multi-desa/application/kesehatan-platform-use-cases";

import { pastikanSuperAdmin } from "../guard";

export const metadata: Metadata = {
  title: "Kesehatan Sistem",
  robots: { index: false, follow: false },
};

const angka = new Intl.NumberFormat("id-ID");

function persen(nilai: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((nilai / total) * 100);
}

export default async function SuperAdminKesehatanPage() {
  await pastikanSuperAdmin();
  const data = await ambilKesehatanPlatform();

  const totalSsl =
    data.domain.sslAktif +
    data.domain.sslSegeraExpired +
    data.domain.sslBermasalah +
    data.domain.sslBelumDiperiksa;

  const sebaranSsl = [
    { label: "Aktif", value: data.domain.sslAktif },
    { label: "Segera kedaluwarsa", value: data.domain.sslSegeraExpired },
    { label: "Bermasalah", value: data.domain.sslBermasalah },
    { label: "Belum diperiksa", value: data.domain.sslBelumDiperiksa },
  ]
    .filter((item) => item.value > 0)
    .map((item) => ({ ...item, persentase: persen(item.value, totalSsl) }));

  const sebaranDns = [
    { label: "Normal", value: data.domain.dnsNormal },
    { label: "Bermasalah", value: data.domain.dnsBermasalah },
    { label: "Belum diperiksa", value: data.domain.dnsBelumDiperiksa },
  ]
    .filter((item) => item.value > 0)
    .map((item) => ({ ...item, persentase: persen(item.value, data.domain.total) }));

  return (
    <>
      <div className="ui-page-header">
        <div className="ui-page-heading">
          <div>
            <h1>Kesehatan Sistem</h1>
            <p>
              Kondisi basis data, sertifikat, DNS, dan kesiapan tenant. Angka berasal dari cache
              pemeriksaan terakhir, bukan pemantauan waktu nyata.
            </p>
          </div>
        </div>
        <div className="ui-page-actions">
          <ButtonLink variant="secondary" href="/super-admin/domain">
            Periksa domain
          </ButtonLink>
          <ButtonLink variant="secondary" href="/super-admin/pengaturan">
            Konfigurasi
          </ButtonLink>
        </div>
      </div>

      <StatGrid ariaLabel="Ringkasan kesehatan" columns={4}>
        <StatCard
          label="Basis data"
          note={
            data.basisData.terhubung
              ? `Query uji ${angka.format(data.basisData.latensiMs ?? 0)} ms`
              : (data.basisData.error ?? "Tidak dapat terhubung")
          }
          tone={data.basisData.terhubung ? "hijau" : "merah"}
          value={data.basisData.terhubung ? "Terhubung" : "Gagal"}
        />
        <StatCard
          label="SSL aktif"
          note={`${angka.format(data.domain.sslBelumDiperiksa)} domain belum diperiksa`}
          tone={data.domain.sslBermasalah > 0 ? "merah" : "hijau"}
          value={`${angka.format(data.domain.sslAktif)}/${angka.format(data.domain.total)}`}
        />
        <StatCard
          label="Tenant aktif"
          note={`${angka.format(data.tenant.nonaktif)} nonaktif · ${angka.format(data.tenant.total)} total`}
          tone="biru"
          value={angka.format(data.tenant.aktif)}
        />
        <StatCard
          label="Perlu tindakan"
          note="Domain bermasalah, tenant tanpa domain/tema, dan siap purge"
          tone={data.perhatian.length > 0 ? "oranye" : "hijau"}
          value={angka.format(data.perhatian.length)}
        />
      </StatGrid>

      <CardGrid columns={2}>
        <Card variant="panel">
          <CardHeader title="Sertifikat SSL" />
          <CardBody>
            <DonutChart
              centerLabel="domain"
              centerValue={angka.format(totalSsl)}
              items={sebaranSsl}
              kosong={
                <EmptyState
                  description="Tambahkan domain lebih dahulu agar sertifikat dapat diperiksa."
                  title="Belum ada domain"
                />
              }
              total={totalSsl}
            />
          </CardBody>
        </Card>

        <Card variant="panel">
          <CardHeader title="Status DNS" />
          <CardBody>
            <BarList
              items={sebaranDns}
              labelKosong="Tidak ada domain terdaftar untuk diperiksa."
              satuan="domain"
            />
          </CardBody>
        </Card>
      </CardGrid>

      <CardGrid columns={2}>
        <Card variant="panel">
          <CardHeader title="Perlu tindakan" description="Diurutkan dari yang berisiko publik." />
          <CardBody>
            {data.perhatian.length > 0 ? (
              <TableScroll>
                <Table>
                  <THead>
                    <Row>
                      <HeaderCell scope="col">Temuan</HeaderCell>
                      <HeaderCell scope="col">Aksi</HeaderCell>
                    </Row>
                  </THead>
                  <TBody>
                    {data.perhatian.map((item) => (
                      <Row key={item.kunci}>
                        <Cell>
                          <strong>{item.judul}</strong>
                          <SecondaryText>{item.keterangan}</SecondaryText>
                        </Cell>
                        <Cell>
                          <ButtonLink href={item.href} variant="secondary">
                            {item.aksi}
                          </ButtonLink>
                        </Cell>
                      </Row>
                    ))}
                  </TBody>
                </Table>
              </TableScroll>
            ) : (
              <EmptyState
                description="Semua pemeriksaan yang tersedia dalam kondisi baik."
                title="Tidak ada temuan"
              />
            )}
          </CardBody>
        </Card>

        <Card variant="panel">
          <CardHeader title="Kesiapan tenant & integrasi" />
          <CardBody>
            <DefinitionList>
              <DefinitionItem label="Tenant tanpa domain">
                {angka.format(data.tenant.tanpaDomain)}
              </DefinitionItem>
              <DefinitionItem label="Tenant tanpa tema">
                {angka.format(data.tenant.tanpaTema)}
              </DefinitionItem>
              <DefinitionItem label="Siap purge">
                {angka.format(data.tenant.siapPurge)}
              </DefinitionItem>
              <DefinitionItem label="Domain dasar">
                {data.integrasi.baseDomain ?? "Belum diatur"}
              </DefinitionItem>
              <DefinitionItem label="Email">
                <StatusBadge tone={data.integrasi.emailAktif ? "success" : "neutral"}>
                  {data.integrasi.emailAktif ? "Aktif" : "Belum dikonfigurasi"}
                </StatusBadge>
              </DefinitionItem>
              <DefinitionItem label="TTE">
                <StatusBadge tone={data.integrasi.tteAktif ? "success" : "neutral"}>
                  {data.integrasi.tteAktif ? "Aktif" : "Belum dikonfigurasi"}
                </StatusBadge>
              </DefinitionItem>
            </DefinitionList>
          </CardBody>
        </Card>
      </CardGrid>

      <Card variant="panel">
        <CardHeader title="Batasan laporan ini" />
        <CardBody>
          <ul className="ui-catatan">
            <li>
              Pemakaian media per tenant belum dapat dilaporkan: kuota tersimpan, tetapi pemakaian
              belum dicatat.
            </li>
            <li>
              Tidak ada pemantauan otomatis terjadwal; status DNS/SSL adalah hasil pemeriksaan
              manual terakhir dari halaman Domain.
            </li>
            <li>
              Ketersediaan email dan TTE hanya menandakan variabel lingkungan terisi, bukan uji
              kirim nyata.
            </li>
          </ul>
        </CardBody>
      </Card>
    </>
  );
}
