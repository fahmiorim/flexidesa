import "server-only";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { getNamaDesaUseCase } from "@/features/info-desa/desa/application/use-cases";
import { WILAYAH_RESOURCE, wilayahTurunan } from "@/features/info-desa/wilayah/domain/wilayah";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { getCurrentUser } from "@/lib/dal";

import { getTingkatWilayah, labelWilayah } from "./tingkat";

/**
 * Data unduhan wilayah untuk satu tingkat penelusuran.
 *
 * Otorisasi dilakukan di sini agar route XLSX/PDF hanya mengurus HTTP. `parent`
 * berasal dari URL dan hanya menentukan tingkat tampilan; tenant tetap diambil
 * dari sesi.
 */
export async function getUnduhanWilayah(parentId: number | null) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, status: 401, pesan: "Sesi Anda telah berakhir." };
  if (!hasPermission(user.permissions, WILAYAH_RESOURCE, "read")) {
    return { ok: false as const, status: 403, pesan: "Anda tidak memiliki hak akses." };
  }

  const villageId = await resolveVillageId(user);
  const [namaDesa, { induk, daftar, judul, semua }] = await Promise.all([
    getNamaDesaUseCase(villageId),
    getTingkatWilayah(parentId),
  ]);

  return {
    ok: true as const,
    namaDesa: namaDesa ?? "Desa",
    indukLabel: induk ? labelWilayah(induk) : null,
    judul,
    rows: daftar,
    /** Jumlah turunan tiap baris, sejajar dengan `rows`. */
    turunan: daftar.map((row) => wilayahTurunan(semua, row).length),
  };
}
