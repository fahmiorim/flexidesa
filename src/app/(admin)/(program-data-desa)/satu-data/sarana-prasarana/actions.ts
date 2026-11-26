"use server";

import { revalidatePath } from "next/cache";

import { SARANA_KATEGORI } from "@/db/schema";
import {
  hapusSaranaAdmin,
  simpanSaranaAdmin,
} from "@/features/info-desa/publik/application/konten-admin";

const categories = new Set<string>(SARANA_KATEGORI);
function value(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}
function refresh() {
  revalidatePath("/satu-data/sarana-prasarana");
  revalidatePath("/profil");
}

export async function simpanSarana(form: FormData) {
  const id = Number(value(form, "id") || 0);
  const kategori = value(form, "kategori");
  const nama = value(form, "nama").slice(0, 200);
  if (!categories.has(kategori) || !nama)
    throw new Error("Kategori dan nama sarana/prasarana wajib diisi dengan benar.");
  await simpanSaranaAdmin({
    id,
    kategori,
    nama,
    lokasi: value(form, "lokasi").slice(0, 200) || null,
    keterangan: value(form, "keterangan").slice(0, 5000) || null,
    aktif: value(form, "aktif") === "on",
  });
  refresh();
}

export async function hapusSarana(form: FormData) {
  const id = Number(value(form, "id"));
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("ID sarana/prasarana tidak valid.");
  await hapusSaranaAdmin(id);
  refresh();
}
