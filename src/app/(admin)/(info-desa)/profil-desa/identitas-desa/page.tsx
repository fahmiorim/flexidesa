import type { Metadata } from "next";

import { IDENTITAS_DESA_RESOURCE } from "@/features/info-desa/desa/domain/desa";
import { IdentitasDesaClient } from "@/features/pengaturan/pengaturan/presentation/identitas-desa-client";
import styles from "@/features/pengaturan/pengaturan/presentation/pengaturan-desa.module.css";
import { requirePermission } from "@/lib/dal";

export const metadata: Metadata = { title: "Identitas Desa" };
export default async function PengaturanDesaPage() {
  await requirePermission(IDENTITAS_DESA_RESOURCE, "read");
  return (
    <div className={styles.shell}>
      <IdentitasDesaClient />
    </div>
  );
}
