import type { Metadata } from "next";
import Link from "next/link";

import {
  kembalikanStatusAction,
  kembalikanStatusMassalAction,
} from "@/app/(admin)/(kependudukan)/kependudukan/mutasi-penduduk/actions";
import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
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
      />

      <TableCard
        actions={
          bolehUbah ? (
            <ButtonLink variant="primary" href="/kependudukan/mutasi-penduduk/baru">
              + Catat Mutasi
            </ButtonLink>
          ) : null
        }
        description={`Menampilkan ${number.format(result.rows.length)} dari ${number.format(result.total)} kejadian.`}
        filter={
          <form className="data-filter" method="get">
            <FormField
              defaultValue={type}
              kind="select"
              label="Jenis Peristiwa"
              name="type"
              options={[
                { value: "all", label: "Semua Jenis Peristiwa" },
                ...MUTATION_TYPES.map((value) => ({
                  value,
                  label: MUTATION_TYPE_LABELS[value],
                })),
              ]}
            />
            <FormField
              defaultValue={year === null ? "" : String(year)}
              kind="select"
              label="Tahun"
              name="year"
              options={[
                { value: "", label: "Pilih Tahun" },
                ...tahunList.map((value) => ({ value: String(value), label: String(value) })),
              ]}
            />
            <FormField
              defaultValue={month === null ? "" : String(month)}
              kind="select"
              label="Bulan"
              name="month"
              options={[
                { value: "", label: "Pilih Bulan" },
                ...NAMA_BULAN.map((nama, index) => ({
                  value: String(index + 1),
                  label: nama,
                })),
              ]}
            />
            <FormField
              defaultValue={gender ?? ""}
              kind="select"
              label="Jenis Kelamin"
              name="gender"
              options={[
                { value: "", label: "Pilih Jenis Kelamin" },
                { value: "male", label: GENDER_LABELS.male },
                { value: "female", label: GENDER_LABELS.female },
              ]}
            />
            <FormField
              defaultValue={religionId === null ? "" : String(religionId)}
              kind="select"
              label="Agama"
              name="religionId"
              options={[
                { value: "", label: "Pilih Agama" },
                ...formData.references.religions.map((item) => ({
                  value: String(item.id),
                  label: item.name,
                })),
              ]}
            />
            <FormField
              defaultValue={regionId === null ? "" : String(regionId)}
              kind="select"
              label="Wilayah"
              name="regionId"
              options={[
                { value: "", label: "Pilih Wilayah" },
                ...formData.references.regions.map((item) => ({
                  value: String(item.id),
                  label: item.label,
                })),
              ]}
            />
            <FormField
              defaultValue={q}
              label="Pencarian"
              name="q"
              placeholder="Cari nama, NIK, atau nomor surat..."
              type="search"
            />
            <Button variant="secondary" type="submit">
              Filter
            </Button>
            <ButtonLink variant="ghost" href="/kependudukan/mutasi-penduduk">
              Bersihkan
            </ButtonLink>
          </form>
        }
        title="Daftar Mutasi Penduduk"
      >
        <form action={kembalikanStatusMassalAction}>
          <div className={styles.buttonGroups}>
            <div className={styles.buttonGroup} role="group" aria-label="Kelola">
              <span className={styles.buttonGroupLabel}>Kelola</span>
              {bolehUbah ? (
                <ConfirmSubmit
                  variant="secondary"
                  message="Kembalikan status penduduk terpilih menjadi Hidup? Perubahan ini akan mempengaruhi laporan penduduk bulanan."
                >
                  Kembalikan Status Terpilih
                </ConfirmSubmit>
              ) : null}
            </div>
            <div className={styles.buttonGroup} role="group" aria-label="Laporan">
              <span className={styles.buttonGroupLabel}>Laporan</span>
              <ButtonLink variant="secondary" href={`/kependudukan/mutasi-penduduk/cetak${suffix}`}>
                Cetak
              </ButtonLink>
              <ButtonLink
                variant="secondary"
                href={`/kependudukan/mutasi-penduduk/ekspor${suffix}`}
              >
                Unduh
              </ButtonLink>
            </div>
          </div>

          {result.rows.length ? (
            <TableScroll>
              <Table>
                <THead>
                  <Row>
                    {bolehUbah ? <HeaderCell>Kembalikan</HeaderCell> : null}
                    <HeaderCell>No.</HeaderCell>
                    <HeaderCell>Aksi</HeaderCell>
                    <HeaderCell>NIK</HeaderCell>
                    <HeaderCell>Nama</HeaderCell>
                    <HeaderCell>No. KK / Nama KK</HeaderCell>
                    <HeaderCell>Jenis Kelamin</HeaderCell>
                    <HeaderCell>Dusun</HeaderCell>
                    <HeaderCell>RW</HeaderCell>
                    <HeaderCell>RT</HeaderCell>
                    <HeaderCell>Umur</HeaderCell>
                    <HeaderCell>Status Menjadi</HeaderCell>
                    <HeaderCell>Tgl Peristiwa</HeaderCell>
                    <HeaderCell>Tgl Lapor</HeaderCell>
                    <HeaderCell>Catatan Peristiwa</HeaderCell>
                  </Row>
                </THead>
                <TBody>
                  {result.rows.map((row, index) => {
                    const meta = (row.meta ?? {}) as MutasiDetailMeta;
                    const detailBaris = labelDetailMeta(meta);
                    const umur = calculateAge(row.birthDate);
                    const catatan = [row.notes, ...detailBaris, row.reason, row.referenceNo]
                      .filter((v) => typeof v === "string" && v.trim())
                      .join(" · ");
                    return (
                      <Row key={row.id}>
                        {bolehUbah ? (
                          <Cell>
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
                          </Cell>
                        ) : null}
                        <Cell>{index + 1}</Cell>
                        <Cell>
                          <span className={styles.actions}>
                            {bolehUbah ? (
                              <ButtonLink
                                variant="ghost"
                                href={`/kependudukan/mutasi-penduduk/${row.id}/ubah`}
                              >
                                Ubah
                              </ButtonLink>
                            ) : null}
                            {bolehUbah &&
                            row.residentId !== null &&
                            row.type !== "birth" &&
                            row.type !== "move_in" ? (
                              <ConfirmSubmit
                                variant="secondary"
                                form={`kembali-${row.id}`}
                                message="Kembalikan status penduduk ini menjadi Hidup? Perubahan ini akan mempengaruhi laporan penduduk bulanan."
                              >
                                Kembalikan Status
                              </ConfirmSubmit>
                            ) : null}
                          </span>
                        </Cell>
                        <Cell className="modul-mono">
                          {row.residentNationalId
                            ? row.residentNationalId.replace(/^(\d{6})\d+(\d{4})$/, "$1••••••$2")
                            : "—"}
                        </Cell>
                        <Cell>{row.residentName ?? "Data penduduk tidak tersedia"}</Cell>
                        <Cell>
                          {row.familyNumber ?? "—"}
                          {row.familyHeadName ? ` / ${row.familyHeadName}` : ""}
                        </Cell>
                        <Cell>{row.gender ? GENDER_LABELS[row.gender] : "—"}</Cell>
                        <Cell>{row.dusun ?? "—"}</Cell>
                        <Cell>{row.rw ?? "—"}</Cell>
                        <Cell>{row.rt ?? "—"}</Cell>
                        <Cell>{umur ?? "—"}</Cell>
                        <Cell>
                          <span className="data-status">
                            {statusMenjadi(row.type, meta, row.lifeStatus)}
                          </span>
                        </Cell>
                        <Cell>{date.format(new Date(`${row.eventDate}T00:00:00`))}</Cell>
                        <Cell>
                          {date.format(
                            new Date(
                              new Date(row.reportedAt).toISOString().slice(0, 10) + "T00:00:00",
                            ),
                          )}
                        </Cell>
                        <Cell>{catatan || "—"}</Cell>
                      </Row>
                    );
                  })}
                </TBody>
              </Table>
            </TableScroll>
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
      </TableCard>
    </div>
  );
}
