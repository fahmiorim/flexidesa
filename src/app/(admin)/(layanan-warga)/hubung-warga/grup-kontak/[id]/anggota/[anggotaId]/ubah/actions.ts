"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ubahAnggotaGrupUseCase, village } from "@/features/layanan-warga/kontak/application/use-cases";
import { KONTAK_GRUP_RESOURCE } from "@/features/layanan-warga/kontak/domain/kontak";

export async function ubahAnggotaGrupAction(formData: FormData) {
  const anggotaId = Number(formData.get("anggotaId"));
  if (!Number.isSafeInteger(anggotaId) || anggotaId <= 0) throw new Error("Anggota tidak valid.");

  const grupId = Number(formData.get("grupId"));
  if (!Number.isSafeInteger(grupId) || grupId <= 0) throw new Error("Grup tidak valid.");

  const { villageId } = await village(KONTAK_GRUP_RESOURCE, "update");

  const peran = formData.get("peran");
  const peranStr = peran && String(peran).trim() ? String(peran).trim() : null;

  await ubahAnggotaGrupUseCase(villageId, anggotaId, { peran: peranStr });
  revalidatePath(`/hubung-warga/grup-kontak/${grupId}/anggota`);
  revalidatePath(`/hubung-warga/grup-kontak/${grupId}/anggota/${anggotaId}/ubah`);
  redirect(`/hubung-warga/grup-kontak/${grupId}/anggota/${anggotaId}/ubah?updated=1`);
}