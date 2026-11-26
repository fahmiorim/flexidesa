import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { GENDER_LABELS, samarkanNik } from "@/features/kependudukan/penduduk/domain/penduduk";
import {
  getPendudukKategoriPageData,
  labelFilterWilayah,
  nilaiFilter,
} from "@/features/kependudukan/statistik/application/statistik-kependudukan-use-cases";

export const metadata: Metadata = { title: "Daftar Penduduk Statistik" };

const angka = new Intl.NumberFormat("id-ID");

function tautanKembali(kategori: string, dusun?: string, rw?: string, rt?: string): string {
  const query = new URLSearchParams({ kategori });
  if (dusun) query.set("dusun", dusun);
  if (rw) query.set("rw", rw);
  if (rt) query.set("rt", rt);
  return `/kependudukan/statistik?${query.toString()}`;
}

export default async function DaftarPendudukStatistikPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const kategoriSlug = nilaiFilter(params.kategori) ?? "";
  const kelompok = nilaiFilter(params.kelompok) ?? "";
  const dusun = nilaiFilter(params.dusun);
  const rw = nilaiFilter(params.rw);
  const rt = nilaiFilter(params.rt);
  const genderDiminta = nilaiFilter(params.gender);
  const gender = genderDiminta === "male" || genderDiminta === "female" ? genderDiminta : undefined;

  const data = await getPendudukKategoriPageData({
    kategoriSlug,
    kelompok,
    gender,
    dusun,
    rw,
    rt,
  });

  const fokus = labelFilterWilayah({ dusun, rw, rt });
  const kembali = tautanKembali(data.kategori.slug, dusun, rw, rt);
  const tautanGender = (nilai?: "male" | "female") => {
    const query = new URLSearchParams({
      kategori: data.kategori.slug,
      kelompok: data.kelompok,
    });
    if (nilai) query.set("gender", nilai);
    if (dusun) query.set("dusun", dusun);
    if (rw) query.set("rw", rw);
    if (rt) query.set("rt", rt);
    return `/kependudukan/statistik/penduduk?${query.toString()}`;
  };

  return (
    <div className="modul-page data-kependudukan-page">
      <PageHeading
        judul={<>Daftar Penduduk · {data.kategori.label}</>}
        deskripsi={
          <>
            Kelompok “{data.kelompok}” · {fokus}. {angka.format(data.rows.length)} penduduk
            berstatus hidup.
          </>
        }
        aksi={
          <>
            <div className="penduduk-heading-actions">
              <Link className="button button-secondary" href={kembali}>
                Kembali ke Statistik
              </Link>
            </div>
          </>
        }
      />

      <section className="platform-card data-panel">
        <header className="data-section-heading">
          <div>
            <h2>Rincian Penduduk</h2>
            <p>Data identitas disamarkan sesuai kebijakan tampilan admin.</p>
          </div>
          <div className="data-report-tabs">
            <Link
              aria-current={!gender ? "page" : undefined}
              className={!gender ? "is-active" : ""}
              href={tautanGender()}
            >
              Semua
            </Link>
            <Link
              aria-current={gender === "male" ? "page" : undefined}
              className={gender === "male" ? "is-active" : ""}
              href={tautanGender("male")}
            >
              Laki-laki
            </Link>
            <Link
              aria-current={gender === "female" ? "page" : undefined}
              className={gender === "female" ? "is-active" : ""}
              href={tautanGender("female")}
            >
              Perempuan
            </Link>
          </div>
        </header>

        {data.rows.length === 0 ? (
          <div className="modul-empty">
            <strong>Tidak ada penduduk pada kelompok ini.</strong>
            <p>Ubah kategori atau filter wilayah, atau pilih kelompok lain di Statistik.</p>
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Nama</th>
                    <th>NIK</th>
                    <th>Jenis Kelamin</th>
                    <th>Umur</th>
                    <th>Alamat</th>
                    <th>Wilayah</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, index) => (
                    <tr key={row.id}>
                      <td>{index + 1}</td>
                      <td>
                        <Link href={`/kependudukan/penduduk/${row.id}`}>{row.nama}</Link>
                      </td>
                      <td>{samarkanNik(row.nik)}</td>
                      <td>{GENDER_LABELS[row.gender]}</td>
                      <td>{row.umur === null ? "—" : `${row.umur} tahun`}</td>
                      <td>{row.alamat || "—"}</td>
                      <td>{row.wilayah ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <footer className="data-pagination">
              <span>
                Menampilkan {angka.format(data.rows.length)} penduduk pada kelompok “{data.kelompok}
                ”.
              </span>
              <Link href={kembali}>Kembali ke statistik</Link>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
