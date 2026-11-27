import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { getLayananPageData } from "@/features/layanan-warga/pelayanan/application/layanan-use-cases";
import { getPengajuanPageData } from "@/features/layanan-warga/pelayanan/application/pengajuan-use-cases";
import { getSurveiPageData } from "@/features/layanan-warga/pelayanan/application/survei-use-cases";

export const metadata = { title: "Dashboard Pelayanan Publik" };
const statusLabel: Record<string, string> = {
  diajukan: "Menunggu",
  diverifikasi: "Diverifikasi",
  diproses: "Diproses",
  selesai: "Selesai",
  ditolak: "Ditolak",
};
const number = (value: number) => value.toLocaleString("id-ID");
export default async function Page() {
  const [layanan, pengajuan, survei] = await Promise.all([
    getLayananPageData(),
    getPengajuanPageData(),
    getSurveiPageData(),
  ]);
  const totalResponden = survei.rows.reduce((sum, row) => sum + row.totalResponden, 0);
  const layananAktif = layanan.rows.filter((row) => row.aktif).length;
  const statusTotal = pengajuan.statusSummary.reduce((sum, item) => sum + item.total, 0);
  const selesai = pengajuan.statusSummary.find((item) => item.status === "selesai")?.total ?? 0;
  const terbaru = pengajuan.rows.slice(0, 5);
  const statusMax = Math.max(1, ...pengajuan.statusSummary.map((item) => item.total));
  const surveiAktif = survei.rows.filter((row) => row.aktif === 1).length;
  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Dashboard Pelayanan Publik</>}
        deskripsi={<>Pantau layanan dan kepuasan warga.</>}
        aksi={
          <>
            <ButtonLink variant="secondary" href="/pelayanan-publik/pengajuan">
              Lihat Pengajuan →
            </ButtonLink>
          </>
        }
      />
      <div className="dashboard-stats">
        <article className="modul-card">
          <span>Total Pengajuan</span>
          <strong>{number(statusTotal)}</strong>
          <small>Seluruh pengajuan pada desa ini</small>
        </article>
        <article className="modul-card">
          <span>Pengajuan Selesai</span>
          <strong>{number(selesai)}</strong>
          <small>
            {statusTotal ? Math.round((selesai / statusTotal) * 100) : 0}% dari total pengajuan
          </small>
        </article>
        <article className="modul-card">
          <span>Layanan Aktif</span>
          <strong>{number(layananAktif)}</strong>
          <small>Dari {number(layanan.total)} layanan terdaftar</small>
        </article>
        <article className="modul-card">
          <span>Responden Survei</span>
          <strong>{number(totalResponden)}</strong>
          <small>{surveiAktif} survei sedang aktif</small>
        </article>
      </div>
      <div className="dashboard-grid">
        <section className="modul-card">
          <div className="page-heading">
            <div>
              <h2>Ringkasan Status Pengajuan</h2>
              <p>Distribusi status seluruh permohonan layanan.</p>
            </div>
            <Link href="/pelayanan-publik/pengajuan">Lihat detail →</Link>
          </div>
          <div className="service-status-chart">
            {pengajuan.statusSummary.map((item) => (
              <div className="service-status-row" key={item.status}>
                <span>{statusLabel[item.status] ?? item.status}</span>
                <div>
                  <i style={{ width: (item.total / statusMax) * 100 + "%" }} />
                </div>
                <strong>{number(item.total)}</strong>
              </div>
            ))}
          </div>
          {pengajuan.statusSummary.length === 0 ? (
            <p className="modul-empty">Belum ada data pengajuan.</p>
          ) : null}
        </section>
        <section className="modul-card">
          <div className="page-heading">
            <div>
              <h2>Pengajuan Terbaru</h2>
              <p>Permohonan layanan yang baru masuk.</p>
            </div>
            <Link href="/pelayanan-publik/pengajuan">Lihat semua →</Link>
          </div>
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  <HeaderCell>No. Tiket</HeaderCell>
                  <HeaderCell>Pemohon</HeaderCell>
                  <HeaderCell>Layanan</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {terbaru.map((row) => (
                  <Row key={row.id}>
                    <Cell>
                      <strong>{row.nomorTiket}</strong>
                    </Cell>
                    <Cell>{row.namaPemohon}</Cell>
                    <Cell>{row.namaLayanan ?? "Layanan tidak tersedia"}</Cell>
                    <Cell>{statusLabel[row.status] ?? row.status}</Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
          {terbaru.length === 0 ? <p className="modul-empty">Belum ada pengajuan.</p> : null}
        </section>
        <section className="modul-card">
          <div className="page-heading">
            <div>
              <h2>Layanan Desa</h2>
              <p>Katalog layanan yang tersedia bagi masyarakat.</p>
            </div>
            <Link href="/pelayanan-publik/layanan">Kelola →</Link>
          </div>
          <ul className="activity-list">
            {layanan.rows.slice(0, 5).map((row) => (
              <li key={row.id}>
                <strong>{row.nama}</strong>
                <p>
                  {row.kategori} · {row.estimasiHari} hari kerja ·{" "}
                  {row.aktif ? "Aktif" : "Nonaktif"}
                </p>
              </li>
            ))}
          </ul>
          {layanan.rows.length === 0 ? (
            <p className="modul-empty">Belum ada katalog layanan.</p>
          ) : null}
        </section>
        <section className="modul-card">
          <div className="page-heading">
            <div>
              <h2>Survei & Kepuasan</h2>
              <p>Partisipasi dan status survei masyarakat.</p>
            </div>
            <Link href="/pelayanan-publik/survei">Lihat survei →</Link>
          </div>
          <div className="dashboard-stats">
            <div>
              <span>Survei aktif</span>
              <strong>{surveiAktif}</strong>
            </div>
            <div>
              <span>Total responden</span>
              <strong>{number(totalResponden)}</strong>
            </div>
          </div>
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  <HeaderCell>Survei</HeaderCell>
                  <HeaderCell>Responden</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {survei.rows.slice(0, 5).map((row) => (
                  <Row key={row.id}>
                    <Cell>{row.judul}</Cell>
                    <Cell>{number(row.totalResponden)}</Cell>
                    <Cell>{row.aktif === 1 ? "Aktif" : "Nonaktif"}</Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
          {survei.rows.length === 0 ? (
            <p className="modul-empty">Belum ada survei yang dibuat.</p>
          ) : null}
        </section>
        <section className="modul-card">
          <h2>Akses Cepat</h2>
          <div className="quick-actions">
            <ButtonLink variant="primary" href="/pelayanan-publik/layanan/baru">
              ＋ Tambah Layanan
            </ButtonLink>
            <ButtonLink variant="secondary" href="/pelayanan-publik/pengajuan">
              Kelola Pengajuan
            </ButtonLink>
            <ButtonLink variant="secondary" href="/pelayanan-publik/survei/baru">
              ＋ Buat Survei
            </ButtonLink>
          </div>
        </section>
      </div>
    </div>
  );
}
