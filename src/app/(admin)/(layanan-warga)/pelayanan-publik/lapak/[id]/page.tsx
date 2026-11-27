import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/shell/page-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { getDetailLapak } from "@/features/layanan-warga/lapak/application/use-cases";
import type { LapakProdukRow } from "@/features/layanan-warga/lapak/domain/lapak-produk";

import { hapusProdukLapakAction } from "../actions";
import { simpanProdukLapakFormAction } from "../form-actions";

export const metadata: Metadata = { title: "Produk Lapak" };

function isiProduk(row: LapakProdukRow | null, lapakId: number) {
  return (
    <div className="modul-form-grid">
      <input name="lapakId" type="hidden" value={lapakId} />
      {row ? <input name="produkId" type="hidden" value={row.id} /> : null}
      <FormField
        containerClassName="form-field-full"
        defaultValue={row?.nama ?? ""}
        label="Nama produk"
        maxLength={200}
        name="nama"
        placeholder="Contoh: Keripik Pisang"
        required
      />
      <FormField
        defaultValue={row?.harga ?? ""}
        helpText="Kosongkan bila harga belum ditentukan (disimpan sebagai 0)."
        inputMode="decimal"
        label="Harga (Rp)"
        name="harga"
        placeholder="25000"
      />
      <FormField
        defaultValue={row?.stok === null || row?.stok === undefined ? "" : String(row.stok)}
        inputMode="numeric"
        label="Stok"
        min={0}
        name="stok"
        type="number"
      />
      <FormField
        containerClassName="form-field-full"
        defaultValue={row?.deskripsi ?? ""}
        kind="textarea"
        label="Deskripsi"
        name="deskripsi"
        rows={3}
      />
      <FormField
        containerClassName="form-field-full"
        defaultValue={row?.gambar ?? ""}
        helpText="Path berkas gambar di media desa (opsional)."
        label="Gambar"
        maxLength={500}
        name="gambar"
        placeholder="Folder/gambar-produk.jpg"
      />
      <FormField defaultValue={row?.latitude ?? ""} label="Latitude" name="latitude" />
      <FormField defaultValue={row?.longitude ?? ""} label="Longitude" name="longitude" />
      <div className="modul-form-checks form-field-full">
        <label>
          <input defaultChecked={row ? row.aktif === 1 : true} name="aktif" type="checkbox" />{" "}
          Tampilkan produk di website
        </label>
      </div>
    </div>
  );
}

function rupiah(harga: string) {
  const angka = Number(harga);
  return Number.isFinite(angka)
    ? angka.toLocaleString("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      })
    : harga;
}

export default async function LapakProdukPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lapakId = Number(id);
  if (!Number.isSafeInteger(lapakId) || lapakId < 1) notFound();

  const { lapak, produk, akses } = await getDetailLapak(lapakId);
  const produkAktif = produk.filter((row) => row.aktif === 1).length;

  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Produk {lapak.nama}</>}
        deskripsi={
          <>
            Pemilik {lapak.pemilik ?? "—"} · Kategori {lapak.kategori ?? "—"} ·{" "}
            {produkAktif.toLocaleString("id-ID")} dari {produk.length.toLocaleString("id-ID")}{" "}
            produk tampil di website.
          </>
        }
        aksi={
          <ButtonLink variant="secondary" href="/pelayanan-publik/lapak">
            Kembali ke daftar lapak
          </ButtonLink>
        }
      />
      <TableCard
        actions={
          akses.bolehTambah ? (
            <FormDialog
              aksi={simpanProdukLapakFormAction}
              deskripsi={`Tambah produk yang dijual di lapak ${lapak.nama}.`}
              judul="Tambah produk"
              label="Tambah Produk"
              labelSimpan="Simpan produk"
            >
              {isiProduk(null, lapakId)}
            </FormDialog>
          ) : null
        }
        description={lapak.alamat ?? "Alamat lapak belum diisi."}
        title="Daftar Produk"
      >
        {produk.length ? (
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  <HeaderCell>Produk</HeaderCell>
                  <HeaderCell>Harga</HeaderCell>
                  <HeaderCell>Stok</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {produk.map((row) => (
                  <Row key={row.id}>
                    <Cell>
                      <strong>{row.nama}</strong>
                      {row.deskripsi ? (
                        <>
                          <br />
                          <small>{row.deskripsi}</small>
                        </>
                      ) : null}
                    </Cell>
                    <Cell>{rupiah(row.harga)}</Cell>
                    <Cell>{row.stok ?? 0}</Cell>
                    <Cell>{row.aktif === 1 ? "Tampil" : "Disembunyikan"}</Cell>
                    <Cell>
                      {akses.bolehUbah || akses.bolehHapus ? (
                        <div className="table-actions">
                          {akses.bolehUbah ? (
                            <FormDialog
                              aksi={simpanProdukLapakFormAction}
                              deskripsi={`Ubah data produk ${row.nama}.`}
                              judul="Ubah produk"
                              label="Ubah"
                              labelSimpan="Simpan perubahan"
                              varian="secondary"
                            >
                              {isiProduk(row, lapakId)}
                            </FormDialog>
                          ) : null}
                          {akses.bolehHapus ? (
                            <DialogHapusForm
                              aksi={hapusProdukLapakAction}
                              hidden={{ lapakId, produkId: row.id }}
                              judul={`Hapus produk "${row.nama}"?`}
                              keterangan="Produk akan dihapus permanen dari lapak ini."
                              labelAksi="Hapus produk"
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
            Belum ada produk pada lapak ini. Tambahkan produk pertama lewat tombol Tambah Produk.
          </p>
        )}
      </TableCard>
    </div>
  );
}
