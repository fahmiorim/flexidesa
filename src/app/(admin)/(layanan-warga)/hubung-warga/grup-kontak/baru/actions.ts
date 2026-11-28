"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createKontakGrupUseCase, village } from "@/features/layanan-warga/kontak/application/use-cases";
import { KONTAK_GRUP_RESOURCE } from "@/features/layanan-warga/kontak/domain/kontak";

export async function simpanGrupKontakAction(formData: FormData) {
  const { villageId } = await village(KONTAK_GRUP_RESOURCE, "create");

  const namaGrup = String(formData.get("namaGrup") ?? "").trim();
  const keterangan = String(formData.get("keterangan") ?? "").trim();

  if (!namaGrup) throw new Error("Nama grup wajib diisi.");

  await createKontakGrupUseCase(villageId, { namaGrup, keterangan, villageId });
  revalidatePath("/hubung-warga/grup-kontak");
  redirect("/hubung-warga/grup-kontak?created=1");
}