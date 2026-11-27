import type { Metadata } from "next";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { getRekapitulasiKehadiranData } from "@/features/kehadiran/kehadiran/application/rekapitulasi-use-cases";
import {
  bacaFilterRekapitulasi,
  REKAPITULASI_KEHADIRAN_RESOURCE,
  tanggalIndonesia,
} from "@/features/kehadiran/kehadiran/domain/rekapitulasi";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import styles from "./rekapitulasi.module.css";

export const metadata: Metadata = { title: "Rekapitulasi Kehadiran" };

function nilai(params: Record<string, string | string[] | undefined>, kunci: string): string {
  const isi = params[kunci];
  return typeof isi === "string" ? isi : "";
}

export default async function RekapitulasiKehadiranPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, user] = await Promise.all([searchParams, verifySession()]);
  const filter = bacaFilterRekapitulasi({
    dari: nilai(params, "dari"),
    sampai: nilai(params, "sampai"),
    perangkat: nilai(params, "perangkat"),
    status: nilai(params, "status"),
  });
  const data = await getRekapitulasiKehadiranData(filter);
  const bolehEkspor = hasPermission(user.permissions, REKAPITULASI_KEHADIRAN_RESOURCE, "read");

  const query = new URLSearchParams();
  if (filter.dari) query.set("dari", filter.dari);
  if (filter.sampai) query.set("sampai", filter.sampai);
  if (filter.perangkatId) query.set("perangkat", String(filter.perangkatId));
  if (filter.status) query.set("status", filter.status);
  const eksporHref = `/kehadiran/rekapitulasi/ekspor${query.size ? `?${query.toString()}` : ""}`;

  return (
    <div className="modul-page data-kependudukan-page">
      <PageHeading
        judul={<>Rekapitulasi Kehadiran</>}
        deskripsi={<>Rekap kehadiran perangkat desa.</>}
      />

      <TableCard
        actions={
          bolehEkspor ? (
            <ButtonLink variant="secondary" href={eksporHref}>
              Ekspor ke Excel
            </ButtonLink>
          ) : null
        }
        description={
          data.rows.length === 0
            ? "Tidak ada catatan kehadiran pada filter ini."
            : `${data.rows.length} catatan kehadiran.`
        }
        filter={
          <form className="data-custom-filter" method="get">
            <FormField
              defaultValue={filter.dari ?? ""}
              label="Dari tanggal"
              name="dari"
              type="date"
            />
            <FormField
              defaultValue={filter.sampai ?? ""}
              label="Sampai tanggal"
              name="sampai"
              type="date"
            />
            <FormField
              defaultValue={filter.perangkatId ?? ""}
              kind="select"
              label="Perangkat Desa"
              name="perangkat"
              options={[
                { value: "", label: "Semua Perangkat" },
                ...data.perangkat.map((item) => ({
                  value: String(item.id),
                  label: `${item.nama ?? "-"}${item.jabatan ? ` — ${item.jabatan}` : ""}`,
                })),
              ]}
            />
            <FormField
              defaultValue={filter.status ?? ""}
              kind="select"
              label="Status Kehadiran"
              name="status"
              options={[
                { value: "", label: "Semua Status" },
                ...data.statusOptions.map((status) => ({
                  value: status,
                  label: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " "),
                })),
              ]}
            />
            <Button type="submit">Tampilkan</Button>
          </form>
        }
        title="Rekap Kehadiran"
      >
        <p className="modul-muted">Total waktu dihitung dari selisih jam keluar dan jam masuk.</p>
        {data.rows.length === 0 ? (
          <div className="modul-empty">
            <strong>Belum ada catatan kehadiran.</strong>
            <p>
              Catatan muncul setelah perangkat melakukan absensi atau operator mengisi absensi
              manual.
            </p>
          </div>
        ) : (
          <TableScroll className={styles.wrap}>
            <Table className={styles.tabel}>
              <THead>
                <Row>
                  <HeaderCell scope="col">No</HeaderCell>
                  <HeaderCell scope="col">Nama</HeaderCell>
                  <HeaderCell scope="col">Jabatan</HeaderCell>
                  <HeaderCell scope="col">Tanggal</HeaderCell>
                  <HeaderCell scope="col">Jam Masuk</HeaderCell>
                  <HeaderCell scope="col">Jam Keluar</HeaderCell>
                  <HeaderCell scope="col">Total Waktu</HeaderCell>
                  <HeaderCell scope="col">Status</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {data.rows.map((row, index) => (
                  <Row key={row.id}>
                    <Cell className={styles.nomor}>{index + 1}</Cell>
                    <Cell>{row.nama}</Cell>
                    <Cell>{row.jabatan}</Cell>
                    <Cell>{tanggalIndonesia(row.tanggal)}</Cell>
                    <Cell className={styles.jam}>{row.jamMasuk ?? "-"}</Cell>
                    <Cell className={styles.jam}>{row.jamKeluar ?? "-"}</Cell>
                    <Cell className={styles.jam}>{row.totalWaktu}</Cell>
                    <Cell>
                      <span
                        className={`${styles.lencana} ${
                          row.status.toLowerCase() === "hadir" ? styles.hadir : styles.lain
                        }`}
                      >
                        {row.status}
                      </span>
                    </Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        )}
      </TableCard>
    </div>
  );
}
