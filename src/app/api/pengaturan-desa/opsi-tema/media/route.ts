import { NextResponse } from "next/server";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import {
  hapusOpsiTemaMedia,
  simpanOpsiTemaMedia,
} from "@/features/pengaturan/pengaturan/application/pengaturan-desa-use-cases";
import { requirePermission } from "@/lib/dal";
import { appErrorStatus, isAppError } from "@/lib/errors";

export const runtime = "nodejs";

/**
 * Aset opsi tema bertipe `unggah` (mis. `foto_tidak_tersedia`).
 *
 * Bukan unggah source paket: hanya media tenant yang tervalidasi MIME/ukuran,
 * disimpan di ruang `village_id` pemanggil, dan referensinya dicatat pada
 * `theme.opsi.templateOptions`.
 */
const response = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });

function handle(e: unknown) {
  if (isAppError(e)) return response({ error: e.message }, appErrorStatus(e.code));
  console.error("Opsi media tema gagal diproses:", e);
  return response(
    { error: e instanceof Error ? e.message : "Opsi media tema gagal diproses." },
    500,
  );
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission("pengaturan-desa", "update");
    const villageId = await resolveVillageId(user);
    const form = await request.formData();
    const key = form.get("key");
    const file = form.get("file");
    if (typeof key !== "string" || !/^[a-z0-9_]{2,40}$/.test(key)) {
      return response({ error: "Kunci opsi media tidak valid." }, 400);
    }
    if (!(file instanceof File) || file.size === 0) {
      return response({ error: "Pilih berkas gambar terlebih dahulu." }, 400);
    }
    if (file.size > 2 * 1024 * 1024) {
      return response({ error: "Gambar opsi tema maksimal 2 MB." }, 413);
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return response({ error: "Gambar opsi tema harus JPG, PNG, atau WEBP." }, 422);
    }
    const { path } = await simpanOpsiTemaMedia(villageId, key, file);
    return response({ message: "Gambar opsi tema berhasil diunggah.", path });
  } catch (e) {
    return handle(e);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requirePermission("pengaturan-desa", "update");
    const villageId = await resolveVillageId(user);
    const key = new URL(request.url).searchParams.get("key");
    if (!key || !/^[a-z0-9_]{2,40}$/.test(key)) {
      return response({ error: "Kunci opsi media tidak valid." }, 400);
    }
    await hapusOpsiTemaMedia(villageId, key);
    return response({ message: "Gambar opsi tema berhasil dihapus." });
  } catch (e) {
    return handle(e);
  }
}
