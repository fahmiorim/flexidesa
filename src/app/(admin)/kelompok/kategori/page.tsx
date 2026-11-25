import type { Metadata } from "next";
import Link from "next/link";

import { hapusKategoriAction, hapusKategoriMassalAction } from "@/app/(admin)/kelompok/actions";
import { PageHeading } from "@/components/shell/page-heading";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { listKategoriKelompok } from "@/features/kelompok/application/use-cases";
import { KATEGORI_KELOMPOK_RESOURCE, kelompokTipeLabel } from "@/features/kelompok/domain/kelompok";
import { hasPermission } from "@/features/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import styles from "../kelompok.module.css";

export const metadata: Metadata = { title: "Kategori Kelompok" };

export default async function KategoriKelompokPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, user, kategori] = await Promise.all([
    searchParams,
    verifySession(),
    listKategoriKelompok(),
  ]);
  const bolehTambah = hasPermission(user.permissions, KATEGORI_KELOMPOK_RESOURCE, "create");
  const bolehUbah = hasPermission(user.permissions, KATEGORI_KELOMPOK_RESOURCE, "update");
  const bolehHapus = hasPermission(user.permissions, KATEGORI_KELOMPOK_RESOURCE, "delete");

  return (
    <div className="modul-page data-kependudukan-page">
      <Link className={styles.back} href="/kelompok">
        ← Kembali ke daftar kelompok
      </Link>
      <PageHeading>
        <header className="page-heading">
          <div>
            <h1>Kategori Kelompok</h1>
            <p>Kelola klasifikasi kelompok masyarakat dan lembaga desa.</p>
          </div>
        </header>
      </PageHeading>

      {params.dihapus === "1" ? (
        <p className="form-help" role="status">
          Kategori berhasil dihapus.
        </p>
      ) : null}

      <section className="platform-card data-panel">
        <header>
          <h2>Daftar Kategori</h2>
          <p>{kategori.length} kategori tersedia.</p>
        </header>

        <form action={hapusKategoriMassalAction}>
          <div className={styles.buttonGroups}>
            <div className={styles.buttonGroup} role="group" aria-label="Kelola kategori">
              <span className={styles.buttonGroupLabel}>Kelola</span>
              {bolehTambah ? (
                <Link className="button button-primary" href="/kelompok/kategori/baru">
                  + Tambah
                </Link>
              ) : null}
              {bolehHapus ? (
                <ConfirmSubmit
                  className="button button-danger"
                  message="Hapus kategori yang dicentang? Kategori yang masih dipakai kelompok akan dilewati."
                >
                  Hapus Terpilih
                </ConfirmSubmit>
              ) : null}
            </div>
            <div className={styles.buttonGroup} role="group" aria-label="Kembali">
              <Link className="button button-secondary" href="/kelompok">
                Kembali ke Daftar Kelompok
              </Link>
            </div>
          </div>

          {kategori.length === 0 ? (
            <div className="modul-empty">
              <strong>Belum ada kategori.</strong>
              <p>Tambahkan kategori pertama untuk desa ini.</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    {bolehHapus ? <th>Hapus</th> : null}
                    <th>No.</th>
                    <th>Aksi</th>
                    <th>Kategori</th>
                    <th>Tipe</th>
                    <th>Deskripsi</th>
                    <th>Jumlah Kelompok</th>
                  </tr>
                </thead>
                <tbody>
                  {kategori.map((row, index) => (
                    <tr key={row.id}>
                      {bolehHapus ? (
                        <td>
                          <input
                            aria-label={`Pilih kategori ${row.name}`}
                            name="idCb"
                            type="checkbox"
                            value={row.id}
                          />
                        </td>
                      ) : null}
                      <td>{index + 1}</td>
                      <td>
                        <div className={styles.actions}>
                          {bolehUbah ? (
                            <Link
                              className="button button-ghost"
                              href={`/kelompok/kategori/${row.id}/ubah`}
                            >
                              Ubah
                            </Link>
                          ) : null}
                          {bolehHapus && row.kelompokCount === 0 ? (
                            <ConfirmSubmit
                              className="button button-danger"
                              form={`hapus-kategori-${row.id}`}
                              message={`Hapus kategori ${row.name}?`}
                            >
                              Hapus
                            </ConfirmSubmit>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <strong>{row.name}</strong>
                      </td>
                      <td>{kelompokTipeLabel(row.type)}</td>
                      <td>{row.description ?? "—"}</td>
                      <td>{row.kelompokCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </form>

        {bolehHapus
          ? kategori
              .filter((row) => row.kelompokCount === 0)
              .map((row) => (
                <form action={hapusKategoriAction} id={`hapus-kategori-${row.id}`} key={row.id}>
                  <input name="id" type="hidden" value={row.id} />
                </form>
              ))
          : null}
      </section>
    </div>
  );
}
