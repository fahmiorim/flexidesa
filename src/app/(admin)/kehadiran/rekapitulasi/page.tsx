import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { getRekapitulasiKehadiranData } from "@/features/kehadiran/application/rekapitulasi-use-cases";
import { bacaFilterRekapitulasi, tanggalIndonesia } from "@/features/kehadiran/domain/rekapitulasi";
import { hasPermission } from "@/features/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import styles from "./rekapitulasi.module.css";

export const metadata: Metadata = { title: "Rekapitulasi Kehadiran" };

const RESOURCE = "rekapitulasi-kehadiran";

function nilai(params: Record<string, string | string[] | undefined>, kunci: string): string {
  const isi = params[kunci];
  return typeof isi === "string" ? isi : "";
}

export default async function RekapitulasiKehadiranPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, user] = await Promise.all([searchParams, verifySession()]);
  const filter = bacaFilterRekapitulasi({
    dari: nilai(params, "dari"),
    sampai: nilai(params, "sampai"),
    perangkat: nilai(params, "perangkat"),
    status: nilai(params, "status"),
  });
  const data = await getRekapitulasiKehadiranData(filter);
  const bolehEkspor = hasPermission(user.permissions, RESOURCE, "read");

  const query = new URLSearchParams();
  if (filter.dari) query.set("dari", filter.dari);
  if (filter.sampai) query.set("sampai", filter.sampai);
  if (filter.perangkatId) query.set("perangkat", String(filter.perangkatId));
  if (filter.status) query.set("status", filter.status);
  const eksporHref = `/kehadiran/rekapitulasi/ekspor${query.size ? `?${query.toString()}` : ""}`;

  return (
    <div className="modul-page data-kependudukan-page">
      <PageHeading>
        <header className="page-heading">
          <div>
            <h1>Rekapitulasi Kehadiran</h1>
            <p>Rekap kehadiran perangkat desa.</p>
          </div>
        </header>
      </PageHeading>

      <section className="platform-card data-panel">
        <header>
          <h2>Filter</h2>
          <p>Total waktu dihitung dari selisih jam keluar dan jam masuk.</p>
        </header>

        <form className="data-custom-filter" method="get">
          <label className="form-field">
            <span className="form-label">Rentang tanggal (dari)</span>
            <input
              className="form-input"
              defaultValue={filter.dari ?? ""}
              name="dari"
              type="date"
            />
          </label>
          <label className="form-field">
            <span className="form-label">Rentang tanggal (sampai)</span>
            <input
              className="form-input"
              defaultValue={filter.sampai ?? ""}
              name="sampai"
              type="date"
            />
          </label>
          <label className="form-field">
            <span className="form-label">Perangkat Desa</span>
            <select className="form-input" defaultValue={filter.perangkatId ?? ""} name="perangkat">
              <option value="">Semua Perangkat</option>
              {data.perangkat.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nama ?? "-"}
                  {item.jabatan ? ` — ${item.jabatan}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span className="form-label">Status Kehadiran</span>
            <select className="form-input" defaultValue={filter.status ?? ""} name="status">
              <option value="">Semua Status</option>
              {data.statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          <div className="data-custom-actions">
            <button className="button button-primary" type="submit">
              Tampilkan
            </button>
            {bolehEkspor ? (
              <Link className="button button-secondary" href={eksporHref}>
                Ekspor ke Excel
              </Link>
            ) : null}
          </div>
        </form>
      </section>

      <section className="platform-card data-panel">
        <header>
          <h2>Daftar Kehadiran</h2>
          <p>
            {data.rows.length === 0
              ? "Tidak ada catatan kehadiran pada filter ini."
              : `${data.rows.length} catatan kehadiran.`}
          </p>
        </header>

        {data.rows.length === 0 ? (
          <div className="modul-empty">
            <strong>Belum ada catatan kehadiran.</strong>
            <p>
              Catatan muncul setelah perangkat melakukan absensi atau operator mengisi absensi
              manual.
            </p>
          </div>
        ) : (
          <div className={styles.wrap}>
            <table className={styles.tabel}>
              <thead>
                <tr>
                  <th scope="col">No</th>
                  <th scope="col">Nama</th>
                  <th scope="col">Jabatan</th>
                  <th scope="col">Tanggal</th>
                  <th scope="col">Jam Masuk</th>
                  <th scope="col">Jam Keluar</th>
                  <th scope="col">Total Waktu</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, index) => (
                  <tr key={row.id}>
                    <td className={styles.nomor}>{index + 1}</td>
                    <td>{row.nama}</td>
                    <td>{row.jabatan}</td>
                    <td>{tanggalIndonesia(row.tanggal)}</td>
                    <td className={styles.jam}>{row.jamMasuk ?? "-"}</td>
                    <td className={styles.jam}>{row.jamKeluar ?? "-"}</td>
                    <td className={styles.jam}>{row.totalWaktu}</td>
                    <td>
                      <span
                        className={`${styles.lencana} ${
                          row.status.toLowerCase() === "hadir" ? styles.hadir : styles.lain
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
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
