import { type Metadata } from "next";

import { PageHeading } from "@/components/shell/page-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { TableCard } from "@/components/ui/table-card";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { dataGrupKontakUseCase, village } from "@/features/layanan-warga/kontak/application/use-cases";
import { KONTAK_GRUP_RESOURCE } from "@/features/layanan-warga/kontak/domain/kontak";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";

import { hapusGrupKontakAction } from "./actions";

export const metadata: Metadata = { title: "Grup Kontak" };

export default async function GrupKontakPage() {
  const { user, villageId } = await village(KONTAK_GRUP_RESOURCE, "read");
  const { grup } = await dataGrupKontakUseCase(villageId);

  const bisaTambah = hasPermission(user.permissions, KONTAK_GRUP_RESOURCE, "create");
  const bisaUbah = hasPermission(user.permissions, KONTAK_GRUP_RESOURCE, "update");
  const bisaHapus = hasPermission(user.permissions, KONTAK_GRUP_RESOURCE, "delete");

  return (
    <main className="space-y-6">
      <PageHeading
        judul="Grup Kontak"
        deskripsi="Kelola grup kontak untuk komunikasi warga."
        aksi={
          bisaTambah && (
            <ButtonLink href="/hubung-warga/grup-kontak/baru" variant="primary">
              Tambah Grup
            </ButtonLink>
          )
        }
      />

      <TableCard title="Daftar Grup Kontak" description="Kelola grup kontak untuk komunikasi warga.">
        <Table>
          <TableScroll>
            <THead>
              <Row>
                <HeaderCell className="w-12">No</HeaderCell>
                <HeaderCell>Nama Grup</HeaderCell>
                <HeaderCell>Keterangan</HeaderCell>
                <HeaderCell>Jumlah Kontak</HeaderCell>
                <HeaderCell className="w-48">Aksi</HeaderCell>
              </Row>
            </THead>
            <TBody>
              {grup.length === 0 ? (
                <Row>
                  <Cell colSpan={5} className="text-center py-8 text-muted">
                    Belum ada grup kontak.
                  </Cell>
                </Row>
              ) : (
                grup.map((item, idx) => (
                  <Row key={item.id}>
                    <Cell className="text-center">{idx + 1}</Cell>
                    <Cell>{item.namaGrup}</Cell>
                    <Cell className="max-w-xs truncate">{item.keterangan ?? "—"}</Cell>
                    <Cell>
                      <span className="text-muted">0</span>
                    </Cell>
                    <Cell className="flex items-center gap-2">
                      {bisaUbah && (
                        <ButtonLink
                          href={`/hubung-warga/grup-kontak/${item.id}/ubah`}
                          variant="ghost"
                          size="sm"
                        >
                          Ubah
                        </ButtonLink>
                      )}
                      {bisaUbah && (
                        <ButtonLink
                          href={`/hubung-warga/grup-kontak/${item.id}/anggota`}
                          variant="ghost"
                          size="sm"
                        >
                          Anggota
                        </ButtonLink>
                      )}
                      {bisaHapus && (
                        <DialogHapusForm
                          aksi={hapusGrupKontakAction}
                          id={item.id}
                          judul="Hapus Grup Kontak"
                          keterangan={`Yakin hapus grup "${item.namaGrup}"?`}
                          label="Hapus"
                          varian="danger-ghost"
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