import type { Metadata } from "next";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormField } from "@/components/ui/form-field";
import { HapusTerpilih } from "@/components/ui/hapus-terpilih";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import {
  getLaporanPendudukData,
  LAPORAN_PENDUDUK_RESOURCE,
} from "@/features/kependudukan/statistik/application/laporan-penduduk-use-cases";
import {
  BULAN_LAPORAN,
  TAHUN_MAX,
  TAHUN_MIN,
} from "@/features/kependudukan/statistik/domain/laporan-penduduk";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import { hapusLaporanPendudukAction, hapusMassalLaporanPendudukAction } from "./actions";
import { simpanLaporanPendudukFormAction } from "./form-actions";
import { PilihSemuaLaporan } from "./pilih-semua-laporan";

export const metadata: Metadata = { title: "Laporan Penduduk" };

const formatTanggal = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function tanggal(nilai: string | null): string {
  if (!nilai) return "-";
  const parsed = new Date(nilai);
  return Number.isNaN(parsed.getTime()) ? nilai : formatTanggal.format(parsed);
}

function teks(params: Record<string, string | string[] | undefined>, kunci: string): string {
  const nilai = params[kunci];
  return typeof nilai === "string" ? nilai : "";
}

type LaporanRow = Awaited<ReturnType<typeof getLaporanPendudukData>>["rows"][number];

function formLaporan(row: LaporanRow | null, tahunDefault: number) {
  return (
    <div className="modul-form-grid">
      {row ? <input name="id" type="hidden" value={row.id} /> : null}
      <FormField
        containerClassName="form-field-full"
        defaultValue={row?.judul ?? ""}
        label="Judul"
        maxLength={255}
        name="judul"
        required
      />
      <FormField
        defaultValue={String(row?.bulan ?? new Date().getMonth() + 1)}
        kind="select"
        label="Bulan"
        name="bulan"
        options={BULAN_LAPORAN.map((bulan) => ({
          value: String(bulan.value),
          label: bulan.label,
        }))}
      />
      <FormField
        defaultValue={String(row?.tahun ?? tahunDefault)}
        label="Tahun"
        max={TAHUN_MAX}
        min={TAHUN_MIN}
        name="tahun"
        required
        type="number"
      />
      <FormField
        accept="application/pdf,.pdf"
        containerClassName="form-field-full"
        helpText={
          row
            ? "Kosongkan berkas jika tidak ingin mengubah dokumen. Maksimal 8 MB."
            : "Unggah berkas PDF maksimal 8 MB."
        }
        label={row ? "Ganti berkas (opsional)" : "File PDF"}
        name="berkas"
        required={row === null}
        type="file"
      />
    </div>
  );
}

export default async function LaporanPendudukPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, user] = await Promise.all([searchParams, verifySession()]);

  const tahunParam = Number(teks(params, "tahun"));
  const data = await getLaporanPendudukData(
    Number.isInteger(tahunParam) && tahunParam > 0 ? tahunParam : undefined,
  );

  const bolehUbah = hasPermission(user.permissions, LAPORAN_PENDUDUK_RESOURCE, "update");
  const bolehHapus = hasPermission(user.permissions, LAPORAN_PENDUDUK_RESOURCE, "delete");
  const tersimpan = teks(params, "tersimpan");
  const diperbarui = teks(params, "diperbarui");
  const dihapus = teks(params, "dihapus");

  return (
    <div className="modul-page data-kependudukan-page">
      <PageHeading
        judul={<>Laporan Penduduk</>}
        deskripsi={<>Arsip dokumen laporan penduduk per bulan.</>}
      />

      {tersimpan ? (
        <p className="form-help" role="status">
          Laporan penduduk berhasil disimpan.
        </p>
      ) : null}
      {diperbarui ? (
        <p className="form-help" role="status">
          Laporan penduduk berhasil diubah.
        </p>
      ) : null}
      {dihapus ? (
        <p className="form-help" role="status">
          {dihapus === "1" ? "Laporan penduduk dihapus." : `${dihapus} laporan dihapus.`}
        </p>
      ) : null}

      <TableCard
        actions={
          <>
            {bolehUbah ? (
              <FormDialog
                aksi={simpanLaporanPendudukFormAction}
                deskripsi="Unggah PDF maksimal 8 MB. Satu dokumen per bulan dan tahun."
                judul="Tambah laporan penduduk"
                label="+ Tambah"
                labelSimpan="Simpan laporan"
              >
                {formLaporan(null, data.tahun)}
              </FormDialog>
            ) : null}
            {bolehHapus ? (
              <HapusTerpilih
                aksi={hapusMassalLaporanPendudukAction}
                judul="Hapus laporan terpilih?"
                keterangan="Laporan yang dicentang beserta berkasnya akan dihapus permanen dan tidak dapat dibatalkan."
                label="Hapus"
                namaField="id_cb"
              />
            ) : null}
          </>
        }
        description="Satu dokumen per bulan dan tahun, diunggah sebagai arsip PDF resmi desa."
        filter={
          <form className="data-custom-filter" method="get">
            <FormField
              defaultValue={String(data.tahun)}
              kind="select"
              label="Tahun"
              name="tahun"
              options={[
                { value: "", label: "Pilih Tahun" },
                ...(data.tahunTersedia.length > 0 ? data.tahunTersedia : [data.tahun]).map(
                  (item) => ({ value: String(item), label: String(item) }),
                ),
              ]}
            />
            <Button variant="secondary" type="submit">
              Tampilkan
            </Button>
          </form>
        }
        title="Daftar Laporan Penduduk"
      >
        {data.rows.length === 0 ? (
          <div className="modul-empty">
            <strong>Belum ada laporan penduduk untuk tahun {data.tahun}.</strong>
            <p>Unggah dokumen PDF pada formulir di bawah untuk menambah arsip.</p>
          </div>
        ) : (
          <TableScroll>
            <Table>
              <THead>
                <Row>
                  {bolehHapus ? (
                    <HeaderCell scope="col">
                      <PilihSemuaLaporan />
                    </HeaderCell>
                  ) : null}
                  <HeaderCell scope="col">No</HeaderCell>
                  <HeaderCell scope="col">Aksi</HeaderCell>
                  <HeaderCell scope="col">Judul</HeaderCell>
                  <HeaderCell scope="col">Bulan</HeaderCell>
                  <HeaderCell scope="col">Tahun</HeaderCell>
                  <HeaderCell scope="col">Tanggal Upload</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {data.rows.map((row, index) => (
                  <Row key={row.id}>
                    {bolehHapus ? (
                      <Cell>
                        <input
                          aria-label={`Pilih ${row.judul}`}
                          name="id_cb"
                          type="checkbox"
                          value={row.id}
                        />
                      </Cell>
                    ) : null}
                    <Cell>{index + 1}</Cell>
                    <Cell>
                      <div className="pemerintahan-row-actions">
                        {bolehUbah ? (
                          <FormDialog
                            aksi={simpanLaporanPendudukFormAction}
                            deskripsi={`Ubah arsip laporan "${row.judul}".`}
                            judul="Ubah laporan penduduk"
                            label="Ubah"
                            labelSimpan="Simpan perubahan"
                            varian="secondary"
                          >
                            {formLaporan(row, data.tahun)}
                          </FormDialog>
                        ) : null}
                        <ButtonLink
                          variant="secondary"
                          href={`/kependudukan/laporan-penduduk/${row.id}/berkas?unduh=1`}
                        >
                          Unduh
                        </ButtonLink>
                        {bolehHapus ? (
                          <DialogHapusForm
                            aksi={hapusLaporanPendudukAction}
                            id={row.id}
                            judul={`Hapus laporan "${row.judul}"?`}
                            keterangan="Laporan beserta berkasnya akan dihapus permanen."
                            labelAksi="Hapus laporan"
                          />
                        ) : null}
                      </div>
                    </Cell>
                    <Cell>
                      <a
                        href={`/kependudukan/laporan-penduduk/${row.id}/berkas`}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {row.judul}
                      </a>
                    </Cell>
                    <Cell>{row.bulanLabel}</Cell>
                    <Cell>{row.tahun}</Cell>
                    <Cell>{tanggal(row.diunggahPada)}</Cell>
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
