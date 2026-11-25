import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ubahKelompokAction } from "@/app/(admin)/kelompok/actions";
import { PageHeading } from "@/components/shell/page-heading";
import { getKelompokDetail, getReferensiKelompok } from "@/features/kelompok/application/use-cases";
import { KELOMPOK_RESOURCE } from "@/features/kelompok/domain/kelompok";
import { hasPermission } from "@/features/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import { FormKelompok } from "../../form-kelompok";
import styles from "../../kelompok.module.css";

export const metadata: Metadata = { title: "Ubah Kelompok" };

export default async function UbahKelompokPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [user, detail, referensi] = await Promise.all([
    verifySession(),
    getKelompokDetail(id),
    getReferensiKelompok(null),
  ]);
  if (!hasPermission(user.permissions, KELOMPOK_RESOURCE, "update")) notFound();

  return (
    <div className="modul-page data-kependudukan-page">
      <Link className={styles.back} href={`/kelompok/${id}`}>
        ← Kembali ke rincian kelompok
      </Link>
      <PageHeading>
        <header className="page-heading">
          <div>
            <h1>Ubah Kelompok</h1>
            <p>{detail.name}</p>
          </div>
        </header>
      </PageHeading>
      <section className="platform-card data-panel">
        <header>
          <h2>Data Kelompok</h2>
          <p>Perbarui nama, kode, nomor SK pendirian, kategori, dan deskripsi.</p>
        </header>
        <FormKelompok
          aksi={ubahKelompokAction.bind(null, id)}
          awal={{
            nama: detail.name,
            tipe: detail.type === "lembaga" ? "lembaga" : "kelompok",
            kategoriId: detail.categoryId,
            kode: detail.code ?? "",
            nomorSk: detail.decreeNumber ?? "",
            keterangan: detail.description ?? "",
          }}
          kembaliHref={`/kelompok/${id}`}
          kategori={referensi.kategori}
          penduduk={[]}
        />
      </section>
    </div>
  );
}
