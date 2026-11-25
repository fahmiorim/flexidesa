import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { hasPermission } from "@/features/rbac/application/authorization";
import { getCetakSuratData } from "@/features/surat/application/cetak-surat-use-cases";
import { cariCetakSurat } from "@/features/surat/domain/cetak-surat";
import { verifySession } from "@/lib/dal";

export const metadata: Metadata = { title: "Cetak Surat" };

type SearchParams = Promise<{ q?: string }>;

export default async function CetakSuratPage({ searchParams }: { searchParams: SearchParams }) {
  const [params, user, data] = await Promise.all([
    searchParams,
    verifySession(),
    getCetakSuratData(),
  ]);
  const kataKunci = (params.q ?? "").trim().slice(0, 100);
  const rows = cariCetakSurat(data.rows, kataKunci);
  const bolehBuat = hasPermission(user.permissions, "cetak-surat", "update");

  return (
    <div className="modul-page">
      <PageHeading>
        <div className="page-heading">
          <div>
            <h1>Cetak Surat</h1>
            <p>Pilih jenis surat, isi datanya, lalu cetak PDF.</p>
          </div>
          <div className="page-heading-actions">
            <Link href="/persuratan/surat" className="button button-secondary">
              Daftar Surat
            </Link>
            <Link href="/persuratan/surat/baru" className="button button-primary">
              ＋ Buat Surat Baru
            </Link>
          </div>
        </div>
      </PageHeading>

      <section className="platform-card data-panel">
        <header>
          <h2>Cari Jenis Surat</h2>
          <p>
            {data.jumlahJenis.toLocaleString("id-ID")} jenis surat aktif ·{" "}
            {data.jumlahSurat.toLocaleString("id-ID")} surat pernah dibuat.
          </p>
        </header>

        <form className="data-custom-filter" method="get">
          <label className="form-field">
            <span className="form-label">Nama, kode, klasifikasi, atau lampiran surat</span>
            <input
              className="form-input"
              defaultValue={kataKunci}
              maxLength={100}
              name="q"
              placeholder="Contoh: keterangan usaha"
              type="search"
            />
          </label>
          <div className="data-custom-actions">
            <button className="button button-primary" type="submit">
              Cari
            </button>
            {kataKunci ? (
              <Link className="button button-secondary" href="/persuratan/cetak-surat">
                Atur Ulang
              </Link>
            ) : null}
          </div>
        </form>
      </section>

      <section className="platform-card data-panel">
        <header>
          <h2>Katalog Surat</h2>
          <p>
            {rows.length === 0
              ? "Tidak ada jenis surat yang cocok."
              : `${rows.length} jenis surat ditampilkan.`}
          </p>
        </header>

        {rows.length === 0 ? (
          <div className="modul-empty">
            <strong>Belum ada jenis surat aktif.</strong>
            <p>
              Tambahkan atau aktifkan jenis surat pada halaman{" "}
              <Link href="/persuratan/jenis-surat">Template &amp; Jenis Surat</Link> agar dapat
              dicetak di sini.
            </p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">No.</th>
                  <th scope="col">Nama Surat</th>
                  <th scope="col">Kode / Klasifikasi</th>
                  <th scope="col">Persyaratan</th>
                  <th scope="col">Lampiran</th>
                  <th scope="col">Tercetak</th>
                  <th scope="col">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id}>
                    <td>{index + 1}</td>
                    <td>{row.name}</td>
                    <td>
                      {row.code}
                      {row.classificationName ? (
                        <>
                          <br />
                          <small>{row.classificationName}</small>
                        </>
                      ) : null}
                    </td>
                    <td>{row.jumlahSyarat === 0 ? "-" : `${row.jumlahSyarat} dokumen`}</td>
                    <td>
                      {row.lampiran.length === 0 ? (
                        "-"
                      ) : (
                        <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4 }}>
                          {row.lampiran.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td>{row.tercetak.toLocaleString("id-ID")}</td>
                    <td>
                      {bolehBuat ? (
                        <Link
                          className="button button-primary"
                          href={`/persuratan/surat/baru?jenis=${row.id}`}
                        >
                          Buat Surat
                        </Link>
                      ) : (
                        <span className="form-help">Hanya dapat dilihat</span>
                      )}
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
