import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import {
  getAlasanKeluarData,
  getAlasanKeluarUntukUbah,
} from "@/features/kehadiran/kehadiran/application/alasan-keluar-use-cases";
import { ALASAN_KELUAR_RESOURCE } from "@/features/kehadiran/kehadiran/domain/alasan-keluar";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import {
  hapusAlasanKeluarAction,
  hapusAlasanKeluarMassalAction,
  simpanAlasanKeluarAction,
} from "./actions";
import { FormAlasanKeluar } from "./form-alasan-keluar";

export const metadata: Metadata = { title: "Alasan Keluar" };

const PESAN_STATUS: Readonly<Record<string, string>> = {
  ditambah: "Alasan keluar berhasil ditambahkan.",
  diubah: "Alasan keluar berhasil diperbarui.",
  dihapus: "Alasan keluar berhasil dihapus.",
  kosong: "Pilih minimal satu alasan keluar yang akan dihapus.",
};

function nilaiTunggal(nilai: string | string[] | undefined): string {
  if (Array.isArray(nilai)) return nilai[0] ?? "";
  return nilai ?? "";
}

export default async function AlasanKeluarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, user] = await Promise.all([searchParams, verifySession()]);
  const rows = await getAlasanKeluarData();

  const bolehTambah = hasPermission(user.permissions, ALASAN_KELUAR_RESOURCE, "create");
  const bolehUbah = hasPermission(user.permissions, ALASAN_KELUAR_RESOURCE, "update");
  const bolehHapus = hasPermission(user.permissions, ALASAN_KELUAR_RESOURCE, "delete");

  const idUbah = bolehUbah ? Number(nilaiTunggal(params.ubah)) : 0;
  const sedangDiubah =
    Number.isSafeInteger(idUbah) && idUbah > 0 ? await getAlasanKeluarUntukUbah(idUbah) : null;

  const status = nilaiTunggal(params.status);
  const jumlahDihapus = nilaiTunggal(params.jumlah);
  const pesanStatus = PESAN_STATUS[status];

  return (
    <div className="modul-page data-kependudukan-page">
      <PageHeading judul={<>Alasan Keluar</>} deskripsi={<>Alasan keluar pada jam kerja.</>} />

      {pesanStatus ? (
        <p className="form-help" role="status">
          {status === "dihapus" && jumlahDihapus !== ""
            ? `Alasan keluar berhasil dihapus (${jumlahDihapus} data).`
            : pesanStatus}
        </p>
      ) : null}

      {sedangDiubah ? (
        <section className="platform-card data-panel">
          <header>
            <h2>Ubah Alasan Keluar</h2>
            <p>{sedangDiubah.alasan}</p>
          </header>
          <FormAlasanKeluar
            aksi={simpanAlasanKeluarAction}
            awal={{
              id: sedangDiubah.id,
              alasan: sedangDiubah.alasan,
              keterangan: sedangDiubah.keterangan,
            }}
          />
        </section>
      ) : bolehTambah ? (
        <section className="platform-card data-panel">
          <header>
            <h2>Tambah Alasan Keluar</h2>
            <p>Alasan yang tersimpan akan muncul sebagai pilihan pada pencatatan keluar.</p>
          </header>
          <FormAlasanKeluar aksi={simpanAlasanKeluarAction} />
        </section>
      ) : null}

      <section className="platform-card data-panel">
        <header>
          <h2>Daftar Alasan Keluar</h2>
          <p>
            {rows.length === 0
              ? "Belum ada alasan keluar yang tercatat."
              : `${rows.length} alasan tercatat.`}
          </p>
        </header>

        <form action={hapusAlasanKeluarMassalAction}>
          {bolehHapus && rows.length > 0 ? (
            <div className="penduduk-heading-actions">
              <ConfirmSubmit
                className="button button-danger"
                message="Hapus semua alasan keluar yang dicentang?"
              >
                Hapus Terpilih
              </ConfirmSubmit>
            </div>
          ) : null}

          {rows.length === 0 ? (
            <div className="modul-empty">
              <strong>Belum ada alasan keluar.</strong>
              <p>Tambahkan alasan seperti keperluan keluarga atau urusan dinas luar.</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    {bolehHapus ? <th scope="col">Hapus</th> : null}
                    <th scope="col">No.</th>
                    <th scope="col">Alasan</th>
                    <th scope="col">Keterangan</th>
                    {bolehUbah || bolehHapus ? <th scope="col">Aksi</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={row.id}>
                      {bolehHapus ? (
                        <td>
                          <input
                            aria-label={`Pilih alasan keluar ${row.alasan}`}
                            name="idCb"
                            type="checkbox"
                            value={row.id}
                          />
                        </td>
                      ) : null}
                      <td>{index + 1}</td>
                      <td>{row.alasan}</td>
                      <td>{row.keterangan ?? "-"}</td>
                      {bolehUbah || bolehHapus ? (
                        <td>
                          <div className="penduduk-heading-actions">
                            {bolehUbah ? (
                              <Link
                                className="button button-ghost"
                                href={`/kehadiran/alasan-keluar?ubah=${row.id}`}
                              >
                                Ubah
                              </Link>
                            ) : null}
                            {bolehHapus ? (
                              <ConfirmSubmit
                                className="button button-ghost"
                                form={`hapus-alasan-keluar-${row.id}`}
                                message={`Hapus alasan ${row.alasan}?`}
                              >
                                Hapus
                              </ConfirmSubmit>
                            ) : null}
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </form>

        {bolehHapus
          ? rows.map((row) => (
              <form
                action={hapusAlasanKeluarAction}
                id={`hapus-alasan-keluar-${row.id}`}
                key={row.id}
              >
                <input name="id" type="hidden" value={row.id} />
              </form>
            ))
          : null}
      </section>
    </div>
  );
}
