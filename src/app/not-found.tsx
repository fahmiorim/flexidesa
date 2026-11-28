import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import type { CSSProperties } from "react";

import { getVillageIdByHost } from "@/features/info-desa/desa/application/resolve-village";
import { muatTemaPublik } from "@/features/info-desa/publik/application/website-admin";
import { resolveTema } from "@/themes/registry";
import { validasiOpsiTenant, warnaDasarDari } from "@/themes/types";

import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan",
  robots: { index: false, follow: false },
};

type TemaAktif = Awaited<ReturnType<typeof muatTemaPublik>>;

/**
 * Tema aktif desa untuk host permintaan ini, atau `null` bila host adalah
 * host platform, tidak terdaftar, atau resolusi gagal.
 *
 * `getIdentitasFromRequest` tidak dipakai karena ia memanggil `notFound()`
 * untuk host tak dikenal — memanggilnya dari halaman 404 akan berputar.
 * Pemetaan host memakai use case `getVillageIdByHost` (varian non-404 dari
 * resolver publik) tanpa pernah melempar 404; kegagalan apa pun jatuh ke
 * `null` sehingga 404 netral tetap tampil.
 */
async function temaAktifDariHost(): Promise<TemaAktif> {
  try {
    const host = (await headers()).get("host");
    const villageId = await getVillageIdByHost(host);
    if (villageId === null) return null;
    return await muatTemaPublik(villageId);
  } catch {
    return null;
  }
}

/**
 * Halaman 404 mengikuti tema desa yang aktif.
 *
 * Token tema disuntikkan sebagai variabel `--public-*` pada `<main>` (pola
 * yang sama dengan shell publik), dan `data-tema` menandai slug paket agar
 * stylesheet paket (`samudra-publik.css`, `cakrawala-publik.css`) ikut
 * berlaku. Tanpa tema (host platform/tak dikenal) tampilannya netral
 * seperti sebelumnya.
 */
export default async function NotFound() {
  const tema = await temaAktifDariHost();
  const opsiTema = tema
    ? validasiOpsiTenant(resolveTema(tema.slug, tema.versi)?.opsi ?? [], tema.templateOptions ?? {})
    : {};
  const warnaDasar = warnaDasarDari(opsiTema) ?? tema?.primary;
  const gaya = tema
    ? ({
        "--public-primary": warnaDasar,
        "--public-secondary": tema.secondary,
        "--public-accent": tema.accent,
        "--public-background": tema.background,
        "--public-surface": tema.surface,
        "--public-text": tema.text,
        "--public-heading-font":
          tema.fontHeading === "serif" ? "Georgia, 'Times New Roman', serif" : undefined,
        "--public-radius": tema.radius,
      } as CSSProperties)
    : undefined;

  return (
    <main className={styles.page} data-tema={tema?.slug} data-gaya={tema?.style} style={gaya}>
      <section className={styles.inner} aria-labelledby="not-found-title">
        <div className={styles.art} aria-hidden="true">
          <span className={styles.code}>404</span>
          <svg className={styles.magnifier} viewBox="0 0 96 96" focusable="false">
            <circle cx="42" cy="42" r="26" />
            <path d="M61 61l20 20" />
            <path d="M32 37c3-5 9-8 15-7" className={styles.glint} />
          </svg>
        </div>

        <h1 id="not-found-title">Halaman Tidak Ditemukan</h1>
        <p className={styles.lead}>Halaman tidak ditemukan atau sudah dipindahkan.</p>

        <div className={styles.actions}>
          <Link className={styles.primary} href="/">
            Kembali ke Beranda
          </Link>
          <Link className={styles.secondary} href="/masuk">
            Masuk ke Akun
          </Link>
        </div>
      </section>
    </main>
  );
}
