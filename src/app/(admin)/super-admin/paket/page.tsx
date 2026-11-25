import type { Metadata } from "next";
import Link from "next/link";

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
          <Link className="button button-primary" href="/super-admin/paket/baru">
            Buat paket
          </Link>
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
          <div className="tenant-table-scroll">
            <table className="tenant-table tenant-table-list">
              <thead>
                <tr>
                  <th scope="col">Paket</th>
                  <th scope="col">Status</th>
                  <th scope="col">Versi diterbitkan</th>
                  <th scope="col">Draf aktif</th>
                  <th scope="col">
                    <span className="sr-only">Kelola</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paket.map((item) => (
                  <tr key={item.id}>
                    <td className="tenant-cell-name">
                      <strong>{item.name}</strong>
                      <div className="tenant-status-note">
                        <code>{item.slug}</code>
                        {item.description ? <span>{item.description}</span> : null}
                      </div>
                    </td>
                    <td>
                      <PlatformStatus
                        aktif={item.status === "active"}
                        label={item.status === "active" ? "Aktif" : "Diarsipkan"}
                      />
                    </td>
                    <td>
                      {item.publishedVersion ? (
                        <span>v{item.publishedVersion.version}</span>
                      ) : (
                        <span className="tenant-secondary">Belum diterbitkan</span>
                      )}
                    </td>
                    <td>
                      {item.draftVersion ? (
                        <span className="template-version is-warning">
                          Draf v{item.draftVersion.version}
                        </span>
                      ) : (
                        <span className="tenant-secondary">Tidak ada</span>
                      )}
                    </td>
                    <td>
                      <Link
                        className="button button-secondary"
                        href={`/super-admin/paket/${item.id}`}
                      >
                        Kelola
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PlatformCard>
    </>
  );
}
