import type { Metadata } from "next";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { getSyaratSuratPageData } from "@/features/pelayanan-persuratan/surat/application/jenis-surat-use-cases";

import { hapusSyaratSuratAction, simpanSyaratSuratAction } from "./actions";

export const metadata: Metadata = { title: "Daftar Persyaratan Surat" };

type SearchParams = Promise<{ berhasil?: string }>;

export default async function SyaratSuratPage({ searchParams }: { searchParams: SearchParams }) {
  const [{ syarat, canCreate, canUpdate, canDelete }, params] = await Promise.all([
    getSyaratSuratPageData(),
    searchParams,
  ]);
  const aktif = syarat.filter((item) => item.isActive).length;

  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Daftar Persyaratan Surat</>}
        deskripsi={<>Kelola persyaratan pengajuan surat.</>}
      />

      {params.berhasil ? (
        <div className="alert alert-info" role="status">
          {params.berhasil === "dihapus"
            ? "Persyaratan berhasil dihapus."
            : "Persyaratan berhasil disimpan."}
        </div>
      ) : null}

      <TableCard
        title="Persyaratan dokumen"
        description={`${syarat.length} persyaratan terdaftar · ${aktif} aktif`}
        filter={
          canCreate ? (
            <form action={simpanSyaratSuratAction} className="modul-form-grid form-grid-end">
              <FormField
                label="Nama persyaratan"
                name="name"
                required
                maxLength={150}
                placeholder="Fotokopi Kartu Keluarga"
              />
              <FormField
                label="Keterangan"
                name="description"
                maxLength={255}
                placeholder="Unggah dokumen yang masih berlaku"
              />
              <FormField
                label="Urutan"
                name="sortOrder"
                type="number"
                min={0}
                max={9999}
                defaultValue={0}
              />
              <label className="modul-inline-check">
                <input type="checkbox" name="isActive" defaultChecked /> Aktif
              </label>
              <Button variant="primary" type="submit">
                ＋ Tambah Persyaratan
              </Button>
            </form>
          ) : null
        }
        footer={
          <p className="modul-muted">
            Persyaratan yang masih dipakai jenis surat tidak dapat dihapus. Lepaskan dari jenis
            surat terlebih dahulu.
          </p>
        }
      >
        {syarat.length === 0 ? (
          <p className="modul-muted table-card-empty">Belum ada persyaratan dokumen.</p>
        ) : (
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  <HeaderCell>Urutan</HeaderCell>
                  <HeaderCell>Persyaratan</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Perbarui</HeaderCell>
                  <HeaderCell>Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {syarat.map((item) => (
                  <Row key={item.id}>
                    <Cell className="modul-mono">{item.sortOrder}</Cell>
                    <Cell>
                      <strong>{item.name}</strong>
                      {item.description ? (
                        <p className="modul-muted" style={{ margin: 0 }}>
                          {item.description}
                        </p>
                      ) : null}
                    </Cell>
                    <Cell>
                      <span className="beranda-chip" data-tone={item.isActive ? "hijau" : "netral"}>
                        {item.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </Cell>
                    <Cell>
                      {canUpdate ? (
                        <form
                          action={simpanSyaratSuratAction}
                          style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                        >
                          <input type="hidden" name="id" value={item.id} />
                          <input
                            name="name"
                            aria-label="Nama persyaratan"
                            required
                            maxLength={150}
                            defaultValue={item.name}
                          />
                          <input
                            name="description"
                            aria-label="Keterangan"
                            maxLength={255}
                            defaultValue={item.description ?? ""}
                          />
                          <input
                            name="sortOrder"
                            aria-label="Urutan"
                            type="number"
                            min={0}
                            max={9999}
                            defaultValue={item.sortOrder}
                          />
                          <label className="modul-inline-check">
                            <input type="checkbox" name="isActive" defaultChecked={item.isActive} />{" "}
                            Aktif
                          </label>
                          <Button variant="secondary" type="submit">
                            Simpan
                          </Button>
                        </form>
                      ) : (
                        <span className="modul-muted">—</span>
                      )}
                    </Cell>
                    <Cell>
                      {canDelete ? (
                        <DialogHapusForm
                          aksi={hapusSyaratSuratAction}
                          id={item.id}
                          judul={`Hapus persyaratan "${item.name}"?`}
                          keterangan="Persyaratan akan dihapus permanen dari daftar syarat surat."
                          labelAksi="Hapus persyaratan"
                        />
                      ) : (
                        <span className="modul-muted">—</span>
                      )}
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
