import type { Metadata } from "next";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { listPengaduanData } from "@/features/layanan-warga/pengaduan/application/use-cases";
import {
  hitungStatistikPengaduan,
  KATEGORI_PENGADUAN,
  labelStatus,
  STATUS_PENGADUAN,
} from "@/features/layanan-warga/pengaduan/domain/pengaduan";

export const metadata: Metadata = { title: "Pengaduan Warga" };

const FORMAT_TANGGAL = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function PengaduanAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; kategori?: string; cari?: string; berhasil?: string }>;
}) {
  const params = await searchParams;
  const status = STATUS_PENGADUAN.some((item) => item.value === params.status)
    ? (params.status as (typeof STATUS_PENGADUAN)[number]["value"])
    : undefined;
  const kategori = KATEGORI_PENGADUAN.some((item) => item.value === params.kategori)
    ? params.kategori
    : undefined;
  const [semua, rows] = await Promise.all([
    listPengaduanData({}),
    listPengaduanData({ status, kategori, cari: params.cari }),
  ]);
  const statistik = hitungStatistikPengaduan(semua);

  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Pengaduan Warga</>}
        deskripsi={<>Tindak lanjuti pengaduan masyarakat.</>}
        aksi={
          <>
            <ButtonLink variant="secondary" href="/pengaduan">
              Lihat halaman publik
            </ButtonLink>
          </>
        }
      />
      {params.berhasil ? (
        <p className="alert alert-info" role="status">
          Pengaduan berhasil dihapus.
        </p>
      ) : null}
      <div className="dashboard-stats">
        <article className="modul-card">
          <span>Total Pengaduan</span>
          <strong>{statistik.total.toLocaleString("id-ID")}</strong>
        </article>
        <article className="modul-card">
          <span>Baru</span>
          <strong>{statistik.baru.toLocaleString("id-ID")}</strong>
        </article>
        <article className="modul-card">
          <span>Diproses</span>
          <strong>{statistik.diproses.toLocaleString("id-ID")}</strong>
        </article>
        <article className="modul-card">
          <span>Selesai</span>
          <strong>{statistik.selesai.toLocaleString("id-ID")}</strong>
        </article>
      </div>
      <TableCard
        description={`${rows.length.toLocaleString("id-ID")} pengaduan ditampilkan.`}
        filter={
          <form method="get" className="modul-filter-row">
            <FormField
              defaultValue={params.cari ?? ""}
              label="Cari tiket / judul / pelapor"
              name="cari"
              placeholder="PGD-..., jalan rusak..."
            />
            <FormField
              defaultValue={status ?? ""}
              kind="select"
              label="Status"
              name="status"
              options={[
                { value: "", label: "Semua status" },
                ...STATUS_PENGADUAN.map((item) => ({ value: item.value, label: item.label })),
              ]}
            />
            <FormField
              defaultValue={kategori ?? ""}
              kind="select"
              label="Kategori"
              name="kategori"
              options={[
                { value: "", label: "Semua kategori" },
                ...KATEGORI_PENGADUAN.map((item) => ({ value: item.value, label: item.label })),
              ]}
            />
            <div className="modul-form-actions">
              <Button variant="primary" type="submit">
                Terapkan
              </Button>
              <ButtonLink variant="secondary" href="/pengaduan-admin">
                Reset
              </ButtonLink>
            </div>
          </form>
        }
        title="Daftar Pengaduan"
      >
        {rows.length === 0 ? (
          <p className="modul-empty">Tidak ada pengaduan yang cocok dengan filter.</p>
        ) : (
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  <HeaderCell>Tiket</HeaderCell>
                  <HeaderCell>Judul</HeaderCell>
                  <HeaderCell>Pelapor</HeaderCell>
                  <HeaderCell>Kategori</HeaderCell>
                  <HeaderCell>Masuk</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {rows.map((row) => (
                  <Row key={row.id}>
                    <Cell className="modul-mono">{row.nomorTiket}</Cell>
                    <Cell>
                      <strong>{row.judul}</strong>
                      {row.petugasNama ? (
                        <span className="modul-muted">Ditangani {row.petugasNama}</span>
                      ) : null}
                    </Cell>
                    <Cell>{row.namaPelapor}</Cell>
                    <Cell>
                      {KATEGORI_PENGADUAN.find((item) => item.value === row.kategori)?.label ??
                        "Umum"}
                    </Cell>
                    <Cell>{row.createdAt ? FORMAT_TANGGAL.format(row.createdAt) : "—"}</Cell>
                    <Cell>
                      <span
                        className="beranda-chip"
                        data-tone={
                          row.status === "baru"
                            ? "peringatan"
                            : row.status === "selesai"
                              ? "positif"
                              : "netral"
                        }
                      >
                        {labelStatus(row.status)}
                      </span>
                    </Cell>
                    <Cell>
                      <ButtonLink variant="secondary" href={`/pengaduan-admin/${row.id}`}>
                        Detail
                      </ButtonLink>
                    </Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        )}
      </TableCard>
    </div>
  );
}
