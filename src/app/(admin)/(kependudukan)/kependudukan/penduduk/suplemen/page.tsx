import type { Metadata } from "next";
import Link from "next/link";

import { hapusSuplemenAction } from "@/app/(admin)/(kependudukan)/kependudukan/penduduk/suplemen/actions";
import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import {
  getDaftarSuplemenData,
  labelSasaranSuplemen,
  OPSI_SASARAN,
} from "@/features/kependudukan/penduduk/application/suplemen-use-cases";
import { SUPLEMEN_RESOURCE } from "@/features/kependudukan/penduduk/domain/suplemen";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
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
  return isi ? `/kependudukan/penduduk/suplemen?${isi}` : "/kependudukan/penduduk/suplemen";
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
      <PageHeading judul={<>Data Suplemen</>} deskripsi={<>Kelola daftar data suplemen desa.</>} />

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

      <TableCard
        className="penduduk-card"
        title="Daftar Data Suplemen"
        description={`${hasil.total} data${adaFilter ? " sesuai filter" : " terdaftar"}.`}
        actions={
          <div className="penduduk-heading-actions penduduk-card-actions">
            {adaFilter ? (
              <Link className="penduduk-reset" href="/kependudukan/penduduk/suplemen">
                Reset filter
              </Link>
            ) : null}
            <ButtonLink variant="secondary" href="/kependudukan/penduduk/suplemen/laporan/ekspor">
              Unduh Rekap
            </ButtonLink>
            {bolehUbah ? (
              <ButtonLink variant="primary" href="/kependudukan/penduduk/suplemen/baru">
                + Tambah
              </ButtonLink>
            ) : null}
          </div>
        }
        filter={
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
              <Button variant="primary" type="submit">
                Terapkan
              </Button>
              <ButtonLink variant="secondary" href="/kependudukan/penduduk/suplemen">
                Bersihkan
              </ButtonLink>
            </div>
          </form>
        }
      >
        {hasil.rows.length === 0 ? (
          <p className="modul-empty">
            {adaFilter
              ? "Tidak ada data suplemen yang cocok dengan filter."
              : "Belum ada data suplemen pada desa ini."}
          </p>
        ) : (
          <TableScroll>
            <Table>
              <THead>
                <Row>
                  <HeaderCell scope="col">No</HeaderCell>
                  <HeaderCell scope="col">Aksi</HeaderCell>
                  <HeaderCell scope="col">Nama Data</HeaderCell>
                  <HeaderCell scope="col">Jumlah Terdata</HeaderCell>
                  <HeaderCell scope="col">Sasaran</HeaderCell>
                  <HeaderCell scope="col">Keterangan</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {hasil.rows.map((row, indeks) => (
                  <Row key={row.id}>
                    <Cell className="modul-angka">
                      {(hasil.page - 1) * hasil.perPage + indeks + 1}
                    </Cell>
                    <Cell>
                      <div className={styles.aksiBaris}>
                        <ButtonLink
                          variant="secondary"
                          href={`/kependudukan/penduduk/suplemen/${row.id}`}
                        >
                          Rincian
                        </ButtonLink>
                        {bolehUbah ? (
                          <>
                            <ButtonLink
                              variant="secondary"
                              href={`/kependudukan/penduduk/suplemen/${row.id}/impor`}
                            >
                              Impor
                            </ButtonLink>
                            <ButtonLink
                              variant="secondary"
                              href={`/kependudukan/penduduk/suplemen/${row.id}/ubah`}
                            >
                              Ubah
                            </ButtonLink>
                          </>
                        ) : null}
                        {bolehHapus ? (
                          <DialogHapusForm
                            aksi={hapusSuplemenAction}
                            id={row.id}
                            judul={`Hapus data suplemen "${row.nama}"?`}
                            keterangan="Suplemen yang masih memiliki peserta tidak dapat dihapus."
                            labelAksi="Hapus suplemen"
                          />
                        ) : null}
                      </div>
                    </Cell>
                    <Cell>
                      <Link
                        className={styles.namaTautan}
                        href={`/kependudukan/penduduk/suplemen/${row.id}`}
                      >
                        {row.nama}
                      </Link>
                      <span className="modul-muted">
                        Diperbarui {tanggal.format(new Date(row.updatedAt))}
                      </span>
                    </Cell>
                    <Cell className="modul-angka">{row.terdataCount}</Cell>
                    <Cell>{labelSasaranSuplemen(row.sasaran)}</Cell>
                    <Cell>{row.keterangan?.trim() || "—"}</Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
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
                  aria-label="Halaman sebelumnya"
                  className="penduduk-page-arrow"
                  href={tautanHalaman({ q, sasaran: sasaranMentah }, hasil.page - 1)}
                >
                  ‹
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  aria-label="Halaman sebelumnya"
                  className="penduduk-page-arrow"
                  data-disabled="true"
                >
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
                  aria-label="Halaman berikutnya"
                  className="penduduk-page-arrow"
                  href={tautanHalaman({ q, sasaran: sasaranMentah }, hasil.page + 1)}
                >
                  ›
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  aria-label="Halaman berikutnya"
                  className="penduduk-page-arrow"
                  data-disabled="true"
                >
                  ›
                </span>
              )}
            </nav>
          ) : null}
        </div>
      </TableCard>
    </div>
  );
}
