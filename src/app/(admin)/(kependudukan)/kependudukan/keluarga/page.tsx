import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { StatIcon } from "@/components/ui/stat-icon";
import {
  getKeluargaReference,
  getRingkasanKeluarga,
  listKeluarga,
} from "@/features/kependudukan/keluarga/application/use-cases";
import {
  formatTanggalKeluarga,
  KELUARGA_RESOURCE,
  KELUARGA_STATUS_FILTERS,
  KELUARGA_STATUS_LABELS,
  parseKeluargaNumbers,
  type KeluargaStatusFilter,
} from "@/features/kependudukan/keluarga/domain/keluarga";
import {
  GENDER_LABELS,
  LIFE_STATUS_LABELS,
} from "@/features/kependudukan/penduduk/domain/penduduk";
import { RUMAH_TANGGA_RESOURCE } from "@/features/kependudukan/rumah-tangga/domain/rumah-tangga";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import { PilihSemuaKeluarga, ToolbarAksiKeluarga } from "./toolbar-aksi";

export const metadata: Metadata = { title: "Kartu Keluarga" };
const number = new Intl.NumberFormat("id-ID");

function pilihanStatus(value: string | undefined): KeluargaStatusFilter {
  return KELUARGA_STATUS_FILTERS.includes(value as KeluargaStatusFilter)
    ? (value as KeluargaStatusFilter)
    : "all";
}

function inisial(nama: string): string {
  const kata = nama.trim().split(/\s+/).filter(Boolean);
  if (kata.length === 0) return "KK";
  return kata
    .slice(0, 2)
    .map((bagian) => bagian.charAt(0).toUpperCase())
    .join("");
}

function persenBagian(nilai: number, total: number): number {
  return total > 0 ? Math.round((nilai / total) * 100) : 0;
}

function nomorHalaman(sekarang: number, total: number): number[] {
  const mulai = Math.max(1, Math.min(sekarang - 2, total - 4));
  const akhir = Math.min(total, mulai + 4);
  return Array.from({ length: akhir - mulai + 1 }, (_, index) => mulai + index);
}

export default async function KeluargaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, user, reference, ringkasan] = await Promise.all([
    searchParams,
    verifySession(),
    getKeluargaReference(),
    getRingkasanKeluarga(),
  ]);
  const bolehUbah = hasPermission(user.permissions, KELUARGA_RESOURCE, "update");
  const bolehTambah = hasPermission(user.permissions, KELUARGA_RESOURCE, "create");
  const bolehHapus = hasPermission(user.permissions, KELUARGA_RESOURCE, "delete");
  const bolehRtm = bolehUbah && hasPermission(user.permissions, RUMAH_TANGGA_RESOURCE, "create");
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const status = pilihanStatus(typeof params.status === "string" ? params.status : undefined);
  const genderRaw = typeof params.gender === "string" ? params.gender : "all";
  const gender = genderRaw === "male" || genderRaw === "female" ? genderRaw : "all";
  const regionRaw = typeof params.regionId === "string" ? Number(params.regionId) : NaN;
  const regionId = Number.isInteger(regionRaw) && regionRaw > 0 ? regionRaw : null;
  const temporaryOnly = params.temporary === "1";
  const programRaw = typeof params.program === "string" ? Number(params.program) : NaN;
  const programId = Number.isInteger(programRaw) && programRaw > 0 ? programRaw : null;
  const numbersRaw = typeof params.numbers === "string" ? params.numbers.slice(0, 500) : "";
  const numbers = parseKeluargaNumbers(numbersRaw);
  const pageRaw = typeof params.page === "string" ? Number(params.page) : 1;
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const query = {
    search: q,
    status,
    gender,
    regionId,
    temporaryOnly,
    programId,
    numbers,
    pageSize: 10,
  } as const;
  const initial = await listKeluarga({ ...query, page });
  const result =
    page > initial.pageCount ? await listKeluarga({ ...query, page: initial.pageCount }) : initial;

  const filterParams = new URLSearchParams();
  if (q) filterParams.set("q", q);
  if (status !== "all") filterParams.set("status", status);
  if (gender !== "all") filterParams.set("gender", gender);
  if (regionId !== null) filterParams.set("regionId", String(regionId));
  if (temporaryOnly) filterParams.set("temporary", "1");
  if (programId !== null) filterParams.set("program", String(programId));
  if (numbers.length > 0) filterParams.set("numbers", numbers.join(","));
  const filterSuffix = filterParams.toString() ? `?${filterParams.toString()}` : "";
  const filterLanjutanAktif = [
    gender !== "all",
    programId !== null,
    numbers.length > 0,
    temporaryOnly,
  ].filter(Boolean).length;
  const pageHref = (target: number) => {
    const next = new URLSearchParams(filterParams);
    if (target > 1) next.set("page", String(target));
    return next.toString() ? `?${next.toString()}` : "?";
  };

  const selesaiPindah = typeof params.pindah === "string" ? Number(params.pindah) : null;
  const dibuatRtm = typeof params.rtm === "string" ? Number(params.rtm) : null;
  const dilewatiRtm = typeof params.rtmSkip === "string" ? Number(params.rtmSkip) : 0;
  const dihapus = typeof params.dihapus === "string" ? Number(params.dihapus) : null;
  const dilewatiHapus = typeof params.hapusSkip === "string" ? Number(params.hapusSkip) : 0;
  const dihapusSatuan = params.deleted === "1";
  const mulai = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const akhir = Math.min(result.page * result.pageSize, result.total);

  return (
    <div className="modul-page penduduk-page data-kependudukan-page keluarga-page">
      <PageHeading
        judul={<>Kartu Keluarga</>}
        deskripsi={<>Kelola keluarga, anggota, dan rumah tangga desa.</>}
      />

      {selesaiPindah !== null && selesaiPindah > 0 ? (
        <div className="alert alert-success" role="status">
          {number.format(selesaiPindah)} Kartu Keluarga berhasil dipindahkan ke wilayah baru.
        </div>
      ) : null}
      {dihapusSatuan ? (
        <div className="alert alert-success" role="status">
          Kartu Keluarga berhasil dihapus.
        </div>
      ) : null}
      {dibuatRtm !== null ? (
        <div
          className={dibuatRtm > 0 ? "alert alert-success" : "alert alert-error"}
          role={dibuatRtm > 0 ? "status" : "alert"}
        >
          {dibuatRtm > 0
            ? `${number.format(dibuatRtm)} Kartu Keluarga berhasil dibuatkan Rumah Tangga (RTM).`
            : "Tidak ada KK yang dapat dibuatkan RTM."}
          {dilewatiRtm > 0
            ? ` ${number.format(dilewatiRtm)} KK dilewati karena kepala keluarga tidak hidup, tidak ditemukan, atau sudah terdaftar di RTM lain.`
            : null}
        </div>
      ) : null}
      {dihapus !== null ? (
        <div
          className={dihapus > 0 ? "alert alert-success" : "alert alert-error"}
          role={dihapus > 0 ? "status" : "alert"}
        >
          {dihapus > 0
            ? `${number.format(dihapus)} Kartu Keluarga kosong berhasil dihapus.`
            : "Tidak ada KK kosong yang dapat dihapus."}
          {dilewatiHapus > 0
            ? ` ${number.format(dilewatiHapus)} KK dilewati karena masih memiliki anggota.`
            : null}
        </div>
      ) : null}

      <div className="penduduk-kpi-grid">
        <article className="penduduk-kpi" data-tone="ungu">
          <StatIcon>
            <path d="M4 20V9.5L12 4l8 5.5V20" />
            <path d="M9 20v-6h6v6" />
          </StatIcon>
          <div>
            <span>Total Kartu Keluarga</span>
            <strong>{number.format(ringkasan.total)}</strong>
            <small>Terdaftar di desa ini</small>
          </div>
        </article>
        <article className="penduduk-kpi" data-tone="biru">
          <StatIcon>
            <circle cx="9" cy="8" r="3.2" />
            <path d="M2.8 20a6.2 6.2 0 0 1 12.4 0" />
            <path d="M16.4 5.6a3.2 3.2 0 0 1 0 6.4" />
          </StatIcon>
          <div>
            <span>KK Aktif</span>
            <strong>{number.format(ringkasan.active)}</strong>
            <small>
              {persenBagian(ringkasan.active, ringkasan.total)}% memiliki kepala keluarga hidup
            </small>
            <div className="penduduk-kpi-meter" aria-hidden="true">
              <span style={{ width: `${persenBagian(ringkasan.active, ringkasan.total)}%` }} />
            </div>
          </div>
        </article>
        <article className="penduduk-kpi" data-tone="oranye">
          <StatIcon>
            <path d="M12 3v18M3 12h18" />
            <circle cx="12" cy="12" r="8.5" />
          </StatIcon>
          <div>
            <span>KK Sementara</span>
            <strong>{number.format(ringkasan.temporary)}</strong>
            <small>Nomor menunggu KK permanen</small>
          </div>
        </article>
        <article className="penduduk-kpi" data-tone="ungu">
          <StatIcon>
            <circle cx="12" cy="7.5" r="3.5" />
            <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
          </StatIcon>
          <div>
            <span>Anggota Hidup</span>
            <strong>{number.format(ringkasan.members)}</strong>
            <small>Seluruh anggota dari semua KK</small>
          </div>
        </article>
      </div>

      <section className="platform-card penduduk-card keluarga-card">
        <div className="penduduk-card-head">
          <div>
            <h2>Daftar Kartu Keluarga</h2>
            <p>
              {number.format(result.total)} KK
              {filterSuffix ? " sesuai filter" : " terdaftar"} · menampilkan {mulai}–{akhir}
            </p>
          </div>
          {filterSuffix ? (
            <Link className="penduduk-reset" href="/kependudukan/keluarga">
              Reset semua filter
            </Link>
          ) : null}
        </div>

        <form className="penduduk-filter keluarga-filter" method="get">
          <label className="penduduk-search keluarga-search">
            <span>Cari KK</span>
            <input
              defaultValue={q}
              name="q"
              placeholder="Nomor KK, kepala keluarga, NIK, atau alamat"
              type="search"
            />
          </label>
          <label>
            <span>Status KK</span>
            <select defaultValue={status} name="status">
              {KELUARGA_STATUS_FILTERS.map((value) => (
                <option key={value} value={value}>
                  {KELUARGA_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Wilayah</span>
            <select defaultValue={regionId === null ? "" : String(regionId)} name="regionId">
              <option value="">Semua wilayah</option>
              {reference.regions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <details className="keluarga-filter-menu" open={filterLanjutanAktif > 0}>
            <summary className="keluarga-filter-toggle">
              <span>Filter lainnya</span>
              {filterLanjutanAktif > 0 ? (
                <span className="keluarga-filter-count">{filterLanjutanAktif}</span>
              ) : null}
            </summary>
            <div className="keluarga-filter-panel">
              <div className="keluarga-filter-panel-head">
                <strong>Filter lainnya</strong>
                <span>Gunakan hanya bila perlu.</span>
              </div>
              <div className="keluarga-filter-panel-grid">
                <label>
                  <span>Kepala keluarga</span>
                  <select defaultValue={gender} name="gender">
                    <option value="all">Semua jenis kelamin</option>
                    <option value="male">Laki-laki</option>
                    <option value="female">Perempuan</option>
                  </select>
                </label>
                <label>
                  <span>Program bantuan</span>
                  <select defaultValue={programId === null ? "" : String(programId)} name="program">
                    <option value="">Semua program</option>
                    {reference.bantuanPrograms.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="keluarga-filter-numbers">
                  <span>Kumpulan nomor KK</span>
                  <input
                    defaultValue={numbersRaw}
                    name="numbers"
                    placeholder="Pisahkan dengan koma"
                  />
                </label>
                <label className="keluarga-filter-check">
                  <input
                    defaultChecked={temporaryOnly}
                    name="temporary"
                    type="checkbox"
                    value="1"
                  />
                  <span>Hanya KK sementara</span>
                </label>
              </div>
            </div>
          </details>
          <div className="penduduk-filter-aksi keluarga-filter-aksi">
            <button className="button button-primary" type="submit">
              Terapkan
            </button>
            <Link className="button button-secondary" href="/kependudukan/keluarga">
              Bersihkan
            </Link>
          </div>
        </form>

        <ToolbarAksiKeluarga
          adaData={result.rows.length > 0}
          bolehHapus={bolehHapus}
          cetakDaftarHref={`/kependudukan/keluarga/cetak-daftar${filterSuffix}`}
          unduhDaftarHref={`/kependudukan/keluarga/unduh-daftar${filterSuffix}`}
          bolehRtm={bolehRtm}
          bolehTambah={bolehTambah}
          bolehUbah={bolehUbah}
          exportHref={`/kependudukan/keluarga/ekspor${filterSuffix}`}
          regions={reference.regions}
        />

        {result.rows.length ? (
          <div className="modul-scroll">
            <table className="modul-table penduduk-table keluarga-table">
              <thead>
                <tr>
                  <th className="keluarga-check-cell" scope="col">
                    <PilihSemuaKeluarga />
                  </th>
                  <th scope="col">No</th>
                  <th scope="col">Kartu Keluarga</th>
                  <th scope="col">Kepala Keluarga</th>
                  <th scope="col">Anggota</th>
                  <th scope="col">Domisili</th>
                  <th scope="col">Status</th>
                  <th scope="col">Cetak</th>
                  <th scope="col">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, index) => {
                  const avatar = inisial(row.headName ?? "KK");
                  const statusKepala = row.headLifeStatus
                    ? LIFE_STATUS_LABELS[row.headLifeStatus]
                    : "Belum ada kepala";
                  const toneKepala = row.headLifeStatus
                    ? row.headLifeStatus === "alive"
                      ? "hijau"
                      : "oranye"
                    : "netral";
                  return (
                    <tr key={row.id}>
                      <td className="keluarga-check-cell">
                        <input
                          aria-label={`Pilih KK ${row.number}`}
                          name="familyIds"
                          type="checkbox"
                          value={row.id}
                        />
                      </td>
                      <td className="penduduk-nomor">{mulai + index}</td>
                      <td>
                        <div className="keluarga-number-cell">
                          <span className="keluarga-kk-number">{row.number}</span>
                          {row.temporary ? (
                            <span className="beranda-chip" data-tone="oranye">
                              Sementara
                            </span>
                          ) : null}
                          <small>
                            {formatTanggalKeluarga(row.registeredAt)
                              ? `Daftar ${formatTanggalKeluarga(row.registeredAt)}`
                              : "Tanggal daftar —"}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div className="penduduk-identitas">
                          <span
                            aria-hidden="true"
                            className={
                              row.headGender === "female"
                                ? "penduduk-avatar is-female"
                                : "penduduk-avatar"
                            }
                          >
                            {avatar}
                          </span>
                          <div className="keluarga-head-copy">
                            {row.headName ? (
                              <Link
                                className="penduduk-nama"
                                href={`/kependudukan/keluarga/${row.id}`}
                              >
                                {row.headName}
                              </Link>
                            ) : (
                              <span className="penduduk-nama">Belum ditentukan</span>
                            )}
                            <span className="penduduk-nik">
                              {row.headNationalId ?? "NIK belum diisi"}
                            </span>
                            {row.headIdCardTag ? (
                              <small className="modul-muted">Tag ID {row.headIdCardTag}</small>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="keluarga-member-count">
                          {number.format(row.memberCount)}
                        </span>
                        <small className="modul-muted"> orang</small>
                      </td>
                      <td>
                        <div className="keluarga-domisili">
                          <span>{row.address ?? "Alamat belum diisi"}</span>
                          <small>{row.regionLabel ?? "Wilayah belum ditentukan"}</small>
                        </div>
                      </td>
                      <td>
                        <span className="beranda-chip" data-tone={toneKepala}>
                          {statusKepala}
                        </span>
                        {row.headGender ? (
                          <small className="modul-muted keluarga-gender">
                            {GENDER_LABELS[row.headGender]}
                          </small>
                        ) : null}
                      </td>
                      <td>
                        {row.cardPrintedAt ? (
                          <span>{formatTanggalKeluarga(row.cardPrintedAt)}</span>
                        ) : (
                          <span className="beranda-chip" data-tone="netral">
                            Belum dicetak
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="keluarga-row-actions">
                          <Link className="penduduk-aksi" href={`/kependudukan/keluarga/${row.id}`}>
                            Detail
                          </Link>
                          <Link
                            className="penduduk-aksi"
                            href={`/kependudukan/keluarga/${row.id}/pdf`}
                            target="_blank"
                          >
                            Cetak
                          </Link>
                          {bolehUbah ? (
                            <Link
                              className="penduduk-aksi"
                              href={`/kependudukan/keluarga/${row.id}/ubah`}
                            >
                              Ubah
                            </Link>
                          ) : null}
                          {bolehUbah &&
                          row.headLifeStatus &&
                          row.headLifeStatus !== "alive" &&
                          row.memberCount > 0 ? (
                            <Link
                              className="penduduk-aksi"
                              href={`/kependudukan/keluarga/${row.id}/pecah`}
                            >
                              Pecah
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="modul-empty">
            {filterSuffix
              ? "Tidak ada KK yang cocok dengan filter. Ubah kata kunci atau bersihkan filter."
              : "Belum ada data Kartu Keluarga pada desa ini."}
          </p>
        )}

        <div className="penduduk-footer">
          <span>
            {result.total === 0
              ? "Tidak ada data"
              : `Menampilkan ${number.format(mulai)}–${number.format(akhir)} dari ${number.format(result.total)} KK`}
          </span>
          {result.pageCount > 1 ? (
            <nav aria-label="Navigasi halaman Kartu Keluarga" className="penduduk-pagination">
              {result.page > 1 ? (
                <Link className="penduduk-page-arrow" href={pageHref(result.page - 1)}>
                  ‹
                </Link>
              ) : (
                <span aria-disabled="true" className="penduduk-page-arrow" data-disabled="true">
                  ‹
                </span>
              )}
              {nomorHalaman(result.page, result.pageCount).map((nomor) => (
                <Link
                  aria-current={nomor === result.page ? "page" : undefined}
                  className="penduduk-page-link"
                  href={pageHref(nomor)}
                  key={nomor}
                >
                  {nomor}
                </Link>
              ))}
              {result.page < result.pageCount ? (
                <Link className="penduduk-page-arrow" href={pageHref(result.page + 1)}>
                  ›
                </Link>
              ) : (
                <span aria-disabled="true" className="penduduk-page-arrow" data-disabled="true">
                  ›
                </span>
              )}
            </nav>
          ) : null}
        </div>
      </section>
    </div>
  );
}
