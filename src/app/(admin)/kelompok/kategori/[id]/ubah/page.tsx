import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ubahKategoriAction } from "@/app/(admin)/kelompok/actions";
import { PageHeading } from "@/components/shell/page-heading";
import { listKategoriKelompok } from "@/features/kelompok/application/use-cases";
import { isKelompokTipe, KATEGORI_KELOMPOK_RESOURCE } from "@/features/kelompok/domain/kelompok";
import { hasPermission } from "@/features/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import styles from "../../../kelompok.module.css";
import { FormKategori } from "../../form-kategori";

export const metadata: Metadata = { title: "Ubah Kategori Kelompok" };

export default async function KategoriUbahPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [user, kategori] = await Promise.all([verifySession(), listKategoriKelompok()]);
  if (!hasPermission(user.permissions, KATEGORI_KELOMPOK_RESOURCE, "update")) notFound();

  const row = kategori.find((item) => item.id === id) ?? null;
  if (!row || !isKelompokTipe(row.type)) notFound();

  return (
    <div className="modul-page data-kependudukan-page">
      <Link className={styles.back} href="/kelompok/kategori">
        ← Kembali ke daftar kategori
      </Link>
      <PageHeading>
        <header className="page-heading">
          <div>
            <h1>Ubah Kategori</h1>
            <p>{row.name}</p>
          </div>
        </header>
      </PageHeading>
      <section className="platform-card data-panel">
        <header>
          <h2>Data Kategori</h2>
          <p>Perbarui klasifikasi, tipe, dan deskripsi kategori.</p>
        </header>
        <FormKategori
          aksi={ubahKategoriAction.bind(null, id)}
          awal={{ nama: row.name, tipe: row.type, deskripsi: row.description ?? "" }}
        />
      </section>
    </div>
  );
}
