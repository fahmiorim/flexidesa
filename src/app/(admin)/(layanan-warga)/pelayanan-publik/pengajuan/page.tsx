import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import {
  getPengajuanDetailData,
  getPengajuanPageData,
} from "@/features/layanan-warga/pelayanan/application/pengajuan-use-cases";

export const metadata = { title: "Pengajuan Layanan" };
const labels: Record<string, string> = {
  diajukan: "Menunggu",
  diverifikasi: "Diverifikasi",
  diproses: "Diproses",
  selesai: "Selesai",
  ditolak: "Ditolak",
};
const order = ["diajukan", "diverifikasi", "diproses", "selesai", "ditolak"];
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string; detail?: string }>;
}) {
  const p = await searchParams;
  const status = ["diajukan", "diverifikasi", "diproses", "selesai", "ditolak"].includes(
    p.status ?? "",
  )
    ? p.status
    : undefined;
  const q = (p.q ?? "").slice(0, 100),
    page = Math.max(1, Math.min(10000, Number(p.page) || 1));
  const d = await getPengajuanPageData(status, q, page);
  const selectedId = Number(p.detail);
  const selected =
    Number.isSafeInteger(selectedId) && selectedId > 0
      ? await getPengajuanDetailData(selectedId)
      : null;
  const countByStatus = new Map(d.statusSummary.map((item) => [item.status, item.total]));
  const total = d.statusSummary.reduce((sum, item) => sum + item.total, 0);
  const query = (next: number, detail?: number) =>
    "?" +
    new URLSearchParams({
      ...(status ? { status } : {}),
      ...(q ? { q } : {}),
      page: String(next),
      ...(detail ? { detail: String(detail) } : {}),
    }).toString();
  const exportQuery = new URLSearchParams({
    ...(status ? { status } : {}),
    ...(q ? { q } : {}),
  }).toString();
  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Pengajuan Layanan</>}
        deskripsi={<>Proses pengajuan layanan masyarakat.</>}
        aksi={
          <>
            <ButtonLink
              variant="primary"
              href={"/pelayanan-publik/pengajuan/ekspor" + (exportQuery ? "?" + exportQuery : "")}
            >
              ↓ Ekspor CSV
            </ButtonLink>
          </>
        }
      />
      <div className="dashboard-stats">
        <article className="modul-card">
          <span>Total Pengajuan</span>
          <strong>{total.toLocaleString("id-ID")}</strong>
          <small>Seluruh pengajuan layanan</small>
        </article>
        {order.map((key) => (
          <article className="modul-card" key={key}>
            <span>{labels[key]}</span>
            <strong>{(countByStatus.get(key) ?? 0).toLocaleString("id-ID")}</strong>
            <small>
              {total
                ? (((countByStatus.get(key) ?? 0) / total) * 100).toFixed(1).replace(".", ",")
                : "0,0"}
              % dari total
            </small>
          </article>
        ))}
      </div>
      <nav aria-label="Filter status pengajuan" className="quick-actions">
        <ButtonLink variant={!status ? "primary" : "secondary"} href="/pelayanan-publik/pengajuan">
          Semua Pengajuan
        </ButtonLink>
        {Object.entries(labels).map(([key, label]) => (
          <ButtonLink
            key={key}
            variant={status === key ? "primary" : "secondary"}
            href={"/pelayanan-publik/pengajuan?status=" + key}
          >
            {label}
          </ButtonLink>
        ))}
      </nav>
      <div className="request-workspace">
        <TableCard
          description="Pilih satu pengajuan untuk melihat ringkasan di panel detail."
          filter={
            <form method="get" className="modul-filter-row">
              <FormField
                defaultValue={q}
                label="Cari nomor tiket, nama, atau NIK"
                name="q"
                placeholder="Cari pengajuan…"
              />
              <FormField
                defaultValue={status ?? ""}
                kind="select"
                label="Status"
                name="status"
                options={[
                  { value: "", label: "Semua status" },
                  ...Object.entries(labels).map(([v, l]) => ({ value: v, label: l })),
                ]}
              />
              <input name="page" type="hidden" value="1" />
              <Button variant="primary">Filter</Button>
            </form>
          }
          footer={
            <div className="table-pagination">
              <span>
                Menampilkan {d.total === 0 ? 0 : (d.page - 1) * d.pageSize + 1}–
                {Math.min(d.page * d.pageSize, d.total)} dari {d.total} pengajuan
              </span>
              <div className="page-actions">
                <ButtonLink
                  aria-disabled={d.page <= 1}
                  variant="secondary"
                  href={query(Math.max(1, d.page - 1), selectedId || undefined)}
                >
                  Sebelumnya
                </ButtonLink>
                <span>
                  Halaman {d.page} / {d.totalPages}
                </span>
                <ButtonLink
                  aria-disabled={d.page >= d.totalPages}
                  variant="secondary"
                  href={query(Math.min(d.totalPages, d.page + 1), selectedId || undefined)}
                >
                  Berikutnya
                </ButtonLink>
              </div>
            </div>
          }
          title="Antrean Pengajuan"
        >
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  <HeaderCell>No. Tiket</HeaderCell>
                  <HeaderCell>Pemohon</HeaderCell>
                  <HeaderCell>Layanan</HeaderCell>
                  <HeaderCell>Tanggal</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {d.rows.map((r) => (
                  <Row key={r.id}>
                    <Cell>
                      <strong>{r.nomorTiket}</strong>
                    </Cell>
                    <Cell>
                      {r.namaPemohon}
                      <br />
                      <small>{r.nik ?? "NIK tidak dicantumkan"}</small>
                    </Cell>
                    <Cell>{r.namaLayanan ?? "Layanan dihapus"}</Cell>
                    <Cell>{r.createdAt?.toLocaleDateString("id-ID") ?? "—"}</Cell>
                    <Cell>{labels[r.status] ?? r.status}</Cell>
                    <Cell>
                      <ButtonLink variant="secondary" href={query(d.page, r.id)}>
                        Pilih
                      </ButtonLink>
                    </Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
          {d.rows.length === 0 ? (
            <p className="modul-empty">Tidak ada pengajuan yang sesuai dengan filter.</p>
          ) : null}
        </TableCard>
        <aside className="modul-card request-detail-panel">
          {selected ? (
            <>
              <div className="page-heading">
                <div>
                  <h2>{selected.request.nomorTiket}</h2>
                  <p>{selected.namaLayanan ?? "Layanan tidak tersedia"}</p>
                </div>
                <span className={"request-status request-status-" + selected.request.status}>
                  {labels[selected.request.status] ?? selected.request.status}
                </span>
              </div>
              <div className="request-detail-list">
                <div>
                  <small>Nama pemohon</small>
                  <strong>{selected.request.namaPemohon}</strong>
                </div>
                <div>
                  <small>NIK</small>
                  <strong>{selected.request.nik ?? "—"}</strong>
                </div>
                <div>
                  <small>Telepon</small>
                  <strong>{selected.request.telepon ?? "—"}</strong>
                </div>
                <div>
                  <small>Tanggal pengajuan</small>
                  <strong>{selected.request.createdAt.toLocaleString("id-ID")}</strong>
                </div>
                <div>
                  <small>Keperluan</small>
                  <p>{selected.request.keperluan}</p>
                </div>
                <div>
                  <small>Catatan petugas</small>
                  <p>{selected.request.catatanPetugas ?? "Belum ada catatan."}</p>
                </div>
              </div>
              <ButtonLink
                variant="primary"
                href={"/pelayanan-publik/pengajuan/" + selected.request.id}
              >
                Buka Detail & Proses →
              </ButtonLink>
            </>
          ) : (
            <div className="modul-empty">
              <strong>Belum ada pengajuan dipilih</strong>
              <p>Pilih salah satu baris antrean untuk melihat ringkasan pemohon dan status.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
