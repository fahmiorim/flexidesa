import "server-only";

import {
  getIdentitasFromRequest,
  resolveVillageId,
} from "@/features/info-desa/desa/application/resolve-village";
import { getRincianStatistikPublik } from "@/features/info-desa/desa/application/statistik-rinci-publik";
import { hapusMedia } from "@/features/media/infrastructure/media-storage";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import {
  AREA_RESOURCE,
  cdesaMutasiSchema,
  cdesaSchema,
  GARIS_RESOURCE,
  PERTANAHAN_RESOURCE,
  POINT_RESOURCE,
  POLYGON_RESOURCE,
  SIMBOL_RESOURCE,
  validasiGeojsonPolygon,
  type AreaFormInput,
  type GarisFormInput,
  type PersilFormInput,
  type PointFormInput,
  type PolygonDTO,
  type PolygonFormInput,
  type SimbolFormInput,
} from "@/features/pertanahan-gis/gis/domain/gis";
import {
  countAreaByLayer as repoCountAreaByLayer,
  deleteArea as repoDeleteArea,
  deleteCdesa as repoDeleteCdesa,
  deleteCdesaMutasi as repoDeleteCdesaMutasi,
  deleteGaris as repoDeleteGaris,
  deletePersil as repoDeletePersil,
  deletePoint as repoDeletePoint,
  deletePolygon as repoDeletePolygon,
  deleteSimbol as repoDeleteSimbol,
  findAreaById as repoFindAreaById,
  findCdesaById as repoFindCdesaById,
  findCdesaMutasiById as repoFindCdesaMutasiById,
  findGarisById as repoFindGarisById,
  findPersilById as repoFindPersilById,
  findPolygonById as repoFindPolygonById,
  insertArea as repoInsertArea,
  insertCdesaMutasi as repoInsertCdesaMutasi,
  insertPersil as repoInsertPersil,
  insertPoint as repoInsertPoint,
  insertPolygon as repoInsertPolygon,
  insertSimbol as repoInsertSimbol,
  listAllPolygons as repoListAllPolygons,
  listAreas as repoListAreas,
  listGaris as repoListGaris,
  listPersil as repoListPersil,
  listPoints as repoListPoints,
  listPolygons as repoListPolygons,
  updateArea as repoUpdateArea,
  updateCdesa as repoUpdateCdesa,
  updateCdesaMutasi as repoUpdateCdesaMutasi,
  updateGaris as repoUpdateGaris,
  updatePersil as repoUpdatePersil,
  updatePoint as repoUpdatePoint,
  updatePolygon as repoUpdatePolygon,
  updateSimbol as repoUpdateSimbol,
} from "@/features/pertanahan-gis/gis/infrastructure/gis-repository";
import { requirePermission, requireUser } from "@/lib/dal";
import { notFound } from "@/lib/errors";

// --- Polygon ---------------------------------------------------------------

export async function listPolygonUseCases(): Promise<PolygonDTO[]> {
  const user = await requireUser();
  const resolvedVillageId = await resolveVillageId(user);
  await requirePermission(POLYGON_RESOURCE, "read");
  return repoListPolygons(resolvedVillageId);
}

export async function listAllPolygonUseCases(): Promise<PolygonDTO[]> {
  const user = await requireUser();
  const resolvedVillageId = await resolveVillageId(user);
  await requirePermission(POLYGON_RESOURCE, "read");
  return repoListAllPolygons(resolvedVillageId);
}

/** Data peta yang boleh ditampilkan kepada publik; tenant wajib ditentukan host. */
export async function getPetaPublik() {
  const { id: villageId } = await getIdentitasFromRequest();
  const [areas, garises, points, polygons] = await Promise.all([
    repoListAreas(villageId, true),
    repoListGaris(villageId, true),
    repoListPoints(villageId, true),
    repoListPolygons(villageId, true),
  ]);
  return { areas, garises, points, polygons };
}

export async function createPolygon(input: PolygonFormInput): Promise<{ id: number }> {
  const user = await requirePermission(POLYGON_RESOURCE, "create");
  const resolvedVillageId = await resolveVillageId(user);
  if (input.parrent !== null && input.parrent !== undefined) {
    const parent = await repoFindPolygonById(resolvedVillageId, input.parrent);
    if (!parent) throw notFound("Layer polygon induk tidak ditemukan.");
  }
  const id = await repoInsertPolygon(resolvedVillageId, input);
  return { id };
}

export async function updatePolygon(id: number, input: PolygonFormInput): Promise<void> {
  const user = await requirePermission(POLYGON_RESOURCE, "update");
  const villageId = await resolveVillageId(user);
  const polygon = await repoFindPolygonById(villageId, id);
  if (!polygon) throw notFound();
  if (input.parrent !== null && input.parrent !== undefined) {
    if (input.parrent === id)
      throw notFound("Layer polygon tidak dapat menjadi induk dirinya sendiri.");
    const parent = await repoFindPolygonById(villageId, input.parrent);
    if (!parent) throw notFound("Layer polygon induk tidak ditemukan.");
  }
  await repoUpdatePolygon(villageId, id, input);
}

export async function deletePolygon(id: number): Promise<void> {
  const user = await requirePermission(POLYGON_RESOURCE, "delete");
  const villageId = await resolveVillageId(user);
  const polygon = await repoFindPolygonById(villageId, id);
  if (!polygon) throw notFound();
  await repoDeletePolygon(villageId, id);
}

// --- Area ------------------------------------------------------------------

export async function createArea(input: AreaFormInput): Promise<{ id: number }> {
  const user = await requireUser();
  const resolvedVillageId = await resolveVillageId(user);
  await requirePermission(AREA_RESOURCE, "create");
  if (input.refPolygon !== null && input.refPolygon !== undefined) {
    const polygon = await repoFindPolygonById(resolvedVillageId, input.refPolygon);
    if (!polygon) throw notFound("Kategori polygon tidak ditemukan.");
  }
  if (input.path) validasiGeojsonPolygon(input.path);
  const id = await repoInsertArea(resolvedVillageId, input);
  return { id };
}

export async function updateArea(id: number, input: AreaFormInput): Promise<void> {
  const user = await requireUser();
  await requirePermission(AREA_RESOURCE, "update");
  const villageId = await resolveVillageId(user);
  const area = await repoFindAreaById(villageId, id);
  if (!area) throw notFound();
  if (input.refPolygon !== null && input.refPolygon !== undefined) {
    const polygon = await repoFindPolygonById(villageId, input.refPolygon);
    if (!polygon) throw notFound("Kategori polygon tidak ditemukan.");
  }
  if (input.path) validasiGeojsonPolygon(input.path);
  await repoUpdateArea(villageId, id, input);
  // Foto lama dibersihkan setelah baris tersimpan agar tidak ada referensi yatim.
  if (area.foto && input.foto !== area.foto) await hapusMedia(area.foto);
}

export async function deleteArea(id: number): Promise<void> {
  const user = await requireUser();
  await requirePermission(AREA_RESOURCE, "delete");
  const villageId = await resolveVillageId(user);
  const area = await repoFindAreaById(villageId, id);
  if (!area) throw notFound();
  await repoDeleteArea(villageId, id);
  if (area.foto) await hapusMedia(area.foto);
}

// --- Halaman Peta Desa -----------------------------------------------------

/**
 * Data halaman Peta Desa: area (shape) + layer (polygon) desa aktif.
 *
 * Ini satu-satunya jalur baca/tulis admin untuk tabel `areas`/`polygons`;
 * resource-nya `peta`, sesuai modul menu yang memberi izin.
 */
export async function getPetaWilayahData() {
  const user = await requirePermission(RESOURCES.peta, "read");
  const villageId = await resolveVillageId(user);
  const [shapes, layers] = await Promise.all([
    repoListAreas(villageId),
    repoListPolygons(villageId),
  ]);
  return {
    shapes,
    layers,
    akses: {
      ubah: hasPermission(user.permissions, RESOURCES.peta, "update"),
      hapus: hasPermission(user.permissions, RESOURCES.peta, "delete"),
    },
  };
}

/**
 * Geometri peta untuk halaman lain yang sudah memeriksa izinnya sendiri
 * (mis. editor batas wilayah administratif). Tidak melakukan pemeriksaan izin
 * tambahan agar tidak menuntut modul `peta` pada halaman Profil Desa.
 */
export async function getPetaGeometriTenant(villageId: number) {
  const [shapes, layers] = await Promise.all([
    repoListAreas(villageId),
    repoListPolygons(villageId),
  ]);
  return { shapes, layers };
}

/** Simpan area peta dari form Tulis/Edit Area. */
export async function simpanAreaPeta(
  id: number | null,
  input: AreaFormInput,
): Promise<{ id: number } | void> {
  if (!input.nama.trim()) throw new Error("Nama area GIS wajib diisi.");
  return id ? updateArea(id, input) : createArea(input);
}

export async function hapusAreaPeta(id: number): Promise<void> {
  return deleteArea(id);
}

/** Simpan layer polygon peta dari form Tambah/Edit Layer. */
export async function simpanLayerPeta(
  id: number | null,
  input: PolygonFormInput,
): Promise<{ id: number } | void> {
  if (!input.nama.trim()) throw new Error("Nama layer wajib diisi.");
  if (!input.color || !/^#[0-9a-fA-F]{6}$/.test(input.color)) {
    throw new Error("Warna layer harus berupa kode HEX.");
  }
  return id ? updatePolygon(id, input) : createPolygon({ ...input, tipe: 0, parrent: null });
}

/** Hapus layer; layer yang masih dipakai area tidak boleh dihapus. */
export async function hapusLayerPeta(id: number): Promise<void> {
  const user = await requirePermission(POLYGON_RESOURCE, "delete");
  const villageId = await resolveVillageId(user);
  const dipakai = await repoCountAreaByLayer(villageId, id);
  if (dipakai) {
    throw new Error(
      "Layer masih dipakai area peta. Pindahkan atau hapus area terkait terlebih dahulu.",
    );
  }
  await deletePolygon(id);
}

// --- Garis -----------------------------------------------------------------

export async function updateGaris(id: number, input: GarisFormInput): Promise<void> {
  const user = await requirePermission(GARIS_RESOURCE, "update");
  const villageId = await resolveVillageId(user);
  const garis = await repoFindGarisById(villageId, id);
  if (!garis) throw notFound();
  if (input.refLine !== null && input.refLine !== undefined) {
    if (input.refLine === id) throw notFound("Garis tidak dapat menjadi induk dirinya sendiri.");
    const parent = await repoFindGarisById(villageId, input.refLine);
    if (!parent) throw notFound("Garis induk tidak ditemukan.");
  }
  await repoUpdateGaris(villageId, id, input);
}

export async function deleteGaris(id: number): Promise<void> {
  const user = await requirePermission(GARIS_RESOURCE, "delete");
  const villageId = await resolveVillageId(user);
  const garis = await repoFindGarisById(villageId, id);
  if (!garis) throw notFound();
  await repoDeleteGaris(villageId, id);
}

// --- Point -----------------------------------------------------------------

export async function createPoint(input: PointFormInput): Promise<{ id: number }> {
  const user = await requirePermission(POINT_RESOURCE, "create");
  const resolvedVillageId = await resolveVillageId(user);
  if (input.parrent !== null && input.parrent !== undefined) {
    const parent = await repoFindPolygonById(resolvedVillageId, input.parrent);
    if (!parent) throw notFound("Layer polygon tidak ditemukan.");
  }
  const id = await repoInsertPoint(resolvedVillageId, input);
  return { id };
}

export async function updatePoint(id: number, input: PointFormInput): Promise<void> {
  const user = await requirePermission(POINT_RESOURCE, "update");
  const villageId = await resolveVillageId(user);
  const existing = (await repoListPoints(villageId)).find((point) => point.id === id);
  if (!existing) throw notFound();
  if (input.parrent !== null && input.parrent !== undefined) {
    const parent = await repoFindPolygonById(villageId, input.parrent);
    if (!parent) throw notFound("Layer polygon tidak ditemukan.");
  }
  await repoUpdatePoint(villageId, id, input);
}

export async function deletePoint(id: number): Promise<void> {
  const user = await requirePermission(POINT_RESOURCE, "delete");
  const villageId = await resolveVillageId(user);
  const existing = (await repoListPoints(villageId)).find((point) => point.id === id);
  if (!existing) throw notFound();
  await repoDeletePoint(villageId, id);
}

// --- Simbol ----------------------------------------------------------------

export async function createSimbol(input: SimbolFormInput): Promise<{ id: number }> {
  await requireUser();
  await requirePermission(SIMBOL_RESOURCE, "create");
  const id = await repoInsertSimbol(input);
  return { id };
}

export async function updateSimbol(id: number, input: SimbolFormInput): Promise<void> {
  await requireUser();
  await requirePermission(SIMBOL_RESOURCE, "update");
  await repoUpdateSimbol(id, input);
}

export async function deleteSimbol(id: number): Promise<void> {
  await requireUser();
  await requirePermission(SIMBOL_RESOURCE, "delete");
  await repoDeleteSimbol(id);
}

/**
 * Sebaran penduduk per wilayah untuk halaman peta penduduk.
 *
 * Angka diambil dari kontrak rincian statistik milik fitur desa (bukan
 * repository-nya), sehingga kepemilikan query tetap di satu tempat.
 */
export async function getPetaPenduduk() {
  const user = await requirePermission(RESOURCES.peta, "read");
  const villageId = await resolveVillageId(user);

  const rincian = await getRincianStatistikPublik(villageId);
  const total = rincian.perDusun.reduce((jumlah, row) => jumlah + row.total, 0);

  return {
    perDusun: rincian.perDusun,
    total,
    lakiLaki: rincian.perDusun.reduce((jumlah, row) => jumlah + row.lakiLaki, 0),
    perempuan: rincian.perDusun.reduce((jumlah, row) => jumlah + row.perempuan, 0),
  };
}

// --- Persil & Pertanahan ---------------------------------------------------

/** Data pertanahan (persil) desa beserta izin pengguna untuk halaman admin. */
export async function getDataPertanahan() {
  const user = await requirePermission(PERTANAHAN_RESOURCE, "read");
  const villageId = await resolveVillageId(user);

  const rows = await repoListPersil(villageId);
  return {
    rows,
    akses: {
      bolehTambah: hasPermission(user.permissions, PERTANAHAN_RESOURCE, "create"),
      bolehUbah: hasPermission(user.permissions, PERTANAHAN_RESOURCE, "update"),
      bolehHapus: hasPermission(user.permissions, PERTANAHAN_RESOURCE, "delete"),
    },
  };
}

export async function createPersil(input: PersilFormInput): Promise<{ id: number }> {
  const user = await requirePermission(PERTANAHAN_RESOURCE, "create");
  const resolvedVillageId = await resolveVillageId(user);
  const id = await repoInsertPersil(resolvedVillageId, input);
  return { id };
}

export async function updatePersil(id: number, input: PersilFormInput): Promise<void> {
  const user = await requirePermission(PERTANAHAN_RESOURCE, "update");
  const villageId = await resolveVillageId(user);
  const persil = await repoFindPersilById(villageId, id);
  if (!persil) throw notFound();
  await repoUpdatePersil(villageId, id, input);
}

export async function deletePersil(id: number): Promise<void> {
  const user = await requirePermission(PERTANAHAN_RESOURCE, "delete");
  const villageId = await resolveVillageId(user);
  const persil = await repoFindPersilById(villageId, id);
  if (!persil) throw notFound();
  await repoDeletePersil(villageId, id);
}

// --- CDesa (Laporan Pertanahan) -------------------------------------------

export async function updateCdesa(id: number, input: unknown): Promise<void> {
  const user = await requirePermission(PERTANAHAN_RESOURCE, "update");
  const villageId = await resolveVillageId(user);
  const existing = await repoFindCdesaById(villageId, id);
  if (!existing) throw notFound();

  const parsed = cdesaSchema.parse(input);
  const updated = await repoUpdateCdesa(villageId, id, {
    nomor: parsed.nomor,
    nomorPersil: parsed.nomorPersil ?? null,
    nomorSertifikat: parsed.nomorSertifikat ?? null,
    tanggal: parsed.tanggal ?? null,
    namaPemegang: parsed.namaPemegang ?? null,
    luas: parsed.luas,
    keterangan: parsed.keterangan ?? null,
    sortOrder: parsed.sortOrder,
  });
  if (!updated) throw notFound();
}

export async function deleteCdesa(id: number): Promise<void> {
  const user = await requirePermission(PERTANAHAN_RESOURCE, "delete");
  const villageId = await resolveVillageId(user);
  const cdesa = await repoFindCdesaById(villageId, id);
  if (!cdesa) throw notFound();
  await repoDeleteCdesa(villageId, id);
}

// --- CDesa Mutasi ---------------------------------------------------------

export async function createCdesaMutasi(input: unknown): Promise<{ id: number }> {
  const user = await requirePermission(PERTANAHAN_RESOURCE, "create");
  const villageId = await resolveVillageId(user);
  const parsed = cdesaMutasiSchema.parse(input);
  const cdesa = await repoFindCdesaById(villageId, parsed.cdesaId);
  if (!cdesa) throw notFound("Data Cdesa tidak ditemukan.");
  const id = await repoInsertCdesaMutasi({ ...parsed, villageId });
  return { id };
}

export async function updateCdesaMutasi(id: number, input: unknown): Promise<void> {
  const user = await requirePermission(PERTANAHAN_RESOURCE, "update");
  const villageId = await resolveVillageId(user);
  const existing = await repoFindCdesaMutasiById(villageId, id);
  if (!existing) throw notFound();

  const parsed = cdesaMutasiSchema.parse(input);
  const cdesa = await repoFindCdesaById(villageId, parsed.cdesaId);
  if (!cdesa) throw notFound("Data Cdesa tidak ditemukan.");

  const updated = await repoUpdateCdesaMutasi(villageId, id, {
    cdesaId: parsed.cdesaId,
    nomor: parsed.nomor,
    tanggal: parsed.tanggal,
    tipe: parsed.tipe,
    keterangan: parsed.keterangan ?? null,
    sortOrder: parsed.sortOrder,
  });
  if (!updated) throw notFound();
}

export async function deleteCdesaMutasi(id: number): Promise<void> {
  const user = await requirePermission(PERTANAHAN_RESOURCE, "delete");
  const villageId = await resolveVillageId(user);
  const existing = await repoFindCdesaMutasiById(villageId, id);
  if (!existing) throw notFound();
  await repoDeleteCdesaMutasi(villageId, id);
}
