import Image from "next/image";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import {
  aksesBeritaAdmin,
  listBeritaAdminData,
  listKategoriBeritaAdminData,
} from "@/features/publik/application/konten-admin";
import { sanitasiHtml } from "@/lib/sanitize";

import { hapusBeritaAction, ubahStatusBeritaAction } from "./actions";
import { DialogBerita } from "./dialog-berita";
import { KelolaKategoriBeritaDialog } from "./kelola-kategori-dialog";

export const metadata = { title: "Berita Desa" };

const FORMAT_TANGGAL = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const inisial = (judul: string) =>
  judul
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

export default async function BeritaAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [rows, kategori, akses, params] = await Promise.all([
    listBeritaAdminData(),
    listKategoriBeritaAdminData(),
    aksesBeritaAdmin(),
    searchParams,
  ]);
  const pratinjau = rows.find((row) => row.id === idDari(params.preview)) ?? null;
  const jumlahPerKategori = new Map<number, number>();
  for (const row of rows) {
    if (row.kategoriId === null) continue;
    jumlahPerKategori.set(row.kategoriId, (jumlahPerKategori.get(row.kategoriId) ?? 0) + 1);
  }
  const kategoriPilihan = kategori.map((item) => ({ id: item.id, nama: item.nama }));
  const tayang = rows.filter((row) => row.status === "published").length;
  const draft = rows.length - tayang;
  const totalDibaca = rows.reduce((total, row) => total + row.hit, 0);
  const gambarPratinjau = pratinjau ? urlGambar(pratinjau.gambar) : null;

  return (
    <div className="modul-page">
      <PageHeading>
        <header className="page-heading">
          <div>
            <h1>Berita Desa</h1>
            <p>Kelola berita dan kategori desa.</p>
          </div>
        </header>
      </PageHeading>

      <section aria-label="Ringkasan berita" className="pemerintahan-metrics berita-kpi">
        <article className="wilayah-kpi-kartu is-utama">
          <div className="wilayah-kpi-kepala">
            <span aria-hidden="true" className="wilayah-kpi-ikon">
              ▤
            </span>
            <span className="wilayah-kpi-label">Total Berita</span>
          </div>
          <strong className="wilayah-kpi-nilai">{angka(rows.length)}</strong>
          <small className="wilayah-kpi-catatan">{angka(kategori.length)} kategori terdaftar</small>
        </article>
        <article className="wilayah-kpi-kartu">
          <div className="wilayah-kpi-kepala">
            <span aria-hidden="true" className="wilayah-kpi-ikon is-hijau">
              ✓
            </span>
            <span className="wilayah-kpi-label">Tayang</span>
          </div>
          <strong className="wilayah-kpi-nilai">{angka(tayang)}</strong>
          <small className="wilayah-kpi-catatan">Tampil di website desa</small>
        </article>
        <article className="wilayah-kpi-kartu">
          <div className="wilayah-kpi-kepala">
            <span aria-hidden="true" className="wilayah-kpi-ikon is-biru">
              ✎
            </span>
            <span className="wilayah-kpi-label">Draft</span>
          </div>
          <strong className="wilayah-kpi-nilai">{angka(draft)}</strong>
          <small className="wilayah-kpi-catatan">Belum ditampilkan</small>
        </article>
        <article className="wilayah-kpi-kartu">
          <div className="wilayah-kpi-kepala">
            <span aria-hidden="true" className="wilayah-kpi-ikon is-oranye">
              ◔
            </span>
            <span className="wilayah-kpi-label">Total Dibaca</span>
          </div>
          <strong className="wilayah-kpi-nilai">{angka(totalDibaca)}</strong>
          <small className="wilayah-kpi-catatan">Kunjungan artikel publik</small>
        </article>
      </section>

      {pratinjau ? (
        <section
          aria-label="Pratinjau berita"
          className="pd-panel berita-pratinjau-panel"
          id="pratinjau-berita"
        >
          <div className="berita-pratinjau-kepala">
            <div>
              <span className="berita-eyebrow">Pratinjau</span>
              <h2>{pratinjau.judul}</h2>
              <div className="berita-pratinjau-meta">
                <span
                  className={`berita-status ${
                    pratinjau.status === "published" ? "is-tayang" : "is-draft"
                  }`}
                >
                  <i aria-hidden="true" />
                  {pratinjau.status === "published" ? "Tayang" : "Draft"}
                </span>
                <span className="berita-kategori">{pratinjau.kategori ?? "Umum"}</span>
                <span>
                  {pratinjau.terbitPada
                    ? FORMAT_TANGGAL.format(pratinjau.terbitPada)
                    : "Belum terbit"}
                </span>
                <span aria-hidden="true">·</span>
                <span>{angka(pratinjau.hit)} kali dibaca</span>
              </div>
            </div>
            <div className="wilayah-toolbar">
              <div className="wilayah-toolbar-grup">
                {pratinjau.status === "published" ? (
                  <Link
                    className="wilayah-tool"
                    href={`/berita/${encodeURIComponent(pratinjau.slug)}`}
                  >
                    ↗ Buka di Website
                  </Link>
                ) : null}
                <Link className="wilayah-tool" href="/konten/berita">
                  <span aria-hidden="true">✕</span> Tutup Pratinjau
                </Link>
              </div>
            </div>
          </div>
          <article className={`berita-pratinjau ${gambarPratinjau ? "is-bermedia" : ""}`}>
            {gambarPratinjau ? (
              <figure className="berita-pratinjau-media">
                <Image
                  alt={pratinjau.judul}
                  fill
                  sizes="(max-width: 860px) 100vw, 320px"
                  src={gambarPratinjau}
                  unoptimized
                />
              </figure>
            ) : null}
            <div className="berita-pratinjau-isi">
              {pratinjau.ringkasan ? (
                <p className="berita-pratinjau-ringkasan">{pratinjau.ringkasan}</p>
              ) : null}
              <div
                className="berita-pratinjau-teks"
                dangerouslySetInnerHTML={{ __html: sanitasiHtml(pratinjau.isi) }}
              />
            </div>
          </article>
        </section>
      ) : null}

      <section aria-label="Daftar berita" className="pd-panel" id="daftar-berita">
        <div className="pd-panel-kepala">
          <div>
            <h2>Daftar Berita</h2>
            <p>
              {angka(tayang)} tayang · {angka(draft)} draft.
            </p>
          </div>
          <div className="wilayah-toolbar">
            <span className="wilayah-count-pill">{angka(rows.length)} berita</span>
            <div className="wilayah-toolbar-grup">
              <KelolaKategoriBeritaDialog
                bolehHapus={akses.bolehHapus}
                bolehUbah={akses.bolehUbah}
                kategori={kategori.map((item) => ({
                  ...item,
                  jumlahBerita: jumlahPerKategori.get(item.id) ?? 0,
                }))}
                tombolClassName="wilayah-tool"
              />
            </div>
            {akses.bolehTambah ? <DialogBerita kategori={kategoriPilihan} /> : null}
          </div>
        </div>

        {rows.length ? (
          <div className="modul-table-wrap">
            <table className="modul-table pemerintah-table berita-tabel">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Berita</th>
                  <th>Kategori</th>
                  <th>Status</th>
                  <th>Terbit</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const gambar = urlGambar(row.gambar);
                  const published = row.status === "published";
                  return (
                    <tr className={published ? undefined : "pemerintah-row-nonaktif"} key={row.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="berita-sel">
                          <span aria-hidden className="berita-thumb">
                            {gambar ? (
                              <Image alt="" height={52} src={gambar} unoptimized width={52} />
                            ) : (
                              inisial(row.judul)
                            )}
                          </span>
                          <div className="berita-sel-isi">
                            <strong className="berita-sel-judul">{row.judul}</strong>
                            <div className="berita-sel-meta">
                              {row.headline ? (
                                <span className="berita-badge is-headline">★ Headline</span>
                              ) : null}
                              {row.slider ? (
                                <span className="berita-badge is-slider">◧ Slider</span>
                              ) : null}
                              <span className="berita-slug">/{row.slug}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="berita-kategori">{row.kategori ?? "Umum"}</span>
                        <small className="berita-baca">{angka(row.hit)} kali dibaca</small>
                      </td>
                      <td>
                        <span className={`berita-status ${published ? "is-tayang" : "is-draft"}`}>
                          <i aria-hidden="true" />
                          {published ? "Tayang" : "Draft"}
                        </span>
                      </td>
                      <td>
                        <span className="berita-tanggal">
                          {row.terbitPada ? FORMAT_TANGGAL.format(row.terbitPada) : "Belum terbit"}
                          <small className="berita-tanggal-ket">
                            {row.terbitPada ? "Diterbitkan" : "Menunggu publikasi"}
                          </small>
                        </span>
                      </td>
                      <td>
                        <div className="pd-aparat-aksi">
                          <Link
                            className="button button-ghost"
                            href={`/konten/berita?preview=${row.id}#pratinjau-berita`}
                          >
                            Pratinjau
                          </Link>
                          {akses.bolehUbah ? (
                            <DialogBerita item={row} kategori={kategoriPilihan} />
                          ) : null}
                          {akses.bolehUbah ? (
                            <form action={ubahStatusBeritaAction}>
                              <input name="id" type="hidden" value={row.id} />
                              <input
                                name="status"
                                type="hidden"
                                value={published ? "draft" : "published"}
                              />
                              <button className="button button-ghost" type="submit">
                                {published ? "Jadikan Draft" : "Publikasikan"}
                              </button>
                            </form>
                          ) : null}
                          {akses.bolehHapus ? (
                            <form action={hapusBeritaAction}>
                              <input name="id" type="hidden" value={row.id} />
                              <ConfirmSubmit
                                className="button button-danger-ghost"
                                message={`Hapus berita "${row.judul}"?`}
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
            <span aria-hidden="true">▤</span>
            <strong>Belum ada berita</strong>
            <p>Klik &ldquo;Tulis Berita&rdquo; untuk menambah berita pertama.</p>
          </div>
        )}
      </section>
    </div>
  );
}
