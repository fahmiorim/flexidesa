import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import {
  getPendudukFilterOptionsData,
  getRingkasanPendudukData,
  listPenduduk,
} from "@/features/kependudukan/penduduk/application/use-cases";
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
} from "@/features/kependudukan/penduduk/domain/penduduk";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
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
  return value ? `/kependudukan/penduduk?${value}` : "/kependudukan/penduduk";
}

function tautanEkspor(filter: PendudukFilter): string {
  const value = filterKeSearchParams(filter).toString();
  return value ? `/kependudukan/penduduk/ekspor?${value}` : "/kependudukan/penduduk/ekspor";
}

function tautanEksporPdf(filter: PendudukFilter): string {
  const value = filterKeSearchParams(filter).toString();
  return value ? `/kependudukan/penduduk/ekspor/pdf?${value}` : "/kependudukan/penduduk/ekspor/pdf";
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
      <PageHeading
        judul={<>Data Penduduk</>}
        deskripsi={<>Kelola data penduduk desa, termasuk biodata, status, dan wilayah.</>}
      />

      <StatGrid columns={4}>
        <StatCard
          icon={
            <svg
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.7}
              viewBox="0 0 24 24"
            >
              <circle cx="9" cy="8" r="3.2" />
              <path d="M2.8 20a6.2 6.2 0 0 1 12.4 0" />
              <path d="M16.4 5.6a3.2 3.2 0 0 1 0 6.4" />
            </svg>
          }
          label="Total Penduduk"
          note="Seluruh status kependudukan"
          utama
          value={angka.format(ringkasan.total)}
        />
        <StatCard
          icon={
            <svg
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.7}
              viewBox="0 0 24 24"
            >
              <path d="M4 20V9.5L12 4l8 5.5V20" />
              <path d="M9 20v-6h6v6" />
            </svg>
          }
          label="Jumlah KK"
          note="Kartu Keluarga terhubung"
          tone="biru"
          value={angka.format(ringkasan.keluarga)}
        />
        <StatCard
          icon={
            <svg
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.7}
              viewBox="0 0 24 24"
            >
              <circle cx="10" cy="10" r="4.2" />
              <path d="M13.2 13.2 20 20M17 17l2-2M15 15l2-2" />
            </svg>
          }
          label="Laki-laki"
          note={`${persenBagian(ringkasan.lakiLaki, ringkasan.total)}% dari total`}
          progress={persenBagian(ringkasan.lakiLaki, ringkasan.total)}
          tone="biru"
          value={angka.format(ringkasan.lakiLaki)}
        />
        <StatCard
          icon={
            <svg
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.7}
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="9" r="4.2" />
              <path d="M12 13.2V21M8.5 17.5h7" />
            </svg>
          }
          label="Perempuan"
          note={`${persenBagian(ringkasan.perempuan, ringkasan.total)}% dari total`}
          progress={persenBagian(ringkasan.perempuan, ringkasan.total)}
          tone="ungu"
          value={angka.format(ringkasan.perempuan)}
        />
      </StatGrid>

      <TableCard
        actions={
          <div className="penduduk-heading-actions penduduk-card-actions">
            {filterAktif > 0 ? (
              <Link className="penduduk-reset" href="/kependudukan/penduduk">
                Reset filter ({filterAktif})
              </Link>
            ) : null}
            <ButtonLink variant="secondary" href={tautanEkspor(filter)}>
              Ekspor CSV
            </ButtonLink>
            <ButtonLink variant="secondary" href={tautanEksporPdf(filter)}>
              Ekspor PDF
            </ButtonLink>
            {bolehImpor ? <DialogImporPenduduk /> : null}
            {bolehTambah ? (
              <ButtonLink variant="primary" href="/kependudukan/penduduk/baru">
                + Tambah Penduduk
              </ButtonLink>
            ) : null}
          </div>
        }
        description={`${angka.format(hasil.total)} data${filterAktif > 0 ? " sesuai filter" : " terdaftar"}.`}
        filter={
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
              <Button variant="primary" type="submit">
                Terapkan
              </Button>
              <ButtonLink variant="secondary" href="/kependudukan/penduduk">
                Bersihkan
              </ButtonLink>
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
        }
        title="Daftar Penduduk"
        className="penduduk-card"
      >
        {hasil.rows.length === 0 ? (
          <p className="modul-empty">
            {filterAktif > 0
              ? "Tidak ada penduduk yang cocok dengan filter. Coba ubah kata kunci atau bersihkan filter."
              : "Belum ada data penduduk pada desa ini."}
          </p>
        ) : (
          <TableScroll>
            <Table className="penduduk-table">
              <THead>
                <Row>
                  <HeaderCell scope="col">No</HeaderCell>
                  <HeaderCell scope="col">NIK</HeaderCell>
                  <HeaderCell scope="col">Nama lengkap</HeaderCell>
                  <HeaderCell scope="col">JK</HeaderCell>
                  <HeaderCell scope="col">Tempat, tanggal lahir</HeaderCell>
                  <HeaderCell scope="col">No. KK</HeaderCell>
                  <HeaderCell scope="col">Nama ayah</HeaderCell>
                  <HeaderCell scope="col">Nama ibu</HeaderCell>
                  <HeaderCell scope="col">Alamat</HeaderCell>
                  <HeaderCell scope="col">Wilayah</HeaderCell>
                  <HeaderCell scope="col">Pendidikan</HeaderCell>
                  <HeaderCell scope="col">Pekerjaan</HeaderCell>
                  <HeaderCell scope="col">Kawin</HeaderCell>
                  <HeaderCell scope="col">Status</HeaderCell>
                  <HeaderCell scope="col">Terdaftar</HeaderCell>
                  <HeaderCell scope="col">Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {hasil.rows.map((row, index) => {
                  const usia = calculateAge(row.birthDate);
                  return (
                    <Row key={row.id}>
                      <Cell className="penduduk-nomor">{mulai + index}</Cell>
                      <Cell>
                        <span className="penduduk-nik">{samarkanNik(row.nationalId)}</span>
                      </Cell>
                      <Cell>
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
                            <Link
                              className="penduduk-nama"
                              href={`/kependudukan/penduduk/${row.id}`}
                            >
                              {row.name}
                            </Link>
                          </div>
                        </div>
                      </Cell>
                      <Cell>{row.gender === "male" ? "L" : "P"}</Cell>
                      <Cell>
                        {row.birthPlace ?? "—"}
                        {row.birthDate ? (
                          <span className="modul-muted">
                            {tanggal.format(new Date(`${row.birthDate}T00:00:00`))}
                            {usia !== null ? ` · ${usia} tahun` : ""}
                          </span>
                        ) : null}
                      </Cell>
                      <Cell className="modul-mono">{row.familyNumber ?? "—"}</Cell>
                      <Cell>{row.fatherName ?? "—"}</Cell>
                      <Cell>{row.motherName ?? "—"}</Cell>
                      <Cell>{row.address ?? row.currentAddress ?? "—"}</Cell>
                      <Cell>{row.regionLabel ?? "Belum diisi"}</Cell>
                      <Cell>{row.educationName ?? "—"}</Cell>
                      <Cell>{row.occupationName ?? "—"}</Cell>
                      <Cell>{row.maritalStatusName ?? "—"}</Cell>
                      <Cell>
                        <span className="beranda-chip" data-tone={toneStatus(row)}>
                          {LIFE_STATUS_LABELS[row.lifeStatus]}
                        </span>
                      </Cell>
                      <Cell>{tanggal.format(row.createdAt)}</Cell>
                      <Cell>
                        <Link className="penduduk-aksi" href={`/kependudukan/penduduk/${row.id}`}>
                          Lihat
                        </Link>
                      </Cell>
                    </Row>
                  );
                })}
              </TBody>
            </Table>
          </TableScroll>
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
                <Link
                  aria-label="Halaman sebelumnya"
                  className="penduduk-page-arrow"
                  href={tautanHalaman(filter, hasil.page - 1)}
                >
                  ‹
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  aria-label="Halaman sebelumnya"
                  className="penduduk-page-arrow"
                  data-disabled="true"
                >
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
                <Link
                  aria-label="Halaman berikutnya"
                  className="penduduk-page-arrow"
                  href={tautanHalaman(filter, hasil.page + 1)}
                >
                  ›
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  aria-label="Halaman berikutnya"
                  className="penduduk-page-arrow"
                  data-disabled="true"
                >
                  ›
                </span>
              )}
            </nav>
          ) : null}
        </div>
      </TableCard>
    </div>
  );
}
