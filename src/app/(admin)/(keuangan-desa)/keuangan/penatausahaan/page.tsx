import type { Metadata } from "next";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { getPenatausahaan } from "@/features/keuangan-desa/keuangan/application/penatausahaan-use-cases";
import { formatRupiah } from "@/features/keuangan-desa/keuangan/domain/keuangan";
import { todayIsoDate } from "@/lib/forms";

import { hapusJurnal } from "./actions";
import { simpanJurnalFormAction, simpanSaldoBankFormAction } from "./form-actions";

export const metadata: Metadata = { title: "Penatausahaan Keuangan" };

type Params = { tahun?: string };

function isiJurnal(tahun: number) {
  return (
    <div className="modul-form-grid">
      <input name="tahun" type="hidden" value={tahun} />
      <FormField
        defaultValue={todayIsoDate()}
        label="Tanggal"
        name="tanggal"
        required
        type="date"
      />
      <FormField
        label="Kode rekening"
        maxLength={50}
        name="kodeRekening"
        placeholder="Contoh: 4.1.1.01"
        required
      />
      <FormField
        containerClassName="form-field-full"
        kind="textarea"
        label="Uraian"
        maxLength={2000}
        name="uraian"
        required
        rows={2}
      />
      <FormField
        defaultValue="0"
        label="Debet (Rp)"
        min={0}
        name="debet"
        step="0.01"
        type="number"
      />
      <FormField
        defaultValue="0"
        helpText="Isi salah satu: debet atau kredit (lebih dari nol)."
        label="Kredit (Rp)"
        min={0}
        name="kredit"
        step="0.01"
        type="number"
      />
      <FormField
        containerClassName="form-field-full"
        label="Referensi"
        maxLength={255}
        name="referensi"
        placeholder="Nomor bukti/spj (opsional)"
      />
    </div>
  );
}

function isiSaldoBank(tahun: number) {
  return (
    <div className="modul-form-grid">
      <input name="tahun" type="hidden" value={tahun} />
      <FormField label="Nomor rekening" maxLength={50} name="rekeningBank" required />
      <FormField label="Nama bank" maxLength={100} name="namaBank" required />
      <FormField
        defaultValue="0"
        label="Saldo awal (Rp)"
        min={0}
        name="saldoAwal"
        step="0.01"
        type="number"
      />
    </div>
  );
}

export default async function PenatausahaanPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const tahunParam = Number(params.tahun);
  const data = await getPenatausahaan(
    Number.isInteger(tahunParam) && tahunParam >= 2000 && tahunParam <= 2100
      ? tahunParam
      : undefined,
  );

  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Penatausahaan Keuangan</>}
        deskripsi={<>Buku jurnal kas dan saldo awal rekening bank desa.</>}
        aksi={
          <ButtonLink variant="secondary" href={`/keuangan/buku-kas-umum?tahun=${data.tahun}`}>
            Lihat Buku Kas Umum
          </ButtonLink>
        }
      />
      <section className="dashboard-stats" aria-label="Ringkasan jurnal">
        <article className="modul-card">
          <span>Total debet</span>
          <strong>{formatRupiah(data.ringkasan.totalDebet)}</strong>
        </article>
        <article className="modul-card">
          <span>Total kredit</span>
          <strong>{formatRupiah(data.ringkasan.totalKredit)}</strong>
        </article>
        <article className="modul-card">
          <span>Saldo jurnal</span>
          <strong>{formatRupiah(data.ringkasan.saldo)}</strong>
        </article>
        <article className="modul-card">
          <span>Saldo awal bank</span>
          <strong>{formatRupiah(data.saldoAwalBank)}</strong>
        </article>
      </section>
      <TableCard
        actions={
          data.akses.bolehTambah ? (
            <FormDialog
              aksi={simpanJurnalFormAction}
              deskripsi="Catat satu mutasi kas. Debet menambah saldo, kredit menguranginya."
              judul="Tambah mutasi jurnal"
              label="Tambah Mutasi"
              labelSimpan="Simpan mutasi"
            >
              {isiJurnal(data.tahun)}
            </FormDialog>
          ) : null
        }
        description={`${data.ringkasan.jumlah.toLocaleString("id-ID")} mutasi pada tahun ${data.tahun}.`}
        filter={
          <form className="modul-filter-row" method="get">
            <FormField
              defaultValue={String(data.tahun)}
              kind="select"
              label="Tahun anggaran"
              name="tahun"
              options={
                data.tersedia.length
                  ? data.tersedia.map((tahun) => ({ value: String(tahun), label: String(tahun) }))
                  : [{ value: String(data.tahun), label: String(data.tahun) }]
              }
            />
            <Button type="submit">Terapkan</Button>
          </form>
        }
        title="Buku Jurnal"
      >
        {data.jurnal.length ? (
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  <HeaderCell>Tanggal</HeaderCell>
                  <HeaderCell>Kode Rekening</HeaderCell>
                  <HeaderCell>Uraian</HeaderCell>
                  <HeaderCell>Debet</HeaderCell>
                  <HeaderCell>Kredit</HeaderCell>
                  <HeaderCell>Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {data.jurnal.map((row) => (
                  <Row key={row.id}>
                    <Cell>{row.tanggal}</Cell>
                    <Cell>{row.kodeRekening}</Cell>
                    <Cell>
                      <strong>{row.uraian}</strong>
                      {row.referensi ? (
                        <>
                          <br />
                          <small>{row.referensi}</small>
                        </>
                      ) : null}
                    </Cell>
                    <Cell>{formatRupiah(row.debet)}</Cell>
                    <Cell>{formatRupiah(row.kredit)}</Cell>
                    <Cell>
                      {data.akses.bolehHapus ? (
                        <DialogHapusForm
                          aksi={hapusJurnal}
                          id={row.id}
                          judul="Hapus mutasi jurnal ini?"
                          keterangan={`Mutasi ${row.uraian} (${row.tanggal}) akan dihapus permanen.`}
                          labelAksi="Hapus mutasi"
                        />
                      ) : (
                        "—"
                      )}
                    </Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        ) : (
          <p className="modul-empty">
            Belum ada mutasi jurnal pada tahun {data.tahun}. Tambahkan mutasi pertama lewat tombol
            Tambah Mutasi.
          </p>
        )}
      </TableCard>
      <TableCard
        actions={
          data.akses.bolehUbahSaldo ? (
            <FormDialog
              aksi={simpanSaldoBankFormAction}
              deskripsi="Saldo awal dipakai sebagai titik mulai buku kas umum tahun anggaran ini."
              judul="Atur saldo awal bank"
              label="Atur Saldo Awal"
              labelSimpan="Simpan saldo"
            >
              {isiSaldoBank(data.tahun)}
            </FormDialog>
          ) : null
        }
        description="Satu baris per rekening bank; menyimpan rekening yang sama akan memperbaruinya."
        title="Saldo Awal Bank"
      >
        {data.saldoBank.length ? (
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  <HeaderCell>Bank</HeaderCell>
                  <HeaderCell>Nomor Rekening</HeaderCell>
                  <HeaderCell>Saldo Awal</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {data.saldoBank.map((row) => (
                  <Row key={row.id}>
                    <Cell>
                      <strong>{row.namaBank}</strong>
                    </Cell>
                    <Cell>{row.rekeningBank}</Cell>
                    <Cell>{formatRupiah(row.saldoAwal)}</Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        ) : (
          <p className="modul-empty">
            Belum ada saldo awal bank pada tahun {data.tahun}. Buku kas umum dimulai dari nol.
          </p>
        )}
      </TableCard>
    </div>
  );
}
