import Link from "next/link";

import type { agendaMendatang } from "@/features/info-desa/agenda/application/agenda-use-cases";
import { agendaJamLabel } from "@/features/info-desa/agenda/domain/agenda";

import styles from "./agenda.module.css";
import { dateParts } from "./bagian-agenda";
import { CetakJadwal } from "./cetak-jadwal";

type AgendaMendatang = Awaited<ReturnType<typeof agendaMendatang>>[number];

export function SampingAgenda({
  stats,
  selectedMonth,
  upcoming,
}: {
  stats: { total: number; done: number; ongoing: number; planned: number };
  selectedMonth: string;
  upcoming: AgendaMendatang[];
}) {
  return (
    <aside className={styles.aside}>
      <section className={styles.sideCard}>
        <h2>▥　Statistik Kegiatan</h2>
        <div className={styles.stats}>
          <div>
            <b>▦</b>
            <strong>{stats.total}</strong>
            <span>Total Kegiatan</span>
          </div>
          <div>
            <b>✓</b>
            <strong>{stats.done}</strong>
            <span>Sudah Dilaksanakan</span>
          </div>
          <div>
            <b>⌛</b>
            <strong>{stats.ongoing}</strong>
            <span>Sedang Berlangsung</span>
          </div>
          <div>
            <b>◷</b>
            <strong>{stats.planned}</strong>
            <span>Dalam Perencanaan</span>
          </div>
        </div>
        <small className={styles.statsNote}>Statistik untuk {selectedMonth}</small>
      </section>
      <section className={styles.sideCard}>
        <h2>▦　Kegiatan Mendatang</h2>
        {upcoming.length ? (
          <div className={styles.upcoming}>
            {upcoming.slice(0, 3).map((item) => {
              const d = dateParts(item.mulai);
              return (
                <Link key={item.id} href={"/agenda/" + item.id}>
                  <span>
                    <b>{d.day}</b>
                    <small>{d.month}</small>
                  </span>
                  <div>
                    <strong>{item.judul}</strong>
                    <small>
                      ◷　
                      {agendaJamLabel(item.jamMulai, item.jamSelesai) ?? "Waktu belum diatur"}
                      　|　{item.lokasi ?? "Lokasi belum ditentukan"}
                    </small>
                  </div>
                  <b>›</b>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className={styles.muted}>Belum ada agenda mendatang.</p>
        )}
        <Link className={styles.allLink} href="/agenda">
          Lihat Semua Kegiatan　→
        </Link>
      </section>
      <section className={styles.notify}>
        <span>▣</span>
        <h2>Ikuti Setiap Kegiatan Desa</h2>
        <p>Dapatkan informasi terbaru agenda dan kegiatan desa secara langsung.</p>
        <Link href="/masuk">♧　Masuk untuk informasi warga</Link>
      </section>
      <section className={styles.download}>
        <h2>↓　Unduh Jadwal Kegiatan</h2>
        <p>Jadwal kegiatan desa dapat dicetak atau disimpan melalui fitur cetak.</p>
        <CetakJadwal />
      </section>
    </aside>
  );
}
