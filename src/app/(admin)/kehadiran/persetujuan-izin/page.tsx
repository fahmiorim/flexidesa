import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import {
  formatRentang,
  formatWaktuPengajuan,
  JENIS_PENGAJUAN_IZIN,
  labelJenisPengajuan,
  labelStatusPengajuan,
  PERSETUJUAN_IZIN_RESOURCE,
  STATUS_PENGAJUAN,
  type PengajuanIzinRow,
} from "@/features/kehadiran/domain/pengajuan-izin";
import { getPersetujuanIzinData } from "@/features/kepegawaian/application/pengajuan-izin-use-cases";
import { hasPermission } from "@/features/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import { putuskanIzinAction } from "./actions";
import { FormKeputusanIzin } from "./form-keputusan-izin";

export const metadata: Metadata = { title: "Persetujuan Izin" };

const PESAN_STATUS: Readonly<Record<string, string>> = {
  disetujui: "Pengajuan izin berhasil disetujui.",
  ditolak: "Pengajuan izin berhasil ditolak.",
};

function nilai(params: Record<string, string | string[] | undefined>, kunci: string): string {
  const isi = params[kunci];
  return typeof isi === "string" ? isi : "";
}

/** Tiga status pengajuan ditambah pilihan "semua" untuk filter. */
const PILIHAN_STATUS = ["", ...STATUS_PENGAJUAN] as const;

export default async function PersetujuanIzinPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, user] = await Promise.all([searchParams, verifySession()]);
  const rows = await getPersetujuanIzinData();

  const bolehPutuskan = hasPermission(user.permissions, PERSETUJUAN_IZIN_RESOURCE, "update");

  // OpenSID membuka daftar ini dengan filter status "Menunggu Persetujuan"
  // sehingga antrean keputusan langsung terlihat.
  const filterStatusMentah = nilai(params, "status");
  const filterStatus =
    filterStatusMentah === "" && params.status === undefined ? "menunggu" : filterStatusMentah;
  const filterJenis = nilai(params, "jenis");

  const terfilter = rows.filter(
    (row) =>
      (filterStatus === "" || row.status === filterStatus) &&
      (filterJenis === "" || row.jenis === filterJenis),
  );

  const jumlahMenunggu = rows.filter((row) => row.status === "menunggu").length;
  const jumlahDisetujui = rows.filter((row) => row.status === "disetujui").length;
  const jumlahDitolak = rows.filter((row) => row.status === "ditolak").length;

  const pesanStatus = PESAN_STATUS[nilai(params, "hasil")];

  return (
    <div className="modul-page data-kependudukan-page">
      <PageHeading>
        <header className="page-heading">
          <div>
            <h1>Persetujuan Izin</h1>
            <p>Setujui atau tolak pengajuan izin perangkat desa.</p>
          </div>
        </header>
      </PageHeading>

      {pesanStatus ? (
        <p className="form-help" role="status">
          {pesanStatus}
        </p>
      ) : null}

      <section className="platform-card data-panel">
        <header>
          <h2>Filter Pengajuan</h2>
          <p>
            {rows.length === 0
              ? "Belum ada pengajuan izin."
              : `${jumlahMenunggu} menunggu, ${jumlahDisetujui} disetujui, ${jumlahDitolak} ditolak.`}
          </p>
        </header>

        <form className="data-custom-filter" method="get">
          <label className="form-field">
            <span className="form-label">Status</span>
            <select className="form-input" defaultValue={filterStatus} name="status">
              {PILIHAN_STATUS.map((status) => (
                <option key={status || "semua"} value={status}>
                  {status === ""
                    ? "Semua Status"
                    : status === "menunggu"
                      ? "Menunggu Persetujuan"
                      : labelStatusPengajuan(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span className="form-label">Jenis Izin</span>
            <select className="form-input" defaultValue={filterJenis} name="jenis">
              <option value="">Semua Jenis Izin</option>
              {JENIS_PENGAJUAN_IZIN.map((jenis) => (
                <option key={jenis.nilai} value={jenis.nilai}>
                  {jenis.label}
                </option>
              ))}
            </select>
          </label>

          <div className="data-custom-actions">
            <button className="button button-primary" type="submit">
              Tampilkan
            </button>
            <Link className="button button-secondary" href="/kehadiran/persetujuan-izin">
              Atur Ulang
            </Link>
          </div>
        </form>
      </section>

      <section className="platform-card data-panel">
        <header>
          <h2>Daftar Pengajuan Izin</h2>
          <p>
            {terfilter.length === 0
              ? "Tidak ada pengajuan yang sesuai filter."
              : `${terfilter.length} pengajuan ditampilkan.`}
          </p>
        </header>

        {terfilter.length === 0 ? (
          <div className="modul-empty">
            <strong>Tidak ada pengajuan izin.</strong>
            <p>
              Pengajuan perangkat desa muncul di sini setelah diajukan melalui halaman Absensi &amp;
              Kepegawaian → Cuti &amp; Izin.
            </p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">No.</th>
                  <th scope="col">Nama Perangkat</th>
                  <th scope="col">Jabatan</th>
                  <th scope="col">Jenis Izin</th>
                  <th scope="col">Keterangan</th>
                  <th scope="col">Tanggal</th>
                  <th scope="col">Durasi</th>
                  <th scope="col">Status</th>
                  <th scope="col">Tanggal Pengajuan</th>
                  {bolehPutuskan ? <th scope="col">Aksi</th> : null}
                </tr>
              </thead>
              <tbody>
                {terfilter.map((row, index) => (
                  <tr key={row.id}>
                    <td>{index + 1}</td>
                    <td>{row.nama}</td>
                    <td>{row.jabatan ?? "-"}</td>
                    <td>{labelJenisPengajuan(row.jenis)}</td>
                    <td>
                      {row.keterangan}
                      {row.lampiran ? (
                        <>
                          <br />
                          <a href={lampiranHref(row)}>Lihat lampiran</a>
                        </>
                      ) : null}
                      {row.catatan ? (
                        <>
                          <br />
                          <small>Catatan keputusan: {row.catatan}</small>
                        </>
                      ) : null}
                    </td>
                    <td>{formatRentang(row.mulai, row.selesai)}</td>
                    <td>{row.durasi} hari kerja</td>
                    <td>{labelStatusPengajuan(row.status)}</td>
                    <td>{formatWaktuPengajuan(row.createdAt)}</td>
                    {bolehPutuskan ? (
                      <td>
                        {row.status === "menunggu" ? (
                          <details>
                            <summary>Putuskan</summary>
                            <FormKeputusanIzin aksi={putuskanIzinAction} id={row.id} />
                          </details>
                        ) : (
                          "-"
                        )}
                      </td>
                    ) : null}
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

/** Lampiran disajikan route unduhan yang sudah memeriksa izin dan tenant. */
function lampiranHref(row: PengajuanIzinRow): string {
  return `/api/kepegawaian/cuti/${row.id}/lampiran`;
}
