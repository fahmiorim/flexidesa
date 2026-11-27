import type { Metadata } from "next";

import { PageHeading } from "@/components/shell/page-heading";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { daftarSaranaPrasarana } from "@/features/program-data-desa/potensi-sarana/application/kontrak";
import { aksesSaranaAdmin } from "@/features/program-data-desa/potensi-sarana/application/use-cases";
import { requirePermission } from "@/lib/dal";

import { hapusSarana } from "./actions";
import { simpanSaranaFormAction } from "./form-actions";

export const metadata: Metadata = { title: "Sarana & Prasarana" };

const categories = [
  ["pendidikan", "Pendidikan"],
  ["kesehatan", "Kesehatan"],
  ["ibadah", "Ibadah"],
  ["utilitas", "Utilitas"],
  ["transportasi", "Transportasi"],
  ["olahraga", "Olahraga"],
  ["sosial", "Sosial"],
  ["lainnya", "Lainnya"],
] as const;

type SaranaRow = Awaited<ReturnType<typeof daftarSaranaPrasarana>>[number];

function formSarana(row: SaranaRow | null) {
  return (
    <div className="modul-form-grid">
      {row ? <input name="id" type="hidden" value={row.id} /> : null}
      <FormField
        defaultValue={row?.kategori ?? "lainnya"}
        kind="select"
        label="Kategori"
        name="kategori"
        options={categories.map(([value, label]) => ({ value, label }))}
        required
      />
      <FormField
        defaultValue={row?.nama ?? ""}
        label="Nama sarana/prasarana"
        maxLength={200}
        name="nama"
        placeholder="Contoh: Balai Desa"
        required
      />
      <FormField
        defaultValue={row?.lokasi ?? ""}
        label="Lokasi"
        maxLength={200}
        name="lokasi"
        placeholder="Contoh: Dusun Krajan"
      />
      <FormField
        defaultValue={row?.keterangan ?? ""}
        kind="textarea"
        label="Keterangan"
        maxLength={5000}
        name="keterangan"
        rows={3}
      />
      <div className="modul-form-checks form-field-full">
        <label>
          <input defaultChecked={row?.aktif ?? false} name="aktif" type="checkbox" /> Publikasikan
          di website
        </label>
      </div>
    </div>
  );
}

export default async function SaranaPrasaranaAdminPage() {
  const user = await requirePermission(RESOURCES.saranaPrasarana, "read");
  const villageId = await resolveVillageId(user);
  const [rows, akses] = await Promise.all([
    daftarSaranaPrasarana(villageId, true),
    aksesSaranaAdmin(),
  ]);

  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Sarana &amp; Prasarana</>}
        deskripsi={<>Kelola fasilitas umum desa untuk halaman profil publik.</>}
      />
      <TableCard
        title={`Daftar sarana/prasarana (${rows.length})`}
        description="Fasilitas umum desa yang tampil di halaman profil publik."
        actions={
          akses.bolehTambah ? (
            <FormDialog
              aksi={simpanSaranaFormAction}
              deskripsi="Lengkapi data sarana/prasarana lalu simpan untuk menambahkannya ke daftar."
              judul="Tambah sarana/prasarana"
              label="Tambah sarana/prasarana"
              labelSimpan="Simpan sarana/prasarana"
            >
              {formSarana(null)}
            </FormDialog>
          ) : null
        }
      >
        {rows.length ? (
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  <HeaderCell>Sarana/Prasarana</HeaderCell>
                  <HeaderCell>Kategori</HeaderCell>
                  <HeaderCell>Lokasi</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {rows.map((row) => (
                  <Row key={row.id}>
                    <Cell>
                      <strong>{row.nama}</strong>
                      <br />
                      <small>{row.keterangan ?? ""}</small>
                    </Cell>
                    <Cell>
                      {categories.find(([id]) => id === row.kategori)?.[1] ?? row.kategori}
                    </Cell>
                    <Cell>{row.lokasi ?? "—"}</Cell>
                    <Cell>{row.aktif ? "Dipublikasikan" : "Draft"}</Cell>
                    <Cell>
                      {akses.bolehUbah || akses.bolehHapus ? (
                        <div className="table-actions">
                          {akses.bolehUbah ? (
                            <FormDialog
                              aksi={simpanSaranaFormAction}
                              deskripsi={`Ubah data sarana/prasarana ${row.nama}.`}
                              judul="Ubah sarana/prasarana"
                              label="Ubah"
                              labelSimpan="Simpan perubahan"
                              varian="secondary"
                            >
                              {formSarana(row)}
                            </FormDialog>
                          ) : null}
                          {akses.bolehHapus ? (
                            <DialogHapusForm
                              aksi={hapusSarana}
                              id={row.id}
                              judul={`Hapus sarana "${row.nama}"?`}
                              keterangan="Data sarana/prasarana akan dihapus permanen dari website desa."
                              labelAksi="Hapus sarana"
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
            Belum ada data sarana/prasarana. Tambahkan lewat tombol Tambah sarana/prasarana.
          </p>
        )}
      </TableCard>
    </div>
  );
}
