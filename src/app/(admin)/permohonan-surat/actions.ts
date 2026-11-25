"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  buatKonsepSuratPermohonanData,
  hapusPermohonanAdminData,
  hapusPermohonanMassalData,
  ubahStatusPermohonanData,
} from "@/features/layanan-mandiri/application/admin-use-cases";

function idDariForm(formData: FormData): number {
  const value = Number(formData.get("id"));
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error("ID permohonan tidak valid.");
  }
  return value;
}

export async function mulaiPemeriksaanPermohonanAction(formData: FormData) {
  const id = idDariForm(formData);
  await ubahStatusPermohonanData(id, 1);
  revalidatePath("/permohonan-surat");
  revalidatePath(`/permohonan-surat/${id}`);
  redirect(`/permohonan-surat/${id}?berhasil=diperiksa`);
}

export async function kembalikanPermohonanAction(formData: FormData) {
  const id = idDariForm(formData);
  const alasan = String(formData.get("alasan") ?? "").trim();
  await ubahStatusPermohonanData(id, 0, alasan);
  revalidatePath("/permohonan-surat");
  revalidatePath(`/permohonan-surat/${id}`);
  redirect(`/permohonan-surat/${id}?berhasil=dikembalikan`);
}

export async function batalkanPermohonanAction(formData: FormData) {
  const id = idDariForm(formData);
  const alasan = String(formData.get("alasan") ?? "").trim();
  await ubahStatusPermohonanData(id, 5, alasan);
  revalidatePath("/permohonan-surat");
  revalidatePath(`/permohonan-surat/${id}`);
  redirect(`/permohonan-surat/${id}?berhasil=dibatalkan`);
}

export async function tandaiPermohonanDiambilAction(formData: FormData) {
  const id = idDariForm(formData);
  await ubahStatusPermohonanData(id, 4);
  revalidatePath("/permohonan-surat");
  revalidatePath(`/permohonan-surat/${id}`);
  redirect(`/permohonan-surat/${id}?berhasil=diambil`);
}

export async function tandaiSiapDiambilAction(formData: FormData) {
  const id = idDariForm(formData);
  await ubahStatusPermohonanData(id, 3);
  revalidatePath("/permohonan-surat");
  revalidatePath(`/permohonan-surat/${id}`);
  redirect(`/permohonan-surat/${id}?berhasil=siap`);
}

export async function hapusPermohonanAction(formData: FormData) {
  const id = idDariForm(formData);
  await hapusPermohonanAdminData(id);
  revalidatePath("/permohonan-surat");
  redirect("/permohonan-surat?berhasil=dihapus");
}

export async function hapusPermohonanMassalAction(formData: FormData) {
  const ids = formData
    .getAll("idCb")
    .map((nilai) => Number(nilai))
    .filter((id) => Number.isSafeInteger(id) && id > 0);

  if (ids.length === 0) redirect("/permohonan-surat?berhasil=kosong");

  const { jumlah } = await hapusPermohonanMassalData(ids);
  revalidatePath("/permohonan-surat");
  redirect(`/permohonan-surat?berhasil=dihapus&jumlah=${jumlah}`);
}

export async function buatKonsepSuratPermohonanAction(formData: FormData) {
  const id = idDariForm(formData);
  await buatKonsepSuratPermohonanData(id);
  revalidatePath("/permohonan-surat");
  revalidatePath(`/permohonan-surat/${id}`);
  revalidatePath("/persuratan/surat");
  redirect(`/permohonan-surat/${id}?berhasil=konsep`);
}
