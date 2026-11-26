import type { Metadata } from "next";

import { PageHeading } from "@/components/shell/page-heading";
import { getPengaduanKehadiranData } from "@/features/kehadiran/kehadiran/application/pengaduan-kehadiran-use-cases";
import { KETERANGAN_MAKS } from "@/features/kehadiran/kehadiran/domain/pengaduan-kehadiran";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import { ubahPengaduanKehadiranAction } from "./actions";

export const metadata: Metadata = { title: "Pengaduan Kehadiran" };

const RESOURCE = "pengaduan-kehadiran";

/** Format waktu seperti `tgl_indo2` OpenSID: tanggal, bulan, tahun, jam. */
const formatWaktu = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function waktuLaporan(nilai: string): string {
  const parsed = new Date(nilai);
  return Number.isNaN(parsed.getTime()) ? nilai : formatWaktu.format(parsed);
}

export default async function PengaduanKehadiranPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, user] = await Promise.all([searchParams, verifySession()]);
  const rows = await getPengaduanKehadiranData();
  const bolehUbah = hasPermission(user.permissions, RESOURCE, "update");
  const diperbarui = params.diperbarui;

  return (
    <div className="modul-page data-kependudukan-page">
      <PageHeading
        judul={<>Pengaduan Kehadiran</>}
        deskripsi={<>Pengaduan kehadiran perangkat desa.</>}
      />

      {diperbarui ? (
        <p className="form-help" role="status">
          Keterangan pengaduan berhasil disimpan.
        </p>
      ) : null}

      <section className="platform-card data-panel">
        <header>
          <h2>Daftar Pengaduan</h2>
          <p>
            {rows.length === 0
              ? "Belum ada laporan kehadiran dari warga."
              : `${rows.length} laporan kehadiran tercatat.`}
          </p>
        </header>

        {rows.length === 0 ? (
          <div className="modul-empty">
            <strong>Belum ada pengaduan kehadiran.</strong>
            <p>
              Laporan masuk dari layanan mandiri warga saat menekan “Laporkan” pada daftar kehadiran
              perangkat.
            </p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">No</th>
                  <th scope="col">Aksi</th>
                  <th scope="col">Waktu</th>
                  <th scope="col">Pelapor</th>
                  <th scope="col">Terlapor</th>
                  <th scope="col">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id}>
                    <td>{index + 1}</td>
                    <td>
                      {bolehUbah ? (
                        <details className="pemerintahan-row-edit">
                          <summary>Ubah</summary>
                          <form action={ubahPengaduanKehadiranAction} className="wilayah-form">
                            <input name="id" type="hidden" value={row.id} />
                            <label className="form-field">
                              <span className="form-label">Keterangan</span>
                              <textarea
                                className="form-input"
                                defaultValue={row.keterangan ?? ""}
                                maxLength={KETERANGAN_MAKS}
                                name="keterangan"
                                rows={3}
                              />
                            </label>
                            <button className="button button-primary" type="submit">
                              Simpan
                            </button>
                          </form>
                        </details>
                      ) : (
                        <span className="modul-muted">—</span>
                      )}
                    </td>
                    <td>{waktuLaporan(row.waktu)}</td>
                    <td>{row.pelapor ?? "-"}</td>
                    <td>{row.terlapor ?? "-"}</td>
                    <td>{row.keterangan ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
