import Image from "next/image";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import {
  aksesBeritaAdmin,
  listBeritaAdminData,
  listKategoriBeritaAdminData,
} from "@/features/info-desa/publik/application/konten-admin";
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
      <PageHeading judul={<>Berita Desa</>} deskripsi={<>Kelola berita dan kategori desa.</>} />

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
                <Link className="wilayah-tool" href="/profil-desa/berita">
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

      <TableCard
        actions={
          <>
            <KelolaKategoriBeritaDialog
              bolehHapus={akses.bolehHapus}
              bolehUbah={akses.bolehUbah}
              kategori={kategori.map((item) => ({
                ...item,
                jumlahBerita: jumlahPerKategori.get(item.id) ?? 0,
              }))}
            />
            {akses.bolehTambah ? <DialogBerita kategori={kategoriPilihan} /> : null}
          </>
        }
        description={`${angka(tayang)} tayang · ${angka(draft)} draft · ${angka(rows.length)} berita`}
        title="Daftar Berita"
      >
        {rows.length ? (
          <TableScroll className="modul-table-wrap">
            <Table className="modul-table pemerintah-table berita-tabel">
              <THead>
                <Row>
                  <HeaderCell>No</HeaderCell>
                  <HeaderCell>Berita</HeaderCell>
                  <HeaderCell>Kategori</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Terbit</HeaderCell>
                  <HeaderCell>Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {rows.map((row, index) => {
                  const gambar = urlGambar(row.gambar);
                  const published = row.status === "published";
                  return (
                    <Row className={published ? undefined : "pemerintah-row-nonaktif"} key={row.id}>
                      <Cell>{index + 1}</Cell>
                      <Cell>
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
                      </Cell>
                      <Cell>
                        <span className="berita-kategori">{row.kategori ?? "Umum"}</span>
                        <small className="berita-baca">{angka(row.hit)} kali dibaca</small>
                      </Cell>
                      <Cell>
                        <span className={`berita-status ${published ? "is-tayang" : "is-draft"}`}>
                          <i aria-hidden="true" />
                          {published ? "Tayang" : "Draft"}
                        </span>
                      </Cell>
                      <Cell>
                        <span className="berita-tanggal">
                          {row.terbitPada ? FORMAT_TANGGAL.format(row.terbitPada) : "Belum terbit"}
                          <small className="berita-tanggal-ket">
                            {row.terbitPada ? "Diterbitkan" : "Menunggu publikasi"}
                          </small>
                        </span>
                      </Cell>
                      <Cell>
                        <div className="pd-aparat-aksi">
                          <ButtonLink
                            variant="ghost"
                            href={`/profil-desa/berita?preview=${row.id}#pratinjau-berita`}
                          >
                            Pratinjau
                          </ButtonLink>
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
                              <Button variant="ghost" type="submit">
                                {published ? "Jadikan Draft" : "Publikasikan"}
                              </Button>
                            </form>
                          ) : null}
                          {akses.bolehHapus ? (
                            <DialogHapusForm
                              aksi={hapusBeritaAction}
                              id={row.id}
                              judul={`Hapus berita "${row.judul}"?`}
                              keterangan="Berita beserta gambarnya akan dihapus permanen."
                              labelAksi="Hapus berita"
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
            <span aria-hidden="true">▤</span>
            <strong>Belum ada berita</strong>
            <p>Klik &ldquo;Tulis Berita&rdquo; untuk menambah berita pertama.</p>
          </div>
        )}
      </TableCard>
    </div>
  );
}
