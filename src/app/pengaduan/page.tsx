import type { Metadata } from "next";
import Link from "next/link";

import { getIdentitasFromRequest } from "@/features/info-desa/desa/application/resolve-village";
import { getNavPublik } from "@/features/info-desa/publik/application/nav-publik";
import { muatTemaPublik } from "@/features/info-desa/publik/application/website-admin";
import { listPengaduanPublikData } from "@/features/layanan-warga/pengaduan/application/use-cases";
import { labelKategori, labelStatus } from "@/features/layanan-warga/pengaduan/domain/pengaduan";
import { resolveTema } from "@/themes/registry";
import { validasiOpsiTenant } from "@/themes/types";

import styles from "../informasi-publik.module.css";
import { PublicShell } from "../public-shell";

export const metadata: Metadata = {
  title: "Pengaduan & Aspirasi",
  description: "Sampaikan pengaduan dan aspirasi kepada pemerintah desa.",
};
export const dynamic = "force-dynamic";

function plainText(value: string) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export default async function PengaduanPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const desa = await getIdentitasFromRequest();
  const params = await searchParams;
  const [allItems, tema] = await Promise.all([
    listPengaduanPublikData(desa.id),
    muatTemaPublik(desa.id),
  ]);
  const opsiTema = tema
    ? validasiOpsiTenant(resolveTema(tema.slug, tema.versi)?.opsi ?? [], tema.templateOptions)
    : {};
  const perHalaman = Math.max(
    1,
    Math.min(50, Number(opsiTema.jumlah_pengaduan_perhalaman ?? 10) || 10),
  );
  // `jumlah_pengaduan_perhalaman` adalah batas per halaman, bukan potongan
  // total: halaman berikutnya tetap dapat dibuka lewat `?page=`.
  const totalHalaman = Math.max(1, Math.ceil(allItems.length / perHalaman));
  const halamanDiminta = Number(params.page);
  const halaman =
    Number.isInteger(halamanDiminta) && halamanDiminta > 0
      ? Math.min(halamanDiminta, totalHalaman)
      : 1;
  const items = allItems.slice((halaman - 1) * perHalaman, halaman * perHalaman);
  const tautanHalaman = (n: number) => (n > 1 ? `/pengaduan?page=${n}` : "/pengaduan");
  return (
    <PublicShell
      villageName={desa.namaDesa ?? "Pemerintah Desa"}
      villageId={desa.id}
      surface="layanan"
      brandLabel="Pengaduan Masyarakat"
      navigation={await getNavPublik(desa.id)}
    >
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.crumb}>
            <Link href="/">Beranda</Link>
            <span>/</span>
            <span>Pengaduan</span>
          </div>
          <p className={styles.kicker}>ASPIRASI & TRANSPARANSI</p>
          <h1>Pengaduan {desa.namaDesa ?? "Desa"}</h1>
          <p>Kirim laporan, lacak tiket, atau lihat tindak lanjutnya.</p>
          <div className="modul-form-actions">
            <Link className="button button-primary" href="/pengaduan/baru">
              Kirim Pengaduan
            </Link>
            <Link className="button button-secondary" href="/pengaduan/lacak">
              Lacak Tiket
            </Link>
          </div>
        </div>
      </section>
      <section className={styles.content}>
        <div className={styles.container}>
          {items.length ? (
            <div className={styles.docList}>
              {items.map((item) => (
                <article className={styles.panel} key={item.id}>
                  <p className={styles.kicker}>
                    {labelKategori(item.kategori)} · {labelStatus(item.status)}
                  </p>
                  <h2>{item.judul}</h2>
                  <p className={styles.copy}>{plainText(item.isi)}</p>
                  <p className={styles.muted}>
                    Tiket {item.nomorTiket} · Disampaikan oleh {item.namaPelapor}
                  </p>
                  {item.tanggapan ? (
                    <div>
                      <strong>Tanggapan pemerintah desa</strong>
                      <p className={styles.copy}>{plainText(item.tanggapan)}</p>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <strong>Belum ada pengaduan yang dipublikasikan</strong>
              <p>Pengaduan hanya ditampilkan di sini setelah petugas menyetujui publikasinya.</p>
            </div>
          )}
          {totalHalaman > 1 ? (
            <nav aria-label="Navigasi halaman pengaduan" className={styles.pagination}>
              {halaman > 1 ? <Link href={tautanHalaman(halaman - 1)}>← Sebelumnya</Link> : <span />}
              <span>
                Halaman {halaman} dari {totalHalaman}
              </span>
              {halaman < totalHalaman ? (
                <Link href={tautanHalaman(halaman + 1)}>Berikutnya →</Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </div>
      </section>
    </PublicShell>
  );
}
