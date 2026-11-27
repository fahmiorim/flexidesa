import type { Metadata } from "next";
import Link from "next/link";

import { hapusRumahTanggaAction } from "@/app/(admin)/(kependudukan)/kependudukan/rumah-tangga/actions";
import { PageHeading } from "@/components/shell/page-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import {
  getLaporanRumahTangga,
  getRtmFilterOptions,
  listRumahTangga,
} from "@/features/kependudukan/rumah-tangga/application/use-cases";
import {
  filterRtmKeSearchParams,
  hitungFilterRtm,
  parseFilterRtm,
  RTM_SEX_LABELS,
  RTM_STATUS_LABELS,
  RUMAH_TANGGA_RESOURCE,
  type RtmFilter,
} from "@/features/kependudukan/rumah-tangga/domain/rumah-tangga";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
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
      <PageHeading judul={<>Rumah Tangga</>} deskripsi={<>Kelola rumah tangga dan anggotanya.</>} />

      {params.dihapus === "1" ? (
        <p className="form-help" role="status">
          Rumah Tangga berhasil dihapus. Anggota yang terhubung sudah dilepas.
        </p>
      ) : null}

      <StatGrid columns={4}>
        <StatCard
          label="Total Rumah Tangga"
          note="Sesuai filter yang aktif"
          utama
          value={`${number.format(rekap.rekap.totalRtm)} RTM`}
        />
        <StatCard
          label="Total Anggota"
          note="Seluruh anggota pada RTM yang ditampilkan"
          value={`${number.format(rekap.rekap.totalAnggota)} orang`}
        />
        <StatCard
          label="Rata-rata Anggota"
          note="Orang per rumah tangga"
          value={number.format(Number(rataAnggota.toFixed(1)))}
        />
        <StatCard
          label="Filter Aktif"
          note={filter.search ? "Termasuk pencarian" : "Tanpa pencarian"}
          value={number.format(hitungFilterRtm(filter) + (filter.search ? 1 : 0))}
        />
      </StatGrid>

      <TableCard
        title="Daftar Rumah Tangga"
        description={`${number.format(result.total)} RTM pada halaman ${result.page} dari ${result.pageCount}`}
        filter={
          <FilterRtm
            dusun={filterOptions.dusun}
            filter={filter}
            resetHref="/kependudukan/rumah-tangga"
          />
        }
      >
        {chipFilterAktif(filter).length > 0 ? (
          <div className={styles.chips}>
            <span className={styles.chipsLabel}>Filter aktif:</span>
            {chipFilterAktif(filter).map((chip) => {
              const tanpaChip = new URLSearchParams(filterQuery);
              tanpaChip.delete(chip.kunci);
              const href = tanpaChip.toString()
                ? `?${tanpaChip.toString()}`
                : "/kependudukan/rumah-tangga";
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
          exportHref={`/kependudukan/rumah-tangga/laporan/ekspor${filterSuffix}`}
        />

        {result.rows.length === 0 ? (
          <div className="modul-empty">
            <strong>Belum ada rumah tangga yang cocok.</strong>
            <p>Ubah filter atau tambahkan rumah tangga pertama untuk desa ini.</p>
          </div>
        ) : (
          <TableScroll>
            <Table>
              <THead>
                <Row>
                  <HeaderCell>No.</HeaderCell>
                  <HeaderCell>Nomor RTM</HeaderCell>
                  <HeaderCell>Kepala Rumah Tangga</HeaderCell>
                  <HeaderCell>Anggota</HeaderCell>
                  <HeaderCell>Kelas</HeaderCell>
                  <HeaderCell>BDT</HeaderCell>
                  <HeaderCell>DTKS</HeaderCell>
                  <HeaderCell>Alamat</HeaderCell>
                  <HeaderCell>Wilayah</HeaderCell>
                  <HeaderCell>Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {result.rows.map((row, index) => (
                  <Row key={row.id}>
                    <Cell>{(result.page - 1) * result.pageSize + index + 1}</Cell>
                    <Cell>
                      <Link href={`/kependudukan/rumah-tangga/${row.id}`}>
                        <strong>{row.number}</strong>
                      </Link>
                    </Cell>
                    <Cell>
                      {row.headName ? (
                        <Link href={`/kependudukan/rumah-tangga/${row.id}`}>{row.headName}</Link>
                      ) : (
                        <span className={styles.muted}>Belum ditentukan</span>
                      )}
                    </Cell>
                    <Cell>{number.format(row.memberCount)}</Cell>
                    <Cell>{labelKelas(row.kelasSosial)}</Cell>
                    <Cell>{row.bdt ?? "—"}</Cell>
                    <Cell>{row.hasDtks ? "Terdaftar" : "—"}</Cell>
                    <Cell>{row.address ?? "—"}</Cell>
                    <Cell>{row.regionLabel ?? "—"}</Cell>
                    <Cell>
                      <div className={styles.actions}>
                        <ButtonLink variant="ghost" href={`/kependudukan/rumah-tangga/${row.id}`}>
                          Detail
                        </ButtonLink>
                        {bolehUbah ? (
                          <ButtonLink
                            variant="ghost"
                            href={`/kependudukan/rumah-tangga/${row.id}/ubah`}
                          >
                            Ubah
                          </ButtonLink>
                        ) : null}
                        {bolehHapus ? (
                          <DialogHapusForm
                            aksi={hapusRumahTanggaAction}
                            id={row.id}
                            judul={`Hapus Rumah Tangga ${row.number}?`}
                            keterangan="Semua anggota akan dilepas dari RTM ini; data penduduk tetap tersimpan."
                            labelAksi="Hapus RTM"
                          />
                        ) : null}
                      </div>
                    </Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        )}

        {result.pageCount > 1 ? (
          <nav aria-label="Navigasi halaman rumah tangga" className="pagination">
            {result.page > 1 ? (
              <ButtonLink variant="secondary" href={halamanHref(result.page - 1)}>
                ← Sebelumnya
              </ButtonLink>
            ) : null}
            <span>
              Halaman {result.page} dari {result.pageCount}
            </span>
            {result.page < result.pageCount ? (
              <ButtonLink variant="secondary" href={halamanHref(result.page + 1)}>
                Berikutnya →
              </ButtonLink>
            ) : null}
          </nav>
        ) : null}
      </TableCard>
    </div>
  );
}
