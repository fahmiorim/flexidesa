import "server-only";

import { request } from "node:https";

import { AppError } from "@/lib/errors";

/** Host API dibatasi agar parameter kode desa tidak dapat mengubah tujuan. */
const HOST = "idm.kemendesa.go.id";
const BASE_URL = `https://${HOST}/open/api/desa/rumusan`;
const BATAS_RESPONS = 5 * 1024 * 1024;

export interface RingkasanSinkronIdm {
  skorMinimal: number | null;
  targetStatus: string | null;
  statusApi: string | null;
  skorApi: number | null;
  penambahan: number | null;
}

export interface IndikatorSinkronIdm {
  kode: string;
  nama: string;
  /** Skor 0–100 agar sesuai dengan skema indikator FlexiDesa. */
  skor: number;
  kategori: string | null;
  keterangan: string | null;
}

export interface HasilSinkronIdm {
  ringkasan: RingkasanSinkronIdm;
  indikator: IndikatorSinkronIdm[];
}

const DIMENSI = ["IKS", "IKE", "IKL"] as const;
const PREFIX = ["I", "II", "III"] as const;

function teks(nilai: unknown): string | null {
  if (typeof nilai !== "string") return null;
  const bersih = nilai.replace(/\s+/g, " ").trim();
  return bersih || null;
}

function angka(nilai: unknown): number | null {
  const hasil =
    typeof nilai === "number"
      ? nilai
      : typeof nilai === "string" && nilai.trim()
        ? Number(nilai)
        : Number.NaN;
  return Number.isFinite(hasil) ? hasil : null;
}

/**
 * Petakan respons `mapData` API Kemendesa ke indikator FlexiDesa.
 *
 * API memberi skor indikator 0–5 dan menyisipkan baris ringkasan dimensi
 * (`IKS`, `IKE`, `IKL`) di antara kelompok indikator. Baris ringkasan tidak
 * disimpan sebagai indikator; keberadaannya dipakai untuk memindahkan dimensi.
 * Skor 0–5 dikonversi ke 0–100 karena skema `idm_indikator` FlexiDesa memakai
 * rentang tersebut.
 */
export function parseIdmKemendesa(payload: unknown): HasilSinkronIdm {
  if (!payload || typeof payload !== "object") {
    throw new AppError("INTERNAL", "Respons API IDM tidak dapat dibaca.");
  }

  const mapData = (payload as { mapData?: unknown }).mapData;
  if (!mapData || typeof mapData !== "object") {
    throw new AppError("INTERNAL", "Respons API IDM tidak memuat data desa.");
  }

  const summaries = (mapData as { SUMMARIES?: unknown }).SUMMARIES;
  const rows = (mapData as { ROW?: unknown }).ROW;
  if (!summaries || typeof summaries !== "object" || !Array.isArray(rows)) {
    throw new AppError("INTERNAL", "Struktur data IDM dari API tidak dikenali.");
  }

  const nilai = summaries as Record<string, unknown>;
  const ringkasan: RingkasanSinkronIdm = {
    skorMinimal: angka(nilai.SKOR_MINIMAL),
    targetStatus: teks(nilai.TARGET_STATUS),
    statusApi: teks(nilai.STATUS),
    skorApi: angka(nilai.SKOR_SAAT_INI),
    penambahan: angka(nilai.PENAMBAHAN),
  };

  const indikator: IndikatorSinkronIdm[] = [];
  let dimensi = 0;

  for (const baris of rows) {
    if (!baris || typeof baris !== "object") continue;
    const data = baris as Record<string, unknown>;
    const nama = teks(data.INDIKATOR);

    if (data.NO === null || data.NO === undefined) {
      const label = nama?.toUpperCase() ?? "";
      if (label.startsWith("IKS")) dimensi = 1;
      else if (label.startsWith("IKE")) dimensi = 2;
      else if (label.startsWith("IKL")) dimensi = 3;
      continue;
    }

    if (dimensi >= DIMENSI.length || !nama) continue;
    const nomor = angka(data.NO);
    const skorApi = angka(data.SKOR);
    if (nomor === null || skorApi === null) continue;

    indikator.push({
      kode: `${PREFIX[dimensi]}.${Math.trunc(nomor)}`,
      nama,
      skor: Math.round(Math.max(0, Math.min(5, skorApi)) * 20),
      kategori: DIMENSI[dimensi] ?? null,
      keterangan: teks(data.KETERANGAN),
    });
  }

  if (!indikator.length) {
    throw new AppError("INTERNAL", "API IDM tidak mengembalikan indikator untuk tahun tersebut.");
  }

  return { ringkasan, indikator };
}

/** Ambil pesan kesalahan yang dikirim API agar tidak hanya menampilkan status HTTP. */
function pesanKesalahanApi(body: string): string | null {
  try {
    const data = JSON.parse(body) as { message?: unknown };
    return typeof data.message === "string" && data.message.trim() ? data.message.trim() : null;
  } catch {
    return null;
  }
}

function unduhJson(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = request(
      url,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent": "FlexiDesa/IDM-Sync",
        },
        // Sertifikat API Kemendesa sudah kedaluwarsa. OpenSID juga menonaktifkan
        // verifikasi untuk endpoint ini. Host tetap dikunci ke domain resmi.
        rejectUnauthorized: false,
        timeout: 20_000,
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk: string) => {
          body += chunk;
          if (body.length > BATAS_RESPONS) {
            req.destroy(new Error("Respons API IDM terlalu besar."));
          }
        });
        res.on("end", () => {
          if (res.statusCode !== 200) {
            const pesanApi = pesanKesalahanApi(body);
            const detail = pesanApi ? `: ${pesanApi}` : ".";
            const saran =
              res.statusCode === 400
                ? " Periksa kode desa dan tahun; data IDM untuk tahun tersebut mungkin belum tersedia."
                : "";
            reject(
              new AppError(
                "INTERNAL",
                `Server IDM Kemendesa membalas dengan status ${res.statusCode}${detail}${saran}`,
              ),
            );
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(
              new AppError("INTERNAL", "Respons API IDM bukan JSON yang valid.", { cause: error }),
            );
          }
        });
        res.on("error", reject);
      },
    );

    req.on("timeout", () => req.destroy(new Error("Waktu permintaan API IDM habis.")));
    req.on("error", (error) => {
      reject(
        new AppError("INTERNAL", "Tidak dapat terhubung ke server IDM Kemendesa.", {
          cause: error,
        }),
      );
    });
    req.end();
  });
}

/** Ambil dan normalisasi data IDM Kemendesa untuk satu kode desa dan tahun. */
export async function ambilIdmKemendesa(kodeDesa: string, tahun: number): Promise<HasilSinkronIdm> {
  const kode = kodeDesa.trim();
  if (!kode) {
    throw new AppError("VALIDATION", "Kode desa belum diisi pada Identitas Desa.");
  }
  if (!Number.isInteger(tahun) || tahun < 2000 || tahun > 2100) {
    throw new AppError("VALIDATION", "Tahun IDM tidak valid.");
  }

  const url = `${BASE_URL}/${encodeURIComponent(kode)}/${tahun}`;
  try {
    return parseIdmKemendesa(await unduhJson(url));
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("INTERNAL", "Gagal mengambil data IDM dari Kemendesa.", { cause: error });
  }
}
