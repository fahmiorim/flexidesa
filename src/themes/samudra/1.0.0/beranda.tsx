import Image from "next/image";
import Link from "next/link";

import type { ThemeBerandaData } from "../../types";
import styles from "./theme.module.css";

/**
 * Isi beranda `samudra@1.0.0`.
 *
 * Berbeda dari kartu-kartu tema Arunika: pita statistik bergaris rambut,
 * sambutan Kepala Desa sebagai satu baris penuh yang ringkas di paling atas,
 * berita bergaya sorotan koran dengan daftar tanggal, pengumuman sebagai
 * linimasa, dan akses cepat bernomor. Semua angka, judul, tanggal, dan
 * tautan berasal dari `ThemeBerandaData` yang dihitung halaman dari use case
 * publik.
 */
const AKSES = [
  { href: "/layanan/surat", label: "Pengajuan Surat", deskripsi: "Administrasi surat menyurat" },
  { href: "/kontak", label: "Pengaduan", deskripsi: "Aspirasi dan keluhan warga" },
  { href: "/statistik", label: "Data Desa", deskripsi: "Kependudukan dan potensi" },
  { href: "/transparansi/apbdes", label: "APBDes", deskripsi: "Transparansi anggaran" },
  { href: "/agenda", label: "Jadwal Kegiatan", deskripsi: "Agenda pemerintah desa" },
  { href: "/layanan", label: "Layanan Lainnya", deskripsi: "Semua layanan desa" },
];

const TAUTAN = [
  {
    href: "https://batubarakab.go.id",
    label: "Kabupaten Batu Bara",
    keterangan: "batubarakab.go.id",
  },
  { href: "https://kemendesa.go.id", label: "Kementerian Desa", keterangan: "kemendesa.go.id" },
  { href: "https://sdgs.kemendesa.go.id", label: "SDGs Desa", keterangan: "sdgs.kemendesa.go.id" },
];

export function BerandaSamudra({
  villageName,
  statistik,
  idm,
  berita,
  pengumuman,
  sambutan,
  profil,
  galeri,
}: ThemeBerandaData) {
  const utama = berita[0];
  const lain = berita.slice(1, 5);

  return (
    <div className={styles.isiBeranda}>
      {/* Pita statistik: garis rambut, angka besar, tanpa kartu. */}
      <section className={styles.pita} aria-label="Ringkasan data desa">
        <div className={styles.pitaItem}>
          <span>Penduduk</span>
          <strong>{formatAngka(statistik.penduduk)}</strong>
        </div>
        <div className={styles.pitaItem}>
          <span>Kepala keluarga</span>
          <strong>{formatAngka(statistik.keluarga)}</strong>
        </div>
        <div className={styles.pitaItem}>
          <span>Dusun</span>
          <strong>{formatAngka(statistik.dusun)}</strong>
        </div>
        <div className={styles.pitaItem}>
          <span>Warga terdata</span>
          <strong>{formatAngka(statistik.wargaTerdata)}</strong>
        </div>
        <Link className={styles.pitaIdm} href="/desa/status-des">
          <span>IDM {idm.tahun}</span>
          <strong>{idm.skor ?? "—"}</strong>
          <small>{idm.status ?? "Belum ditetapkan"}</small>
        </Link>
      </section>

      {/* Sambutan: satu baris penuh yang ringkas di paling atas. */}
      <section className={styles.sambutan} aria-labelledby="samudra-sambutan">
        <header className={styles.bagianKepala}>
          <div>
            <p className={styles.kicker}>Sambutan</p>
            <h2 id="samudra-sambutan">Dari Kepala Desa</h2>
          </div>
          <div className={styles.penanda}>
            {sambutan.fotoUrl ? (
              <Image
                src={sambutan.fotoUrl}
                alt=""
                width={46}
                height={46}
                unoptimized
                className={styles.penandaFoto}
              />
            ) : null}
            <span>
              <strong>{sambutan.nama ?? "Kepala Desa"}</strong>
              <small>{sambutan.jabatan ?? "Kepala Desa"}</small>
            </span>
          </div>
        </header>
        <blockquote className={styles.kutipan}>{sambutan.teks}</blockquote>
      </section>

      <div className={styles.duaBagian}>
        {/* Berita: sorotan besar + linimasa tanggal. */}
        <section className={styles.bagian} aria-labelledby="samudra-berita">
          <header className={styles.bagianKepala}>
            <div>
              <p className={styles.kicker}>Kabar Desa</p>
              <h2 id="samudra-berita">Berita terbaru</h2>
            </div>
            <Link className={styles.tautanKecil} href="/berita">
              Semua berita →
            </Link>
          </header>

          {utama ? (
            <div className={styles.sorotan}>
              <Link
                className={styles.sorotanFoto}
                href={`/berita/${encodeURIComponent(utama.slug)}`}
              >
                {utama.gambarUrl ? (
                  <Image
                    src={utama.gambarUrl}
                    alt=""
                    fill
                    unoptimized
                    sizes="(max-width: 900px) 100vw, 46vw"
                  />
                ) : (
                  <span aria-hidden="true">BERITA</span>
                )}
              </Link>
              <div className={styles.sorotanTeks}>
                <time className={styles.tanggal}>{utama.tanggal}</time>
                <h3>
                  <Link href={`/berita/${encodeURIComponent(utama.slug)}`}>{utama.judul}</Link>
                </h3>
                <Link
                  className={styles.tautanKecil}
                  href={`/berita/${encodeURIComponent(utama.slug)}`}
                >
                  Baca selengkapnya →
                </Link>
              </div>
            </div>
          ) : (
            <p className={styles.kosong}>Belum ada berita yang dipublikasikan.</p>
          )}

          {lain.length ? (
            <ol className={styles.linimasa}>
              {lain.map((item) => (
                <li key={item.id}>
                  <time>{item.tanggal}</time>
                  <Link href={`/berita/${encodeURIComponent(item.slug)}`}>{item.judul}</Link>
                </li>
              ))}
            </ol>
          ) : null}
        </section>

        {/* Pengumuman resmi sebagai linimasa berpenanda. */}
        <section className={styles.bagian} aria-labelledby="samudra-pengumuman">
          <header className={styles.bagianKepala}>
            <div>
              <p className={styles.kicker}>Resmi</p>
              <h2 id="samudra-pengumuman">Pengumuman</h2>
            </div>
            <Link className={styles.tautanKecil} href="/pengumuman">
              Semua →
            </Link>
          </header>
          {pengumuman.length ? (
            <ul className={styles.linimasa}>
              {pengumuman.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <time>{item.keterangan ?? "Pengumuman"}</time>
                  <Link href={item.href}>{item.nama}</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.kosong}>Belum ada pengumuman yang dipublikasikan.</p>
          )}
        </section>
      </div>

      {/* Akses cepat bernomor: grid lebar, dua baris. */}
      <section className={styles.bagian} aria-labelledby="samudra-akses">
        <header className={styles.bagianKepala}>
          <div>
            <p className={styles.kicker}>Langsung</p>
            <h2 id="samudra-akses">Akses cepat</h2>
          </div>
        </header>
        <ol className={styles.akses}>
          {AKSES.map((item, index) => (
            <li key={item.href}>
              <Link href={item.href}>
                <b aria-hidden="true">{String(index + 1).padStart(2, "0")}</b>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.deskripsi}</small>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* Profil & galeri: teks editorial + pita foto. */}
      <section className={styles.bagian} aria-labelledby="samudra-profil">
        <header className={styles.bagianKepala}>
          <div>
            <p className={styles.kicker}>Tentang</p>
            <h2 id="samudra-profil">Profil {villageName ?? "desa"}</h2>
          </div>
          <Link className={styles.tautanKecil} href="/profil">
            Profil lengkap →
          </Link>
        </header>
        <div className={styles.profil}>
          <p className={styles.profilTeks}>{profil.teks}</p>
          {profil.gambarUrl ? (
            <Image
              src={profil.gambarUrl}
              alt={`Dokumentasi ${villageName ?? "desa"}`}
              width={440}
              height={280}
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
          <div className={styles.galeri}>
            {galeri.foto.slice(0, 5).map((foto) => (
              <Link href={`/galeri/${encodeURIComponent(galeri.albumSlug!)}`} key={foto.id}>
                <Image src={foto.url} alt={foto.judul} fill unoptimized sizes="20vw" />
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      {/* Tautan terkait. */}
      <footer className={styles.tautanTerkait}>
        <span>Tautan terkait</span>
        <ul>
          {TAUTAN.map((item) => (
            <li key={item.href}>
              <a href={item.href} target="_blank" rel="noreferrer">
                {item.label} <small>{item.keterangan}</small>
              </a>
            </li>
          ))}
        </ul>
      </footer>
    </div>
  );
}

function formatAngka(nilai: number): string {
  return new Intl.NumberFormat("id-ID").format(nilai);
}
