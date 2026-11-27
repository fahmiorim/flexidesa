import Link from "next/link";

import styles from "@/app/(admin)/(keuangan-desa)/keuangan/keuangan.module.css";
import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { listPembangunan } from "@/features/pembangunan-aset/pembangunan/application/use-cases";
import {
  formatAnggaran,
  statusPembangunanLabel,
} from "@/features/pembangunan-aset/pembangunan/domain/pembangunan";

import { buatKegiatanPembangunanAction, hapusKegiatanPembangunanAction } from "./actions";
import { PetaPersebaran } from "./peta-persebaran";

export const metadata = { title: "Kegiatan & Pembangunan" };
type Props = {
  searchParams: Promise<{ q?: string; tahun?: string; status?: string; page?: string }>;
};

export default async function KegiatanPage({ searchParams }: Props) {
  const params = await searchParams;
  const tahunRaw = Number(params.tahun);
  const tahun =
    Number.isInteger(tahunRaw) && tahunRaw >= 2000 && tahunRaw <= 2100 ? tahunRaw : null;
  const search = (params.q ?? "").trim().slice(0, 100);
  const status = params.status ?? "";
  const pageRaw = Number(params.page);
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const data = await listPembangunan({ search, tahun, status, page, pageSize: 10 });
  const all = await listPembangunan({
    search: "",
    tahun: null,
    status: "",
    page: 1,
    pageSize: 1000,
  });
  const count = (key: string) => all.rows.filter((x) => x.status === key).length;
  const pinned = all.rows.filter((x) => x.latitude !== null && x.longitude !== null);
  const rupiahTotal = all.rows.reduce((s, x) => s + Number(x.anggaran ?? 0), 0).toString();
  const bulan = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat("id-ID", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date(value + "T00:00:00Z"))
      : "Jadwal belum ditentukan";
  return (
    <main className={styles.page}>
      <PageHeading
        judul={<>Kegiatan &amp; Pembangunan</>}
        deskripsi={<>Program, kegiatan, dan anggaran pembangunan desa.</>}
      />
      <nav className={styles.tabs}>
        <Link href="/keuangan">Dashboard</Link>
        <Link href="/keuangan/apbdes">APBDes</Link>
        <Link href="/keuangan/realisasi">Realisasi Anggaran</Link>
        <Link className={styles.activeTab} href="/keuangan/kegiatan">
          Kegiatan &amp; Pembangunan
        </Link>
        <Link href="/keuangan/laporan">Laporan Keuangan</Link>
        <Link href="/keuangan/dokumen">Dokumen &amp; Peraturan</Link>
      </nav>
      <section className={styles.metrics}>
        <article className={styles.metricPrimary}>
          <span>Total Kegiatan</span>
          <strong>{all.total} kegiatan</strong>
          <small>Seluruh tahun anggaran</small>
        </article>
        <article className={styles.metric}>
          <span>Berjalan</span>
          <strong>{count("berjalan")}</strong>
          <small>Proyek aktif</small>
        </article>
        <article className={styles.metric}>
          <span>Selesai</span>
          <strong>{count("selesai")}</strong>
          <small>Proyek rampung</small>
        </article>
        <article className={styles.metric}>
          <span>Total Pagu Proyek</span>
          <strong>{formatAnggaran(rupiahTotal)}</strong>
          <small>Seluruh proyek</small>
        </article>
        <article className={styles.metric}>
          <span>Persiapan</span>
          <strong>{count("rencana")}</strong>
          <small>Menunggu pelaksanaan</small>
        </article>
      </section>
      <nav className={styles.tabs}>
        <a href="#daftar">☷ Daftar Kegiatan</a>
        <a href="#peta">⌖ Peta Persebaran</a>
        <a href="#kalender">▦ Kalender</a>
        <a href="#monitoring">▥ Monitoring Progres</a>
        <a href="#dokumentasi">▧ Dokumentasi</a>
        <Link href="/pembangunan/buku/ekspor">⇩ Laporan CSV</Link>
      </nav>
      <section className={styles.panel} id="daftar">
        <div className={styles.panelHeading}>
          <div>
            <h2>Daftar Kegiatan Pembangunan</h2>
            <p>Filter berdasarkan nama kegiatan, tahun anggaran, dan status.</p>
          </div>
        </div>
        <form method="get" className={styles.filterForm}>
          <input name="q" placeholder="Cari nama kegiatan atau lokasi..." defaultValue={search} />
          <select name="tahun" defaultValue={tahun ?? ""}>
            <option value="">Semua tahun</option>
            {all.rows
              .map((x) => x.tahunAnggaran)
              .filter((x, i, a) => a.indexOf(x) === i)
              .sort((a, b) => b - a)
              .map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
          </select>
          <select name="status" defaultValue={status}>
            <option value="">Semua status</option>
            <option value="rencana">Rencana</option>
            <option value="berjalan">Berjalan</option>
            <option value="selesai">Selesai</option>
            <option value="dibatalkan">Dibatalkan</option>
          </select>
          <Button className={styles.primaryButton} variant="primary" type="submit">
            Filter
          </Button>
          <Link href="/keuangan/kegiatan">Reset</Link>
        </form>
        {data.rows.length ? (
          <TableScroll className={styles.tableWrap}>
            <Table className={styles.dataTable}>
              <THead>
                <Row>
                  <HeaderCell>No.</HeaderCell>
                  <HeaderCell>Nama Kegiatan</HeaderCell>
                  <HeaderCell>Lokasi</HeaderCell>
                  <HeaderCell>Tahun</HeaderCell>
                  <HeaderCell className={styles.number}>Anggaran</HeaderCell>
                  <HeaderCell>Progres</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {data.rows.map((row, i) => (
                  <Row key={row.id}>
                    <Cell>{i + 1}</Cell>
                    <Cell>
                      <Link href={"/keuangan/kegiatan/" + row.id} className={styles.rowLink}>
                        {row.judul}
                      </Link>
                    </Cell>
                    <Cell>{row.lokasi || "—"}</Cell>
                    <Cell>{row.tahunAnggaran}</Cell>
                    <Cell className={styles.number}>{formatAnggaran(row.anggaran)}</Cell>
                    <Cell>
                      <div className={styles.progress}>
                        <i style={{ width: row.progres + "%" }} />
                      </div>
                      <small>{row.progres}%</small>
                    </Cell>
                    <Cell>
                      <span className={styles.status}>{statusPembangunanLabel(row.status)}</span>
                    </Cell>
                    <Cell>
                      <Link href={"/keuangan/kegiatan/" + row.id}>Detail</Link>
                      <DialogHapusForm
                        aksi={hapusKegiatanPembangunanAction}
                        id={row.id}
                        judul={`Hapus kegiatan "${row.judul}"?`}
                        keterangan="Kegiatan, dokumentasi, dan rincian anggarannya akan dihapus permanen."
                        labelAksi="Hapus kegiatan"
                        varian="danger-ghost"
                      />
                    </Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        ) : (
          <p className={styles.empty}>Tidak ada kegiatan yang cocok dengan filter.</p>
        )}
      </section>
      <nav className={styles.pagination} aria-label="Halaman daftar kegiatan">
        <span>
          Menampilkan {data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1}–
          {Math.min(data.page * data.pageSize, data.total)} dari {data.total} kegiatan
        </span>
        <div>
          {data.page > 1 ? (
            <Link
              href={
                "/keuangan/kegiatan?" +
                new URLSearchParams({
                  q: search,
                  tahun: tahun ? String(tahun) : "",
                  status,
                  page: String(data.page - 1),
                }).toString()
              }
            >
              ← Sebelumnya
            </Link>
          ) : (
            <span className={styles.disabledPage}>← Sebelumnya</span>
          )}
          <strong>
            {data.page} / {data.pageCount}
          </strong>
          {data.page < data.pageCount ? (
            <Link
              href={
                "/keuangan/kegiatan?" +
                new URLSearchParams({
                  q: search,
                  tahun: tahun ? String(tahun) : "",
                  status,
                  page: String(data.page + 1),
                }).toString()
              }
            >
              Berikutnya →
            </Link>
          ) : (
            <span className={styles.disabledPage}>Berikutnya →</span>
          )}
        </div>
      </nav>
      <details className={styles.panel}>
        <summary className={styles.summary}>＋ Tambah Kegiatan Pembangunan</summary>
        <form action={buatKegiatanPembangunanAction} className={styles.projectForm}>
          <label>
            Nama kegiatan
            <input name="judul" required maxLength={200} />
          </label>
          <label>
            Tahun anggaran
            <input
              name="tahunAnggaran"
              type="number"
              min="2000"
              max="2100"
              defaultValue={new Date().getFullYear()}
              required
            />
          </label>
          <label>
            Sumber dana
            <select name="sumberDana">
              <option value="APBDes">APBDes</option>
              <option>Dana Desa</option>
              <option>ADD</option>
              <option>Bantuan Pusat</option>
              <option>Bantuan Provinsi</option>
              <option>Bantuan Kabupaten</option>
              <option>Swadaya Masyarakat</option>
              <option>Lainnya</option>
            </select>
          </label>
          <label>
            Anggaran (Rp)
            <input name="anggaran" type="number" min="0" step="1" />
          </label>
          <label>
            Lokasi
            <input name="lokasi" maxLength={200} />
          </label>
          <label>
            Latitude
            <input
              name="latitude"
              type="number"
              min="-90"
              max="90"
              step="0.0000001"
              placeholder="-2.1234567"
            />
          </label>
          <label>
            Longitude
            <input
              name="longitude"
              type="number"
              min="-180"
              max="180"
              step="0.0000001"
              placeholder="99.1234567"
            />
          </label>
          <label>
            Pelaksana
            <input name="pelaksana" maxLength={200} />
          </label>
          <label>
            Tanggal mulai
            <input name="mulai" type="date" />
          </label>
          <label>
            Tanggal selesai
            <input name="selesai" type="date" />
          </label>
          <label>
            Status
            <select name="status">
              <option value="rencana">Rencana</option>
              <option value="berjalan">Berjalan</option>
              <option value="selesai">Selesai</option>
              <option value="dibatalkan">Dibatalkan</option>
            </select>
          </label>
          <label>
            Progres (%)
            <input name="progres" type="number" min="0" max="100" defaultValue="0" />
          </label>
          <label className={styles.fullField}>
            Deskripsi
            <textarea name="deskripsi" rows={3} />
          </label>
          <label className={styles.fullField}>
            Hasil / manfaat
            <textarea name="hasil" rows={2} />
          </label>
          <Button className={styles.primaryButton} variant="primary" type="submit">
            Simpan Kegiatan
          </Button>
        </form>
      </details>
      <section className={styles.panel} id="peta">
        <div className={styles.panelHeading}>
          <div>
            <h2>Peta Persebaran Kegiatan</h2>
            <p>Pin peta memakai koordinat GPS pada data kegiatan.</p>
          </div>
        </div>
        {pinned.length ? (
          <PetaPersebaran
            points={pinned.map((x) => ({
              id: x.id,
              judul: x.judul,
              latitude: x.latitude!,
              longitude: x.longitude!,
            }))}
          />
        ) : (
          <p className={styles.empty}>
            Belum ada kegiatan dengan koordinat GPS. Lengkapi latitude dan longitude pada data
            kegiatan.
          </p>
        )}
        <div className={styles.mapLocations}>
          {all.rows
            .filter((x) => x.lokasi || (x.latitude !== null && x.longitude !== null))
            .map((x) => (
              <div key={x.id}>
                <span>⌖</span>
                <div>
                  <strong>{x.judul}</strong>
                  <small>
                    {x.lokasi || "Koordinat GPS tersimpan"}
                    {x.latitude !== null && x.longitude !== null
                      ? " · " + x.latitude + ", " + x.longitude
                      : ""}
                  </small>
                </div>
                <a
                  href={
                    x.latitude !== null && x.longitude !== null
                      ? "https://www.openstreetmap.org/?mlat=" +
                        x.latitude +
                        "&mlon=" +
                        x.longitude +
                        "#map=16/" +
                        x.latitude +
                        "/" +
                        x.longitude
                      : "https://www.google.com/maps/search/?api=1&query=" +
                        encodeURIComponent(x.lokasi ?? "")
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  {x.latitude !== null && x.longitude !== null ? "Buka pin GPS ↗" : "Cari lokasi ↗"}
                </a>
              </div>
            ))}
        </div>
        {!all.rows.some((x) => x.lokasi || (x.latitude !== null && x.longitude !== null)) ? (
          <p className={styles.empty}>
            Isi lokasi pada data kegiatan untuk menampilkannya di daftar peta.
          </p>
        ) : null}
      </section>
      <section className={styles.panel} id="kalender">
        <div className={styles.panelHeading}>
          <div>
            <h2>Kalender Kegiatan</h2>
            <p>Jadwal pelaksanaan yang bersumber dari tanggal mulai dan selesai proyek.</p>
          </div>
        </div>
        <div className={styles.calendarList}>
          {[...all.rows]
            .filter((x) => x.mulai || x.selesai)
            .sort((a, b) => (a.mulai ?? "9999").localeCompare(b.mulai ?? "9999"))
            .map((x) => (
              <div key={x.id}>
                <time>{x.mulai ?? "—"}</time>
                <div>
                  <strong>{x.judul}</strong>
                  <small>
                    {bulan(x.mulai)} – {x.selesai ?? "Belum ditentukan"} ·{" "}
                    {x.lokasi ?? "Lokasi belum diisi"}
                  </small>
                </div>
                <span className={styles.status}>{statusPembangunanLabel(x.status)}</span>
              </div>
            ))}
        </div>
        {!all.rows.some((x) => x.mulai || x.selesai) ? (
          <p className={styles.empty}>
            Belum ada jadwal kegiatan. Lengkapi tanggal mulai dan selesai pada detail kegiatan.
          </p>
        ) : null}
      </section>
      <section className={styles.panel} id="monitoring">
        <div className={styles.panelHeading}>
          <div>
            <h2>Monitoring Progres</h2>
            <p>Perbandingan progres fisik tiap kegiatan.</p>
          </div>
        </div>
        <div className={styles.monitorList}>
          {all.rows.map((x) => (
            <div key={x.id}>
              <div>
                <strong>{x.judul}</strong>
                <span>
                  {x.progres}% · {statusPembangunanLabel(x.status)}
                </span>
              </div>
              <div className={styles.progress}>
                <i style={{ width: x.progres + "%" }} />
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className={styles.panel} id="dokumentasi">
        <div className={styles.panelHeading}>
          <div>
            <h2>Dokumentasi Kegiatan</h2>
            <p>Kelola foto dari halaman detail masing-masing proyek.</p>
          </div>
        </div>
        <div className={styles.documentationLinks}>
          {all.rows.map((x) => (
            <Link key={x.id} href={"/keuangan/kegiatan/" + x.id}>
              {x.judul} <span>Kelola foto →</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
