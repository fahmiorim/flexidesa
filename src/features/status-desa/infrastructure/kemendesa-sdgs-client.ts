import "server-only";

import { request } from "node:https";

import { AppError } from "@/lib/errors";

/** Host API dibatasi agar parameter kode desa tidak dapat mengubah tujuan. */
const HOST = "sid.kemendesa.go.id";
const BASE_URL = `https://${HOST}/sdgs/searching/score-sdgs`;
const BATAS_RESPONS = 2 * 1024 * 1024;

export interface SkorSdgsSinkron {
  goal: number;
  skor: number;
}

export interface HasilSinkronSdgs {
  rataRata: number | null;
  rows: SkorSdgsSinkron[];
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
 * Petakan respons API SDGs Kemendesa ke tujuan 1–18.
 *
 * API mengirim `goals` dan `score` (kadang sebagai string). Skor dibatasi
 * 0–100 dan dibulatkan karena kolom `idm_sdgs.skor` FlexiDesa berupa bilangan
 * bulat. Baris tanpa tujuan valid diabaikan; bila tidak ada satu pun yang
 * valid, payload dianggap rusak agar data lama tidak terhapus.
 */
export function parseSdgsKemendesa(payload: unknown): HasilSinkronSdgs {
  if (!payload || typeof payload !== "object") {
    throw new AppError("INTERNAL", "Respons API SDGs tidak dapat dibaca.");
  }

  const data = (payload as { data?: unknown }).data;
  if (!Array.isArray(data)) {
    throw new AppError("INTERNAL", "Respons API SDGs tidak memuat capaian tujuan.");
  }

  const perGoal = new Map<number, SkorSdgsSinkron>();
  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const baris = item as Record<string, unknown>;
    const goal = angka(baris.goals);
    const skor = angka(baris.score);
    if (goal === null || !Number.isInteger(goal) || goal < 1 || goal > 18) continue;
    if (skor === null) continue;

    perGoal.set(goal, {
      goal,
      skor: Math.round(Math.min(100, Math.max(0, skor))),
    });
  }

  if (!perGoal.size) {
    throw new AppError("INTERNAL", "API SDGs tidak mengembalikan capaian tujuan yang valid.");
  }

  return {
    rataRata: angka((payload as { average?: unknown }).average),
    rows: [...perGoal.values()].sort((a, b) => a.goal - b.goal),
  };
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
          "User-Agent": "FlexiDesa/SDGs-Sync",
        },
        // Sertifikat API Kemendesa dapat kedaluwarsa; host tetap dikunci ke
        // domain resmi seperti integrasi IDM dan OpenSID.
        rejectUnauthorized: false,
        timeout: 20_000,
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk: string) => {
          body += chunk;
          if (body.length > BATAS_RESPONS) {
            req.destroy(new Error("Respons API SDGs terlalu besar."));
          }
        });
        res.on("end", () => {
          if (res.statusCode !== 200) {
            const pesanApi = pesanKesalahanApi(body);
            const detail = pesanApi ? `: ${pesanApi}` : ".";
            reject(
              new AppError(
                "INTERNAL",
                `Server SDGs Kemendesa membalas dengan status ${res.statusCode}${detail}`,
              ),
            );
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(
              new AppError("INTERNAL", "Respons API SDGs bukan JSON yang valid.", { cause: error }),
            );
          }
        });
        res.on("error", reject);
      },
    );

    req.on("timeout", () => req.destroy(new Error("Waktu permintaan API SDGs habis.")));
    req.on("error", (error) => {
      reject(
        new AppError("INTERNAL", "Tidak dapat terhubung ke server SDGs Kemendesa.", {
          cause: error,
        }),
      );
    });
    req.end();
  });
}

/** Ambil dan normalisasi capaian 18 tujuan SDGs untuk satu kode BPS. */
export async function ambilSdgsKemendesa(kodeBps: string): Promise<HasilSinkronSdgs> {
  const kode = kodeBps.trim();
  if (!/^\d{10}$/.test(kode)) {
    throw new AppError("VALIDATION", "Kode BPS desa belum diisi atau tidak valid.");
  }

  const url = `${BASE_URL}?location_code=${encodeURIComponent(kode)}`;
  try {
    return parseSdgsKemendesa(await unduhJson(url));
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("INTERNAL", "Gagal mengambil data SDGs dari Kemendesa.", { cause: error });
  }
}
