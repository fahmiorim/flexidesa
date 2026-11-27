import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { getBukuAgendaData } from "@/features/pelayanan-persuratan/surat/application/buku-agenda-use-cases";

import { hapusSuratMasukAction } from "../buku-agenda-actions";

export const metadata = { title: "Surat Masuk" };
export default async function SuratMasukPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; berhasil?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").slice(0, 100);
  const { rows, canCreate, canUpdate, canDelete } = await getBukuAgendaData("masuk", q);
  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Surat Masuk</>}
        deskripsi={<>Buku agenda surat yang diterima oleh pemerintah desa.</>}
      />
      {params.berhasil ? (
        <div className="alert alert-info">Perubahan data surat masuk berhasil.</div>
      ) : null}
      <TableCard
        title="Daftar Surat Masuk"
        description={`${rows.length.toLocaleString("id-ID")} surat tercatat`}
        actions={
          canCreate ? (
            <ButtonLink size="sm" href="/layanan-surat/persuratan/surat-masuk/baru">
              ＋ Tambah Surat Masuk
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
              placeholder="Cari nomor surat, pengirim, ringkasan…"
            />
            <Button variant="secondary" type="submit">
              Cari
            </Button>
          </form>
        }
        footer={rows.length === 0 ? <p className="modul-muted">Belum ada surat masuk.</p> : null}
      >
        <TableScroll className="modul-scroll">
          <Table className="modul-table">
            <THead>
              <Row>
                <HeaderCell>No. Agenda</HeaderCell>
                <HeaderCell>Nomor Surat</HeaderCell>
                <HeaderCell>Diterima</HeaderCell>
                <HeaderCell>Pengirim</HeaderCell>
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
                  <Cell>{row.receivedDate}</Cell>
                  <Cell>{row.sender ?? "—"}</Cell>
                  <Cell>{row.classificationName ?? "—"}</Cell>
                  <Cell>{row.summary ?? "—"}</Cell>
                  <Cell>
                    <div style={{ display: "flex", gap: 8 }}>
                      {canUpdate ? (
                        <ButtonLink
                          variant="secondary"
                          href={`/layanan-surat/persuratan/surat-masuk/${row.id}/edit`}
                        >
                          Ubah
                        </ButtonLink>
                      ) : null}
                      {canDelete ? (
                        <DialogHapusForm
                          aksi={hapusSuratMasukAction}
                          id={row.id}
                          judul={`Hapus surat masuk ${row.letterNumber}?`}
                          keterangan="Catatan agenda surat masuk akan dihapus permanen."
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
