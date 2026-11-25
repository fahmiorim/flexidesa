import { NextResponse } from "next/server";

import { resolveVillageId } from "@/features/desa/application/resolve-village";
import {
  hapusMediaIdentitas,
  simpanMediaIdentitas,
  type MediaIdentitas,
} from "@/features/identitas-desa/application/identitas-desa-use-cases";
import { terapkanUkuranLogo } from "@/features/identitas-desa/application/transformasi-logo";
import { validasiMediaIdentitas } from "@/features/identitas-desa/application/validasi-media";
import { validasiUkuranLogo } from "@/features/pengaturan/domain/identitas-form";
import { simpanBerkasMedia } from "@/features/publik/application/simpan-berkas-media";
import { requirePermission } from "@/lib/dal";
import { appErrorStatus, isAppError } from "@/lib/errors";

export const runtime = "nodejs";
const response = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
function handle(e: unknown) {
  if (isAppError(e)) return response({ error: e.message }, appErrorStatus(e.code));
  console.error("Unggah identitas desa gagal:", e);
  return response({ error: e instanceof Error ? e.message : "Unggah media gagal." }, 500);
}
export async function POST(request: Request) {
  try {
    const user = await requirePermission("pengaturan-desa", "update"),
      villageId = await resolveVillageId(user),
      form = await request.formData();
    const field = form.get("field"),
      file = form.get("file");
    if (
      field !== "logo" &&
      field !== "foto-kantor" &&
      field !== "struktur-adat" &&
      field !== "dokumen-adat"
    )
      return response({ error: "Jenis media tidak valid." }, 400);
    if (!(file instanceof File) || file.size === 0)
      return response({ error: "Pilih berkas terlebih dahulu." }, 400);
    const cekBerkas = validasiMediaIdentitas(field, file.type, file.size);
    if (!cekBerkas.ok) return response({ error: cekBerkas.pesan }, cekBerkas.status);

    // Opsi dimensi logo (paritas OpenSID) divalidasi ulang di server: nilai di
    // luar 100–400 ditolak sebelum ada berkas yang ditulis, sehingga logo lama
    // tidak tersentuh saat unggahan gagal.
    const ukuranForm = field === "logo" ? form.get("ukuran") : null;
    const ukuranMentah = typeof ukuranForm === "string" ? ukuranForm : null;
    const cekUkuran = validasiUkuranLogo(ukuranMentah);
    if (!cekUkuran.ok) return response({ error: cekUkuran.pesan }, 422);

    const asli = {
      nama: file.name,
      mime: file.type,
      ukuran: file.size,
      isi: new Uint8Array(await file.arrayBuffer()),
    };
    const ditransformasi = await terapkanUkuranLogo(asli.isi, asli.mime, ukuranMentah);
    const path = await simpanBerkasMedia(
      villageId,
      {
        nama: asli.nama,
        mime: ditransformasi.mime,
        ukuran: ditransformasi.isi.byteLength,
        isi: ditransformasi.isi,
      },
      "umum",
      field,
    );
    await simpanMediaIdentitas(villageId, field as MediaIdentitas, path);
    return response({
      message:
        field === "logo"
          ? "Logo desa berhasil diunggah."
          : field === "foto-kantor"
            ? "Foto kantor berhasil diunggah."
            : field === "struktur-adat"
              ? "Struktur adat berhasil diunggah."
              : "Dokumen regulasi adat berhasil diunggah.",
      path,
    });
  } catch (e) {
    return handle(e);
  }
}
export async function DELETE(request: Request) {
  try {
    const user = await requirePermission("pengaturan-desa", "update"),
      villageId = await resolveVillageId(user),
      field = new URL(request.url).searchParams.get("field");
    if (
      field !== "logo" &&
      field !== "foto-kantor" &&
      field !== "struktur-adat" &&
      field !== "dokumen-adat"
    )
      return response({ error: "Jenis media tidak valid." }, 400);
    await hapusMediaIdentitas(villageId, field);
    return response({ message: "Media identitas berhasil dihapus." });
  } catch (e) {
    return handle(e);
  }
}
