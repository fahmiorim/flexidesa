import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { simpanAnggotaKelompokAction } from "@/app/(admin)/(kependudukan)/kependudukan/kelompok/actions";
import { PageHeading } from "@/components/shell/page-heading";
import {
  getKelompokDetail,
  getReferensiKelompok,
} from "@/features/kependudukan/kelompok/application/use-cases";
import { KELOMPOK_RESOURCE } from "@/features/kependudukan/kelompok/domain/kelompok";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import { FormAnggotaKelompok } from "../form-anggota";
import { FormAnggotaBanyak } from "../form-anggota-banyak";

export const metadata: Metadata = { title: "Tambah Anggota Kelompok" };

export default async function AnggotaBaruPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const query = await searchParams;
  const modeBanyak = query.mode === "banyak";

  const [detail, referensi, user] = await Promise.all([
    getKelompokDetail(id),
    getReferensiKelompok(id),
    verifySession(),
  ]);
  if (!hasPermission(user.permissions, KELOMPOK_RESOURCE, "create")) notFound();

  return (
    <div className="modul-page data-kependudukan-page">
      <PageHeading
        judul={<>{modeBanyak ? "Tambah Beberapa Anggota" : "Tambah Satu Anggota"}</>}
        deskripsi={<>{detail.name}</>}
      />
      <section className="platform-card data-panel">
        <header>
          <h2>Data Anggota</h2>
          <p>
            {modeBanyak
              ? "Centang penduduk, lalu simpan."
              : "Penduduk, jabatan, nomor anggota, SK jabatan."}
          </p>
        </header>
        {modeBanyak ? (
          <FormAnggotaBanyak
            kelompokId={id}
            labelKembali="← Kembali ke rincian kelompok"
            penduduk={referensi.penduduk}
          />
        ) : (
          <FormAnggotaKelompok
            aksi={simpanAnggotaKelompokAction.bind(null, id)}
            kelompokId={id}
            labelKembali="← Kembali ke rincian kelompok"
            penduduk={referensi.penduduk}
          />
        )}
      </section>
    </div>
  );
}
