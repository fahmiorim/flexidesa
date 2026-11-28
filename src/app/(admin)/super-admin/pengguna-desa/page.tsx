import type { Metadata } from "next";

import { SearchToolbar } from "@/components/ui/search-toolbar";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { daftarPenggunaDesa } from "@/features/multi-desa/application/pengguna-desa-use-cases";
import { daftarDesaSuperAdmin } from "@/features/multi-desa/application/provisioning-use-cases";
import { PenggunaDesaConsole } from "@/features/multi-desa/presentation/pengguna-desa-console";
import { PlatformCard, PlatformPageHeader } from "@/features/multi-desa/presentation/platform-ui";

import { pastikanSuperAdmin } from "../guard";
import {
  cabutSesiPenggunaDesaAction,
  masukSebagaiAdminAction,
  resetSandiPenggunaDesaAction,
  ubahStatusPenggunaDesaAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Pengguna Desa",
  robots: { index: false, follow: false },
};

const angka = new Intl.NumberFormat("id-ID");

type Props = {
  searchParams: Promise<{
    q?: string | string[];
    desa?: string | string[];
    status?: string | string[];
  }>;
};

function satu(nilai: string | string[] | undefined): string {
  return (Array.isArray(nilai) ? nilai[0] : nilai)?.trim() ?? "";
}

export default async function SuperAdminPenggunaDesaPage({ searchParams }: Props) {
  await pastikanSuperAdmin();

  const params = await searchParams;
  const kataKunci = satu(params.q).slice(0, 120);
  const desaParam = satu(params.desa);
  const statusParam = satu(params.status);
  const villageId = /^\d{1,9}$/.test(desaParam) ? Number.parseInt(desaParam, 10) : undefined;
  const aktif =
    statusParam === "aktif" ? "aktif" : statusParam === "nonaktif" ? "nonaktif" : "semua";

  const [pengguna, desa] = await Promise.all([
    daftarPenggunaDesa({ q: kataKunci || undefined, villageId, aktif }),
    daftarDesaSuperAdmin(),
  ]);

  const totalAktif = pengguna.filter((item) => item.active).length;
  const totalSesi = pengguna.reduce((total, item) => total + item.sesiAktif, 0);
  const tanpaRole = pengguna.filter((item) => item.roleSlug === null).length;
  const adaFilter = Boolean(kataKunci || villageId || aktif !== "semua");

  return (
    <>
      <PlatformPageHeader path="/super-admin/pengguna-desa" />

      <StatGrid ariaLabel="Ringkasan pengguna desa" columns={4}>
        <StatCard
          label="Akun desa"
          note="Lintas tenant sesuai filter"
          tone="ungu"
          value={angka.format(pengguna.length)}
        />
        <StatCard
          label="Akun aktif"
          note={`${angka.format(pengguna.length - totalAktif)} nonaktif`}
          tone="hijau"
          value={angka.format(totalAktif)}
        />
        <StatCard
          label="Sesi aktif"
          note="Sesi yang belum kedaluwarsa"
          tone="biru"
          value={angka.format(totalSesi)}
        />
        <StatCard
          label="Tanpa role"
          note="Akun tanpa role tidak dapat membuka konsol desa"
          tone="merah"
          value={angka.format(tanpaRole)}
        />
      </StatGrid>

      <PlatformCard
        description="Cari akun desa mana pun, lalu nonaktifkan, reset sandi, atau cabut sesinya tanpa membuka konsol desa."
        title="Direktori pengguna desa"
      >
        <SearchToolbar
          action="/super-admin/pengguna-desa"
          filters={[
            {
              name: "desa",
              label: "Desa",
              defaultValue: desaParam,
              options: [
                { value: "", label: "Semua desa" },
                ...desa.map((item) => ({
                  value: String(item.id),
                  label: item.name || `Desa #${item.id}`,
                })),
              ],
            },
            {
              name: "status",
              label: "Status",
              defaultValue: aktif === "semua" ? "" : aktif,
              options: [
                { value: "", label: "Semua status" },
                { value: "aktif", label: "Aktif" },
                { value: "nonaktif", label: "Nonaktif" },
              ],
            },
          ]}
          resetHref={adaFilter ? "/super-admin/pengguna-desa" : undefined}
          search={{
            name: "q",
            label: "Cari nama, email, username, atau desa",
            placeholder: "Cari nama, email, username, atau desa...",
            defaultValue: kataKunci,
            maxLength: 120,
          }}
        />

        <PenggunaDesaConsole
          aksi={{
            status: ubahStatusPenggunaDesaAction,
            reset: resetSandiPenggunaDesaAction,
            cabut: cabutSesiPenggunaDesaAction,
            masukSebagai: masukSebagaiAdminAction,
          }}
          pengguna={pengguna}
        />
      </PlatformCard>
    </>
  );
}
