import Link from "next/link";

import { agendaJamLabel } from "@/features/info-desa/agenda/domain/agenda";
import { plainText } from "@/lib/plain-text";

import styles from "./agenda.module.css";
import { dateParts, type AgendaItem } from "./bagian-agenda";

export function DaftarAgenda({
  pageItems,
  total,
  totalPages,
  currentPage,
  href,
}: {
  pageItems: AgendaItem[];
  total: number;
  totalPages: number;
  currentPage: number;
  href: (overrides: Record<string, string | null>) => string;
}) {
  return (
    <section className={styles.listCard}>
      <div className={styles.listHeading}>
        <div>
          <h2>☷　Daftar Agenda Kegiatan</h2>
          <p>Daftar seluruh agenda kegiatan desa yang direncanakan dan sedang berlangsung.</p>
        </div>
        <span>{total} agenda</span>
      </div>
      {pageItems.length ? (
        <div className={styles.eventList}>
          {pageItems.map((item) => {
            const date = dateParts(item.mulai);
            const time = agendaJamLabel(item.jamMulai, item.jamSelesai);
            return (
              <article key={item.id}>
                <div className={styles.dateBadge}>
                  <b>{date.day}</b>
                  <span>{date.month}</span>
                  <small>{date.year}</small>
                </div>
                <div className={styles.eventVisual} aria-hidden="true">
                  <span>▦</span>
                </div>
                <div className={styles.eventCopy}>
                  <div className={styles.eventTop}>
                    <h3>{item.judul}</h3>
                    <span
                      className={
                        item.status === "rencana"
                          ? styles.statusPlan
                          : item.status === "berlangsung"
                            ? styles.statusLive
                            : styles.statusDone
                      }
                    >
                      {item.status === "rencana"
                        ? "Rencana"
                        : item.status === "berlangsung"
                          ? "Berlangsung"
                          : "Selesai"}
                    </span>
                  </div>
                  <p className={styles.eventMeta}>
                    ◷　{time ?? "Waktu belum ditentukan"}　⌖　
                    {item.lokasi ?? "Lokasi belum ditentukan"}
                  </p>
                  <p className={styles.description}>
                    {plainText(item.deskripsi) ||
                      "Informasi lebih lanjut mengenai kegiatan ini dapat dilihat pada detail agenda."}
                  </p>
                  <Link href={"/agenda/" + item.id}>Lihat Detail　→</Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={styles.empty}>
          <span>▦</span>
          <h3>Belum ada agenda pada periode ini</h3>
          <p>Belum ada kegiatan yang dipublikasikan sesuai filter yang dipilih.</p>
          <Link href="/agenda">Hapus Filter →</Link>
        </div>
      )}
      {totalPages > 1 ? (
        <nav className={styles.pagination} aria-label="Halaman agenda">
          {currentPage > 1 ? (
            <Link href={href({ page: String(currentPage - 1), hari: null })}>‹ Sebelumnya</Link>
          ) : (
            <span>‹ Sebelumnya</span>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={href({ page: String(n), hari: null })}
              aria-current={n === currentPage ? "page" : undefined}
            >
              {n}
            </Link>
          ))}
          {currentPage < totalPages ? (
            <Link href={href({ page: String(currentPage + 1), hari: null })}>Selanjutnya ›</Link>
          ) : (
            <span>Selanjutnya ›</span>
          )}
        </nav>
      ) : null}
    </section>
  );
}
