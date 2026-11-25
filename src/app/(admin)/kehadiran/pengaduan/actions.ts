"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ubahKeteranganPengaduan } from "@/features/kehadiran/application/pengaduan-kehadiran-use-cases";

const RUTE = "/kehadiran/pengaduan";

/** Simpan keterangan pengaduan kehadiran (satu-satunya field yang dapat diubah). */
export async function ubahPengaduanKehadiranAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id < 1) throw new Error("ID pengaduan tidak valid.");

  await ubahKeteranganPengaduan(id, { keterangan: formData.get("keterangan") ?? "" });

  revalidatePath(RUTE);
  redirect(`${RUTE}?diperbarui=1`);
}
