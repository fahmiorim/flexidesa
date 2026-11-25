"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  hapusSyaratSuratData,
  simpanSyaratSuratData,
} from "@/features/surat/application/jenis-surat-use-cases";

const RUTE = "/persuratan/syarat-surat";

function teks(formData: FormData, key: string, fallback = "") {
  return String(formData.get(key) ?? fallback);
}

function idOpsional(formData: FormData): number | null {
  const id = Number(formData.get("id"));
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** Isi daftar persyaratan: tanpa `id` menambah, dengan `id` mengubah. */
export async function simpanSyaratSuratAction(formData: FormData) {
  const id = await simpanSyaratSuratData(idOpsional(formData), {
    name: teks(formData, "name"),
    description: teks(formData, "description"),
    sortOrder: Number(teks(formData, "sortOrder", "0")) || 0,
    isActive: formData.get("isActive") === "on",
  });

  revalidatePath(RUTE);
  revalidatePath("/persuratan/jenis-surat");
  revalidatePath("/persuratan/master");
  redirect(`${RUTE}?berhasil=${id}`);
}

export async function hapusSyaratSuratAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("ID persyaratan tidak valid.");

  await hapusSyaratSuratData(id);

  revalidatePath(RUTE);
  revalidatePath("/persuratan/jenis-surat");
  revalidatePath("/persuratan/master");
  redirect(`${RUTE}?berhasil=dihapus`);
}
