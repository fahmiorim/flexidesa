import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
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
  title: "Audit Trail Platform",
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
          <form action="/super-admin/audit" className="platform-toolbar" method="get" role="search">
            <label className="tenant-search">
              <span className="sr-only">Cari peristiwa, aktor, desa, atau sumber daya</span>
              <input
                className="form-input"
                defaultValue={kataKunci}
                maxLength={120}
                name="q"
                placeholder="Cari peristiwa, aktor, desa, atau resource..."
                type="search"
              />
            </label>
            <select
              aria-label="Filter desa"
              className="form-input platform-filter"
              defaultValue={desaTerpilih}
              name="desa"
            >
              <option value="">Semua desa &amp; platform</option>
              {desa.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name || `Desa #${item.id}`}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter peristiwa"
              className="form-input platform-filter"
              defaultValue={peristiwaTerpilih}
              name="event"
            >
              <option value="">Semua peristiwa</option>
              {opsiPeristiwa.map(([kode, label]) => (
                <option key={kode} value={kode}>
                  {label}
                </option>
              ))}
            </select>
            <Button variant="primary" type="submit">
              Terapkan
            </Button>
            {adaFilter ? (
              <ButtonLink variant="secondary" href="/super-admin/audit">
                Bersihkan
              </ButtonLink>
            ) : null}
          </form>

          {data.rows.length > 0 ? (
            <TableScroll className="tenant-table-scroll">
              <Table className="tenant-table">
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
                        {item.actorName ?? <span className="tenant-secondary">Sistem</span>}
                        {item.actorId ? (
                          <span className="tenant-secondary">{item.actorId.slice(0, 8)}</span>
                        ) : null}
                      </Cell>
                      <Cell>
                        <strong>{labelPeristiwa(item.event)}</strong>
                        <span className="tenant-secondary">{item.event}</span>
                      </Cell>
                      <Cell>
                        {item.resource}
                        {item.resourceId ? (
                          <span className="tenant-secondary">#{item.resourceId}</span>
                        ) : null}
                      </Cell>
                      <Cell>
                        {item.villageName ?? <span className="tenant-secondary">Platform</span>}
                      </Cell>
                      <Cell>{item.ipAddress ?? <span className="tenant-secondary">—</span>}</Cell>
                      <Cell>
                        {item.details ? (
                          <details>
                            <summary>Lihat</summary>
                            <code className="platform-detail">{item.details}</code>
                          </details>
                        ) : (
                          <span className="tenant-secondary">—</span>
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

          {data.pageCount > 1 ? (
            <div className="platform-pagination">
              {data.page > 1 ? (
                <ButtonLink variant="secondary" href={tautan(data.page - 1)}>
                  Sebelumnya
                </ButtonLink>
              ) : (
                <span aria-disabled="true" className="button button-secondary">
                  Sebelumnya
                </span>
              )}
              <span className="tenant-result-count">
                Halaman {angka.format(data.page)} / {angka.format(data.pageCount)}
              </span>
              {data.page < data.pageCount ? (
                <ButtonLink variant="secondary" href={tautan(data.page + 1)}>
                  Berikutnya
                </ButtonLink>
              ) : (
                <span aria-disabled="true" className="button button-secondary">
                  Berikutnya
                </span>
              )}
            </div>
          ) : null}
        </div>
      </PlatformCard>
    </>
  );
}
