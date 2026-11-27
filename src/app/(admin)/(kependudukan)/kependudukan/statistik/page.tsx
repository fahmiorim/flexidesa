import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import {
  Cell,
  HeaderCell,
  Row,
  Table,
  TableScroll,
  TBody,
  TFoot,
  THead,
} from "@/components/ui/table";
import { getPendudukFilterOptionsData } from "@/features/kependudukan/penduduk/application/use-cases";
import {
  getPenandatanganStatistikData,
  getStatistikKependudukanPageData,
  labelFilterWilayah,
  nilaiFilter,
} from "@/features/kependudukan/statistik/application/statistik-kependudukan-use-cases";
import {
  kategoriPerGrup,
  persen,
  STATISTIK_GROUP_LABELS,
  STATISTIK_GROUPS,
} from "@/features/kependudukan/statistik/domain/statistik-kependudukan";

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
    return `/kependudukan/statistik?${query.toString()}`;
  };
  const ekspor = (format?: "pdf") => {
    const query = new URLSearchParams({ kategori: kategori.slug });
    if (dusun) query.set("dusun", dusun);
    if (rw) query.set("rw", rw);
    if (rt) query.set("rt", rt);
    const dasar = `/kependudukan/statistik/ekspor${format === "pdf" ? "/pdf" : ""}`;
    return `${dasar}?${query.toString()}`;
  };
  const cetakHref = () => {
    const query = new URLSearchParams({ kategori: kategori.slug });
    if (dusun) query.set("dusun", dusun);
    if (rw) query.set("rw", rw);
    if (rt) query.set("rt", rt);
    return `/kependudukan/statistik/cetak?${query.toString()}`;
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
    return `/kependudukan/statistik/penduduk?${query.toString()}`;
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
      <PageHeading
        judul={<>Statistik Kependudukan</>}
        deskripsi={<>Rekap statistik penduduk dan keluarga desa.</>}
        aksi={
          <>
            <div className={styles.headingActions}>
              <ButtonLink variant="secondary" href="/statistik/rentang-umur">
                Rentang Umur
              </ButtonLink>
              <ButtonLink variant="secondary" href={ekspor()}>
                Unduh CSV
              </ButtonLink>
              <DialogCetakStatistik
                cetakHref={cetakHref()}
                pdfHref={ekspor("pdf")}
                pejabat={pejabat}
              />
            </div>
          </>
        }
      />

      <StatGrid columns={4}>
        <StatCard label={`Total ${satuanTotal}`} note={fokus} utama value={angka.format(total)} />
        <StatCard
          label="Laki-laki"
          note={`${persen(hasil.total.lakiLaki, total)}% dari total`}
          tone="biru"
          value={angka.format(hasil.total.lakiLaki)}
        />
        <StatCard
          label="Perempuan"
          note={`${persen(hasil.total.perempuan, total)}% dari total`}
          value={angka.format(hasil.total.perempuan)}
        />
        <StatCard
          label="Kelompok kategori"
          note={kategori.label}
          value={angka.format(jumlahBaris)}
        />
      </StatGrid>

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
                <Button variant="primary" type="submit">
                  Terapkan
                </Button>
                <ButtonLink variant="secondary" href="/kependudukan/statistik">
                  Reset
                </ButtonLink>
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

              <TableScroll className={styles.tableWrap}>
                <Table>
                  <THead>
                    <Row>
                      <HeaderCell rowSpan={2}>No.</HeaderCell>
                      <HeaderCell rowSpan={2}>Kelompok</HeaderCell>
                      <HeaderCell colSpan={2}>Jumlah</HeaderCell>
                      <HeaderCell colSpan={2}>Laki-laki</HeaderCell>
                      <HeaderCell colSpan={2}>Perempuan</HeaderCell>
                    </Row>
                    <Row>
                      <HeaderCell>Total</HeaderCell>
                      <HeaderCell>Persen</HeaderCell>
                      <HeaderCell>Total</HeaderCell>
                      <HeaderCell>Persen</HeaderCell>
                      <HeaderCell>Total</HeaderCell>
                      <HeaderCell>Persen</HeaderCell>
                    </Row>
                  </THead>
                  <TBody>
                    {hasil.baris.map((row, index) => (
                      <Row key={row.label}>
                        <Cell>{index + 1}</Cell>
                        <Cell>{row.label}</Cell>
                        <Cell>{selAngka(row.jumlah, row.label)}</Cell>
                        <Cell>{persen(row.jumlah, total)}%</Cell>
                        <Cell>{selAngka(row.lakiLaki, row.label, "male")}</Cell>
                        <Cell>{persen(row.lakiLaki, total)}%</Cell>
                        <Cell>{selAngka(row.perempuan, row.label, "female")}</Cell>
                        <Cell>{persen(row.perempuan, total)}%</Cell>
                      </Row>
                    ))}
                    {hasil.baris.length === 0 && (
                      <Row>
                        <Cell colSpan={8} className={styles.emptyRow}>
                          Belum ada data untuk kategori ini.
                        </Cell>
                      </Row>
                    )}
                  </TBody>
                  <TFoot>
                    <Row>
                      <HeaderCell />
                      <HeaderCell>JUMLAH</HeaderCell>
                      <HeaderCell>{angka.format(hasil.jumlah.jumlah)}</HeaderCell>
                      <HeaderCell>{persen(hasil.jumlah.jumlah, total)}%</HeaderCell>
                      <HeaderCell>{angka.format(hasil.jumlah.lakiLaki)}</HeaderCell>
                      <HeaderCell>{persen(hasil.jumlah.lakiLaki, total)}%</HeaderCell>
                      <HeaderCell>{angka.format(hasil.jumlah.perempuan)}</HeaderCell>
                      <HeaderCell>{persen(hasil.jumlah.perempuan, total)}%</HeaderCell>
                    </Row>
                    <Row>
                      <HeaderCell />
                      <HeaderCell>{labelBelum}</HeaderCell>
                      <HeaderCell>{angka.format(hasil.belumMengisi.jumlah)}</HeaderCell>
                      <HeaderCell>{persen(hasil.belumMengisi.jumlah, total)}%</HeaderCell>
                      <HeaderCell>{angka.format(hasil.belumMengisi.lakiLaki)}</HeaderCell>
                      <HeaderCell>{persen(hasil.belumMengisi.lakiLaki, total)}%</HeaderCell>
                      <HeaderCell>{angka.format(hasil.belumMengisi.perempuan)}</HeaderCell>
                      <HeaderCell>{persen(hasil.belumMengisi.perempuan, total)}%</HeaderCell>
                    </Row>
                    <Row>
                      <HeaderCell />
                      <HeaderCell>TOTAL</HeaderCell>
                      <HeaderCell>{angka.format(hasil.total.jumlah)}</HeaderCell>
                      <HeaderCell>{persen(hasil.total.jumlah, total)}%</HeaderCell>
                      <HeaderCell>{angka.format(hasil.total.lakiLaki)}</HeaderCell>
                      <HeaderCell>{persen(hasil.total.lakiLaki, total)}%</HeaderCell>
                      <HeaderCell>{angka.format(hasil.total.perempuan)}</HeaderCell>
                      <HeaderCell>{persen(hasil.total.perempuan, total)}%</HeaderCell>
                    </Row>
                  </TFoot>
                </Table>
              </TableScroll>

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
