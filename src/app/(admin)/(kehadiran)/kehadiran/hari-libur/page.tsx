import type { Metadata } from "next";

import { PageHeading } from "@/components/shell/page-heading";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormField } from "@/components/ui/form-field";
import { HapusTerpilih } from "@/components/ui/hapus-terpilih";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { getHariLiburData } from "@/features/kehadiran/kehadiran/application/hari-libur-use-cases";
import {
  formatTanggalIndonesia,
  HARI_LIBUR_RESOURCE,
  KETERANGAN_HARI_LIBUR_MAKS,
  namaHariIndonesia,
} from "@/features/kehadiran/kehadiran/domain/hari-libur";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import { hapusHariLiburAction, hapusHariLiburMassalAction } from "./actions";
import { simpanHariLiburFormAction } from "./form-actions";

export const metadata: Metadata = { title: "Hari Libur" };

const PESAN_STATUS: Readonly<Record<string, string>> = {
  ditambah: "Hari libur berhasil ditambahkan.",
  diubah: "Hari libur berhasil diperbarui.",
  dihapus: "Hari libur berhasil dihapus.",
  kosong: "Pilih minimal satu hari libur yang akan dihapus.",
};

function nilaiTunggal(nilai: string | string[] | undefined): string {
  if (Array.isArray(nilai)) return nilai[0] ?? "";
  return nilai ?? "";
}

type HariLiburRow = Awaited<ReturnType<typeof getHariLiburData>>[number];

function formHariLibur(row: HariLiburRow | null) {
  return (
    <div className="modul-form-grid">
      {row ? <input name="id" type="hidden" value={row.id} /> : null}
      <FormField
        defaultValue={row?.tanggal ?? ""}
        label="Tanggal"
        name="tanggal"
        required
        type="date"
      />
      <FormField
        defaultValue={row?.keterangan ?? ""}
        kind="textarea"
        label="Keterangan"
        maxLength={KETERANGAN_HARI_LIBUR_MAKS}
        name="keterangan"
        placeholder="Contoh: Tahun Baru Masehi"
        required
        rows={3}
      />
    </div>
  );
}

export default async function HariLiburPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, user] = await Promise.all([searchParams, verifySession()]);
  const rows = await getHariLiburData();

  const bolehTambah = hasPermission(user.permissions, HARI_LIBUR_RESOURCE, "create");
  const bolehUbah = hasPermission(user.permissions, HARI_LIBUR_RESOURCE, "update");
  const bolehHapus = hasPermission(user.permissions, HARI_LIBUR_RESOURCE, "delete");

  const status = nilaiTunggal(params.status);
  const jumlahDihapus = nilaiTunggal(params.jumlah);
  const pesanStatus = PESAN_STATUS[status];

  return (
    <div className="modul-page data-kependudukan-page">
      <PageHeading judul={<>Hari Libur</>} deskripsi={<>Daftar hari libur desa.</>} />

      {pesanStatus ? (
        <p className="alert alert-info" role="status">
          {status === "dihapus" && jumlahDihapus !== ""
            ? `Hari libur berhasil dihapus (${jumlahDihapus} data).`
            : pesanStatus}
        </p>
      ) : null}

      <TableCard
        title="Daftar Hari Libur"
        description={
          rows.length === 0
            ? "Belum ada hari libur yang tercatat."
            : `${rows.length} tanggal libur tercatat.`
        }
        actions={
          <>
            {bolehTambah ? (
              <FormDialog
                aksi={simpanHariLiburFormAction}
                deskripsi="Satu tanggal hanya dapat tercatat sekali untuk desa ini."
                judul="Tambah hari libur"
                label="Tambah hari libur"
                labelSimpan="Tambah hari libur"
              >
                {formHariLibur(null)}
              </FormDialog>
            ) : null}
            {bolehHapus && rows.length > 0 ? (
              <HapusTerpilih
                aksi={hapusHariLiburMassalAction}
                judul="Hapus hari libur terpilih?"
                label="Hapus terpilih"
              />
            ) : null}
          </>
        }
      >
        {rows.length === 0 ? (
          <div className="modul-empty">
            <strong>Belum ada hari libur.</strong>
            <p>Tambahkan tanggal libur nasional atau cuti bersama agar tercatat di desa ini.</p>
          </div>
        ) : (
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  {bolehHapus ? <HeaderCell scope="col">Hapus</HeaderCell> : null}
                  <HeaderCell scope="col">No.</HeaderCell>
                  <HeaderCell scope="col">Tanggal</HeaderCell>
                  <HeaderCell scope="col">Hari</HeaderCell>
                  <HeaderCell scope="col">Keterangan</HeaderCell>
                  {bolehUbah || bolehHapus ? <HeaderCell scope="col">Aksi</HeaderCell> : null}
                </Row>
              </THead>
              <TBody>
                {rows.map((row, index) => (
                  <Row key={row.id}>
                    {bolehHapus ? (
                      <Cell>
                        <input
                          aria-label={`Pilih hari libur ${formatTanggalIndonesia(row.tanggal)}`}
                          name="idCb"
                          type="checkbox"
                          value={row.id}
                        />
                      </Cell>
                    ) : null}
                    <Cell>{index + 1}</Cell>
                    <Cell>{formatTanggalIndonesia(row.tanggal)}</Cell>
                    <Cell>{namaHariIndonesia(row.tanggal) || "-"}</Cell>
                    <Cell>{row.keterangan ?? "-"}</Cell>
                    {bolehUbah || bolehHapus ? (
                      <Cell>
                        <div className="table-actions">
                          {bolehUbah ? (
                            <FormDialog
                              aksi={simpanHariLiburFormAction}
                              deskripsi={`Ubah hari libur ${formatTanggalIndonesia(row.tanggal)}.`}
                              judul="Ubah hari libur"
                              label="Ubah"
                              labelSimpan="Simpan perubahan"
                              varian="secondary"
                            >
                              {formHariLibur(row)}
                            </FormDialog>
                          ) : null}
                          {bolehHapus ? (
                            <DialogHapusForm
                              aksi={hapusHariLiburAction}
                              id={row.id}
                              judul={`Hapus hari libur ${formatTanggalIndonesia(row.tanggal)}?`}
                              keterangan="Tanggal libur akan dihapus permanen."
                              labelAksi="Hapus hari libur"
                            />
                          ) : null}
                        </div>
                      </Cell>
                    ) : null}
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
