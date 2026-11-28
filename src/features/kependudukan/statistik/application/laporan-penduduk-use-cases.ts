import "server-only";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import {
  laporanPendudukFormSchema,
  type LaporanPendudukInput,
  type LaporanPendudukRow,
} from "@/features/kependudukan/statistik/domain/laporan-penduduk";
import {
  adaLaporanPendudukSama,
  deleteLaporanPendudukBanyak,
  findLaporanPenduduk,
  insertLaporanPenduduk,
  listLaporanPenduduk,
  listTahunLaporanPenduduk,
  updateLaporanPenduduk,
} from "@/features/kependudukan/statistik/infrastructure/laporan-penduduk-repository";
import {
  bacaBerkasLaporanPenduduk,
  hapusBerkasLaporanPenduduk,
  jalurRelatifLaporanPenduduk,
  simpanBerkasLaporanPenduduk,
} from "@/features/kependudukan/statistik/infrastructure/laporan-penduduk-storage";
import {
  berkasLaporanAman,
  MAKS_UKURAN_BERKAS,
  validasiBerkasLaporan,
} from "@/features/keuangan-desa/keuangan/domain/laporan-dokumen";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { requirePermission } from "@/lib/dal";
import { conflict, notFound, validationError } from "@/lib/errors";

/** Slug modul sekaligus resource izin (lihat template tenant). */
export const LAPORAN_PENDUDUK_RESOURCE = RESOURCES.laporanPenduduk;

/** Data berkas yang sudah dibaca dari `FormData`. */
interface BerkasLaporanPendudukInput {
  nama: string;
  tipe: string;
  isi: Uint8Array;
}

interface LaporanPendudukData {
  tahun: number;
  tahunTersedia: number[];
  rows: LaporanPendudukRow[];
}

function parseMetadata(input: unknown): LaporanPendudukInput {
  const parsed = laporanPendudukFormSchema.safeParse(input);
  if (!parsed.success) {
    throw validationError(parsed.error.issues[0]?.message ?? "Data laporan penduduk tidak valid.");
  }
  return parsed.data;
}

/** Daftar arsip laporan penduduk beserta pilihan tahun. */
export async function getLaporanPendudukData(tahunParam?: number): Promise<LaporanPendudukData> {
  const user = await requirePermission(LAPORAN_PENDUDUK_RESOURCE, "read");
  const villageId = await resolveVillageId(user);

  const tahunTersedia = await listTahunLaporanPenduduk(villageId);
  const tahun =
    tahunParam !== undefined && Number.isInteger(tahunParam)
      ? tahunParam
      : (tahunTersedia[0] ?? new Date().getFullYear());

  const rows = await listLaporanPenduduk(villageId, tahun);
  return { tahun, tahunTersedia, rows };
}

/**
 * Simpan arsip: unggah baru, atau ubah metadata/berkas yang sudah ada.
 *
 * Berkas boleh dikosongkan saat mengubah dokumen (berkas lama
 * dipertahankan), tetapi wajib ada saat menambah.
 */
export async function saveLaporanPenduduk(input: {
  metadata: unknown;
  berkas: BerkasLaporanPendudukInput | null;
  id?: number;
}) {
  const user = await requirePermission(LAPORAN_PENDUDUK_RESOURCE, "update");
  const villageId = await resolveVillageId(user);

  const metadata = parseMetadata(input.metadata);

  if (!input.berkas && input.id === undefined) {
    throw conflict("Berkas laporan wajib dipilih.");
  }

  if (input.berkas) {
    const pesan = validasiBerkasLaporan({
      nama: input.berkas.nama,
      ukuran: input.berkas.isi.byteLength,
      tipe: input.berkas.tipe,
    });
    if (pesan) throw conflict(pesan);
    if (input.berkas.isi.byteLength > MAKS_UKURAN_BERKAS) {
      throw conflict("Ukuran berkas maksimal 8 MB.");
    }
  }

  const kembar = await adaLaporanPendudukSama(villageId, metadata.tahun, metadata.bulan, input.id);
  if (kembar) {
    throw conflict("Laporan untuk bulan dan tahun tersebut sudah ada.");
  }

  const lama = input.id !== undefined ? await findLaporanPenduduk(villageId, input.id) : null;
  if (input.id !== undefined && !lama) {
    throw notFound("Laporan penduduk tidak ditemukan.");
  }

  if (!input.berkas) {
    if (!lama) throw conflict("Berkas laporan wajib dipilih.");
    await updateLaporanPenduduk(villageId, lama.id, {
      judul: metadata.judul,
      tahun: metadata.tahun,
      bulan: metadata.bulan,
    });
    return { id: lama.id };
  }

  const namaAman = berkasLaporanAman(input.berkas.nama);
  const relatif = jalurRelatifLaporanPenduduk(villageId, metadata.tahun, namaAman);
  await simpanBerkasLaporanPenduduk(relatif, input.berkas.isi);

  try {
    if (lama) {
      await updateLaporanPenduduk(villageId, lama.id, {
        judul: metadata.judul,
        tahun: metadata.tahun,
        bulan: metadata.bulan,
        namaFile: input.berkas.nama,
        jalurFile: relatif,
        ukuranFile: input.berkas.isi.byteLength,
      });
      // Berkas lama baru dihapus setelah baris tersimpan.
      if (lama.jalurFile !== relatif) await hapusBerkasLaporanPenduduk(lama.jalurFile);
      return { id: lama.id };
    }

    const id = await insertLaporanPenduduk(villageId, {
      judul: metadata.judul,
      tahun: metadata.tahun,
      bulan: metadata.bulan,
      namaFile: input.berkas.nama,
      jalurFile: relatif,
      ukuranFile: input.berkas.isi.byteLength,
      createdBy: user.id,
    });
    return { id };
  } catch (error) {
    // Baris gagal disimpan → berkas baru tidak ada gunanya.
    await hapusBerkasLaporanPenduduk(relatif);
    throw error;
  }
}

/** Ambil isi berkas untuk diunduh/ditampilkan. */
export async function getBerkasLaporanPenduduk(id: number) {
  const user = await requirePermission(LAPORAN_PENDUDUK_RESOURCE, "read");
  const villageId = await resolveVillageId(user);

  const row = await findLaporanPenduduk(villageId, id);
  if (!row) throw notFound("Laporan penduduk tidak ditemukan.");

  const isi = await bacaBerkasLaporanPenduduk(row.jalurFile);
  return { row, isi };
}

/** Hapus beberapa arsip sekaligus beserta berkasnya (aksi Hapus massal). */
export async function deleteLaporanPendudukBanyakUseCase(ids: number[]) {
  const user = await requirePermission(LAPORAN_PENDUDUK_RESOURCE, "delete");
  const villageId = await resolveVillageId(user);

  const unik = [...new Set(ids)].filter((id) => Number.isInteger(id) && id > 0);
  if (unik.length === 0) throw validationError("Pilih laporan yang akan dihapus.");

  const berkas: string[] = [];
  for (const id of unik) {
    const row = await findLaporanPenduduk(villageId, id);
    if (row) berkas.push(row.jalurFile);
  }

  await deleteLaporanPendudukBanyak(villageId, unik);
  for (const relatif of berkas) await hapusBerkasLaporanPenduduk(relatif);

  return { jumlah: unik.length };
}

/** Hapus satu arsip beserta berkasnya. */
export async function deleteLaporanPendudukUseCase(id: number) {
  return deleteLaporanPendudukBanyakUseCase([id]);
}
