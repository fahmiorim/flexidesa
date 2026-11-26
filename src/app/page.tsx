import { headers } from "next/headers";

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
import { bacaPengaturan } from "@/features/pengaturan/pengaturan/application/pengaturan-use-cases";
import { ringkasanIdmPublik } from "@/features/program-data-desa/idm/application/idm-use-cases";
import { hitungRekapIdm } from "@/features/program-data-desa/idm/domain/idm";

import { cleanText, mediaUrl } from "./bagian-beranda";
import { HeroBeranda } from "./bagian-hero";
import { BeritaPengumuman } from "./bagian-konten";
import { BannerLayanan, TautanTerkait } from "./bagian-layanan";
import { ProfilDanGaleri } from "./bagian-profil";
import { AksesCepat, SambutanStatistik } from "./bagian-statistik";
import { PlatformLanding } from "./platform-landing";
import styles from "./public-home.module.css";
import { PublicSiteFooter, PublicSiteHeader } from "./public-site-layout";

export const dynamic = "force-dynamic";

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
  const [pengaturan, profil, berita, slider, statistik, perangkat, albums, announcements, idm] =
    await Promise.all([
      bacaPengaturan(desa.id),
      profilDesaPublik(desa.id),
      daftarBerita(desa.id, { limit: 12 }),
      daftarSliderBeranda(desa.id),
      getStatistikDesa(desa.id),
      daftarPerangkatPublik(desa.id),
      daftarAlbumGaleri(desa.id),
      daftarDokumenPublik(desa.id, "pengumuman"),
      ringkasanIdmPublik(desa.id),
    ]);
  const rekapIdm = hitungRekapIdm(idm.indikator);

  const galleryAlbum = albums.find((album) => album.jumlahFoto > 0) ?? null;
  const galleryPhotos = galleryAlbum ? await daftarFotoAlbum(desa.id, galleryAlbum.id) : [];
  const location = locationLabel(desa);
  const leader = perangkat.find((item) =>
    (item.jabatan ?? "").toLocaleLowerCase("id-ID").includes("kepala desa"),
  );
  const heroImage = mediaUrl(slider[0]?.gambar, desa.id);
  const profileImage = mediaUrl(slider[1]?.gambar ?? galleryPhotos[0]?.gambar, desa.id);
  const intro =
    cleanText(profil?.sambutan) ||
    `Selamat datang di portal resmi ${desa.namaDesa ?? "desa"}. Media informasi, layanan publik, dan keterbukaan data desa.`;

  return (
    <main className={styles.site}>
      <PublicSiteHeader
        desa={desa}
        location={location}
        logoUrl={mediaUrl(desa.logo, desa.id)}
        activePath="/"
      />

      <HeroBeranda desa={desa} leader={leader} heroImage={heroImage} />

      <div className={styles.container}>
        <AksesCepat />

        <SambutanStatistik
          intro={intro}
          leader={leader}
          statistik={statistik}
          rekapIdm={rekapIdm}
          tahunIdm={idm.tahun}
        />

        <BeritaPengumuman
          desa={desa}
          berita={berita.slice(0, pengaturan.beritaBeranda)}
          announcements={announcements}
        />

        <ProfilDanGaleri
          desa={desa}
          profilSejarah={cleanText(profil?.sejarah)}
          intro={intro}
          profileImage={profileImage}
          albumSlug={galleryAlbum?.slug ?? null}
          photos={galleryPhotos.slice(0, 5)}
        />

        <BannerLayanan />

        <TautanTerkait />
      </div>
      <PublicSiteFooter desa={desa} location={location} logoUrl={mediaUrl(desa.logo, desa.id)} />
    </main>
  );
}
