import Image from "next/image";
import Link from "next/link";

import type { ThemeProfilData } from "../../types";
import styles from "./theme.module.css";

/**
 * Halaman Profil Desa `samudra@1.0.0`.
 *
 * Berbeda dari susunan Arunika (sidebar navigasi + kartu bertumpuk): pita
 * hero gelap, navigasi anchor bernomor sebaris, fakta sebagai pita angka
 * bergaris rambut, visi sebagai kutipan editorial, misi/potensi/sarana
 * sebagai daftar bernomor, dan wilayah sebagai baris berkas. Seluruh data
 * berasal dari `ThemeProfilData` yang disiapkan halaman dari use case yang
 * sama, sehingga tidak ada field yang hilang.
 */
const NAVIGASI = [
  { href: "#tentang", label: "Tentang" },
  { href: "#sejarah", label: "Sejarah" },
  { href: "#visi-misi", label: "Visi & Misi" },
  { href: "#wilayah", label: "Wilayah" },
  { href: "#potensi", label: "Potensi" },
  { href: "#sarana-prasarana", label: "Sarana" },
  { href: "#data-umum", label: "Data Umum" },
];

export function ProfilSamudra({
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
    <>
      <section className={styles.pHero} data-hero="samudra">
        {heroImageUrl ? (
          <Image
            src={heroImageUrl}
            alt=""
            fill
            unoptimized
            className={styles.pHeroFoto}
            sizes="100vw"
          />
        ) : null}
        <div className={styles.pHeroTirai} aria-hidden="true" />
        <div className={styles.pHeroIsi}>
          <nav className={styles.pCrumb} aria-label="Breadcrumb">
            <Link href="/">Beranda</Link>
            <span aria-hidden="true">›</span>
            <span aria-current="page">Profil Desa</span>
          </nav>
          <h1>Profil {villageName ?? "Desa"}</h1>
          <p>Sejarah, visi misi, wilayah, potensi, dan kondisi {villageName ?? "desa"}.</p>
        </div>
      </section>

      <div className={styles.isiProfil}>
        <nav className={styles.pNav} aria-label="Navigasi profil desa">
          {NAVIGASI.map((item, index) => (
            <a href={item.href} key={item.href}>
              <b aria-hidden="true">{String(index + 1).padStart(2, "0")}</b>
              {item.label}
            </a>
          ))}
        </nav>

        {/* Tentang + fakta sebagai pita angka. */}
        <section className={styles.bagian} id="tentang" aria-labelledby="samudra-tentang">
          <header className={styles.bagianKepala}>
            <div>
              <p className={styles.kicker}>Tentang Desa</p>
              <h2 id="samudra-tentang">Tentang {villageName ?? "Desa"}</h2>
            </div>
          </header>
          <div className={styles.profil}>
            <p className={styles.profilTeks}>{tentang.teks}</p>
            {tentang.fotoUrl ? (
              <Image
                src={tentang.fotoUrl}
                alt={tentang.fotoAlt}
                width={440}
                height={280}
                unoptimized
                className={styles.profilFoto}
              />
            ) : null}
          </div>
          <div className={styles.pFakta}>
            <div className={styles.pFaktaItem}>
              <span>Tahun berdiri</span>
              <strong>{fakta.tahunBerdiri}</strong>
            </div>
            <div className={styles.pFaktaItem}>
              <span>Penduduk</span>
              <strong>{fakta.penduduk}</strong>
            </div>
            <div className={styles.pFaktaItem}>
              <span>Kepala keluarga</span>
              <strong>{fakta.keluarga}</strong>
            </div>
            <div className={styles.pFaktaItem}>
              <span>Luas wilayah</span>
              <strong>{fakta.luasWilayah}</strong>
            </div>
          </div>
        </section>

        {/* Sejarah: teks editorial + foto. */}
        <section className={styles.bagian} id="sejarah" aria-labelledby="samudra-sejarah">
          <header className={styles.bagianKepala}>
            <div>
              <p className={styles.kicker}>Kisah</p>
              <h2 id="samudra-sejarah">Sejarah Singkat Desa</h2>
            </div>
            <Link className={styles.tautanKecil} href="/sejarah">
              Selengkapnya →
            </Link>
          </header>
          <div className={styles.profil}>
            <p className={styles.profilTeks}>
              {sejarah.teks || "Sejarah desa belum dipublikasikan oleh pemerintah desa."}
            </p>
            {sejarah.fotoUrl ? (
              <Image
                src={sejarah.fotoUrl}
                alt="Dokumentasi sejarah desa"
                width={440}
                height={280}
                unoptimized
                className={styles.profilFoto}
              />
            ) : null}
          </div>
        </section>

        {/* Visi sebagai kutipan, misi sebagai daftar bernomor. */}
        <section className={styles.bagian} id="visi-misi" aria-labelledby="samudra-visi">
          <header className={styles.bagianKepala}>
            <div>
              <p className={styles.kicker}>Arah</p>
              <h2 id="samudra-visi">Visi &amp; Misi Desa</h2>
            </div>
            <Link className={styles.tautanKecil} href="/visi-misi">
              Visi &amp; misi lengkap →
            </Link>
          </header>
          <blockquote className={styles.pVisi}>
            {visi || "Visi desa belum dipublikasikan."}
          </blockquote>
          {misi.length ? (
            <ol className={styles.pMisi}>
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
        </section>

        {/* Wilayah: baris berkas administratif + tautan peta. */}
        <section className={styles.bagian} id="wilayah" aria-labelledby="samudra-wilayah">
          <header className={styles.bagianKepala}>
            <div>
              <p className={styles.kicker}>Letak</p>
              <h2 id="samudra-wilayah">Wilayah Administratif</h2>
            </div>
            {wilayah.mapUrl ? (
              <a
                className={styles.tautanKecil}
                href={wilayah.mapUrl}
                target="_blank"
                rel="noreferrer"
              >
                Buka peta lokasi ↗
              </a>
            ) : null}
          </header>
          <p className={styles.pTeks}>
            Secara administratif, {villageName ?? "desa"} berada di{" "}
            {location || "wilayah administratif yang belum dilengkapi"}.
          </p>
          <dl className={styles.pBerkas}>
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
            {wilayah.dusun.map((label) => (
              <div key={label}>
                <dt>Dusun</dt>
                <dd>{label}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Potensi: daftar bernomor. */}
        <section className={styles.bagian} id="potensi" aria-labelledby="samudra-potensi">
          <header className={styles.bagianKepala}>
            <div>
              <p className={styles.kicker}>Kekuatan</p>
              <h2 id="samudra-potensi">Potensi Desa</h2>
            </div>
            <Link className={styles.tautanKecil} href="/potensi">
              Semua potensi →
            </Link>
          </header>
          {potensi.length ? (
            <ol className={styles.pDaftar}>
              {potensi.map((item, index) => (
                <li key={index}>
                  <b aria-hidden="true">{String(index + 1).padStart(2, "0")}</b>
                  <span>
                    <strong>{item.judul}</strong>
                    {item.ringkasan ? <small>{item.ringkasan}</small> : null}
                    {item.lokasi ? <small>{item.lokasi}</small> : null}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.kosong}>Informasi potensi desa belum dipublikasikan.</p>
          )}
        </section>

        {/* Sarana & prasarana: daftar bernomor. */}
        <section className={styles.bagian} id="sarana-prasarana" aria-labelledby="samudra-sarana">
          <header className={styles.bagianKepala}>
            <div>
              <p className={styles.kicker}>Fasilitas</p>
              <h2 id="samudra-sarana">Sarana &amp; Prasarana Desa</h2>
            </div>
          </header>
          {sarana.length ? (
            <ol className={styles.pDaftar}>
              {sarana.map((item, index) => (
                <li key={index}>
                  <b aria-hidden="true">{String(index + 1).padStart(2, "0")}</b>
                  <span>
                    <strong>{item.nama}</strong>
                    {item.keterangan ? <small>{item.keterangan}</small> : null}
                    {item.lokasi ? <small>{item.lokasi}</small> : null}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.kosong}>
              Data sarana dan prasarana desa belum tersedia untuk ditampilkan.
            </p>
          )}
        </section>

        {/* Data umum: pita angka ringkas. */}
        <section className={styles.bagian} id="data-umum" aria-labelledby="samudra-data">
          <header className={styles.bagianKepala}>
            <div>
              <p className={styles.kicker}>Angka</p>
              <h2 id="samudra-data">Data Umum Desa</h2>
            </div>
            <Link className={styles.tautanKecil} href="/statistik">
              Statistik lengkap →
            </Link>
          </header>
          <div className={styles.pFakta}>
            <div className={styles.pFaktaItem}>
              <span>Jumlah penduduk</span>
              <strong>{dataUmum.penduduk} jiwa</strong>
            </div>
            <div className={styles.pFaktaItem}>
              <span>Jumlah kepala keluarga</span>
              <strong>{dataUmum.keluarga} KK</strong>
            </div>
            <div className={styles.pFaktaItem}>
              <span>Dusun terdata</span>
              <strong>{dataUmum.dusun} dusun</strong>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
