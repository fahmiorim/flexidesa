import Link from "next/link";

import styles from "./agenda.module.css";
import { BULAN, type AgendaItem } from "./bagian-agenda";

export function KalenderAgenda({
  cells,
  eventDays,
  selectedDay,
  selectedItems,
  selectedMonth,
  month,
  tahun,
  hariIni,
  bulanIni,
  tahunIni,
  canPrevious,
  previous,
  canNext,
  next,
  href,
}: {
  cells: (number | null)[];
  eventDays: Set<number>;
  selectedDay: number | null;
  selectedItems: AgendaItem[];
  selectedMonth: string;
  month: number;
  tahun: number;
  hariIni: number;
  bulanIni: number;
  tahunIni: number;
  canPrevious: boolean;
  previous: { tahun: number; bulan: number };
  canNext: boolean;
  next: { tahun: number; bulan: number };
  href: (overrides: Record<string, string | null>) => string;
}) {
  return (
    <section className={styles.calendarCard}>
      <div className={styles.calendarHeading}>
        <div>
          <h2>▦　Kalender Kegiatan</h2>
          <p>Lihat jadwal kegiatan desa dalam tampilan kalender interaktif.</p>
        </div>
        <div className={styles.monthNav}>
          {canPrevious ? (
            <Link
              href={href({
                bulan: String(previous.bulan),
                tahun: String(previous.tahun),
                hari: null,
                page: null,
              })}
              aria-label="Bulan sebelumnya"
            >
              ‹
            </Link>
          ) : (
            <span>‹</span>
          )}
          <strong>{selectedMonth}</strong>
          {canNext ? (
            <Link
              href={href({
                bulan: String(next.bulan),
                tahun: String(next.tahun),
                hari: null,
                page: null,
              })}
              aria-label="Bulan berikutnya"
            >
              ›
            </Link>
          ) : (
            <span>›</span>
          )}
        </div>
      </div>
      <div className={styles.calendarContent}>
        <div className={styles.calendarGrid}>
          {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
            <b key={d}>{d}</b>
          ))}
          {cells.map((day, i) =>
            day ? (
              <Link
                key={i}
                href={href({ hari: String(day), page: null })}
                aria-current={day === selectedDay ? "date" : undefined}
                className={[
                  styles.day,
                  day === selectedDay ? styles.selected : "",
                  eventDays.has(day) ? styles.hasEvent : "",
                  day === hariIni && month === bulanIni && tahun === tahunIni ? styles.today : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {day}
                {eventDays.has(day) ? <i /> : null}
              </Link>
            ) : (
              <span key={i} />
            ),
          )}
        </div>
        <section className={styles.selectedPanel}>
          <h3>
            ▦　Kegiatan pada{" "}
            {selectedDay ? selectedDay + " " + BULAN[month - 1] : "tanggal pilihan"}
          </h3>
          {selectedDay ? (
            selectedItems.length ? (
              <div className={styles.selectedList}>
                {selectedItems.map((item) => (
                  <Link key={item.id} href={"/agenda/" + item.id}>
                    <span>
                      <b>{item.jamMulai ?? "Waktu belum diatur"}</b>
                      <small>{item.lokasi ?? "Lokasi belum ditentukan"}</small>
                    </span>
                    <strong>{item.judul}</strong>
                    <em>{item.kategori}</em>
                  </Link>
                ))}
              </div>
            ) : (
              <p>Belum ada kegiatan pada tanggal ini.</p>
            )
          ) : (
            <p>Pilih tanggal bertanda titik untuk melihat jadwal kegiatannya.</p>
          )}
        </section>
      </div>
    </section>
  );
}
