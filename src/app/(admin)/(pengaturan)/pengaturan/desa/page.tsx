import type { Metadata } from "next";

import { PengaturanDesaClient } from "@/features/pengaturan/pengaturan/presentation/pengaturan-desa-client";
import styles from "@/features/pengaturan/pengaturan/presentation/pengaturan-desa.module.css";
import { requirePermission } from "@/lib/dal";

export const metadata: Metadata = { title: "Pengaturan Desa" };

export default async function PengaturanDesaMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ bagian?: string | string[] }>;
}) {
  await requirePermission("pengaturan-desa", "read");
  const params = await searchParams;
  const bagian = Array.isArray(params.bagian) ? params.bagian[0] : params.bagian;

  return (
    <div className={styles.shell}>
      <PengaturanDesaClient initialSection={bagian} />
    </div>
  );
}
