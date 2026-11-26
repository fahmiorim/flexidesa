import type { Metadata } from "next";

import { PageHeading } from "@/components/shell/page-heading";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import {
  getLaporanPendudukData,
  LAPORAN_PENDUDUK_RESOURCE,
} from "@/features/kependudukan/statistik/application/laporan-penduduk-use-cases";
import {
  BULAN_LAPORAN,
  TAHUN_MAX,
  TAHUN_MIN,
} from "@/features/kependudukan/statistik/domain/laporan-penduduk";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import {
  hapusLaporanPendudukAction,
  hapusMassalLaporanPendudukAction,
  simpanLaporanPendudukAction,
} from "./actions";
import { HapusMassalLaporan } from "./hapus-massal-laporan";
import { PilihSemuaLaporan } from "./pilih-semua-laporan";

export const metadata: Metadata = { title: "Laporan Penduduk" };

const formatTanggal = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function tanggal(nilai: string | null): string {
  if (!nilai) return "-";
  const parsed = new Date(nilai);
  return Number.isNaN(parsed.getTime()) ? nilai : formatTanggal.format(parsed);
}

function teks(params: Record<string, string | string[] | undefined>, kunci: string): string {
  const nilai = params[kunci];
  return typeof nilai === "string" ? nilai : "";
}

export default async function LaporanPendudukPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, user] = await Promise.all([searchParams, verifySession()]);

  const tahunParam = Number(teks(params, "tahun"));
  const data = await getLaporanPendudukData(
    Number.isInteger(tahunParam) && tahunParam > 0 ? tahunParam : undefined,
  );

  const bolehUbah = hasPermission(user.permissions, LAPORAN_PENDUDUK_RESOURCE, "update");
  const bolehHapus = hasPermission(user.permissions, LAPORAN_PENDUDUK_RESOURCE, "delete");
  const tersimpan = teks(params, "tersimpan");
  const diperbarui = teks(params, "diperbarui");
  const dihapus = teks(params, "dihapus");

  return (
    <div className="modul-page data-kependudukan-page">
      <PageHeading
        judul={<>Laporan Penduduk</>}
        deskripsi={<>Arsip dokumen laporan penduduk per bulan.</>}
      />

      {tersimpan ? (
        <p className="form-help" role="status">
          Laporan penduduk berhasil disimpan.
        </p>
      ) : null}
      {diperbarui ? (
        <p className="form-help" role="status">
          Laporan penduduk berhasil diubah.
        </p>
      ) : null}
      {dihapus ? (
        <p className="form-help" role="status">
          {dihapus === "1" ? "Laporan penduduk dihapus." : `${dihapus} laporan dihapus.`}
        </p>
      ) : null}

      <section className="platform-card data-panel">
        <header>
          <h2>Daftar Laporan Penduduk</h2>
          <p>
            Satu dokumen per bulan dan tahun. Kolom Tanggal Kirim terisi setelah laporan dikirim ke
            OpenDK.
          </p>
        </header>

        <div className="pemerintahan-row-actions">
          {bolehUbah ? (
            <a className="button button-primary" href="#form-laporan-penduduk">
              Tambah
            </a>
          ) : null}
          {bolehHapus ? <HapusMassalLaporan aksi={hapusMassalLaporanPendudukAction} /> : null}
          <button
            className="button button-secondary"
            disabled
            title="API Key Belum Ditentukan"
            type="button"
          >
            Kirim Ke OpenDK
          </button>
        </div>

        <form className="data-custom-filter" method="get">
          <label className="form-field">
            <span className="form-label">Tahun</span>
            <select className="form-input" defaultValue={data.tahun} name="tahun">
              <option value="">Pilih Tahun</option>
              {(data.tahunTersedia.length > 0 ? data.tahunTersedia : [data.tahun]).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <div className="data-custom-actions">
            <button className="button button-secondary" type="submit">
              Tampilkan
            </button>
          </div>
        </form>

        {data.rows.length === 0 ? (
          <div className="modul-empty">
            <strong>Belum ada laporan penduduk untuk tahun {data.tahun}.</strong>
            <p>Unggah dokumen PDF pada formulir di bawah untuk menambah arsip.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  {bolehHapus ? (
                    <th scope="col">
                      <PilihSemuaLaporan />
                    </th>
                  ) : null}
                  <th scope="col">No</th>
                  <th scope="col">Aksi</th>
                  <th scope="col">Judul</th>
                  <th scope="col">Bulan</th>
                  <th scope="col">Tahun</th>
                  <th scope="col">Tanggal Upload</th>
                  <th scope="col">Tanggal Kirim</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, index) => (
                  <tr key={row.id}>
                    {bolehHapus ? (
                      <td>
                        <input
                          aria-label={`Pilih ${row.judul}`}
                          name="id_cb"
                          type="checkbox"
                          value={row.id}
                        />
                      </td>
                    ) : null}
                    <td>{index + 1}</td>
                    <td>
                      <div className="pemerintahan-row-actions">
                        {bolehUbah ? (
                          <details className="pemerintahan-row-edit">
                            <summary>Ubah</summary>
                            <form action={simpanLaporanPendudukAction} className="wilayah-form">
                              <input name="id" type="hidden" value={row.id} />
                              <label className="form-field">
                                <span className="form-label">Judul</span>
                                <input
                                  className="form-input"
                                  defaultValue={row.judul}
                                  maxLength={255}
                                  name="judul"
                                  required
                                />
                              </label>
                              <label className="form-field">
                                <span className="form-label">Bulan</span>
                                <select
                                  className="form-input"
                                  defaultValue={row.bulan}
                                  name="bulan"
                                >
                                  {BULAN_LAPORAN.map((bulan) => (
                                    <option key={bulan.value} value={bulan.value}>
                                      {bulan.label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="form-field">
                                <span className="form-label">Tahun</span>
                                <input
                                  className="form-input"
                                  defaultValue={row.tahun}
                                  max={TAHUN_MAX}
                                  min={TAHUN_MIN}
                                  name="tahun"
                                  required
                                  type="number"
                                />
                              </label>
                              <label className="form-field">
                                <span className="form-label">Ganti berkas (opsional)</span>
                                <input
                                  accept="application/pdf,.pdf"
                                  className="form-input"
                                  name="berkas"
                                  type="file"
                                />
                              </label>
                              <p className="form-help">
                                Kosongkan berkas jika tidak ingin mengubah dokumen. Ukuran maksimal
                                8 MB.
                              </p>
                              <button className="button button-primary" type="submit">
                                Simpan
                              </button>
                            </form>
                          </details>
                        ) : null}
                        <a
                          className="button button-secondary"
                          href={`/kependudukan/laporan-penduduk/${row.id}/berkas?unduh=1`}
                        >
                          Unduh
                        </a>
                        {bolehHapus ? (
                          <>
                            <ConfirmSubmit
                              className="button button-danger"
                              form={`hapus-laporan-penduduk-${row.id}`}
                              message={`Hapus laporan "${row.judul}" beserta berkasnya?`}
                            >
                              Hapus
                            </ConfirmSubmit>
                            <form
                              action={hapusLaporanPendudukAction}
                              id={`hapus-laporan-penduduk-${row.id}`}
                            >
                              <input name="id" type="hidden" value={row.id} />
                            </form>
                          </>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <a
                        href={`/kependudukan/laporan-penduduk/${row.id}/berkas`}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {row.judul}
                      </a>
                    </td>
                    <td>{row.bulanLabel}</td>
                    <td>{row.tahun}</td>
                    <td>{tanggal(row.diunggahPada)}</td>
                    <td>{row.kirim ? tanggal(row.kirim) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {bolehUbah ? (
        <section className="platform-card data-panel" id="form-laporan-penduduk">
          <header>
            <h2>Tambah Laporan Penduduk</h2>
            <p>Unggah PDF maksimal 8 MB. Satu dokumen per bulan dan tahun.</p>
          </header>
          <form action={simpanLaporanPendudukAction} className="data-custom-filter">
            <label className="form-field">
              <span className="form-label">Judul</span>
              <input className="form-input" maxLength={255} name="judul" required />
            </label>
            <label className="form-field">
              <span className="form-label">Bulan</span>
              <select className="form-input" defaultValue={new Date().getMonth() + 1} name="bulan">
                {BULAN_LAPORAN.map((bulan) => (
                  <option key={bulan.value} value={bulan.value}>
                    {bulan.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span className="form-label">Tahun</span>
              <input
                className="form-input"
                defaultValue={data.tahun}
                max={TAHUN_MAX}
                min={TAHUN_MIN}
                name="tahun"
                required
                type="number"
              />
            </label>
            <label className="form-field">
              <span className="form-label">File (.pdf)</span>
              <input
                accept="application/pdf,.pdf"
                className="form-input"
                name="berkas"
                required
                type="file"
              />
            </label>
            <div className="data-custom-actions">
              <button className="button button-primary" type="submit">
                Simpan
              </button>
            </div>
          </form>
        </section>
      ) : (
        <p className="form-help">Anda hanya memiliki akses baca untuk laporan penduduk.</p>
      )}
    </div>
  );
}
