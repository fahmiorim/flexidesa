import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { resolveVillageId } from "@/features/desa/application/resolve-village";
import { hasPermission } from "@/features/rbac/application/authorization";
import { RESOURCES } from "@/features/rbac/domain/resources";
import { listRentangUmurUseCase } from "@/features/statistik/application/rentang-umur-use-cases";
import { BATAS_UMUR_MAKSIMAL } from "@/features/statistik/domain/rentang-umur";
import { verifySession } from "@/lib/dal";

import { hapusRentangUmurAction, simpanRentangUmurAction } from "./actions";

export const metadata: Metadata = { title: "Pengaturan Rentang Umur" };

function teks(params: Record<string, string | string[] | undefined>, kunci: string) {
  const nilai = params[kunci];
  return typeof nilai === "string" ? nilai : "";
}

export default async function PengaturanRentangUmurPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, user] = await Promise.all([searchParams, verifySession()]);
  const villageId = await resolveVillageId(user);
  const rows = await listRentangUmurUseCase({ villageId });
  const bolehUbah = hasPermission(user.permissions, RESOURCES.penduduk, "update");
  const bolehHapus = hasPermission(user.permissions, RESOURCES.penduduk, "delete");

  const maksSampai = rows.reduce(
    (maks, row) => (row.sampai === null ? maks : Math.max(maks, row.sampai)),
    -1,
  );
  const saranDari = rows.length === 0 ? 0 : maksSampai + 1;
  const pesan = teks(params, "pesan");
  const galat = teks(params, "galat");
  const kembali = "/statistik/kependudukan?kategori=rentang-umur";

  return (
    <div className="modul-page data-kependudukan-page">
      <PageHeading>
        <header className="page-heading">
          <div>
            <h1>Pengaturan Rentang Umur</h1>
            <p>Kelompok umur untuk laporan statistik desa.</p>
          </div>
          <div className="penduduk-heading-actions">
            <Link className="button button-secondary" href={kembali}>
              Kembali ke Statistik
            </Link>
            <a className="button button-primary" href="/statistik/rentang-umur/ekspor">
              Unduh CSV
            </a>
          </div>
        </header>
      </PageHeading>

      {pesan ? (
        <p className="form-help" role="status">
          {pesan}
        </p>
      ) : null}
      {galat ? (
        <p className="dpt-form-error" role="alert">
          {galat}
        </p>
      ) : null}

      <section className="platform-card data-panel">
        <header>
          <h2>Rentang Umur Desa</h2>
          <p>
            {rows.length === 0
              ? "Belum ada rentang khusus. Statistik memakai kelompok Data Pilah bawaan."
              : `${rows.length} rentang aktif dipakai laporan desa. Rentang tidak boleh bertumpang tindih.`}
          </p>
        </header>

        {bolehUbah ? (
          <form action={simpanRentangUmurAction} className="data-custom-filter">
            <input name="id" type="hidden" value="" />
            <label className="form-field">
              <span className="form-label">Dari umur</span>
              <input
                className="form-input"
                defaultValue={saranDari}
                max={BATAS_UMUR_MAKSIMAL}
                min={0}
                name="dari"
                required
                type="number"
              />
            </label>
            <label className="form-field">
              <span className="form-label">Sampai umur (opsional)</span>
              <input
                className="form-input"
                max={BATAS_UMUR_MAKSIMAL}
                min={0}
                name="sampai"
                placeholder={`Kosong = di atas ${saranDari} tahun`}
                type="number"
              />
            </label>
            <div className="data-custom-actions">
              <button className="button button-primary" type="submit">
                Tambah Rentang
              </button>
            </div>
          </form>
        ) : (
          <p className="form-help">Anda hanya memiliki akses baca untuk pengaturan ini.</p>
        )}
      </section>

      <section className="platform-card data-panel">
        <header>
          <h2>Daftar Rentang</h2>
          <p>Urutan mengikuti batas bawah. Nama rentang dibentuk otomatis dari batasnya.</p>
        </header>

        {rows.length === 0 ? (
          <div className="modul-empty">
            <strong>Belum ada rentang umur khusus.</strong>
            <p>
              Saat daftar kosong, laporan memakai kelompok Data Pilah bawaan sampai rentang pertama
              ditambahkan.
            </p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Rentang</th>
                  <th>Dari</th>
                  <th>Sampai</th>
                  {bolehUbah || bolehHapus ? <th>Aksi</th> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{row.nama}</strong>
                    </td>
                    <td>{row.dari}</td>
                    <td>{row.sampai === null ? "Tanpa batas" : row.sampai}</td>
                    {bolehUbah || bolehHapus ? (
                      <td>
                        <div className="pemerintahan-row-actions">
                          {bolehUbah ? (
                            <details className="pemerintahan-row-edit">
                              <summary>Ubah</summary>
                              <form action={simpanRentangUmurAction} className="wilayah-form">
                                <input name="id" type="hidden" value={row.id} />
                                <label className="form-field">
                                  <span className="form-label">Dari</span>
                                  <input
                                    className="form-input"
                                    defaultValue={row.dari}
                                    max={BATAS_UMUR_MAKSIMAL}
                                    min={0}
                                    name="dari"
                                    required
                                    type="number"
                                  />
                                </label>
                                <label className="form-field">
                                  <span className="form-label">Sampai</span>
                                  <input
                                    className="form-input"
                                    defaultValue={row.sampai ?? ""}
                                    max={BATAS_UMUR_MAKSIMAL}
                                    min={0}
                                    name="sampai"
                                    placeholder="Kosong = tanpa batas"
                                    type="number"
                                  />
                                </label>
                                <button className="button button-primary" type="submit">
                                  Simpan
                                </button>
                              </form>
                            </details>
                          ) : null}

                          {bolehHapus ? (
                            <>
                              <ConfirmSubmit
                                className="button button-danger"
                                form={`hapus-rentang-${row.id}`}
                                message={`Hapus rentang ${row.nama}?`}
                              >
                                Hapus
                              </ConfirmSubmit>
                              <form action={hapusRentangUmurAction} id={`hapus-rentang-${row.id}`}>
                                <input name="id" type="hidden" value={row.id} />
                              </form>
                            </>
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
      </section>

      <p className="form-help">
        Batas atas inklusif; kosongkan “Sampai” untuk rentang terbuka. Maksimal{" "}
        {BATAS_UMUR_MAKSIMAL} tahun.
      </p>
    </div>
  );
}
