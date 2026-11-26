import Link from "next/link";

import { formatSkor } from "@/features/program-data-desa/idm/domain/idm";

import {
  formatNumber,
  namaLengkap,
  type PerangkatBeranda,
  type RekapIdm,
  type StatistikDesa,
} from "./bagian-beranda";
import styles from "./public-home.module.css";

const quickLinks = [
  {
    href: "/layanan/surat",
    icon: "▤",
    title: "Pengajuan Surat",
    description: "Layanan administrasi surat menyurat",
  },
  {
    href: "/kontak",
    icon: "◉",
    title: "Pengaduan",
    description: "Sampaikan aspirasi dan keluhan",
  },
  {
    href: "/statistik",
    icon: "▥",
    title: "Data Desa",
    description: "Data kependudukan dan potensi desa",
  },
  {
    href: "/transparansi/apbdes",
    icon: "▱",
    title: "APBDes",
    description: "Transparansi anggaran desa",
  },
  {
    href: "/agenda",
    icon: "▦",
    title: "Jadwal Kegiatan",
    description: "Agenda dan kegiatan pemerintah desa",
  },
  {
    href: "/layanan",
    icon: "♧",
    title: "Layanan Lainnya",
    description: "Lihat semua layanan desa",
  },
];

export function AksesCepat() {
  return (
    <nav className={styles.quickLinks} aria-label="Akses cepat">
      {quickLinks.map((item) => (
        <Link href={item.href} className={styles.quickLink} key={item.title}>
          <span className={styles.quickIcon}>{item.icon}</span>
          <span className={styles.quickText}>
            <strong>{item.title}</strong>
            <small>{item.description}</small>
          </span>
        </Link>
      ))}
    </nav>
  );
}

export function SambutanStatistik({
  intro,
  leader,
  statistik,
  rekapIdm,
  tahunIdm,
}: {
  intro: string;
  leader: PerangkatBeranda | undefined;
  statistik: StatistikDesa;
  rekapIdm: RekapIdm;
  tahunIdm: number;
}) {
  return (
    <section className={styles.introStats}>
      <article className={styles.welcomeCard}>
        <h2>
          <span>✓</span> Sambutan Kepala Desa
        </h2>
        <p className={styles.quoteMark}>“</p>
        <p>{intro}</p>
        {leader ? (
          <div className={styles.signature}>
            <strong>{namaLengkap(leader)}</strong>
            <small>{leader.jabatan}</small>
          </div>
        ) : null}
      </article>
      <article className={styles.statsCard}>
        <div className={styles.cardHeading}>
          <h2>▥　Statistik Desa</h2>
          <Link href="/statistik">Lihat Detail →</Link>
        </div>
        <div className={styles.statTiles}>
          <div>
            <span>♙</span>
            <strong>{formatNumber(statistik.total)}</strong>
            <small>Jumlah Penduduk</small>
          </div>
          <div>
            <span>⌂</span>
            <strong>{formatNumber(statistik.keluarga)}</strong>
            <small>Kepala Keluarga</small>
          </div>
          <div>
            <span>◎</span>
            <strong>{formatNumber(statistik.perDusun.length)}</strong>
            <small>Dusun</small>
          </div>
          <div>
            <span>⌖</span>
            <strong>
              {formatNumber(statistik.perDusun.reduce((sum, row) => sum + row.total, 0))}
            </strong>
            <small>Warga terdata</small>
          </div>
          <Link href="/desa/status-des">
            <span>◎</span>
            <strong>{formatSkor(rekapIdm.skor)}</strong>
            <small>
              Skor IDM {tahunIdm}
              {rekapIdm.status ? ` · ${rekapIdm.status}` : ""}
            </small>
          </Link>
        </div>
      </article>
    </section>
  );
}
