import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { getSyaratSuratPageData } from "@/features/surat/application/jenis-surat-use-cases";

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
      <PageHeading>
        <div className="page-heading">
          <div>
            <h1>Daftar Persyaratan Surat</h1>
            <p>Kelola persyaratan pengajuan surat.</p>
          </div>
          <div className="page-heading-actions">
            <Link href="/persuratan/jenis-surat" className="button button-secondary">
              Kembali ke Pengaturan Surat
            </Link>
          </div>
        </div>
      </PageHeading>

      {params.berhasil ? (
        <div className="alert alert-info" role="status">
          {params.berhasil === "dihapus"
            ? "Persyaratan berhasil dihapus."
            : "Persyaratan berhasil disimpan."}
        </div>
      ) : null}

      <section className="modul-card">
        <div className="beranda-card-head">
          <div>
            <h2 className="beranda-card-title">Persyaratan dokumen</h2>
            <p className="modul-muted">
              {syarat.length} persyaratan terdaftar · {aktif} aktif
            </p>
          </div>
        </div>

        {canCreate ? (
          <form
            action={simpanSyaratSuratAction}
            className="modul-form-grid"
            style={{ alignItems: "end", marginBottom: 20 }}
          >
            <label>
              Nama persyaratan
              <input name="name" required maxLength={150} placeholder="Fotokopi Kartu Keluarga" />
            </label>
            <label>
              Keterangan
              <input
                name="description"
                maxLength={255}
                placeholder="Unggah dokumen yang masih berlaku"
              />
            </label>
            <label>
              Urutan
              <input name="sortOrder" type="number" min={0} max={9999} defaultValue={0} />
            </label>
            <label className="modul-inline-check">
              <input type="checkbox" name="isActive" defaultChecked /> Aktif
            </label>
            <button className="button button-primary" type="submit">
              ＋ Tambah Persyaratan
            </button>
          </form>
        ) : null}

        {syarat.length === 0 ? (
          <p className="modul-muted">Belum ada persyaratan dokumen.</p>
        ) : (
          <div className="modul-scroll">
            <table className="modul-table">
              <thead>
                <tr>
                  <th>Urutan</th>
                  <th>Persyaratan</th>
                  <th>Status</th>
                  <th>Perbarui</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {syarat.map((item) => (
                  <tr key={item.id}>
                    <td className="modul-mono">{item.sortOrder}</td>
                    <td>
                      <strong>{item.name}</strong>
                      {item.description ? (
                        <p className="modul-muted" style={{ margin: 0 }}>
                          {item.description}
                        </p>
                      ) : null}
                    </td>
                    <td>
                      <span className="beranda-chip" data-tone={item.isActive ? "hijau" : "netral"}>
                        {item.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td>
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
                          <button className="button button-secondary" type="submit">
                            Simpan
                          </button>
                        </form>
                      ) : (
                        <span className="modul-muted">—</span>
                      )}
                    </td>
                    <td>
                      {canDelete ? (
                        <form action={hapusSyaratSuratAction}>
                          <input type="hidden" name="id" value={item.id} />
                          <button className="button button-danger-ghost" type="submit">
                            Hapus
                          </button>
                        </form>
                      ) : (
                        <span className="modul-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="modul-muted">
          Persyaratan yang masih dipakai jenis surat tidak dapat dihapus. Lepaskan dari jenis surat
          terlebih dahulu.
        </p>
      </section>
    </div>
  );
}
