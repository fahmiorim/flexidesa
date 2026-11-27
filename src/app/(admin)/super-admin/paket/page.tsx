import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/button-link";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { daftarPaketPlatform } from "@/features/multi-desa/application/paket-langganan-use-cases";
import {
  PlatformCard,
  PlatformEmpty,
  PlatformPageHeader,
  PlatformStatus,
} from "@/features/multi-desa/presentation/platform-ui";

import { pastikanSuperAdmin } from "../guard";

export const metadata: Metadata = {
  title: "Paket Langganan",
  robots: { index: false, follow: false },
};

export default async function SuperAdminPaketPage() {
  await pastikanSuperAdmin();

  let paket;
  try {
    paket = await daftarPaketPlatform();
  } catch {
    return (
      <>
        <PlatformPageHeader path="/super-admin/paket" />
        <PlatformCard title="Paket tidak dapat dimuat">
          <p className="alert alert-error" role="alert">
            Daftar paket gagal dimuat. Muat ulang halaman untuk mencoba lagi.
          </p>
        </PlatformCard>
      </>
    );
  }

  return (
    <>
      <PlatformPageHeader path="/super-admin/paket" />

      <PlatformCard
        actions={
          <ButtonLink variant="primary" href="/super-admin/paket/baru">
            Buat paket
          </ButtonLink>
        }
        description="Kelola paket, fitur, dan versi langganan."
        flush
        title="Paket"
      >
        {paket.length === 0 ? (
          <PlatformEmpty
            description="Paket baru dimulai sebagai draf; pilih modul sebelum menerbitkannya."
            title="Belum ada paket"
          />
        ) : (
          <TableScroll className="tenant-table-scroll">
            <Table className="tenant-table tenant-table-list">
              <THead>
                <Row>
                  <HeaderCell scope="col">Paket</HeaderCell>
                  <HeaderCell scope="col">Status</HeaderCell>
                  <HeaderCell scope="col">Versi diterbitkan</HeaderCell>
                  <HeaderCell scope="col">Draf aktif</HeaderCell>
                  <HeaderCell scope="col">
                    <span className="sr-only">Kelola</span>
                  </HeaderCell>
                </Row>
              </THead>
              <TBody>
                {paket.map((item) => (
                  <Row key={item.id}>
                    <Cell className="tenant-cell-name">
                      <strong>{item.name}</strong>
                      <div className="tenant-status-note">
                        <code>{item.slug}</code>
                        {item.description ? <span>{item.description}</span> : null}
                      </div>
                    </Cell>
                    <Cell>
                      <PlatformStatus
                        aktif={item.status === "active"}
                        label={item.status === "active" ? "Aktif" : "Diarsipkan"}
                      />
                    </Cell>
                    <Cell>
                      {item.publishedVersion ? (
                        <span>v{item.publishedVersion.version}</span>
                      ) : (
                        <span className="tenant-secondary">Belum diterbitkan</span>
                      )}
                    </Cell>
                    <Cell>
                      {item.draftVersion ? (
                        <span className="template-version is-warning">
                          Draf v{item.draftVersion.version}
                        </span>
                      ) : (
                        <span className="tenant-secondary">Tidak ada</span>
                      )}
                    </Cell>
                    <Cell>
                      <ButtonLink variant="secondary" href={`/super-admin/paket/${item.id}`}>
                        Kelola
                      </ButtonLink>
                    </Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        )}
      </PlatformCard>
    </>
  );
}
