import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { FormField } from "@/components/ui/form-field";
import { SecondaryText } from "@/components/ui/secondary-text";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import {
  ambilTemplateWebsite,
  daftarTemplateWebsite,
} from "@/features/multi-desa/application/template-website-use-cases";
import {
  LABEL_KATEGORI_TEMPLATE,
  LABEL_STATUS_TEMPLATE,
  type KategoriTemplate,
} from "@/features/multi-desa/domain/template-website";
import {
  PlatformCard,
  PlatformEmpty,
  PlatformPageHeader,
  PlatformStat,
  PlatformStatGrid,
} from "@/features/multi-desa/presentation/platform-ui";

import { pastikanSuperAdmin } from "../../guard";

export const metadata: Metadata = {
  title: "Penggunaan Template",
  robots: { index: false, follow: false },
};

const angka = new Intl.NumberFormat("id-ID");
const tanggal = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

type Props = { searchParams: Promise<{ template?: string | string[] }> };

export default async function SuperAdminPenggunaanTemplatePage({ searchParams }: Props) {
  await pastikanSuperAdmin();

  const [templates, query] = await Promise.all([daftarTemplateWebsite(), searchParams]);
  const templateParam = Array.isArray(query.template) ? query.template[0] : query.template;
  const dipilih = templateParam
    ? templates.find((item) => String(item.id) === templateParam)
    : templates[0];

  if (templateParam && !dipilih) notFound();

  const detail = dipilih ? await ambilTemplateWebsite(dipilih.id) : null;
  const totalPenggunaan = templates.reduce((total, item) => total + item.jumlahTenant, 0);
  const perluPembaruan = templates.reduce((total, item) => total + item.jumlahTertinggal, 0);
  const terbit = templates.filter((item) => item.status === "published").length;
  const penggunaan = detail?.penggunaan ?? [];

  return (
    <>
      <PlatformPageHeader path="/super-admin/template/penggunaan" />

      <PlatformStatGrid columns={4}>
        <PlatformStat
          icon={
            <>
              <rect height="12" rx="1.5" width="16" x="4" y="4" />
              <path d="M4 9h16M9.4 9v7M14.6 9v7" />
            </>
          }
          label="Template terbit"
          note="Terbit di katalog platform"
          tone="hijau"
          value={angka.format(terbit)}
        />
        <PlatformStat
          icon={
            <>
              <circle cx="8.4" cy="8" r="2.8" />
              <path d="M3 19a5.4 5.4 0 0 1 10.8 0M15.8 6.2a2.8 2.8 0 0 1 0 5.4M17.4 14.2A5.4 5.4 0 0 1 21 19" />
            </>
          }
          label="Total penggunaan"
          note="Tenant dengan tema aktif"
          tone="biru"
          value={angka.format(totalPenggunaan)}
        />
        <PlatformStat
          icon={
            <>
              <path d="M20 7v5h-5M4 17v-5h5" />
              <path d="M6.1 9A7 7 0 0 1 18.7 7.4M17.9 15A7 7 0 0 1 5.3 16.6" />
            </>
          }
          label="Perlu pembaruan"
          note="Tenant yang masih di versi lama"
          tone="oranye"
          value={angka.format(perluPembaruan)}
        />
        <PlatformStat
          icon={
            <>
              <path d="M6 3.8h9.2L19 7.6v12.6H6z" />
              <path d="M14.6 3.8v4h4" />
            </>
          }
          label="Template dipilih"
          note={dipilih ? `v${dipilih.version}` : "Belum ada template"}
          tone="ungu"
          value={dipilih ? dipilih.name : "—"}
        />
      </PlatformStatGrid>

      <PlatformCard
        description="Pilih template untuk melihat pemakainya."
        title="Penggunaan dan pembaruan"
      >
        {templates.length > 0 ? (
          <>
            <form className="template-filter-bar" method="get">
              <FormField
                defaultValue={dipilih?.id ?? ""}
                id="template"
                kind="select"
                label="Template"
                name="template"
                options={templates.map((item) => ({
                  value: String(item.id),
                  label: `${item.name} · v${item.version} · ${LABEL_STATUS_TEMPLATE[item.status]}`,
                }))}
              />
              <Button variant="secondary" type="submit">
                Tampilkan
              </Button>
              {dipilih ? (
                <ButtonLink
                  variant="primary"
                  href={`/super-admin/template/${dipilih.id}?tab=penggunaan`}
                >
                  Distribusi versi
                </ButtonLink>
              ) : null}
            </form>

            {dipilih && detail ? (
              <div className="template-usage-summary">
                <div>
                  <span className={`template-status is-${dipilih.status}`}>
                    {LABEL_STATUS_TEMPLATE[dipilih.status]}
                  </span>
                  <strong>{dipilih.name}</strong>
                  <small>
                    {LABEL_KATEGORI_TEMPLATE[dipilih.category as KategoriTemplate] ??
                      dipilih.category}{" "}
                    · slug <code>{dipilih.slug}</code>
                  </small>
                </div>
                <div>
                  <strong>{angka.format(penggunaan.length)}</strong>
                  <span>tenant memakai tema ini</span>
                </div>
                <div>
                  <strong>{angka.format(dipilih.jumlahTertinggal)}</strong>
                  <span>tenant masih di versi lama</span>
                </div>
              </div>
            ) : null}

            {penggunaan.length > 0 ? (
              <TableScroll frame>
                <Table>
                  <THead>
                    <Row>
                      <HeaderCell scope="col">Desa</HeaderCell>
                      <HeaderCell scope="col">Domain</HeaderCell>
                      <HeaderCell scope="col">Tema</HeaderCell>
                      <HeaderCell scope="col">Versi</HeaderCell>
                      <HeaderCell scope="col">Diperbarui</HeaderCell>
                      <HeaderCell scope="col">
                        <span className="sr-only">Aksi</span>
                      </HeaderCell>
                    </Row>
                  </THead>
                  <TBody>
                    {penggunaan.map((item) => (
                      <Row key={item.villageId}>
                        <Cell>
                          <strong>{item.namaDesa ?? "Tanpa nama"}</strong>
                        </Cell>
                        <Cell>
                          {item.domain ?? <SecondaryText>Belum ada domain</SecondaryText>}
                        </Cell>
                        <Cell>{item.themeNama}</Cell>
                        <Cell>
                          <span
                            className={
                              item.versi === dipilih?.version
                                ? "template-version"
                                : "template-version is-warning"
                            }
                          >
                            v{item.versi}
                          </span>
                        </Cell>
                        <Cell>{tanggal.format(new Date(item.diperbaruiPada))}</Cell>
                        <Cell>
                          <ButtonLink
                            variant="secondary"
                            href={`/super-admin/tenant?q=${encodeURIComponent(item.namaDesa ?? "")}`}
                          >
                            Lihat desa
                          </ButtonLink>
                        </Cell>
                      </Row>
                    ))}
                  </TBody>
                </Table>
              </TableScroll>
            ) : (
              <PlatformEmpty
                description="Tenant akan muncul setelah memilih tema ini sebagai tema aktif."
                title="Belum ada tenant yang memakai template ini"
              />
            )}
          </>
        ) : (
          <PlatformEmpty
            description="Tambahkan template terlebih dahulu untuk melihat penggunaan tenant."
            title="Katalog template masih kosong"
          />
        )}
      </PlatformCard>
    </>
  );
}
