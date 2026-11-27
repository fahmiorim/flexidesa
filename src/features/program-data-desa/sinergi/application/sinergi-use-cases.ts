import "server-only";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { requirePermission } from "@/lib/dal";

import { SINERGI_RESOURCE, sinergiSchema, type SinergiInput } from "../domain/sinergi";
import { createSinergi, listSinergi } from "../infrastructure/sinergi-repository";

/** Ubah isian formulir (string kosong) menjadi nilai kolom yang bersih. */
function nilaiKolom(parsed: SinergiInput) {
  return {
    nama: parsed.nama,
    mitra: parsed.mitra || null,
    tahun: parsed.tahun ?? null,
    tanggalMulai: parsed.tanggalMulai || null,
    tanggalSelesai: parsed.tanggalSelesai || null,
    keterangan: parsed.keterangan || null,
  };
}

async function konteksSinergi(action: "read" | "update" | "delete"): Promise<number> {
  const user = await requirePermission(SINERGI_RESOURCE, action);
  return resolveVillageId(user);
}

export async function daftarSinergi() {
  const villageId = await konteksSinergi("read");
  return listSinergi(villageId);
}

/** Daftar program untuk situs publik; tenant ditentukan oleh host. */

export async function tambahSinergi(input: unknown) {
  const villageId = await konteksSinergi("update");
  const parsed = sinergiSchema.parse(input);
  const id = await createSinergi({ villageId, ...nilaiKolom(parsed) });
  return { id };
}
