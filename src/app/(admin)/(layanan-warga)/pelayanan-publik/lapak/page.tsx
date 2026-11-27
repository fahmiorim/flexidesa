import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { getDaftarLapak } from "@/features/layanan-warga/lapak/application/use-cases";

import { hapusLapakAction } from "./actions";
import { simpanLapakFormAction } from "./form-actions";

export const metadata: Metadata = { title: "Lapak Desa" };

type LapakRow = Awaited<ReturnType<typeof getDaftarLapak>>["rows"][number];

function isiLapak(row: LapakRow | null, kategori: string[]) {
  return (
    <div className="modul-form-grid">
      {row ? <input name="id" type="hidden" value={row.id} /> : null}
      <FormField
        containerClassName="form-field-full"
        defaultValue={row?.nama ?? ""}
        label="Nama lapak"
        maxLength={200}
        name="nama"
        placeholder="Contoh: Warung Bu Ani"
        required
      />
      <FormField
        defaultValue={row?.pemilik ?? ""}
        label="Nama pemilik"
        maxLength={100}
        name="pemilik"
      />
      <FormField
        defaultValue={row?.kategori ?? ""}
        helpText={kategori.length ? `Kategori yang sudah dipakai: ${kategori.join(", ")}.` : ""}
        label="Kategori usaha"
        maxLength={100}
        name="kategori"
      />
      <FormField
        containerClassName="form-field-full"
        defaultValue={row?.alamat ?? ""}
        kind="textarea"
        label="Alamat"
        name="alamat"
        rows={2}
      />
      <FormField
        containerClassName="form-field-full"
        defaultValue={row?.keterangan ?? ""}
        kind="textarea"
        label="Keterangan"
        name="keterangan"
        rows={2}
      />
    </div>
  );
}

export default async function LapakAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kategori?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").slice(0, 100);
  const kategori = (params.kategori ?? "").slice(0, 100);
  const page = Math.max(1, Number(params.page) || 1);

  const data = await getDaftarLapak({
    q: q || undefined,
    kategori: kategori || undefined,
    page,
  });

  const tautan = (target: number) => {
    const cari = new URLSearchParams();
    if (q) cari.set("q", q);
    if (kategori) cari.set("kategori", kategori);
    cari.set("page", String(target));
    return `/pelayanan-publik/lapak?${cari.toString()}`;
  };

  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Lapak Desa</>}
        deskripsi={<>Kelola lapak UMKM warga beserta produk yang tampil di website desa.</>}
      />
      <TableCard
        actions={
          data.akses.bolehTambah ? (
            <FormDialog
              aksi={simpanLapakFormAction}
              deskripsi="Isi identitas lapak, lalu tambahkan produknya di halaman rincian."
              judul="Tambah lapak"
              label="Tambah Lapak"
              labelSimpan="Simpan lapak"
            >
              {isiLapak(null, data.kategori)}
            </FormDialog>
          ) : null
        }
        description={`${data.total.toLocaleString("id-ID")} lapak terdaftar.`}
        filter={
          <form className="modul-filter-row" method="get">
            <FormField
              defaultValue={q}
              label="Cari lapak"
              name="q"
              placeholder="Nama, pemilik, atau alamat..."
            />
            <FormField
              defaultValue={kategori}
              kind="select"
              label="Kategori"
              name="kategori"
              options={[
                { value: "", label: "Semua kategori" },
                ...data.kategori.map((item) => ({ value: item, label: item })),
              ]}
            />
            <Button type="submit">Terapkan</Button>
            {q || kategori ? (
              <ButtonLink variant="secondary" href="/pelayanan-publik/lapak">
                Bersihkan
              </ButtonLink>
            ) : null}
          </form>
        }
        footer={
          data.pageCount > 1 ? (
            <div className="table-pagination">
              <span>
                Menampilkan {data.rows.length ? (data.page - 1) * data.pageSize + 1 : 0}–
                {Math.min(data.page * data.pageSize, data.total)} dari {data.total} lapak
              </span>
              <div className="page-actions">
                <ButtonLink
                  aria-disabled={data.page <= 1}
                  variant="secondary"
                  href={tautan(Math.max(1, data.page - 1))}
                >
                  Sebelumnya
                </ButtonLink>
                <span>
                  Halaman {data.page} / {data.pageCount}
                </span>
                <ButtonLink
                  aria-disabled={data.page >= data.pageCount}
                  variant="secondary"
                  href={tautan(Math.min(data.pageCount, data.page + 1))}
                >
                  Berikutnya
                </ButtonLink>
              </div>
            </div>
          ) : undefined
        }
        title="Daftar Lapak"
      >
        {data.rows.length ? (
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  <HeaderCell>Lapak</HeaderCell>
                  <HeaderCell>Pemilik</HeaderCell>
                  <HeaderCell>Kategori</HeaderCell>
                  <HeaderCell>Alamat</HeaderCell>
                  <HeaderCell>Produk</HeaderCell>
                  <HeaderCell>Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {data.rows.map((row) => (
                  <Row key={row.id}>
                    <Cell>
                      <strong>
                        <Link href={`/pelayanan-publik/lapak/${row.id}`}>{row.nama}</Link>
                      </strong>
                    </Cell>
                    <Cell>{row.pemilik ?? "—"}</Cell>
                    <Cell>{row.kategori ?? "—"}</Cell>
                    <Cell>{row.alamat ?? "—"}</Cell>
                    <Cell>{Number(row.produkCount).toLocaleString("id-ID")}</Cell>
                    <Cell>
                      <div className="table-actions">
                        <ButtonLink variant="secondary" href={`/pelayanan-publik/lapak/${row.id}`}>
                          Detail
                        </ButtonLink>
                        {data.akses.bolehUbah ? (
                          <FormDialog
                            aksi={simpanLapakFormAction}
                            deskripsi={`Ubah data lapak ${row.nama}.`}
                            judul="Ubah lapak"
                            label="Ubah"
                            labelSimpan="Simpan perubahan"
                            varian="secondary"
                          >
                            {isiLapak(row, data.kategori)}
                          </FormDialog>
                        ) : null}
                        {data.akses.bolehHapus ? (
                          <DialogHapusForm
                            aksi={hapusLapakAction}
                            id={row.id}
                            judul={`Hapus lapak "${row.nama}"?`}
                            keterangan="Lapak beserta seluruh produknya akan dihapus permanen."
                            labelAksi="Hapus lapak"
                          />
                        ) : null}
                      </div>
                    </Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        ) : (
          <p className="modul-empty">
            Belum ada lapak terdaftar. Tambahkan lapak pertama lewat tombol Tambah Lapak.
          </p>
        )}
      </TableCard>
    </div>
  );
}
