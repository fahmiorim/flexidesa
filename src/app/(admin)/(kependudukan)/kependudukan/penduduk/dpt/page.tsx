import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import {
  getDpt,
  getDptReference,
  listElections,
} from "@/features/kependudukan/penduduk/application/dpt-use-cases";
import {
  listDptParamsSchema,
  type DptFilter,
  type ListDptParams,
} from "@/features/kependudukan/penduduk/domain/dpt";
import {
  GENDER_LABELS,
  PENDUDUK_RESOURCE,
  samarkanNik,
} from "@/features/kependudukan/penduduk/domain/penduduk";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";
import { formatTanggal } from "@/lib/format-tanggal";

import { MenuCetakDpt } from "./menu-cetak-dpt";
import { PanelPemilihan } from "./pemilihan-panel";

export const metadata: Metadata = { title: "Calon Pemilih" };

const PER_HALAMAN = 20;
const angka = new Intl.NumberFormat("id-ID");

function bacaFilter(params: Record<string, string | string[] | undefined>): ListDptParams {
  const mentah: Record<string, string> = {};
  for (const [kunci, nilai] of Object.entries(params)) {
    const teks = Array.isArray(nilai) ? nilai[0] : nilai;
    if (teks && teks.trim() !== "") mentah[kunci] = teks;
  }
  const hasil = listDptParamsSchema.safeParse({ ...mentah, perPage: PER_HALAMAN });
  return hasil.success ? hasil.data : { page: 1, perPage: PER_HALAMAN, umurSatuan: "tahun" };
}

function filterAktif(filter: DptFilter): number {
  return [
    filter.search,
    filter.gender,
    filter.dusun,
    filter.rw,
    filter.rt,
    filter.agamaId,
    filter.pendidikanId,
    filter.pendidikanSedangId,
    filter.pekerjaanId,
    filter.statusKawinId,
    filter.tagIdCard,
    filter.umurMin,
    filter.umurMax,
  ].filter((nilai) => nilai !== undefined && nilai !== "").length;
}

function queryFilter(filter: DptFilter): URLSearchParams {
  const query = new URLSearchParams();
  if (filter.search) query.set("search", filter.search);
  if (filter.gender) query.set("gender", filter.gender);
  if (filter.dusun) query.set("dusun", filter.dusun);
  if (filter.rw) query.set("rw", filter.rw);
  if (filter.rt) query.set("rt", filter.rt);
  if (filter.agamaId) query.set("agamaId", String(filter.agamaId));
  if (filter.pendidikanId) query.set("pendidikanId", String(filter.pendidikanId));
  if (filter.pendidikanSedangId) query.set("pendidikanSedangId", String(filter.pendidikanSedangId));
  if (filter.pekerjaanId) query.set("pekerjaanId", String(filter.pekerjaanId));
  if (filter.statusKawinId) query.set("statusKawinId", String(filter.statusKawinId));
  if (filter.tagIdCard) query.set("tagIdCard", filter.tagIdCard);
  if (filter.umurMin) query.set("umurMin", String(filter.umurMin));
  if (filter.umurMax) query.set("umurMax", String(filter.umurMax));
  if (filter.umurSatuan === "bulan") query.set("umurSatuan", "bulan");
  return query;
}

function tautanHalaman(filter: DptFilter, halaman: number): string {
  const query = queryFilter(filter);
  if (halaman > 1) query.set("page", String(halaman));
  const suffix = query.toString();
  return suffix ? `/kependudukan/penduduk/dpt?${suffix}` : "/kependudukan/penduduk/dpt";
}

function tautanEkspor(dasar: string, filter: DptFilter): string {
  const suffix = queryFilter(filter).toString();
  return suffix ? `${dasar}?${suffix}` : dasar;
}

function nomorHalaman(sekarang: number, total: number): number[] {
  const mulai = Math.max(1, Math.min(sekarang - 2, total - 4));
  const akhir = Math.min(total, mulai + 4);
  return Array.from({ length: akhir - mulai + 1 }, (_, index) => mulai + index);
}

function inisial(nama: string): string {
  return nama
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((bagian) => bagian.charAt(0).toUpperCase())
    .join("");
}

function wilayah(row: { dusun: string | null; rw: string | null; rt: string | null }): string {
  return [row.dusun, row.rw ? `RW ${row.rw}` : null, row.rt ? `RT ${row.rt}` : null]
    .filter(Boolean)
    .join(", ");
}

export default async function CalonPemilihPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filter = bacaFilter(params);
  const halamanDiminta = filter.page;

  const [awal, elections, referensi, user] = await Promise.all([
    getDpt({ ...filter, page: halamanDiminta }),
    listElections(),
    getDptReference(),
    verifySession(),
  ]);
  const hasil =
    halamanDiminta > awal.pageCount ? await getDpt({ ...filter, page: awal.pageCount }) : awal;

  const aktif = elections.find((item) => item.status === "aktif") ?? null;
  const electionParam = typeof params.election === "string" ? Number(params.election) : Number.NaN;
  const edit = elections.find((item) => item.id === electionParam) ?? null;
  const bolehUbah = hasPermission(user.permissions, PENDUDUK_RESOURCE, "update");
  const bolehHapus = hasPermission(user.permissions, PENDUDUK_RESOURCE, "delete");
  const jumlahFilter = filterAktif(filter);
  const mulai = hasil.total === 0 ? 0 : (hasil.page - 1) * hasil.perPage + 1;
  const akhir = Math.min(hasil.page * hasil.perPage, hasil.total);

  return (
    <div className="modul-page penduduk-page data-kependudukan-page dpt-page">
      <PageHeading
        judul={<>Calon Pemilih</>}
        deskripsi={<>Daftar pemilih otomatis dari data penduduk.</>}
      />

      {params.dihapus === "1" ? <p className="dpt-alert">Pemilihan berhasil dihapus.</p> : null}

      <TableCard
        actions={
          <>
            <MenuCetakDpt
              cetakHref={tautanEkspor("/kependudukan/penduduk/dpt/cetak", filter)}
              exportHref={tautanEkspor("/kependudukan/penduduk/dpt/ekspor", filter)}
              unduhHref={tautanEkspor("/kependudukan/penduduk/dpt/unduh", filter)}
            />
            <ButtonLink variant="secondary" href="#pemilihan">
              Kelola Pemilihan
            </ButtonLink>
          </>
        }
        className="penduduk-card dpt-card"
        description={`${aktif ? `${aktif.judul} · ${formatTanggal(aktif.tanggal)}` : "Pilih pemilihan aktif untuk menampilkan daftar"} · ${angka.format(hasil.total)} pemilih`}
        filter={
          <form className="penduduk-filter dpt-filter" method="get">
            <label className="penduduk-search">
              <span>Cari</span>
              <input
                defaultValue={filter.search}
                name="search"
                placeholder="NIK atau nama calon pemilih"
                type="search"
              />
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
              <select defaultValue={filter.dusun ?? ""} name="dusun">
                <option value="">Semua dusun</option>
                {referensi.dusun.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>RW</span>
              <select defaultValue={filter.rw ?? ""} name="rw">
                <option value="">Semua RW</option>
                {referensi.rw.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>RT</span>
              <select defaultValue={filter.rt ?? ""} name="rt">
                <option value="">Semua RT</option>
                {referensi.rt.map((value) => (
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
              <ButtonLink variant="secondary" href="/kependudukan/penduduk/dpt">
                Bersihkan
              </ButtonLink>
            </div>

            <details className="dpt-filter-more" open={jumlahFilter > 0}>
              <summary>
                <span>Filter lainnya</span>
                {jumlahFilter > 0 ? (
                  <span className="keluarga-filter-count">{jumlahFilter}</span>
                ) : null}
              </summary>
              <div className="dpt-filter-panel">
                <fieldset className="dpt-age-filter">
                  <legend>Umur pada tanggal pemilihan</legend>
                  <label>
                    <span>Dari</span>
                    <input
                      defaultValue={filter.umurMin ?? ""}
                      min={0}
                      name="umurMin"
                      placeholder="0"
                      type="number"
                    />
                  </label>
                  <label>
                    <span>Sampai</span>
                    <input
                      defaultValue={filter.umurMax ?? ""}
                      min={0}
                      name="umurMax"
                      placeholder="Tanpa batas"
                      type="number"
                    />
                  </label>
                  <label>
                    <span>Satuan</span>
                    <select defaultValue={filter.umurSatuan ?? "tahun"} name="umurSatuan">
                      <option value="tahun">Tahun</option>
                      <option value="bulan">Bulan</option>
                    </select>
                  </label>
                </fieldset>
                <label>
                  <span>Agama</span>
                  <select defaultValue={filter.agamaId ?? ""} name="agamaId">
                    <option value="">Semua agama</option>
                    {referensi.religions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Pendidikan dalam KK</span>
                  <select defaultValue={filter.pendidikanId ?? ""} name="pendidikanId">
                    <option value="">Semua pendidikan</option>
                    {referensi.educations.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Pendidikan sedang ditempuh</span>
                  <select defaultValue={filter.pendidikanSedangId ?? ""} name="pendidikanSedangId">
                    <option value="">Semua</option>
                    {referensi.educations.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Pekerjaan</span>
                  <select defaultValue={filter.pekerjaanId ?? ""} name="pekerjaanId">
                    <option value="">Semua pekerjaan</option>
                    {referensi.occupations.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Status perkawinan</span>
                  <select defaultValue={filter.statusKawinId ?? ""} name="statusKawinId">
                    <option value="">Semua status</option>
                    {referensi.maritalStatuses.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Tag ID Card</span>
                  <select defaultValue={filter.tagIdCard ?? ""} name="tagIdCard">
                    <option value="">Semua</option>
                    <option value="ada">Sudah punya</option>
                    <option value="tidak">Belum punya</option>
                  </select>
                </label>
              </div>
            </details>
          </form>
        }
        title="Daftar Calon Pemilih"
      >
        {hasil.rows.length === 0 ? (
          <p className="modul-empty">
            {!aktif
              ? "Aktifkan pemilihan untuk menghitung calon pemilih."
              : jumlahFilter > 0
                ? "Tidak ada calon pemilih yang cocok dengan filter."
                : "Belum ada penduduk yang memenuhi syarat sebagai calon pemilih."}
          </p>
        ) : (
          <TableScroll>
            <Table className="penduduk-table dpt-table">
              <THead>
                <Row>
                  <HeaderCell scope="col">No</HeaderCell>
                  <HeaderCell scope="col">NIK</HeaderCell>
                  <HeaderCell scope="col">Nama / No. KK</HeaderCell>
                  <HeaderCell scope="col">Tag ID</HeaderCell>
                  <HeaderCell scope="col">JK</HeaderCell>
                  <HeaderCell scope="col">Alamat / Wilayah</HeaderCell>
                  <HeaderCell scope="col">Umur</HeaderCell>
                  <HeaderCell scope="col">Pendidikan KK</HeaderCell>
                  <HeaderCell scope="col">Pekerjaan</HeaderCell>
                  <HeaderCell scope="col">Kawin</HeaderCell>
                  <HeaderCell scope="col">Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {hasil.rows.map((row, index) => (
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
                          <Link className="penduduk-nama" href={`/kependudukan/penduduk/${row.id}`}>
                            {row.name}
                          </Link>
                          {row.familyId ? (
                            <Link
                              className="modul-muted"
                              href={`/kependudukan/keluarga/${row.familyId}`}
                            >
                              KK {row.familyNumber ?? "tanpa nomor"}
                            </Link>
                          ) : (
                            <span className="modul-muted">Belum terhubung KK</span>
                          )}
                        </div>
                      </div>
                    </Cell>
                    <Cell>{row.idCardTag ?? "—"}</Cell>
                    <Cell>{row.gender === "male" ? "L" : "P"}</Cell>
                    <Cell>
                      <span>{row.address ?? "—"}</span>
                      <span className="modul-muted">{wilayah(row) || "Wilayah belum diisi"}</span>
                    </Cell>
                    <Cell>{row.umurPemilihan !== null ? `${row.umurPemilihan} th` : "—"}</Cell>
                    <Cell>{row.pendidikan ?? "—"}</Cell>
                    <Cell>{row.pekerjaan ?? "—"}</Cell>
                    <Cell>{row.statusKawin ?? "—"}</Cell>
                    <Cell>
                      <Link className="penduduk-aksi" href={`/kependudukan/penduduk/${row.id}`}>
                        Lihat
                      </Link>
                    </Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        )}

        <div className="penduduk-footer">
          <span>
            {hasil.total === 0
              ? "Tidak ada data"
              : `Menampilkan ${angka.format(mulai)}–${angka.format(akhir)} dari ${angka.format(hasil.total)} pemilih`}
          </span>
          {hasil.pageCount > 1 ? (
            <nav aria-label="Navigasi halaman calon pemilih" className="penduduk-pagination">
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

      <PanelPemilihan
        bolehHapus={bolehHapus}
        bolehUbah={bolehUbah}
        edit={edit}
        elections={elections}
      />
    </div>
  );
}
