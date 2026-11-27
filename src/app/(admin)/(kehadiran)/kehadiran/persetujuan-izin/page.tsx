import type { Metadata } from "next";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import {
  formatRentang,
  formatWaktuPengajuan,
  JENIS_PENGAJUAN_IZIN,
  labelJenisPengajuan,
  labelStatusPengajuan,
  PERSETUJUAN_IZIN_RESOURCE,
  STATUS_PENGAJUAN,
  type PengajuanIzinRow,
} from "@/features/kehadiran/kehadiran/domain/pengajuan-izin";
import { getPersetujuanIzinData } from "@/features/kehadiran/kepegawaian/application/pengajuan-izin-use-cases";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import { putuskanIzinAction } from "./actions";
import { FormKeputusanIzin } from "./form-keputusan-izin";

export const metadata: Metadata = { title: "Persetujuan Izin" };

const PESAN_STATUS: Readonly<Record<string, string>> = {
  disetujui: "Pengajuan izin berhasil disetujui.",
  ditolak: "Pengajuan izin berhasil ditolak.",
};

function nilai(params: Record<string, string | string[] | undefined>, kunci: string): string {
  const isi = params[kunci];
  return typeof isi === "string" ? isi : "";
}

/** Tiga status pengajuan ditambah pilihan "semua" untuk filter. */
const PILIHAN_STATUS = ["", ...STATUS_PENGAJUAN] as const;

export default async function PersetujuanIzinPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, user] = await Promise.all([searchParams, verifySession()]);
  const rows = await getPersetujuanIzinData();

  const bolehPutuskan = hasPermission(user.permissions, PERSETUJUAN_IZIN_RESOURCE, "update");

  // OpenSID membuka daftar ini dengan filter status "Menunggu Persetujuan"
  // sehingga antrean keputusan langsung terlihat.
  const filterStatusMentah = nilai(params, "status");
  const filterStatus =
    filterStatusMentah === "" && params.status === undefined ? "menunggu" : filterStatusMentah;
  const filterJenis = nilai(params, "jenis");

  const terfilter = rows.filter(
    (row) =>
      (filterStatus === "" || row.status === filterStatus) &&
      (filterJenis === "" || row.jenis === filterJenis),
  );

  const jumlahMenunggu = rows.filter((row) => row.status === "menunggu").length;
  const jumlahDisetujui = rows.filter((row) => row.status === "disetujui").length;
  const jumlahDitolak = rows.filter((row) => row.status === "ditolak").length;

  const pesanStatus = PESAN_STATUS[nilai(params, "hasil")];

  return (
    <div className="modul-page data-kependudukan-page">
      <PageHeading
        judul={<>Persetujuan Izin</>}
        deskripsi={<>Setujui atau tolak pengajuan izin perangkat desa.</>}
      />

      {pesanStatus ? (
        <p className="form-help" role="status">
          {pesanStatus}
        </p>
      ) : null}

      <TableCard
        actions={
          <ButtonLink variant="secondary" href="/kehadiran/persetujuan-izin">
            Atur Ulang Filter
          </ButtonLink>
        }
        description={
          terfilter.length === 0
            ? "Tidak ada pengajuan yang sesuai filter."
            : `${terfilter.length} pengajuan ditampilkan · ${jumlahMenunggu} menunggu, ${jumlahDisetujui} disetujui, ${jumlahDitolak} ditolak.`
        }
        filter={
          <form className="data-custom-filter" method="get">
            <FormField
              defaultValue={filterStatus}
              kind="select"
              label="Status"
              name="status"
              options={PILIHAN_STATUS.map((status) => ({
                value: status,
                label:
                  status === ""
                    ? "Semua Status"
                    : status === "menunggu"
                      ? "Menunggu Persetujuan"
                      : labelStatusPengajuan(status),
              }))}
            />
            <FormField
              defaultValue={filterJenis}
              kind="select"
              label="Jenis Izin"
              name="jenis"
              options={[
                { value: "", label: "Semua Jenis Izin" },
                ...JENIS_PENGAJUAN_IZIN.map((jenis) => ({
                  value: jenis.nilai,
                  label: jenis.label,
                })),
              ]}
            />
            <Button type="submit">Tampilkan</Button>
          </form>
        }
        title="Daftar Pengajuan Izin"
      >
        {terfilter.length === 0 ? (
          <div className="modul-empty">
            <strong>Tidak ada pengajuan izin.</strong>
            <p>
              Pengajuan perangkat desa muncul di sini setelah diajukan melalui halaman Absensi &amp;
              Kepegawaian → Cuti &amp; Izin.
            </p>
          </div>
        ) : (
          <TableScroll>
            <Table>
              <THead>
                <Row>
                  <HeaderCell scope="col">No.</HeaderCell>
                  <HeaderCell scope="col">Nama Perangkat</HeaderCell>
                  <HeaderCell scope="col">Jabatan</HeaderCell>
                  <HeaderCell scope="col">Jenis Izin</HeaderCell>
                  <HeaderCell scope="col">Keterangan</HeaderCell>
                  <HeaderCell scope="col">Tanggal</HeaderCell>
                  <HeaderCell scope="col">Durasi</HeaderCell>
                  <HeaderCell scope="col">Status</HeaderCell>
                  <HeaderCell scope="col">Tanggal Pengajuan</HeaderCell>
                  {bolehPutuskan ? <HeaderCell scope="col">Aksi</HeaderCell> : null}
                </Row>
              </THead>
              <TBody>
                {terfilter.map((row, index) => (
                  <Row key={row.id}>
                    <Cell>{index + 1}</Cell>
                    <Cell>{row.nama}</Cell>
                    <Cell>{row.jabatan ?? "-"}</Cell>
                    <Cell>{labelJenisPengajuan(row.jenis)}</Cell>
                    <Cell>
                      {row.keterangan}
                      {row.lampiran ? (
                        <>
                          <br />
                          <a href={lampiranHref(row)}>Lihat lampiran</a>
                        </>
                      ) : null}
                      {row.catatan ? (
                        <>
                          <br />
                          <small>Catatan keputusan: {row.catatan}</small>
                        </>
                      ) : null}
                    </Cell>
                    <Cell>{formatRentang(row.mulai, row.selesai)}</Cell>
                    <Cell>{row.durasi} hari kerja</Cell>
                    <Cell>{labelStatusPengajuan(row.status)}</Cell>
                    <Cell>{formatWaktuPengajuan(row.createdAt)}</Cell>
                    {bolehPutuskan ? (
                      <Cell>
                        {row.status === "menunggu" ? (
                          <details>
                            <summary>Putuskan</summary>
                            <FormKeputusanIzin aksi={putuskanIzinAction} id={row.id} />
                          </details>
                        ) : (
                          "-"
                        )}
                      </Cell>
                    ) : null}
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

/** Lampiran disajikan route unduhan yang sudah memeriksa izin dan tenant. */
function lampiranHref(row: PengajuanIzinRow): string {
  return `/api/kepegawaian/cuti/${row.id}/lampiran`;
}
