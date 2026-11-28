import "server-only";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import {
  buildKiaCsv,
  bulananAnakSchema,
  hitungSkorcardKia,
  ibuHamilSchema,
  KIA_RESOURCE,
  kiaRekapFilename,
  kiaSchema,
  paudSchema,
  posyanduSchema,
} from "@/features/kependudukan/kesehatan/domain/kesehatan";
import {
  createBulananAnak,
  createIbuHamil,
  createKia,
  createPosyandu,
  createSasaranPaud,
  deleteBulananAnak,
  deleteIbuHamil,
  deleteKia,
  deletePosyandu,
  deleteSasaranPaud,
  findKiaReferenceById,
  kiaResidentReferencesOwned,
  listBulananAnak,
  listIbuHamil,
  listKia,
  listPendudukStunting,
  listPosyandu,
  listSasaranPaud,
  updateBulananAnak,
  updateIbuHamil,
  updateKia,
  updatePosyandu,
  updateSasaranPaud,
} from "@/features/kependudukan/kesehatan/infrastructure/kesehatan-repository";
import type { Action } from "@/features/pengaturan/rbac/domain/permission";
import { requirePermission } from "@/lib/dal";
import { AppError } from "@/lib/errors";

async function konteksKia(action: Action): Promise<number> {
  const user = await requirePermission(KIA_RESOURCE, action);
  return resolveVillageId(user);
}

function validasiId(id: number): void {
  if (!Number.isInteger(id) || id < 1) {
    throw new AppError("VALIDATION", "ID tidak valid.");
  }
}

/**
 * Tanggal periksa dari form boleh kosong; kolom DATE MySQL menerima NULL,
 * bukan string kosong. Nilai kosong dinormalisasi sebelum masuk repository.
 */
function normalisasiTanggal<T extends { tanggalPeriksa?: string | null }>(input: T): T {
  if (input.tanggalPeriksa === undefined || input.tanggalPeriksa === null) return input;
  return { ...input, tanggalPeriksa: input.tanggalPeriksa === "" ? null : input.tanggalPeriksa };
}

/** Data halaman pemantauan anak beserta opsi posyandu dan KIA. */

/** Data halaman pemantauan ibu hamil beserta opsi posyandu dan KIA. */

/** Data halaman KIA beserta opsi penduduk dan posyandu. */

/** Daftar posyandu desa untuk halaman admin. */

/**
 * Seluruh data workspace Stunting dalam satu muatan.
 *
 * Workspace ini menggabungkan Posyandu, KIA, pemantauan ibu hamil/anak,
 * rekapitulasi, dan scorecard konvergensi dalam satu modul. Halaman
 * memuat semuanya sekali agar perpindahan tab tidak memicu permintaan baru dan
 * angka rekap selalu memakai data yang sama dengan tabel.
 */
export async function muatStuntingData() {
  const user = await requirePermission(KIA_RESOURCE, "read");
  const villageId = await resolveVillageId(user);
  const [posyanduRows, kiaRows, ibuHamilRows, anakRows, paudRows, penduduk] = await Promise.all([
    listPosyandu(villageId),
    listKia(villageId),
    listIbuHamil(villageId),
    listBulananAnak(villageId),
    listSasaranPaud(villageId),
    listPendudukStunting(villageId),
  ]);

  return {
    posyandu: posyanduRows,
    kia: kiaRows,
    ibuHamil: ibuHamilRows,
    anak: anakRows,
    paud: paudRows,
    penduduk,
  };
}

export async function tambahPosyandu(
  input: Omit<Parameters<typeof createPosyandu>[0], "villageId">,
) {
  const villageId = await konteksKia("update");
  const parsed = posyanduSchema.omit({ id: true, villageId: true }).parse(input);
  return createPosyandu({ ...parsed, villageId });
}

export async function ubahPosyandu(id: number, input: unknown) {
  validasiId(id);
  const villageId = await konteksKia("update");
  const parsed = posyanduSchema.omit({ id: true, villageId: true }).partial().parse(input);
  return updatePosyandu(id, villageId, parsed);
}

export async function hapusPosyandu(id: number) {
  validasiId(id);
  const villageId = await konteksKia("delete");
  return deletePosyandu(id, villageId);
}

export async function tambahKia(input: Omit<Parameters<typeof createKia>[0], "villageId">) {
  const villageId = await konteksKia("update");
  const parsed = kiaSchema.omit({ id: true, villageId: true }).parse(input);
  if (!(await kiaResidentReferencesOwned(villageId, parsed.ibuId, parsed.anakId))) {
    throw new AppError("VALIDATION", "Data ibu atau anak tidak ditemukan pada desa ini.");
  }
  return createKia({ ...parsed, villageId });
}

export async function ubahKia(id: number, input: unknown) {
  validasiId(id);
  const villageId = await konteksKia("update");
  const parsed = kiaSchema.omit({ id: true, villageId: true }).partial().parse(input);
  const current = await findKiaReferenceById(villageId, id);
  if (!current) throw new AppError("NOT_FOUND", "Data KIA tidak ditemukan.");
  const ibuId = parsed.ibuId ?? current.ibuId;
  const anakId = parsed.anakId === undefined ? current.anakId : parsed.anakId;
  if (!(await kiaResidentReferencesOwned(villageId, ibuId, anakId))) {
    throw new AppError("VALIDATION", "Data ibu atau anak tidak ditemukan pada desa ini.");
  }
  return updateKia(id, villageId, parsed);
}

export async function hapusKia(id: number) {
  validasiId(id);
  const villageId = await konteksKia("delete");
  return deleteKia(id, villageId);
}

export async function tambahIbuHamil(
  input: Omit<Parameters<typeof createIbuHamil>[0], "villageId">,
) {
  const villageId = await konteksKia("update");
  const parsed = ibuHamilSchema.omit({ id: true, villageId: true }).parse(input);
  return createIbuHamil({ ...normalisasiTanggal(parsed), villageId });
}

export async function ubahIbuHamil(id: number, input: unknown) {
  validasiId(id);
  const villageId = await konteksKia("update");
  const parsed = ibuHamilSchema.omit({ id: true, villageId: true }).partial().parse(input);
  return updateIbuHamil(id, villageId, normalisasiTanggal(parsed));
}

export async function hapusIbuHamil(id: number) {
  validasiId(id);
  const villageId = await konteksKia("delete");
  return deleteIbuHamil(id, villageId);
}

export async function tambahBulananAnak(
  input: Omit<Parameters<typeof createBulananAnak>[0], "villageId">,
) {
  const villageId = await konteksKia("update");
  const parsed = bulananAnakSchema.omit({ id: true, villageId: true }).parse(input);
  return createBulananAnak({ ...normalisasiTanggal(parsed), villageId });
}

export async function ubahBulananAnak(id: number, input: unknown) {
  validasiId(id);
  const villageId = await konteksKia("update");
  const parsed = bulananAnakSchema.omit({ id: true, villageId: true }).partial().parse(input);
  return updateBulananAnak(id, villageId, normalisasiTanggal(parsed));
}

export async function hapusBulananAnak(id: number) {
  validasiId(id);
  const villageId = await konteksKia("delete");
  return deleteBulananAnak(id, villageId);
}

/** Pemantauan sasaran PAUD 2-6 tahun. */
export async function tambahSasaranPaud(
  input: Omit<Parameters<typeof createSasaranPaud>[0], "villageId">,
) {
  const villageId = await konteksKia("update");
  const parsed = paudSchema.omit({ id: true, villageId: true }).parse(input);
  return createSasaranPaud({ ...normalisasiTanggal(parsed), villageId });
}

export async function ubahSasaranPaud(id: number, input: unknown) {
  validasiId(id);
  const villageId = await konteksKia("update");
  const parsed = paudSchema.omit({ id: true, villageId: true }).partial().parse(input);
  return updateSasaranPaud(id, villageId, normalisasiTanggal(parsed));
}

export async function hapusSasaranPaud(id: number) {
  validasiId(id);
  const villageId = await konteksKia("delete");
  return deleteSasaranPaud(id, villageId);
}

/** Ekspor rekapitulasi KIA sebagai CSV dengan filter opsional status gizi/tikar. */
export async function exportRekapKia(
  params: {
    statusGizi?: number;
    statusTikar?: number;
    posyanduId?: number;
  } = {},
): Promise<{ csv: string; filename: string }> {
  const villageId = await konteksKia("read");

  const bulananRows = await listBulananAnak(villageId);

  let filteredBulanan = bulananRows;
  if (params.statusGizi !== undefined) {
    filteredBulanan = filteredBulanan.filter((row) => row.statusGizi === params.statusGizi);
  }
  if (params.statusTikar !== undefined) {
    filteredBulanan = filteredBulanan.filter((row) => row.statusTikar === params.statusTikar);
  }

  const kiaRows = await listKia(villageId);
  const kiaMap = new Map(kiaRows.map((row) => [row.id, row]));

  const posyanduRows = await listPosyandu(villageId);
  const posyanduMap = new Map(posyanduRows.map((p) => [p.id, p.nama]));

  const csvRows = filteredBulanan.map((row) => ({
    statusGizi: row.statusGizi,
    statusTikar: row.statusTikar,
    posyanduId: row.posyanduId as number | undefined,
    posyanduName: row.posyanduId !== undefined ? posyanduMap.get(row.posyanduId) || "-" : "-",
    ibuName: kiaMap.get(row.kiaId)?.ibuName ?? "-",
    konversi:
      row.statusGizi === 4 || row.statusTikar === 4
        ? "Tinggi"
        : row.statusGizi >= 3 || row.statusTikar >= 3
          ? "Sedang"
          : "Rendah",
  }));

  const skorcard = hitungSkorcardKia(
    csvRows.map((row) => ({
      statusGizi: row.statusGizi,
      statusTikar: row.statusTikar,
      posyanduId: row.posyanduId,
    })),
  );

  return {
    csv: buildKiaCsv({
      namaDesa: null,
      judulPemilihan: "KIA - Kesehatan Ibu dan Anak",
      tanggalPemilihan: new Date().toISOString().slice(0, 10),
      rows: csvRows,
      total: skorcard.total,
      stunting: skorcard.stunting,
      konversiPersentase: skorcard.konversi,
    }),
    filename: kiaRekapFilename(null),
  };
}
