import type { Metadata } from "next";
import Link from "next/link";

import { hapusRumahTanggaAction } from "@/app/(admin)/rumah-tangga/actions";
import { PageHeading } from "@/components/shell/page-heading";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { hasPermission } from "@/features/rbac/application/authorization";
import {
  getLaporanRumahTangga,
  getRtmFilterOptions,
  listRumahTangga,
} from "@/features/rumah-tangga/application/use-cases";
import {
  filterRtmKeSearchParams,
  hitungFilterRtm,
  parseFilterRtm,
  RTM_SEX_LABELS,
  RTM_STATUS_LABELS,
  RUMAH_TANGGA_RESOURCE,
  type RtmFilter,
} from "@/features/rumah-tangga/domain/rumah-tangga";
import { verifySession } from "@/lib/dal";

import { FilterRtm } from "./filter-rtm";
import { RtmToolbar } from "./rtm-toolbar";
import styles from "./rumah-tangga.module.css";

export const metadata: Metadata = { title: "Rumah Tangga" };
const number = new Intl.NumberFormat("id-ID");

function labelKelas(value: number | null): string {
  return value === null ? "—" : `Kelas ${value}`;
}

/** Daftar chip filter aktif beserta tautan untuk melepas satu filter. */
function chipFilterAktif(filter: RtmFilter): Array<{ kunci: string; label: string }> {
  const chips: Array<{ kunci: string; label: string }> = [];
  if (filter.search) chips.push({ kunci: "q", label: `“${filter.search}”` });
  if (filter.dusun) chips.push({ kunci: "dusun", label: `Dusun ${filter.dusun}` });
  if (filter.status)
    chips.push({ kunci: "status", label: `Status: ${RTM_STATUS_LABELS[filter.status]}` });
  if (filter.sex) chips.push({ kunci: "sex", label: `Kepala: ${RTM_SEX_LABELS[filter.sex]}` });
  return chips;
}

export default async function RumahTanggaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, user, filterOptions] = await Promise.all([
    searchParams,
    verifySession(),
    getRtmFilterOptions(),
  ]);
  const filter = parseFilterRtm(params);
  const pageRaw = typeof params.page === "string" ? Number(params.page) : 1;
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const pageSize = 10;
  const initial = await listRumahTangga({ filter, page, pageSize });
  const result =
    page > initial.pageCount
      ? await listRumahTangga({ filter, page: initial.pageCount, pageSize })
      : initial;
  const rekap = await getLaporanRumahTangga(filter);

  const bolehTambah = hasPermission(user.permissions, RUMAH_TANGGA_RESOURCE, "create");
  const bolehUbah = hasPermission(user.permissions, RUMAH_TANGGA_RESOURCE, "update");
  const bolehHapus = hasPermission(user.permissions, RUMAH_TANGGA_RESOURCE, "delete");
  const filterQuery = filterRtmKeSearchParams(filter);
  const filterSuffix = filterQuery.toString() ? `?${filterQuery.toString()}` : "";
  const halamanHref = (target: number) => {
    const next = new URLSearchParams(filterQuery);
    next.set("page", String(target));
    return `?${next.toString()}`;
  };
  const rataAnggota =
    rekap.rekap.totalRtm === 0 ? 0 : rekap.rekap.totalAnggota / rekap.rekap.totalRtm;

  return (
    <div className="modul-page data-kependudukan-page">
      <PageHeading>
        <header className="page-heading">
          <div>
            <h1>Rumah Tangga</h1>
            <p>Kelola rumah tangga dan anggotanya.</p>
          </div>
        </header>
      </PageHeading>

      {params.dihapus === "1" ? (
        <p className="form-help" role="status">
          Rumah Tangga berhasil dihapus. Anggota yang terhubung sudah dilepas.
        </p>
      ) : null}

      <section className="data-kependudukan-kpis">
        <article className="data-kpi data-kpi-primary">
          <span>Total Rumah Tangga</span>
          <strong>{number.format(rekap.rekap.totalRtm)} RTM</strong>
          <small>Sesuai filter yang aktif</small>
        </article>
        <article className="data-kpi">
          <span>Total Anggota</span>
          <strong>{number.format(rekap.rekap.totalAnggota)} orang</strong>
          <small>Seluruh anggota pada RTM yang ditampilkan</small>
        </article>
        <article className="data-kpi">
          <span>Rata-rata Anggota</span>
          <strong>{number.format(Number(rataAnggota.toFixed(1)))}</strong>
          <small>Orang per rumah tangga</small>
        </article>
        <article className="data-kpi">
          <span>Filter Aktif</span>
          <strong>{number.format(hitungFilterRtm(filter) + (filter.search ? 1 : 0))}</strong>
          <small>{filter.search ? "Termasuk pencarian" : "Tanpa pencarian"}</small>
        </article>
      </section>

      <section className="platform-card data-panel">
        <header>
          <h2>Daftar Rumah Tangga</h2>
          <p>
            {number.format(result.total)} RTM pada halaman {result.page} dari {result.pageCount}
          </p>
        </header>

        <FilterRtm dusun={filterOptions.dusun} filter={filter} resetHref="/rumah-tangga" />

        {chipFilterAktif(filter).length > 0 ? (
          <div className={styles.chips}>
            <span className={styles.chipsLabel}>Filter aktif:</span>
            {chipFilterAktif(filter).map((chip) => {
              const tanpaChip = new URLSearchParams(filterQuery);
              tanpaChip.delete(chip.kunci);
              const href = tanpaChip.toString() ? `?${tanpaChip.toString()}` : "/rumah-tangga";
              return (
                <Link className={styles.chip} href={href} key={chip.kunci}>
                  {chip.label}
                  <span aria-hidden="true" className={styles.chipClose}>
                    ×
                  </span>
                </Link>
              );
            })}
          </div>
        ) : null}

        <RtmToolbar
          bolehTambah={bolehTambah}
          exportHref={`/rumah-tangga/laporan/ekspor${filterSuffix}`}
        />

        {result.rows.length === 0 ? (
          <div className="modul-empty">
            <strong>Belum ada rumah tangga yang cocok.</strong>
            <p>Ubah filter atau tambahkan rumah tangga pertama untuk desa ini.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Nomor RTM</th>
                  <th>Kepala Rumah Tangga</th>
                  <th>Anggota</th>
                  <th>Kelas</th>
                  <th>BDT</th>
                  <th>DTKS</th>
                  <th>Alamat</th>
                  <th>Wilayah</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, index) => (
                  <tr key={row.id}>
                    <td>{(result.page - 1) * result.pageSize + index + 1}</td>
                    <td>
                      <Link href={`/rumah-tangga/${row.id}`}>
                        <strong>{row.number}</strong>
                      </Link>
                    </td>
                    <td>
                      {row.headName ? (
                        <Link href={`/rumah-tangga/${row.id}`}>{row.headName}</Link>
                      ) : (
                        <span className={styles.muted}>Belum ditentukan</span>
                      )}
                    </td>
                    <td>{number.format(row.memberCount)}</td>
                    <td>{labelKelas(row.kelasSosial)}</td>
                    <td>{row.bdt ?? "—"}</td>
                    <td>{row.hasDtks ? "Terdaftar" : "—"}</td>
                    <td>{row.address ?? "—"}</td>
                    <td>{row.regionLabel ?? "—"}</td>
                    <td>
                      <div className={styles.actions}>
                        <Link className="button button-ghost" href={`/rumah-tangga/${row.id}`}>
                          Detail
                        </Link>
                        {bolehUbah ? (
                          <Link
                            className="button button-ghost"
                            href={`/rumah-tangga/${row.id}/ubah`}
                          >
                            Ubah
                          </Link>
                        ) : null}
                        {bolehHapus ? (
                          <form action={hapusRumahTanggaAction}>
                            <input name="id" type="hidden" value={row.id} />
                            <ConfirmSubmit
                              className="button button-danger"
                              message={`Hapus Rumah Tangga ${row.number}? Anggota akan dilepas dari RTM ini.`}
                            >
                              Hapus
                            </ConfirmSubmit>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {result.pageCount > 1 ? (
          <nav aria-label="Navigasi halaman rumah tangga" className="pagination">
            {result.page > 1 ? (
              <Link className="button button-secondary" href={halamanHref(result.page - 1)}>
                ← Sebelumnya
              </Link>
            ) : null}
            <span>
              Halaman {result.page} dari {result.pageCount}
            </span>
            {result.page < result.pageCount ? (
              <Link className="button button-secondary" href={halamanHref(result.page + 1)}>
                Berikutnya →
              </Link>
            ) : null}
          </nav>
        ) : null}
      </section>
    </div>
  );
}
