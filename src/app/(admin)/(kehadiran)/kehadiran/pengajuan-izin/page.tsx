import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import {
  formatRentang,
  JENIS_PENGAJUAN_IZIN,
  KETERANGAN_PENGAJUAN_MAKS,
  labelJenisPengajuan,
  labelStatusPengajuan,
} from "@/features/kehadiran/kehadiran/domain/pengajuan-izin";
import { getPengajuanIzinData } from "@/features/kehadiran/kepegawaian/application/pengajuan-izin-use-cases";

import { batalkanPengajuanIzinAction } from "./actions";
import { ajukanPengajuanIzinFormAction } from "./form-actions";

export const metadata: Metadata = { title: "Pengajuan Izin" };

const PESAN_STATUS: Readonly<Record<string, string>> = {
  diajukan: "Pengajuan izin berhasil dikirim dan menunggu keputusan.",
  dibatalkan: "Pengajuan izin berhasil dibatalkan.",
};

function nilaiTunggal(nilai: string | string[] | undefined): string {
  if (Array.isArray(nilai)) return nilai[0] ?? "";
  return nilai ?? "";
}

export default async function PengajuanIzinPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, data] = await Promise.all([searchParams, getPengajuanIzinData()]);
  // Setiap pamong yang akunnya tertaut boleh mengajukan/membatalkan izinnya
  // sendiri; pemegang izin persetujuan boleh mewakili pegawai lain.
  const bolehAjukan = Boolean(data.pegawaiAkun) || data.bolehPilihPegawai;
  const bolehBatalkan = bolehAjukan;
  const pesanStatus = PESAN_STATUS[nilaiTunggal(params.status)];
  const hariIni = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());

  return (
    <div className="modul-page data-kependudukan-page">
      <PageHeading
        judul={<>Pengajuan Izin</>}
        deskripsi={<>Ajukan izin, sakit, dinas luar kota, atau cuti.</>}
      />

      {pesanStatus ? (
        <p className="form-help" role="status">
          {pesanStatus}
        </p>
      ) : null}

      {!data.pegawaiAkun ? (
        <p className="form-help" role="status">
          Akun belum tertaut ke data pegawai; minta admin mengisi email di profil pegawai.
        </p>
      ) : null}

      <TableCard
        actions={
          bolehAjukan ? (
            <FormDialog
              aksi={ajukanPengajuanIzinFormAction}
              deskripsi="Lampiran surat dokter wajib untuk jenis Sakit. Durasi dihitung dari hari kerja sesuai pengaturan hari libur desa."
              judul="Ajukan izin"
              label="＋ Ajukan Izin"
              labelSimpan="Kirim pengajuan"
            >
              <div className="modul-form-grid">
                {data.bolehPilihPegawai ? (
                  <FormField
                    kind="select"
                    label="Nama pegawai"
                    name="pegawaiId"
                    options={data.pegawai.map((item) => ({
                      value: String(item.id),
                      label: `${item.nama}${item.jabatan ? ` — ${item.jabatan}` : ""}`,
                    }))}
                    required
                  />
                ) : (
                  <FormField
                    label="Nama pegawai"
                    readOnly
                    value={data.pegawaiAkun?.nama ?? "Akun belum tertaut ke pegawai"}
                  />
                )}
                <FormField
                  defaultValue="izin"
                  helpText={`${JENIS_PENGAJUAN_IZIN.map(
                    (item) => `${item.label}: ${item.keterangan}`,
                  ).join(". ")}.`}
                  kind="select"
                  label="Jenis izin"
                  name="jenis"
                  options={JENIS_PENGAJUAN_IZIN.map((item) => ({
                    value: item.nilai,
                    label: item.label,
                  }))}
                  required
                />
                <FormField label="Tanggal mulai" min={hariIni} name="mulai" required type="date" />
                <FormField
                  label="Tanggal selesai"
                  min={hariIni}
                  name="selesai"
                  required
                  type="date"
                />
                <FormField
                  containerClassName="form-field-full"
                  kind="textarea"
                  label="Keterangan"
                  maxLength={KETERANGAN_PENGAJUAN_MAKS}
                  name="keterangan"
                  placeholder="Jelaskan alasan pengajuan izin"
                  required
                  rows={3}
                />
                <FormField
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  containerClassName="form-field-full"
                  helpText="PDF/JPG/PNG/WEBP, maksimal 10 MB. Wajib untuk jenis Sakit."
                  label="Lampiran pendukung"
                  name="lampiran"
                  type="file"
                />
              </div>
            </FormDialog>
          ) : null
        }
        description={
          data.rows.length === 0
            ? "Belum ada pengajuan pada tahun ini."
            : `${data.rows.length} pengajuan pada tahun ${data.tahun}.`
        }
        title="Pengajuan Saya"
      >
        {data.rows.length === 0 ? (
          <div className="modul-empty">
            <strong>Belum ada pengajuan izin.</strong>
            <p>Pengajuan yang Anda kirim akan tampil di sini beserta status keputusannya.</p>
          </div>
        ) : (
          <TableScroll>
            <Table>
              <THead>
                <Row>
                  <HeaderCell scope="col">No.</HeaderCell>
                  <HeaderCell scope="col">Jenis</HeaderCell>
                  <HeaderCell scope="col">Tanggal</HeaderCell>
                  <HeaderCell scope="col">Durasi</HeaderCell>
                  <HeaderCell scope="col">Keterangan</HeaderCell>
                  <HeaderCell scope="col">Status</HeaderCell>
                  {bolehBatalkan ? <HeaderCell scope="col">Aksi</HeaderCell> : null}
                </Row>
              </THead>
              <TBody>
                {data.rows.map((row, index) => (
                  <Row key={row.id}>
                    <Cell>{index + 1}</Cell>
                    <Cell>{labelJenisPengajuan(row.jenis)}</Cell>
                    <Cell>{formatRentang(row.mulai, row.selesai)}</Cell>
                    <Cell>{row.durasi} hari kerja</Cell>
                    <Cell>
                      {row.keterangan}
                      {row.lampiran ? (
                        <>
                          <br />
                          <a href={`/api/kepegawaian/cuti/${row.id}/lampiran`}>Lihat lampiran</a>
                        </>
                      ) : null}
                      {row.catatan ? (
                        <>
                          <br />
                          <span className="form-help">Catatan: {row.catatan}</span>
                        </>
                      ) : null}
                    </Cell>
                    <Cell>{labelStatusPengajuan(row.status)}</Cell>
                    {bolehBatalkan ? (
                      <Cell>
                        {row.status === "menunggu" ? (
                          <form action={batalkanPengajuanIzinAction}>
                            <input name="id" type="hidden" value={row.id} />
                            <ConfirmSubmit variant="ghost" message="Batalkan pengajuan izin ini?">
                              Batalkan
                            </ConfirmSubmit>
                          </form>
                        ) : (
                          "—"
                        )}
                      </Cell>
                    ) : null}
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        )}

        <p className="modul-muted">
          Keputusan pengajuan dilakukan pada menu{" "}
          <Link href="/kehadiran/persetujuan-izin">Persetujuan Izin</Link>.
        </p>
      </TableCard>
    </div>
  );
}
