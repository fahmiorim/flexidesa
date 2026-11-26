import type { Metadata } from "next";
import Link from "next/link";

import {
  kembalikanStatusAction,
  kembalikanStatusMassalAction,
} from "@/app/(admin)/(kependudukan)/kependudukan/mutasi-penduduk/actions";
import { PageHeading } from "@/components/shell/page-heading";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { listRiwayat } from "@/features/kependudukan/penduduk/application/riwayat-penduduk-use-cases";
import { getPendudukFormData } from "@/features/kependudukan/penduduk/application/use-cases";
import {
  calculateAge,
  GENDER_LABELS,
  LIFE_STATUS_LABELS,
  PENDUDUK_RESOURCE,
  type LifeStatus,
} from "@/features/kependudukan/penduduk/domain/penduduk";
import {
  labelDetailMeta,
  MUTATION_TYPE_LABELS,
  MUTATION_TYPES,
  normalisasiMutationType,
  type MutasiDetailMeta,
} from "@/features/kependudukan/penduduk/domain/riwayat-penduduk";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import styles from "./mutasi.module.css";

export const metadata: Metadata = { title: "Mutasi Penduduk" };
const number = new Intl.NumberFormat("id-ID");
const date = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" });

const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function statusMenjadi(
  type: (typeof MUTATION_TYPES)[number],
  meta: MutasiDetailMeta,
  lifeStatus: LifeStatus | null,
): string {
  if (meta.toLifeStatus) return LIFE_STATUS_LABELS[meta.toLifeStatus];
  if (type === "death") return LIFE_STATUS_LABELS.deceased;
  if (type === "move_out") return LIFE_STATUS_LABELS.moved;
  if (type === "missing") return LIFE_STATUS_LABELS.missing;
  if (type === "birth" || type === "move_in") return LIFE_STATUS_LABELS.alive;
  return lifeStatus ? LIFE_STATUS_LABELS[lifeStatus] : MUTATION_TYPE_LABELS[type];
}

function angka(value: string | string[] | undefined, min: number, max: number): number | null {
  if (typeof value !== "string") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

export default async function MutasiPendudukPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, user, , formData] = await Promise.all([
    searchParams,
    verifySession(),
    Promise.resolve(null),
    getPendudukFormData(),
  ]);
  const bolehUbah = hasPermission(user.permissions, PENDUDUK_RESOURCE, "update");

  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const type = normalisasiMutationType(typeof params.type === "string" ? params.type : null);
  const year = angka(params.year, 1900, 2999);
  const month = angka(params.month, 1, 12);
  const genderParam = params.gender;
  const gender = genderParam === "male" || genderParam === "female" ? genderParam : null;
  const religionId = angka(params.religionId, 1, Number.MAX_SAFE_INTEGER);
  const regionId = angka(params.regionId, 1, Number.MAX_SAFE_INTEGER);
  const pageRaw = typeof params.page === "string" ? Number(params.page) : 1;
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const result = await listRiwayat({
    q,
    type,
    year,
    month,
    gender,
    religionId,
    regionId,
    page,
    perPage: 10,
  });

  const filterQuery = new URLSearchParams();
  filterQuery.set("type", type);
  if (year) filterQuery.set("year", String(year));
  if (month) filterQuery.set("month", String(month));
  if (gender) filterQuery.set("gender", gender);
  if (religionId) filterQuery.set("religionId", String(religionId));
  if (regionId) filterQuery.set("regionId", String(regionId));
  const suffix = filterQuery.toString() ? `?${filterQuery.toString()}` : "";
  const halamanHref = (target: number) => {
    const query = new URLSearchParams(filterQuery);
    query.set("page", String(target));
    return `?${query.toString()}`;
  };

  const tahunIni = new Date().getFullYear();
  const tahunList = Array.from({ length: 10 }, (_, i) => tahunIni - i);
  const bolehKembaliRows = result.rows.filter(
    (row) => row.residentId !== null && row.type !== "birth" && row.type !== "move_in",
  );

  return (
    <div className="modul-page data-kependudukan-page">
      <PageHeading
        judul={<>Mutasi Penduduk</>}
        deskripsi={<>Riwayat kelahiran, kematian, pindah, dan datang penduduk.</>}
        aksi={
          <>
            {bolehUbah ? (
              <Link className="button button-primary" href="/kependudukan/mutasi-penduduk/baru">
                + Catat Mutasi
              </Link>
            ) : null}
          </>
        }
      />

      <section className="platform-card data-panel">
        <header className="data-section-heading">
          <div>
            <h2>Daftar Mutasi Penduduk</h2>
            <p>
              Menampilkan {number.format(result.rows.length)} dari {number.format(result.total)}{" "}
              kejadian.
            </p>
          </div>
        </header>

        <form className="data-filter" method="get">
          <label className="data-filter-date">
            <span>Jenis Peristiwa</span>
            <select aria-label="Jenis peristiwa" defaultValue={type} name="type">
              <option value="all">Pilih Jenis Peristiwa</option>
              {MUTATION_TYPES.map((value) => (
                <option key={value} value={value}>
                  {MUTATION_TYPE_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="data-filter-date">
            <span>Tahun</span>
            <select aria-label="Tahun" defaultValue={year ?? ""} name="year">
              <option value="">Pilih Tahun</option>
              {tahunList.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="data-filter-date">
            <span>Bulan</span>
            <select aria-label="Bulan" defaultValue={month ?? ""} name="month">
              <option value="">Pilih Bulan</option>
              {NAMA_BULAN.map((nama, index) => (
                <option key={nama} value={index + 1}>
                  {nama}
                </option>
              ))}
            </select>
          </label>
          <label className="data-filter-date">
            <span>Jenis Kelamin</span>
            <select aria-label="Jenis kelamin" defaultValue={gender ?? ""} name="gender">
              <option value="">Pilih Jenis Kelamin</option>
              <option value="male">{GENDER_LABELS.male}</option>
              <option value="female">{GENDER_LABELS.female}</option>
            </select>
          </label>
          <label className="data-filter-date">
            <span>Agama</span>
            <select aria-label="Agama" defaultValue={religionId ?? ""} name="religionId">
              <option value="">Pilih Agama</option>
              {formData.references.religions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="data-filter-date">
            <span>Wilayah</span>
            <select aria-label="Wilayah" defaultValue={regionId ?? ""} name="regionId">
              <option value="">Pilih Wilayah</option>
              {formData.references.regions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <input
            aria-label="Cari nama, NIK, atau nomor surat"
            defaultValue={q}
            name="q"
            placeholder="Cari nama, NIK, atau nomor surat..."
            type="search"
          />
          <button className="button button-secondary" type="submit">
            Filter
          </button>
          <Link className="button button-ghost" href="/kependudukan/mutasi-penduduk">
            Bersihkan
          </Link>
        </form>

        <form action={kembalikanStatusMassalAction}>
          <div className={styles.buttonGroups}>
            <div className={styles.buttonGroup} role="group" aria-label="Kelola">
              <span className={styles.buttonGroupLabel}>Kelola</span>
              {bolehUbah ? (
                <ConfirmSubmit
                  className="button button-secondary"
                  message="Kembalikan status penduduk terpilih menjadi Hidup? Perubahan ini akan mempengaruhi laporan penduduk bulanan."
                >
                  Kembalikan Status Terpilih
                </ConfirmSubmit>
              ) : null}
            </div>
            <div className={styles.buttonGroup} role="group" aria-label="Laporan">
              <span className={styles.buttonGroupLabel}>Laporan</span>
              <Link
                className="button button-secondary"
                href={`/kependudukan/mutasi-penduduk/cetak${suffix}`}
              >
                Cetak
              </Link>
              <Link
                className="button button-secondary"
                href={`/kependudukan/mutasi-penduduk/ekspor${suffix}`}
              >
                Unduh
              </Link>
            </div>
          </div>

          {result.rows.length ? (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    {bolehUbah ? <th>Kembalikan</th> : null}
                    <th>No.</th>
                    <th>Aksi</th>
                    <th>NIK</th>
                    <th>Nama</th>
                    <th>No. KK / Nama KK</th>
                    <th>Jenis Kelamin</th>
                    <th>Dusun</th>
                    <th>RW</th>
                    <th>RT</th>
                    <th>Umur</th>
                    <th>Status Menjadi</th>
                    <th>Tgl Peristiwa</th>
                    <th>Tgl Lapor</th>
                    <th>Catatan Peristiwa</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, index) => {
                    const meta = (row.meta ?? {}) as MutasiDetailMeta;
                    const detailBaris = labelDetailMeta(meta);
                    const umur = calculateAge(row.birthDate);
                    const catatan = [row.notes, ...detailBaris, row.reason, row.referenceNo]
                      .filter((v) => typeof v === "string" && v.trim())
                      .join(" · ");
                    return (
                      <tr key={row.id}>
                        {bolehUbah ? (
                          <td>
                            {row.residentId !== null &&
                            row.type !== "birth" &&
                            row.type !== "move_in" ? (
                              <input
                                aria-label={`Pilih ${row.residentName ?? "penduduk"}`}
                                name="idCb"
                                type="checkbox"
                                value={row.residentId}
                              />
                            ) : null}
                          </td>
                        ) : null}
                        <td>{index + 1}</td>
                        <td>
                          <span className={styles.actions}>
                            {bolehUbah ? (
                              <Link
                                className="button button-ghost"
                                href={`/kependudukan/mutasi-penduduk/${row.id}/ubah`}
                              >
                                Ubah
                              </Link>
                            ) : null}
                            {bolehUbah &&
                            row.residentId !== null &&
                            row.type !== "birth" &&
                            row.type !== "move_in" ? (
                              <ConfirmSubmit
                                className="button button-secondary"
                                form={`kembali-${row.id}`}
                                message="Kembalikan status penduduk ini menjadi Hidup? Perubahan ini akan mempengaruhi laporan penduduk bulanan."
                              >
                                Kembalikan Status
                              </ConfirmSubmit>
                            ) : null}
                          </span>
                        </td>
                        <td className="modul-mono">
                          {row.residentNationalId
                            ? row.residentNationalId.replace(/^(\d{6})\d+(\d{4})$/, "$1••••••$2")
                            : "—"}
                        </td>
                        <td>{row.residentName ?? "Data penduduk tidak tersedia"}</td>
                        <td>
                          {row.familyNumber ?? "—"}
                          {row.familyHeadName ? ` / ${row.familyHeadName}` : ""}
                        </td>
                        <td>{row.gender ? GENDER_LABELS[row.gender] : "—"}</td>
                        <td>{row.dusun ?? "—"}</td>
                        <td>{row.rw ?? "—"}</td>
                        <td>{row.rt ?? "—"}</td>
                        <td>{umur ?? "—"}</td>
                        <td>
                          <span className="data-status">
                            {statusMenjadi(row.type, meta, row.lifeStatus)}
                          </span>
                        </td>
                        <td>{date.format(new Date(`${row.eventDate}T00:00:00`))}</td>
                        <td>
                          {date.format(
                            new Date(
                              new Date(row.reportedAt).toISOString().slice(0, 10) + "T00:00:00",
                            ),
                          )}
                        </td>
                        <td>{catatan || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="modul-empty">Belum ada catatan mutasi untuk filter ini.</p>
          )}
        </form>

        {bolehUbah
          ? bolehKembaliRows.map((row) => (
              <form
                action={kembalikanStatusAction.bind(null, row.residentId!)}
                id={`kembali-${row.id}`}
                key={row.id}
              />
            ))
          : null}

        <footer className="data-pagination">
          <span>
            Menampilkan {number.format(result.rows.length)} dari {number.format(result.total)}{" "}
            kejadian
          </span>
          <div>
            {page > 1 ? <Link href={halamanHref(page - 1)}>Sebelumnya</Link> : null}
            {page * result.perPage < result.total ? (
              <Link href={halamanHref(page + 1)}>Berikutnya</Link>
            ) : null}
          </div>
        </footer>
      </section>
    </div>
  );
}
