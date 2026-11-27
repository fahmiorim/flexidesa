import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { listLaporanKeuanganDokumen } from "@/features/keuangan-desa/keuangan/application/laporan-dokumen-use-cases";
import {
  laporanTipeLabel,
  semesterLabel,
  tanggalUntukInput,
} from "@/features/keuangan-desa/keuangan/domain/laporan-dokumen";

import { hapusDokumenLaporanAction } from "../actions";
import styles from "../keuangan.module.css";
import { simpanDokumenLaporanFormAction, tandaiDokumenLaporanFormAction } from "./form-actions";

export const metadata = { title: "Dokumen & Peraturan Keuangan" };

type Props = { searchParams: Promise<{ tahun?: string }> };

export default async function DokumenKeuanganPage({ searchParams }: Props) {
  const params = await searchParams;
  const tahunParam = Number(params.tahun);
  const tahun =
    Number.isInteger(tahunParam) && tahunParam >= 2000 && tahunParam <= 2100
      ? tahunParam
      : undefined;
  const data = await listLaporanKeuanganDokumen(tahun);
  const rows = data.rows.filter((row) => row.tahun === data.tahun);

  const formDokumen = (
    <div className="modul-form-grid">
      <FormField
        defaultValue="laporan_apbdes"
        kind="select"
        label="Jenis laporan"
        name="tipe"
        options={[{ value: "laporan_apbdes", label: "Laporan APBDes" }]}
      />
      <FormField label="Judul dokumen" maxLength={255} minLength={3} name="judul" required />
      <FormField
        defaultValue={String(data.tahun)}
        label="Tahun anggaran"
        max={2100}
        min={2000}
        name="tahun"
        required
        type="number"
      />
      <FormField
        defaultValue="1"
        kind="select"
        label="Semester"
        name="semester"
        options={[
          { value: "1", label: "Semester I (Januari–Juni)" },
          { value: "2", label: "Semester II (Juli–Desember)" },
        ]}
      />
      <FormField
        accept="application/pdf,.pdf"
        containerClassName="form-field-full"
        helpText="Berkas PDF maksimal 8 MB."
        label="Berkas PDF"
        name="berkas"
        required
        type="file"
      />
    </div>
  );

  return (
    <main className={styles.page}>
      <PageHeading
        judul={<>Dokumen &amp; Peraturan</>}
        deskripsi={<>Arsip dokumen laporan periodik APBDes dan penduduk per semester.</>}
      />
      <section className={styles.metrics}>
        <article className={styles.metricPrimary}>
          <span>Arsip {data.tahun}</span>
          <strong>{data.periode.jumlahDokumen} dokumen</strong>
          <small>Dokumen laporan tercatat</small>
        </article>
        <article className={styles.metric}>
          <span>Semester I</span>
          <strong>
            {data.periode.tercatat.includes(data.tahun + "-S1") ? "Tersedia" : "Belum ada"}
          </strong>
          <small>Januari – Juni</small>
        </article>
        <article className={styles.metric}>
          <span>Semester II</span>
          <strong>
            {data.periode.tercatat.includes(data.tahun + "-S2") ? "Tersedia" : "Belum ada"}
          </strong>
          <small>Juli – Desember</small>
        </article>
        <article className={styles.metric}>
          <span>Total Arsip</span>
          <strong>{data.rows.length}</strong>
          <small>Semua tahun anggaran</small>
        </article>
      </section>
      {data.periode.belumLengkap ? (
        <p className={styles.notice}>
          {data.periode.belumLengkap} Kelengkapan arsip ditampilkan sebagai pengingat, bukan
          penghalang unggah.
        </p>
      ) : null}
      <TableCard
        actions={
          <FormDialog
            aksi={simpanDokumenLaporanFormAction}
            deskripsi="Satu dokumen per jenis laporan dan semester. Arsip tersimpan privat."
            judul="Tambah dokumen laporan"
            label="Tambah dokumen"
            labelSimpan="Simpan dokumen"
          >
            {formDokumen}
          </FormDialog>
        }
        description={`${rows.length} dokumen pada tahun anggaran ${data.tahun}.`}
        filter={
          <form className={styles.filterForm} method="get">
            <FormField
              defaultValue={String(data.tahun)}
              kind="select"
              label="Tahun anggaran"
              name="tahun"
              options={data.tahunTersedia.map((y) => ({ value: String(y), label: String(y) }))}
            />
            <Button type="submit" variant="secondary">
              Tampilkan
            </Button>
          </form>
        }
        title="Arsip Dokumen Laporan"
      >
        {rows.length ? (
          <TableScroll className={styles.tableWrap}>
            <Table className={styles.dataTable}>
              <THead>
                <Row>
                  <HeaderCell>Jenis</HeaderCell>
                  <HeaderCell>Judul</HeaderCell>
                  <HeaderCell>Periode</HeaderCell>
                  <HeaderCell>Berkas</HeaderCell>
                  <HeaderCell>Tanggal Penyerahan</HeaderCell>
                  <HeaderCell>Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {rows.map((row) => (
                  <Row key={row.id}>
                    <Cell>{laporanTipeLabel(row.tipe)}</Cell>
                    <Cell>
                      <strong>{row.judul}</strong>
                    </Cell>
                    <Cell>
                      {row.tahun} · {semesterLabel(row.semester)}
                    </Cell>
                    <Cell>
                      <a href={"/keuangan/laporan-dokumen/" + row.id + "/berkas"}>
                        {row.namaFile} ↓
                      </a>
                    </Cell>
                    <Cell>
                      {row.diserahkanPada
                        ? new Intl.DateTimeFormat("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }).format(new Date(row.diserahkanPada))
                        : "Belum diserahkan"}
                    </Cell>
                    <Cell>
                      <div className="table-actions">
                        <FormDialog
                          aksi={tandaiDokumenLaporanFormAction}
                          deskripsi={`Ubah tanggal penyerahan dokumen "${row.judul}".`}
                          judul="Ubah tanggal penyerahan"
                          label="Ubah tanggal"
                          labelSimpan="Simpan tanggal"
                          varian="secondary"
                        >
                          <div className="modul-form-grid">
                            <input name="id" type="hidden" value={row.id} />
                            <FormField
                              defaultValue={tanggalUntukInput(row.diserahkanPada)}
                              label="Tanggal penyerahan"
                              name="diserahkanPada"
                              type="date"
                            />
                          </div>
                        </FormDialog>
                        <DialogHapusForm
                          aksi={hapusDokumenLaporanAction}
                          id={row.id}
                          judul={`Hapus dokumen "${row.judul}"?`}
                          keterangan={`Dokumen ${row.namaFile} akan dihapus permanen dari arsip laporan keuangan.`}
                          labelAksi="Hapus dokumen"
                          varian="danger"
                        />
                      </div>
                    </Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        ) : (
          <p className={styles.empty}>Belum ada dokumen laporan yang diarsipkan.</p>
        )}
      </TableCard>
      <p className={styles.notice}>
        Butuh melihat rekap laporan?{" "}
        <ButtonLink variant="ghost" href="/keuangan/laporan">
          Buka rekap laporan keuangan
        </ButtonLink>
      </p>
    </main>
  );
}
