import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buatKategoriAction } from "@/app/(admin)/kelompok/actions";
import { PageHeading } from "@/components/shell/page-heading";
import { KATEGORI_KELOMPOK_RESOURCE } from "@/features/kelompok/domain/kelompok";
import { hasPermission } from "@/features/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import styles from "../../kelompok.module.css";
import { FormKategori } from "../form-kategori";

export const metadata: Metadata = { title: "Tambah Kategori Kelompok" };

export default async function KategoriBaruPage() {
  const user = await verifySession();
  if (!hasPermission(user.permissions, KATEGORI_KELOMPOK_RESOURCE, "create")) notFound();

  return (
    <div className="modul-page data-kependudukan-page">
      <Link className={styles.back} href="/kelompok/kategori">
        ← Kembali ke daftar kategori
      </Link>
      <PageHeading>
        <header className="page-heading">
          <div>
            <h1>Tambah Kategori</h1>
            <p>Nama kategori wajib diisi dan unik untuk tipenya.</p>
          </div>
        </header>
      </PageHeading>
      <section className="platform-card data-panel">
        <header>
          <h2>Data Kategori</h2>
          <p>Klasifikasi, tipe, dan deskripsi kategori.</p>
        </header>
        <FormKategori aksi={buatKategoriAction} />
      </section>
    </div>
  );
}
