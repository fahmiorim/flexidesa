import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import {
  getHariLiburData,
  getHariLiburUntukUbah,
} from "@/features/kehadiran/application/hari-libur-use-cases";
import {
  formatTanggalIndonesia,
  HARI_LIBUR_RESOURCE,
  namaHariIndonesia,
} from "@/features/kehadiran/domain/hari-libur";
import { hasPermission } from "@/features/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import { hapusHariLiburAction, hapusHariLiburMassalAction, simpanHariLiburAction } from "./actions";
import { FormHariLibur } from "./form-hari-libur";

export const metadata: Metadata = { title: "Hari Libur" };

const PESAN_STATUS: Readonly<Record<string, string>> = {
  ditambah: "Hari libur berhasil ditambahkan.",
  diubah: "Hari libur berhasil diperbarui.",
  dihapus: "Hari libur berhasil dihapus.",
  kosong: "Pilih minimal satu hari libur yang akan dihapus.",
};

function nilaiTunggal(nilai: string | string[] | undefined): string {
  if (Array.isArray(nilai)) return nilai[0] ?? "";
  return nilai ?? "";
}

export default async function HariLiburPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, user] = await Promise.all([searchParams, verifySession()]);
  const rows = await getHariLiburData();

  const bolehTambah = hasPermission(user.permissions, HARI_LIBUR_RESOURCE, "create");
  const bolehUbah = hasPermission(user.permissions, HARI_LIBUR_RESOURCE, "update");
  const bolehHapus = hasPermission(user.permissions, HARI_LIBUR_RESOURCE, "delete");

  const idUbah = bolehUbah ? Number(nilaiTunggal(params.ubah)) : 0;
  const sedangDiubah =
    Number.isSafeInteger(idUbah) && idUbah > 0 ? await getHariLiburUntukUbah(idUbah) : null;

  const status = nilaiTunggal(params.status);
  const jumlahDihapus = nilaiTunggal(params.jumlah);
  const pesanStatus = PESAN_STATUS[status];

  return (
    <div className="modul-page data-kependudukan-page">
      <PageHeading>
        <header className="page-heading">
          <div>
            <h1>Hari Libur</h1>
            <p>Daftar hari libur desa.</p>
          </div>
        </header>
      </PageHeading>

      {pesanStatus ? (
        <p className="form-help" role="status">
          {status === "dihapus" && jumlahDihapus !== ""
            ? `Hari libur berhasil dihapus (${jumlahDihapus} data).`
            : pesanStatus}
        </p>
      ) : null}

      {sedangDiubah ? (
        <section className="platform-card data-panel">
          <header>
            <h2>Ubah Hari Libur</h2>
            <p>
              {formatTanggalIndonesia(sedangDiubah.tanggal)}
              {namaHariIndonesia(sedangDiubah.tanggal)
                ? ` (${namaHariIndonesia(sedangDiubah.tanggal)})`
                : ""}
            </p>
          </header>
          <FormHariLibur
            aksi={simpanHariLiburAction}
            awal={{
              id: sedangDiubah.id,
              tanggal: sedangDiubah.tanggal,
              keterangan: sedangDiubah.keterangan,
            }}
          />
        </section>
      ) : bolehTambah ? (
        <section className="platform-card data-panel">
          <header>
            <h2>Tambah Hari Libur</h2>
            <p>Satu tanggal hanya dapat tercatat sekali untuk desa ini.</p>
          </header>
          <FormHariLibur aksi={simpanHariLiburAction} />
        </section>
      ) : null}

      <section className="platform-card data-panel">
        <header>
          <h2>Daftar Hari Libur</h2>
          <p>
            {rows.length === 0
              ? "Belum ada hari libur yang tercatat."
              : `${rows.length} tanggal libur tercatat.`}
          </p>
        </header>

        <form action={hapusHariLiburMassalAction}>
          {bolehHapus && rows.length > 0 ? (
            <div className="penduduk-heading-actions">
              <ConfirmSubmit
                className="button button-danger"
                message="Hapus semua hari libur yang dicentang?"
              >
                Hapus Terpilih
              </ConfirmSubmit>
            </div>
          ) : null}

          {rows.length === 0 ? (
            <div className="modul-empty">
              <strong>Belum ada hari libur.</strong>
              <p>Tambahkan tanggal libur nasional atau cuti bersama agar tercatat di desa ini.</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    {bolehHapus ? <th scope="col">Hapus</th> : null}
                    <th scope="col">No.</th>
                    <th scope="col">Tanggal</th>
                    <th scope="col">Hari</th>
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
                            aria-label={`Pilih hari libur ${formatTanggalIndonesia(row.tanggal)}`}
                            name="idCb"
                            type="checkbox"
                            value={row.id}
                          />
                        </td>
                      ) : null}
                      <td>{index + 1}</td>
                      <td>{formatTanggalIndonesia(row.tanggal)}</td>
                      <td>{namaHariIndonesia(row.tanggal) || "-"}</td>
                      <td>{row.keterangan ?? "-"}</td>
                      {bolehUbah || bolehHapus ? (
                        <td>
                          <div className="penduduk-heading-actions">
                            {bolehUbah ? (
                              <Link
                                className="button button-ghost"
                                href={`/kehadiran/hari-libur?ubah=${row.id}`}
                              >
                                Ubah
                              </Link>
                            ) : null}
                            {bolehHapus ? (
                              <ConfirmSubmit
                                className="button button-ghost"
                                form={`hapus-hari-libur-${row.id}`}
                                message={`Hapus hari libur ${formatTanggalIndonesia(row.tanggal)}?`}
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
              <form action={hapusHariLiburAction} id={`hapus-hari-libur-${row.id}`} key={row.id}>
                <input name="id" type="hidden" value={row.id} />
              </form>
            ))
          : null}
      </section>
    </div>
  );
}
