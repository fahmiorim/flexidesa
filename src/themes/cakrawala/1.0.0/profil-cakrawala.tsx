import Image from "next/image";
import Link from "next/link";

import type { ThemeProfilData } from "../../types";
import styles from "./theme.module.css";

/**
 * Halaman Profil Desa `cakrawala@1.0.0`.
 *
 * Berbeda dari Arunika (sidebar kartu) dan Samudra (pita gelap + daftar
 * bernomor): dossier editorial terang — kepala halaman serif dengan meta
 * wilayah, foto lanskap berbingkai, daftar isi lengket di kiri, dan isi
 * kanan yang memakai paragraf berhuruf awal, pita fakta bergaris, kutipan
 * visi, serta daftar misi/potensi/sarana bernomor. Seluruh nilai berasal
 * dari `ThemeProfilData` sehingga tidak ada field yang hilang.
 */
const DAFTAR_ISI = [
  { href: "#tentang", label: "Tentang" },
  { href: "#sejarah", label: "Sejarah" },
  { href: "#visi-misi", label: "Visi & Misi" },
  { href: "#wilayah", label: "Wilayah" },
  { href: "#potensi", label: "Potensi" },
  { href: "#sarana-prasarana", label: "Sarana" },
  { href: "#data-umum", label: "Data Umum" },
];

export function ProfilCakrawala({
  villageName,
  location,
  heroImageUrl,
  tentang,
  fakta,
  sejarah,
  visi,
  misi,
  wilayah,
  potensi,
  sarana,
  dataUmum,
}: ThemeProfilData) {
  return (
    <article className={styles.dossier} data-native="cakrawala">
      <header className={styles.dossierKepala}>
        <nav className={styles.dossierCrumb} aria-label="Breadcrumb">
          <Link href="/">Beranda</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Profil Desa</span>
        </nav>
        <p className={styles.rubrik}>Dossier desa</p>
        <h1>
          Profil <em>{villageName ?? "Desa"}</em>
        </h1>
        <p className={styles.dossierMeta}>
          {dossierMeta(location, wilayah.kecamatan, wilayah.kabupaten, wilayah.provinsi)}
        </p>
        {heroImageUrl ? (
          <figure className={styles.dossierFig}>
            <Image
              src={heroImageUrl}
              alt={`Dokumentasi ${villageName ?? "desa"}`}
              width={1280}
              height={520}
              unoptimized
              className={styles.dossierFoto}
            />
            <figcaption>
              {villageName ?? "Desa"} · {wilayah.kecamatan ?? (location || "Wilayah desa")}
            </figcaption>
          </figure>
        ) : null}
      </header>

      <div className={styles.dossierIsi}>
        <nav className={styles.dossierNav} aria-label="Daftar isi profil desa">
          <strong>Daftar isi</strong>
          <ol>
            {DAFTAR_ISI.map((item, index) => (
              <li key={item.href}>
                <a href={item.href}>
                  <b aria-hidden="true">{String(index + 1).padStart(2, "0")}</b>
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className={styles.dossierUtama}>
          <section className={styles.dossierBagian} id="tentang">
            <header className={styles.bagianKepala}>
              <p className={styles.rubrik}>01 · Tentang</p>
              <h2>{villageName ?? "Desa"}</h2>
            </header>
            <div className={styles.dossierDua}>
              <p className={styles.hurufAwal}>{tentang.teks}</p>
              {tentang.fotoUrl ? (
                <figure className={styles.dossierSisiFoto}>
                  <Image
                    src={tentang.fotoUrl}
                    alt={tentang.fotoAlt}
                    width={420}
                    height={300}
                    unoptimized
                  />
                  <figcaption>
                    {tentang.kepalaDesaNama ?? tentang.fotoAlt}
                    {tentang.kepalaDesaJabatan ? ` · ${tentang.kepalaDesaJabatan}` : null}
                  </figcaption>
                </figure>
              ) : null}
            </div>
            <dl className={styles.faktaBaris}>
              <div>
                <dt>Tahun berdiri</dt>
                <dd>{fakta.tahunBerdiri}</dd>
              </div>
              <div>
                <dt>Penduduk</dt>
                <dd>{fakta.penduduk}</dd>
              </div>
              <div>
                <dt>Kepala keluarga</dt>
                <dd>{fakta.keluarga}</dd>
              </div>
              <div>
                <dt>Luas wilayah</dt>
                <dd>{fakta.luasWilayah}</dd>
              </div>
            </dl>
          </section>

          <section className={styles.dossierBagian} id="sejarah">
            <header className={styles.bagianKepala}>
              <p className={styles.rubrik}>02 · Sejarah</p>
              <h2>Jejak perjalanan desa</h2>
            </header>
            <p className={styles.dossierTeks}>
              {sejarah.teks || "Sejarah desa belum dipublikasikan oleh pemerintah desa."}
            </p>
            {sejarah.fotoUrl ? (
              <figure className={styles.dossierLebarFoto}>
                <Image
                  src={sejarah.fotoUrl}
                  alt="Dokumentasi sejarah desa"
                  width={960}
                  height={420}
                  unoptimized
                />
              </figure>
            ) : null}
            <p className={styles.dossierTautan}>
              <Link href="/sejarah">Sejarah lengkap →</Link>
            </p>
          </section>

          <section className={styles.dossierBagian} id="visi-misi">
            <header className={styles.bagianKepala}>
              <p className={styles.rubrik}>03 · Arah</p>
              <h2>Visi &amp; misi</h2>
            </header>
            <blockquote className={styles.dossierVisi}>
              {visi || "Visi desa belum dipublikasikan."}
            </blockquote>
            {misi.length ? (
              <ol className={styles.misiDaftar}>
                {misi.map((item, index) => (
                  <li key={index}>
                    <b aria-hidden="true">{String(index + 1).padStart(2, "0")}</b>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className={styles.kosong}>Misi desa belum dipublikasikan.</p>
            )}
            <p className={styles.dossierTautan}>
              <Link href="/visi-misi">Visi &amp; misi lengkap →</Link>
            </p>
          </section>

          <section className={styles.dossierBagian} id="wilayah">
            <header className={styles.bagianKepala}>
              <p className={styles.rubrik}>04 · Letak</p>
              <h2>Wilayah administratif</h2>
            </header>
            <p className={styles.dossierTeks}>
              {villageName ?? "Desa"} berada di{" "}
              {location || "wilayah administratif yang belum dilengkapi"}.
            </p>
            <dl className={styles.berkasBaris}>
              <div>
                <dt>Kecamatan</dt>
                <dd>{wilayah.kecamatan || "Belum diisi"}</dd>
              </div>
              <div>
                <dt>Kabupaten</dt>
                <dd>{wilayah.kabupaten || "Belum diisi"}</dd>
              </div>
              <div>
                <dt>Provinsi</dt>
                <dd>{wilayah.provinsi || "Belum diisi"}</dd>
              </div>
              <div>
                <dt>Dusun</dt>
                <dd>{wilayah.dusun.length ? wilayah.dusun.join(" · ") : "Belum diisi"}</dd>
              </div>
            </dl>
            {wilayah.mapUrl ? (
              <p className={styles.dossierTautan}>
                <a href={wilayah.mapUrl} target="_blank" rel="noreferrer">
                  Buka peta lokasi ↗
                </a>
              </p>
            ) : null}
          </section>

          <section className={styles.dossierBagian} id="potensi">
            <header className={styles.bagianKepala}>
              <p className={styles.rubrik}>05 · Kekuatan</p>
              <h2>Potensi desa</h2>
            </header>
            {potensi.length ? (
              <ol className={styles.potensiDaftar}>
                {potensi.map((item, index) => (
                  <li key={index}>
                    <b aria-hidden="true">{String(index + 1).padStart(2, "0")}</b>
                    <div>
                      <strong>{item.judul}</strong>
                      {item.ringkasan ? <p>{item.ringkasan}</p> : null}
                      {item.lokasi ? <small>{item.lokasi}</small> : null}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className={styles.kosong}>Informasi potensi desa belum dipublikasikan.</p>
            )}
            <p className={styles.dossierTautan}>
              <Link href="/potensi">Semua potensi →</Link>
            </p>
          </section>

          <section className={styles.dossierBagian} id="sarana-prasarana">
            <header className={styles.bagianKepala}>
              <p className={styles.rubrik}>06 · Fasilitas</p>
              <h2>Sarana &amp; prasarana</h2>
            </header>
            {sarana.length ? (
              <ol className={styles.potensiDaftar}>
                {sarana.map((item, index) => (
                  <li key={index}>
                    <b aria-hidden="true">{String(index + 1).padStart(2, "0")}</b>
                    <div>
                      <strong>{item.nama}</strong>
                      {item.keterangan ? <p>{item.keterangan}</p> : null}
                      {item.lokasi ? <small>{item.lokasi}</small> : null}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className={styles.kosong}>
                Data sarana dan prasarana desa belum tersedia untuk ditampilkan.
              </p>
            )}
          </section>

          <section className={styles.dossierBagian} id="data-umum">
            <header className={styles.bagianKepala}>
              <p className={styles.rubrik}>07 · Angka</p>
              <h2>Data umum</h2>
            </header>
            <dl className={styles.faktaBaris}>
              <div>
                <dt>Jumlah penduduk</dt>
                <dd>{dataUmum.penduduk} jiwa</dd>
              </div>
              <div>
                <dt>Kepala keluarga</dt>
                <dd>{dataUmum.keluarga} KK</dd>
              </div>
              <div>
                <dt>Dusun terdata</dt>
                <dd>{dataUmum.dusun} dusun</dd>
              </div>
            </dl>
            <p className={styles.dossierTautan}>
              <Link href="/statistik">Statistik lengkap →</Link>
            </p>
          </section>

          <p className={styles.dossierAtas}>
            <a href="#tentang">↑ Kembali ke atas</a>
          </p>
        </div>
      </div>
    </article>
  );
}

function dossierMeta(...bagian: (string | null | undefined)[]): string {
  const isi = bagian.map((item) => (item ?? "").trim()).filter(Boolean);
  return isi.length ? isi.join(" · ") : "Profil desa";
}
