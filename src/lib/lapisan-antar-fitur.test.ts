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

/** Jalur pemilik berkas: segmen antara `features/` dan `application/` (path penuh). */
function fiturPemilik(relatif: string): string[] {
  const segmen = relatif.split("/");
  const mulai = segmen.indexOf("features") + 1;
  const akhir = segmen.lastIndexOf("application");
  return segmen.slice(mulai, akhir);
}

/** Path pemilik penuh, mis. `pengaturan/pengguna`; pembanding harus penuh. */
function pemilikPenuh(sumber: string): string {
  return fiturPemilik(sumber).join("/");
}

/**
 * Pemilik sumber dari specifier impor: segmen antara `features/` dan
 * `infrastructure/`. Bila impor berbentuk `@/features/<…>/infrastructure/…`,
 * seluruh segmen sebelum `infrastructure` adalah path pemilik sumber.
 */
function pemilikSumberDariSpecifier(awalan: string): string {
  return awalan;
}

/**
 * Aturan milik bersama: sebuah impor infrastructure adalah milik sendiri bila
 * path sumbernya persis sama dengan path pemilik berkas — bukan sekadar nama
 * segmen terakhir. Ini menutup lubang nama bertabrakan (`pengaturan/pengguna`
 * vs `pengaturan/pengaturan`) yang lolos karena guard hanya membandingkan
 * nama fitur terakhir.
 */
function milikSendiri(sumber: string, awalan: string): boolean {
  const sumberPenuh = pemilikSumberDariSpecifier(awalan);
  if (!sumberPenuh) return false;
  if (sumberPenuh === pemilikPenuh(sumber)) return true;
  return false;
}

/** Impor `infrastructure` fitur lain yang bukan modul shared. */
function imporLintasFitur(relatif: string, isi: string): string[] {
  const hasil: string[] = [];

  for (const baris of isi.split("\n")) {
    if (!baris.includes("from ")) continue;
    const cocok = POLA_IMPOR_INFRA_FITUR.exec(baris);
    if (!cocok) continue;
    const spesifikasi = /["']([^"']+)["']/.exec(baris)?.[1];
    const awalan = cocok[1];
    if (!spesifikasi || !awalan) continue;

    // Fitur sumber adalah path penuh sebelum `/infrastructure/`.
    // Baris yang bertabrakan nama segmen terakhir tidak dianggap milik sendiri.
    const fiturSumber = pemilikSumberDariSpecifier(awalan);
    const namaSumber = fiturSumber.split("/").at(-1);
    if (!namaSumber || FITUR_SHARED.has(namaSumber) || milikSendiri(relatif, awalan)) continue;
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

  it("mendeteksi impor antar-sibling dengan nama yang bertabrakan", () => {
    // `pengaturan/pengguna` mengimpor infrastructure `pengaturan/pengaturan`:
    // nama segmen terakhir keduanya rapor berbeda — pengguna vs pengaturan —
    // tetapi kasus sebenarnya yang berbahaya adalah ketika segmen terakhir
    // sumber sama dengan segmen pemilik di path lain, mis. pemilik
    // `info-desa/publik` mengimpor `pengaturan/pengaturan/infrastructure`
    // yang segmen terakhirnya sama dengan segmen pemilik `beranda/pengaturan`.
    const pemilikBertabrakan = "src/features/beranda/pengaturan/application/minta.ts";
    const isiBertabrakan =
      'import { x } from "@/features/pengaturan/pengaturan/infrastructure/repo";';
    expect(imporLintasFitur(pemilikBertabrakan, isiBertabrakan)).toEqual([
      "@/features/pengaturan/pengaturan/infrastructure/repo",
    ]);
  });

  it("tidak menandai impor infrastructure milik sendiri (path penuh sama)", () => {
    const pemilikSendiri = "src/features/pengaturan/pengaturan/application/use-cases.ts";
    const isiSendiri = 'import { x } from "@/features/pengaturan/pengaturan/infrastructure/repo";';
    expect(imporLintasFitur(pemilikSendiri, isiSendiri)).toEqual([]);
  });

  it("tidak menandai impor dari modul shared", () => {
    const pemilik = "src/features/program-data-desa/bantuan/application/use-cases.ts";
    const isi = 'import { x } from "@/features/media/infrastructure/storage";';
    expect(imporLintasFitur(pemilik, isi)).toEqual([]);
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
