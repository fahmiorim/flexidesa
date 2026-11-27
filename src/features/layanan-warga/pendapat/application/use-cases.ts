import "server-only";

import { getIdentitas } from "@/features/info-desa/desa/application/get-identitas";
import {
  buildPendapatCsv,
  pendapatFilename,
  type PendapatEksporRow,
} from "@/features/layanan-warga/pendapat/domain/pendapat-berkas";
import { listPendapat } from "@/features/layanan-warga/pendapat/infrastructure/pendapat-repository";

/** Ekspor seluruh pendapat warga desa sebagai CSV. */
export async function exportPendapatUseCase(
  villageId: number,
): Promise<{ csv: string; filename: string } | null> {
  const [rows, desa] = await Promise.all([listPendapat(villageId, 1, 10000), getIdentitas()]);

  if (rows.rows.length === 0) return null;

  const data: PendapatEksporRow[] = rows.rows.map((row) => ({
    id: row.id,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString().slice(0, 19).replace("T", " ")
        : String(row.createdAt ?? ""),
    pengguna: row.pengguna,
    pilihan: row.pilihan,
    residentId: row.residentId,
  }));

  return {
    csv: buildPendapatCsv({ namaDesa: desa?.namaDesa ?? null, rows: data }),
    filename: pendapatFilename(desa?.namaDesa ?? null),
  };
}
