import type { Metadata } from "next";

import { PageHeading } from "@/components/shell/page-heading";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { getDataPertanahan } from "@/features/pertanahan-gis/gis/application/use-cases";
import type { PersilDTO } from "@/features/pertanahan-gis/gis/domain/gis";

import { hapusPersilAction } from "./actions";
import { simpanPersilFormAction } from "./form-actions";

export const metadata: Metadata = { title: "Data Pertanahan" };

function isiPersil(row: PersilDTO | null) {
  return (
    <div className="modul-form-grid">
      {row ? <input name="id" type="hidden" value={row.id} /> : null}
      <FormField
        defaultValue={row?.nomor ?? ""}
        label="Nomor persil"
        maxLength={50}
        name="nomor"
        placeholder="Contoh: 001/2026"
        required
      />
      <FormField
        defaultValue={row?.nomorCdesa ?? ""}
        helpText="Nomor C-Desa bila persil sudah terdaftar."
        label="Nomor C-Desa"
        name="nomorCdesa"
      />
      <FormField
        defaultValue={row ? String(row.luas) : "0"}
        label="Luas (m²)"
        min={0}
        name="luas"
        step="0.01"
        type="number"
      />
      <FormField
        defaultValue={row?.status ?? ""}
        label="Status tanah"
        maxLength={30}
        name="status"
        placeholder="Contoh: Milik / Tanah Negara"
      />
      <FormField
        defaultValue={row?.keterangan ?? ""}
        containerClassName="form-field-full"
        kind="textarea"
        label="Keterangan"
        name="keterangan"
        rows={2}
      />
      <FormField
        defaultValue={row?.path ?? ""}
        containerClassName="form-field-full"
        helpText="Isi bila persil sudah digambar di peta; formatnya sama dengan area peta."
        kind="textarea"
        label="Geometri persil"
        name="path"
        rows={3}
      />
    </div>
  );
}

function formatLuas(luas: number) {
  return `${luas.toLocaleString("id-ID", { maximumFractionDigits: 2 })} m²`;
}

export default async function DataPertanahanPage() {
  const { rows, akses } = await getDataPertanahan();
  const totalLuas = rows.reduce((jumlah, row) => jumlah + row.luas, 0);

  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Data Pertanahan</>}
        deskripsi={<>Daftar persil dan data pertanahan desa.</>}
      />
      <TableCard
        actions={
          akses.bolehTambah ? (
            <FormDialog
              aksi={simpanPersilFormAction}
              deskripsi="Catat persil baru beserta luas, status tanah, dan geometrinya."
              judul="Tambah persil"
              label="Tambah Persil"
              labelSimpan="Simpan persil"
            >
              {isiPersil(null)}
            </FormDialog>
          ) : null
        }
        description={`${rows.length.toLocaleString("id-ID")} persil terdaftar · total ${formatLuas(totalLuas)}.`}
        title="Daftar Persil"
      >
        {rows.length ? (
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  <HeaderCell>Nomor Persil</HeaderCell>
                  <HeaderCell>No. C-Desa</HeaderCell>
                  <HeaderCell>Luas</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Keterangan</HeaderCell>
                  <HeaderCell>Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {rows.map((row) => (
                  <Row key={row.id}>
                    <Cell>
                      <strong>{row.nomor}</strong>
                    </Cell>
                    <Cell>{row.nomorCdesa ?? "—"}</Cell>
                    <Cell>{formatLuas(row.luas)}</Cell>
                    <Cell>{row.status ?? "—"}</Cell>
                    <Cell>{row.keterangan ?? "—"}</Cell>
                    <Cell>
                      {akses.bolehUbah || akses.bolehHapus ? (
                        <div className="table-actions">
                          {akses.bolehUbah ? (
                            <FormDialog
                              aksi={simpanPersilFormAction}
                              deskripsi={`Ubah data persil ${row.nomor}.`}
                              judul="Ubah persil"
                              label="Ubah"
                              labelSimpan="Simpan perubahan"
                              varian="secondary"
                            >
                              {isiPersil(row)}
                            </FormDialog>
                          ) : null}
                          {akses.bolehHapus ? (
                            <DialogHapusForm
                              aksi={hapusPersilAction}
                              id={row.id}
                              judul={`Hapus persil "${row.nomor}"?`}
                              keterangan="Data persil beserta geometrinya akan dihapus permanen."
                              labelAksi="Hapus persil"
                            />
                          ) : null}
                        </div>
                      ) : (
                        "—"
                      )}
                    </Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        ) : (
          <p className="modul-empty">
            Belum ada data persil. Tambahkan persil pertama lewat tombol Tambah Persil.
          </p>
        )}
      </TableCard>
    </div>
  );
}
