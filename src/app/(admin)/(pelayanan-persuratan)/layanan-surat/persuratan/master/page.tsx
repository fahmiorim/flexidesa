import type { Metadata } from "next";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { getMasterReferensiSuratData } from "@/features/pelayanan-persuratan/surat/application/jenis-surat-use-cases";
import {
  KLASIFIKASI_KODE_MAKS,
  KLASIFIKASI_URAIAN_MAKS,
} from "@/features/pelayanan-persuratan/surat/domain/surat";

import {
  hapusKlasifikasiSuratAction,
  hapusSyaratSuratAction,
  simpanKlasifikasiSuratAction,
  simpanSyaratSuratAction,
} from "../jenis-surat/actions";

export const metadata: Metadata = { title: "Master Referensi Surat" };
type SearchParams = Promise<{ berhasil?: string }>;

export default async function MasterReferensiSuratPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [
    {
      klasifikasi,
      syarat,
      canCreateKlasifikasi,
      canUpdateKlasifikasi,
      canDeleteKlasifikasi,
      canCreateSyarat,
      canUpdateSyarat,
      canDeleteSyarat,
    },
    params,
  ] = await Promise.all([getMasterReferensiSuratData(), searchParams]);
  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Master Referensi Surat</>}
        deskripsi={<>Kelola klasifikasi dan persyaratan surat.</>}
      />
      {params.berhasil ? (
        <div className="alert alert-info" role="status">
          Perubahan master referensi berhasil diproses.
        </div>
      ) : null}
      <TableCard
        title="Klasifikasi Surat"
        description={`${klasifikasi.length} klasifikasi terdaftar.`}
        filter={
          canCreateKlasifikasi ? (
            <form
              action={simpanKlasifikasiSuratAction}
              className="modul-form-grid"
              style={{ alignItems: "end" }}
            >
              <FormField
                label="Kode klasifikasi"
                name="code"
                required
                maxLength={KLASIFIKASI_KODE_MAKS}
                placeholder="400"
              />
              <FormField
                label="Nama klasifikasi"
                name="name"
                required
                maxLength={150}
                placeholder="Pemerintahan"
              />
              <FormField
                label="Keterangan"
                name="description"
                maxLength={KLASIFIKASI_URAIAN_MAKS}
                placeholder="Uraian singkat"
              />
              <label className="modul-inline-check">
                <input type="checkbox" name="isActive" defaultChecked /> Aktif
              </label>
              <Button variant="primary" type="submit">
                ＋ Tambah klasifikasi
              </Button>
            </form>
          ) : null
        }
        footer={
          <p className="modul-muted">
            Klasifikasi yang masih dipakai jenis surat tidak bisa dihapus.
          </p>
        }
      >
        {klasifikasi.length === 0 ? (
          <p className="modul-muted">Belum ada klasifikasi.</p>
        ) : (
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  <HeaderCell>Kode</HeaderCell>
                  <HeaderCell>Nama</HeaderCell>
                  <HeaderCell>Perbarui</HeaderCell>
                  <HeaderCell>Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {klasifikasi.map((item) => (
                  <Row key={item.id}>
                    <Cell className="modul-mono">{item.code}</Cell>
                    <Cell>{item.name}</Cell>
                    <Cell>
                      {canUpdateKlasifikasi ? (
                        <form
                          action={simpanKlasifikasiSuratAction}
                          style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                        >
                          <input type="hidden" name="id" value={item.id} />
                          <input
                            name="code"
                            aria-label="Kode klasifikasi"
                            required
                            maxLength={KLASIFIKASI_KODE_MAKS}
                            defaultValue={item.code}
                          />
                          <input
                            name="name"
                            aria-label="Nama klasifikasi"
                            required
                            maxLength={150}
                            defaultValue={item.name}
                          />
                          <input
                            name="description"
                            aria-label="Keterangan klasifikasi"
                            maxLength={KLASIFIKASI_URAIAN_MAKS}
                            defaultValue={item.description ?? ""}
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
                      {canDeleteKlasifikasi ? (
                        <DialogHapusForm
                          aksi={hapusKlasifikasiSuratAction}
                          id={item.id}
                          judul={`Hapus klasifikasi "${item.name}"?`}
                          keterangan="Klasifikasi hanya dapat dihapus bila tidak dipakai surat lain."
                          labelAksi="Hapus klasifikasi"
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
      <TableCard
        title="Persyaratan Dokumen"
        description={`${syarat.length} persyaratan terdaftar.`}
        filter={
          canCreateSyarat ? (
            <form
              action={simpanSyaratSuratAction}
              className="modul-form-grid"
              style={{ alignItems: "end" }}
            >
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
                ＋ Tambah persyaratan
              </Button>
            </form>
          ) : null
        }
      >
        {syarat.length === 0 ? (
          <p className="modul-muted">Belum ada persyaratan dokumen.</p>
        ) : (
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  <HeaderCell>Persyaratan</HeaderCell>
                  <HeaderCell>Keterangan</HeaderCell>
                  <HeaderCell>Urutan</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {syarat.map((item) => (
                  <Row key={item.id}>
                    <Cell>
                      <strong>{item.name}</strong>
                    </Cell>
                    <Cell>{item.description ?? "—"}</Cell>
                    <Cell>{item.sortOrder}</Cell>
                    <Cell>
                      <span className="beranda-chip" data-tone={item.isActive ? "hijau" : "netral"}>
                        {item.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </Cell>
                    <Cell>
                      <div style={{ display: "grid", gap: 8, minWidth: 240 }}>
                        {canUpdateSyarat ? (
                          <form
                            action={simpanSyaratSuratAction}
                            style={{ display: "grid", gap: 6 }}
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
                              aria-label="Keterangan persyaratan"
                              maxLength={255}
                              defaultValue={item.description ?? ""}
                            />
                            <input
                              name="sortOrder"
                              aria-label="Urutan persyaratan"
                              type="number"
                              min="0"
                              max="9999"
                              defaultValue={item.sortOrder}
                            />
                            <label className="modul-inline-check">
                              <input
                                type="checkbox"
                                name="isActive"
                                defaultChecked={item.isActive}
                              />{" "}
                              Aktif
                            </label>
                            <Button variant="secondary" type="submit">
                              Simpan
                            </Button>
                          </form>
                        ) : null}
                        {canDeleteSyarat ? (
                          <DialogHapusForm
                            aksi={hapusSyaratSuratAction}
                            id={item.id}
                            judul={`Hapus persyaratan "${item.name}"?`}
                            keterangan="Persyaratan akan dihapus permanen dari daftar syarat surat."
                            labelAksi="Hapus persyaratan"
                          />
                        ) : null}
                      </div>
                    </Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        )}
        <p className="modul-muted modul-card-note">
          Persyaratan yang sedang dipakai oleh jenis surat tidak dapat dihapus. Nonaktifkan jika
          tidak ingin digunakan lagi.
        </p>
      </TableCard>
    </div>
  );
}
