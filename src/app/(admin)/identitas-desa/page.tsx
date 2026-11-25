import type { Metadata } from "next";

import { PengaturanDesaClient } from "@/features/pengaturan/presentation/pengaturan-desa-client";
import styles from "@/features/pengaturan/presentation/pengaturan-desa.module.css";
import { requirePermission } from "@/lib/dal";

export const metadata: Metadata = { title: "Identitas Desa" };
export default async function PengaturanDesaPage() {
  await requirePermission("pengaturan-desa", "read");
  return (
    <div className={styles.shell}>
      <PengaturanDesaClient />
    </div>
  );
}
