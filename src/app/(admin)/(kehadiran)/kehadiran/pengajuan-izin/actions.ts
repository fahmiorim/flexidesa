"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { simpanBerkasMedia } from "@/features/info-desa/publik/application/simpan-berkas-media";
import { hapusBerkasKepegawaian } from "@/features/kehadiran/kepegawaian/application/pegawai";
import {
  ajukanPengajuanIzin,
  batalkanPengajuanIzin,
} from "@/features/kehadiran/kepegawaian/application/pengajuan-izin-use-cases";
import { requireUser } from "@/lib/dal";

const RUTE_PENGAJUAN = "/kehadiran/pengajuan-izin";
const RUTE_PERSETUJUAN = "/kehadiran/persetujuan-izin";

const MIME_LAMPIRAN = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAKS_LAMPIRAN_BYTE = 10 * 1024 * 1024;

function teks(formData: FormData, kunci: string): string {
  const nilai = formData.get(kunci);
  return typeof nilai === "string" ? nilai.trim() : "";
}

function idPositif(nilai: FormDataEntryValue | null): number | null {
  const id = Number(nilai);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function segarkan() {
  revalidatePath(RUTE_PENGAJUAN);
  revalidatePath(RUTE_PERSETUJUAN);
}

/** Simpan pengajuan baru beserta lampiran opsional (wajib untuk jenis sakit). */
export async function ajukanPengajuanIzinAction(formData: FormData): Promise<void> {
  let lampiran: string | null = null;
  const file = formData.get("lampiran");

  if (file instanceof File && file.size > 0) {
    if (!MIME_LAMPIRAN.includes(file.type))
      throw new Error("Lampiran harus berupa PDF, JPG, PNG, atau WEBP.");
    if (file.size > MAKS_LAMPIRAN_BYTE) throw new Error("Ukuran lampiran maksimal 10 MB.");

    const user = await requireUser();
    const villageId = await resolveVillageId(user);
    lampiran = await simpanBerkasMedia(
      villageId,
      {
        nama: file.name,
        mime: file.type,
        ukuran: file.size,
        isi: new Uint8Array(await file.arrayBuffer()),
      },
      "kehadiran",
      "lampiran",
    );
  }

  try {
    await ajukanPengajuanIzin({
      pegawaiId: idPositif(formData.get("pegawaiId")) ?? undefined,
      jenis: teks(formData, "jenis"),
      mulai: teks(formData, "mulai"),
      selesai: teks(formData, "selesai"),
      keterangan: teks(formData, "keterangan"),
      lampiran,
    });
  } catch (error) {
    if (lampiran) await hapusBerkasKepegawaian(lampiran);
    throw error;
  }

  segarkan();
  redirect(`${RUTE_PENGAJUAN}?status=diajukan`);
}

/** Batalkan pengajuan sendiri yang masih menunggu keputusan. */
export async function batalkanPengajuanIzinAction(formData: FormData): Promise<void> {
  const id = idPositif(formData.get("id"));
  if (id === null) throw new Error("ID pengajuan tidak valid.");

  await batalkanPengajuanIzin(id);

  segarkan();
  redirect(`${RUTE_PENGAJUAN}?status=dibatalkan`);
}
