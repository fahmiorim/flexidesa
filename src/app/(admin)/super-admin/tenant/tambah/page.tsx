import type { Metadata } from "next";

import { daftarPilihanPaketTenantBaru } from "@/features/multi-desa/application/paket-langganan-use-cases";
import { daftarTemplateWebsite } from "@/features/multi-desa/application/template-website-use-cases";
import { PlatformPageHeader } from "@/features/multi-desa/presentation/platform-ui";
import { TambahTenantWizard } from "@/features/multi-desa/presentation/tambah-tenant-wizard";
import { env } from "@/lib/env";

import { buatDesaAction } from "../../actions";
import { pastikanSuperAdmin } from "../../guard";

export const metadata: Metadata = {
  title: "Tambah Tenant",
  robots: { index: false, follow: false },
};

export default async function SuperAdminTambahTenantPage() {
  await pastikanSuperAdmin();

  const [semuaTemplate, paket] = await Promise.all([
    daftarTemplateWebsite(),
    daftarPilihanPaketTenantBaru(),
  ]);
  const templates = semuaTemplate
    .filter((item) => item.status === "published")
    .map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      description: item.description,
      version: item.version,
      tokens: item.tokens,
    }));

  return (
    <>
      <PlatformPageHeader judul="Tambah Tenant" path="/super-admin/tenant/tambah" />
      <TambahTenantWizard
        aksiBuat={buatDesaAction}
        baseDomain={env.DESA_BASE_DOMAIN ?? null}
        packages={paket ?? []}
        templates={templates}
      />
    </>
  );
}
