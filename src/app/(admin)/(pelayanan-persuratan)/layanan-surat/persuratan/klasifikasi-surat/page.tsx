import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
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
      <PageHeading
        judul={<>Klasifikasi Surat</>}
        deskripsi={<>Kelola kode klasifikasi surat.</>}
        aksi={
          <>
            <div className="page-heading-actions">
              <Link
                href="/layanan-surat/persuratan/jenis-surat"
                className="button button-secondary"
              >
                Kembali ke Pengaturan Surat
              </Link>
            </div>
          </>
        }
      />

      {params.berhasil ? (
        <div className="alert alert-info" role="status">
          {params.berhasil === "dihapus"
            ? "Klasifikasi berhasil dihapus."
            : "Klasifikasi berhasil disimpan."}
        </div>
      ) : null}

      <div
        className="beranda-kpi-grid"
        style={{ gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))" }}
      >
        <article className="beranda-card beranda-kpi" data-tone="biru">
          <span className="beranda-kpi-label">Total klasifikasi</span>
          <strong className="beranda-kpi-value">
            {klasifikasi.length.toLocaleString("id-ID")}
          </strong>
        </article>
        <article className="beranda-card beranda-kpi" data-tone="hijau">
          <span className="beranda-kpi-label">Aktif</span>
          <strong className="beranda-kpi-value">{aktif.toLocaleString("id-ID")}</strong>
        </article>
      </div>

      <section className="modul-card">
        <div className="beranda-card-head">
          <div>
            <h2 className="beranda-card-title">Daftar klasifikasi</h2>
            <p className="modul-muted">
              Kode harus unik per desa dan tidak dapat diubah menjadi kode milik klasifikasi lain.
            </p>
          </div>
          <form method="get" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              aria-label="Cari klasifikasi"
              defaultValue={params.q ?? ""}
              name="q"
              placeholder="Cari kode, nama, atau uraian"
            />
            <select aria-label="Filter status" defaultValue={params.status ?? ""} name="status">
              <option value="">Semua status</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
            <button className="button button-secondary" type="submit">
              Terapkan
            </button>
          </form>
        </div>

        {canCreate ? (
          <form
            action={simpanKlasifikasiSuratAction}
            className="modul-form-grid"
            style={{ alignItems: "end", marginBottom: 20 }}
          >
            <label>
              Kode
              <input maxLength={KLASIFIKASI_KODE_MAKS} name="code" placeholder="SK" required />
            </label>
            <label>
              Nama
              <input maxLength={150} name="name" placeholder="Surat Keterangan" required />
            </label>
            <label>
              Keterangan
              <input
                maxLength={KLASIFIKASI_URAIAN_MAKS}
                name="description"
                placeholder="Uraian singkat klasifikasi"
              />
            </label>
            <label className="modul-inline-check">
              <input defaultChecked name="isActive" type="checkbox" /> Aktif
            </label>
            <button className="button button-primary" type="submit">
              ＋ Tambah Klasifikasi
            </button>
          </form>
        ) : null}

        {tersaring.length === 0 ? (
          <p className="modul-muted">
            {klasifikasi.length === 0
              ? "Belum ada klasifikasi surat."
              : "Tidak ada klasifikasi yang cocok dengan filter."}
          </p>
        ) : (
          <div className="modul-scroll">
            <table className="modul-table">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Nama & keterangan</th>
                  <th>Status</th>
                  <th>Perbarui</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {tersaring.map((item) => (
                  <tr key={item.id}>
                    <td className="modul-mono">{item.code}</td>
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
                        <form action={hapusKlasifikasiSuratAction}>
                          <input name="id" type="hidden" value={item.id} />
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
          Klasifikasi yang masih dipakai tidak bisa dihapus; nonaktifkan saja.
        </p>
      </section>
    </div>
  );
}
