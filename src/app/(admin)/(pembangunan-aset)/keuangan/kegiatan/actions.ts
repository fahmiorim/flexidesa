"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  addDokumentasi,
  createPembangunan,
  deleteDokumentasi,
  deletePembangunan,
  updatePembangunan,
} from "@/features/pembangunan-aset/pembangunan/application/use-cases";
import {
  dokumentasiFormSchema,
  pembangunanFormSchema,
} from "@/features/pembangunan-aset/pembangunan/domain/pembangunan";

/**
 * Server Action kegiatan pembangunan.
 *
 * Dipisahkan dari `keuangan/actions.ts` karena menu Kegiatan & Pembangunan
 * berada di grup Pembangunan & Aset, sedangkan sisa aksi di berkas itu milik
 * APBDes/realisasi/laporan Keuangan Desa. URL tujuan revalidate/redirect tetap
 * `/keuangan/kegiatan`, sesuai menu yang tersimpan per tenant.
 */

function proyekInput(formData: FormData) {
  return pembangunanFormSchema.parse({
    judul: formData.get("judul"),
    deskripsi: formData.get("deskripsi") ?? "",
    lokasi: formData.get("lokasi") ?? "",
    latitude: formData.get("latitude") ?? "",
    longitude: formData.get("longitude") ?? "",
    tahunAnggaran: formData.get("tahunAnggaran"),
    sumberDana: formData.get("sumberDana") ?? "",
    anggaran: formData.get("anggaran") ?? "",
    volume: formData.get("volume") ?? "",
    satuan: formData.get("satuan") ?? "",
    pelaksana: formData.get("pelaksana") ?? "",
    mulai: formData.get("mulai") ?? "",
    selesai: formData.get("selesai") ?? "",
    status: formData.get("status") ?? "rencana",
    progres: formData.get("progres") ?? "0",
    hasil: formData.get("hasil") ?? "",
  });
}

export async function buatKegiatanPembangunanAction(formData: FormData): Promise<void> {
  await createPembangunan(proyekInput(formData));
  revalidatePath("/keuangan");
  revalidatePath("/keuangan/kegiatan");
  revalidatePath("/pembangunan");
  redirect("/keuangan/kegiatan?dibuat=1");
}

export async function ubahKegiatanPembangunanAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id < 1) throw new Error("ID kegiatan tidak valid.");
  await updatePembangunan(id, proyekInput(formData));
  revalidatePath("/keuangan");
  revalidatePath("/keuangan/kegiatan");
  revalidatePath("/keuangan/kegiatan/" + id);
  revalidatePath("/pembangunan");
  redirect("/keuangan/kegiatan/" + id + "?diperbarui=1");
}

export async function hapusKegiatanPembangunanAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id < 1) throw new Error("ID kegiatan tidak valid.");
  await deletePembangunan(id);
  revalidatePath("/keuangan");
  revalidatePath("/keuangan/kegiatan");
  revalidatePath("/pembangunan");
}

export async function tambahDokumentasiKegiatanAction(formData: FormData): Promise<void> {
  const proyekId = Number(formData.get("proyekId"));
  if (!Number.isInteger(proyekId) || proyekId < 1) throw new Error("ID kegiatan tidak valid.");
  const file = formData.get("foto");
  if (!(file instanceof File) || file.size === 0) throw new Error("Pilih foto dokumentasi.");
  const parsed = dokumentasiFormSchema.parse({
    judul: formData.get("judul") ?? "",
    keterangan: formData.get("keterangan") ?? "",
  });
  await addDokumentasi(proyekId, parsed, {
    nama: file.name,
    mime: file.type,
    ukuran: file.size,
    isi: new Uint8Array(await file.arrayBuffer()),
  });
  revalidatePath("/keuangan/kegiatan/" + proyekId);
  revalidatePath("/pembangunan");
  redirect("/keuangan/kegiatan/" + proyekId + "?dokumentasi=1");
}

export async function hapusDokumentasiKegiatanAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const proyekId = Number(formData.get("proyekId"));
  if (!Number.isInteger(id) || id < 1 || !Number.isInteger(proyekId) || proyekId < 1) {
    throw new Error("Data dokumentasi tidak valid.");
  }
  await deleteDokumentasi(id);
  revalidatePath("/keuangan/kegiatan/" + proyekId);
  revalidatePath("/pembangunan");
  redirect("/keuangan/kegiatan/" + proyekId);
}
