import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { StatIcon } from "@/components/ui/stat-icon";
import {
  getPendudukFilterOptionsData,
  getRingkasanPendudukData,
  listPenduduk,
} from "@/features/penduduk/application/use-cases";
import {
  calculateAge,
  filterKeSearchParams,
  GENDER_LABELS,
  hitungFilterPenduduk,
  LIFE_STATUS_LABELS,
  parseFilterPenduduk,
  PENDUDUK_RESOURCE,
  RESIDENCE_STATUS_LABELS,
  RESIDENCE_STATUSES,
  samarkanNik,
  type PendudukFilter,
  type PendudukListRow,
} from "@/features/penduduk/domain/penduduk";
import { hasPermission } from "@/features/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import { DialogImporPenduduk } from "./dialog-impor-penduduk";

export const metadata: Metadata = {
  title: "Data Penduduk",
};

const PER_HALAMAN = 10;
const angka = new Intl.NumberFormat("id-ID");
const tanggal = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function halamanDari(value: string | string[] | undefined): number {
  const teks = Array.isArray(value) ? value[0] : value;
  const parsed = Number(teks);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function tautanHalaman(filter: PendudukFilter, halaman: number): string {
  const query = filterKeSearchParams(filter);
  if (halaman > 1) query.set("page", String(halaman));
  const value = query.toString();
  return value ? `/penduduk?${value}` : "/penduduk";
}

function tautanEkspor(filter: PendudukFilter): string {
  const value = filterKeSearchParams(filter).toString();
  return value ? `/penduduk/ekspor?${value}` : "/penduduk/ekspor";
}

function tautanEksporPdf(filter: PendudukFilter): string {
  const value = filterKeSearchParams(filter).toString();
  return value ? `/penduduk/ekspor/pdf?${value}` : "/penduduk/ekspor/pdf";
}

function toneStatus(row: PendudukListRow): "hijau" | "oranye" | "netral" {
  if (row.lifeStatus === "alive") return "hijau";
  if (row.lifeStatus === "deceased" || row.lifeStatus === "moved") return "oranye";
  return "netral";
}

/** Persentase bagian terhadap total, untuk meter komposisi KPI. */
function persenBagian(nilai: number, total: number): number {
  return total > 0 ? Math.round((nilai / total) * 100) : 0;
}

/** Inisial dua huruf untuk avatar baris tabel. */
function inisial(nama: string): string {
  const kata = nama.trim().split(/\s+/).filter(Boolean);
  return kata
    .slice(0, 2)
    .map((bagian) => bagian.charAt(0).toUpperCase())
    .join("");
}

function nomorHalaman(sekarang: number, total: number): number[] {
  const mulai = Math.max(1, Math.min(sekarang - 2, total - 4));
  const akhir = Math.min(total, mulai + 4);
  return Array.from({ length: akhir - mulai + 1 }, (_, index) => mulai + index);
}

export default async function PendudukPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filter = parseFilterPenduduk(params);
  const halamanDiminta = halamanDari(params.page);

  const [ringkasan, opsi, awal, user] = await Promise.all([
    getRingkasanPendudukData(),
    getPendudukFilterOptionsData(),
    listPenduduk({ filter, page: halamanDiminta, pageSize: PER_HALAMAN }),
    verifySession(),
  ]);
  const bolehTambah = hasPermission(user.permissions, PENDUDUK_RESOURCE, "update");
  const bolehImpor = hasPermission(user.permissions, PENDUDUK_RESOURCE, "create");

  // Halaman di luar rentang (mis. tautan lama setelah data menyusut) diarahkan
  // ke halaman terakhir, bukan menampilkan tabel kosong yang membingungkan.
  const hasil =
    halamanDiminta > awal.pageCount
      ? await listPenduduk({ filter, page: awal.pageCount, pageSize: PER_HALAMAN })
      : awal;

  const filterAktif = hitungFilterPenduduk(filter) + (filter.search ? 1 : 0);
  const jumlahFilterLanjutan = [
    filter.religionId,
    filter.educationId,
    filter.occupationId,
    filter.maritalStatusId,
    filter.umurMin,
    filter.umurMax,
  ].filter((nilai) => nilai !== null).length;
  const filterLanjutanAktif = jumlahFilterLanjutan > 0;
  const mulai = hasil.total === 0 ? 0 : (hasil.page - 1) * hasil.pageSize + 1;
  const akhir = Math.min(hasil.page * hasil.pageSize, hasil.total);

  return (
    <div className="modul-page penduduk-page data-kependudukan-page">
      <PageHeading>
        <div className="page-heading">
          <div>
            <h1>Data Penduduk</h1>
            <p>Kelola data penduduk desa, termasuk biodata, status, dan wilayah.</p>
          </div>
        </div>
      </PageHeading>

      <div className="penduduk-kpi-grid">
        <article className="penduduk-kpi" data-tone="ungu">
          <StatIcon>
            <circle cx="9" cy="8" r="3.2" />
            <path d="M2.8 20a6.2 6.2 0 0 1 12.4 0" />
            <path d="M16.4 5.6a3.2 3.2 0 0 1 0 6.4" />
          </StatIcon>
          <div>
            <span>Total Penduduk</span>
            <strong>{angka.format(ringkasan.total)}</strong>
            <small>Seluruh status kependudukan</small>
          </div>
        </article>
        <article className="penduduk-kpi" data-tone="biru">
          <StatIcon>
            <path d="M4 20V9.5L12 4l8 5.5V20" />
            <path d="M9 20v-6h6v6" />
          </StatIcon>
          <div>
            <span>Jumlah KK</span>
            <strong>{angka.format(ringkasan.keluarga)}</strong>
            <small>Kartu Keluarga terhubung</small>
          </div>
        </article>
        <article className="penduduk-kpi" data-tone="biru">
          <StatIcon>
            <circle cx="10" cy="10" r="4.2" />
            <path d="M13.2 13.2 20 20M17 17l2-2M15 15l2-2" />
          </StatIcon>
          <div>
            <span>Laki-laki</span>
            <strong>{angka.format(ringkasan.lakiLaki)}</strong>
            <small>{persenBagian(ringkasan.lakiLaki, ringkasan.total)}% dari total</small>
            <div className="penduduk-kpi-meter" aria-hidden="true">
              <span style={{ width: `${persenBagian(ringkasan.lakiLaki, ringkasan.total)}%` }} />
            </div>
          </div>
        </article>
        <article className="penduduk-kpi" data-tone="ungu">
          <StatIcon>
            <circle cx="12" cy="9" r="4.2" />
            <path d="M12 13.2V21M8.5 17.5h7" />
          </StatIcon>
          <div>
            <span>Perempuan</span>
            <strong>{angka.format(ringkasan.perempuan)}</strong>
            <small>{persenBagian(ringkasan.perempuan, ringkasan.total)}% dari total</small>
            <div className="penduduk-kpi-meter is-female" aria-hidden="true">
              <span style={{ width: `${persenBagian(ringkasan.perempuan, ringkasan.total)}%` }} />
            </div>
          </div>
        </article>
      </div>

      <section className="platform-card penduduk-card">
        <div className="penduduk-card-head">
          <div>
            <h2>Daftar Penduduk</h2>
            <p>
              {angka.format(hasil.total)} data{filterAktif > 0 ? " sesuai filter" : " terdaftar"}.
            </p>
          </div>
          <div className="penduduk-heading-actions penduduk-card-actions">
            {filterAktif > 0 ? (
              <Link className="penduduk-reset" href="/penduduk">
                Reset filter ({filterAktif})
              </Link>
            ) : null}
            <Link className="button button-secondary" href={tautanEkspor(filter)}>
              Ekspor CSV
            </Link>
            <Link className="button button-secondary" href={tautanEksporPdf(filter)}>
              Ekspor PDF
            </Link>
            {bolehImpor ? <DialogImporPenduduk /> : null}
            {bolehTambah ? (
              <Link className="button button-primary" href="/penduduk/baru">
                + Tambah Penduduk
              </Link>
            ) : null}
          </div>
        </div>

        <form className="penduduk-filter" method="get">
          <label className="penduduk-search">
            <span>Cari</span>
            <input
              defaultValue={filter.search}
              name="q"
              placeholder="NIK, nama, atau nomor KK"
              type="search"
            />
          </label>
          <label>
            <span>Status dasar</span>
            <select defaultValue={filter.lifeStatus ?? ""} name="status">
              <option value="">Semua status</option>
              {Object.entries(LIFE_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Status penduduk</span>
            <select defaultValue={filter.residenceStatus ?? ""} name="tempatTinggal">
              <option value="">Semua</option>
              {RESIDENCE_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {RESIDENCE_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Jenis kelamin</span>
            <select defaultValue={filter.gender ?? ""} name="gender">
              <option value="">Semua</option>
              {Object.entries(GENDER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Dusun</span>
            <select defaultValue={filter.dusun} name="dusun">
              <option value="">Semua dusun</option>
              {opsi.dusun.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>RW</span>
            <select defaultValue={filter.rw} name="rw">
              <option value="">Semua RW</option>
              {opsi.rw.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>RT</span>
            <select defaultValue={filter.rt} name="rt">
              <option value="">Semua RT</option>
              {opsi.rt.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <div className="penduduk-filter-aksi">
            <button className="button button-primary" type="submit">
              Terapkan
            </button>
            <Link className="button button-secondary" href="/penduduk">
              Bersihkan
            </Link>
          </div>

          <details className="penduduk-filter-lanjutan" open={filterLanjutanAktif}>
            <summary>
              Filter lanjutan
              {filterLanjutanAktif ? <span>{jumlahFilterLanjutan} aktif</span> : null}
            </summary>
            <div className="penduduk-filter-lanjutan-grid">
              <label>
                <span>Agama</span>
                <select defaultValue={filter.religionId ?? ""} name="religionId">
                  <option value="">Semua agama</option>
                  {opsi.religions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Pendidikan dalam KK</span>
                <select defaultValue={filter.educationId ?? ""} name="educationId">
                  <option value="">Semua pendidikan</option>
                  {opsi.educations.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Pekerjaan</span>
                <select defaultValue={filter.occupationId ?? ""} name="occupationId">
                  <option value="">Semua pekerjaan</option>
                  {opsi.occupations.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Status kawin</span>
                <select defaultValue={filter.maritalStatusId ?? ""} name="maritalStatusId">
                  <option value="">Semua status</option>
                  {opsi.maritalStatuses.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Umur minimal</span>
                <input
                  defaultValue={filter.umurMin ?? ""}
                  inputMode="numeric"
                  min={0}
                  name="umurMin"
                  placeholder="0"
                  type="number"
                />
              </label>
              <label>
                <span>Umur maksimal</span>
                <input
                  defaultValue={filter.umurMax ?? ""}
                  inputMode="numeric"
                  min={0}
                  name="umurMax"
                  placeholder="120"
                  type="number"
                />
              </label>
            </div>
          </details>
        </form>

        {hasil.rows.length === 0 ? (
          <p className="modul-empty">
            {filterAktif > 0
              ? "Tidak ada penduduk yang cocok dengan filter. Coba ubah kata kunci atau bersihkan filter."
              : "Belum ada data penduduk pada desa ini."}
          </p>
        ) : (
          <div className="modul-scroll">
            <table className="modul-table penduduk-table">
              <thead>
                <tr>
                  <th scope="col">No</th>
                  <th scope="col">NIK</th>
                  <th scope="col">Nama lengkap</th>
                  <th scope="col">JK</th>
                  <th scope="col">Tempat, tanggal lahir</th>
                  <th scope="col">No. KK</th>
                  <th scope="col">Nama ayah</th>
                  <th scope="col">Nama ibu</th>
                  <th scope="col">Alamat</th>
                  <th scope="col">Wilayah</th>
                  <th scope="col">Pendidikan</th>
                  <th scope="col">Pekerjaan</th>
                  <th scope="col">Kawin</th>
                  <th scope="col">Status</th>
                  <th scope="col">Terdaftar</th>
                  <th scope="col">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {hasil.rows.map((row, index) => {
                  const usia = calculateAge(row.birthDate);
                  return (
                    <tr key={row.id}>
                      <td className="penduduk-nomor">{mulai + index}</td>
                      <td>
                        <span className="penduduk-nik">{samarkanNik(row.nationalId)}</span>
                      </td>
                      <td>
                        <div className="penduduk-identitas">
                          <span
                            aria-hidden="true"
                            className={
                              row.gender === "female"
                                ? "penduduk-avatar is-female"
                                : "penduduk-avatar"
                            }
                          >
                            {inisial(row.name)}
                          </span>
                          <div>
                            <Link className="penduduk-nama" href={`/penduduk/${row.id}`}>
                              {row.name}
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td>{row.gender === "male" ? "L" : "P"}</td>
                      <td>
                        {row.birthPlace ?? "—"}
                        {row.birthDate ? (
                          <span className="modul-muted">
                            {tanggal.format(new Date(`${row.birthDate}T00:00:00`))}
                            {usia !== null ? ` · ${usia} tahun` : ""}
                          </span>
                        ) : null}
                      </td>
                      <td className="modul-mono">{row.familyNumber ?? "—"}</td>
                      <td>{row.fatherName ?? "—"}</td>
                      <td>{row.motherName ?? "—"}</td>
                      <td>{row.address ?? row.currentAddress ?? "—"}</td>
                      <td>{row.regionLabel ?? "Belum diisi"}</td>
                      <td>{row.educationName ?? "—"}</td>
                      <td>{row.occupationName ?? "—"}</td>
                      <td>{row.maritalStatusName ?? "—"}</td>
                      <td>
                        <span className="beranda-chip" data-tone={toneStatus(row)}>
                          {LIFE_STATUS_LABELS[row.lifeStatus]}
                        </span>
                      </td>
                      <td>{tanggal.format(row.createdAt)}</td>
                      <td>
                        <Link className="penduduk-aksi" href={`/penduduk/${row.id}`}>
                          Lihat
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="penduduk-footer">
          <span>
            {hasil.total === 0
              ? "Tidak ada data"
              : `Menampilkan ${angka.format(mulai)}–${angka.format(akhir)} dari ${angka.format(hasil.total)} data`}
          </span>
          {hasil.pageCount > 1 ? (
            <nav aria-label="Navigasi halaman penduduk" className="penduduk-pagination">
              {hasil.page > 1 ? (
                <Link className="penduduk-page-arrow" href={tautanHalaman(filter, hasil.page - 1)}>
                  ‹
                </Link>
              ) : (
                <span aria-disabled="true" className="penduduk-page-arrow" data-disabled="true">
                  ‹
                </span>
              )}
              {nomorHalaman(hasil.page, hasil.pageCount).map((nomor) => (
                <Link
                  aria-current={nomor === hasil.page ? "page" : undefined}
                  className="penduduk-page-link"
                  href={tautanHalaman(filter, nomor)}
                  key={nomor}
                >
                  {nomor}
                </Link>
              ))}
              {hasil.page < hasil.pageCount ? (
                <Link className="penduduk-page-arrow" href={tautanHalaman(filter, hasil.page + 1)}>
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
