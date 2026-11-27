import Image from "next/image";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import {
  aksesGaleriAdmin,
  detailAlbumGaleriAdmin,
} from "@/features/info-desa/publik/application/konten-admin";

import { hapusFoto, jadikanSampul } from "../actions";
import { DialogFoto } from "../dialog-foto";
import { unggahFotoFormAction } from "./form-actions";

export const metadata = { title: "Kelola Foto Galeri" };

const FORMAT_TANGGAL = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const urlGambar = (gambar: string | null) =>
  gambar ? `/api/publik/media/${gambar.split("/").map(encodeURIComponent).join("/")}` : null;

const angka = (nilai: number) => nilai.toLocaleString("id-ID");

export default async function KelolaFotoGaleriPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const albumId = Number(id);
  if (!Number.isSafeInteger(albumId) || albumId < 1) notFound();
  const [detail, akses] = await Promise.all([detailAlbumGaleriAdmin(albumId), aksesGaleriAdmin()]);
  if (!detail) notFound();
  const { album, fotos } = detail;
  const fotoAktif = fotos.filter((foto) => foto.aktif).length;
  const fotoSlider = fotos.filter((foto) => foto.slider).length;

  return (
    <div className="modul-page">
      <PageHeading
        judul={<>{album.nama}</>}
        deskripsi={
          <>
            {angka(fotos.length)} foto · {angka(fotoAktif)} aktif · {angka(fotoSlider)} slider.
          </>
        }
      />

      <section aria-label="Ringkasan foto" className="pemerintahan-metrics berita-kpi">
        <article className="wilayah-kpi-kartu is-utama">
          <div className="wilayah-kpi-kepala">
            <span aria-hidden="true" className="wilayah-kpi-ikon">
              ▣
            </span>
            <span className="wilayah-kpi-label">Total Foto</span>
          </div>
          <strong className="wilayah-kpi-nilai">{angka(fotos.length)}</strong>
          <small className="wilayah-kpi-catatan">Semua foto album ini</small>
        </article>
        <article className="wilayah-kpi-kartu">
          <div className="wilayah-kpi-kepala">
            <span aria-hidden="true" className="wilayah-kpi-ikon is-hijau">
              ✓
            </span>
            <span className="wilayah-kpi-label">Aktif</span>
          </div>
          <strong className="wilayah-kpi-nilai">{angka(fotoAktif)}</strong>
          <small className="wilayah-kpi-catatan">Tampil di album publik</small>
        </article>
        <article className="wilayah-kpi-kartu">
          <div className="wilayah-kpi-kepala">
            <span aria-hidden="true" className="wilayah-kpi-ikon is-biru">
              ◧
            </span>
            <span className="wilayah-kpi-label">Slider</span>
          </div>
          <strong className="wilayah-kpi-nilai">{angka(fotoSlider)}</strong>
          <small className="wilayah-kpi-catatan">Tampil di slider beranda</small>
        </article>
        <article className="wilayah-kpi-kartu">
          <div className="wilayah-kpi-kepala">
            <span aria-hidden="true" className="wilayah-kpi-ikon is-oranye">
              ◔
            </span>
            <span className="wilayah-kpi-label">Publikasi</span>
          </div>
          <strong className="wilayah-kpi-nilai">
            {album.publishedAt ? FORMAT_TANGGAL.format(album.publishedAt) : "—"}
          </strong>
          <small className="wilayah-kpi-catatan">
            {album.aktif ? "Tayang di website" : "Nonaktif"}
          </small>
        </article>
      </section>

      <TableCard
        actions={
          <>
            {album.aktif ? (
              <ButtonLink variant="secondary" href={`/galeri/${encodeURIComponent(album.slug)}`}>
                ↗ Buka di Website
              </ButtonLink>
            ) : null}
            <ButtonLink variant="secondary" href="/profil-desa/galeri">
              ← Semua Album
            </ButtonLink>
            <FormDialog
              aksi={unggahFotoFormAction}
              deskripsi="Maksimal 20 berkas, JPG/PNG/WEBP/GIF/SVG ≤ 5 MB per berkas."
              judul="Unggah foto"
              label="+ Unggah Foto"
              labelSimpan="Unggah"
            >
              <input name="albumId" type="hidden" value={album.id} />
              <FormField
                accept="image/*"
                containerClassName="form-field-full"
                helpText="Pilih beberapa berkas sekaligus bila perlu."
                label="Berkas gambar"
                multiple
                name="gambar"
                required
                type="file"
              />
            </FormDialog>
          </>
        }
        description={`${angka(fotoAktif)} aktif · ${angka(fotoSlider)} slider beranda · ${angka(fotos.length)} foto`}
        title="Daftar Foto"
      >
        {fotos.length ? (
          <TableScroll className="modul-table-wrap">
            <Table className="modul-table pemerintah-table berita-tabel">
              <THead>
                <Row>
                  <HeaderCell>No</HeaderCell>
                  <HeaderCell>Foto</HeaderCell>
                  <HeaderCell>Judul</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {fotos.map((foto, index) => {
                  const gambar = urlGambar(foto.gambar);
                  const isSampul = album.sampul === foto.gambar;
                  return (
                    <Row
                      className={foto.aktif ? undefined : "pemerintah-row-nonaktif"}
                      key={foto.id}
                    >
                      <Cell>{index + 1}</Cell>
                      <Cell>
                        <div className="berita-sel">
                          <span aria-hidden className="berita-thumb">
                            {gambar ? (
                              <Image alt="" height={52} src={gambar} unoptimized width={52} />
                            ) : (
                              "▣"
                            )}
                          </span>
                          <div className="berita-sel-isi">
                            <div className="berita-sel-meta">
                              {isSampul ? (
                                <span className="berita-badge is-headline">★ Sampul</span>
                              ) : null}
                              {foto.slider ? (
                                <span className="berita-badge is-slider">◧ Slider</span>
                              ) : null}
                              <span className="berita-slug">urutan {foto.urut}</span>
                            </div>
                          </div>
                        </div>
                      </Cell>
                      <Cell>
                        <strong className="berita-sel-judul">
                          {foto.judul ?? "(tanpa judul)"}
                        </strong>
                        {foto.keterangan ? (
                          <small className="berita-baca">{foto.keterangan}</small>
                        ) : null}
                      </Cell>
                      <Cell>
                        <span className={`berita-status ${foto.aktif ? "is-tayang" : "is-draft"}`}>
                          <i aria-hidden="true" />
                          {foto.aktif ? "Aktif" : "Nonaktif"}
                        </span>
                      </Cell>
                      <Cell>
                        <div className="pd-aparat-aksi">
                          {akses.bolehUbah ? <DialogFoto item={foto} /> : null}
                          {akses.bolehUbah && !isSampul ? (
                            <form action={jadikanSampul}>
                              <input name="albumId" type="hidden" value={album.id} />
                              <input name="fotoId" type="hidden" value={foto.id} />
                              <Button variant="ghost" type="submit">
                                Jadikan Sampul
                              </Button>
                            </form>
                          ) : null}
                          {akses.bolehHapus ? (
                            <DialogHapusForm
                              aksi={hapusFoto}
                              hidden={{ fotoId: foto.id }}
                              judul={`Hapus foto "${foto.judul ?? "tanpa judul"}"?`}
                              keterangan="Foto beserta berkas gambarnya akan dihapus permanen."
                              labelAksi="Hapus foto"
                            />
                          ) : null}
                        </div>
                      </Cell>
                    </Row>
                  );
                })}
              </TBody>
            </Table>
          </TableScroll>
        ) : (
          <div className="berita-kosong">
            <span aria-hidden="true">▣</span>
            <strong>Belum ada foto</strong>
            <p>Unggah foto pertama lewat tombol “Unggah Foto” di atas.</p>
          </div>
        )}
      </TableCard>
    </div>
  );
}
