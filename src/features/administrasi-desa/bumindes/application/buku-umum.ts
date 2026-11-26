import "server-only";

/**
 * Use case buku administrasi umum dan mutasi penduduk.
 *
 * Mencakup katalog buku inti, item buku, sinkronisasi buku dari data penduduk,
 * serta cetak/ekspor buku mutasi penduduk. Izin ditegakkan di sini (bukan di
 * halaman) dan desa diambil dari sesi via `resolveVillageId`.
 */

import {
  bukuResmiCsv,
  namaBerkasBuku,
  tabelItemBuku,
  tabelMutasiPenduduk,
} from "@/features/administrasi-desa/bumindes/domain/buku-resmi";
import {
  KETERANGAN_SINKRONISASI_PENDUDUK,
  nomorUrutBerikutnya,
  type ItemBukuInput,
} from "@/features/administrasi-desa/bumindes/domain/bumindes";
import {
  ambilDataSinkronisasiPenduduk,
  deleteBumindesItem,
  ensureBumindesBuku,
  getBumindesBuku,
  getBumindesItem,
  insertBumindesItem,
  listBumindesBuku,
  listBumindesItem,
  nomorUrutTerpakai,
  updateBumindesItem,
} from "@/features/administrasi-desa/bumindes/infrastructure/bumindes-repository";
import { getIdentitasByVillage } from "@/features/info-desa/desa/application/get-identitas";
import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { requirePermission } from "@/lib/dal";
import { conflict, notFound } from "@/lib/errors";

export async function getDaftarBukuData() {
  const user = await requirePermission(RESOURCES.bumindes, "read");
  const villageId = await resolveVillageId(user);
  return ensureBumindesBuku(villageId);
}

/** Detail satu buku beserta itemnya.
 *
 * Mengembalikan `null` bila buku tidak ada di desa sesi, agar halaman dapat
 * memanggil `notFound()` sesuai konvensi Next.
 */

export async function getBukuDetailData(bukuId: number) {
  const user = await requirePermission(RESOURCES.bumindes, "read");
  const villageId = await resolveVillageId(user);

  const buku = await getBumindesBuku(villageId, bukuId);
  if (!buku) return null;

  const items = await listBumindesItem(villageId, bukuId);
  return { buku, items, nomorUrutBerikutnya: nomorUrutBerikutnya(items) };
}

/** Data keluaran resmi (cetak) satu buku generik: buku, identitas desa, tabel. */

export async function getBukuCetakData(bukuId: number) {
  const user = await requirePermission(RESOURCES.bumindes, "read");
  const villageId = await resolveVillageId(user);

  const buku = await getBumindesBuku(villageId, bukuId);
  if (!buku) return null;

  const items = await listBumindesItem(villageId, bukuId);
  const desa = await getIdentitasByVillage(villageId);
  return { buku, desa, tabel: tabelItemBuku(buku.kodeBuku, buku.namaBuku, items) };
}

/** CSV satu buku generik; `null` bila buku tidak ada di desa sesi. */

export async function exportBukuCsvData(
  bukuId: number,
): Promise<{ csv: string; filename: string } | null> {
  const user = await requirePermission(RESOURCES.bumindes, "read");
  const villageId = await resolveVillageId(user);

  const buku = await getBumindesBuku(villageId, bukuId);
  if (!buku) return null;

  const items = await listBumindesItem(villageId, bukuId);
  const desa = await getIdentitasByVillage(villageId);
  const tabel = tabelItemBuku(buku.kodeBuku, buku.namaBuku, items);
  return {
    csv: bukuResmiCsv(tabel),
    filename: namaBerkasBuku(buku.kodeBuku, desa?.namaDesa ?? null),
  };
}

/** Simpan item buku (tambah bila `id` kosong, ubah bila ada).
 *
 * Nomor urut harus unik per buku. Pemeriksaan dilakukan di server tepat sebelum
 * menulis; database belum memasang indeks unik karena data lama mungkin sudah
 * berisi nomor ganda (dibuat sebelum aturan ini ada).
 */

export async function simpanItemBukuData(
  id: number | null,
  input: ItemBukuInput,
): Promise<{ id: number; bukuId: number }> {
  const user = await requirePermission(RESOURCES.bumindes, id === null ? "create" : "update");
  const villageId = await resolveVillageId(user);

  // Pada pengubahan, buku mengikuti item tersimpan — bukan nilai form.
  const existing = id === null ? null : await getBumindesItem(villageId, id);
  if (id !== null && !existing) throw notFound("Item buku tidak ditemukan.");

  const bukuId = existing?.bukuId ?? input.bukuId;
  const buku = await getBumindesBuku(villageId, bukuId);
  if (!buku) throw notFound("Buku administrasi tidak ditemukan.");

  if (await nomorUrutTerpakai(villageId, bukuId, input.nomorUrut, id)) {
    throw conflict(`Nomor urut ${input.nomorUrut} sudah dipakai pada buku ini.`);
  }

  const values = {
    nomorUrut: input.nomorUrut,
    tanggal: input.tanggal,
    uraian: input.uraian,
    keterangan: input.keterangan?.trim() ? input.keterangan.trim() : null,
  };

  if (existing) {
    await updateBumindesItem(villageId, existing.id, values);
    return { id: existing.id, bukuId };
  }

  const baru = await insertBumindesItem(villageId, { bukuId, ...values });
  return { id: baru, bukuId };
}

/** Hapus item buku milik desa sesi; mengembalikan buku asalnya. */

export async function hapusItemBukuData(id: number): Promise<{ bukuId: number }> {
  const user = await requirePermission(RESOURCES.bumindes, "delete");
  const villageId = await resolveVillageId(user);

  const existing = await getBumindesItem(villageId, id);
  if (!existing) throw notFound("Item buku tidak ditemukan.");

  await deleteBumindesItem(villageId, id);
  return { bukuId: existing.bukuId };
}

/** Sinkronisasi ringkasan buku inti (B1-B5) dari data penduduk.
 *
 * Ringkasan disimpan sebagai satu item bertanda `KETERANGAN_SINKRONISASI_PENDUDUK`.
 * Item itu diperbarui pada sinkronisasi berikutnya; catatan manual pada buku
 * yang sama tidak disentuh. Buku kosong mendapat item baru, sehingga tombol ini
 * benar-benar mengisi buku — bukan hanya memperbarui item yang sudah ada.
 */

export async function sinkronisasiBumindesDariPenduduk(): Promise<{
  sukses: boolean;
  pesan: string;
  detail: Record<string, number>;
}> {
  const user = await requirePermission(RESOURCES.bumindes, "create");
  const villageId = await resolveVillageId(user);

  const [data, daftarBuku] = await Promise.all([
    ambilDataSinkronisasiPenduduk(villageId),
    listBumindesBuku(villageId),
  ]);
  const allResidents = data.penduduk;
  const allMutations = data.mutasi;

  const bukuMap = new Map(daftarBuku.map((buku) => [buku.kodeBuku, buku.id]));
  const detail: Record<string, number> = {};
  const mutasi = { birth: 0, death: 0, move_out: 0, move_in: 0, missing: 0, change: 0 };
  for (const row of allMutations) mutasi[row.type]++;

  let lakiLaki = 0;
  let perempuan = 0;
  let permanent = 0;
  let temporary = 0;
  let withKtp = 0;
  let withKk = 0;
  let tanpaKk = 0;
  let total = 0;

  for (const resident of allResidents) {
    if (resident.lifeStatus !== "alive") continue;
    total++;
    if (resident.gender === "male") lakiLaki++;
    else perempuan++;
    if (resident.residenceStatus === "temporary") temporary++;
    else permanent++;
    if (resident.nationalId) withKtp++;
    if (resident.familyId) withKk++;
    else tanpaKk++;
  }

  const sinkronisasi = [
    {
      kode: "B1",
      uraian: `Total ${total} orang: ${lakiLaki} laki-laki, ${perempuan} perempuan.`,
      jumlah: total,
    },
    {
      kode: "B2",
      uraian: `${withKtp} penduduk punya KTP, ${withKk} KK terdaftar, ${tanpaKk} tanpa KK.`,
      jumlah: withKtp,
    },
    {
      kode: "B3",
      uraian: `${mutasi.birth} lahir, ${mutasi.death} mati, ${mutasi.move_out} pindah keluar, ${mutasi.move_in} datang, ${mutasi.change} perubahan data.`,
      jumlah: allMutations.length,
    },
    {
      kode: "B4",
      uraian: `Total ${total} orang: ${lakiLaki} laki-laki, ${perempuan} perempuan, ${permanent} tetap, ${temporary} sementara.`,
      jumlah: total,
    },
    {
      kode: "B5",
      uraian: `${temporary} penduduk sementara dari total ${total} orang.`,
      jumlah: temporary,
    },
  ];

  const tanggal = new Date().toISOString().slice(0, 10);
  let jumlahBuku = 0;

  for (const ringkasan of sinkronisasi) {
    const bukuId = bukuMap.get(ringkasan.kode);
    if (bukuId === undefined) continue;

    const items = await listBumindesItem(villageId, bukuId);
    const existing = items.find((item) => item.keterangan === KETERANGAN_SINKRONISASI_PENDUDUK);

    if (existing) {
      await updateBumindesItem(villageId, existing.id, {
        uraian: ringkasan.uraian,
        tanggal,
        nomorUrut: existing.nomorUrut,
        keterangan: KETERANGAN_SINKRONISASI_PENDUDUK,
      });
    } else {
      const nomorUrut = Math.max(0, ...items.map((item) => item.nomorUrut)) + 1;
      await insertBumindesItem(villageId, {
        bukuId,
        nomorUrut,
        tanggal,
        uraian: ringkasan.uraian,
        keterangan: KETERANGAN_SINKRONISASI_PENDUDUK,
      });
    }

    detail[ringkasan.kode] = ringkasan.jumlah;
    jumlahBuku++;
  }

  return {
    sukses: jumlahBuku > 0,
    pesan: `Sinkronisasi selesai untuk ${jumlahBuku} buku`,
    detail,
  };
}

export async function getBukuMutasiPendudukCetakData() {
  const user = await requirePermission(RESOURCES.bumindes, "read");
  const villageId = await resolveVillageId(user);
  // Ambil data dari modul penduduk/mutasi jika tersedia; fallback ringkas dari items B3
  const buku = await getBumindesBuku(
    villageId,
    (await ensureBumindesBuku(villageId)).find((b) => b.kodeBuku === "B3")?.id ?? 0,
  );
  const desa = await getIdentitasByVillage(villageId);
  if (!buku) {
    return { desa, tabel: tabelMutasiPenduduk("B3", "BUKU DATA MUTASI PENDUDUK", []) };
  }
  const items = await listBumindesItem(villageId, buku.id);
  const baris = items.map((item, idx) => ({
    nomorUrut: item.nomorUrut || idx + 1,
    tanggal: item.tanggal,
    jenisMutasi: item.uraian,
    keterangan: item.keterangan,
  }));
  return { desa, tabel: tabelMutasiPenduduk("B3", "BUKU DATA MUTASI PENDUDUK", baris) };
}

export async function exportBukuMutasiPendudukCsvData() {
  const user = await requirePermission(RESOURCES.bumindes, "read");
  const villageId = await resolveVillageId(user);
  const daftar = await ensureBumindesBuku(villageId);
  const buku = daftar.find((b) => b.kodeBuku === "B3");
  const desa = await getIdentitasByVillage(villageId);
  if (!buku) {
    const tabel = tabelMutasiPenduduk("B3", "BUKU DATA MUTASI PENDUDUK", []);
    return { csv: bukuResmiCsv(tabel), filename: namaBerkasBuku("B3", desa?.namaDesa ?? null) };
  }
  const items = await listBumindesItem(villageId, buku.id);
  const baris = items.map((item, idx) => ({
    nomorUrut: item.nomorUrut || idx + 1,
    tanggal: item.tanggal,
    jenisMutasi: item.uraian,
    keterangan: item.keterangan,
  }));
  const tabel = tabelMutasiPenduduk("B3", "BUKU DATA MUTASI PENDUDUK", baris);
  return { csv: bukuResmiCsv(tabel), filename: namaBerkasBuku("B3", desa?.namaDesa ?? null) };
}
