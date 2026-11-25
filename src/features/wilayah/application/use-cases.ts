import "server-only";

import type { z } from "zod";

import { resolveVillageId } from "@/features/desa/application/resolve-village";
import { sinkronkanKepalaDusun } from "@/features/pemerintahan/application/sinkron-kepala-dusun";
import {
  batasWilayahSchema,
  petaKantorSchema,
  rencanaUbahWilayah,
  ubahWilayahSchema,
  wilayahDiBawah,
  wilayahFormSchema,
  type WilayahFormInput,
} from "@/features/wilayah/domain/wilayah";
import {
  cariPendudukKepala,
  deleteWilayah,
  findWilayahById,
  hitungPemakaiWilayah,
  insertWilayah,
  listWilayahOptions,
  pendudukMilikDesa,
  terapkanGantiNama,
  tukarUrutanWilayah,
  updateBatasWilayah,
  updateKantorWilayah,
  updateWilayah,
  wilayahExists,
} from "@/features/wilayah/infrastructure/wilayah-repository";
import { zodToFieldErrors } from "@/lib/action-state";
import { requirePermission } from "@/lib/dal";
import { conflict, notFound, validationError } from "@/lib/errors";

/** Validasi input dan lempar AppError VALIDATION agar pesan aman sampai ke form. */
function validasi<T>(schema: z.ZodType<T>, input: unknown): T {
  const hasil = schema.safeParse(input);
  if (!hasil.success) {
    throw validationError("Data yang dikirim tidak valid.", zodToFieldErrors(hasil.error));
  }
  return hasil.data;
}

/** Cari penduduk hidup untuk pemilih kepala wilayah (NIK atau nama). */
export async function cariKepalaWilayah(q: string) {
  if (q.trim().length < 2) return [];
  const user = await requirePermission("wilayah", "read");
  const villageId = await resolveVillageId(user);
  return cariPendudukKepala(villageId, q);
}

/** Simpan kepala wilayah: penduduk desa menimpa teks nama agar konsisten. */
async function kepalaDariInput(
  villageId: number,
  input: Pick<WilayahFormInput, "kepala" | "kepalaResidentId">,
) {
  if (input.kepalaResidentId === null) return input.kepala;
  const penduduk = await pendudukMilikDesa(villageId, input.kepalaResidentId);
  if (!penduduk) throw validationError("Penduduk kepala wilayah tidak ditemukan pada desa aktif.");
  return penduduk.nama;
}

/**
 * Menyelaraskan aparat kepala dusun setelah perubahan wilayah.
 *
 * Hanya tingkat dusun yang menghasilkan aparat; ketua RW/RT tetap data wilayah.
 */
async function sinkronKepalaDusun(villageId: number, wilayahId: number, parsed: WilayahFormInput) {
  await sinkronkanKepalaDusun({
    villageId,
    wilayahId,
    dusun: parsed.dusun,
    kepalaResidentId: parsed.kepalaResidentId,
    namaKepala: parsed.kepala,
    kepalaDusun: Boolean(parsed.dusun.trim()) && !parsed.rw && !parsed.rt,
  });
}

/** Tambah wilayah baru; peta diatur setelah baris dibuat. */
export async function simpanWilayah(input: unknown) {
  const user = await requirePermission("wilayah", "create");
  const villageId = await resolveVillageId(user);
  const parsed = validasi(wilayahFormSchema, input);
  if (await wilayahExists(villageId, parsed, null))
    throw conflict("Kombinasi dusun/RW/RT sudah terdaftar.");
  parsed.kepala = await kepalaDariInput(villageId, parsed);
  const wilayahId = await insertWilayah(villageId, parsed);
  await sinkronKepalaDusun(villageId, wilayahId, parsed);
}

/**
 * Ubah dusun/RW/RT, kepala, dan urutan sebuah wilayah.
 *
 * Isian sama dengan form tambah sehingga penomoran yang salah dapat diperbaiki.
 * Rename induk merambat ke turunannya dalam satu transaksi; bila hasilnya
 * bertabrakan dengan baris lain, tidak ada yang ditulis.
 */
export async function ubahWilayah(id: number, input: unknown) {
  const user = await requirePermission("wilayah", "update");
  const villageId = await resolveVillageId(user);
  const parsed = validasi(ubahWilayahSchema, input);
  const baris = await findWilayahById(villageId, id);
  if (!baris) throw notFound("Wilayah tidak ditemukan pada desa aktif.");

  const { patches, bentrok } = rencanaUbahWilayah(await listWilayahOptions(villageId), id, {
    dusun: parsed.dusun,
    rw: parsed.rw,
    rt: parsed.rt,
  });
  if (bentrok) throw conflict("Kombinasi dusun/RW/RT sudah dipakai wilayah lain.");
  if (patches.length) await terapkanGantiNama(villageId, patches);

  const kepala = await kepalaDariInput(villageId, parsed);
  await updateWilayah(villageId, id, {
    dusun: parsed.dusun,
    rw: parsed.rw,
    rt: parsed.rt,
    kepala,
    kepalaResidentId: parsed.kepalaResidentId,
    urut: parsed.urut,
  });
  await sinkronKepalaDusun(villageId, id, { ...parsed, kepala });
}

/** Simpan titik kantor, zoom, dan tipe peta. */
export async function simpanPetaKantor(id: number, input: unknown) {
  const user = await requirePermission("wilayah", "update");
  const villageId = await resolveVillageId(user);
  const parsed = validasi(petaKantorSchema, input);
  if (!(await findWilayahById(villageId, id)))
    throw notFound("Wilayah tidak ditemukan pada desa aktif.");
  await updateKantorWilayah(villageId, id, parsed);
}

/** Simpan batas wilayah (Polygon/MultiPolygon) beserta warnanya. */
export async function simpanBatasWilayah(id: number, input: unknown) {
  const user = await requirePermission("wilayah", "update");
  const villageId = await resolveVillageId(user);
  const parsed = validasi(batasWilayahSchema, input);
  if (!(await findWilayahById(villageId, id)))
    throw notFound("Wilayah tidak ditemukan pada desa aktif.");
  await updateBatasWilayah(villageId, id, parsed);
}

/**
 * Menghapus wilayah hanya bila tidak ada data yang bergantung padanya.
 *
 * Larangan ini menggantikan perilaku lama yang mengosongkan `region_id`
 * penduduk/keluarga secara diam-diam saat wilayah dihapus.
 */
export async function hapusWilayah(id: number) {
  const user = await requirePermission("wilayah", "delete");
  const villageId = await resolveVillageId(user);
  const wilayah = await findWilayahById(villageId, id);
  if (!wilayah) throw notFound("Wilayah tidak ditemukan pada desa aktif.");

  const turunan = wilayahDiBawah(await listWilayahOptions(villageId), id);
  if (turunan.length)
    throw conflict(
      `Wilayah masih memiliki ${turunan.length} wilayah di bawahnya. Hapus RW/RT terlebih dahulu.`,
    );

  const pemakai = await hitungPemakaiWilayah(villageId, id);
  if (pemakai.penduduk || pemakai.keluarga || pemakai.rumahTangga) {
    const bagian = [
      pemakai.penduduk ? `${pemakai.penduduk} penduduk` : null,
      pemakai.keluarga ? `${pemakai.keluarga} keluarga` : null,
      pemakai.rumahTangga ? `${pemakai.rumahTangga} rumah tangga` : null,
    ]
      .filter(Boolean)
      .join(", ");
    throw conflict(
      `Wilayah masih dipakai ${bagian}. Pindahkan data tersebut ke wilayah lain terlebih dahulu.`,
    );
  }
  await deleteWilayah(villageId, id);
  // Wilayah hilang: lepaskan tautan aparat agar tidak menunjuk baris yang mati.
  await sinkronkanKepalaDusun({
    villageId,
    wilayahId: id,
    dusun: "",
    kepalaResidentId: null,
    namaKepala: null,
    kepalaDusun: false,
  });
}

/** Menggeser urutan wilayah satu langkah pada tingkat yang sama. */
export async function geserUrutanWilayah(id: number, arah: "naik" | "turun") {
  const user = await requirePermission("wilayah", "update");
  const villageId = await resolveVillageId(user);
  await tukarUrutanWilayah(villageId, id, arah);
}
