import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ButtonLink } from "@/components/ui/button-link";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import {
  daftarFiturPaketPlatform,
  detailPaketPlatform,
  previewRolloutVersiPaketPlatform,
} from "@/features/multi-desa/application/paket-langganan-use-cases";
import { PaketDetailActions } from "@/features/multi-desa/presentation/paket-detail-actions";
import { PaketIdentitasActions } from "@/features/multi-desa/presentation/paket-identitas-actions";
import {
  PlatformCard,
  PlatformEmpty,
  PlatformPageHeader,
  PlatformStatus,
} from "@/features/multi-desa/presentation/platform-ui";
import { isAppError } from "@/lib/errors";

import { pastikanSuperAdmin } from "../../guard";
import {
  buatDrafVersiPaketAction,
  rolloutVersiPaketAction,
  simpanFiturPaketAction,
  terbitkanVersiPaketAction,
  ubahPaketAction,
  ubahStatusPaketAction,
} from "../actions";

export const metadata: Metadata = {
  title: "Detail Paket",
  robots: { index: false, follow: false },
};

const tanggal = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

export default async function SuperAdminDetailPaketPage({
  params,
}: {
  params: Promise<{ paketId: string }>;
}) {
  await pastikanSuperAdmin();

  const { paketId } = await params;
  if (!/^\d{1,9}$/.test(paketId)) notFound();
  const id = Number.parseInt(paketId, 10);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  let detail;
  try {
    detail = await detailPaketPlatform(id);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  const features = await daftarFiturPaketPlatform();
  const { paket, versions, tenants } = detail;
  const draft = versions.find((version) => version.status === "draft") ?? null;
  const published = versions.find((version) => version.status === "published") ?? null;

  let preview = null;
  let previewError = false;
  if (published) {
    try {
      preview = await previewRolloutVersiPaketPlatform({
        planId: paket.id,
        versionId: published.id,
      });
    } catch {
      previewError = true;
    }
  }
  const affectedTenants = published
    ? tenants.filter((tenant) => tenant.planVersionId !== published.id)
    : [];

  return (
    <>
      <PlatformPageHeader
        actions={
          <ButtonLink variant="secondary" href="/super-admin/paket/tenant">
            Penetapan tenant
          </ButtonLink>
        }
        backHref="/super-admin/paket"
        backLabel="Daftar paket"
        judul={paket.name}
        path={`/super-admin/paket/${paket.id}`}
      />

      <PlatformCard title="Identitas paket">
        <dl className="platform-def">
          <div className="platform-def-row">
            <dt>Slug</dt>
            <dd>
              <code>{paket.slug}</code>
            </dd>
          </div>
          <div className="platform-def-row">
            <dt>Status</dt>
            <dd>
              <PlatformStatus
                aktif={paket.status === "active"}
                label={paket.status === "active" ? "Aktif" : "Diarsipkan"}
              />
            </dd>
          </div>
          <div className="platform-def-row">
            <dt>Versi diterbitkan</dt>
            <dd>{published ? `v${published.version}` : "Belum diterbitkan"}</dd>
          </div>
          <div className="platform-def-row">
            <dt>Draf</dt>
            <dd>{draft ? `v${draft.version}` : "Tidak ada"}</dd>
          </div>
          <div className="platform-def-row">
            <dt>Deskripsi</dt>
            <dd>{paket.description || "Belum ada deskripsi."}</dd>
          </div>
        </dl>
      </PlatformCard>

      <PaketIdentitasActions
        paket={paket}
        ubahAction={ubahPaketAction}
        ubahStatusAction={ubahStatusPaketAction}
      />

      <PaketDetailActions
        affectedTenants={affectedTenants}
        buatDrafAction={buatDrafVersiPaketAction}
        draft={draft}
        features={features}
        key={`${paket.id}-${draft?.id ?? "tanpa-draf"}`}
        planId={paket.id}
        preview={preview}
        previewError={previewError}
        published={published}
        rolloutAction={rolloutVersiPaketAction}
        simpanFiturAction={simpanFiturPaketAction}
        statusPaket={paket.status}
        terbitkanAction={terbitkanVersiPaketAction}
      />

      <div className="platform-split">
        <PlatformCard title="Tenant yang menggunakan paket">
          {tenants.length === 0 ? (
            <PlatformEmpty
              description="Belum ada tenant yang ditetapkan ke paket ini."
              title="Belum ada tenant"
            />
          ) : (
            <TableScroll className="tenant-table-scroll">
              <Table className="tenant-table">
                <THead>
                  <Row>
                    <HeaderCell scope="col">Tenant</HeaderCell>
                    <HeaderCell scope="col">Status</HeaderCell>
                    <HeaderCell scope="col">Versi paket</HeaderCell>
                  </Row>
                </THead>
                <TBody>
                  {tenants.map((tenant) => (
                    <Row key={tenant.villageId}>
                      <Cell>
                        <strong>{tenant.name ?? `Desa #${tenant.villageId}`}</strong>
                        {tenant.code ? <div className="tenant-secondary">{tenant.code}</div> : null}
                      </Cell>
                      <Cell>
                        <PlatformStatus
                          aktif={tenant.active}
                          label={tenant.active ? "Aktif" : "Nonaktif"}
                        />
                      </Cell>
                      <Cell>
                        {tenant.planVersion ? `v${tenant.planVersion}` : "Tidak diketahui"}
                      </Cell>
                    </Row>
                  ))}
                </TBody>
              </Table>
            </TableScroll>
          )}
        </PlatformCard>

        <PlatformCard title="Riwayat versi">
          {versions.length === 0 ? (
            <PlatformEmpty
              description="Belum ada versi paket yang tercatat."
              title="Riwayat kosong"
            />
          ) : (
            <ol className="template-version-list">
              {versions.map((version) => (
                <li key={version.id}>
                  <span
                    className={
                      version.status === "published"
                        ? "template-version is-current"
                        : version.status === "draft"
                          ? "template-version is-warning"
                          : "template-version"
                    }
                  >
                    v{version.version}
                  </span>
                  <div>
                    <strong>
                      {version.status === "published"
                        ? "Diterbitkan"
                        : version.status === "draft"
                          ? "Draf"
                          : "Versi sebelumnya"}
                    </strong>
                    <p>
                      {version.changelog ||
                        `${version.moduleSlugs.length} modul tersimpan dalam snapshot versi ini.`}
                    </p>
                    <small>
                      {version.publishedAt
                        ? `Diterbitkan ${tanggal.format(version.publishedAt)}`
                        : `Dibuat ${tanggal.format(version.createdAt)}`}
                      {` · ${version.tenantCount} tenant`}
                    </small>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </PlatformCard>
      </div>
    </>
  );
}
