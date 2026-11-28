"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hapusAnggotaGrupUseCase, village } from "@/features/layanan-warga/kontak/application/use-cases";
import { KONTAK_GRUP_RESOURCE } from "@/features/layanan-warga/kontak/domain/kontak";

export async function hapusAnggotaGrupAction(formData: FormData) {
  const anggotaIdRaw = formData.get("anggotaId");
  const anggotaId = Number(anggotaIdRaw);
  if (!Number.isSafeInteger(anggotaId) || anggotaId <= 0) {
    throw new Error("Anggota tidak valid.");
  }

  const grupIdRaw = formData.get("grupId");
  const grupId = Number(grupIdRaw);
  if (!Number.isSafeInteger(grupId) || grupId <= 0) {
    throw new Error("Grup tidak valid.");
  }

  const { villageId } = await village(KONTAK_GRUP_RESOURCE, "delete");

  await hapusAnggotaGrupUseCase(villageId, anggotaId);
  revalidatePath(`/hubung-warga/grup-kontak/${grupId}/anggota`);
  redirect(`/hubung-warga/grup-kontak/${grupId}/anggota?deleted=1`);
}