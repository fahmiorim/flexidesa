import type { Metadata } from "next";
import Link from "next/link";

import { hapusSuplemenAction } from "@/app/(admin)/penduduk/suplemen/actions";
import { PageHeading } from "@/components/shell/page-heading";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import {
  getDaftarSuplemenData,
  labelSasaranSuplemen,
  OPSI_SASARAN,
} from "@/features/penduduk/application/suplemen-use-cases";
import { SUPLEMEN_RESOURCE } from "@/features/penduduk/domain/suplemen";
import { hasPermission } from "@/features/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import styles from "./suplemen.module.css";

export const metadata: Metadata = { title: "Data Suplemen" };

const PER_HALAMAN = 20;
const tanggal = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function teks(nilai: string | string[] | undefined): string {
  return (Array.isArray(nilai) ? nilai[0] : nilai)?.trim() ?? "";
}

function halamanDari(nilai: string | string[] | undefined): number {
  const angka = Number(teks(nilai));
  return Number.isInteger(angka) && angka > 0 ? angka : 1;
}

function tautanHalaman(params: { q: string; sasaran: string }, halaman: number): string {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.sasaran) query.set("sasaran", params.sasaran);
  if (halaman > 1) query.set("page", String(halaman));
  const isi = query.toString();
  return isi ? `/penduduk/suplemen?${isi}` : "/penduduk/suplemen";
}

export default async function SuplemenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = teks(params.q).slice(0, 100);
  const sasaranMentah = teks(params.sasaran);
  const sasaran = [1, 2].includes(Number(sasaranMentah)) ? Number(sasaranMentah) : null;
  const halamanDiminta = halamanDari(params.page);

  const [{ hasil, filter }, user] = await Promise.all([
    getDaftarSuplemenData({
      page: halamanDiminta,
      perPage: PER_HALAMAN,
      search: q || undefined,
      sasaran: sasaran ?? undefined,
    }),
    verifySession(),
  ]);

  const bolehUbah = hasPermission(user.permissions, SUPLEMEN_RESOURCE, "update");
  const bolehHapus = hasPermission(user.permissions, SUPLEMEN_RESOURCE, "delete");
  const adaFilter = Boolean(filter.search) || filter.sasaran !== null;
  const dihapus = teks(params.dihapus);
  const gagal = teks(params.gagal);

  return (
    <div className="modul-page penduduk-page data-kependudukan-page suplemen-page">
      <PageHeading>
        <div className="page-heading">
          <div>
            <h1>Data Suplemen</h1>
            <p>Kelola daftar data suplemen desa.</p>
          </div>
        </div>
      </PageHeading>

      {gagal ? (
        <p className="alert alert-error" role="alert">
          {gagal}
        </p>
      ) : null}

      {dihapus ? (
        <p className="alert alert-info" role="status">
          Data suplemen berhasil dihapus.
        </p>
      ) : null}

      <section className="platform-card penduduk-card">
        <div className="penduduk-card-head">
          <div>
            <h2>Daftar Data Suplemen</h2>
            <p>
              {hasil.total} data{adaFilter ? " sesuai filter" : " terdaftar"}.
            </p>
          </div>
          <div className="penduduk-heading-actions penduduk-card-actions">
            {adaFilter ? (
              <Link className="penduduk-reset" href="/penduduk/suplemen">
                Reset filter
              </Link>
            ) : null}
            <Link className="button button-secondary" href="/penduduk/suplemen/laporan/ekspor">
              Unduh Rekap
            </Link>
            {bolehUbah ? (
              <Link className="button button-primary" href="/penduduk/suplemen/baru">
                + Tambah
              </Link>
            ) : null}
          </div>
        </div>

        <form className="penduduk-filter" method="get">
          <label className="penduduk-search">
            <span>Cari</span>
            <input defaultValue={q} name="q" placeholder="Nama data suplemen" type="search" />
          </label>
          <label>
            <span>Sasaran</span>
            <select defaultValue={sasaran ?? ""} name="sasaran">
              <option value="">Pilih Sasaran</option>
              {OPSI_SASARAN.map((opsi) => (
                <option key={opsi.value} value={opsi.value}>
                  {opsi.label}
                </option>
              ))}
            </select>
          </label>
          <div className="penduduk-filter-aksi">
            <button className="button button-primary" type="submit">
              Terapkan
            </button>
            <Link className="button button-secondary" href="/penduduk/suplemen">
              Bersihkan
            </Link>
          </div>
        </form>

        {hasil.rows.length === 0 ? (
          <p className="modul-empty">
            {adaFilter
              ? "Tidak ada data suplemen yang cocok dengan filter."
              : "Belum ada data suplemen pada desa ini."}
          </p>
        ) : (
          <div className="modul-scroll">
            <table className="modul-table">
              <thead>
                <tr>
                  <th scope="col">No</th>
                  <th scope="col">Aksi</th>
                  <th scope="col">Nama Data</th>
                  <th scope="col">Jumlah Terdata</th>
                  <th scope="col">Sasaran</th>
                  <th scope="col">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {hasil.rows.map((row, indeks) => (
                  <tr key={row.id}>
                    <td className="modul-angka">{(hasil.page - 1) * hasil.perPage + indeks + 1}</td>
                    <td>
                      <div className={styles.aksiBaris}>
                        <Link
                          className="button button-secondary"
                          href={`/penduduk/suplemen/${row.id}`}
                        >
                          Rincian
                        </Link>
                        {bolehUbah ? (
                          <>
                            <Link
                              className="button button-secondary"
                              href={`/penduduk/suplemen/${row.id}/impor`}
                            >
                              Impor
                            </Link>
                            <Link
                              className="button button-secondary"
                              href={`/penduduk/suplemen/${row.id}/ubah`}
                            >
                              Ubah
                            </Link>
                          </>
                        ) : null}
                        {bolehHapus ? (
                          <form action={hapusSuplemenAction}>
                            <input name="id" type="hidden" value={row.id} />
                            <ConfirmSubmit
                              className="button button-danger"
                              message={`Hapus data suplemen "${row.nama}"? Data yang masih memiliki peserta tidak dapat dihapus.`}
                            >
                              Hapus
                            </ConfirmSubmit>
                          </form>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <Link className={styles.namaTautan} href={`/penduduk/suplemen/${row.id}`}>
                        {row.nama}
                      </Link>
                      <span className="modul-muted">
                        Diperbarui {tanggal.format(new Date(row.updatedAt))}
                      </span>
                    </td>
                    <td className="modul-angka">{row.terdataCount}</td>
                    <td>{labelSasaranSuplemen(row.sasaran)}</td>
                    <td>{row.keterangan?.trim() || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="penduduk-footer">
          <span>
            {hasil.total === 0
              ? "Tidak ada data"
              : `Halaman ${hasil.page} dari ${hasil.pageCount} · ${hasil.total} data`}
          </span>
          {hasil.pageCount > 1 ? (
            <nav aria-label="Navigasi halaman data suplemen" className="penduduk-pagination">
              {hasil.page > 1 ? (
                <Link
                  className="penduduk-page-arrow"
                  href={tautanHalaman({ q, sasaran: sasaranMentah }, hasil.page - 1)}
                >
                  ‹
                </Link>
              ) : (
                <span aria-disabled="true" className="penduduk-page-arrow" data-disabled="true">
                  ‹
                </span>
              )}
              {Array.from({ length: hasil.pageCount }, (_, indeks) => indeks + 1)
                .filter(
                  (nomor) =>
                    Math.abs(nomor - hasil.page) <= 2 || nomor === 1 || nomor === hasil.pageCount,
                )
                .map((nomor) => (
                  <Link
                    aria-current={nomor === hasil.page ? "page" : undefined}
                    className="penduduk-page-link"
                    href={tautanHalaman({ q, sasaran: sasaranMentah }, nomor)}
                    key={nomor}
                  >
                    {nomor}
                  </Link>
                ))}
              {hasil.page < hasil.pageCount ? (
                <Link
                  className="penduduk-page-arrow"
                  href={tautanHalaman({ q, sasaran: sasaranMentah }, hasil.page + 1)}
                >
                  ›
                </Link>
              ) : (
                <span aria-disabled="true" className="penduduk-page-arrow" data-disabled="true">
                  ›
                </span>
              )}
            </nav>
          ) : null}
        </div>
      </section>
    </div>
  );
}
