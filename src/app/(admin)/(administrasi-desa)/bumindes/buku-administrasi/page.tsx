import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { getDaftarBukuData } from "@/features/administrasi-desa/bumindes/application/buku-umum";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { requirePermission } from "@/lib/dal";

import { sinkronisasiBukuAction } from "./actions";
import styles from "./bumindes.module.css";

export const metadata = { title: "Buku Administrasi Desa" };

type Props = {
  searchParams: Promise<{ golongan?: string; sinkron?: string }>;
};

type Golongan = {
  kunci: string;
  judul: string;
  keterangan: string;
};

const GOLONGAN: readonly Golongan[] = [
  {
    kunci: "A",
    judul: "Administrasi Umum",
    keterangan: "Peraturan, keputusan, inventaris, aparat, agenda, dan surat desa.",
  },
  {
    kunci: "B",
    judul: "Administrasi Penduduk",
    keterangan: "Data induk, KTP/KK, mutasi, rekapitulasi, dan penduduk sementara.",
  },
  {
    kunci: "E",
    judul: "Administrasi Tanah",
    keterangan: "Buku tanah di desa beserta data bidang tanah.",
  },
];

export default async function BukuAdministrasiPage({ searchParams }: Props) {
  const params = await searchParams;
  const user = await requirePermission(RESOURCES.bumindes, "read");
  const buku = await getDaftarBukuData();
  const bisaTambah = hasPermission(user.permissions, RESOURCES.bumindes, "create");

  const jumlah = (kunci: string) => buku.filter((item) => item.kodeBuku.startsWith(kunci)).length;
  const adaLain = buku.some(
    (item) => !GOLONGAN.some((golongan) => item.kodeBuku.startsWith(golongan.kunci)),
  );
  const golongan = adaLain
    ? [
        ...GOLONGAN,
        {
          kunci: "L",
          judul: "Buku Lainnya",
          keterangan: "Buku administrasi tambahan milik desa.",
        },
      ]
    : GOLONGAN;

  const aktif =
    params.golongan && golongan.some((item) => item.kunci === params.golongan)
      ? params.golongan
      : "semua";
  const tampil =
    aktif === "semua"
      ? golongan
          .map((item) => ({
            ...item,
            buku: buku.filter((row) => row.kodeBuku.startsWith(item.kunci)),
          }))
          .filter((item) => item.buku.length > 0)
      : golongan
          .filter((item) => item.kunci === aktif)
          .map((item) => ({
            ...item,
            buku: buku.filter((row) => row.kodeBuku.startsWith(item.kunci)),
          }));

  return (
    <main className={styles.page}>
      <PageHeading
        judul={<>Buku Administrasi</>}
        deskripsi={<>Buku administrasi resmi desa.</>}
        aksi={
          <>
            <div className="page-heading-actions">
              {bisaTambah ? (
                <form action={sinkronisasiBukuAction}>
                  <button className={styles.secondary} type="submit">
                    ⟳ Sinkron data penduduk
                  </button>
                </form>
              ) : null}
            </div>
          </>
        }
      />

      {params.sinkron === "1" ? (
        <p className={styles.notice}>
          Ringkasan buku penduduk berhasil diperbarui dari data penduduk desa.
        </p>
      ) : null}
      {params.sinkron === "0" ? (
        <p className={styles.errorNotice}>
          Sinkronisasi belum mengisi buku apa pun. Pastikan buku inti sudah tersedia.
        </p>
      ) : null}

      <section className={styles.metrics} aria-label="Ringkasan buku">
        <article className={`${styles.metric} ${styles.metricPrimary}`}>
          <span>Buku aktif</span>
          <strong>{buku.length}</strong>
          <small>Buku administrasi desa</small>
        </article>
        <article className={styles.metric}>
          <span>Administrasi Umum</span>
          <strong>{jumlah("A")}</strong>
          <small>Buku seri A</small>
        </article>
        <article className={styles.metric}>
          <span>Administrasi Penduduk</span>
          <strong>{jumlah("B")}</strong>
          <small>Buku seri B</small>
        </article>
        <article className={styles.metric}>
          <span>Administrasi Tanah</span>
          <strong>{jumlah("E")}</strong>
          <small>Buku seri E</small>
        </article>
      </section>

      <nav className={styles.tabs} aria-label="Filter golongan buku">
        <Link className={aktif === "semua" ? styles.active : ""} href="/bumindes/buku-administrasi">
          Semua <span className={styles.muted}>({buku.length})</span>
        </Link>
        {golongan.map((item) => (
          <Link
            className={aktif === item.kunci ? styles.active : ""}
            href={`/bumindes/buku-administrasi?golongan=${item.kunci}`}
            key={item.kunci}
          >
            {item.judul} <span className={styles.muted}>({jumlah(item.kunci)})</span>
          </Link>
        ))}
      </nav>

      {tampil.length === 0 ? (
        <section className={styles.panel}>
          <div className={styles.empty}>Belum ada buku administrasi untuk ditampilkan.</div>
        </section>
      ) : (
        tampil.map((item) => (
          <section className={styles.section} key={item.kunci}>
            <div className={styles.sectionHead}>
              <div>
                <h2>{item.judul}</h2>
                <p>{item.keterangan}</p>
              </div>
              <span className={styles.count}>{item.buku.length} buku</span>
            </div>
            <div className={styles.bookGrid}>
              {item.buku.map((row) => (
                <Link
                  className={styles.bookCard}
                  href={`/bumindes/buku-administrasi/${row.id}`}
                  key={row.id}
                >
                  <span className={styles.bookCode}>{row.kodeBuku}</span>
                  <div className={styles.bookBody}>
                    <strong>{row.namaBuku}</strong>
                    <p>{row.uraian ?? "Buku administrasi desa."}</p>
                  </div>
                  <span className={styles.bookArrow} aria-hidden="true">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}
