"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hapusKontakGrupUseCase, village } from "@/features/layanan-warga/kontak/application/use-cases";
import { KONTAK_GRUP_RESOURCE } from "@/features/layanan-warga/kontak/domain/kontak";

export async function hapusGrupKontakAction(formData: FormData) {
  const idRaw = formData.get("id");
  const id = Number(idRaw);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Grup tidak valid.");
  }

  const { villageId } = await village(KONTAK_GRUP_RESOURCE, "delete");

  await hapusKontakGrupUseCase(villageId, id);
  revalidatePath("/hubung-warga/grup-kontak");
  redirect("/hubung-warga/grup-kontak?deleted=1");
}