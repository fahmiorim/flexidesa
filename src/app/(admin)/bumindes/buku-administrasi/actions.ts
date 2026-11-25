"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  hapusItemBukuData,
  simpanItemBukuData,
  sinkronisasiBumindesDariPenduduk,
} from "@/features/bumindes/application/use-cases";
import { itemBukuFormSchema } from "@/features/bumindes/domain/bumindes";

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

const positiveId = (value: string) => {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("ID tidak valid.");
  return id;
};

export async function sinkronisasiBukuAction(): Promise<void> {
  const hasil = await sinkronisasiBumindesDariPenduduk();
  revalidatePath("/bumindes/buku-administrasi");
  redirect(`/bumindes/buku-administrasi?sinkron=${hasil.sukses ? "1" : "0"}`);
}

export async function simpanItemBukuAction(formData: FormData): Promise<void> {
  const id = text(formData, "id");
  const parsed = itemBukuFormSchema.parse({
    bukuId: Number(text(formData, "bukuId")),
    nomorUrut: Number(text(formData, "nomorUrut")),
    tanggal: text(formData, "tanggal"),
    uraian: text(formData, "uraian"),
    keterangan: text(formData, "keterangan"),
  });

  const hasil = await simpanItemBukuData(id ? positiveId(id) : null, parsed);
  revalidatePath("/bumindes/buku-administrasi");
  revalidatePath(`/bumindes/buku-administrasi/${hasil.bukuId}`);
  redirect(`/bumindes/buku-administrasi/${hasil.bukuId}?saved=1`);
}

export async function hapusItemBukuAction(formData: FormData): Promise<void> {
  const hasil = await hapusItemBukuData(positiveId(text(formData, "id")));
  revalidatePath("/bumindes/buku-administrasi");
  revalidatePath(`/bumindes/buku-administrasi/${hasil.bukuId}`);
  redirect(`/bumindes/buku-administrasi/${hasil.bukuId}?deleted=1`);
}
