import type { Metadata } from "next";

import { getWebsiteContentData } from "@/features/info-desa/publik/application/website-admin";

import { BagianAgenda } from "../konten/bagian-agenda";
import { WebsiteAdminShell } from "../website-admin-shell";

export const metadata: Metadata = { title: "Agenda Kegiatan Desa" };

export default async function AgendaKegiatanPage() {
  const { agenda, izin } = await getWebsiteContentData();
  const formatTanggal = (value: Date | string | null) =>
    value
      ? new Intl.DateTimeFormat("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(new Date(value))
      : "Belum dijadwalkan";

  return (
    <WebsiteAdminShell
      title="Agenda Kegiatan"
      description="Jadwal kegiatan desa yang ditayangkan di website publik."
    >
      <BagianAgenda izin={izin} agenda={agenda} formatTanggal={formatTanggal} />
    </WebsiteAdminShell>
  );
}
