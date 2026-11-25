import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { resolveVillageId } from "@/features/desa/application/resolve-village";
import { daftarIdm, daftarTahunIdm } from "@/features/idm/application/idm-use-cases";
import {
  dimensiDariKode,
  formatSkor,
  hitungRekapIdm,
  IDM_DIMENSI,
  IDM_RESOURCE,
} from "@/features/idm/domain/idm";
import { hasPermission } from "@/features/rbac/application/authorization";
import { RESOURCES } from "@/features/rbac/domain/resources";
import { requirePermission } from "@/lib/dal";

import { SinkronIdmForm } from "../../status-desa/sinkron-form";

export const metadata: Metadata = { title: "IDM Desa" };

function labelDimensi(kode: string): string {
  const dimensi = IDM_DIMENSI.find((item) => item.id === dimensiDariKode(kode));
  return dimensi ? `${dimensi.kode} · ${dimensi.label}` : "—";
}

/**
 * Halaman pantau IDM & SDGs.
 *
 * Data tidak diisi manual: indikator IDM dan capaian SDGs ditarik dari API
 * Kemendesa lewat tombol sinkronisasi pada halaman Status Desa. Halaman ini
 * hanya menampilkan data tersimpan dan menyediakan ekspor.
 */
export default async function IdmPage({
  searchParams,
}: {
  searchParams: Promise<{ tahun?: string }>;
}) {
  const params = await searchParams;
  const user = await requirePermission(IDM_RESOURCE, "read");
  const villageId = await resolveVillageId(user);

  // Sinkronisasi menulis data IDM, jadi izin Status Desa dan izin modul IDM
  // harus dimiliki bersama (sama seperti di halaman Status Desa).
  const bolehSinkronIdm =
    hasPermission(user.permissions, RESOURCES.statusDesa, "update") &&
    hasPermission(user.permissions, IDM_RESOURCE, "update");

  const tahunIdm = await daftarTahunIdm(villageId);
  const tahunTersedia = [...new Set(tahunIdm)].sort((a, b) => b - a);
  const tahunDiminta = Number.parseInt(params.tahun ?? "", 10);
  const tahun =
    Number.isInteger(tahunDiminta) && tahunDiminta > 2000
      ? tahunDiminta
      : (tahunTersedia[0] ?? new Date().getFullYear());

  const indikator = await daftarIdm(villageId, tahun);
  const rekap = hitungRekapIdm(indikator);

  return (
    <div className="modul-page">
      <PageHeading>
        <header className="page-heading">
          <div>
            <h1>IDM Desa</h1>
            <p>Skor indikator IDM per dimensi hasil tarikan API Kemendesa.</p>
          </div>
          <div className="page-heading-actions">
            <Link className="button button-secondary" href={`/desa/idm/ekspor?tahun=${tahun}`}>
              Unduh CSV
            </Link>
          </div>
        </header>
      </PageHeading>

      <p className="alert alert-info">
        Data IDM tidak diisi manual di halaman ini. Tarik datanya dari API Kemendesa dengan tombol{" "}
        <strong>Sinkronkan IDM</strong> di bawah ini.
      </p>

      <div className="dashboard-stats">
        <article className="modul-card">
          <span>Skor IDM {tahun}</span>
          <strong>{formatSkor(rekap.skor)}</strong>
          <small>{rekap.status ?? "Belum dinilai"}</small>
        </article>
        <article className="modul-card">
          <span>Indikator terisi</span>
          <strong>{rekap.jumlahIndikator}</strong>
          <small>Dari {indikator.length} baris tersimpan</small>
        </article>
      </div>

      <section className="modul-card">
        <form className="modul-filter-row" method="get">
          <label>
            Tahun penilaian
            <input type="number" name="tahun" min="2000" max="2100" defaultValue={tahun} />
          </label>
          <button className="button button-primary" type="submit">
            Tampilkan
          </button>
        </form>
        <p className="modul-muted">
          {tahunTersedia.length
            ? `Tahun tersedia: ${tahunTersedia.join(", ")}`
            : "Belum ada data IDM yang tersimpan."}
        </p>
        {bolehSinkronIdm ? (
          <div className="sd-sinkron-baris">
            <SinkronIdmForm tahun={tahun} />
          </div>
        ) : null}
      </section>

      <section className="modul-card">
        <h2>Rekap Dimensi IDM</h2>
        <p className="modul-muted">
          Hanya indikator dengan kode berdimensi (I.x, II.x, III.x, atau IKS/IKE/IKL) yang dihitung.
        </p>
        <div className="modul-scroll">
          <table className="modul-table">
            <thead>
              <tr>
                <th>Dimensi</th>
                <th>Jumlah indikator</th>
                <th>Skor</th>
              </tr>
            </thead>
            <tbody>
              {rekap.dimensi.map((dimensi) => (
                <tr key={dimensi.id}>
                  <td>
                    <strong>{dimensi.kode}</strong>{" "}
                    <span className="modul-muted">{dimensi.label}</span>
                  </td>
                  <td className="modul-angka">{dimensi.jumlahIndikator}</td>
                  <td className="modul-angka">{formatSkor(dimensi.skor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="modul-card">
        <div>
          <h2>Indikator IDM {tahun}</h2>
          <p className="modul-muted">
            {indikator.length} indikator tersimpan pada tahun ini. Kode yang tidak dikenali tetap
            disimpan, tetapi tidak masuk rekap dimensi.
          </p>
        </div>
        {indikator.length === 0 ? (
          <p className="modul-empty">
            <strong>Belum ada indikator</strong>
            <span className="modul-muted">
              Sinkronkan data IDM dari halaman Status Desa untuk mengisi tahun {tahun}.
            </span>
          </p>
        ) : (
          <div className="modul-scroll">
            <table className="modul-table">
              <thead>
                <tr>
                  <th>Kode &amp; nama</th>
                  <th>Dimensi</th>
                  <th>Kategori</th>
                  <th>Skor</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {indikator.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.kode}</strong>
                      <small className="modul-muted">{row.nama}</small>
                    </td>
                    <td>{labelDimensi(row.kode)}</td>
                    <td>{row.kategori ?? "—"}</td>
                    <td className="modul-angka">{row.skor ?? "—"}</td>
                    <td>{row.keterangan ?? "—"}</td>
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
