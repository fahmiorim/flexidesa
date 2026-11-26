import type { Metadata } from "next";
import Link from "next/link";

import { hapusKelompokAction } from "@/app/(admin)/(kependudukan)/kependudukan/kelompok/actions";
import { PageHeading } from "@/components/shell/page-heading";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import {
  getReferensiKelompok,
  listKategoriKelompok,
  listKelompok,
} from "@/features/kependudukan/kelompok/application/use-cases";
import {
  filterKelompokKosong,
  KATEGORI_KELOMPOK_RESOURCE,
  KELOMPOK_RESOURCE,
} from "@/features/kependudukan/kelompok/domain/kelompok";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import { DialogKelompok } from "./dialog-kelompok";
import { KelolaKategoriKelompok } from "./kelola-kategori-kelompok";

export const metadata: Metadata = { title: "Kelompok" };
const number = new Intl.NumberFormat("id-ID");

const inisial = (nama: string) =>
  nama
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((kata) => kata[0])
    .join("")
    .toUpperCase();

export default async function KelompokPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, user] = await Promise.all([searchParams, verifySession()]);
  const pageRaw = typeof params.page === "string" ? Number(params.page) : 1;
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const pageSize = 25;
  const filter = filterKelompokKosong();
  const bolehTambah = hasPermission(user.permissions, KELOMPOK_RESOURCE, "create");
  const bolehUbah = hasPermission(user.permissions, KELOMPOK_RESOURCE, "update");
  const bolehHapus = hasPermission(user.permissions, KELOMPOK_RESOURCE, "delete");
  const bolehKategori = hasPermission(user.permissions, KATEGORI_KELOMPOK_RESOURCE, "read");
  const [initial, referensi, kategori] = await Promise.all([
    listKelompok({ filter, page, pageSize }),
    getReferensiKelompok(null),
    bolehKategori ? listKategoriKelompok() : Promise.resolve([]),
  ]);
  const result =
    page > initial.pageCount
      ? await listKelompok({ filter, page: initial.pageCount, pageSize })
      : initial;
  const halamanHref = (target: number) => `?page=${target}`;

  const editId = Number(typeof params.edit === "string" ? params.edit : "");
  const kelompokEdit = result.rows.find((row) => row.id === editId) ?? null;
  const tutupHref =
    result.page > 1 ? `/kependudukan/kelompok?page=${result.page}` : "/kependudukan/kelompok";

  return (
    <div className="modul-page data-kependudukan-page">
      <PageHeading judul={<>Kelompok</>} deskripsi={<>Kelola kelompok masyarakat.</>} />

      {params.dihapus === "1" ? (
        <p className="form-help" role="status">
          Kelompok berhasil dihapus.
        </p>
      ) : null}

      <section aria-label="Daftar kelompok" className="pd-panel" id="daftar-kelompok">
        <div className="pd-panel-kepala">
          <div>
            <h2>Daftar Kelompok</h2>
            <p>
              {number.format(result.total)} kelompok · halaman {result.page} dari {result.pageCount}
            </p>
          </div>
          <div className="wilayah-toolbar">
            <div className="wilayah-toolbar-grup">
              {bolehKategori ? (
                <KelolaKategoriKelompok
                  bolehHapus={hasPermission(user.permissions, KATEGORI_KELOMPOK_RESOURCE, "delete")}
                  bolehUbah={hasPermission(user.permissions, KATEGORI_KELOMPOK_RESOURCE, "update")}
                  kategori={kategori.map((item) => ({
                    id: item.id,
                    nama: item.name,
                    deskripsi: item.description,
                    jumlahKelompok: item.kelompokCount,
                  }))}
                />
              ) : null}
              <Link className="wilayah-tool" href="/kependudukan/kelompok/cetak" target="_blank">
                <span aria-hidden="true">⧉</span> Cetak
              </Link>
              <Link className="wilayah-tool" href="/kependudukan/kelompok/ekspor">
                Unduh
              </Link>
            </div>
            <DialogKelompok
              awal={
                kelompokEdit
                  ? {
                      id: kelompokEdit.id,
                      nama: kelompokEdit.name,
                      kode: kelompokEdit.code ?? "",
                      nomorSk: kelompokEdit.decreeNumber ?? "",
                      kategoriId: kelompokEdit.categoryId,
                      keterangan: kelompokEdit.description ?? "",
                    }
                  : null
              }
              bolehTambah={bolehTambah || bolehUbah}
              kategori={referensi.kategori}
              tutupHref={tutupHref}
            />
          </div>
        </div>

        <div>
          {result.rows.length === 0 ? (
            <p className="modul-empty">
              Belum ada kelompok. Tambahkan lewat tombol &ldquo;+ Tambah Kelompok&rdquo; di atas.
            </p>
          ) : (
            <div className="modul-table-wrap">
              <table className="modul-table pemerintah-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Kelompok</th>
                    <th>Kategori</th>
                    <th>Ketua</th>
                    <th>Jumlah Anggota</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, index) => (
                    <tr key={row.id}>
                      <td>{(result.page - 1) * result.pageSize + index + 1}</td>
                      <td>
                        <div className="pemerintah-nama">
                          <span aria-hidden className="pd-aparat-avatar">
                            {inisial(row.name)}
                          </span>
                          <div className="pemerintah-nama-isi">
                            <Link href={`/kependudukan/kelompok/${row.id}`}>
                              <strong>{row.name}</strong>
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong className="pemerintah-jabatan">{row.categoryName ?? "—"}</strong>
                        {row.code ? (
                          <small className="pemerintah-jenis-jabatan">Kode {row.code}</small>
                        ) : null}
                      </td>
                      <td>{row.leaderName ?? "Belum ditetapkan"}</td>
                      <td>{number.format(row.memberCount)}</td>
                      <td>
                        <div className="pd-aparat-aksi">
                          <Link
                            className="button button-ghost"
                            href={`/kependudukan/kelompok/${row.id}`}
                          >
                            Rincian
                          </Link>
                          {bolehUbah ? (
                            <Link
                              className="button button-ghost"
                              href={`/kependudukan/kelompok?edit=${row.id}${result.page > 1 ? `&page=${result.page}` : ""}`}
                            >
                              Ubah
                            </Link>
                          ) : null}
                          {bolehHapus && row.memberCount === 0 ? (
                            <ConfirmSubmit
                              className="button button-danger-ghost"
                              form={`hapus-kelompok-${row.id}`}
                              message={`Hapus kelompok ${row.name}?`}
                            >
                              Hapus
                            </ConfirmSubmit>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {bolehHapus
          ? result.rows
              .filter((row) => row.memberCount === 0)
              .map((row) => (
                <form action={hapusKelompokAction} id={`hapus-kelompok-${row.id}`} key={row.id}>
                  <input name="id" type="hidden" value={row.id} />
                </form>
              ))
          : null}

        {result.pageCount > 1 ? (
          <nav aria-label="Navigasi halaman kelompok" className="pagination">
            {result.page > 1 ? (
              <Link className="button button-secondary" href={halamanHref(result.page - 1)}>
                ← Sebelumnya
              </Link>
            ) : null}
            <span>
              Halaman {result.page} dari {result.pageCount}
            </span>
            {result.page < result.pageCount ? (
              <Link className="button button-secondary" href={halamanHref(result.page + 1)}>
                Berikutnya →
              </Link>
            ) : null}
          </nav>
        ) : null}
      </section>
    </div>
  );
}
