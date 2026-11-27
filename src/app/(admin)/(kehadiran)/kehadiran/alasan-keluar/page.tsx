import type { Metadata } from "next";

import { PageHeading } from "@/components/shell/page-heading";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormField } from "@/components/ui/form-field";
import { HapusTerpilih } from "@/components/ui/hapus-terpilih";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { getAlasanKeluarData } from "@/features/kehadiran/kehadiran/application/alasan-keluar-use-cases";
import {
  ALASAN_KELUAR_RESOURCE,
  KETERANGAN_ALASAN_MAKS,
  PANJANG_ALASAN_MAKS,
} from "@/features/kehadiran/kehadiran/domain/alasan-keluar";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import { hapusAlasanKeluarAction, hapusAlasanKeluarMassalAction } from "./actions";
import { simpanAlasanKeluarFormAction } from "./form-actions";

export const metadata: Metadata = { title: "Alasan Keluar" };

const PESAN_STATUS: Readonly<Record<string, string>> = {
  ditambah: "Alasan keluar berhasil ditambahkan.",
  diubah: "Alasan keluar berhasil diperbarui.",
  dihapus: "Alasan keluar berhasil dihapus.",
  kosong: "Pilih minimal satu alasan keluar yang akan dihapus.",
};

function nilaiTunggal(nilai: string | string[] | undefined): string {
  if (Array.isArray(nilai)) return nilai[0] ?? "";
  return nilai ?? "";
}

type AlasanRow = Awaited<ReturnType<typeof getAlasanKeluarData>>[number];

function formAlasan(row: AlasanRow | null) {
  return (
    <div className="modul-form-grid">
      {row ? <input name="id" type="hidden" value={row.id} /> : null}
      <FormField
        defaultValue={row?.alasan ?? ""}
        label="Alasan"
        maxLength={PANJANG_ALASAN_MAKS}
        name="alasan"
        placeholder="Contoh: Keperluan keluarga"
        required
      />
      <FormField
        defaultValue={row?.keterangan ?? ""}
        kind="textarea"
        label="Keterangan"
        maxLength={KETERANGAN_ALASAN_MAKS}
        name="keterangan"
        placeholder="Keterangan (opsional)"
        rows={3}
      />
    </div>
  );
}

export default async function AlasanKeluarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, user] = await Promise.all([searchParams, verifySession()]);
  const rows = await getAlasanKeluarData();

  const bolehTambah = hasPermission(user.permissions, ALASAN_KELUAR_RESOURCE, "create");
  const bolehUbah = hasPermission(user.permissions, ALASAN_KELUAR_RESOURCE, "update");
  const bolehHapus = hasPermission(user.permissions, ALASAN_KELUAR_RESOURCE, "delete");

  const status = nilaiTunggal(params.status);
  const jumlahDihapus = nilaiTunggal(params.jumlah);
  const pesanStatus = PESAN_STATUS[status];

  return (
    <div className="modul-page data-kependudukan-page">
      <PageHeading judul={<>Alasan Keluar</>} deskripsi={<>Alasan keluar pada jam kerja.</>} />

      {pesanStatus ? (
        <p className="alert alert-info" role="status">
          {status === "dihapus" && jumlahDihapus !== ""
            ? `Alasan keluar berhasil dihapus (${jumlahDihapus} data).`
            : pesanStatus}
        </p>
      ) : null}

      <TableCard
        title="Daftar Alasan Keluar"
        description={
          rows.length === 0
            ? "Belum ada alasan keluar yang tercatat."
            : `${rows.length} alasan tercatat.`
        }
        actions={
          <>
            {bolehTambah ? (
              <FormDialog
                aksi={simpanAlasanKeluarFormAction}
                deskripsi="Alasan yang tersimpan akan muncul sebagai pilihan pada pencatatan keluar."
                judul="Tambah alasan keluar"
                label="Tambah alasan keluar"
                labelSimpan="Tambah alasan"
              >
                {formAlasan(null)}
              </FormDialog>
            ) : null}
            {bolehHapus && rows.length > 0 ? (
              <HapusTerpilih
                aksi={hapusAlasanKeluarMassalAction}
                judul="Hapus alasan keluar terpilih?"
                label="Hapus terpilih"
              />
            ) : null}
          </>
        }
      >
        {rows.length === 0 ? (
          <div className="modul-empty">
            <strong>Belum ada alasan keluar.</strong>
            <p>Tambahkan alasan seperti keperluan keluarga atau urusan dinas luar.</p>
          </div>
        ) : (
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  {bolehHapus ? <HeaderCell scope="col">Hapus</HeaderCell> : null}
                  <HeaderCell scope="col">No.</HeaderCell>
                  <HeaderCell scope="col">Alasan</HeaderCell>
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
                          aria-label={`Pilih alasan keluar ${row.alasan}`}
                          name="idCb"
                          type="checkbox"
                          value={row.id}
                        />
                      </Cell>
                    ) : null}
                    <Cell>{index + 1}</Cell>
                    <Cell>{row.alasan}</Cell>
                    <Cell>{row.keterangan ?? "-"}</Cell>
                    {bolehUbah || bolehHapus ? (
                      <Cell>
                        <div className="table-actions">
                          {bolehUbah ? (
                            <FormDialog
                              aksi={simpanAlasanKeluarFormAction}
                              deskripsi={`Ubah alasan keluar "${row.alasan}".`}
                              judul="Ubah alasan keluar"
                              label="Ubah"
                              labelSimpan="Simpan perubahan"
                              varian="secondary"
                            >
                              {formAlasan(row)}
                            </FormDialog>
                          ) : null}
                          {bolehHapus ? (
                            <DialogHapusForm
                              aksi={hapusAlasanKeluarAction}
                              id={row.id}
                              judul={`Hapus alasan "${row.alasan}"?`}
                              keterangan="Alasan keluar akan dihapus permanen."
                              labelAksi="Hapus alasan"
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
