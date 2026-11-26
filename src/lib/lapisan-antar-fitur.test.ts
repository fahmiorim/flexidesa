import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guard batas impor antarfitur untuk lapisan application.
 *
 * Lapisan `application` sebuah subfitur boleh memanggil repository miliknya
 * sendiri. Memanggil `infrastructure` milik **subfitur lain** — termasuk yang
 * masih satu grup sidebar — melubangi kepemilikan data: perubahan tabel/izin di
 * fitur sumber menjalar tanpa terlihat. Karena itu pemanggilan lintas subfitur
 * harus lewat kontrak `application` fitur sumber.
 *
 * Modul shared (`media`, `auth`, `navigation`, `notifikasi`, `warga`, …) memang
 * dipakai lintas grup, jadi impornya wajar. Daftar `UTANG_LINTAS_FITUR`
 * menampung pelanggaran warisan yang belum diperbaiki: nilainya hanya boleh
 * menyusut — test memastikan tidak ada entri yang sudah tidak dipakai. Daftar
 * itu kosong sejak semua pemanggil dipindah ke berkas `application/kontrak.ts`
 * milik fitur sumber.
 */
const AKAR_FITUR = path.join(process.cwd(), "src", "features");

/** Modul tingkat atas yang memang dipakai lintas grup sidebar. */
const FITUR_SHARED = new Set([
  "api-eksternal",
  "api-publik",
  "auth",
  "kebijakan-berkas",
  "media",
  "multi-desa",
  "navigation",
  "notifikasi",
  "rate-limit",
  "warga",
]);

/** Awalan paket fitur sumber: `@/features/<grup?>/<fitur>/infrastructure/…`. */
const POLA_IMPOR_INFRA_FITUR = /@\/features\/([^"']+)\/infrastructure\//;

/** Pelanggaran yang diwarisi dari kode lama; hapus entri saat jalurnya diperbaiki. */
const UTANG_LINTAS_FITUR: Record<string, string[]> = {};

function daftarBerkasApplication(direktori: string): string[] {
  return readdirSync(direktori, { withFileTypes: true }).flatMap((entri) => {
    const penuh = path.join(direktori, entri.name);
    if (entri.isDirectory()) return daftarBerkasApplication(penuh);
    if (!/\.(ts|tsx)$/.test(entri.name) || /\.test\.tsx?$/.test(entri.name)) return [];
    if (!penuh.replaceAll("\\", "/").includes("/application/")) return [];
    return [penuh];
  });
}

/** Nama subfitur pemilik berkas: segmen antara `features/` dan `application/`. */
function fiturPemilik(relatif: string): string[] {
  const segmen = relatif.split("/");
  const mulai = segmen.indexOf("features") + 1;
  const akhir = segmen.lastIndexOf("application");
  return segmen.slice(mulai, akhir);
}

/** Impor `infrastructure` fitur lain yang bukan modul shared. */
function imporLintasFitur(relatif: string, isi: string): string[] {
  const pemilik = fiturPemilik(relatif);
  const hasil: string[] = [];

  for (const baris of isi.split("\n")) {
    if (!baris.includes("from ")) continue;
    const cocok = POLA_IMPOR_INFRA_FITUR.exec(baris);
    if (!cocok) continue;
    const spesifikasi = /["']([^"']+)["']/.exec(baris)?.[1];
    const awalan = cocok[1];
    if (!spesifikasi || !awalan) continue;

    // Fitur sumber adalah segmen terakhir sebelum `/infrastructure/`.
    const fiturSumber = awalan.split("/").at(-1);
    if (!fiturSumber || FITUR_SHARED.has(fiturSumber) || pemilik.includes(fiturSumber)) continue;
    hasil.push(spesifikasi);
  }

  return hasil;
}

const BERKAS_APPLICATION = daftarBerkasApplication(AKAR_FITUR);
const relatif = (berkas: string) => path.relative(process.cwd(), berkas).replaceAll("\\", "/");

const PELANGGARAN_AKTUAL = new Map<string, string[]>();
for (const berkas of BERKAS_APPLICATION) {
  const jalur = relatif(berkas);
  const impor = imporLintasFitur(jalur, readFileSync(berkas, "utf8"));
  if (impor.length > 0) PELANGGARAN_AKTUAL.set(jalur, impor);
}

describe("batas impor antarfitur lapisan application", () => {
  it("menelusuri use case seluruh fitur", () => {
    expect(BERKAS_APPLICATION.length).toBeGreaterThan(100);
  });

  it("tidak menambah impor infrastruktur milik fitur lain", () => {
    const baru: string[] = [];

    for (const [berkas, impor] of PELANGGARAN_AKTUAL) {
      const diizinkan = UTANG_LINTAS_FITUR[berkas] ?? [];
      for (const spesifikasi of impor) {
        if (!diizinkan.includes(spesifikasi)) baru.push(`${berkas} -> ${spesifikasi}`);
      }
    }

    expect(baru).toEqual([]);
  });

  it("tidak menyimpan entri utang yang sudah tidak dipakai", () => {
    const basi = Object.entries(UTANG_LINTAS_FITUR).flatMap(([berkas, impor]) =>
      impor
        .filter((spesifikasi) => !(PELANGGARAN_AKTUAL.get(berkas) ?? []).includes(spesifikasi))
        .map((spesifikasi) => `${berkas} -> ${spesifikasi}`),
    );

    expect(basi).toEqual([]);
  });
});
