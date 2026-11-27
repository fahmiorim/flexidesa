import { PageHeading } from "@/components/shell/page-heading";
import { ambilRegistrasiWargaAdmin } from "@/features/pengaturan/registrasi-warga/application/registrasi-warga-use-cases";

import { RegistrasiWargaConsole } from "./registrasi-console";

export const metadata = { title: "Pendaftaran Akun Warga" };

export default async function PendaftaranWargaAdminPage() {
  const rows = await ambilRegistrasiWargaAdmin();

  return (
    <main className="modul-page">
      <PageHeading
        judul={<>Pendaftaran Akun Warga</>}
        deskripsi={<>Setujui permohonan akun layanan mandiri warga.</>}
      />
      <RegistrasiWargaConsole rows={rows} />
    </main>
  );
}
