import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import {
  aksesDokumenAdmin,
  listDokumenAdminData,
} from "@/features/info-desa/publik/application/konten-admin";
import { dokumenJenisLabel } from "@/features/info-desa/publik/domain/dokumen";

import { hapusDokumenAction, ubahStatusDokumenAction } from "./actions";
import { DialogDokumen } from "./dialog-dokumen";

export const metadata = { title: "Dokumen Publik" };

const angka = (nilai: number) => nilai.toLocaleString("id-ID");

const labelKategori = (value: string) =>
  value === "produk_hukum"
    ? "Produk Hukum"
    : value === "informasi_publik"
      ? "Informasi Publik"
      : "Lainnya";

const urlBerkas = (berkas: string) =>
  `/api/publik/media/${berkas.split("/").map(encodeURIComponent).join("/")}`;

export default async function DokumenAdminPage() {
  const [rows, akses] = await Promise.all([listDokumenAdminData(), aksesDokumenAdmin()]);
  const publik = rows.filter((row) => row.aktif).length;
  const produkHukum = rows.filter((row) => row.kategori === "produk_hukum").length;

  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Dokumen Publik</>}
        deskripsi={<>Kelola dokumen resmi yang dapat diunduh warga.</>}
      />

      <section aria-label="Ringkasan dokumen" className="pemerintahan-metrics berita-kpi">
        <article className="wilayah-kpi-kartu is-utama">
          <div className="wilayah-kpi-kepala">
            <span aria-hidden="true" className="wilayah-kpi-ikon">
              ▤
            </span>
            <span className="wilayah-kpi-label">Total Dokumen</span>
          </div>
          <strong className="wilayah-kpi-nilai">{angka(rows.length)}</strong>
          <small className="wilayah-kpi-catatan">{angka(publik)} tampil di website</small>
        </article>
        <article className="wilayah-kpi-kartu">
          <div className="wilayah-kpi-kepala">
            <span aria-hidden="true" className="wilayah-kpi-ikon is-hijau">
              ✓
            </span>
            <span className="wilayah-kpi-label">Publik</span>
          </div>
          <strong className="wilayah-kpi-nilai">{angka(publik)}</strong>
          <small className="wilayah-kpi-catatan">Dapat diunduh warga</small>
        </article>
        <article className="wilayah-kpi-kartu">
          <div className="wilayah-kpi-kepala">
            <span aria-hidden="true" className="wilayah-kpi-ikon is-biru">
              §
            </span>
            <span className="wilayah-kpi-label">Produk Hukum</span>
          </div>
          <strong className="wilayah-kpi-nilai">{angka(produkHukum)}</strong>
          <small className="wilayah-kpi-catatan">Perdes, Perkada, SK Kades</small>
        </article>
        <article className="wilayah-kpi-kartu">
          <div className="wilayah-kpi-kepala">
            <span aria-hidden="true" className="wilayah-kpi-ikon is-oranye">
              ◔
            </span>
            <span className="wilayah-kpi-label">Nonaktif</span>
          </div>
          <strong className="wilayah-kpi-nilai">{angka(rows.length - publik)}</strong>
          <small className="wilayah-kpi-catatan">Tidak tampil di website</small>
        </article>
      </section>

      <section aria-label="Daftar dokumen" className="pd-panel" id="daftar-dokumen">
        <div className="pd-panel-kepala">
          <div>
            <h2>Daftar Dokumen</h2>
            <p>
              {angka(publik)} publik · {angka(rows.length - publik)} nonaktif.
            </p>
          </div>
          <div className="wilayah-toolbar">
            <span className="wilayah-count-pill">{angka(rows.length)} dokumen</span>
            {akses.bolehTambah ? <DialogDokumen /> : null}
          </div>
        </div>

        {rows.length ? (
          <div className="modul-table-wrap">
            <table className="modul-table pemerintah-table berita-tabel">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Dokumen</th>
                  <th>Kategori</th>
                  <th>Nomor / Tahun</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr className={row.aktif ? undefined : "pemerintah-row-nonaktif"} key={row.id}>
                    <td>{index + 1}</td>
                    <td>
                      <div className="berita-sel">
                        <span aria-hidden className="berita-thumb">
                          ▤
                        </span>
                        <div className="berita-sel-isi">
                          <strong className="berita-sel-judul">{row.nama}</strong>
                          <div className="berita-sel-meta">
                            <span className="berita-badge is-slider">
                              {dokumenJenisLabel(row.jenis)}
                            </span>
                            <span className="berita-slug">/{row.slug}</span>
                          </div>
                          {row.keterangan ? (
                            <small className="berita-baca">{row.keterangan}</small>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="berita-kategori">{labelKategori(row.kategori)}</span>
                    </td>
                    <td>
                      <span className="berita-tanggal">
                        {row.nomor ?? "—"} / {row.tahun ?? "—"}
                      </span>
                    </td>
                    <td>
                      <span className={`berita-status ${row.aktif ? "is-tayang" : "is-draft"}`}>
                        <i aria-hidden="true" />
                        {row.aktif ? "Publik" : "Nonaktif"}
                      </span>
                    </td>
                    <td>
                      <div className="pd-aparat-aksi">
                        {row.berkas ? (
                          <Link
                            className="button button-ghost"
                            href={urlBerkas(row.berkas)}
                            target="_blank"
                          >
                            Lihat
                          </Link>
                        ) : row.tautan ? (
                          <Link className="button button-ghost" href={row.tautan} target="_blank">
                            Lihat
                          </Link>
                        ) : null}
                        {akses.bolehUbah ? <DialogDokumen item={row} /> : null}
                        {akses.bolehUbah ? (
                          <form action={ubahStatusDokumenAction}>
                            <input name="dokumenId" type="hidden" value={row.id} />
                            <input
                              name="aktif"
                              type="hidden"
                              value={row.aktif ? "false" : "true"}
                            />
                            <button className="button button-ghost" type="submit">
                              {row.aktif ? "Sembunyikan" : "Publikasikan"}
                            </button>
                          </form>
                        ) : null}
                        {akses.bolehHapus ? (
                          <form action={hapusDokumenAction}>
                            <input name="dokumenId" type="hidden" value={row.id} />
                            <ConfirmSubmit
                              className="button button-danger-ghost"
                              message={`Hapus dokumen "${row.nama}"?`}
                            >
                              Hapus
                            </ConfirmSubmit>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="berita-kosong">
            <span aria-hidden="true">▤</span>
            <strong>Belum ada dokumen</strong>
            <p>Klik &ldquo;Tambah Dokumen&rdquo; untuk menambah dokumen pertama.</p>
          </div>
        )}
      </section>
    </div>
  );
}
