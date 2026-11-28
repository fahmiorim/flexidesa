"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { addAnggotaGrupUseCase, village } from "@/features/layanan-warga/kontak/application/use-cases";
import { KONTAK_GRUP_RESOURCE } from "@/features/layanan-warga/kontak/domain/kontak";

export async function tambahAnggotaGrupAction(formData: FormData) {
  const grupId = Number(formData.get("grupId"));
  if (!Number.isSafeInteger(grupId) || grupId <= 0) throw new Error("Grup tidak valid.");

  const kontakId = Number(formData.get("kontakId"));
  if (!Number.isSafeInteger(kontakId) || kontakId <= 0) throw new Error("Kontak tidak valid.");

  const { villageId } = await village(KONTAK_GRUP_RESOURCE, "update");

  const peran = formData.get("peran");
  const peranStr = peran && String(peran).trim() ? String(peran).trim() : null;

  await addAnggotaGrupUseCase(villageId, grupId, { kontakId, peran: peranStr });
  revalidatePath(`/hubung-warga/grup-kontak/${grupId}/anggota`);
  redirect(`/hubung-warga/grup-kontak/${grupId}/anggota?added=1`);
}