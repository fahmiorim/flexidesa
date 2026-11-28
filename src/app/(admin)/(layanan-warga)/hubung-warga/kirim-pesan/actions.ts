"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { simpanPesanArsipUseCase, village } from "@/features/layanan-warga/kontak/application/use-cases";
import { KONTAK_GRUP_RESOURCE } from "@/features/layanan-warga/kontak/domain/kontak";

export async function kirimPesanAction(formData: FormData) {
  const grupId = Number(formData.get("grupId"));
  if (!Number.isSafeInteger(grupId) || grupId <= 0) throw new Error("Grup tidak valid.");

  const subjek = String(formData.get("subjek") ?? "").trim();
  if (!subjek) throw new Error("Subjek wajib diisi.");

  const isi = String(formData.get("isi") ?? "").trim();
  if (!isi) throw new Error("Isi pesan wajib diisi.");

  const { user, villageId } = await village(KONTAK_GRUP_RESOURCE, "create");

  await simpanPesanArsipUseCase(villageId, {
    grupId,
    subjek,
    isi,
    createdBy: user.id,
  });

  revalidatePath("/hubung-warga/kirim-pesan");
  redirect("/hubung-warga/kirim-pesan?sent=1");
}