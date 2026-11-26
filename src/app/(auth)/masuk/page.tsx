import type { Metadata } from "next";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/app/(auth)/masuk/login-form";
import { hostPlatformEksplisit } from "@/features/info-desa/desa/application/platform-host";
import { getIdentitasFromRequest } from "@/features/info-desa/desa/application/resolve-village";
import { adalahHostPlatform } from "@/features/info-desa/desa/domain/host";
import { urlMediaDesa } from "@/features/info-desa/publik/application/media-url";
import { getCurrentUser } from "@/lib/dal";
import { safeNextPath } from "@/lib/safe-next-path";

import styles from "./masuk.module.css";

export const metadata: Metadata = {
  title: "Masuk",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ next?: string | string[] }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  // Host platform tidak melayani tenant desa, sehingga login warga/desa di sini
  // tidak punya tujuan. Administrator platform memakai halaman masuk khusus.
  // Daftar eksplisit dipakai agar deployment satu-domain (tanpa PLATFORM_HOSTS)
  // tetap dapat memakai `/masuk` sebagai jalan masuk staf desa.
  if (adalahHostPlatform((await headers()).get("host"), hostPlatformEksplisit)) {
    redirect("/super-admin-login");
  }

  const [user, desa] = await Promise.all([getCurrentUser(), getIdentitasFromRequest()]);
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);
  const namaDesa = desa.namaDesa ?? "Pemerintah Desa";
  const logoDesa = urlMediaDesa(desa.logo, desa.id);
  const inisialDesa = namaDesa.trim().charAt(0).toUpperCase();

  if (user) {
    redirect(user.residentId !== null ? "/layanan-mandiri" : nextPath);
  }

  return (
    <div className={styles.page}>
      <section className={styles.formPanel} aria-labelledby="login-title">
        <div className={styles.formInner}>
          <Link
            className={styles.brand}
            href="/"
            aria-label={`${namaDesa}, kembali ke beranda desa`}
          >
            {logoDesa ? (
              <Image
                className={styles.brandLogo}
                src={logoDesa}
                alt=""
                width={42}
                height={42}
                priority
                unoptimized
              />
            ) : (
              <span className={styles.brandMark} aria-hidden="true">
                {inisialDesa}
              </span>
            )}
            <span className={styles.brandCopy}>
              <strong>{namaDesa}</strong>
              <small>Layanan Warga Desa</small>
            </span>
          </Link>

          <div className={styles.card}>
            <span className={styles.eyebrow}>
              <i aria-hidden="true" />
              AKSES WARGA
            </span>
            <h1 id="login-title" className={styles.title}>
              Masuk ke akun warga
            </h1>
            <p className={styles.intro}>Masuk untuk mengajukan surat dan memantau permohonan.</p>

            <LoginForm nextPath={nextPath} />

            <p className={styles.help}>Mengalami kendala masuk? Hubungi administrator desa Anda.</p>
            <div className={styles.switchList}>
              <p className={styles.switchRow}>
                Belum memiliki akun? <Link href="/daftar">Daftar akun warga</Link>
              </p>
              <p className={styles.switchRow}>
                Administrator desa? <Link href="/masuk-admin">Masuk ke ruang kerja</Link>
              </p>
            </div>

            <p className={styles.backRow}>
              <Link href="/">← Kembali ke beranda desa</Link>
            </p>
          </div>

          <p className={styles.foot}>
            © {new Date().getFullYear()} Pemerintah {namaDesa} · Sistem Informasi Desa
          </p>
        </div>
      </section>

      <aside className={styles.visual} aria-label={`Layanan yang tersedia untuk warga ${namaDesa}`}>
        <span className={styles.photo} aria-hidden="true" />
        <div className={styles.visualContent}>
          <span className={styles.badge}>PORTAL WARGA DESA</span>
          <h2 className={styles.visualTitle}>
            Layanan desa,
            <br />
            dalam <em>genggaman</em>.
          </h2>
          <p className={styles.visualLead}>
            Satu akun untuk seluruh urusan administrasi desa — tanpa antre, tanpa jam kerja.
          </p>

          <ul className={styles.features}>
            <li className={styles.feature}>
              <span className={styles.featureIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M7 3.5h7l3 3v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 3.5v3h3M9 12h5M9 16h5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className={styles.featureText}>
                <b>Ajukan surat &amp; izin</b>
                <small>Formulir online, tanpa datang ke kantor desa</small>
              </span>
            </li>
            <li className={styles.feature}>
              <span className={styles.featureIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
                  <path
                    d="M12 7.5V12l3 1.8"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className={styles.featureText}>
                <b>Pantau status permohonan</b>
                <small>Lihat progres surat kapan pun Anda butuhkan</small>
              </span>
            </li>
            <li className={styles.feature}>
              <span className={styles.featureIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 5.5h16v10H12l-4.5 3.5v-3.5H4v-10Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.5 9.5h7M8.5 12.5h4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className={styles.featureText}>
                <b>Pengaduan &amp; aspirasi</b>
                <small>Sampaikan laporan dan pantau tindak lanjutnya</small>
              </span>
            </li>
            <li className={styles.feature}>
              <span className={styles.featureIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect
                    x="7"
                    y="3.5"
                    width="10"
                    height="17"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path
                    d="M10.5 17.5h3"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className={styles.featureText}>
                <b>Akses dari mana saja</b>
                <small>Ponsel, tablet, maupun komputer</small>
              </span>
            </li>
          </ul>
        </div>

        <div className={styles.visualFoot}>
          <span className={styles.stat}>
            <b>24/7</b>
            <small>Layanan terbuka</small>
          </span>
          <span className={styles.stat}>
            <b>1 akun</b>
            <small>Semua layanan</small>
          </span>
          <span className={styles.stat}>
            <b>Terlindungi</b>
            <small>Data pribadi</small>
          </span>
        </div>
      </aside>
    </div>
  );
}
