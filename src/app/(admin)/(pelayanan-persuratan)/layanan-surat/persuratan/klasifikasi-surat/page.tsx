import type { Metadata } from "next";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { FormField } from "@/components/ui/form-field";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { getKlasifikasiSuratPageData } from "@/features/pelayanan-persuratan/surat/application/jenis-surat-use-cases";
import {
  KLASIFIKASI_KODE_MAKS,
  KLASIFIKASI_URAIAN_MAKS,
} from "@/features/pelayanan-persuratan/surat/domain/surat";

import { hapusKlasifikasiSuratAction, simpanKlasifikasiSuratAction } from "./actions";

export const metadata: Metadata = { title: "Klasifikasi Surat" };

type SearchParams = Promise<{ q?: string; status?: string; berhasil?: string }>;

export default async function KlasifikasiSuratPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [{ klasifikasi, canCreate, canUpdate, canDelete }, params] = await Promise.all([
    getKlasifikasiSuratPageData(),
    searchParams,
  ]);

  const q = (params.q ?? "").trim().toLocaleLowerCase("id");
  const tersaring = klasifikasi.filter((item) => {
    const cocok =
      !q ||
      item.name.toLocaleLowerCase("id").includes(q) ||
      item.code.toLocaleLowerCase("id").includes(q) ||
      (item.description ?? "").toLocaleLowerCase("id").includes(q);
    const status =
      params.status === "aktif"
        ? item.isActive
        : params.status === "nonaktif"
          ? !item.isActive
          : true;
    return cocok && status;
  });
  const aktif = klasifikasi.filter((item) => item.isActive).length;

  return (
    <div className="modul-page">
      <PageHeading judul={<>Klasifikasi Surat</>} deskripsi={<>Kelola kode klasifikasi surat.</>} />

      {params.berhasil ? (
        <div className="alert alert-info" role="status">
          {params.berhasil === "dihapus"
            ? "Klasifikasi berhasil dihapus."
            : "Klasifikasi berhasil disimpan."}
        </div>
      ) : null}

      <StatGrid columns={2}>
        <StatCard
          label="Total klasifikasi"
          utama
          note="Seluruh kode surat"
          value={klasifikasi.length.toLocaleString("id-ID")}
        />
        <StatCard
          label="Aktif"
          note="Tersedia untuk surat"
          tone="hijau"
          value={aktif.toLocaleString("id-ID")}
        />
      </StatGrid>

      <TableCard
        title="Daftar klasifikasi"
        description="Kode harus unik per desa dan tidak dapat diubah menjadi kode milik klasifikasi lain."
        filter={
          <>
            <form method="get" className="modul-filter-row">
              <FormField
                label="Cari klasifikasi"
                name="q"
                type="search"
                defaultValue={params.q ?? ""}
                placeholder="Cari kode, nama, atau uraian"
              />
              <FormField
                label="Status"
                kind="select"
                name="status"
                defaultValue={params.status ?? ""}
                options={[
                  { value: "", label: "Semua status" },
                  { value: "aktif", label: "Aktif" },
                  { value: "nonaktif", label: "Nonaktif" },
                ]}
              />
              <Button variant="secondary" type="submit">
                Terapkan
              </Button>
            </form>

            {canCreate ? (
              <form action={simpanKlasifikasiSuratAction} className="modul-form-grid form-grid-end">
                <FormField
                  label="Kode"
                  name="code"
                  maxLength={KLASIFIKASI_KODE_MAKS}
                  placeholder="SK"
                  required
                />
                <FormField
                  label="Nama"
                  name="name"
                  maxLength={150}
                  placeholder="Surat Keterangan"
                  required
                />
                <FormField
                  label="Keterangan"
                  name="description"
                  maxLength={KLASIFIKASI_URAIAN_MAKS}
                  placeholder="Uraian singkat klasifikasi"
                />
                <label className="modul-inline-check">
                  <input defaultChecked name="isActive" type="checkbox" /> Aktif
                </label>
                <Button variant="primary" type="submit">
                  ＋ Tambah Klasifikasi
                </Button>
              </form>
            ) : null}
          </>
        }
        footer={
          <p className="modul-muted">
            Klasifikasi yang masih dipakai tidak bisa dihapus; nonaktifkan saja.
          </p>
        }
      >
        {tersaring.length === 0 ? (
          <p className="modul-muted table-card-empty">
            {klasifikasi.length === 0
              ? "Belum ada klasifikasi surat."
              : "Tidak ada klasifikasi yang cocok dengan filter."}
          </p>
        ) : (
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  <HeaderCell>Kode</HeaderCell>
                  <HeaderCell>Nama & keterangan</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Perbarui</HeaderCell>
                  <HeaderCell>Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {tersaring.map((item) => (
                  <Row key={item.id}>
                    <Cell className="modul-mono">{item.code}</Cell>
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
                          action={simpanKlasifikasiSuratAction}
                          style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                        >
                          <input name="id" type="hidden" value={item.id} />
                          <input
                            aria-label="Kode klasifikasi"
                            defaultValue={item.code}
                            maxLength={KLASIFIKASI_KODE_MAKS}
                            name="code"
                            required
                          />
                          <input
                            aria-label="Nama klasifikasi"
                            defaultValue={item.name}
                            maxLength={150}
                            name="name"
                            required
                          />
                          <input
                            aria-label="Keterangan klasifikasi"
                            defaultValue={item.description ?? ""}
                            maxLength={KLASIFIKASI_URAIAN_MAKS}
                            name="description"
                          />
                          <label className="modul-inline-check">
                            <input defaultChecked={item.isActive} name="isActive" type="checkbox" />{" "}
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
    </div>
  );
}
