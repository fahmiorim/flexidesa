import Image from "next/image";
import Link from "next/link";

import type { ThemeBerandaData } from "../../types";
import styles from "./theme.module.css";

/**
 * Isi beranda `cakrawala@1.0.0`.
 *
 * Berbeda dari Arunika (kartu bertumpuk) dan Samudra (pita gelap + linimasa):
 * halaman disusun seperti muka surat kabar — kepala edisi, berita utama dua
 * kolom, kolom pengumuman berbingkai, sambutan sebagai kutipan tarik, angka
 * desa sebagai baris statistik bergaris, lalu indeks layanan bernomor.
 * Semua angka, judul, tanggal, kutipan, dan tautan berasal dari
 * `ThemeBerandaData` yang dihitung halaman dari use case publik.
 */
const LAYANAN = [
  { href: "/layanan/surat", label: "Pengajuan Surat", keterangan: "Administrasi surat menyurat" },
  { href: "/kontak", label: "Pengaduan Warga", keterangan: "Aspirasi dan keluhan" },
  { href: "/statistik", label: "Data Desa", keterangan: "Kependudukan dan potensi" },
  { href: "/transparansi/apbdes", label: "APBDes", keterangan: "Anggaran dan realisasi" },
  { href: "/agenda", label: "Agenda Kegiatan", keterangan: "Jadwal pemerintah desa" },
  { href: "/layanan", label: "Indeks Layanan", keterangan: "Seluruh layanan desa" },
];

const TAUTAN = [
  { href: "https://batubarakab.go.id", label: "Kabupaten Batu Bara" },
  { href: "https://kemendesa.go.id", label: "Kementerian Desa" },
  { href: "https://sdgs.kemendesa.go.id", label: "SDGs Desa" },
];

export function BerandaCakrawala({
  villageName,
  location,
  statistik,
  idm,
  berita,
  pengumuman,
  sambutan,
  profil,
  galeri,
}: ThemeBerandaData) {
  const utama = berita[0] ?? null;
  const lain = berita.slice(1, 5);
  const tanggalEdisi = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className={styles.beranda} data-native="cakrawala">
      {/* Kepala edisi + angka ringkas sebagai baris statistik. */}
      <section className={styles.edisi} aria-label="Ringkasan edisi dan data desa">
        <div className={styles.edisiBaris}>
          <span className={styles.edisiLabel}>Edisi digital</span>
          <time>{tanggalEdisi}</time>
          <span className={styles.edisiLokasi}>{location || villageName || "Desa"}</span>
        </div>
        <dl className={styles.edisiAngka}>
          <div>
            <dt>Penduduk</dt>
            <dd>{angka(statistik.penduduk)}</dd>
          </div>
          <div>
            <dt>Kepala keluarga</dt>
            <dd>{angka(statistik.keluarga)}</dd>
          </div>
          <div>
            <dt>Dusun</dt>
            <dd>{angka(statistik.dusun)}</dd>
          </div>
          <div>
            <dt>Warga terdata</dt>
            <dd>{angka(statistik.wargaTerdata)}</dd>
          </div>
          <div className={styles.edisiIdm}>
            <dt>IDM {idm.tahun}</dt>
            <dd>
              {idm.skor ?? "—"} <small>{idm.status ?? "Belum ditetapkan"}</small>
            </dd>
          </div>
        </dl>
      </section>

      {/* Berita utama + kolom pengumuman. */}
      <div className={styles.muka}>
        <section className={styles.utama} aria-labelledby="cakrawala-berita">
          <p className={styles.rubrik}>Kabar desa</p>
          {utama ? (
            <>
              <h2 id="cakrawala-berita" className={styles.judulUtama}>
                <Link href={`/berita/${encodeURIComponent(utama.slug)}`}>{utama.judul}</Link>
              </h2>
              <p className={styles.utamaMeta}>
                <time>{utama.tanggal}</time>
                <span aria-hidden="true">·</span>
                <span>{villageName ?? "Desa"}</span>
              </p>
              <Link className={styles.utamaFoto} href={`/berita/${encodeURIComponent(utama.slug)}`}>
                {utama.gambarUrl ? (
                  <Image
                    src={utama.gambarUrl}
                    alt=""
                    fill
                    unoptimized
                    sizes="(max-width: 900px) 100vw, 48vw"
                  />
                ) : (
                  <span aria-hidden="true">Berita utama</span>
                )}
              </Link>
              <p className={styles.utamaLanjut}>
                <Link href={`/berita/${encodeURIComponent(utama.slug)}`}>Baca selengkapnya →</Link>
              </p>
            </>
          ) : (
            <p className={styles.kosong}>Belum ada berita yang dipublikasikan.</p>
          )}

          {lain.length ? (
            <ol className={styles.indeksBerita}>
              {lain.map((item, index) => (
                <li key={item.id}>
                  <b aria-hidden="true">{String(index + 2).padStart(2, "0")}</b>
                  <Link href={`/berita/${encodeURIComponent(item.slug)}`}>
                    <strong>{item.judul}</strong>
                    <small>{item.tanggal}</small>
                  </Link>
                </li>
              ))}
            </ol>
          ) : null}

          {berita.length ? (
            <p className={styles.semuaTautan}>
              <Link href="/berita">Arsip berita desa →</Link>
            </p>
          ) : null}
        </section>

        <aside className={styles.sisi} aria-label="Pengumuman resmi">
          <section className={styles.pengumuman}>
            <header className={styles.sisiKepala}>
              <p className={styles.rubrik}>Resmi</p>
              <h2>Pengumuman</h2>
            </header>
            {pengumuman.length ? (
              <ul>
                {pengumuman.slice(0, 5).map((item) => (
                  <li key={item.id}>
                    <small>{item.keterangan ?? "Pengumuman"}</small>
                    <Link href={item.href}>{item.nama}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.kosong}>Belum ada pengumuman.</p>
            )}
            <Link className={styles.semuaTautan} href="/pengumuman">
              Semua pengumuman →
            </Link>
          </section>

          <section className={styles.pengumuman}>
            <header className={styles.sisiKepala}>
              <p className={styles.rubrik}>Agenda</p>
              <h2>Kegiatan</h2>
            </header>
            <p className={styles.sisiTeks}>
              Jadwal rapat, musyawarah, dan kegiatan pelayanan desa diperbarui pada halaman agenda.
            </p>
            <Link className={styles.semuaTautan} href="/agenda">
              Lihat agenda →
            </Link>
          </section>
        </aside>
      </div>

      {/* Sambutan: kutipan tarik dengan tanda tangan pejabat. */}
      <section className={styles.sambutan} aria-labelledby="cakrawala-sambutan">
        <div className={styles.sambutanKiri}>
          <p className={styles.rubrik}>Sambutan</p>
          <h2 id="cakrawala-sambutan">Dari Kepala Desa</h2>
          <div className={styles.sambutanTanda}>
            {sambutan.fotoUrl ? (
              <Image
                src={sambutan.fotoUrl}
                alt=""
                width={54}
                height={54}
                unoptimized
                className={styles.sambutanFoto}
              />
            ) : null}
            <span>
              <strong>{sambutan.nama ?? "Kepala Desa"}</strong>
              <small>{sambutan.jabatan ?? "Kepala Desa"}</small>
            </span>
          </div>
        </div>
        <blockquote className={styles.kutipan}>{sambutan.teks}</blockquote>
      </section>

      {/* Indeks layanan bernomor. */}
      <section className={styles.layanan} aria-labelledby="cakrawala-layanan">
        <header className={styles.bagianKepala}>
          <div>
            <p className={styles.rubrik}>Indeks</p>
            <h2 id="cakrawala-layanan">Layanan warga</h2>
          </div>
          <span className={styles.bagianCatatan}>Enam pintu masuk utama</span>
        </header>
        <ol className={styles.layananDaftar}>
          {LAYANAN.map((item, index) => (
            <li key={item.href}>
              <Link href={item.href}>
                <b aria-hidden="true">{String(index + 1).padStart(2, "0")}</b>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.keterangan}</small>
                </span>
                <i aria-hidden="true">→</i>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* Profil + pita foto dokumentasi. */}
      <section className={styles.profil} aria-labelledby="cakrawala-profil">
        <header className={styles.bagianKepala}>
          <div>
            <p className={styles.rubrik}>Tentang</p>
            <h2 id="cakrawala-profil">Profil {villageName ?? "desa"}</h2>
          </div>
          <Link className={styles.semuaTautan} href="/profil">
            Profil lengkap →
          </Link>
        </header>
        <div className={styles.profilIsi}>
          <p className={styles.profilTeks}>{profil.teks}</p>
          {profil.gambarUrl ? (
            <Image
              src={profil.gambarUrl}
              alt={`Dokumentasi ${villageName ?? "desa"}`}
              width={460}
              height={300}
              unoptimized
              className={styles.profilFoto}
            />
          ) : null}
        </div>
        <ul className={styles.profilTautan}>
          {profil.tautan.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <strong>{item.label}</strong>
                <small>{item.deskripsi}</small>
              </Link>
            </li>
          ))}
        </ul>
        {galeri.foto.length && galeri.albumSlug ? (
          <div className={styles.pitaFoto}>
            {galeri.foto.slice(0, 5).map((foto, index) => (
              <Link href={`/galeri/${encodeURIComponent(galeri.albumSlug!)}`} key={foto.id}>
                <Image src={foto.url} alt={foto.judul} fill unoptimized sizes="20vw" />
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <footer className={styles.tautanTerkait}>
        <span>Tautan resmi</span>
        <ul>
          {TAUTAN.map((item) => (
            <li key={item.href}>
              <a href={item.href} target="_blank" rel="noreferrer">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </footer>
    </div>
  );
}

function angka(nilai: number): string {
  return new Intl.NumberFormat("id-ID").format(nilai);
}
