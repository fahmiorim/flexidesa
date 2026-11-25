import type { Metadata } from "next";

import { PaketFormBaru } from "@/features/multi-desa/presentation/paket-form-baru";
import { PlatformPageHeader } from "@/features/multi-desa/presentation/platform-ui";

import { pastikanSuperAdmin } from "../../guard";
import { buatPaketAction } from "../actions";

export const metadata: Metadata = {
  title: "Buat Paket",
  robots: { index: false, follow: false },
};

export default async function SuperAdminPaketBaruPage() {
  await pastikanSuperAdmin();

  return (
    <>
      <PlatformPageHeader
        backHref="/super-admin/paket"
        backLabel="Daftar paket"
        path="/super-admin/paket/baru"
      />
      <PaketFormBaru aksi={buatPaketAction} />
    </>
  );
}
