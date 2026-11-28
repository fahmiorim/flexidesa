import { headers } from "next/headers";
import { Fragment } from "react";

import { hostPlatform } from "@/features/info-desa/desa/application/platform-host";
import { getIdentitasFromRequest } from "@/features/info-desa/desa/application/resolve-village";
import { getStatistikDesa } from "@/features/info-desa/desa/application/statistik-desa";
import { adalahHostPlatform } from "@/features/info-desa/desa/domain/host";
import {
  daftarAlbumGaleri,
  daftarBerita,
  daftarDokumenPublik,
  daftarFotoAlbum,
  daftarPerangkatPublik,
  daftarSliderBeranda,
  profilDesaPublik,
} from "@/features/info-desa/publik/application/konten-publik";
import { muatTemaPublik } from "@/features/info-desa/publik/application/website-admin";
import { bacaPengaturan } from "@/features/pengaturan/pengaturan/application/pengaturan-use-cases";
import { ringkasanIdmPublik } from "@/features/program-data-desa/idm/application/idm-use-cases";
import { formatSkor, hitungRekapIdm } from "@/features/program-data-desa/idm/domain/idm";
import { mediaUrl } from "@/lib/media-url";
import { resolveTema } from "@/themes/registry";
import { TemaRenderer } from "@/themes/renderer";
import type { ThemeBerandaData } from "@/themes/types";

import { cleanText, dateLabel, namaLengkap } from "./bagian-beranda";
import { HeroBeranda } from "./bagian-hero";
import { BeritaPengumuman } from "./bagian-konten";
import { BannerIdm, TautanTerkait } from "./bagian-layanan";
import { ProfilDanGaleri } from "./bagian-profil";
import { AksesCepat, SambutanStatistik } from "./bagian-statistik";
import { PlatformLanding } from "./platform-landing";
import styles from "./public-home.module.css";
import { PublicSiteFooter, PublicSiteHeader } from "./public-site-layout";

export const dynamic = "force-dynamic";

/**
 * Urutan bagian beranda per varian template.
 *
 * Semua bagian selalu ditampilkan; varian hanya mengubah urutan agar desain
 * terasa berbeda tanpa menghilangkan informasi desa.
 */
const URUTAN_BAGIAN: Record<
  "klasik" | "modern" | "ringkas",
  readonly ("akses" | "sambutan" | "berita" | "profil" | "idm" | "tautan")[]
> = {
  klasik: ["akses", "sambutan", "berita", "profil", "idm", "tautan"],
  modern: ["berita", "akses", "sambutan", "profil", "idm", "tautan"],
  ringkas: ["sambutan", "akses", "berita", "profil", "tautan", "idm"],
};

function locationLabel(desa: {
  namaKecamatan: string | null;
  namaKabupaten: string | null;
  namaPropinsi: string | null;
}) {
  return [desa.namaKecamatan, desa.namaKabupaten, desa.namaPropinsi].filter(Boolean).join(", ");
}

export default async function PublicHomePage() {
  if (adalahHostPlatform((await headers()).get("host"), hostPlatform)) return <PlatformLanding />;

  const desa = await getIdentitasFromRequest();
  const [
    pengaturan,
    profil,
    berita,
    slider,
    statistik,
    perangkat,
    albums,
    announcements,
    idm,
    tema,
  ] = await Promise.all([
    bacaPengaturan(desa.id),
    profilDesaPublik(desa.id),
    daftarBerita(desa.id, { limit: 12 }),
    daftarSliderBeranda(desa.id),
    getStatistikDesa(desa.id),
    daftarPerangkatPublik(desa.id),
    daftarAlbumGaleri(desa.id),
    daftarDokumenPublik(desa.id, "pengumuman"),
    ringkasanIdmPublik(desa.id),
    muatTemaPublik(desa.id),
  ]);
  const varian = tema?.layout ?? "klasik";
  const rekapIdm = hitungRekapIdm(idm.indikator);

  const galleryAlbum = albums.find((album) => album.jumlahFoto > 0) ?? null;
  const galleryPhotos = galleryAlbum ? await daftarFotoAlbum(desa.id, galleryAlbum.id) : [];
  const location = locationLabel(desa);
  const leader = perangkat.find((item) =>
    (item.jabatan ?? "").toLocaleLowerCase("id-ID").includes("kepala desa"),
  );
  const heroImage = mediaUrl(slider[0]?.gambar, desa.id);
  // Paket tema boleh menyediakan hero sendiri; data hero tetap dari use case
  // yang sama sehingga identitas, kepala desa, dan aksi tidak berubah.
  const definisiTema = tema ? resolveTema(tema.slug, tema.versi) : null;
  const heroTema = definisiTema?.hero
    ? {
        villageId: desa.id,
        villageName: desa.namaDesa ?? null,
        location,
        leaderName: leader ? namaLengkap(leader) : null,
        leaderRole: leader?.jabatan ?? null,
        leaderPhotoUrl: mediaUrl(leader?.foto, desa.id),
        heroImageUrl: heroImage,
        judulHero: tema?.judulHero || "Sistem Informasi Desa",
        subHero:
          tema?.subHero ||
          `Media informasi, layanan publik, dan keterbukaan data untuk masyarakat ${desa.namaDesa ?? "desa"}.`,
        ctaUtama: { href: "/layanan/surat", label: "Ajukan Surat Online" },
        ctaSekunder: { href: "/profil", label: "Lihat Profil Desa" },
      }
    : undefined;
  const profileImage = mediaUrl(slider[1]?.gambar ?? galleryPhotos[0]?.gambar, desa.id);
  const intro =
    cleanText(profil?.sambutan) ||
    `Selamat datang di portal resmi ${desa.namaDesa ?? "desa"}. Media informasi, layanan publik, dan keterbukaan data desa.`;

  const berandaTema: ThemeBerandaData | undefined = definisiTema?.beranda
    ? {
        villageId: desa.id,
        villageName: desa.namaDesa ?? null,
        location,
        statistik: {
          penduduk: statistik.total,
          keluarga: statistik.keluarga,
          dusun: statistik.perDusun.length,
          wargaTerdata: statistik.perDusun.reduce((sum, row) => sum + row.total, 0),
        },
        idm: {
          tahun: idm.tahun,
          skor: rekapIdm.skor === null ? null : formatSkor(rekapIdm.skor),
          status: rekapIdm.status ?? null,
          dimensi: rekapIdm.dimensi.map((d) => ({ label: d.label, skor: formatSkor(d.skor) })),
        },
        berita: berita.slice(0, 5).map((item) => ({
          id: item.id,
          slug: item.slug,
          judul: item.judul,
          tanggal: dateLabel(item.terbitPada ?? item.createdAt),
          gambarUrl: mediaUrl(item.gambar, desa.id),
        })),
        pengumuman: announcements.map((item) => ({
          id: item.id,
          nama: item.nama,
          keterangan:
            item.keterangan ??
            (item.tahun === null || item.tahun === undefined ? null : String(item.tahun)),
          href: item.tautan || "/pengumuman",
        })),
        sambutan: {
          teks: intro,
          nama: leader ? namaLengkap(leader) : null,
          jabatan: leader?.jabatan ?? null,
          fotoUrl: mediaUrl(leader?.foto, desa.id),
        },
        profil: {
          teks: cleanText(profil?.sejarah) || intro,
          gambarUrl: profileImage,
          tautan: [
            {
              href: "/visi-misi",
              label: "Visi & Misi",
              deskripsi: `Arah pembangunan ${desa.namaDesa ?? "desa"}`,
            },
            {
              href: "/profil#potensi",
              label: "Potensi Desa",
              deskripsi: "Potensi unggulan dan ekonomi desa",
            },
            {
              href: "/pemerintahan",
              label: "Struktur Pemerintahan",
              deskripsi: "Susunan perangkat dan lembaga desa",
            },
          ],
        },
        galeri: {
          albumSlug: galleryAlbum?.slug ?? null,
          foto: galleryPhotos.slice(0, 5).map((foto) => ({
            id: foto.id,
            url: mediaUrl(foto.gambar, desa.id) ?? "",
            judul: foto.judul || foto.keterangan || "Dokumentasi kegiatan desa",
          })),
        },
      }
    : undefined;

  // Setiap varian template menyusun ulang bagian beranda tanpa membuang data:
  // semua bagian tetap tampil, hanya urutannya yang berbeda per desain.
  const bagian = {
    akses: <AksesCepat />,
    sambutan: (
      <SambutanStatistik
        intro={intro}
        leader={leader}
        statistik={statistik}
        rekapIdm={rekapIdm}
        tahunIdm={idm.tahun}
      />
    ),
    berita: (
      <BeritaPengumuman
        desa={desa}
        berita={berita.slice(0, pengaturan.beritaBeranda)}
        announcements={announcements}
      />
    ),
    profil: (
      <ProfilDanGaleri
        desa={desa}
        profilSejarah={cleanText(profil?.sejarah)}
        intro={intro}
        profileImage={profileImage}
        albumSlug={galleryAlbum?.slug ?? null}
        photos={galleryPhotos.slice(0, 5)}
      />
    ),
    idm: <BannerIdm namaDesa={desa.namaDesa} rekapIdm={rekapIdm} tahunIdm={idm.tahun} />,
    tautan: <TautanTerkait />,
  };

  return (
    <main
      className={styles.site}
      data-tema={tema?.slug}
      data-gelap={tema?.style === "gelap" ? "ya" : undefined}
      data-varian={varian}
    >
      <PublicSiteHeader
        desa={desa}
        location={location}
        logoUrl={mediaUrl(desa.logo, desa.id)}
        activePath="/"
      />

      {heroTema ? null : (
        <HeroBeranda
          desa={desa}
          leader={leader}
          heroImage={heroImage}
          varian={varian}
          judulHero={tema?.judulHero}
          subHero={tema?.subHero}
        />
      )}

      <TemaRenderer
        villageId={desa.id}
        villageName={desa.namaDesa ?? null}
        location={location}
        activePath="/"
        surface="beranda"
        slots={bagian}
        heroData={heroTema}
        berandaData={berandaTema}
      >
        <div className={styles.container}>
          {URUTAN_BAGIAN[varian].map((kunci) => (
            <Fragment key={kunci}>{bagian[kunci]}</Fragment>
          ))}
        </div>
      </TemaRenderer>
      <PublicSiteFooter desa={desa} location={location} logoUrl={mediaUrl(desa.logo, desa.id)} />
    </main>
  );
}
