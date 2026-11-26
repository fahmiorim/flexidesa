import "server-only";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { recordAuditEvent } from "@/features/pengaturan/audit/application/audit-use-cases";
import { AUDIT_EVENTS } from "@/features/pengaturan/audit/domain/audit";
import { bacaPengaturan } from "@/features/pengaturan/pengaturan/application/pengaturan-use-cases";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { pengajuanRegistrasiWargaSchema } from "@/features/pengaturan/registrasi-warga/domain/registrasi-warga";
import {
  ajukanRegistrasiWarga,
  daftarRegistrasiWarga,
  prosesRegistrasiWarga,
} from "@/features/pengaturan/registrasi-warga/infrastructure/registrasi-warga-repository";
import { requirePermission } from "@/lib/dal";
import { validationError } from "@/lib/errors";

export async function kirimPengajuanRegistrasiWarga(
  villageId: number,
  input: unknown,
): Promise<void> {
  const pengaturan = await bacaPengaturan(villageId);
  if (!pengaturan.pendaftaranWargaAktif)
    throw validationError("Pendaftaran akun warga sedang ditutup oleh pemerintah desa.");
  const parsed = pengajuanRegistrasiWargaSchema.safeParse(input);
  if (!parsed.success)
    throw validationError(parsed.error.issues[0]?.message ?? "Data pendaftaran tidak valid.");
  await ajukanRegistrasiWarga(villageId, parsed.data);
}

export async function ambilRegistrasiWargaAdmin() {
  const user = await requirePermission(RESOURCES.pengguna, "read");
  const villageId = await resolveVillageId(user);
  return daftarRegistrasiWarga(villageId);
}

export async function tinjauRegistrasiWargaAdmin(input: {
  id: number;
  keputusan: "setujui" | "tolak";
  catatan?: string;
}) {
  if (
    !Number.isSafeInteger(input.id) ||
    input.id <= 0 ||
    !["setujui", "tolak"].includes(input.keputusan)
  ) {
    throw validationError("Keputusan pendaftaran tidak valid.");
  }
  const user = await requirePermission(RESOURCES.pengguna, "update");
  const villageId = await resolveVillageId(user);
  const credential = await prosesRegistrasiWarga(
    villageId,
    input.id,
    input.keputusan,
    input.catatan,
  );
  await recordAuditEvent({
    villageId,
    actorId: user.id,
    event:
      input.keputusan === "setujui"
        ? AUDIT_EVENTS.registrasiWargaDisetujui
        : AUDIT_EVENTS.registrasiWargaDitolak,
    resource: "registrasi-warga",
    resourceId: String(input.id),
    details: { keputusan: input.keputusan },
  });
  return credential;
}
