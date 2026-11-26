import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  hapusTerdataAction,
  hapusTerdataMassalAction,
} from "@/app/(admin)/(kependudukan)/kependudukan/penduduk/suplemen/actions";
import { PageHeading } from "@/components/shell/page-heading";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import {
  filterTerdataDariQuery,
  getRincianSuplemenData,
  labelSasaranSuplemen,
} from "@/features/kependudukan/penduduk/application/suplemen-use-cases";
import {
  filterTerdataAktif,
  labelKolomIsian,
  SUPLEMEN_RESOURCE,
} from "@/features/kependudukan/penduduk/domain/suplemen";
import { HapusMassalTerdata } from "@/features/kependudukan/penduduk/presentation/hapus-massal-terdata";
import { PilihSemuaTerdata } from "@/features/kependudukan/penduduk/presentation/pilih-semua-terdata";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import styles from "../suplemen.module.css";

export const metadata: Metadata = { title: "Rincian Data Suplemen" };

const tanggal = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatTanggal(nilai: string | null): string {
  if (!nilai) return "—";
  const hasil = new Date(`${nilai.slice(0, 10)}T00:00:00`);
  return Number.isNaN(hasil.getTime()) ? "—" : tanggal.format(hasil);
}

function queryFilter(params: Record<string, string | string[] | undefined>): string {
  const isi = new URLSearchParams();
  for (const kunci of ["q", "sex", "dusun", "rw", "rt"]) {
    const nilai = Array.isArray(params[kunci]) ? params[kunci][0] : params[kunci];
    if (nilai && nilai.trim() !== "") isi.set(kunci, nilai);
  }
  return isi.toString();
}

export default async function RincianSuplemenPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id: mentah } = await params;
  const id = Number(mentah);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const query = await searchParams;
  const filter = filterTerdataDariQuery(new URLSearchParams(queryFilter(query)));
  const [data, user] = await Promise.all([getRincianSuplemenData(id, filter), verifySession()]);
  if (!data) notFound();

  const bolehUbah = hasPermission(user.permissions, SUPLEMEN_RESOURCE, "update");
  const bolehHapus = hasPermission(user.permissions, SUPLEMEN_RESOURCE, "delete");
  const { suplemen, rows, wilayah } = data;
  const sasaranPenduduk = suplemen.sasaran !== 2;
  const cetakQuery = queryFilter(query);
  const denganQuery = (path: string) => (cetakQuery ? `${path}?${cetakQuery}` : path);

  const kolomIsian = [...new Set(rows.flatMap((row) => Object.keys(row.isian)))];
  const tampilkanFormIsian = suplemen.formIsian.length > 0 || kolomIsian.length > 0;
  const jumlahFilter = filterTerdataAktif(filter);
  const dihapus = query.dihapus;

  return (
    <div className="modul-page penduduk-page data-kependudukan-page suplemen-page">
      <PageHeading judul={<>Data Terdata Suplemen</>} deskripsi={<>{suplemen.nama}</>} />

      {dihapus ? (
        <p className="alert alert-info" role="status">
          Data terdata berhasil dihapus.
        </p>
      ) : null}

      <section className="platform-card data-panel">
        <header>
          <h2>Rincian Suplemen</h2>
          <p>Identitas data suplemen yang sedang dibuka.</p>
        </header>
        <dl className={styles.rincianGrid}>
          <div>
            <dt>Nama Data</dt>
            <dd>{suplemen.nama.toUpperCase()}</dd>
          </div>
          <div>
            <dt>Sasaran Terdata</dt>
            <dd>{labelSasaranSuplemen(suplemen.sasaran)}</dd>
          </div>
          <div className={styles.rincianLebar}>
            <dt>Keterangan</dt>
            <dd>{suplemen.keterangan?.trim() || "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="platform-card penduduk-card">
        <div className="penduduk-card-head">
          <div>
            <h2>Daftar Terdata</h2>
            <p>
              {rows.length} data{jumlahFilter > 0 ? " sesuai filter" : " terdata"}.
            </p>
          </div>
          <div className="penduduk-heading-actions penduduk-card-actions">
            {bolehUbah ? (
              <details className={styles.split}>
                <summary className="button button-primary">+ Tambah</summary>
                <div className={styles.splitPanel}>
                  <Link
                    className="button button-primary"
                    href={`/kependudukan/penduduk/suplemen/${id}/terdata/baru?aksi=1`}
                  >
                    Tambah Satu Data Warga
                  </Link>
                  <Link
                    className="button button-secondary"
                    href={`/kependudukan/penduduk/suplemen/${id}/terdata/baru?aksi=2`}
                  >
                    Tambah Beberapa Data Warga
                  </Link>
                </div>
              </details>
            ) : null}

            {bolehHapus ? (
              <HapusMassalTerdata aksi={hapusTerdataMassalAction} suplemenId={id} />
            ) : null}

            <Link
              className="button button-secondary"
              href={denganQuery(`/kependudukan/penduduk/suplemen/${id}/cetak`)}
              rel="noopener noreferrer"
              target="_blank"
            >
              Cetak
            </Link>
            <Link
              className="button button-secondary"
              href={denganQuery(`/kependudukan/penduduk/suplemen/${id}/cetak/unduh`)}
            >
              Unduh
            </Link>
            <Link
              className="button button-secondary"
              href={`/kependudukan/penduduk/suplemen/${id}/ekspor`}
            >
              Ekspor
            </Link>
            <Link className="button button-secondary" href="/kependudukan/penduduk/suplemen">
              Kembali
            </Link>
          </div>
        </div>

        <form className="penduduk-filter" method="get">
          <label className="penduduk-search">
            <span>Cari</span>
            <input
              defaultValue={filter.search}
              name="q"
              placeholder={
                sasaranPenduduk ? "NIK, nama, atau No. KK" : "No. KK atau kepala keluarga"
              }
              type="search"
            />
          </label>
          <label>
            <span>Jenis kelamin</span>
            <select defaultValue={filter.gender === "all" ? "" : filter.gender} name="sex">
              <option value="">Pilih Jenis Kelamin</option>
              <option value="male">Laki-laki</option>
              <option value="female">Perempuan</option>
            </select>
          </label>
          <label>
            <span>Dusun</span>
            <select defaultValue={filter.dusun} name="dusun">
              <option value="">Semua dusun</option>
              {wilayah.dusun.map((nilai) => (
                <option key={nilai} value={nilai}>
                  {nilai}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>RW</span>
            <select defaultValue={filter.rw} name="rw">
              <option value="">Semua RW</option>
              {wilayah.rw.map((nilai) => (
                <option key={nilai} value={nilai}>
                  {nilai}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>RT</span>
            <select defaultValue={filter.rt} name="rt">
              <option value="">Semua RT</option>
              {wilayah.rt.map((nilai) => (
                <option key={nilai} value={nilai}>
                  {nilai}
                </option>
              ))}
            </select>
          </label>
          <div className="penduduk-filter-aksi">
            <button className="button button-primary" type="submit">
              Terapkan
            </button>
            <Link
              className="button button-secondary"
              href={`/kependudukan/penduduk/suplemen/${id}`}
            >
              Bersihkan
            </Link>
          </div>
        </form>

        {rows.length === 0 ? (
          <p className="modul-empty">
            {jumlahFilter > 0
              ? "Tidak ada data terdata yang cocok dengan filter."
              : "Belum ada warga atau keluarga yang terdata pada suplemen ini."}
          </p>
        ) : (
          <div className="modul-scroll">
            <table className="modul-table">
              <thead>
                <tr>
                  <th scope="col">{bolehHapus ? <PilihSemuaTerdata /> : null}</th>
                  <th scope="col">No</th>
                  <th scope="col">Aksi</th>
                  <th scope="col">{sasaranPenduduk ? "No." : "NIK"} KK</th>
                  <th scope="col">{sasaranPenduduk ? "NIK Penduduk" : "No. KK"}</th>
                  <th scope="col">{sasaranPenduduk ? "Nama Penduduk" : "Kepala Keluarga"}</th>
                  <th scope="col">Tempat Lahir</th>
                  <th scope="col">Tanggal Lahir</th>
                  <th scope="col">Jenis Kelamin</th>
                  <th scope="col">Alamat</th>
                  <th scope="col">Keterangan</th>
                  {tampilkanFormIsian ? <th scope="col">Data Form Isian</th> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, indeks) => (
                  <tr key={row.id}>
                    <td>
                      {bolehHapus ? (
                        <input
                          aria-label={`Pilih ${row.nama ?? row.label}`}
                          name="idTerdata"
                          type="checkbox"
                          value={row.id}
                        />
                      ) : null}
                    </td>
                    <td className="modul-angka">{indeks + 1}</td>
                    <td>
                      <div className={styles.aksiBaris}>
                        {bolehUbah ? (
                          <Link
                            className="button button-secondary"
                            href={`/kependudukan/penduduk/suplemen/${id}/terdata/${row.id}/ubah`}
                          >
                            Ubah
                          </Link>
                        ) : null}
                        {bolehHapus ? (
                          <form action={hapusTerdataAction}>
                            <input name="suplemenId" type="hidden" value={id} />
                            <input name="terdataId" type="hidden" value={row.id} />
                            <ConfirmSubmit
                              className="button button-danger"
                              message={`Hapus data terdata "${row.nama ?? row.label}"?`}
                            >
                              Hapus
                            </ConfirmSubmit>
                          </form>
                        ) : null}
                      </div>
                    </td>
                    <td className="modul-mono">
                      {sasaranPenduduk ? (row.nomorKk ?? "—") : (row.nik ?? "—")}
                    </td>
                    <td className="modul-mono">
                      {sasaranPenduduk ? (row.nik ?? "—") : (row.nomorKk ?? "—")}
                    </td>
                    <td>
                      {row.nama ?? (
                        <span className="modul-muted">
                          {sasaranPenduduk ? "Penduduk tidak tersedia" : "KK tidak tersedia"}
                        </span>
                      )}
                    </td>
                    <td>{row.tempatLahir ?? "—"}</td>
                    <td>{formatTanggal(row.tanggalLahir)}</td>
                    <td>
                      {row.gender === "male"
                        ? "Laki-laki"
                        : row.gender === "female"
                          ? "Perempuan"
                          : "—"}
                    </td>
                    <td>{row.alamat ?? "—"}</td>
                    <td>{row.keterangan?.trim() || "—"}</td>
                    {tampilkanFormIsian ? (
                      <td>
                        {Object.keys(row.isian).length > 0 ? (
                          <details className={styles.isianDetail}>
                            <summary>Selengkapnya</summary>
                            <dl>
                              {Object.entries(row.isian).map(([kunci, nilai]) => (
                                <div key={kunci}>
                                  <dt>{labelKolomIsian(kunci)}</dt>
                                  <dd>{nilai || "—"}</dd>
                                </div>
                              ))}
                            </dl>
                          </details>
                        ) : (
                          <span className="modul-muted">—</span>
                        )}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="suplemen-kembali suplemen-kembali-bawah">
          <Link href="/kependudukan/penduduk/suplemen">← Daftar Data Suplemen</Link>
        </p>
      </section>
    </div>
  );
}
