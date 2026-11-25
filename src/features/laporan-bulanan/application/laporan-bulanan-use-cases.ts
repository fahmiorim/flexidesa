import "server-only";

import { getIdentitas } from "@/features/desa/application/get-identitas";
import { resolveVillageId } from "@/features/desa/application/resolve-village";
import {
  labelPeriode,
  normalisasiPeriode,
  rentangPeriode,
  susunBarisLaporan,
  type BarisLaporanBulanan,
  type PeriodeBulanan,
} from "@/features/laporan-bulanan/domain/laporan-bulanan";
import {
  hitungKelompokPada,
  hitungKeluargaBaru,
  hitungMutasiBulan,
} from "@/features/laporan-bulanan/infrastructure/laporan-bulanan-repository";
import { listPerangkat } from "@/features/pemerintahan/infrastructure/pemerintahan-repository";
import { RESOURCES } from "@/features/rbac/domain/resources";
import { requirePermission } from "@/lib/dal";

/** Laporan bulanan lengkap dengan identitas desa untuk kepala laporan. */
export interface LaporanBulanan {
  periode: PeriodeBulanan;
  labelPeriode: string;
  namaDesa: string | null;
  kecamatan: string | null;
  kabupaten: string | null;
  baris: BarisLaporanBulanan[];
}

/**
 * Susun Laporan Kependudukan Bulanan dari data kependudukan desa.
 *
 * Angka "awal" dan "akhir" dihitung langsung pada dua tanggal batas, sedangkan
 * baris peristiwa diambil dari riwayat mutasi bulan tersebut.
 */
export async function getLaporanBulanan(
  tahunParam?: string | null,
  bulanParam?: string | null,
): Promise<LaporanBulanan> {
  const user = await requirePermission(RESOURCES.laporanBulanan, "read");
  const villageId = await resolveVillageId(user);

  const periode = normalisasiPeriode(tahunParam, bulanParam);
  const { mulai, selesai } = rentangPeriode(periode);

  const [awal, akhir, mutasi, keluargaBaru, identitas] = await Promise.all([
    hitungKelompokPada(villageId, mulai),
    hitungKelompokPada(villageId, selesai),
    hitungMutasiBulan(villageId, mulai, selesai),
    hitungKeluargaBaru(villageId, mulai, selesai),
    getIdentitas(),
  ]);

  const baris = susunBarisLaporan({
    awal,
    kelahiran: {
      ...mutasi.kelahiran,
      kkL: keluargaBaru.kkL,
      kkP: keluargaBaru.kkP,
    },
    kematian: mutasi.kematian,
    pendatang: mutasi.pendatang,
    pindah: mutasi.pindah,
    hilang: mutasi.hilang,
    akhir,
  });

  return {
    periode,
    labelPeriode: labelPeriode(periode),
    namaDesa: identitas?.namaDesa ?? null,
    kecamatan: identitas?.namaKecamatan ?? null,
    kabupaten: identitas?.namaKabupaten ?? null,
    baris,
  };
}

/** Pilihan pamong yang dapat menandatangani cetakan laporan. */
export interface PamongPenandaTangan {
  id: number;
  nama: string;
  jabatan: string | null;
  nip: string | null;
  niap: string | null;
  jenisJabatan: string | null;
}

/**
 * Daftar aparat aktif untuk pemilih penanda tangan cetak (paritas dialog cetak
 * OpenSID). Kepala desa dipakai sebagai pilihan awal bila tersedia.
 */
export async function getPamongPenandaTangan(): Promise<PamongPenandaTangan[]> {
  const user = await requirePermission(RESOURCES.laporanBulanan, "read");
  const villageId = await resolveVillageId(user);
  const rows = await listPerangkat(villageId);

  return rows
    .filter((row) => row.status === "aktif")
    .map((row) => ({
      id: row.id,
      nama: [row.gelarDepan, row.nama, row.gelarBelakang].filter(Boolean).join(" "),
      jabatan: row.jabatan,
      nip: row.nip,
      niap: row.niap,
      jenisJabatan: row.jenisJabatan,
    }));
}
