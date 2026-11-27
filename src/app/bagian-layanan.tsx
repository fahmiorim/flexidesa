import Link from "next/link";
import { Fragment } from "react";

import { formatSkor, type RekapIdm } from "@/features/program-data-desa/idm/domain/idm";

import styles from "./public-home.module.css";

/** Label pendek dimensi IDM agar muat di kolom sempit panel beranda. */
const LABEL_DIMENSI: Record<string, string> = {
  iks: "Sosial",
  ike: "Ekonomi",
  ikl: "Lingkungan",
};

/**
 * Ringkasan Status IDM di beranda.
 *
 * Menggantikan banner layanan lama: menampilkan skor dan status IDM desa aktif
 * beserta skor tiap dimensi, dengan tautan ke halaman status desa untuk rincian
 * indikator. Data berasal dari rekap IDM yang sudah dimuat halaman beranda.
 */
export function BannerIdm({
  namaDesa,
  rekapIdm,
  tahunIdm,
}: {
  namaDesa: string | null;
  rekapIdm: RekapIdm;
  tahunIdm: number;
}) {
  const terisi = rekapIdm.skor !== null;

  return (
    <section className={styles.serviceBanner}>
      <div className={styles.bannerIllustration}>
        ◉<b>✓</b>
      </div>
      <div className={styles.bannerCopy}>
        <strong>Status IDM {namaDesa ?? "Desa"}</strong>
        <small>
          {terisi
            ? `Indeks Desa Membangun ${tahunIdm}: skor ${formatSkor(rekapIdm.skor)} dengan status ${
                rekapIdm.status ?? "belum ditetapkan"
              }. Skor adalah rata-rata tiga dimensi ketahanan desa.`
            : `Indikator IDM ${tahunIdm} belum diisi. Lengkapi indikator agar skor dan status desa dapat dihitung.`}
        </small>
        <Link className={styles.bannerLink} href="/desa/status-des">
          Lihat Status IDM →
        </Link>
      </div>
      <div className={styles.bannerSteps}>
        {rekapIdm.dimensi.map((dimensi, index) => (
          <Fragment key={dimensi.id}>
            {index > 0 ? <b>·</b> : null}
            <span>
              <strong className={styles.bannerSkor}>{formatSkor(dimensi.skor)}</strong>
              <small>{LABEL_DIMENSI[dimensi.id] ?? dimensi.label}</small>
            </span>
          </Fragment>
        ))}
      </div>
    </section>
  );
}

export function TautanTerkait() {
  return (
    <section className={styles.relatedLinks}>
      <h2>— Tautan Terkait</h2>
      <div>
        <a href="https://batubarakab.go.id" target="_blank" rel="noreferrer">
          🏛　Kabupaten Batu Bara <small>batubarakab.go.id</small>
        </a>
        <a href="https://kemendesa.go.id" target="_blank" rel="noreferrer">
          🏢　Kementerian Desa <small>kemendesa.go.id</small>
        </a>
        <a href="https://sdgs.kemendesa.go.id" target="_blank" rel="noreferrer">
          🌐　SDGs Desa <small>sdgs.kemendesa.go.id</small>
        </a>
      </div>
    </section>
  );
}
