import type { Metadata } from "next";
import Link from "next/link";

import {
  agendaBulan,
  agendaMendatang,
} from "@/features/info-desa/agenda/application/agenda-use-cases";
import {
  bulanAgendaDalamRentang,
  geserBulanAgenda,
} from "@/features/info-desa/agenda/domain/agenda";
import { getIdentitasFromRequest } from "@/features/info-desa/desa/application/resolve-village";

import { PublicSiteFooter, PublicSiteHeader } from "../public-site-layout";
import styles from "./agenda.module.css";
import { BULAN, KATEGORI, plainText } from "./bagian-agenda";
import { DaftarAgenda } from "./bagian-daftar";
import { KalenderAgenda } from "./bagian-kalender";
import { SampingAgenda } from "./bagian-samping";

export const metadata: Metadata = {
  title: "Agenda Kegiatan",
  description: "Jadwal kegiatan dan agenda pemerintah desa.",
};
export const dynamic = "force-dynamic";
type Props = {
  searchParams: Promise<{
    q?: string;
    bulan?: string;
    tahun?: string;
    hari?: string;
    kategori?: string;
    page?: string;
  }>;
};

function locationLabel(desa: {
  namaKecamatan: string | null;
  namaKabupaten: string | null;
  namaPropinsi: string | null;
}) {
  return [desa.namaKecamatan, desa.namaKabupaten, desa.namaPropinsi].filter(Boolean).join(", ");
}

export default async function AgendaPage({ searchParams }: Props) {
  const [desa, params] = await Promise.all([getIdentitasFromRequest(), searchParams]);
  const lokasi = locationLabel(desa);
  const now = new Date();
  const currentYear = now.getFullYear();
  const minYear = currentYear - 1,
    maxYear = currentYear + 2;
  const rawMonth = Number(params.bulan),
    rawYear = Number(params.tahun);
  const month =
    Number.isInteger(rawMonth) && rawMonth >= 1 && rawMonth <= 12 ? rawMonth : now.getMonth() + 1;
  const year =
    Number.isInteger(rawYear) && rawYear >= minYear && rawYear <= maxYear ? rawYear : currentYear;
  const query = (params.q ?? "").trim().slice(0, 100);
  const category = (params.kategori ?? "").trim().toLowerCase();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const rawDay = Number(params.hari);
  const selectedDay =
    Number.isInteger(rawDay) && rawDay >= 1 && rawDay <= daysInMonth ? rawDay : null;
  const rawPage = Number(params.page);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const [monthItems, upcoming] = await Promise.all([
    agendaBulan(desa.id, year, month),
    agendaMendatang(desa.id, 6),
  ]);
  const normalizedQuery = query.toLocaleLowerCase("id-ID");
  const filtered = monthItems.filter(
    (item) =>
      (!category || item.kategori.toLowerCase() === category) &&
      (!normalizedQuery ||
        [item.judul, item.lokasi, item.deskripsi].some((value) =>
          plainText(value).toLocaleLowerCase("id-ID").includes(normalizedQuery),
        )),
  );
  const eventDays = new Set(filtered.map((item) => Number(item.mulai.slice(8, 10))));
  const selectedItems = selectedDay
    ? filtered.filter((item) => Number(item.mulai.slice(8, 10)) === selectedDay)
    : [];
  const previous = geserBulanAgenda({ tahun: year, bulan: month }, -1),
    next = geserBulanAgenda({ tahun: year, bulan: month }, 1);
  const canPrevious = bulanAgendaDalamRentang(previous, minYear, maxYear),
    canNext = bulanAgendaDalamRentang(next, minYear, maxYear);
  const totalPages = Math.max(1, Math.ceil(filtered.length / 4));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * 4, currentPage * 4);
  const categories = [
    ...new Set(monthItems.map((item) => item.kategori.trim().toLowerCase()).filter(Boolean)),
  ].sort();
  const selectedMonth = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
  const firstOffset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array.from({ length: firstOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);
  const href = (overrides: Record<string, string | null>) => {
    const output = new URLSearchParams();
    const values: Record<string, string | null> = {
      bulan: String(month),
      tahun: String(year),
      q: query || null,
      kategori: category || null,
      ...overrides,
    };
    for (const [key, value] of Object.entries(values)) if (value) output.set(key, value);
    return "/agenda?" + output.toString();
  };
  const stats = {
    total: monthItems.length,
    done: monthItems.filter((x) => x.status === "selesai").length,
    ongoing: monthItems.filter((x) => x.status === "berlangsung").length,
    planned: monthItems.filter((x) => x.status === "rencana").length,
  };
  const logoUrl = desa.logo
    ? "/api/publik/media/" +
      [String(desa.id), ...desa.logo.split(/[\\/]/).filter(Boolean)]
        .map(encodeURIComponent)
        .join("/")
    : null;

  return (
    <main className={styles.site}>
      <PublicSiteHeader desa={desa} location={lokasi} logoUrl={logoUrl} activePath="/agenda" />
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <nav aria-label="Breadcrumb">
            <Link href="/">Beranda</Link>
            <span>›</span>
            <Link href="/berita">Informasi</Link>
            <span>›</span>
            <span>Agenda Kegiatan</span>
          </nav>
          <h1>Agenda Kegiatan Desa</h1>
          <p>
            Jadwal, rencana, dan laporan kegiatan Pemerintah {desa.namaDesa ?? "Desa"} untuk
            masyarakat.
          </p>
          <span className={styles.heroArt} aria-hidden="true">
            ▦
          </span>
        </div>
      </section>
      <div className={styles.container}>
        <nav className={styles.tabs} aria-label="Navigasi informasi">
          <Link href="/berita">▤　Berita Desa</Link>
          <Link href="/pengumuman">⚑　Pengumuman</Link>
          <Link href="/agenda" aria-current="page">
            ▦　Agenda Kegiatan
          </Link>
          <Link href="/laporan-kegiatan">▥　Laporan Kegiatan</Link>
        </nav>
        <div className={styles.layout}>
          <div className={styles.main}>
            <KalenderAgenda
              cells={cells}
              eventDays={eventDays}
              selectedDay={selectedDay}
              selectedItems={selectedItems}
              selectedMonth={selectedMonth}
              month={month}
              tahun={year}
              hariIni={now.getDate()}
              bulanIni={now.getMonth() + 1}
              tahunIni={currentYear}
              canPrevious={canPrevious}
              previous={previous}
              canNext={canNext}
              next={next}
              href={href}
            />
            <form className={styles.filters} action="/agenda" method="get">
              <strong>⚑　Filter Kegiatan</strong>
              <select name="kategori" defaultValue={category}>
                <option value="">Semua Kategori</option>
                {[...new Set([...KATEGORI, ...categories])].map((x) => (
                  <option key={x} value={x}>
                    {x.charAt(0).toUpperCase() + x.slice(1)}
                  </option>
                ))}
              </select>
              <select name="bulan" defaultValue={String(month)}>
                {BULAN.map((x, i) => (
                  <option key={x} value={i + 1}>
                    {x}
                  </option>
                ))}
              </select>
              <select name="tahun" defaultValue={String(year)}>
                {[minYear, currentYear, currentYear + 1, maxYear]
                  .filter((x, i, a) => a.indexOf(x) === i)
                  .map((x) => (
                    <option key={x}>{x}</option>
                  ))}
              </select>
              <input
                type="search"
                name="q"
                placeholder="Cari agenda kegiatan..."
                defaultValue={query}
              />
              <button type="submit">Cari</button>
            </form>
            <DaftarAgenda
              pageItems={pageItems}
              total={filtered.length}
              totalPages={totalPages}
              currentPage={currentPage}
              href={href}
            />
          </div>
          <SampingAgenda stats={stats} selectedMonth={selectedMonth} upcoming={upcoming} />
        </div>
      </div>
      <PublicSiteFooter desa={desa} location={lokasi} logoUrl={logoUrl} />
    </main>
  );
}
