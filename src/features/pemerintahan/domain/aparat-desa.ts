import { validationError } from "@/lib/errors";

/**
 * Aturan domain Pemerintah Desa.
 *
 * Acuan perilaku: jabatan struktural tidak boleh ganda, penandatangan surat
 * dibagi menjadi Kepala Desa, "a.n" (Sekretaris Desa), dan "u.b" (pejabat lain),
 * serta bagan organisasi disusun dari relasi atasan langsung.
 *
 * Fungsi di sini murni (tanpa akses database) agar aturan bisnis bisa diuji
 * tanpa koneksi MySQL; pemanggilan data tetap dilakukan di application layer.
 */

export const JENIS_JABATAN = ["kades", "sekdes", "lainnya"] as const;
export type JenisJabatan = (typeof JENIS_JABATAN)[number];

export const LABEL_JENIS_JABATAN: Record<JenisJabatan, string> = {
  kades: "Kepala Desa",
  sekdes: "Sekretaris Desa",
  lainnya: "Jabatan lain",
};

export type PejabatRingkas = {
  id: number;
  nama: string;
  jenis: string;
  status: string;
  ttdAn: boolean;
  ttdUb: boolean;
  statusPejabat: boolean;
};

export type PejabatInput = {
  jenis: string;
  status: string;
  ttdAn: boolean;
  ttdUb: boolean;
  statusPejabat: boolean;
};

/**
 * Menentukan urutan aparat seperti OpenSID: Kepala Desa 1, Sekretaris Desa 2,
 * dan aparat baru lainnya memperoleh nomor setelah urutan terakhir.
 */
export function hitungUrutPerangkat(input: {
  jenis: string;
  id: number | null;
  urut: number;
  urutTerakhir: number;
}): number {
  if (input.jenis === "kades") return 1;
  if (input.jenis === "sekdes") return 2;
  if (input.id === null && input.urut <= 0) return input.urutTerakhir + 1;
  return input.urut;
}

export function isJenisJabatan(value: string): value is JenisJabatan {
  return (JENIS_JABATAN as readonly string[]).includes(value);
}

/**
 * Menormalkan flag penandatangan sesuai jenis jabatan.
 *
 * Flag yang tidak berlaku dimatikan agar data tersimpan konsisten meskipun
 * dikirim dari form lama atau permintaan manual.
 */
export function normalisasiFlagPejabat(input: PejabatInput): PejabatInput {
  const jenis = isJenisJabatan(input.jenis) ? input.jenis : "lainnya";
  const aktif = input.status === "aktif";
  return {
    jenis,
    status: aktif ? "aktif" : "nonaktif",
    statusPejabat: jenis === "kades" && aktif ? input.statusPejabat : false,
    // "a.n" adalah kewenangan Sekretaris Desa; "u.b" untuk pejabat lain.
    ttdAn: jenis === "sekdes" && aktif ? input.ttdAn : false,
    ttdUb: jenis === "lainnya" && aktif ? input.ttdUb : false,
  };
}

/**
 * Memeriksa aturan pejabat struktural terhadap aparat lain pada desa yang sama.
 *
 * `lain` harus berisi aparat lain (tanpa baris yang sedang disimpan) sehingga
 * pemeriksaan tetap benar saat menambah maupun mengubah data.
 */
export function validasiPejabatStruktural(
  input: PejabatInput,
  lain: readonly PejabatRingkas[],
): void {
  const { jenis, status, ttdAn, ttdUb } = normalisasiFlagPejabat(input);
  if (status !== "aktif") return;

  if (jenis === "kades") {
    const kades = lain.find((row) => row.jenis === "kades" && row.status === "aktif");
    if (kades) throw validationError(`Kepala Desa aktif sudah ada (${kades.nama}).`);
  }

  if (jenis === "sekdes") {
    const sekdes = lain.find((row) => row.jenis === "sekdes" && row.status === "aktif");
    if (sekdes) throw validationError(`Sekretaris Desa aktif sudah ada (${sekdes.nama}).`);
  }

  if (ttdAn) {
    const an = lain.find((row) => row.ttdAn && row.status === "aktif");
    if (an) throw validationError(`Penandatangan atas nama (a.n) sudah dipegang ${an.nama}.`);
  }

  if (ttdUb) {
    const ub = lain.find((row) => row.ttdUb && row.status === "aktif");
    if (ub) throw validationError(`Penandatangan untuk beliau (u.b) sudah dipegang ${ub.nama}.`);
  }
}

export type SimpulBagan = {
  id: number;
  nama: string;
  jabatan: string | null;
  jenis: string;
  statusPejabat: boolean;
  tingkat: number | null;
  offset: string | null;
  layout: string | null;
  warna: string | null;
  atasanId: number | null;
  urut: number;
};

export type BaganNode = SimpulBagan & { anak: BaganNode[] };

export const SIMPUL_BPD: BaganNode = {
  id: -1,
  nama: "Badan Permusyawaratan Desa",
  jabatan: "BPD",
  jenis: "bpd",
  statusPejabat: false,
  tingkat: null,
  offset: null,
  layout: null,
  warna: "#F1F5F9",
  atasanId: null,
  urut: Number.MAX_SAFE_INTEGER,
  anak: [],
};

/**
 * Menyusun bagan organisasi dari relasi `atasanId`.
 *
 * Aparat yang atasannya tidak ada (atau relasinya melingkar) diperlakukan
 * sebagai akar agar tidak ada aparat yang hilang dari bagan. Bila `denganBpd`
 * aktif, BPD ditempatkan sebagai akar terakhir — setara dengan pilihan
 * "Bagan dengan BPD" pada acuan.
 */
export function susunBagan(
  rows: readonly SimpulBagan[],
  options: { denganBpd?: boolean } = {},
): BaganNode[] {
  const nodes = new Map<number, BaganNode>();
  for (const row of rows) nodes.set(row.id, { ...row, anak: [] });

  const akar: BaganNode[] = [];
  for (const node of nodes.values()) {
    const induk = node.atasanId === null ? undefined : nodes.get(node.atasanId);
    if (!induk || induk.id === node.id) {
      akar.push(node);
      continue;
    }
    // Tolak relasi melingkar: telusuri rantai atasan, bila bertemu diri sendiri
    // jadikan akar supaya bagan tetap bisa dirender.
    let kursor: BaganNode | undefined = induk;
    const dilihat = new Set<number>([node.id]);
    let melingkar = false;
    while (kursor) {
      if (dilihat.has(kursor.id)) {
        melingkar = true;
        break;
      }
      dilihat.add(kursor.id);
      kursor = kursor.atasanId === null ? undefined : nodes.get(kursor.atasanId);
    }
    if (melingkar) akar.push(node);
    else induk.anak.push(node);
  }

  akar.sort((a, b) => a.urut - b.urut || a.id - b.id);
  for (const node of nodes.values()) node.anak.sort((a, b) => a.urut - b.urut || a.id - b.id);
  if (options.denganBpd) akar.push({ ...SIMPUL_BPD, anak: [] });
  return akar;
}
