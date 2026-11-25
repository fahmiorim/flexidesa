/**
 * Impor pengelompokan data rumah tangga dari berkas (paritas OpenSID).
 *
 * Berkas berisi satu baris per penduduk: NIK, nomor RTM, dan tingkat hubungan
 * (1 = kepala rumah tangga, 2 = anggota). Penduduk yang NIK-nya dikenal akan
 * ditautkan ke RTM dengan nomor tersebut; nomor RTM yang belum ada akan dibuat
 * baru. Seluruh pencocokan di berkas ini murni (tanpa `db`) agar mudah diuji.
 */

import { templateCsv, type KolomImpor } from "@/lib/spreadsheet";

/** Kunci kolom impor RTM. */
export type KunciImporRtm = "nik" | "nomorRtm" | "level";

/** Definisi kolom impor RTM (header mengikuti format impor OpenSID). */
export const KOLOM_IMPOR_RTM: readonly KolomImpor<KunciImporRtm>[] = [
  {
    kunci: "nik",
    label: "NIK",
    alias: ["nomor induk kependudukan"],
    wajib: true,
  },
  {
    kunci: "nomorRtm",
    label: "No. RTM",
    alias: ["nomor rtm", "no rtm", "nomor rumah tangga"],
    wajib: true,
  },
  {
    kunci: "level",
    label: "Level",
    alias: ["hubungan rtm", "tingkat hubungan", "kode hubungan"],
    wajib: true,
  },
];

/** Satu baris impor RTM yang siap diproses. */
export interface SiapImporRtm {
  residentId: number;
  nik: string;
  nomorRtm: string;
  level: 1 | 2;
}

/** Penduduk desa yang dapat dicocokkan dari berkas (berkunci NIK). */
export interface PendudukImporRtm {
  id: number;
  nik: string;
  nama: string;
}

/** Hasil rencana impor: baris siap, galat per baris, dan RTM baru yang dibuat. */
export interface RencanaImporRtm {
  siap: SiapImporRtm[];
  galat: Array<{ baris: number; pesan: string }>;
  /** Nomor RTM pada berkas yang belum ada di desa (akan dibuat baru). */
  rtmBaru: string[];
}

/** Normalisasi nomor RTM: tanpa spasi, huruf kapital. */
export function normalisasiNomorRtm(nomor: string): string {
  return nomor.trim().replace(/\s+/g, "").toUpperCase();
}

/**
 * Susun rencana impor RTM dari baris berkas yang sudah dipetakan.
 *
 * Aturan (paritas OpenSID):
 * - NIK wajib 16 angka dan harus dikenal di desa ini;
 * - nomor RTM wajib diisi;
 * - level 1 = kepala rumah tangga, level lain yang positif = anggota;
 * - NIK yang sama tidak boleh muncul dua kali pada berkas.
 *
 * Baris bermasalah dilaporkan per baris tanpa menggagalkan baris lain, tetapi
 * pemanggil memutuskan apakah impor dijalankan (UI memakai all-or-nothing).
 */
export function rencanaImporRtm(
  rows: readonly { baris: number; nilai: Record<KunciImporRtm, string> }[],
  penduduk: readonly PendudukImporRtm[],
  nomorRtmExisting: ReadonlySet<string>,
): RencanaImporRtm {
  const petaPenduduk = new Map<string, PendudukImporRtm>();
  for (const item of penduduk) {
    const nik = item.nik.replace(/[^0-9]/g, "");
    if (nik !== "" && !petaPenduduk.has(nik)) petaPenduduk.set(nik, item);
  }

  const rencana: RencanaImporRtm = { siap: [], galat: [], rtmBaru: [] };
  const terlihat = new Set<string>();
  const nomorBaru = new Set<string>();

  for (const row of rows) {
    const nik = row.nilai.nik.replace(/[^0-9]/g, "");
    const nomorRtm = normalisasiNomorRtm(row.nilai.nomorRtm);
    const levelMentah = Number(row.nilai.level);

    if (nik === "") {
      rencana.galat.push({ baris: row.baris, pesan: "NIK tidak boleh kosong." });
      continue;
    }
    if (!/^[0-9]{16}$/.test(nik)) {
      rencana.galat.push({ baris: row.baris, pesan: `NIK ${nik} tidak valid (harus 16 angka).` });
      continue;
    }
    if (terlihat.has(nik)) {
      rencana.galat.push({
        baris: row.baris,
        pesan: `NIK ${nik} muncul lebih dari sekali pada berkas.`,
      });
      continue;
    }
    terlihat.add(nik);

    if (nomorRtm === "") {
      rencana.galat.push({ baris: row.baris, pesan: "Nomor Rumah Tangga tidak boleh kosong." });
      continue;
    }
    if (!Number.isInteger(levelMentah) || levelMentah <= 0) {
      rencana.galat.push({
        baris: row.baris,
        pesan: "Kode Hubungan Rumah Tangga tidak diketahui (1 = kepala, 2 = anggota).",
      });
      continue;
    }

    const target = petaPenduduk.get(nik);
    if (!target) {
      rencana.galat.push({
        baris: row.baris,
        pesan: `Data penduduk dengan NIK ${nik} tidak ditemukan.`,
      });
      continue;
    }

    rencana.siap.push({
      residentId: target.id,
      nik,
      nomorRtm,
      level: levelMentah === 1 ? 1 : 2,
    });

    if (!nomorRtmExisting.has(nomorRtm) && !nomorBaru.has(nomorRtm)) {
      nomorBaru.add(nomorRtm);
      rencana.rtmBaru.push(nomorRtm);
    }
  }

  return rencana;
}

/** Template CSV impor RTM untuk diunduh sebelum diisi. */
export function templateImporRtm(): string {
  return templateCsv(KOLOM_IMPOR_RTM, [
    { nik: "3201010101010001", nomorRtm: "RTM-001", level: "1" },
    { nik: "3201010101010002", nomorRtm: "RTM-001", level: "2" },
  ]);
}

/** Nama berkas template impor RTM. */
export function namaBerkasTemplateRtm(): string {
  return "template-impor-rtm.csv";
}
