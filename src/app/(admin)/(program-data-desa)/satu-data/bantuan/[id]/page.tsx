import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/shell/page-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { getBantuanDetail } from "@/features/program-data-desa/bantuan/application/use-cases";
import {
  ASAL_DANA_LABELS,
  sasaranLabel,
  type BantuanDetail,
  type PesertaBantuanRow,
  type SasaranOption,
} from "@/features/program-data-desa/bantuan/domain/bantuan";

import { hapusPesertaProgram, hapusSemuaPesertaProgram } from "../actions";
import { tambahPesertaFormAction, ubahPesertaFormAction } from "../form-actions";

export const metadata: Metadata = { title: "Peserta Bantuan" };

function opsiKandidat(detail: BantuanDetail): { value: string; label: string }[] {
  const daftar: SasaranOption[] =
    detail.program.sasaran === 1
      ? detail.reference.penduduk
      : detail.program.sasaran === 2
        ? detail.reference.keluarga
        : detail.program.sasaran === 3
          ? detail.reference.rumahTangga
          : detail.reference.kelompok;
  return daftar.map((item) => ({ value: String(item.id), label: item.label }));
}

function formPeserta(
  row: PesertaBantuanRow | null,
  kandidat: { value: string; label: string }[],
  programId: number,
) {
  return (
    <div className="modul-form-grid">
      <input name="programId" type="hidden" value={programId} />
      {row ? <input name="pesertaId" type="hidden" value={row.id} /> : null}
      {row ? null : (
        <FormField
          containerClassName="form-field-full"
          defaultValue=""
          kind="select"
          label="Pilih sasaran"
          name="sasaranId"
          options={[{ value: "", label: "Pilih sasaran" }, ...kandidat]}
          required
        />
      )}
      <FormField
        defaultValue={row?.cardNumber ?? ""}
        label="Nomor kartu"
        maxLength={60}
        name="nomorKartu"
      />
      <FormField
        defaultValue={row?.cardNationalId ?? ""}
        inputMode="numeric"
        label="NIK kartu"
        maxLength={16}
        name="kartuNik"
      />
      <FormField
        defaultValue={row?.cardName ?? ""}
        label="Nama pada kartu"
        maxLength={100}
        name="kartuNama"
      />
      <FormField
        defaultValue={row?.cardBirthPlace ?? ""}
        label="Tempat lahir"
        maxLength={100}
        name="kartuTempatLahir"
      />
      <FormField
        defaultValue={row?.cardBirthDate ?? ""}
        label="Tanggal lahir"
        name="kartuTanggalLahir"
        type="date"
      />
      <FormField
        containerClassName="form-field-full"
        defaultValue={row?.cardAddress ?? ""}
        kind="textarea"
        label="Alamat kartu"
        maxLength={255}
        name="kartuAlamat"
        rows={2}
      />
    </div>
  );
}

export default async function BantuanPesertaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const programId = Number(id);
  if (!Number.isSafeInteger(programId) || programId < 1) notFound();

  const detail = await getBantuanDetail(programId);

  const kandidat = opsiKandidat(detail);
  const asalDana =
    detail.program.asalDana != null
      ? (ASAL_DANA_LABELS[detail.program.asalDana as keyof typeof ASAL_DANA_LABELS] ?? "—")
      : "—";

  return (
    <div className="modul-page">
      <PageHeading
        judul={<>{detail.program.name}</>}
        deskripsi={
          <>
            Sasaran {sasaranLabel(detail.program.sasaran)} · Asal dana {asalDana} ·{" "}
            {detail.program.startDate ?? "tanpa tanggal awal"} s.d.{" "}
            {detail.program.endDate ?? "tanpa tanggal akhir"}.
          </>
        }
        aksi={
          <ButtonLink variant="secondary" href="/satu-data/bantuan">
            Kembali ke daftar
          </ButtonLink>
        }
      />
      {detail.sebaranWilayah.length ? (
        <div className="dashboard-stats">
          {detail.sebaranWilayah.slice(0, 4).map((item) => (
            <article className="modul-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.total.toLocaleString("id-ID")} peserta</strong>
            </article>
          ))}
        </div>
      ) : null}
      <TableCard
        actions={
          <>
            {detail.canManage ? (
              <FormDialog
                aksi={tambahPesertaFormAction}
                deskripsi={`Tambah penerima ke program ${detail.program.name}.`}
                judul="Tambah peserta"
                label="Tambah Peserta"
                labelSimpan="Simpan peserta"
              >
                {formPeserta(null, kandidat, programId)}
              </FormDialog>
            ) : null}
            {detail.canManage && detail.peserta.length > 0 ? (
              <DialogHapusForm
                aksi={hapusSemuaPesertaProgram}
                hidden={{ programId }}
                judul="Hapus seluruh peserta program ini?"
                keterangan={`Seluruh ${detail.peserta.length} peserta akan dihapus permanen dan tidak dapat dibatalkan.`}
                labelAksi="Hapus semua peserta"
              />
            ) : null}
          </>
        }
        description={`${detail.peserta.length.toLocaleString("id-ID")} peserta terdaftar.`}
        title="Daftar Peserta"
      >
        {detail.peserta.length ? (
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  <HeaderCell>Sasaran</HeaderCell>
                  <HeaderCell>Identitas</HeaderCell>
                  <HeaderCell>Nomor Kartu</HeaderCell>
                  <HeaderCell>NIK Kartu</HeaderCell>
                  <HeaderCell>Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {detail.peserta.map((row) => (
                  <Row key={row.id}>
                    <Cell>
                      <strong>{row.targetName}</strong>
                    </Cell>
                    <Cell>{row.targetIdentity ?? "—"}</Cell>
                    <Cell>{row.cardNumber ?? "—"}</Cell>
                    <Cell>{row.cardNationalId ?? "—"}</Cell>
                    <Cell>
                      {detail.canManage ? (
                        <div className="table-actions">
                          <FormDialog
                            aksi={ubahPesertaFormAction}
                            deskripsi={`Perbarui data kartu peserta ${row.targetName}.`}
                            judul="Ubah peserta"
                            label="Ubah"
                            labelSimpan="Simpan perubahan"
                            varian="secondary"
                          >
                            {formPeserta(row, kandidat, programId)}
                          </FormDialog>
                          <DialogHapusForm
                            aksi={hapusPesertaProgram}
                            hidden={{ programId, pesertaId: row.id }}
                            judul={`Hapus peserta "${row.targetName}"?`}
                            keterangan="Peserta akan dihapus permanen dari program ini."
                            labelAksi="Hapus peserta"
                          />
                        </div>
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
            Belum ada peserta. Tambahkan peserta lewat tombol Tambah Peserta.
          </p>
        )}
      </TableCard>
    </div>
  );
}
