import type { Metadata } from "next";

import { PageHeading } from "@/components/shell/page-heading";
import { FormDialog } from "@/components/ui/form-dialog";
import { FieldShell, FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { getJamKerjaData } from "@/features/kehadiran/kehadiran/application/jam-kerja-use-cases";
import {
  JAM_KERJA_RESOURCE,
  KETERANGAN_JAM_KERJA_MAKS,
  type JamKerjaRow,
} from "@/features/kehadiran/kehadiran/domain/jam-kerja";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import { simpanJamKerjaFormAction } from "./form-actions";

export const metadata: Metadata = { title: "Jam Kerja" };

const PESAN_STATUS: Readonly<Record<string, string>> = {
  diubah: "Jam kerja berhasil diperbarui.",
};

function nilaiTunggal(nilai: string | string[] | undefined): string {
  if (Array.isArray(nilai)) return nilai[0] ?? "";
  return nilai ?? "";
}

function formJamKerja(row: JamKerjaRow) {
  return (
    <div className="modul-form-grid">
      <input name="id" type="hidden" value={row.id} />
      <FormField
        defaultValue={row.jamMasuk}
        label="Jam masuk"
        name="jamMasuk"
        required
        type="time"
      />
      <FormField
        defaultValue={row.jamKeluar}
        helpText="Jam keluar tidak boleh lebih kecil dari jam masuk."
        label="Jam keluar"
        name="jamKeluar"
        required
        type="time"
      />
      <FieldShell label="Status">
        <div className="form-check-inline" role="radiogroup" aria-label="Status hari">
          <label>
            <input defaultChecked={row.status} name="status" type="radio" value="1" /> Hari Kerja
          </label>
          <label>
            <input defaultChecked={!row.status} name="status" type="radio" value="0" /> Hari Libur
          </label>
        </div>
      </FieldShell>
      <FormField
        defaultValue={row.keterangan ?? ""}
        kind="textarea"
        label="Keterangan"
        maxLength={KETERANGAN_JAM_KERJA_MAKS}
        name="keterangan"
        placeholder="Keterangan (opsional)"
        rows={3}
      />
    </div>
  );
}

export default async function JamKerjaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, user] = await Promise.all([searchParams, verifySession()]);
  const rows = await getJamKerjaData();

  const bolehUbah = hasPermission(user.permissions, JAM_KERJA_RESOURCE, "update");
  const pesanStatus = PESAN_STATUS[nilaiTunggal(params.status)];

  return (
    <div className="modul-page data-kependudukan-page">
      <PageHeading judul={<>Jam Kerja</>} deskripsi={<>Jadwal jam kerja perangkat desa.</>} />

      {pesanStatus ? (
        <p className="alert alert-info" role="status">
          {pesanStatus}
        </p>
      ) : null}

      <TableCard
        title="Daftar Jam Kerja"
        description={
          rows.length === 0
            ? "Belum ada jam kerja yang tercatat."
            : `${rows.length} hari dalam seminggu.`
        }
      >
        {rows.length === 0 ? (
          <div className="modul-empty">
            <strong>Belum ada jam kerja.</strong>
            <p>Jadwal bawaan akan dibuat otomatis saat halaman ini pertama kali dibuka.</p>
          </div>
        ) : (
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  <HeaderCell scope="col">No.</HeaderCell>
                  <HeaderCell scope="col">Hari</HeaderCell>
                  <HeaderCell scope="col">Jam Masuk</HeaderCell>
                  <HeaderCell scope="col">Jam Keluar</HeaderCell>
                  <HeaderCell scope="col">Keterangan</HeaderCell>
                  <HeaderCell scope="col">Status</HeaderCell>
                  {bolehUbah ? <HeaderCell scope="col">Aksi</HeaderCell> : null}
                </Row>
              </THead>
              <TBody>
                {rows.map((row, index) => (
                  <Row key={row.id}>
                    <Cell>{index + 1}</Cell>
                    <Cell>{row.namaHari}</Cell>
                    <Cell>{row.jamMasuk}</Cell>
                    <Cell>{row.jamKeluar}</Cell>
                    <Cell>{row.keterangan ?? "-"}</Cell>
                    <Cell>{row.status ? "Hari Kerja" : "Hari Libur"}</Cell>
                    {bolehUbah ? (
                      <Cell>
                        <div className="table-actions">
                          <FormDialog
                            aksi={simpanJamKerjaFormAction}
                            deskripsi={`Ubah jam kerja hari ${row.namaHari}.`}
                            judul="Ubah jam kerja"
                            label="Ubah"
                            labelSimpan="Simpan perubahan"
                            varian="secondary"
                          >
                            {formJamKerja(row)}
                          </FormDialog>
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
