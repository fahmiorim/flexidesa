import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { KonteksImpersonasiTampil } from "@/features/multi-desa/application/impersonasi-use-cases";

/**
 * Banner permanen selama impersonasi Super Admin.
 *
 * Dirender layout admin bila `getKonteksImpersonasi()` mengembalikan konteks;
 * logout biasa tidak menghilangkan banner — hanya tombol keluar yang
 * mengakhiri impersonasi lewat Server Action.
 */
export function ImpersonationBanner({
  konteks,
  aksiKeluar,
}: {
  konteks: KonteksImpersonasiTampil;
  aksiKeluar: () => Promise<never>;
}) {
  const batas = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(konteks.kadaluarsa));

  return (
    <div className="impersonation-banner">
      <Alert variant="error">
        <strong>Mode impersonasi aktif.</strong> Anda bertindak sebagai{" "}
        {konteks.targetUsername ?? konteks.targetName} ({konteks.targetName}) pada{" "}
        {konteks.villageName}. Semua perubahan dicatat sebagai super admin. Batas keras sampai pukul{" "}
        {batas}.
      </Alert>
      <form action={aksiKeluar}>
        <Button type="submit" variant="secondary">
          Keluar dari impersonasi
        </Button>
      </form>
    </div>
  );
}
