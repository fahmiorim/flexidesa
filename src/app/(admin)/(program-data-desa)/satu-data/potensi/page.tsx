import type { Metadata } from "next";

import { PageHeading } from "@/components/shell/page-heading";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { daftarPotensiDesa } from "@/features/program-data-desa/potensi-sarana/application/kontrak";
import { aksesPotensiAdmin } from "@/features/program-data-desa/potensi-sarana/application/use-cases";
import { requirePermission } from "@/lib/dal";

import { hapusPotensi } from "./actions";
import { simpanPotensiFormAction } from "./form-actions";

export const metadata: Metadata = { title: "Potensi Desa" };

const categories = [
  ["pertanian", "Pertanian"],
  ["perkebunan", "Perkebunan"],
  ["peternakan", "Peternakan"],
  ["perikanan", "Perikanan"],
  ["umkm", "UMKM"],
  ["wisata", "Wisata Desa"],
] as const;

type PotensiRow = Awaited<ReturnType<typeof daftarPotensiDesa>>[number];

function formPotensi(row: PotensiRow | null) {
  return (
    <div className="modul-form-grid">
      {row ? <input name="id" type="hidden" value={row.id} /> : null}
      <FormField
        defaultValue={row?.kategori ?? "pertanian"}
        kind="select"
        label="Kategori"
        name="kategori"
        options={categories.map(([value, label]) => ({ value, label }))}
        required
      />
      <FormField
        defaultValue={row?.judul ?? ""}
        label="Nama potensi"
        maxLength={160}
        name="judul"
        placeholder="Contoh: Pertanian Padi"
        required
      />
      <FormField
        defaultValue={row?.slug ?? ""}
        helpText="Kosongkan untuk dibuat otomatis dari nama potensi."
        label="Slug"
        maxLength={170}
        name="slug"
      />
      <FormField
        defaultValue={row?.ringkasan ?? ""}
        kind="textarea"
        label="Ringkasan"
        maxLength={500}
        name="ringkasan"
        rows={2}
      />
      <FormField
        containerClassName="form-field-full"
        defaultValue={row?.deskripsi ?? ""}
        kind="textarea"
        label="Deskripsi"
        maxLength={10000}
        name="deskripsi"
        rows={4}
      />
      <FormField
        defaultValue={row?.gambar ?? ""}
        label="Path gambar media"
        maxLength={255}
        name="gambar"
        placeholder="Folder/file-gambar.jpg"
      />
      <FormField defaultValue={row?.lokasi ?? ""} label="Lokasi" maxLength={200} name="lokasi" />
      <FormField
        defaultValue={row?.kontak ?? ""}
        label="Kontak pengelola"
        maxLength={150}
        name="kontak"
      />
      <FormField
        containerClassName="form-field-full"
        defaultValue={(row?.indikator ?? []).map((m) => `${m.label} | ${m.nilai}`).join("\n")}
        helpText="Satu indikator per baris, format: Label | Nilai."
        kind="textarea"
        label="Indikator"
        name="indikator"
        placeholder={"Luas lahan | 250 Ha\nProduktivitas | 6,5 Ton/Ha"}
        rows={3}
      />
      <div className="modul-form-checks form-field-full">
        <label>
          <input defaultChecked={row?.unggulan ?? false} name="unggulan" type="checkbox" />{" "}
          Tampilkan sebagai potensi unggulan
        </label>
        <label>
          <input defaultChecked={row?.aktif ?? false} name="aktif" type="checkbox" /> Publikasikan
          di website
        </label>
      </div>
    </div>
  );
}

export default async function PotensiAdminPage() {
  const user = await requirePermission(RESOURCES.potensi, "read");
  const villageId = await resolveVillageId(user);
  const [rows, akses] = await Promise.all([
    daftarPotensiDesa(villageId, true),
    aksesPotensiAdmin(),
  ]);

  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Potensi Desa</>}
        deskripsi={<>Kelola potensi unggulan desa untuk website.</>}
      />
      <TableCard
        title={`Daftar potensi (${rows.length})`}
        description="Potensi unggulan dan data pendukung yang tampil di halaman profil desa."
        actions={
          akses.bolehTambah ? (
            <FormDialog
              aksi={simpanPotensiFormAction}
              deskripsi="Lengkapi data potensi lalu simpan untuk menambahkannya ke daftar."
              judul="Tambah potensi"
              label="Tambah potensi"
              labelSimpan="Simpan potensi"
            >
              {formPotensi(null)}
            </FormDialog>
          ) : null
        }
      >
        {rows.length ? (
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  <HeaderCell>Potensi</HeaderCell>
                  <HeaderCell>Kategori</HeaderCell>
                  <HeaderCell>Indikator</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {rows.map((row) => (
                  <Row key={row.id}>
                    <Cell>
                      <strong>{row.judul}</strong>
                      <br />
                      <small>{row.slug}</small>
                    </Cell>
                    <Cell>
                      {categories.find(([id]) => id === row.kategori)?.[1] ?? row.kategori}
                    </Cell>
                    <Cell>
                      {row.indikator.map((m) => m.label + ": " + m.nilai).join(" · ") || "—"}
                    </Cell>
                    <Cell>
                      {row.aktif ? "Dipublikasikan" : "Draft"}
                      {row.unggulan ? " · Unggulan" : ""}
                    </Cell>
                    <Cell>
                      {akses.bolehUbah || akses.bolehHapus ? (
                        <div className="table-actions">
                          {akses.bolehUbah ? (
                            <FormDialog
                              aksi={simpanPotensiFormAction}
                              deskripsi={`Ubah data potensi ${row.judul}.`}
                              judul="Ubah potensi"
                              label="Ubah"
                              labelSimpan="Simpan perubahan"
                              varian="secondary"
                            >
                              {formPotensi(row)}
                            </FormDialog>
                          ) : null}
                          {akses.bolehHapus ? (
                            <DialogHapusForm
                              aksi={hapusPotensi}
                              id={row.id}
                              judul={`Hapus potensi "${row.judul}"?`}
                              keterangan="Data potensi, indikator, dan gambarnya akan dihapus permanen dari website desa."
                              labelAksi="Hapus potensi"
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
            Belum ada data potensi. Tambahkan potensi pertama lewat tombol Tambah potensi.
          </p>
        )}
      </TableCard>
    </div>
  );
}
