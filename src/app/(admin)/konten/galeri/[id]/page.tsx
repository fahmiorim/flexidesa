import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/shell/page-heading";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import {
  aksesGaleriAdmin,
  detailAlbumGaleriAdmin,
} from "@/features/publik/application/konten-admin";

import { hapusFoto, jadikanSampul, unggahFoto } from "../actions";
import { DialogFoto } from "../dialog-foto";

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
      <PageHeading>
        <header className="page-heading">
          <div>
            <h1>{album.nama}</h1>
            <p>
              {angka(fotos.length)} foto · {angka(fotoAktif)} aktif · {angka(fotoSlider)} slider.
            </p>
          </div>
        </header>
      </PageHeading>

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

      <section aria-label="Unggah foto" className="pd-panel">
        <div className="pd-panel-kepala">
          <div>
            <h2>Unggah Foto</h2>
            <p>Maks. 20 berkas, JPG/PNG/WEBP/GIF/SVG ≤ 5 MB.</p>
          </div>
          {album.aktif ? (
            <Link className="wilayah-tool" href={`/galeri/${encodeURIComponent(album.slug)}`}>
              ↗ Buka di Website
            </Link>
          ) : null}
        </div>
        <form action={unggahFoto} className="galeri-video-form" encType="multipart/form-data">
          <input type="hidden" name="albumId" value={album.id} />
          <label>
            Berkas gambar
            <input name="gambar" type="file" accept="image/*" multiple required />
          </label>
          <button type="submit">Unggah Foto</button>
        </form>
      </section>

      <section aria-label="Daftar foto" className="pd-panel" id="daftar-foto">
        <div className="pd-panel-kepala">
          <div>
            <h2>Daftar Foto</h2>
            <p>
              {angka(fotoAktif)} aktif · {angka(fotoSlider)} slider beranda.
            </p>
          </div>
          <div className="wilayah-toolbar">
            <span className="wilayah-count-pill">{angka(fotos.length)} foto</span>
            <Link className="wilayah-tool" href="/konten/galeri">
              ← Semua Album
            </Link>
          </div>
        </div>

        {fotos.length ? (
          <div className="modul-table-wrap">
            <table className="modul-table pemerintah-table berita-tabel">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Foto</th>
                  <th>Judul</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {fotos.map((foto, index) => {
                  const gambar = urlGambar(foto.gambar);
                  const isSampul = album.sampul === foto.gambar;
                  return (
                    <tr
                      className={foto.aktif ? undefined : "pemerintah-row-nonaktif"}
                      key={foto.id}
                    >
                      <td>{index + 1}</td>
                      <td>
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
                      </td>
                      <td>
                        <strong className="berita-sel-judul">
                          {foto.judul ?? "(tanpa judul)"}
                        </strong>
                        {foto.keterangan ? (
                          <small className="berita-baca">{foto.keterangan}</small>
                        ) : null}
                      </td>
                      <td>
                        <span className={`berita-status ${foto.aktif ? "is-tayang" : "is-draft"}`}>
                          <i aria-hidden="true" />
                          {foto.aktif ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td>
                        <div className="pd-aparat-aksi">
                          {akses.bolehUbah ? <DialogFoto item={foto} /> : null}
                          {akses.bolehUbah && !isSampul ? (
                            <form action={jadikanSampul}>
                              <input name="albumId" type="hidden" value={album.id} />
                              <input name="fotoId" type="hidden" value={foto.id} />
                              <button className="button button-ghost" type="submit">
                                Jadikan Sampul
                              </button>
                            </form>
                          ) : null}
                          {akses.bolehHapus ? (
                            <form action={hapusFoto}>
                              <input name="fotoId" type="hidden" value={foto.id} />
                              <ConfirmSubmit
                                className="button button-danger-ghost"
                                message={`Hapus foto "${foto.judul ?? "tanpa judul"}"?`}
                              >
                                Hapus
                              </ConfirmSubmit>
                            </form>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="berita-kosong">
            <span aria-hidden="true">▣</span>
            <strong>Belum ada foto</strong>
            <p>Unggah foto pertama lewat formulir di atas.</p>
          </div>
        )}
      </section>
    </div>
  );
}
