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
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { listBantuan } from "@/features/program-data-desa/bantuan/application/use-cases";
import {
  ASAL_DANA_LABELS,
  BANTUAN_RESOURCE,
  SASARAN_LABELS,
  sasaranLabel,
  statusMasaAktif,
} from "@/features/program-data-desa/bantuan/domain/bantuan";
import { requirePermission } from "@/lib/dal";

import { hapusProgram } from "./actions";
import { simpanProgramFormAction } from "./form-actions";

export const metadata: Metadata = { title: "Bantuan Sosial" };

const PER_HALAMAN = 20;

const asalDanaOptions = Object.entries(ASAL_DANA_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const sasaranOptions = Object.entries(SASARAN_LABELS).map(([value, label]) => ({
  value,
  label,
}));

type ProgramRow = Awaited<ReturnType<typeof listBantuan>>["rows"][number];

function formProgram(row: ProgramRow | null) {
  return (
    <div className="modul-form-grid">
      {row ? <input name="id" type="hidden" value={row.id} /> : null}
      <FormField
        containerClassName="form-field-full"
        defaultValue={row?.name ?? ""}
        label="Nama program"
        maxLength={100}
        name="nama"
        placeholder="Contoh: Bantuan Pangan Tunai"
        required
      />
      <FormField
        defaultValue={row ? String(row.sasaran) : ""}
        kind="select"
        label="Sasaran"
        name="sasaran"
        options={[{ value: "", label: "Pilih sasaran" }, ...sasaranOptions]}
      />
      <FormField
        defaultValue={row?.asalDana ? String(row.asalDana) : ""}
        kind="select"
        label="Asal dana"
        name="asalDana"
        options={[{ value: "", label: "Tidak ditentukan" }, ...asalDanaOptions]}
      />
      <FormField
        defaultValue={row?.startDate ?? ""}
        label="Tanggal mulai"
        name="tanggalMulai"
        type="date"
      />
      <FormField
        defaultValue={row?.endDate ?? ""}
        label="Tanggal akhir"
        name="tanggalAkhir"
        type="date"
      />
      <FormField
        containerClassName="form-field-full"
        defaultValue={row?.description ?? ""}
        kind="textarea"
        label="Keterangan"
        maxLength={500}
        name="keterangan"
        rows={3}
      />
    </div>
  );
}

function labelStatus(status: string) {
  return status === "aktif" ? "Berlangsung" : status === "belum" ? "Belum dimulai" : "Selesai";
}

export default async function BantuanAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const user = await requirePermission(BANTUAN_RESOURCE, "read");
  const bolehTambah = hasPermission(user.permissions, BANTUAN_RESOURCE, "create");
  const bolehUbah = hasPermission(user.permissions, BANTUAN_RESOURCE, "update");
  const bolehHapus = hasPermission(user.permissions, BANTUAN_RESOURCE, "delete");

  const search = (params.q ?? "").slice(0, 100);
  const page = Math.max(1, Number(params.page) || 1);
  const data = await listBantuan({ search, page, pageSize: PER_HALAMAN });
  const query = (next: number) =>
    `?${new URLSearchParams({
      ...(search ? { q: search } : {}),
      page: String(next),
    })}`;

  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Bantuan Sosial</>}
        deskripsi={<>Kelola program bantuan dan penerima bantuan desa.</>}
      />
      <TableCard
        actions={
          bolehTambah ? (
            <FormDialog
              aksi={simpanProgramFormAction}
              deskripsi="Program bantuan baru dengan sasaran dan masa berlakunya."
              judul="Tambah program bantuan"
              label="Tambah Program"
              labelSimpan="Simpan program"
            >
              {formProgram(null)}
            </FormDialog>
          ) : null
        }
        description={`${data.total.toLocaleString("id-ID")} program terdaftar.`}
        filter={
          <form className="modul-filter-row" method="get">
            <FormField
              defaultValue={search}
              label="Cari program"
              name="q"
              placeholder="Cari nama program..."
            />
            <Button type="submit">Terapkan</Button>
            {search ? (
              <ButtonLink variant="secondary" href="/satu-data/bantuan">
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
                {Math.min(data.page * data.pageSize, data.total)} dari {data.total} program
              </span>
              <div className="page-actions">
                <ButtonLink
                  aria-disabled={data.page <= 1}
                  variant="secondary"
                  href={query(Math.max(1, data.page - 1))}
                >
                  Sebelumnya
                </ButtonLink>
                <span>
                  Halaman {data.page} / {data.pageCount}
                </span>
                <ButtonLink
                  aria-disabled={data.page >= data.pageCount}
                  variant="secondary"
                  href={query(Math.min(data.pageCount, data.page + 1))}
                >
                  Berikutnya
                </ButtonLink>
              </div>
            </div>
          ) : undefined
        }
        title="Daftar Program Bantuan"
      >
        {data.rows.length ? (
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  <HeaderCell>Program</HeaderCell>
                  <HeaderCell>Sasaran</HeaderCell>
                  <HeaderCell>Asal Dana</HeaderCell>
                  <HeaderCell>Masa Berlaku</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Peserta</HeaderCell>
                  <HeaderCell>Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {data.rows.map((row) => (
                  <Row key={row.id}>
                    <Cell>
                      <strong>
                        <Link href={`/satu-data/bantuan/${row.id}`}>{row.name}</Link>
                      </strong>
                      <br />
                      <small>{row.slug}</small>
                    </Cell>
                    <Cell>{sasaranLabel(row.sasaran)}</Cell>
                    <Cell>
                      {row.asalDana
                        ? (ASAL_DANA_LABELS[row.asalDana as keyof typeof ASAL_DANA_LABELS] ?? "—")
                        : "—"}
                    </Cell>
                    <Cell>
                      {row.startDate ?? "—"} s.d. {row.endDate ?? "—"}
                    </Cell>
                    <Cell>{labelStatus(statusMasaAktif(row.startDate, row.endDate))}</Cell>
                    <Cell>{row.pesertaCount.toLocaleString("id-ID")}</Cell>
                    <Cell>
                      <div className="table-actions">
                        <ButtonLink variant="secondary" href={`/satu-data/bantuan/${row.id}`}>
                          Detail
                        </ButtonLink>
                        {bolehUbah ? (
                          <FormDialog
                            aksi={simpanProgramFormAction}
                            deskripsi={`Ubah data program ${row.name}.`}
                            judul="Ubah program bantuan"
                            label="Ubah"
                            labelSimpan="Simpan perubahan"
                            varian="secondary"
                          >
                            {formProgram(row)}
                          </FormDialog>
                        ) : null}
                        {bolehHapus ? (
                          <DialogHapusForm
                            aksi={hapusProgram}
                            id={row.id}
                            judul={`Hapus program "${row.name}"?`}
                            keterangan="Program hanya dapat dihapus bila sudah tidak memiliki peserta. Tindakan ini tidak dapat dibatalkan."
                            labelAksi="Hapus program"
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
            Belum ada program bantuan. Tambahkan program pertama lewat tombol Tambah Program.
          </p>
        )}
      </TableCard>
    </div>
  );
}
