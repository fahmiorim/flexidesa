import Image from "next/image";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import {
  aksesGaleriAdmin,
  listGaleriKelolaAdminData,
  listVideoGaleriAdminData,
} from "@/features/publik/application/konten-admin";

import { hapusAlbum, hapusVideoGaleri, ubahStatusAlbum } from "./actions";
import { DialogAlbum } from "./dialog-album";
import { DialogVideo } from "./dialog-video";

export const metadata = { title: "Galeri Desa" };

const FORMAT_TANGGAL = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const inisial = (nama: string) =>
  nama
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((kata) => kata[0])
    .join("")
    .toUpperCase();

const urlGambar = (gambar: string | null) =>
  gambar ? `/api/publik/media/${gambar.split("/").map(encodeURIComponent).join("/")}` : null;

const angka = (nilai: number) => nilai.toLocaleString("id-ID");

function idDari(nilai: string | string[] | undefined) {
  const angka = Number(typeof nilai === "string" ? nilai : "");
  return Number.isSafeInteger(angka) && angka > 0 ? angka : null;
}

export default async function GaleriAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [albums, videos, akses, params] = await Promise.all([
    listGaleriKelolaAdminData(),
    listVideoGaleriAdminData(),
    aksesGaleriAdmin(),
    searchParams,
  ]);
  const pratinjau = albums.find((album) => album.id === idDari(params.album)) ?? null;
  const tayang = albums.filter((album) => album.aktif).length;
  const totalFoto = albums.reduce((jumlah, album) => jumlah + album.fotos.length, 0);
  const fotoSlider = albums.reduce(
    (jumlah, album) => jumlah + album.fotos.filter((foto) => foto.slider).length,
    0,
  );
  const sampulPratinjau = pratinjau ? urlGambar(pratinjau.sampul) : null;

  return (
    <div className="modul-page">
      <PageHeading>
        <header className="page-heading">
          <div>
            <h1>Galeri Desa</h1>
            <p>Kelola album foto dan video galeri.</p>
          </div>
        </header>
      </PageHeading>

      <section aria-label="Ringkasan galeri" className="pemerintahan-metrics berita-kpi">
        <article className="wilayah-kpi-kartu is-utama">
          <div className="wilayah-kpi-kepala">
            <span aria-hidden="true" className="wilayah-kpi-ikon">
              ▧
            </span>
            <span className="wilayah-kpi-label">Total Album</span>
          </div>
          <strong className="wilayah-kpi-nilai">{angka(albums.length)}</strong>
          <small className="wilayah-kpi-catatan">{angka(tayang)} tayang di website</small>
        </article>
        <article className="wilayah-kpi-kartu">
          <div className="wilayah-kpi-kepala">
            <span aria-hidden="true" className="wilayah-kpi-ikon is-hijau">
              ▣
            </span>
            <span className="wilayah-kpi-label">Total Foto</span>
          </div>
          <strong className="wilayah-kpi-nilai">{angka(totalFoto)}</strong>
          <small className="wilayah-kpi-catatan">{angka(fotoSlider)} tampil di slider</small>
        </article>
        <article className="wilayah-kpi-kartu">
          <div className="wilayah-kpi-kepala">
            <span aria-hidden="true" className="wilayah-kpi-ikon is-biru">
              ▷
            </span>
            <span className="wilayah-kpi-label">Video</span>
          </div>
          <strong className="wilayah-kpi-nilai">{angka(videos.length)}</strong>
          <small className="wilayah-kpi-catatan">Video kegiatan desa</small>
        </article>
        <article className="wilayah-kpi-kartu">
          <div className="wilayah-kpi-kepala">
            <span aria-hidden="true" className="wilayah-kpi-ikon is-oranye">
              ◔
            </span>
            <span className="wilayah-kpi-label">Nonaktif</span>
          </div>
          <strong className="wilayah-kpi-nilai">{angka(albums.length - tayang)}</strong>
          <small className="wilayah-kpi-catatan">Tidak tampil di website</small>
        </article>
      </section>

      {pratinjau ? (
        <section
          aria-label="Pratinjau album"
          className="pd-panel berita-pratinjau-panel"
          id="pratinjau-album"
        >
          <div className="berita-pratinjau-kepala">
            <div>
              <span className="berita-eyebrow">Pratinjau</span>
              <h2>{pratinjau.nama}</h2>
              <div className="berita-pratinjau-meta">
                <span className={`berita-status ${pratinjau.aktif ? "is-tayang" : "is-draft"}`}>
                  <i aria-hidden="true" />
                  {pratinjau.aktif ? "Tayang" : "Nonaktif"}
                </span>
                <span className="berita-kategori">{pratinjau.kategori ?? "Umum"}</span>
                <span>
                  {pratinjau.publishedAt
                    ? FORMAT_TANGGAL.format(pratinjau.publishedAt)
                    : "Belum terbit"}
                </span>
                <span aria-hidden="true">·</span>
                <span>{angka(pratinjau.fotos.length)} foto</span>
              </div>
            </div>
            <div className="wilayah-toolbar">
              <div className="wilayah-toolbar-grup">
                {pratinjau.aktif ? (
                  <Link
                    className="wilayah-tool"
                    href={`/galeri/${encodeURIComponent(pratinjau.slug)}`}
                  >
                    ↗ Buka di Website
                  </Link>
                ) : null}
                <Link className="wilayah-tool" href={`/konten/galeri/${pratinjau.id}`}>
                  Kelola Foto
                </Link>
                <Link className="wilayah-tool" href="/konten/galeri">
                  <span aria-hidden="true">✕</span> Tutup Pratinjau
                </Link>
              </div>
            </div>
          </div>
          <article className={`berita-pratinjau ${sampulPratinjau ? "is-bermedia" : ""}`}>
            {sampulPratinjau ? (
              <figure className="berita-pratinjau-media">
                <Image
                  alt={pratinjau.nama}
                  fill
                  sizes="(max-width: 860px) 100vw, 320px"
                  src={sampulPratinjau}
                  unoptimized
                />
              </figure>
            ) : null}
            <div className="berita-pratinjau-isi">
              {pratinjau.keterangan ? (
                <p className="berita-pratinjau-ringkasan">{pratinjau.keterangan}</p>
              ) : null}
              {pratinjau.fotos.length ? (
                <div className="galeri-pratinjau-foto">
                  {pratinjau.fotos.slice(0, 6).map((foto) => (
                    <Image
                      alt={foto.judul ?? pratinjau.nama}
                      height={72}
                      key={foto.id}
                      src={urlGambar(foto.gambar) ?? ""}
                      unoptimized
                      width={96}
                    />
                  ))}
                  {pratinjau.fotos.length > 6 ? (
                    <span>+{pratinjau.fotos.length - 6} lagi</span>
                  ) : null}
                </div>
              ) : (
                <p className="berita-pratinjau-ringkasan">Belum ada foto di album ini.</p>
              )}
            </div>
          </article>
        </section>
      ) : null}

      <section aria-label="Daftar album" className="pd-panel" id="daftar-album">
        <div className="pd-panel-kepala">
          <div>
            <h2>Daftar Album</h2>
            <p>
              {angka(tayang)} tayang · {angka(albums.length - tayang)} nonaktif.
            </p>
          </div>
          <div className="wilayah-toolbar">
            <span className="wilayah-count-pill">{angka(albums.length)} album</span>
            {akses.bolehTambah ? <DialogAlbum /> : null}
          </div>
        </div>

        {albums.length ? (
          <div className="modul-table-wrap">
            <table className="modul-table pemerintah-table berita-tabel">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Album</th>
                  <th>Kategori</th>
                  <th>Status</th>
                  <th>Terbit</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {albums.map((album, index) => {
                  const sampul = urlGambar(album.sampul);
                  return (
                    <tr
                      className={album.aktif ? undefined : "pemerintah-row-nonaktif"}
                      key={album.id}
                    >
                      <td>{index + 1}</td>
                      <td>
                        <div className="berita-sel">
                          <span aria-hidden className="berita-thumb">
                            {sampul ? (
                              <Image alt="" height={52} src={sampul} unoptimized width={52} />
                            ) : (
                              inisial(album.nama)
                            )}
                          </span>
                          <div className="berita-sel-isi">
                            <strong className="berita-sel-judul">{album.nama}</strong>
                            <div className="berita-sel-meta">
                              <span className="berita-badge is-slider">
                                ▣ {angka(album.fotos.length)} foto
                              </span>
                              <span className="berita-slug">/{album.slug}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="berita-kategori">{album.kategori ?? "Umum"}</span>
                        <small className="berita-baca">
                          {album.fotos.filter((foto) => foto.slider).length} slider
                        </small>
                      </td>
                      <td>
                        <span className={`berita-status ${album.aktif ? "is-tayang" : "is-draft"}`}>
                          <i aria-hidden="true" />
                          {album.aktif ? "Tayang" : "Nonaktif"}
                        </span>
                      </td>
                      <td>
                        <span className="berita-tanggal">
                          {album.publishedAt
                            ? FORMAT_TANGGAL.format(album.publishedAt)
                            : "Belum terbit"}
                          <small className="berita-tanggal-ket">
                            {album.publishedAt ? "Diterbitkan" : "Menunggu publikasi"}
                          </small>
                        </span>
                      </td>
                      <td>
                        <div className="pd-aparat-aksi">
                          <Link className="button button-ghost" href={`/konten/galeri/${album.id}`}>
                            Kelola Foto
                          </Link>
                          <Link
                            className="button button-ghost"
                            href={`/konten/galeri?album=${album.id}#pratinjau-album`}
                          >
                            Pratinjau
                          </Link>
                          {akses.bolehUbah ? <DialogAlbum item={album} /> : null}
                          {akses.bolehUbah ? (
                            <form action={ubahStatusAlbum}>
                              <input name="albumId" type="hidden" value={album.id} />
                              <input
                                name="aktif"
                                type="hidden"
                                value={album.aktif ? "false" : "true"}
                              />
                              <button className="button button-ghost" type="submit">
                                {album.aktif ? "Nonaktifkan" : "Tayangkan"}
                              </button>
                            </form>
                          ) : null}
                          {akses.bolehHapus ? (
                            <form action={hapusAlbum}>
                              <input name="albumId" type="hidden" value={album.id} />
                              <ConfirmSubmit
                                className="button button-danger-ghost"
                                message={`Hapus album "${album.nama}" beserta fotonya?`}
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
            <span aria-hidden="true">▧</span>
            <strong>Belum ada album</strong>
            <p>Klik &ldquo;Tambah Album&rdquo; untuk menambah album pertama.</p>
          </div>
        )}
      </section>

      <section aria-label="Video galeri" className="pd-panel" id="daftar-video">
        <div className="pd-panel-kepala">
          <div>
            <h2>Video Kegiatan</h2>
            <p>{angka(videos.length)} video YouTube/Vimeo.</p>
          </div>
          <div className="wilayah-toolbar">
            <span className="wilayah-count-pill">{angka(videos.length)} video</span>
            {akses.bolehUbah ? <DialogVideo /> : null}
          </div>
        </div>
        {videos.length ? (
          <div className="modul-table-wrap">
            <table className="modul-table pemerintah-table berita-tabel">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Video</th>
                  <th>Penyedia</th>
                  <th>Publikasi</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((video, index) => (
                  <tr key={video.id}>
                    <td>{index + 1}</td>
                    <td>
                      <div className="berita-sel-isi">
                        <strong className="berita-sel-judul">{video.judul}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="berita-kategori">{video.provider.toUpperCase()}</span>
                    </td>
                    <td>
                      <span className="berita-tanggal">
                        {video.publishedAt
                          ? FORMAT_TANGGAL.format(video.publishedAt)
                          : "Belum terbit"}
                      </span>
                    </td>
                    <td>
                      <div className="pd-aparat-aksi">
                        <Link className="button button-ghost" href={video.url} target="_blank">
                          ↗ Buka
                        </Link>
                        {akses.bolehHapus ? (
                          <form action={hapusVideoGaleri}>
                            <input name="videoId" type="hidden" value={video.id} />
                            <ConfirmSubmit
                              className="button button-danger-ghost"
                              message={`Hapus video "${video.judul}"?`}
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
            <span aria-hidden="true">▷</span>
            <strong>Belum ada video</strong>
            <p>Klik &ldquo;Tambah Video&rdquo; untuk menambah video pertama.</p>
          </div>
        )}
      </section>
    </div>
  );
}
