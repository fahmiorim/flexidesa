import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";

import { PageHeading } from "@/components/shell/page-heading";
import {
  dimensiDariKode,
  formatSkor,
  formatSkorRujukan,
  hitungRekapIdm,
  IDM_DIMENSI,
} from "@/features/idm/domain/idm";
import { getStatusDesaData } from "@/features/status-desa/application/status-desa-use-cases";

import { SinkronIdmForm } from "./sinkron-form";

export const metadata: Metadata = { title: "Status Desa" };

/** Ubah skor 0–1 menjadi lebar bar 0–100%. */
function lebarBar(skor: number | null): number {
  if (skor === null) return 0;
  return Math.min(100, Math.max(0, skor * 100));
}

export default async function StatusDesaPage({
  searchParams,
}: {
  searchParams: Promise<{ tahun?: string }>;
}) {
  const params = await searchParams;
  const tahunDiminta = Number.parseInt(params.tahun ?? "", 10);
  const { tahun, tahunTersedia, identitas, indikator, ringkasan, akses } = await getStatusDesaData(
    Number.isInteger(tahunDiminta) ? tahunDiminta : undefined,
  );

  const pilihanTahun = [...new Set([tahun, ...tahunTersedia])].sort((a, b) => b - a);
  const rekap = hitungRekapIdm(indikator);
  const bolehLihatIdm = akses.idmBaca;
  const adaData = indikator.length > 0;
  const skorMinimal = ringkasan?.skorMinimal ? Number(ringkasan.skorMinimal) : null;
  const skorApi = ringkasan?.skorApi ? Number(ringkasan.skorApi) : null;
  const perubahanSkor = ringkasan?.penambahan ? Number(ringkasan.penambahan) : null;
  const targetStatus = ringkasan?.targetStatus;
  // Rincian dikelompokkan per dimensi agar puluhan indikator mudah dibaca.
  const grupIndikator = [
    ...IDM_DIMENSI.map((dimensi) => ({
      kunci: dimensi.id,
      judul: `${dimensi.kode} · ${dimensi.label}`,
      baris: indikator.filter((row) => dimensiDariKode(row.kode) === dimensi.id),
    })),
    {
      kunci: "lainnya",
      judul: "Indikator lain",
      baris: indikator.filter((row) => dimensiDariKode(row.kode) === null),
    },
  ].filter((grup) => grup.baris.length > 0);
  const waktuSinkron = ringkasan?.disinkronkanPada
    ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(
        ringkasan.disinkronkanPada,
      )
    : null;

  return (
    <div className="modul-page pemerintahan-page pemerintahan-halaman status-desa-page">
      <PageHeading>
        <header className="page-heading">
          <div>
            <h1>Status Desa</h1>
            <p>Skor dan status IDM desa dari data Kemendesa.</p>
          </div>
          {bolehLihatIdm ? (
            <div className="page-heading-actions">
              <Link className="button button-secondary" href={`/desa/idm?tahun=${tahun}`}>
                Lihat IDM &amp; SDGs
              </Link>
              <Link className="button button-secondary" href={`/desa/idm/ekspor?tahun=${tahun}`}>
                Unduh CSV
              </Link>
            </div>
          ) : null}
        </header>
      </PageHeading>

      <section aria-label="Ringkasan status desa" className="sd-kpi">
        <article className="wilayah-kpi-kartu is-utama">
          <div className="wilayah-kpi-kepala">
            <span aria-hidden="true" className="wilayah-kpi-ikon">
              ★
            </span>
            <span className="wilayah-kpi-label">Skor IDM {tahun}</span>
          </div>
          <strong className="wilayah-kpi-nilai">{formatSkor(rekap.skor)}</strong>
          <small className="wilayah-kpi-catatan">{rekap.status ?? "Belum dinilai"}</small>
          <div aria-hidden className="pd-bar">
            <span style={{ width: `${lebarBar(rekap.skor)}%` }} />
          </div>
        </article>
        <article className="wilayah-kpi-kartu">
          <div className="wilayah-kpi-kepala">
            <span aria-hidden="true" className="wilayah-kpi-ikon is-biru">
              ▤
            </span>
            <span className="wilayah-kpi-label">Status IDM</span>
          </div>
          <strong className="wilayah-kpi-nilai sd-status">{rekap.status ?? "—"}</strong>
          <small className="wilayah-kpi-catatan">Klasifikasi skor tiga dimensi</small>
        </article>
        <article className="wilayah-kpi-kartu">
          <div className="wilayah-kpi-kepala">
            <span aria-hidden="true" className="wilayah-kpi-ikon is-hijau">
              ↗
            </span>
            <span className="wilayah-kpi-label">Skor minimal</span>
          </div>
          <strong className="wilayah-kpi-nilai">{formatSkorRujukan(skorMinimal)}</strong>
          <small className="wilayah-kpi-catatan">Agar naik ke target status</small>
        </article>
        <article className="wilayah-kpi-kartu">
          <div className="wilayah-kpi-kepala">
            <span aria-hidden="true" className="wilayah-kpi-ikon">
              ◎
            </span>
            <span className="wilayah-kpi-label">Target status</span>
          </div>
          <strong className="wilayah-kpi-nilai sd-target">{targetStatus ?? "—"}</strong>
          <small className="wilayah-kpi-catatan">
            {ringkasan ? "Dari API Kemendesa" : "Belum disinkronkan"}
          </small>
        </article>
        <article className="wilayah-kpi-kartu">
          <div className="wilayah-kpi-kepala">
            <span aria-hidden="true" className="wilayah-kpi-ikon is-biru">
              ⇄
            </span>
            <span className="wilayah-kpi-label">Skor API Kemendesa</span>
          </div>
          <strong className="wilayah-kpi-nilai">{formatSkorRujukan(skorApi)}</strong>
          <small className="wilayah-kpi-catatan">
            {ringkasan?.statusApi ?? "Belum disinkronkan"}
          </small>
        </article>
        <article className="wilayah-kpi-kartu">
          <div className="wilayah-kpi-kepala">
            <span aria-hidden="true" className="wilayah-kpi-ikon is-hijau">
              Δ
            </span>
            <span className="wilayah-kpi-label">Perubahan skor</span>
          </div>
          <strong className="wilayah-kpi-nilai">{formatSkorRujukan(perubahanSkor)}</strong>
          <small className="wilayah-kpi-catatan">
            {perubahanSkor === null
              ? "Belum ada pembanding tahun sebelumnya"
              : perubahanSkor < 0
                ? "Turun dibanding tahun sebelumnya"
                : "Naik dibanding tahun sebelumnya"}
          </small>
        </article>
        <article className="wilayah-kpi-kartu">
          <div className="wilayah-kpi-kepala">
            <span aria-hidden="true" className="wilayah-kpi-ikon is-hijau">
              ≡
            </span>
            <span className="wilayah-kpi-label">Indikator IDM</span>
          </div>
          <strong className="wilayah-kpi-nilai">{rekap.jumlahIndikator}</strong>
          <small className="wilayah-kpi-catatan">dari {indikator.length} baris tersimpan</small>
        </article>
      </section>

      <section className="pd-panel sd-tahun-panel">
        <div className="sd-tahun-baris">
          <form className="sd-tahun-form" method="get">
            <label>
              Tahun penilaian
              <select defaultValue={tahun} name="tahun">
                {pilihanTahun.map((nilai) => (
                  <option key={nilai} value={nilai}>
                    {nilai}
                  </option>
                ))}
              </select>
            </label>
            <button className="button button-primary" type="submit">
              Tampilkan
            </button>
          </form>
          <p>
            {tahunTersedia.length
              ? `Tahun tersedia: ${tahunTersedia.join(", ")}`
              : "Belum ada data IDM yang tersimpan."}
          </p>
        </div>
        <div className="sd-sinkron-baris">
          {akses.sinkron ? <SinkronIdmForm tahun={tahun} /> : null}
          <p>
            {waktuSinkron
              ? `Data IDM API Kemendesa terakhir disinkronkan ${waktuSinkron}.`
              : "Data IDM dapat diperbarui dari API Kemendesa."}
          </p>
        </div>
        <div className="sd-identitas">
          <span>
            <small>Provinsi</small>
            <strong>{identitas?.namaPropinsi ?? "—"}</strong>
          </span>
          <span>
            <small>Kabupaten/Kota</small>
            <strong>{identitas?.namaKabupaten ?? "—"}</strong>
          </span>
          <span>
            <small>Kecamatan</small>
            <strong>{identitas?.namaKecamatan ?? "—"}</strong>
          </span>
          <span>
            <small>Desa</small>
            <strong>{identitas?.namaDesa ?? "—"}</strong>
          </span>
          <span>
            <small>Kode Desa</small>
            <strong>{identitas?.kodeDesa ?? "—"}</strong>
          </span>
        </div>
      </section>

      {adaData ? null : (
        <section className="pd-panel sd-kosong">
          <h2>Belum ada data status</h2>
          <p>Tarik data lewat tombol Sinkronkan; status dihitung dari rata-rata IDM dan SDGs.</p>
        </section>
      )}

      <section className="pd-panel">
        <div className="pd-panel-kepala">
          <div>
            <h2>Dimensi IDM</h2>
            <p>Skor tiap dimensi dihitung dari rata-rata indikator yang berkode dimensi.</p>
          </div>
          {bolehLihatIdm ? (
            <Link className="button button-ghost" href={`/desa/idm?tahun=${tahun}`}>
              Rincian indikator
            </Link>
          ) : null}
        </div>
        <div className="sd-dimensi-grid">
          {rekap.dimensi.map((dimensi) => (
            <article className="sd-dimensi" key={dimensi.id}>
              <span>{dimensi.kode}</span>
              <strong>{formatSkor(dimensi.skor)}</strong>
              <small>{dimensi.label}</small>
              <div aria-hidden className="pd-bar">
                <span style={{ width: `${lebarBar(dimensi.skor)}%` }} />
              </div>
              <em>{dimensi.jumlahIndikator} indikator</em>
            </article>
          ))}
        </div>
      </section>

      <details className="pd-panel sd-rincian">
        <summary>
          <span>
            <strong>Rincian indikator IDM</strong>
            <small>
              Indikator dikelompokkan per dimensi beserta skor dan keterangannya pada tahun {tahun}.
            </small>
          </span>
          <span className="pd-panel-jumlah">{indikator.length} baris</span>
        </summary>
        {indikator.length ? (
          <div className="modul-scroll sd-tabel">
            <table className="modul-table">
              <thead>
                <tr>
                  <th className="modul-angka">No</th>
                  <th>Kode</th>
                  <th>Indikator</th>
                  <th className="modul-angka">Skor</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {grupIndikator.map((grup) => (
                  <Fragment key={grup.kunci}>
                    <tr className="sd-tabel-grup">
                      <td colSpan={5}>
                        {grup.judul} — {grup.baris.length} indikator
                      </td>
                    </tr>
                    {grup.baris.map((row, index) => (
                      <tr key={row.id}>
                        <td className="modul-angka">{index + 1}</td>
                        <td>
                          <strong>{row.kode}</strong>
                        </td>
                        <td>{row.nama}</td>
                        <td className="modul-angka">{row.skor ?? "—"}</td>
                        <td className="sd-tabel-keterangan">{row.keterangan ?? "—"}</td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="modul-empty">Belum ada indikator IDM untuk tahun ini.</p>
        )}
      </details>
    </div>
  );
}
