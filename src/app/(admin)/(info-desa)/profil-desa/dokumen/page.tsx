import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
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

      <TableCard
        actions={
          <>
            <span className="wilayah-count-pill">{angka(rows.length)} dokumen</span>
            {akses.bolehTambah ? <DialogDokumen /> : null}
          </>
        }
        description={`${angka(publik)} publik · ${angka(rows.length - publik)} nonaktif`}
        title="Daftar Dokumen"
      >
        {rows.length ? (
          <TableScroll className="modul-table-wrap">
            <Table className="modul-table pemerintah-table berita-tabel">
              <THead>
                <Row>
                  <HeaderCell>No</HeaderCell>
                  <HeaderCell>Dokumen</HeaderCell>
                  <HeaderCell>Kategori</HeaderCell>
                  <HeaderCell>Nomor / Tahun</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {rows.map((row, index) => (
                  <Row className={row.aktif ? undefined : "pemerintah-row-nonaktif"} key={row.id}>
                    <Cell>{index + 1}</Cell>
                    <Cell>
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
                    </Cell>
                    <Cell>
                      <span className="berita-kategori">{labelKategori(row.kategori)}</span>
                    </Cell>
                    <Cell>
                      <span className="berita-tanggal">
                        {row.nomor ?? "—"} / {row.tahun ?? "—"}
                      </span>
                    </Cell>
                    <Cell>
                      <span className={`berita-status ${row.aktif ? "is-tayang" : "is-draft"}`}>
                        <i aria-hidden="true" />
                        {row.aktif ? "Publik" : "Nonaktif"}
                      </span>
                    </Cell>
                    <Cell>
                      <div className="pd-aparat-aksi">
                        {row.berkas ? (
                          <ButtonLink variant="ghost" href={urlBerkas(row.berkas)} target="_blank">
                            Lihat
                          </ButtonLink>
                        ) : row.tautan ? (
                          <ButtonLink variant="ghost" href={row.tautan} target="_blank">
                            Lihat
                          </ButtonLink>
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
                            <Button variant="ghost" type="submit">
                              {row.aktif ? "Sembunyikan" : "Publikasikan"}
                            </Button>
                          </form>
                        ) : null}
                        {akses.bolehHapus ? (
                          <DialogHapusForm
                            aksi={hapusDokumenAction}
                            hidden={{ dokumenId: row.id }}
                            judul={`Hapus dokumen "${row.nama}"?`}
                            keterangan="Dokumen beserta berkasnya akan dihapus permanen."
                            labelAksi="Hapus dokumen"
                          />
                        ) : null}
                      </div>
                    </Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        ) : (
          <div className="berita-kosong">
            <span aria-hidden="true">▤</span>
            <strong>Belum ada dokumen</strong>
            <p>Klik &ldquo;Tambah Dokumen&rdquo; untuk menambah dokumen pertama.</p>
          </div>
        )}
      </TableCard>
    </div>
  );
}
