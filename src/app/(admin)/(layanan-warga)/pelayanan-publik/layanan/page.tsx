import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { getLayananPageData } from "@/features/layanan-warga/pelayanan/application/layanan-use-cases";

import { hapusLayananAction } from "./actions";

export const metadata = { title: "Daftar Layanan Publik" };

const money = (value: number) =>
  value === 0
    ? "Gratis"
    : new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(value);

const categories = [
  ["Semua", ""],
  ["Administrasi", "administrasi"],
  ["Kependudukan", "kependudukan"],
  ["Sosial", "sosial"],
  ["Pemerintahan", "pemerintahan"],
  ["Lainnya", "lainnya"],
] as const;

export default async function LayananPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tersimpan?: string; dihapus?: string }>;
}) {
  const p = await searchParams,
    q = (p.q ?? "").slice(0, 100);
  const [d, all] = await Promise.all([getLayananPageData(q), getLayananPageData()]);
  const active = all.rows.filter((r) => r.aktif).length,
    inactive = all.rows.length - active;

  return (
    <div className="modul-page">
      <PageHeading judul={<>Daftar Layanan</>} deskripsi={<>Kelola jenis layanan publik desa.</>} />
      <div className="dashboard-stats">
        <article className="modul-card">
          <span>Total Layanan</span>
          <strong>{d.total.toLocaleString("id-ID")}</strong>
          <small>Jenis layanan terdaftar</small>
        </article>
        <article className="modul-card">
          <span>Layanan Aktif</span>
          <strong>{active.toLocaleString("id-ID")}</strong>
          <small>Tersedia untuk masyarakat</small>
        </article>
        <article className="modul-card">
          <span>Layanan Nonaktif</span>
          <strong>{inactive.toLocaleString("id-ID")}</strong>
          <small>Tidak ditampilkan ke warga</small>
        </article>
        <article className="modul-card">
          <span>Rata-rata Estimasi</span>
          <strong>
            {d.rows.length
              ? Math.round(d.rows.reduce((sum, r) => sum + r.estimasiHari, 0) / d.rows.length)
              : 0}{" "}
            hari
          </strong>
          <small>Berdasarkan daftar yang tampil</small>
        </article>
      </div>
      {p.tersimpan ? <div className="alert alert-info">Layanan berhasil disimpan.</div> : null}
      {p.dihapus ? <div className="alert alert-info">Layanan berhasil dihapus.</div> : null}
      <TableCard
        title="Katalog Layanan Desa"
        description="Gunakan pencarian atau kategori untuk menemukan layanan yang akan dikelola."
        actions={
          d.canCreate ? (
            <ButtonLink variant="primary" href="/pelayanan-publik/layanan/baru">
              ＋ Tambah Layanan
            </ButtonLink>
          ) : null
        }
        filter={
          <>
            <nav className="quick-actions" aria-label="Kategori layanan">
              {categories.map(([label, value]) => (
                <ButtonLink
                  key={value || "all"}
                  variant={q === value || (!q && !value) ? "primary" : "secondary"}
                  href={
                    value
                      ? "/pelayanan-publik/layanan?q=" + encodeURIComponent(value)
                      : "/pelayanan-publik/layanan"
                  }
                >
                  {label}
                </ButtonLink>
              ))}
            </nav>
            <form method="get" className="modul-filter-row">
              <FormField
                defaultValue={q}
                label="Cari layanan"
                name="q"
                placeholder="Cari nama atau kategori layanan…"
              />
              <Button variant="secondary" type="submit">
                Cari
              </Button>
            </form>
          </>
        }
        footer={
          <p className="modul-muted">
            Menampilkan {d.rows.length} dari {d.total} layanan.
          </p>
        }
      >
        <TableScroll className="modul-scroll">
          <Table className="modul-table">
            <THead>
              <Row>
                <HeaderCell>Nama layanan</HeaderCell>
                <HeaderCell>Kategori</HeaderCell>
                <HeaderCell>Estimasi</HeaderCell>
                <HeaderCell>Biaya</HeaderCell>
                <HeaderCell>Status</HeaderCell>
                <HeaderCell>Aksi</HeaderCell>
              </Row>
            </THead>
            <TBody>
              {d.rows.map((r) => (
                <Row key={r.id}>
                  <Cell>
                    <strong>{r.nama}</strong>
                    <br />
                    <small>{r.deskripsi ?? ""}</small>
                  </Cell>
                  <Cell>{r.kategori}</Cell>
                  <Cell>{r.estimasiHari} hari kerja</Cell>
                  <Cell>{money(r.biaya)}</Cell>
                  <Cell>{r.aktif ? "Aktif" : "Nonaktif"}</Cell>
                  <Cell>
                    <div className="table-actions">
                      <ButtonLink variant="secondary" href={"/pelayanan-publik/layanan/" + r.id}>
                        Detail
                      </ButtonLink>
                      {d.canUpdate ? (
                        <ButtonLink
                          variant="secondary"
                          href={"/pelayanan-publik/layanan/" + r.id + "/edit"}
                        >
                          Ubah
                        </ButtonLink>
                      ) : null}
                      {d.canDelete ? (
                        <DialogHapusForm
                          aksi={hapusLayananAction}
                          id={r.id}
                          judul={`Hapus layanan "${r.nama}"?`}
                          keterangan="Layanan dan persyaratannya akan dihapus permanen dari katalog desa."
                          labelAksi="Hapus layanan"
                        />
                      ) : null}
                    </div>
                  </Cell>
                </Row>
              ))}
            </TBody>
          </Table>
        </TableScroll>
        {d.rows.length === 0 ? (
          <p className="modul-empty">
            Belum ada layanan yang sesuai. Tambahkan layanan pertama untuk mulai mengelola katalog
            desa.
          </p>
        ) : null}
      </TableCard>
    </div>
  );
}
