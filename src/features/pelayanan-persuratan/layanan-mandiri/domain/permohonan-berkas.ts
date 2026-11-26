/**
 * Rekap dan ekspor permohonan surat.
 *
 * Fungsi murni: menyaring baris yang sudah dimuat, menghitung rekap per jenis
 * surat, dan menyusun CSV. Otorisasi/tenant tetap di use case.
 */

import { selCsv } from "@/lib/spreadsheet";

import { labelPermohonanStatus, type PermohonanAdminRow } from "./layanan-mandiri";

export interface FilterPermohonan {
  /**
   * Pencarian bebas seperti kotak cari OpenSID: cocok pada nama/NIK pemohon,
   * nomor antrean, nomor HP, nama jenis surat, dan keterangan. Setiap kata
   * harus cocok agar "budi usaha" mempersempit hasil.
   */
  q?: string;
  /** Tanggal awal (YYYY-MM-DD), inklusif. */
  dari?: string;
  /** Tanggal akhir (YYYY-MM-DD), inklusif. */
  sampai?: string;
  typeId?: number;
  /** Satu status, atau beberapa status sekaligus (mis. 1 dan 2 = menunggu tindakan). */
  status?: number | readonly number[];
}

export interface RekapPermohonanJenis {
  jenis: string;
  total: number;
  menunggu: number;
  selesai: number;
  dibatalkan: number;
}

function tanggalBaris(row: PermohonanAdminRow): string | null {
  if (!row.createdAt) return null;
  return row.createdAt.toISOString().slice(0, 10);
}

function kataKunciPermohonan(row: PermohonanAdminRow): string {
  return [
    row.namaPemohon,
    row.nikPemohon,
    row.noAntrian,
    row.noHpAktif,
    row.namaSurat,
    row.keterangan,
    row.letterNumber,
  ]
    .filter((item): item is string => Boolean(item))
    .join(" ")
    .toLowerCase();
}

/** Saring permohonan berdasarkan kata kunci, rentang tanggal, jenis, dan status. */
export function saringPermohonan(
  rows: readonly PermohonanAdminRow[],
  filter: FilterPermohonan,
): PermohonanAdminRow[] {
  const kata = filter.q?.trim().toLowerCase().split(/\s+/).filter(Boolean) ?? [];

  return rows.filter((row) => {
    if (kata.length > 0) {
      const teks = kataKunciPermohonan(row);
      if (!kata.every((potongan) => teks.includes(potongan))) return false;
    }

    if (filter.typeId !== undefined && row.idSurat !== filter.typeId) return false;

    if (filter.status !== undefined) {
      const daftar = typeof filter.status === "number" ? [filter.status] : filter.status;
      if (!daftar.includes(row.status)) return false;
    }

    if (filter.dari || filter.sampai) {
      const tanggal = tanggalBaris(row);
      if (!tanggal) return false;
      if (filter.dari && tanggal < filter.dari) return false;
      if (filter.sampai && tanggal > filter.sampai) return false;
    }

    return true;
  });
}

/** Rekap per jenis surat, diurutkan dari permohonan terbanyak. */
export function ringkasPermohonanPerJenis(
  rows: readonly PermohonanAdminRow[],
): RekapPermohonanJenis[] {
  const peta = new Map<string, RekapPermohonanJenis>();

  for (const row of rows) {
    const jenis = row.namaSurat?.trim() || "Jenis tidak diketahui";
    const rekap = peta.get(jenis) ?? {
      jenis,
      total: 0,
      menunggu: 0,
      selesai: 0,
      dibatalkan: 0,
    };

    rekap.total += 1;
    if (row.status === 3 || row.status === 4) rekap.selesai += 1;
    else if (row.status === 5) rekap.dibatalkan += 1;
    else rekap.menunggu += 1;

    peta.set(jenis, rekap);
  }

  return [...peta.values()].sort((a, b) => b.total - a.total || a.jenis.localeCompare(b.jenis));
}

function slugDesa(namaDesa: string | null): string {
  return (
    (namaDesa ?? "desa")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "desa"
  );
}

export function namaBerkasPermohonan(namaDesa: string | null): string {
  return `rekap-permohonan-surat-${slugDesa(namaDesa)}.csv`;
}

/** CSV rekap permohonan (satu baris per permohonan). */
export function buildPermohonanCsv(input: {
  namaDesa: string | null;
  rows: readonly PermohonanAdminRow[];
  filter?: string | null;
}): string {
  const header = [
    "No",
    "No. Antrian",
    "Tanggal",
    "Pemohon",
    "NIK",
    "Jenis Surat",
    "Status",
    "Nomor Surat",
    "Alasan",
  ];

  const data = input.rows.map((row, index) => [
    String(index + 1),
    row.noAntrian ?? "-",
    tanggalBaris(row) ?? "-",
    row.namaPemohon ?? "-",
    row.nikPemohon ?? "-",
    row.namaSurat ?? "-",
    labelPermohonanStatus(row.status),
    row.letterNumber ?? "-",
    row.alasan ?? "-",
  ]);

  const meta = [
    ["Rekap Permohonan Surat"],
    [input.namaDesa ?? "-"],
    [input.filter && input.filter.trim() !== "" ? `Filter: ${input.filter}` : "Tanpa filter"],
    [`Jumlah: ${input.rows.length}`],
    [],
  ];

  return `\uFEFF${[...meta, header, ...data].map((baris) => baris.map((sel) => selCsv(sel)).join(",")).join("\r\n")}\r\n`;
}
