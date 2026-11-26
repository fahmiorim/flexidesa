import Image from "next/image";
import Link from "next/link";

import styles from "./public-home.module.css";

export function BannerLayanan() {
  return (
    <section className={styles.serviceBanner}>
      <div className={styles.bannerIllustration}>
        <Image src="/images/home-service-illustration.svg" alt="" width={100} height={72} />
      </div>
      <div className={styles.bannerCopy}>
        <strong>
          Urus Administrasi Desa
          <br />
          Kini Lebih Mudah & Cepat
        </strong>
        <small>
          Ajukan berbagai surat secara online, pantau prosesnya, dan ambil di kantor desa tanpa
          antre.
        </small>
      </div>
      <div className={styles.bannerSteps}>
        <span>
          ▤<small>Ajukan Permohonan</small>
        </span>
        <b>→</b>
        <span>
          ⌛<small>Proses & Verifikasi</small>
        </span>
        <b>→</b>
        <span>
          ♧<small>Dapatkan Notifikasi</small>
        </span>
        <b>→</b>
        <span>
          ✓<small>Ambil Dokumen</small>
        </span>
      </div>
      <Link href="/layanan/surat">Mulai Sekarang →</Link>
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
