import "server-only";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { getIdentitasDesaUseCase } from "@/features/info-desa/desa/application/use-cases";
import { listWilayahOptions } from "@/features/info-desa/wilayah/application/kontrak";
import {
  buildKelompokRentanCsv,
  jumlahkanKelompokRentan,
  type BarisKelompokRentan,
} from "@/features/kependudukan/statistik/domain/kelompok-rentan";
import { listKelompokRentan } from "@/features/kependudukan/statistik/infrastructure/kelompok-rentan-repository";
import { buildKelompokRentanXlsx } from "@/features/kependudukan/statistik/infrastructure/kelompok-rentan-xlsx";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { requirePermission } from "@/lib/dal";

/** Slug modul sekaligus resource izin (lihat template tenant). */
export const LAPORAN_KELOMPOK_RENTAN_RESOURCE = RESOURCES.laporanKelompokRentan;

export interface LaporanKelompokRentanData {
  rows: BarisKelompokRentan[];
  total: BarisKelompokRentan;
  dusunOptions: string[];
  /** Dusun yang benar-benar dipakai; `null` berarti seluruh desa. */
  dusun: string | null;
  namaDesa: string | null;
  namaKecamatan: string | null;
  namaKabupaten: string | null;
}

function unikTerurut(nilai: (string | null)[]): string[] {
  return [...new Set(nilai.filter((item): item is string => item !== null && item !== ""))].sort(
    (a, b) => a.localeCompare(b, "id", { numeric: true }),
  );
}

/**
 * Susun laporan untuk desa yang sudah ditentukan.
 *
 * Dipisah dari pemeriksaan sesi agar Route Handler ekspor dapat memakai ulang
 * penyusunan yang sama tanpa melempar galat HTTP dari dalam use case.
 */
export async function susunLaporanKelompokRentan(
  villageId: number,
  dusunParam?: string | null,
): Promise<LaporanKelompokRentanData> {
  const wilayah = await listWilayahOptions(villageId);
  const dusunOptions = unikTerurut(wilayah.map((row) => row.dusun));

  // Dusun dari query string hanya dipakai bila memang ada di desa ini.
  const diminta = dusunParam?.trim() ?? "";
  const dusun = diminta !== "" && dusunOptions.includes(diminta) ? diminta : null;

  const [rows, identitas] = await Promise.all([
    listKelompokRentan(villageId, dusun),
    getIdentitasDesaUseCase(villageId),
  ]);

  // RT tanpa penduduk tidak ditampilkan, sama seperti OpenSID; nilainya memang
  // nol sehingga tidak mengubah total.
  const terisi = rows.filter((baris) => baris.total > 0);

  return {
    rows: terisi,
    total: jumlahkanKelompokRentan(terisi),
    dusunOptions,
    dusun,
    namaDesa: identitas?.namaDesa ?? null,
    namaKecamatan: identitas?.namaKecamatan ?? null,
    namaKabupaten: identitas?.namaKabupaten ?? null,
  };
}

/** Laporan kelompok rentan untuk pengguna yang boleh membaca modul ini. */
export async function getLaporanKelompokRentanData(
  dusunParam?: string | null,
): Promise<LaporanKelompokRentanData> {
  const user = await requirePermission(LAPORAN_KELOMPOK_RENTAN_RESOURCE, "read");
  const villageId = await resolveVillageId(user);

  return susunLaporanKelompokRentan(villageId, dusunParam);
}

/** Isi berkas ekspor kelompok rentan beserta header HTTP-nya. */
export interface EksporKelompokRentan {
  namaBerkas: string;
  tipeKonten: string;
  isi: string | Uint8Array;
}

/**
 * Susun berkas ekspor (CSV atau XLSX) untuk pengguna yang boleh membaca modul.
 *
 * Route hanya meneruskan hasil ini sebagai respons, sehingga penyusunan laporan
 * dan berkas tetap berada di lapisan aplikasi.
 */
export async function eksporKelompokRentan(
  formatParam?: string | null,
  dusunParam?: string | null,
): Promise<EksporKelompokRentan> {
  const user = await requirePermission(LAPORAN_KELOMPOK_RENTAN_RESOURCE, "read");
  const villageId = await resolveVillageId(user);
  const data = await susunLaporanKelompokRentan(villageId, dusunParam);

  const tanggal = new Date().toISOString().slice(0, 10);

  if (formatParam === "xlsx") {
    const bulan = new Intl.DateTimeFormat("id-ID", { month: "long" }).format(new Date());
    const xlsx = await buildKelompokRentanXlsx({
      rows: data.rows,
      total: data.total,
      kabupaten: data.namaKabupaten ?? "",
      desa: data.namaDesa ?? "",
      kecamatan: data.namaKecamatan ?? "",
      bulan,
      dusun: data.dusun,
    });

    return {
      namaBerkas: `kelompok-rentan_${tanggal}.xlsx`,
      tipeKonten: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      isi: new Uint8Array(xlsx),
    };
  }

  return {
    namaBerkas: `kelompok-rentan_${tanggal}.csv`,
    tipeKonten: "text/csv; charset=utf-8",
    isi: `\uFEFF${buildKelompokRentanCsv({ rows: data.rows, total: data.total })}`,
  };
}
