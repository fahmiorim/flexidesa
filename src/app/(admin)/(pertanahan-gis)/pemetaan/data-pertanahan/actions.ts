"use server";

import { revalidatePath } from "next/cache";

import {
  createPersil,
  deletePersil,
  updatePersil,
} from "@/features/pertanahan-gis/gis/application/use-cases";
import { persilFormSchema } from "@/features/pertanahan-gis/gis/domain/gis";
import { validationError } from "@/lib/errors";

function value(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function refresh() {
  revalidatePath("/pemetaan/data-pertanahan");
}

export async function simpanPersil(form: FormData) {
  const hasil = persilFormSchema.safeParse({
    nomor: value(form, "nomor"),
    nomorCdesa: value(form, "nomorCdesa") || null,
    luas: value(form, "luas") || "0",
    status: value(form, "status") || null,
    path: value(form, "path") || null,
    keterangan: value(form, "keterangan") || null,
  });
  if (!hasil.success) {
    throw validationError(hasil.error.issues[0]?.message ?? "Data persil tidak valid.");
  }

  const id = Number(value(form, "id") || 0);
  if (id > 0) {
    await updatePersil(id, hasil.data);
  } else {
    await createPersil(hasil.data);
  }
  refresh();
}

export async function hapusPersilAction(form: FormData) {
  const id = Number(value(form, "id"));
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("ID persil tidak valid.");
  await deletePersil(id);
  refresh();
}
