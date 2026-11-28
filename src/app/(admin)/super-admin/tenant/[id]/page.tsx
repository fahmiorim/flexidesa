import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ambilDetailTenant } from "@/features/multi-desa/application/tenant-detail-use-cases";
import {
  DetailTenantView,
  type TabDetailTenant,
} from "@/features/multi-desa/presentation/detail-tenant-view";
import { isAppError } from "@/lib/errors";

import { pastikanSuperAdmin } from "../../guard";
import {
  cabutSesiPenggunaDesaAction,
  masukSebagaiAdminAction,
  resetSandiPenggunaDesaAction,
  ubahStatusPenggunaDesaAction,
} from "../../pengguna-desa/actions";

export const metadata: Metadata = {
  title: "Detail Tenant",
  robots: { index: false, follow: false },
};

const TAB_VALID: readonly TabDetailTenant[] = [
  "informasi",
  "domain",
  "paket-tema",
  "pengguna",
  "retensi",
  "riwayat",
];

function tabDari(nilai: string | string[] | undefined): TabDetailTenant {
  const tab = Array.isArray(nilai) ? nilai[0] : nilai;
  return TAB_VALID.find((item) => item === tab) ?? "informasi";
}

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
};

export default async function SuperAdminDetailTenantPage({ params, searchParams }: Props) {
  await pastikanSuperAdmin();

  const { id } = await params;
  if (!/^\d{1,9}$/.test(id)) notFound();

  const desaId = Number.parseInt(id, 10);
  if (!Number.isSafeInteger(desaId) || desaId <= 0) notFound();

  const [{ tab }, data] = await Promise.all([
    searchParams,
    ambilDetailTenant(desaId).catch((error) => {
      if (isAppError(error) && error.code === "NOT_FOUND") return null;
      throw error;
    }),
  ]);

  if (!data) notFound();

  return (
    <DetailTenantView
      aksiPengguna={{
        status: ubahStatusPenggunaDesaAction,
        reset: resetSandiPenggunaDesaAction,
        cabut: cabutSesiPenggunaDesaAction,
        masukSebagai: masukSebagaiAdminAction,
      }}
      data={data}
      tab={tabDari(tab)}
    />
  );
}
