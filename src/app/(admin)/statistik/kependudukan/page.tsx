import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { getPendudukFilterOptionsData } from "@/features/penduduk/application/use-cases";
import {
  getPenandatanganStatistikData,
  getStatistikKependudukanPageData,
  labelFilterWilayah,
  nilaiFilter,
} from "@/features/statistik/application/statistik-kependudukan-use-cases";
import {
  kategoriPerGrup,
  persen,
  STATISTIK_GROUP_LABELS,
  STATISTIK_GROUPS,
} from "@/features/statistik/domain/statistik-kependudukan";

import { DialogCetakStatistik } from "./dialog-cetak-statistik";
import { GrafikKependudukan } from "./grafik-kependudukan";
import styles from "./statistik-kependudukan.module.css";

export const metadata: Metadata = { title: "Statistik Kependudukan" };

const angka = new Intl.NumberFormat("id-ID");

export default async function StatistikKependudukanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const dusun = nilaiFilter(params.dusun);
  const rw = nilaiFilter(params.rw);
  const rt = nilaiFilter(params.rt);
  const kategoriSlug = nilaiFilter(params.kategori) ?? "";

  const [opsi, { kategori, hasil }, pejabat] = await Promise.all([
    getPendudukFilterOptionsData(),
    getStatistikKependudukanPageData({ kategoriSlug, dusun, rw, rt }),
    getPenandatanganStatistikData(),
  ]);

  const filter = { dusun, rw, rt };
  const fokus = labelFilterWilayah(filter);
  const tautan = (slug: string) => {
    const query = new URLSearchParams({ kategori: slug });
    if (dusun) query.set("dusun", dusun);
    if (rw) query.set("rw", rw);
    if (rt) query.set("rt", rt);
    return `/statistik/kependudukan?${query.toString()}`;
  };
  const ekspor = (format?: "pdf") => {
    const query = new URLSearchParams({ kategori: kategori.slug });
    if (dusun) query.set("dusun", dusun);
    if (rw) query.set("rw", rw);
    if (rt) query.set("rt", rt);
    const dasar = `/statistik/kependudukan/ekspor${format === "pdf" ? "/pdf" : ""}`;
    return `${dasar}?${query.toString()}`;
  };
  const cetakHref = () => {
    const query = new URLSearchParams({ kategori: kategori.slug });
    if (dusun) query.set("dusun", dusun);
    if (rw) query.set("rw", rw);
    if (rt) query.set("rt", rt);
    return `/statistik/kependudukan/cetak?${query.toString()}`;
  };

  const total = hasil.total.jumlah;
  const jumlahBaris = hasil.baris.length;
  const labelBelum = kategori.slug.startsWith("bantuan") ? "BUKAN PENERIMA" : "BELUM MENGISI";
  const tautanAngka = (kelompok: string, gender?: "male" | "female") => {
    if (kategori.group !== "penduduk" || !kategori.tersedia) return null;
    const query = new URLSearchParams({ kategori: kategori.slug, kelompok });
    if (gender) query.set("gender", gender);
    if (dusun) query.set("dusun", dusun);
    if (rw) query.set("rw", rw);
    if (rt) query.set("rt", rt);
    return `/statistik/kependudukan/penduduk?${query.toString()}`;
  };
  const selAngka = (nilai: number, kelompok: string, gender?: "male" | "female") => {
    const href = tautanAngka(kelompok, gender);
    return href ? <Link href={href}>{angka.format(nilai)}</Link> : angka.format(nilai);
  };
  const satuanTotal =
    kategori.slug === "bantuan-penduduk"
      ? "jiwa"
      : kategori.slug === "bantuan-keluarga"
        ? "keluarga"
        : kategori.satuan;

  return (
    <div className={`modul-page data-kependudukan-page ${styles.page}`}>
      <PageHeading>
        <header className="page-heading">
          <div>
            <h1>Statistik Kependudukan</h1>
            <p>Rekap statistik penduduk dan keluarga desa.</p>
          </div>
          <div className={styles.headingActions}>
            <Link className="button button-secondary" href="/statistik/rentang-umur">
              Rentang Umur
            </Link>
            <a className="button button-secondary" href={ekspor()}>
              Unduh CSV
            </a>
            <DialogCetakStatistik
              cetakHref={cetakHref()}
              pdfHref={ekspor("pdf")}
              pejabat={pejabat}
            />
          </div>
        </header>
      </PageHeading>

      <section className="data-kependudukan-kpis">
        <article className="data-kpi data-kpi-primary">
          <span>Total {satuanTotal}</span>
          <strong>{angka.format(total)}</strong>
          <small>{fokus}</small>
        </article>
        <article className="data-kpi" data-tone="blue">
          <span>Laki-laki</span>
          <strong>{angka.format(hasil.total.lakiLaki)}</strong>
          <small>{persen(hasil.total.lakiLaki, total)}% dari total</small>
        </article>
        <article className="data-kpi" data-tone="pink">
          <span>Perempuan</span>
          <strong>{angka.format(hasil.total.perempuan)}</strong>
          <small>{persen(hasil.total.perempuan, total)}% dari total</small>
        </article>
        <article className="data-kpi">
          <span>Kelompok kategori</span>
          <strong>{angka.format(jumlahBaris)}</strong>
          <small>{kategori.label}</small>
        </article>
      </section>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <section className={styles.filterCard}>
            <h2>Filter Wilayah</h2>
            <form method="get" className={styles.filterForm}>
              <input type="hidden" name="kategori" value={kategori.slug} />
              <label>
                Dusun
                <select name="dusun" defaultValue={dusun ?? ""}>
                  <option value="">Semua dusun</option>
                  {opsi.dusun.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                RW
                <select name="rw" defaultValue={rw ?? ""}>
                  <option value="">Semua RW</option>
                  {opsi.rw.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                RT
                <select name="rt" defaultValue={rt ?? ""}>
                  <option value="">Semua RT</option>
                  {opsi.rt.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <div className={styles.filterActions}>
                <button className="button button-primary" type="submit">
                  Terapkan
                </button>
                <Link className="button button-secondary" href="/statistik/kependudukan">
                  Reset
                </Link>
              </div>
            </form>
          </section>

          <nav className={styles.groups} aria-label="Kategori statistik">
            {STATISTIK_GROUPS.map((group) => (
              <section className={styles.group} key={group}>
                <h3>Statistik {STATISTIK_GROUP_LABELS[group]}</h3>
                <ul>
                  {kategoriPerGrup(group).map((item) => {
                    const aktif = item.slug === kategori.slug;
                    return (
                      <li key={item.slug}>
                        <Link
                          href={tautan(item.slug)}
                          aria-current={aktif ? "page" : undefined}
                          className={aktif ? styles.active : undefined}
                        >
                          <span>{item.label}</span>
                          {!item.tersedia && <em>Segera</em>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </nav>
        </aside>

        <section className={`platform-card data-panel ${styles.main}`}>
          <header className="data-section-heading">
            <div>
              <h2>{kategori.label}</h2>
              <p>
                {fokus} · satuan {kategori.satuan} · dihitung dari data kependudukan aktif.
              </p>
            </div>
          </header>

          {!kategori.tersedia ? (
            <div className={styles.gap} role="status">
              <strong>Statistik belum tersedia</strong>
              <p>{kategori.keterangan}</p>
            </div>
          ) : (
            <>
              <GrafikKependudukan baris={hasil.baris} total={total} satuan={satuanTotal} />

              <div className={`table-scroll ${styles.tableWrap}`}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th rowSpan={2}>No.</th>
                      <th rowSpan={2}>Kelompok</th>
                      <th colSpan={2}>Jumlah</th>
                      <th colSpan={2}>Laki-laki</th>
                      <th colSpan={2}>Perempuan</th>
                    </tr>
                    <tr>
                      <th>Total</th>
                      <th>Persen</th>
                      <th>Total</th>
                      <th>Persen</th>
                      <th>Total</th>
                      <th>Persen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hasil.baris.map((row, index) => (
                      <tr key={row.label}>
                        <td>{index + 1}</td>
                        <td>{row.label}</td>
                        <td>{selAngka(row.jumlah, row.label)}</td>
                        <td>{persen(row.jumlah, total)}%</td>
                        <td>{selAngka(row.lakiLaki, row.label, "male")}</td>
                        <td>{persen(row.lakiLaki, total)}%</td>
                        <td>{selAngka(row.perempuan, row.label, "female")}</td>
                        <td>{persen(row.perempuan, total)}%</td>
                      </tr>
                    ))}
                    {hasil.baris.length === 0 && (
                      <tr>
                        <td colSpan={8} className={styles.emptyRow}>
                          Belum ada data untuk kategori ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th />
                      <th>JUMLAH</th>
                      <th>{angka.format(hasil.jumlah.jumlah)}</th>
                      <th>{persen(hasil.jumlah.jumlah, total)}%</th>
                      <th>{angka.format(hasil.jumlah.lakiLaki)}</th>
                      <th>{persen(hasil.jumlah.lakiLaki, total)}%</th>
                      <th>{angka.format(hasil.jumlah.perempuan)}</th>
                      <th>{persen(hasil.jumlah.perempuan, total)}%</th>
                    </tr>
                    <tr>
                      <th />
                      <th>{labelBelum}</th>
                      <th>{angka.format(hasil.belumMengisi.jumlah)}</th>
                      <th>{persen(hasil.belumMengisi.jumlah, total)}%</th>
                      <th>{angka.format(hasil.belumMengisi.lakiLaki)}</th>
                      <th>{persen(hasil.belumMengisi.lakiLaki, total)}%</th>
                      <th>{angka.format(hasil.belumMengisi.perempuan)}</th>
                      <th>{persen(hasil.belumMengisi.perempuan, total)}%</th>
                    </tr>
                    <tr>
                      <th />
                      <th>TOTAL</th>
                      <th>{angka.format(hasil.total.jumlah)}</th>
                      <th>{persen(hasil.total.jumlah, total)}%</th>
                      <th>{angka.format(hasil.total.lakiLaki)}</th>
                      <th>{persen(hasil.total.lakiLaki, total)}%</th>
                      <th>{angka.format(hasil.total.perempuan)}</th>
                      <th>{persen(hasil.total.perempuan, total)}%</th>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <footer className={styles.note}>
                <span>
                  Data penduduk berstatus hidup. Angka kategori kosong dihitung pada baris “Belum
                  Mengisi”.
                </span>
                <span>
                  {angka.format(hasil.jumlah.jumlah)} dari {angka.format(total)} {satuanTotal}
                </span>
              </footer>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
