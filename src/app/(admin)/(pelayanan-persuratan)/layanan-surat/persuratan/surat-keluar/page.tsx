import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { getBukuAgendaData } from "@/features/pelayanan-persuratan/surat/application/buku-agenda-use-cases";

import { hapusSuratKeluarAction } from "../buku-agenda-actions";

export const metadata = { title: "Surat Keluar" };
export default async function SuratKeluarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; berhasil?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").slice(0, 100);
  const { rows, canCreate, canUpdate, canDelete } = await getBukuAgendaData("keluar", q);
  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Surat Keluar</>}
        deskripsi={<>Buku agenda surat yang diterbitkan dan dikirim oleh pemerintah desa.</>}
      />
      {params.berhasil ? (
        <div className="alert alert-info">Perubahan data surat keluar berhasil.</div>
      ) : null}
      <TableCard
        title="Daftar Surat Keluar"
        description={`${rows.length.toLocaleString("id-ID")} surat tercatat`}
        actions={
          canCreate ? (
            <ButtonLink size="sm" href="/layanan-surat/persuratan/surat-keluar/baru">
              ＋ Tambah Surat Keluar
            </ButtonLink>
          ) : null
        }
        filter={
          <form method="get" className="modul-filter-row">
            <FormField
              label="Cari surat"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Cari nomor surat, penerima, ringkasan…"
            />
            <Button variant="secondary" type="submit">
              Cari
            </Button>
          </form>
        }
        footer={rows.length === 0 ? <p className="modul-muted">Belum ada surat keluar.</p> : null}
      >
        <TableScroll className="modul-scroll">
          <Table className="modul-table">
            <THead>
              <Row>
                <HeaderCell>No. Agenda</HeaderCell>
                <HeaderCell>Nomor Surat</HeaderCell>
                <HeaderCell>Tanggal</HeaderCell>
                <HeaderCell>Penerima</HeaderCell>
                <HeaderCell>Klasifikasi</HeaderCell>
                <HeaderCell>Ringkasan</HeaderCell>
                <HeaderCell>Aksi</HeaderCell>
              </Row>
            </THead>
            <TBody>
              {rows.map((row) => (
                <Row key={row.id}>
                  <Cell>{row.agendaNumber}</Cell>
                  <Cell className="modul-mono">{row.letterNumber}</Cell>
                  <Cell>{row.letterDate}</Cell>
                  <Cell>{row.recipient ?? "—"}</Cell>
                  <Cell>{row.classificationName ?? "—"}</Cell>
                  <Cell>{row.summary ?? "—"}</Cell>
                  <Cell>
                    <div style={{ display: "flex", gap: 8 }}>
                      {canUpdate ? (
                        <ButtonLink
                          variant="secondary"
                          href={`/layanan-surat/persuratan/surat-keluar/${row.id}/edit`}
                        >
                          Ubah
                        </ButtonLink>
                      ) : null}
                      {canDelete ? (
                        <DialogHapusForm
                          aksi={hapusSuratKeluarAction}
                          id={row.id}
                          judul={`Hapus surat keluar ${row.letterNumber}?`}
                          keterangan="Catatan agenda surat keluar akan dihapus permanen."
                          labelAksi="Hapus surat"
                        />
                      ) : null}
                    </div>
                  </Cell>
                </Row>
              ))}
            </TBody>
          </Table>
        </TableScroll>
      </TableCard>
    </div>
  );
}
