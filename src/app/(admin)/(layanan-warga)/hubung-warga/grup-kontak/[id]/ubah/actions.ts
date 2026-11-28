"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { updateKontakGrupUseCase, village } from "@/features/layanan-warga/kontak/application/use-cases";
import { KONTAK_GRUP_RESOURCE } from "@/features/layanan-warga/kontak/domain/kontak";

export async function ubahGrupKontakAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Grup tidak valid.");

  const { villageId } = await village(KONTAK_GRUP_RESOURCE, "update");

  const namaGrup = String(formData.get("namaGrup") ?? "").trim();
  const keterangan = String(formData.get("keterangan") ?? "").trim();

  if (!namaGrup) throw new Error("Nama grup wajib diisi.");

  await updateKontakGrupUseCase(villageId, { id, namaGrup, keterangan, villageId });
  revalidatePath("/hubung-warga/grup-kontak");
  revalidatePath(`/hubung-warga/grup-kontak/${id}`);
  redirect(`/hubung-warga/grup-kontak/${id}/ubah?updated=1`);
}