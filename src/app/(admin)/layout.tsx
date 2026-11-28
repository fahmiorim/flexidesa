import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/shell/admin-sidebar";
import { AdminTopbar } from "@/components/shell/admin-topbar";
import { ImpersonationBanner } from "@/components/shell/impersonation-banner";
import { getNamaDesaUseCase } from "@/features/info-desa/desa/application/use-cases";
import { getKonteksImpersonasi } from "@/features/multi-desa/application/impersonasi-use-cases";
import { isSuperAdminUser } from "@/features/multi-desa/application/provisioning-use-cases";
import { keluarImpersonasiAction } from "@/app/(admin)/super-admin/pengguna-desa/actions";
import { getMenuForUser } from "@/features/navigation/application/get-menu";
import {
  DEFAULT_RESOURCE,
  hasPermission,
} from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

export default async function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  const user = await verifySession("/masuk-admin");

  if (user.residentId !== null) {
    redirect("/layanan-mandiri");
  }

  const isPlatformAdmin = await isSuperAdminUser(user);
  if (user.villageId === null && !isPlatformAdmin) {
    redirect("/masuk-admin");
  }

  const canReadDashboard = hasPermission(user.permissions, DEFAULT_RESOURCE, "read");
  if (!canReadDashboard) {
    redirect("/masuk-admin");
  }

  const [villageName, menu, konteksImpersonasi] = await Promise.all([
    user.villageId === null ? Promise.resolve(null) : getNamaDesaUseCase(user.villageId),
    getMenuForUser(user),
    getKonteksImpersonasi().catch(() => null),
  ]);

  return (
    <div className="admin-frame">
      <AdminSidebar
        menu={menu}
        canReadDashboard={canReadDashboard}
        isPlatformAdmin={isPlatformAdmin}
        villageName={villageName ?? ""}
      />
      <div
        className="admin-main"
        data-konsol={isPlatformAdmin ? "platform" : undefined}
        data-desa={isPlatformAdmin ? undefined : "true"}
      >
        <AdminTopbar isPlatformAdmin={isPlatformAdmin} name={user.name} />
        {konteksImpersonasi ? (
          <ImpersonationBanner aksiKeluar={keluarImpersonasiAction} konteks={konteksImpersonasi} />
        ) : null}
        <main className="admin-content">
          <div className="admin-page">{children}</div>
        </main>
      </div>
    </div>
  );
}
