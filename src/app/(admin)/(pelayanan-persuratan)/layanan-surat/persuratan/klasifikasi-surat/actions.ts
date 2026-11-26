"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  hapusKlasifikasiSuratData,
  simpanKlasifikasiSuratData,
} from "@/features/pelayanan-persuratan/surat/application/jenis-surat-use-cases";

const RUTE = "/layanan-surat/persuratan/klasifikasi-surat";

function teks(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function idOpsional(formData: FormData): number | null {
  const id = Number(formData.get("id"));
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** Simpan klasifikasi: tanpa `id` menambah, dengan `id` mengubah. */
export async function simpanKlasifikasiSuratAction(formData: FormData) {
  const id = await simpanKlasifikasiSuratData(idOpsional(formData), {
    code: teks(formData, "code"),
    name: teks(formData, "name"),
    description: teks(formData, "description"),
    isActive: formData.has("isActive") ? formData.get("isActive") === "on" : true,
  });

  revalidatePath(RUTE);
  revalidatePath("/layanan-surat/persuratan/master");
  revalidatePath("/layanan-surat/persuratan/jenis-surat");
  redirect(`${RUTE}?berhasil=${id}`);
}

export async function hapusKlasifikasiSuratAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("ID klasifikasi tidak valid.");

  await hapusKlasifikasiSuratData(id);

  revalidatePath(RUTE);
  revalidatePath("/layanan-surat/persuratan/master");
  revalidatePath("/layanan-surat/persuratan/jenis-surat");
  redirect(`${RUTE}?berhasil=dihapus`);
}
