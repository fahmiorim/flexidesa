import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/shell/page-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { TableCard } from "@/components/ui/table-card";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";

import { anggotaGrupKontakUseCase, village } from "@/features/layanan-warga/kontak/application/use-cases";
import { KONTAK_GRUP_RESOURCE } from "@/features/layanan-warga/kontak/domain/kontak";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";

import { hapusAnggotaGrupAction } from "./actions";

export const metadata: Metadata = { title: "Anggota Grup Kontak" };

export default async function AnggotaGrupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (Number.isNaN(id) || id <= 0) notFound();

  const { user, villageId } = await village(KONTAK_GRUP_RESOURCE, "read");
  const { grup, anggota } = await anggotaGrupKontakUseCase(villageId, id);

  if (!grup) notFound();

  const bisaTambah = hasPermission(user.permissions, KONTAK_GRUP_RESOURCE, "create");
  const bisaHapus = hasPermission(user.permissions, KONTAK_GRUP_RESOURCE, "delete");

  return (
    <main className="space-y-6">
      <PageHeading
        judul="Anggota Grup Kontak"
        deskripsi={`Kelola anggota grup "${grup.namaGrup}".`}
        aksi={
          bisaTambah && (
            <ButtonLink href={`/hubung-warga/grup-kontak/${id}/anggota/baru`} variant="primary">
              Tambah Anggota
            </ButtonLink>
          )
        }
      />

      <TableCard title={`Anggota Grup: ${grup.namaGrup}`} description="Daftar anggota grup kontak.">
        <Table>
          <TableScroll>
            <THead>
              <Row>
                <HeaderCell className="w-12">No</HeaderCell>
                <HeaderCell>Nama</HeaderCell>
                <HeaderCell>Telepon</HeaderCell>
                <HeaderCell>Email</HeaderCell>
                <HeaderCell>Telegram</HeaderCell>
                <HeaderCell>Peran</HeaderCell>
                <HeaderCell className="w-36">Aksi</HeaderCell>
              </Row>
            </THead>
            <TBody>
              {anggota.length === 0 ? (
                <Row>
                  <Cell colSpan={7} className="text-center py-8 text-muted">
                    Belum ada anggota di grup ini.
                  </Cell>
                </Row>
              ) : (
                anggota.map((item, idx) => (
                  <Row key={item.id}>
                    <Cell className="text-center">{idx + 1}</Cell>
                    <Cell>{item.nama}</Cell>
                    <Cell>{item.telepon ?? "—"}</Cell>
                    <Cell>{item.email ?? "—"}</Cell>
                    <Cell>{item.telegram ?? "—"}</Cell>
                    <Cell>{item.peran ?? "—"}</Cell>
                    <Cell className="flex items-center gap-2">
                      {bisaHapus && (
                        <DialogHapusForm
                          aksi={hapusAnggotaGrupAction}
                          id={item.id}
                          judul="Hapus Anggota"
                          keterangan={`Yakin hapus anggota "${item.nama}" dari grup ini?`}
                          label="Hapus"
                          varian="danger-ghost"
                          hidden={{ grupId: id }}
                        />
                      )}
                    </Cell>
                  </Row>
                ))
              )}
            </TBody>
          </TableScroll>
        </Table>
      </TableCard>
    </main>
  );
}