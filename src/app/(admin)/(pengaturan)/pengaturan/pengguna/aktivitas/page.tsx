import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { labelAktivitas } from "@/features/beranda/dashboard/domain/aktivitas";
import { getAuditLogPageData } from "@/features/pengaturan/audit/application/audit-use-cases";

import styles from "./aktivitas.module.css";

export const metadata = { title: "Aktivitas Pengguna" };
export default async function AktivitasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; event?: string; days?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const days = [7, 30, 90].includes(Number(params.days)) ? Number(params.days) : 7;
  const data = await getAuditLogPageData({
    page,
    search: params.q,
    event: params.event || undefined,
    days,
  });
  return (
    <main className={styles.page}>
      <PageHeading
        judul={<>Aktivitas Pengguna</>}
        deskripsi={<>Jejak aktivitas dan audit data desa.</>}
        aksi={
          <>
            <ButtonLink variant="secondary" href="/api/pengaturan/pengguna/aktivitas/ekspor">
              Unduh CSV
            </ButtonLink>
          </>
        }
      />
      <div className={styles.stats}>
        <article>
          <span>Total Aktivitas</span>
          <strong>
            {Object.values(data.stats)
              .reduce((sum, value) => sum + value, 0)
              .toLocaleString("id-ID")}
          </strong>
        </article>
        <article>
          <span>Login</span>
          <strong>{(data.stats["auth.login.success"] ?? 0).toLocaleString("id-ID")}</strong>
        </article>
        <article>
          <span>Gagal Login</span>
          <strong>{(data.stats["auth.login.failure"] ?? 0).toLocaleString("id-ID")}</strong>
        </article>
        <article>
          <span>Tambah Data</span>
          <strong>{(data.stats["pengguna.create"] ?? 0).toLocaleString("id-ID")}</strong>
        </article>
        <article>
          <span>Ubah Data</span>
          <strong>{(data.stats["pengguna.update"] ?? 0).toLocaleString("id-ID")}</strong>
        </article>
        <article>
          <span>Hapus Data</span>
          <strong>{(data.stats["pengguna.delete"] ?? 0).toLocaleString("id-ID")}</strong>
        </article>
      </div>
      <TableCard
        description={`${data.total.toLocaleString("id-ID")} aktivitas tercatat · halaman ${data.page} dari ${data.pageCount}`}
        filter={
          <form className={styles.search}>
            <input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Cari pengguna, aktivitas, atau modul..."
            />
            <select name="event" defaultValue={params.event ?? ""}>
              <option value="">Semua Aktivitas</option>
              <option value="auth.login.success">Login</option>
              <option value="auth.login.failure">Gagal Login</option>
              <option value="pengguna.create">Tambah Pengguna</option>
              <option value="pengguna.update">Ubah Pengguna</option>
              <option value="pengguna.delete">Hapus Pengguna</option>
              <option value="grup-akses.permission">Ubah Hak Akses</option>
            </select>
            <select name="days" defaultValue={String(days)}>
              <option value="7">7 Hari Terakhir</option>
              <option value="30">30 Hari Terakhir</option>
              <option value="90">90 Hari Terakhir</option>
            </select>
            <Button variant="secondary" type="submit">
              Filter
            </Button>
          </form>
        }
        title="Jejak Aktivitas"
      >
        <TableScroll className={styles.tableWrap}>
          <Table>
            <THead>
              <Row>
                <HeaderCell>No.</HeaderCell>
                <HeaderCell>Waktu</HeaderCell>
                <HeaderCell>Pengguna</HeaderCell>
                <HeaderCell>Aktivitas</HeaderCell>
                <HeaderCell>Modul</HeaderCell>
                <HeaderCell>Detail</HeaderCell>
                <HeaderCell>IP Address</HeaderCell>
                <HeaderCell>Perangkat</HeaderCell>
              </Row>
            </THead>
            <TBody>
              {data.rows.map((row, index) => (
                <Row key={row.id}>
                  <Cell>{(page - 1) * data.pageSize + index + 1}</Cell>
                  <Cell>
                    {new Intl.DateTimeFormat("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(row.createdAt)}
                  </Cell>
                  <Cell>{row.actorName ?? "Sistem"}</Cell>
                  <Cell>
                    <span className={styles.event}>{labelAktivitas(row.event)}</span>
                  </Cell>
                  <Cell>{row.resource}</Cell>
                  <Cell>{row.details ?? row.resourceId ?? "—"}</Cell>
                  <Cell>{row.ipAddress ?? "—"}</Cell>
                  <Cell>{row.userAgent?.slice(0, 80) ?? "—"}</Cell>
                </Row>
              ))}
              {data.rows.length === 0 ? (
                <Row>
                  <Cell colSpan={8}>Belum ada aktivitas yang sesuai.</Cell>
                </Row>
              ) : null}
            </TBody>
          </Table>
        </TableScroll>
        <footer className={styles.summary}>
          <span>
            Menampilkan {data.rows.length} dari {data.total} aktivitas
          </span>
          <div>
            {page > 1 ? (
              <Link
                href={`?page=${page - 1}&q=${encodeURIComponent(params.q ?? "")}&event=${encodeURIComponent(params.event ?? "")}&days=${days}`}
              >
                ‹ Sebelumnya
              </Link>
            ) : null}
            {page < data.pageCount ? (
              <Link
                href={`?page=${page + 1}&q=${encodeURIComponent(params.q ?? "")}&event=${encodeURIComponent(params.event ?? "")}&days=${days}`}
              >
                Berikutnya ›
              </Link>
            ) : null}
          </div>
        </footer>
      </TableCard>
    </main>
  );
}
