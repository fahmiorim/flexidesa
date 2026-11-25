import type { Metadata } from "next";
import Link from "next/link";

import { hapusKelompokAction, hapusKelompokMassalAction } from "@/app/(admin)/kelompok/actions";
import { PageHeading } from "@/components/shell/page-heading";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { getReferensiKelompok, listKelompok } from "@/features/kelompok/application/use-cases";
import {
  filterKelompokKeSearchParams,
  hitungFilterKelompok,
  KELOMPOK_RESOURCE,
  kelompokTipeLabel,
  parseFilterKelompok,
  type KelompokFilter,
  type KelompokTipe,
} from "@/features/kelompok/domain/kelompok";
import { hasPermission } from "@/features/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import { FilterKelompok } from "./filter-kelompok";
import { KelompokToolbar } from "./kelompok-toolbar";
import styles from "./kelompok.module.css";

export const metadata: Metadata = { title: "Kelompok & Lembaga" };
const number = new Intl.NumberFormat("id-ID");

const TABS: Array<{ nilai: KelompokTipe | null; label: string }> = [
  { nilai: null, label: "Semua" },
  { nilai: "kelompok", label: "Kelompok Masyarakat" },
  { nilai: "lembaga", label: "Lembaga Desa" },
];

/** Daftar chip filter aktif beserta tautan untuk melepas satu filter. */
function chipFilterAktif(filter: KelompokFilter): Array<{ kunci: string; label: string }> {
  const chips: Array<{ kunci: string; label: string }> = [];
  if (filter.search) chips.push({ kunci: "q", label: `“${filter.search}”` });
  if (filter.status) {
    chips.push({
      kunci: "status",
      label: `Status: ${filter.status === "aktif" ? "Aktif" : "Tidak Aktif"}`,
    });
  }
  if (filter.categoryId !== null) chips.push({ kunci: "kategori", label: "Kategori terpilih" });
  return chips;
}

export default async function KelompokPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, user, referensi] = await Promise.all([
    searchParams,
    verifySession(),
    getReferensiKelompok(null),
  ]);
  const filter = parseFilterKelompok(params);
  const pageRaw = typeof params.page === "string" ? Number(params.page) : 1;
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const pageSize = 25;
  const initial = await listKelompok({ filter, page, pageSize });
  const result =
    page > initial.pageCount
      ? await listKelompok({ filter, page: initial.pageCount, pageSize })
      : initial;

  const bolehTambah = hasPermission(user.permissions, KELOMPOK_RESOURCE, "create");
  const bolehUbah = hasPermission(user.permissions, KELOMPOK_RESOURCE, "update");
  const bolehHapus = hasPermission(user.permissions, KELOMPOK_RESOURCE, "delete");
  const filterQuery = filterKelompokKeSearchParams(filter);
  const halamanHref = (target: number) => {
    const next = new URLSearchParams(filterQuery);
    next.set("page", String(target));
    return `?${next.toString()}`;
  };
  const tabHref = (tipe: KelompokTipe | null) => {
    const next = new URLSearchParams(filterQuery);
    if (tipe) next.set("tipe", tipe);
    else next.delete("tipe");
    const query = next.toString();
    return query ? `/kelompok?${query}` : "/kelompok";
  };
  const cetakHref = `/kelompok/cetak${filter.tipe ? `?tipe=${filter.tipe}` : ""}`;
  const unduhHref = `/kelompok/ekspor${filter.tipe ? `?tipe=${filter.tipe}` : ""}`;

  return (
    <div className="modul-page data-kependudukan-page">
      <PageHeading>
        <header className="page-heading">
          <div>
            <h1>Kelompok &amp; Lembaga</h1>
            <p>Kelola kelompok masyarakat, lembaga desa, kategori, dan anggotanya.</p>
          </div>
        </header>
      </PageHeading>

      {params.dihapus === "1" ? (
        <p className="form-help" role="status">
          Kelompok berhasil dihapus.
        </p>
      ) : null}

      <section className="data-kependudukan-kpis">
        <article className="data-kpi data-kpi-primary">
          <span>Total Kelompok</span>
          <strong>{number.format(result.total)} kelompok</strong>
          <small>Sesuai filter yang aktif</small>
        </article>
        <article className="data-kpi">
          <span>Total Anggota</span>
          <strong>
            {number.format(result.rows.reduce((jumlah, row) => jumlah + row.memberCount, 0))} orang
          </strong>
          <small>Pada halaman ini</small>
        </article>
        <article className="data-kpi">
          <span>Filter Aktif</span>
          <strong>{number.format(hitungFilterKelompok(filter) + (filter.search ? 1 : 0))}</strong>
          <small>{filter.search ? "Termasuk pencarian" : "Tanpa pencarian"}</small>
        </article>
      </section>

      <section className="platform-card data-panel">
        <header>
          <h2>Daftar Kelompok &amp; Lembaga</h2>
          <p>
            {number.format(result.total)} kelompok pada halaman {result.page} dari{" "}
            {result.pageCount}
          </p>
        </header>

        <nav aria-label="Tipe kelompok" className={styles.tipeTabs}>
          {TABS.map((tab) => (
            <Link
              className={
                filter.tipe === tab.nilai
                  ? `${styles.tipeTab} ${styles.tipeTabActive}`
                  : styles.tipeTab
              }
              href={tabHref(tab.nilai)}
              key={tab.label}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <FilterKelompok filter={filter} kategori={referensi.kategori} resetHref="/kelompok" />

        {chipFilterAktif(filter).length > 0 ? (
          <div className={styles.chips}>
            <span className={styles.chipsLabel}>Filter aktif:</span>
            {chipFilterAktif(filter).map((chip) => {
              const tanpaChip = new URLSearchParams(filterQuery);
              tanpaChip.delete(chip.kunci);
              const href = tanpaChip.toString() ? `?${tanpaChip.toString()}` : "/kelompok";
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

        <form action={hapusKelompokMassalAction}>
          <KelompokToolbar
            bolehHapus={bolehHapus}
            bolehTambah={bolehTambah}
            cetakHref={cetakHref}
            unduhHref={unduhHref}
          />

          {result.rows.length === 0 ? (
            <div className="modul-empty">
              <strong>Belum ada kelompok yang cocok.</strong>
              <p>Ubah filter atau tambahkan kelompok pertama untuk desa ini.</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    {bolehHapus ? <th>Hapus</th> : null}
                    <th>No.</th>
                    <th>Aksi</th>
                    <th>Kode</th>
                    <th>Nama</th>
                    <th>Ketua</th>
                    <th>Kategori</th>
                    <th>Tipe</th>
                    <th>Jumlah Anggota</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, index) => (
                    <tr key={row.id}>
                      {bolehHapus ? (
                        <td>
                          <input
                            aria-label={`Pilih ${row.name}`}
                            name="idCb"
                            type="checkbox"
                            value={row.id}
                          />
                        </td>
                      ) : null}
                      <td>{(result.page - 1) * result.pageSize + index + 1}</td>
                      <td>
                        <div className={styles.actions}>
                          <Link className="button button-ghost" href={`/kelompok/${row.id}`}>
                            Rincian
                          </Link>
                          {bolehUbah ? (
                            <Link className="button button-ghost" href={`/kelompok/${row.id}/ubah`}>
                              Ubah
                            </Link>
                          ) : null}
                          {bolehHapus && row.memberCount === 0 ? (
                            <ConfirmSubmit
                              className="button button-danger"
                              form={`hapus-kelompok-${row.id}`}
                              message={`Hapus kelompok ${row.name}?`}
                            >
                              Hapus
                            </ConfirmSubmit>
                          ) : null}
                        </div>
                      </td>
                      <td>{row.code ?? "—"}</td>
                      <td>
                        <Link href={`/kelompok/${row.id}`}>
                          <strong>{row.name}</strong>
                        </Link>
                      </td>
                      <td>{row.leaderName ?? "—"}</td>
                      <td>{row.categoryName ?? "—"}</td>
                      <td>{kelompokTipeLabel(row.type)}</td>
                      <td>{number.format(row.memberCount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </form>

        {bolehHapus
          ? result.rows
              .filter((row) => row.memberCount === 0)
              .map((row) => (
                <form action={hapusKelompokAction} id={`hapus-kelompok-${row.id}`} key={row.id}>
                  <input name="id" type="hidden" value={row.id} />
                </form>
              ))
          : null}

        {result.pageCount > 1 ? (
          <nav aria-label="Navigasi halaman kelompok" className="pagination">
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
