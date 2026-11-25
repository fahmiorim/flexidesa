import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { ambilRegistrasiWargaAdmin } from "@/features/registrasi-warga/application/registrasi-warga-use-cases";

import { RegistrasiWargaConsole } from "./registrasi-console";

export const metadata = { title: "Pendaftaran Akun Warga" };

export default async function PendaftaranWargaAdminPage() {
  const rows = await ambilRegistrasiWargaAdmin();
  const menunggu = rows.filter((row) => row.status === "menunggu").length;

  return (
    <main className="modul-page">
      <PageHeading>
        <div className="page-heading">
          <div>
            <h1>Pendaftaran Akun Warga</h1>
            <p>Setujui permohonan akun layanan mandiri warga.</p>
          </div>
        </div>
      </PageHeading>
      <nav className="pengguna-tabs" aria-label="Bagian manajemen pengguna">
        <Link className="pengguna-tab" href="/pengaturan/pengguna">
          Pengguna
        </Link>
        <Link className="pengguna-tab" href="/pengaturan/grup-akses">
          Peran &amp; Hak Akses
        </Link>
        <Link className="pengguna-tab" href="/pengaturan/pengguna/pendaftaran" aria-current="page">
          Pendaftaran Warga ({menunggu})
        </Link>
        <Link className="pengguna-tab" href="/pengaturan/pengguna/aktivitas">
          Aktivitas Pengguna
        </Link>
        <Link className="pengguna-tab" href="/pengaturan/pengguna/keamanan">
          Pengaturan Keamanan
        </Link>
      </nav>
      <RegistrasiWargaConsole rows={rows} />
    </main>
  );
}
