"use server";

import { revalidatePath } from "next/cache";

import {
  hapusLapak,
  hapusProdukLapak,
  simpanLapakBaru,
  tambahProdukLapak,
  ubahLapak,
  ubahProdukLapak,
} from "@/features/layanan-warga/lapak/application/use-cases";

function value(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function idDari(form: FormData, key: string) {
  const id = Number(value(form, key));
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("ID tidak valid.");
  return id;
}

function refresh(lapakId?: number) {
  revalidatePath("/pelayanan-publik/lapak");
  if (lapakId) revalidatePath(`/pelayanan-publik/lapak/${lapakId}`);
}

export async function simpanLapak(form: FormData) {
  const masukan = {
    nama: value(form, "nama"),
    pemilik: value(form, "pemilik"),
    kategori: value(form, "kategori"),
    alamat: value(form, "alamat"),
    keterangan: value(form, "keterangan"),
  };

  const id = Number(value(form, "id") || 0);
  if (id > 0) {
    await ubahLapak(id, masukan);
    refresh(id);
    return;
  }
  await simpanLapakBaru(masukan);
  refresh();
}

export async function hapusLapakAction(form: FormData) {
  await hapusLapak(idDari(form, "id"));
  refresh();
}

export async function simpanProdukLapakAction(form: FormData) {
  const lapakId = idDari(form, "lapakId");
  const produkId = Number(value(form, "produkId") || 0);
  const masukan = {
    nama: value(form, "nama"),
    deskripsi: value(form, "deskripsi"),
    harga: value(form, "harga"),
    stok: value(form, "stok"),
    gambar: value(form, "gambar"),
    aktif: value(form, "aktif") === "on",
    latitude: value(form, "latitude"),
    longitude: value(form, "longitude"),
  };

  if (produkId > 0) {
    await ubahProdukLapak(lapakId, produkId, masukan);
  } else {
    await tambahProdukLapak(lapakId, masukan);
  }
  refresh(lapakId);
}

export async function hapusProdukLapakAction(form: FormData) {
  const lapakId = idDari(form, "lapakId");
  await hapusProdukLapak(lapakId, idDari(form, "produkId"));
  refresh(lapakId);
}
