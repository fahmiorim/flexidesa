import type { Metadata } from "next";

import { PageHeading } from "@/components/shell/page-heading";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { getPengaduanKehadiranData } from "@/features/kehadiran/kehadiran/application/pengaduan-kehadiran-use-cases";
import { KETERANGAN_MAKS } from "@/features/kehadiran/kehadiran/domain/pengaduan-kehadiran";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import { ubahPengaduanKehadiranFormAction } from "./form-actions";

export const metadata: Metadata = { title: "Pengaduan Kehadiran" };

const RESOURCE = "pengaduan-kehadiran";

/** Format waktu seperti `tgl_indo2` OpenSID: tanggal, bulan, tahun, jam. */
const formatWaktu = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function waktuLaporan(nilai: string): string {
  const parsed = new Date(nilai);
  return Number.isNaN(parsed.getTime()) ? nilai : formatWaktu.format(parsed);
}

export default async function PengaduanKehadiranPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, user] = await Promise.all([searchParams, verifySession()]);
  const rows = await getPengaduanKehadiranData();
  const bolehUbah = hasPermission(user.permissions, RESOURCE, "update");
  const diperbarui = params.diperbarui;

  return (
    <div className="modul-page data-kependudukan-page">
      <PageHeading
        judul={<>Pengaduan Kehadiran</>}
        deskripsi={<>Pengaduan kehadiran perangkat desa.</>}
      />

      {diperbarui ? (
        <p className="form-help" role="status">
          Keterangan pengaduan berhasil disimpan.
        </p>
      ) : null}

      <TableCard
        description={
          rows.length === 0
            ? "Belum ada laporan kehadiran dari warga."
            : `${rows.length} laporan kehadiran tercatat.`
        }
        title="Daftar Pengaduan"
      >
        {rows.length === 0 ? (
          <div className="modul-empty">
            <strong>Belum ada pengaduan kehadiran.</strong>
            <p>
              Laporan masuk dari layanan mandiri warga saat menekan “Laporkan” pada daftar kehadiran
              perangkat.
            </p>
          </div>
        ) : (
          <TableScroll>
            <Table>
              <THead>
                <Row>
                  <HeaderCell scope="col">No</HeaderCell>
                  <HeaderCell scope="col">Aksi</HeaderCell>
                  <HeaderCell scope="col">Waktu</HeaderCell>
                  <HeaderCell scope="col">Pelapor</HeaderCell>
                  <HeaderCell scope="col">Terlapor</HeaderCell>
                  <HeaderCell scope="col">Keterangan</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {rows.map((row, index) => (
                  <Row key={row.id}>
                    <Cell>{index + 1}</Cell>
                    <Cell>
                      {bolehUbah ? (
                        <FormDialog
                          aksi={ubahPengaduanKehadiranFormAction}
                          deskripsi={`Ubah keterangan pengaduan dari ${row.pelapor ?? "pelapor"}.`}
                          judul="Ubah keterangan pengaduan"
                          label="Ubah"
                          labelSimpan="Simpan"
                          varian="secondary"
                        >
                          <div className="modul-form-grid">
                            <input name="id" type="hidden" value={row.id} />
                            <FormField
                              containerClassName="form-field-full"
                              defaultValue={row.keterangan ?? ""}
                              kind="textarea"
                              label="Keterangan"
                              maxLength={KETERANGAN_MAKS}
                              name="keterangan"
                              rows={3}
                            />
                          </div>
                        </FormDialog>
                      ) : (
                        <span className="modul-muted">—</span>
                      )}
                    </Cell>
                    <Cell>{waktuLaporan(row.waktu)}</Cell>
                    <Cell>{row.pelapor ?? "-"}</Cell>
                    <Cell>{row.terlapor ?? "-"}</Cell>
                    <Cell>{row.keterangan ?? "-"}</Cell>
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
