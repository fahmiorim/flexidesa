import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/button-link";
import { Pagination } from "@/components/ui/pagination";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { SecondaryText } from "@/components/ui/secondary-text";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { ambilAuditPlatform } from "@/features/multi-desa/application/audit-platform-use-cases";
import { daftarDesaSuperAdmin } from "@/features/multi-desa/application/provisioning-use-cases";
import {
  PlatformCard,
  PlatformEmpty,
  PlatformPageHeader,
} from "@/features/multi-desa/presentation/platform-ui";
import { AUDIT_EVENT_LABELS, type AuditEvent } from "@/features/pengaturan/audit/domain/audit";

import { pastikanSuperAdmin } from "../guard";

export const metadata: Metadata = {
  title: "Audit Trail",
  robots: { index: false, follow: false },
};

const waktu = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });
const angka = new Intl.NumberFormat("id-ID");

function labelPeristiwa(event: string): string {
  return event in AUDIT_EVENT_LABELS ? AUDIT_EVENT_LABELS[event as AuditEvent] : event;
}

const opsiPeristiwa = (Object.entries(AUDIT_EVENT_LABELS) as [AuditEvent, string][]).sort((a, b) =>
  a[1].localeCompare(b[1], "id"),
);

export default async function SuperAdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; desa?: string; event?: string; page?: string }>;
}) {
  await pastikanSuperAdmin();

  const params = await searchParams;
  const kataKunci = params.q?.trim() ?? "";
  const desaTerpilih = params.desa?.trim() ?? "";
  const peristiwaTerpilih = params.event?.trim() ?? "";

  const [data, desa] = await Promise.all([
    ambilAuditPlatform({
      page: params.page,
      search: kataKunci,
      desa: desaTerpilih,
      event: peristiwaTerpilih,
    }),
    daftarDesaSuperAdmin(),
  ]);

  const queryFilter = (): string => {
    const query = new URLSearchParams();
    if (kataKunci) query.set("q", kataKunci);
    if (desaTerpilih) query.set("desa", desaTerpilih);
    if (peristiwaTerpilih) query.set("event", peristiwaTerpilih);
    return query.toString();
  };

  const tautan = (halaman = 1): string => {
    const query = new URLSearchParams(queryFilter());
    if (halaman > 1) query.set("page", String(halaman));
    const suffix = query.toString();
    return suffix ? `/super-admin/audit?${suffix}` : "/super-admin/audit";
  };

  const filter = queryFilter();
  const tautanEkspor = `/super-admin/audit/ekspor${filter ? `?${filter}` : ""}`;
  const adaFilter = filter.length > 0;

  return (
    <>
      <PlatformPageHeader path="/super-admin/audit" />
      <PlatformCard
        actions={
          <div className="platform-card-actions">
            <span className="tenant-result-count">
              {angka.format(data.total)} peristiwa · halaman {angka.format(data.page)}/
              {angka.format(data.pageCount)}
            </span>
            <ButtonLink variant="secondary" download href={tautanEkspor}>
              Unduh CSV
            </ButtonLink>
          </div>
        }
        description="Gunakan filter untuk mempersempit peristiwa sebelum mengekspor."
        flush
        title="Riwayat aktivitas"
      >
        <div className="platform-card-body">
          <SearchToolbar
            action="/super-admin/audit"
            filters={[
              {
                name: "desa",
                label: "Desa",
                defaultValue: desaTerpilih,
                options: [
                  { value: "", label: "Semua desa & platform" },
                  ...desa.map((item) => ({
                    value: String(item.id),
                    label: item.name || `Desa #${item.id}`,
                  })),
                ],
              },
              {
                name: "event",
                label: "Peristiwa",
                defaultValue: peristiwaTerpilih,
                options: [
                  { value: "", label: "Semua peristiwa" },
                  ...opsiPeristiwa.map(([kode, label]) => ({ value: kode, label })),
                ],
              },
            ]}
            resetHref={adaFilter ? "/super-admin/audit" : undefined}
            search={{
              name: "q",
              label: "Cari peristiwa, aktor, desa, atau sumber daya",
              placeholder: "Cari peristiwa, aktor, desa, atau resource...",
              defaultValue: kataKunci,
              maxLength: 120,
            }}
          />

          {data.rows.length > 0 ? (
            <TableScroll frame>
              <Table>
                <THead>
                  <Row>
                    <HeaderCell scope="col">Waktu</HeaderCell>
                    <HeaderCell scope="col">Aktor</HeaderCell>
                    <HeaderCell scope="col">Peristiwa</HeaderCell>
                    <HeaderCell scope="col">Resource</HeaderCell>
                    <HeaderCell scope="col">Desa</HeaderCell>
                    <HeaderCell scope="col">IP</HeaderCell>
                    <HeaderCell scope="col">Detail</HeaderCell>
                  </Row>
                </THead>
                <TBody>
                  {data.rows.map((item) => (
                    <Row key={item.id}>
                      <Cell>{waktu.format(new Date(item.createdAt))}</Cell>
                      <Cell>
                        {item.actorName ?? <SecondaryText>Sistem</SecondaryText>}
                        {item.actorId ? (
                          <SecondaryText>{item.actorId.slice(0, 8)}</SecondaryText>
                        ) : null}
                      </Cell>
                      <Cell>
                        <strong>{labelPeristiwa(item.event)}</strong>
                        <SecondaryText>{item.event}</SecondaryText>
                      </Cell>
                      <Cell>
                        {item.resource}
                        {item.resourceId ? <SecondaryText>#{item.resourceId}</SecondaryText> : null}
                      </Cell>
                      <Cell>{item.villageName ?? <SecondaryText>Platform</SecondaryText>}</Cell>
                      <Cell>{item.ipAddress ?? <SecondaryText>—</SecondaryText>}</Cell>
                      <Cell>
                        {item.details ? (
                          <details>
                            <summary>Lihat</summary>
                            <code className="platform-detail">{item.details}</code>
                          </details>
                        ) : (
                          <SecondaryText>—</SecondaryText>
                        )}
                      </Cell>
                    </Row>
                  ))}
                </TBody>
              </Table>
            </TableScroll>
          ) : (
            <PlatformEmpty
              action={
                adaFilter ? (
                  <ButtonLink variant="secondary" href="/super-admin/audit">
                    Bersihkan filter
                  </ButtonLink>
                ) : undefined
              }
              description={
                adaFilter
                  ? "Tidak ada peristiwa yang cocok dengan kombinasi filter saat ini."
                  : "Belum ada peristiwa audit yang tercatat."
              }
              title="Tidak ada hasil"
            />
          )}

          <Pagination
            hrefForPage={tautan}
            page={data.page}
            pageCount={data.pageCount}
            summary={
              <span>
                Halaman {angka.format(data.page)} / {angka.format(data.pageCount)}
              </span>
            }
          />
        </div>
      </PlatformCard>
    </>
  );
}
