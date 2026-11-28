import { PageHeading } from "@/components/shell/page-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { listKontakUseCase } from "@/features/layanan-warga/kontak/application/use-cases";
import { KONTAK_RESOURCE } from "@/features/layanan-warga/kontak/domain/kontak";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { requirePermission } from "@/lib/dal";

import { hapusKontakAction } from "./actions";

export const metadata = { title: "Daftar Kontak" };

export default async function DaftarKontakPage() {
  const user = await requirePermission(KONTAK_RESOURCE, "read");
  if (!user.villageId) return null;
  const kontak = await listKontakUseCase(user.villageId);
  const bisaTambah = hasPermission(user.permissions, KONTAK_RESOURCE, "create");
  const bisaUbah = hasPermission(user.permissions, KONTAK_RESOURCE, "update");
  const bisaHapus = hasPermission(user.permissions, KONTAK_RESOURCE, "delete");

  return (
    <main className="space-y-6">
      <PageHeading
        judul="Daftar Kontak"
        deskripsi="Kelola daftar kontak untuk komunikasi warga."
        aksi={
          bisaTambah && (
            <ButtonLink href="/hubung-warga/daftar-kontak/baru" variant="primary">
              Tambah Kontak
            </ButtonLink>
          )
        }
      />

      <TableCard
        title="Daftar Kontak"
        description="Kelola daftar kontak untuk komunikasi warga."
      >
        <Table>
          <TableScroll>
            <THead>
              <Row>
                <HeaderCell className="w-12">No</HeaderCell>
                <HeaderCell>Nama</HeaderCell>
                <HeaderCell>Telepon</HeaderCell>
                <HeaderCell>Email</HeaderCell>
                <HeaderCell>Telegram</HeaderCell>
                <HeaderCell>Cara Hubung</HeaderCell>
                <HeaderCell>Keterangan</HeaderCell>
                <HeaderCell className="w-36">Aksi</HeaderCell>
              </Row>
            </THead>
            <TBody>
              {kontak.length === 0 ? (
                <Row>
                  <Cell colSpan={8} className="text-center py-8 text-muted">
                    Belum ada data kontak.
                  </Cell>
                </Row>
              ) : (
                kontak.map((item, idx) => (
                  <Row key={item.id}>
                    <Cell className="text-center">{idx + 1}</Cell>
                    <Cell>{item.nama}</Cell>
                    <Cell>{item.telepon ?? "—"}</Cell>
                    <Cell>{item.email ?? "—"}</Cell>
                    <Cell>{item.telegram ?? "—"}</Cell>
                    <Cell>
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
                        {item.hubungWarga}
                      </span>
                    </Cell>
                    <Cell className="max-w-xs truncate">{item.keterangan ?? "—"}</Cell>
                    <Cell className="flex items-center gap-2">
                      {bisaUbah && (
                        <ButtonLink
                          href={`/hubung-warga/daftar-kontak/${item.id}/ubah`}
                          variant="ghost"
                          size="sm"
                        >
                          Ubah
                        </ButtonLink>
                      )}
                      {bisaHapus && (
                        <DialogHapusForm
                          aksi={hapusKontakAction}
                          id={item.id}
                          judul="Hapus Kontak"
                          keterangan={`Yakin hapus kontak "${item.nama}"?`}
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