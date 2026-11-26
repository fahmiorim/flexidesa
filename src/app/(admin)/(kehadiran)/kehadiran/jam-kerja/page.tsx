import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import {
  getJamKerjaData,
  getJamKerjaUntukUbah,
} from "@/features/kehadiran/kehadiran/application/jam-kerja-use-cases";
import { JAM_KERJA_RESOURCE } from "@/features/kehadiran/kehadiran/domain/jam-kerja";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import { simpanJamKerjaAction } from "./actions";
import { FormJamKerja } from "./form-jam-kerja";

export const metadata: Metadata = { title: "Jam Kerja" };

const PESAN_STATUS: Readonly<Record<string, string>> = {
  diubah: "Jam kerja berhasil diperbarui.",
};

function nilaiTunggal(nilai: string | string[] | undefined): string {
  if (Array.isArray(nilai)) return nilai[0] ?? "";
  return nilai ?? "";
}

export default async function JamKerjaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, user] = await Promise.all([searchParams, verifySession()]);
  const rows = await getJamKerjaData();

  const bolehUbah = hasPermission(user.permissions, JAM_KERJA_RESOURCE, "update");

  const idUbah = bolehUbah ? Number(nilaiTunggal(params.ubah)) : 0;
  const sedangDiubah =
    Number.isSafeInteger(idUbah) && idUbah > 0 ? await getJamKerjaUntukUbah(idUbah) : null;

  const pesanStatus = PESAN_STATUS[nilaiTunggal(params.status)];

  return (
    <div className="modul-page data-kependudukan-page">
      <PageHeading judul={<>Jam Kerja</>} deskripsi={<>Jadwal jam kerja perangkat desa.</>} />

      {pesanStatus ? (
        <p className="form-help" role="status">
          {pesanStatus}
        </p>
      ) : null}

      {sedangDiubah ? (
        <section className="platform-card data-panel">
          <header>
            <h2>Ubah Jam Kerja — {sedangDiubah.namaHari}</h2>
            <p>Jam keluar tidak boleh lebih kecil dari jam masuk.</p>
          </header>
          <FormJamKerja aksi={simpanJamKerjaAction} awal={sedangDiubah} />
        </section>
      ) : null}

      <section className="platform-card data-panel">
        <header>
          <h2>Daftar Jam Kerja</h2>
          <p>
            {rows.length === 0
              ? "Belum ada jam kerja yang tercatat."
              : `${rows.length} hari dalam seminggu.`}
          </p>
        </header>

        {rows.length === 0 ? (
          <div className="modul-empty">
            <strong>Belum ada jam kerja.</strong>
            <p>Jadwal bawaan akan dibuat otomatis saat halaman ini pertama kali dibuka.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">No.</th>
                  <th scope="col">Hari</th>
                  <th scope="col">Jam Masuk</th>
                  <th scope="col">Jam Keluar</th>
                  <th scope="col">Keterangan</th>
                  <th scope="col">Status</th>
                  {bolehUbah ? <th scope="col">Aksi</th> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id}>
                    <td>{index + 1}</td>
                    <td>{row.namaHari}</td>
                    <td>{row.jamMasuk}</td>
                    <td>{row.jamKeluar}</td>
                    <td>{row.keterangan ?? "-"}</td>
                    <td>{row.status ? "Hari Kerja" : "Hari Libur"}</td>
                    {bolehUbah ? (
                      <td>
                        <div className="penduduk-heading-actions">
                          <Link
                            className="button button-ghost"
                            href={`/kehadiran/jam-kerja?ubah=${row.id}`}
                          >
                            Ubah
                          </Link>
                        </div>
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
