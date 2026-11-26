"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  hapusJenisSuratData,
  hapusKlasifikasiSuratData,
  hapusSyaratSuratData,
  simpanJenisSuratData,
  simpanKlasifikasiSuratData,
  simpanSyaratSuratData,
} from "@/features/pelayanan-persuratan/surat/application/jenis-surat-use-cases";
import { normalisasiLampiran } from "@/features/pelayanan-persuratan/surat/domain/surat";

function ambilBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}
function ambilAngka(formData: FormData, key: string, fallback = 0) {
  const value = String(formData.get(key) ?? "");
  return value.trim() === "" ? fallback : Number(value);
}
function ambilString(formData: FormData, key: string, fallback = "") {
  return String(formData.get(key) ?? fallback);
}
/** Lampiran ditulis satu per baris di form, disimpan sebagai JSON array. */
function ambilLampiran(formData: FormData) {
  const baris = String(formData.get("lampiran") ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  return JSON.stringify(normalisasiLampiran(baris));
}
function ambilInput(formData: FormData) {
  return {
    code: ambilString(formData, "code"),
    name: ambilString(formData, "name"),
    classificationId: ambilString(formData, "classificationId", "none"),
    templateBody: ambilString(formData, "templateBody"),
    templateBodyAlt: ambilString(formData, "templateBodyAlt"),
    formIsian: ambilString(formData, "formIsian", "[]"),
    syaratSurat: JSON.stringify(
      formData
        .getAll("syaratSurat")
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
    lampiran: ambilLampiran(formData),
    requiresResident: ambilBoolean(formData, "requiresResident"),
    isActive: ambilBoolean(formData, "isActive"),
    mandiri: ambilBoolean(formData, "mandiri"),
    numberFormat: ambilString(formData, "numberFormat"),
    validityMonths: ambilAngka(formData, "validityMonths", 1),
    sortOrder: ambilAngka(formData, "sortOrder", 0),
    templateVariant: ambilString(formData, "templateVariant", "default"),
    satuanMasaBerlaku: ambilString(formData, "satuanMasaBerlaku", "M"),
    formatNomorGlobal: formData.get("formatNomorGlobal") === "1",
    orientasi: ambilString(formData, "orientasi", "potrait"),
    ukuran: ambilString(formData, "ukuran", "F4"),
    header: ambilAngka(formData, "header", 1),
    footer: formData.get("footer") === "1",
    marginGlobal: formData.get("marginGlobal") === "1",
    marginKiri: ambilAngka(formData, "marginKiri", 3),
    marginAtas: ambilAngka(formData, "marginAtas", 2),
    marginKanan: ambilAngka(formData, "marginKanan", 2),
    marginBawah: ambilAngka(formData, "marginBawah", 2.5),
    qrCode: ambilBoolean(formData, "qrCode"),
    qrCodeTte: ambilBoolean(formData, "qrCodeTte"),
    logoGaruda: ambilBoolean(formData, "logoGaruda"),
    kecamatan: ambilBoolean(formData, "kecamatan"),
    sumberPendudukBerulang: ambilBoolean(formData, "sumberPendudukBerulang"),
  };
}
export async function simpanJenisSuratAction(formData: FormData) {
  const rawId = String(formData.get("id") ?? "");
  const id = rawId ? Number(rawId) : null;
  if (id !== null && (!Number.isSafeInteger(id) || id < 1))
    throw new Error("ID jenis surat tidak valid.");
  const savedId = await simpanJenisSuratData(id, ambilInput(formData));
  revalidatePath("/layanan-surat/persuratan/jenis-surat");
  revalidatePath("/layanan-surat/persuratan/surat/baru");
  redirect(`/layanan-surat/persuratan/jenis-surat/${savedId}/edit?berhasil=disimpan`);
}
export async function hapusJenisSuratAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("ID jenis surat tidak valid.");
  await hapusJenisSuratData(id);
  revalidatePath("/layanan-surat/persuratan/jenis-surat");
  redirect("/layanan-surat/persuratan/jenis-surat?berhasil=dihapus");
}

function idOpsional(formData: FormData): number | null {
  const raw = String(formData.get("id") ?? "");
  if (!raw) return null;
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("ID tidak valid.");
  return id;
}
export async function simpanKlasifikasiSuratAction(formData: FormData) {
  const id = await simpanKlasifikasiSuratData(idOpsional(formData), {
    code: ambilString(formData, "code"),
    name: ambilString(formData, "name"),
    description: ambilString(formData, "description"),
    // Form lama tanpa checkbox status dianggap tetap aktif.
    isActive: formData.has("isActive") ? formData.get("isActive") === "on" : true,
  });
  revalidatePath("/layanan-surat/persuratan/master");
  revalidatePath("/layanan-surat/persuratan/jenis-surat");
  redirect(`/layanan-surat/persuratan/master?berhasil=klasifikasi-${id}`);
}
export async function hapusKlasifikasiSuratAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("ID klasifikasi tidak valid.");
  await hapusKlasifikasiSuratData(id);
  revalidatePath("/layanan-surat/persuratan/master");
  revalidatePath("/layanan-surat/persuratan/jenis-surat");
  redirect("/layanan-surat/persuratan/master?berhasil=klasifikasi-dihapus");
}
export async function simpanSyaratSuratAction(formData: FormData) {
  const id = await simpanSyaratSuratData(idOpsional(formData), {
    name: ambilString(formData, "name"),
    description: ambilString(formData, "description"),
    sortOrder: ambilAngka(formData, "sortOrder", 0),
    isActive: ambilBoolean(formData, "isActive"),
  });
  revalidatePath("/layanan-surat/persuratan/master");
  revalidatePath("/layanan-surat/persuratan/jenis-surat");
  redirect(`/layanan-surat/persuratan/master?berhasil=syarat-${id}`);
}
export async function hapusSyaratSuratAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("ID persyaratan tidak valid.");
  await hapusSyaratSuratData(id);
  revalidatePath("/layanan-surat/persuratan/master");
  revalidatePath("/layanan-surat/persuratan/jenis-surat");
  redirect("/layanan-surat/persuratan/master?berhasil=syarat-dihapus");
}
