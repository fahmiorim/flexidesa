import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getIdentitasFromRequest } from "@/features/info-desa/desa/application/resolve-village";
import { muatTemaPublik } from "@/features/info-desa/publik/application/website-admin";
import { getPembangunanPublikBySlug } from "@/features/pembangunan-aset/pembangunan/application/use-cases";
import {
  formatAnggaran,
  statusPembangunanLabel,
} from "@/features/pembangunan-aset/pembangunan/domain/pembangunan";
import { mediaUrl } from "@/lib/media-url";

import { PublicSiteFooter, PublicSiteHeader } from "../../public-site-layout";
import styles from "../pembangunan.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const data = await getPembangunanPublikBySlug(slug);
    return {
      title: data.proyek.judul ?? "Pembangunan Desa",
      description: "Detail kegiatan pembangunan desa beserta anggaran dan status pelaksanaannya.",
    };
  } catch {
    return { title: "Pembangunan Desa" };
  }
}

export default async function DetailPembangunanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, desa] = await Promise.all([params, getIdentitasFromRequest()]);
  const tema = await muatTemaPublik(desa.id);
  let data;
  try {
    data = await getPembangunanPublikBySlug(slug);
  } catch {
    notFound();
  }
  const logoUrl = mediaUrl(desa.logo, desa.id);
  const p = data.proyek;
  return (
    <main className={styles.site} data-tema={tema?.slug}>
      <PublicSiteHeader
        desa={desa}
        location={[desa.namaKecamatan, desa.namaKabupaten, desa.namaPropinsi]
          .filter(Boolean)
          .join(", ")}
        logoUrl={logoUrl}
        activePath="/pembangunan"
      />
      <section className={styles.hero}>
        <div className={styles.container}>
          <nav>
            <Link href="/">Beranda</Link>
            <span>›</span>
            <Link href="/pembangunan">Pembangunan Desa</Link>
            <span>›</span>
            <span>{p.judul}</span>
          </nav>
          <span className={styles.eyebrow}>DETAIL PEMBANGUNAN</span>
          <h1>{p.judul}</h1>
          <p>
            {p.lokasi ?? "Lokasi belum dicantumkan"} · Tahun Anggaran {p.tahunAnggaran}
          </p>
        </div>
      </section>
      <div className={styles.container}>
        <article className={styles.detailCard}>
          <div className={styles.detailHeader}>
            <span className={styles.status}>{statusPembangunanLabel(p.status)}</span>
            <strong>{formatAnggaran(p.anggaran)}</strong>
          </div>
          <p>{p.deskripsi ?? "Deskripsi kegiatan belum tersedia."}</p>
          <div className={styles.progressLabel}>
            <span>Progres pekerjaan</span>
            <b>{p.progres}%</b>
          </div>
          <div className={styles.progress}>
            <i style={{ width: p.progres + "%" }} />
          </div>
          <dl className={styles.details}>
            <div>
              <dt>Sumber dana</dt>
              <dd>{p.sumberDana ?? "—"}</dd>
            </div>
            <div>
              <dt>Pelaksana</dt>
              <dd>{p.pelaksana ?? "—"}</dd>
            </div>
            <div>
              <dt>Mulai</dt>
              <dd>{p.mulai ?? "—"}</dd>
            </div>
            <div>
              <dt>Selesai</dt>
              <dd>{p.selesai ?? "—"}</dd>
            </div>
            <div>
              <dt>Volume</dt>
              <dd>
                {p.volume ?? "—"} {p.satuan ?? ""}
              </dd>
            </div>
            <div>
              <dt>Koordinat GPS</dt>
              <dd>
                {p.latitude !== null && p.longitude !== null ? (
                  <a
                    href={
                      "https://www.openstreetmap.org/?mlat=" +
                      p.latitude +
                      "&mlon=" +
                      p.longitude +
                      "#map=16/" +
                      p.latitude +
                      "/" +
                      p.longitude
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    Lihat lokasi di peta ↗
                  </a>
                ) : (
                  "Belum tersedia"
                )}
              </dd>
            </div>
          </dl>
          {p.hasil ? (
            <section>
              <h2>Hasil dan Manfaat</h2>
              <p>{p.hasil}</p>
            </section>
          ) : null}
        </article>
        <section className={styles.gallerySection}>
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.eyebrow}>DOKUMENTASI</span>
              <h2>Foto Pelaksanaan Kegiatan</h2>
            </div>
            <span>{data.dokumentasi.length} foto</span>
          </div>
          {data.dokumentasi.length ? (
            <div className={styles.gallery}>
              {data.dokumentasi.map((x) => {
                const src = mediaUrl(x.gambar, desa.id);
                return src ? (
                  <figure key={x.id}>
                    <Image
                      src={src}
                      alt={x.judul ?? p.judul}
                      width={480}
                      height={190}
                      unoptimized
                    />
                    <figcaption>
                      <strong>{x.judul ?? "Dokumentasi kegiatan"}</strong>
                      <span>{x.keterangan ?? ""}</span>
                    </figcaption>
                  </figure>
                ) : null;
              })}
            </div>
          ) : (
            <p className={styles.empty}>Dokumentasi foto belum tersedia.</p>
          )}
        </section>
        <Link className={styles.back} href="/pembangunan">
          ← Kembali ke daftar pembangunan
        </Link>
      </div>
      <PublicSiteFooter
        desa={desa}
        location={[desa.namaKecamatan, desa.namaKabupaten, desa.namaPropinsi]
          .filter(Boolean)
          .join(", ")}
        logoUrl={logoUrl}
      />
    </main>
  );
}
