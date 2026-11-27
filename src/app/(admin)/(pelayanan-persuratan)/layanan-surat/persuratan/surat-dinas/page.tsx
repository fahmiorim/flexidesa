import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { getSuratDinasData } from "@/features/pelayanan-persuratan/surat/application/surat-dinas-use-cases";

import { hapusSuratDinasAction } from "./actions";

export const metadata = { title: "Surat Dinas" };

export default async function SuratDinasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; berhasil?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").slice(0, 100);
  const { rows, canCreate, canUpdate, canDelete } = await getSuratDinasData(q);
  return (
    <div className="modul-page">
      <PageHeading judul={<>Surat Dinas</>} deskripsi={<>Kelola surat dinas perangkat desa.</>} />
      {params.berhasil ? (
        <div className="alert alert-info">Perubahan data surat dinas berhasil.</div>
      ) : null}
      <TableCard
        title="Daftar Surat Dinas"
        description={`${rows.length.toLocaleString("id-ID")} surat tercatat`}
        actions={
          canCreate ? (
            <ButtonLink size="sm" href="/layanan-surat/persuratan/surat-dinas/baru">
              ＋ Buat Surat Dinas
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
              placeholder="Cari nomor, perihal, penerima…"
            />
            <Button variant="secondary" type="submit">
              Cari
            </Button>
          </form>
        }
        footer={rows.length === 0 ? <p className="modul-muted">Belum ada surat dinas.</p> : null}
      >
        <TableScroll className="modul-scroll">
          <Table className="modul-table">
            <THead>
              <Row>
                <HeaderCell>Tanggal</HeaderCell>
                <HeaderCell>Nomor Surat</HeaderCell>
                <HeaderCell>Perihal</HeaderCell>
                <HeaderCell>Penerima</HeaderCell>
                <HeaderCell>Klasifikasi</HeaderCell>
                <HeaderCell>Arsip</HeaderCell>
                <HeaderCell>Aksi</HeaderCell>
              </Row>
            </THead>
            <TBody>
              {rows.map((row) => (
                <Row key={row.id}>
                  <Cell>{row.letterDate}</Cell>
                  <Cell className="modul-mono">{row.letterNumber}</Cell>
                  <Cell>{row.subject}</Cell>
                  <Cell>{row.recipient ?? "—"}</Cell>
                  <Cell>{row.classificationName ?? "—"}</Cell>
                  <Cell>
                    {row.archiveFile ? (
                      <Link
                        className="table-action-link"
                        href={`/api/admin/persuratan/surat-dinas/${row.id}/lampiran`}
                        target="_blank"
                      >
                        Lihat PDF →
                      </Link>
                    ) : (
                      (row.archiveLocation ?? "—")
                    )}
                  </Cell>
                  <Cell>
                    <div style={{ display: "flex", gap: 8 }}>
                      {canUpdate ? (
                        <ButtonLink
                          variant="secondary"
                          href={`/layanan-surat/persuratan/surat-dinas/${row.id}/edit`}
                        >
                          Ubah
                        </ButtonLink>
                      ) : null}
                      {canDelete ? (
                        <DialogHapusForm
                          aksi={hapusSuratDinasAction}
                          id={row.id}
                          judul={`Hapus surat dinas ${row.letterNumber}?`}
                          keterangan={`Surat ${row.subject} beserta lampirannya akan dihapus permanen.`}
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
