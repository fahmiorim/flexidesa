import Image from "next/image";
import Link from "next/link";

import {
  dateLabel,
  mediaUrl,
  type BeritaBeranda,
  type DesaPublik,
  type PengumumanBeranda,
} from "./bagian-beranda";
import styles from "./public-home.module.css";

export function BeritaPengumuman({
  desa,
  berita,
  announcements,
}: {
  desa: DesaPublik;
  berita: BeritaBeranda[];
  announcements: PengumumanBeranda[];
}) {
  const newsMain = berita[0];
  const newsSide = berita.slice(1);
  return (
    <section className={styles.newsAnnouncements}>
      <article className={styles.newsPanel}>
        <div className={styles.cardHeading}>
          <div>
            <h2>▣　Berita Terbaru</h2>
            <small>Informasi dan kegiatan terbaru di {desa.namaDesa ?? "desa"}</small>
          </div>
          <Link href="/berita">Lihat Semua →</Link>
        </div>
        {newsMain ? (
          <div className={styles.newsFeature}>
            <Link
              href={`/berita/${encodeURIComponent(newsMain.slug)}`}
              className={styles.newsLeadImage}
            >
              {mediaUrl(newsMain.gambar, desa.id) ? (
                <Image
                  src={mediaUrl(newsMain.gambar, desa.id)!}
                  alt=""
                  fill
                  unoptimized
                  sizes="(max-width: 700px) 100vw, 34vw"
                />
              ) : (
                <span>BERITA DESA</span>
              )}
              <strong>{newsMain.judul}</strong>
              <small>{dateLabel(newsMain.terbitPada ?? newsMain.createdAt)}</small>
            </Link>
            <div className={styles.newsSideList}>
              {newsSide.map((item) => (
                <Link href={`/berita/${encodeURIComponent(item.slug)}`} key={item.id}>
                  {mediaUrl(item.gambar, desa.id) ? (
                    <Image
                      src={mediaUrl(item.gambar, desa.id)!}
                      alt=""
                      width={66}
                      height={54}
                      unoptimized
                    />
                  ) : (
                    <span className={styles.thumbFallback}>▣</span>
                  )}
                  <span>
                    <strong>{item.judul}</strong>
                    <small>{dateLabel(item.terbitPada ?? item.createdAt)}</small>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <p className={styles.empty}>Belum ada berita yang dipublikasikan.</p>
        )}
      </article>

      <article className={styles.announcementPanel}>
        <div className={styles.cardHeading}>
          <div>
            <h2>⚑　Pengumuman</h2>
            <small>Informasi resmi dari pemerintah desa</small>
          </div>
          <Link href="/pengumuman">Lihat Semua →</Link>
        </div>
        {announcements.length ? (
          announcements.slice(0, 3).map((item) => (
            <Link className={styles.announcement} href={item.tautan || "/pengumuman"} key={item.id}>
              <span>▤</span>
              <span>
                <strong>{item.nama}</strong>
                <small>
                  {item.tahun ?? "Pengumuman resmi"}
                  {item.keterangan ? ` · ${item.keterangan}` : ""}
                </small>
              </span>
            </Link>
          ))
        ) : (
          <p className={styles.empty}>Belum ada pengumuman yang dipublikasikan.</p>
        )}
      </article>
    </section>
  );
}
