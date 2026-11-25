import type { Metadata } from "next";

import {
  daftarPenetapanPaketPlatform,
  daftarPilihanPaketTenantBaru,
} from "@/features/multi-desa/application/paket-langganan-use-cases";
import { PaketPenetapanForm } from "@/features/multi-desa/presentation/paket-penetapan-form";
import { PlatformCard, PlatformPageHeader } from "@/features/multi-desa/presentation/platform-ui";

import { pastikanSuperAdmin } from "../../guard";
import { tetapkanPaketTenantAction } from "../actions";

export const metadata: Metadata = {
  title: "Paket Tenant",
  robots: { index: false, follow: false },
};

export default async function SuperAdminPaketTenantPage() {
  await pastikanSuperAdmin();

  let tenants;
  let packages;
  try {
    [tenants, packages] = await Promise.all([
      daftarPenetapanPaketPlatform(),
      daftarPilihanPaketTenantBaru(),
    ]);
  } catch {
    return (
      <>
        <PlatformPageHeader path="/super-admin/paket/tenant" />
        <PlatformCard title="Paket tenant tidak dapat dimuat">
          <p className="alert alert-error" role="alert">
            Daftar penetapan paket gagal dimuat. Muat ulang halaman untuk mencoba lagi.
          </p>
        </PlatformCard>
      </>
    );
  }

  // Bentuk yang diharapkan `PaketPenetapanForm` (repository): slug modul mentah
  // di samping ringkasan paket. Use case mengembalikan nama fitur, jadi slug
  // disusun kembali dari sana.
  const pilihan = packages.map((item) => ({
    planId: item.planId,
    planSlug: item.planSlug,
    planName: item.planName,
    description: item.description,
    versionId: item.versionId,
    version: item.version,
    moduleSlugs: item.features.map((fitur) => fitur.slug),
  }));

  return (
    <>
      <PlatformPageHeader path="/super-admin/paket/tenant" />

      <PlatformCard
        description="Penetapan mengubah modul yang dapat diakses tenant."
        title="Tetapkan paket kepada tenant"
      >
        <PaketPenetapanForm aksi={tetapkanPaketTenantAction} packages={pilihan} tenants={tenants} />
      </PlatformCard>
    </>
  );
}
