import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { simpanAnggotaKelompokAction } from "@/app/(admin)/kelompok/actions";
import { PageHeading } from "@/components/shell/page-heading";
import { getKelompokDetail, getReferensiKelompok } from "@/features/kelompok/application/use-cases";
import { KELOMPOK_RESOURCE } from "@/features/kelompok/domain/kelompok";
import { hasPermission } from "@/features/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import styles from "../../kelompok.module.css";
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
      <Link className={styles.back} href={`/kelompok/${id}`}>
        ← Kembali ke rincian kelompok
      </Link>
      <PageHeading>
        <header className="page-heading">
          <div>
            <h1>{modeBanyak ? "Tambah Beberapa Anggota" : "Tambah Satu Anggota"}</h1>
            <p>{detail.name}</p>
          </div>
        </header>
      </PageHeading>
      <section className="platform-card data-panel">
        <header>
          <h2>Data Anggota</h2>
          <p>
            {modeBanyak
              ? "Centang penduduk yang akan ditambahkan; semuanya disimpan sebagai anggota biasa."
              : "Pilih penduduk, jabatan, nomor anggota, dan nomor SK jabatan."}
          </p>
        </header>
        {modeBanyak ? (
          <FormAnggotaBanyak kelompokId={id} penduduk={referensi.penduduk} />
        ) : (
          <FormAnggotaKelompok
            aksi={simpanAnggotaKelompokAction.bind(null, id)}
            kelompokId={id}
            penduduk={referensi.penduduk}
          />
        )}
      </section>
    </div>
  );
}
