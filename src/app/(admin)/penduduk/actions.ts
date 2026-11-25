"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ambilFormulirPenduduk } from "@/features/penduduk/application/form-data";
import {
  createPenduduk,
  deletePenduduk,
  updatePenduduk,
} from "@/features/penduduk/application/use-cases";
import { pendudukFormSchema } from "@/features/penduduk/domain/penduduk";
import { errorState, successState, toErrorState, type ActionState } from "@/lib/action-state";

const HALAMAN = "/penduduk";

function teks(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function buatPendudukAction(
  _state: ActionState<{ id: number }>,
  formData: FormData,
): Promise<ActionState<{ id: number }>> {
  try {
    const input = pendudukFormSchema.parse(ambilFormulirPenduduk(formData));
    const hasil = await createPenduduk(input);

    revalidatePath(HALAMAN);
    revalidatePath("/keluarga");
    revalidatePath(`${HALAMAN}/${hasil.id}`);

    return successState("Data penduduk berhasil ditambahkan.", hasil);
  } catch (error) {
    return toErrorState(error);
  }
}

export async function ubahPendudukAction(
  _state: ActionState<{ id: number }>,
  formData: FormData,
): Promise<ActionState<{ id: number }>> {
  const id = Number(teks(formData, "id"));
  if (!Number.isInteger(id) || id <= 0) {
    return errorState("Data penduduk tidak valid.");
  }

  try {
    const input = pendudukFormSchema.parse(ambilFormulirPenduduk(formData));
    await updatePenduduk(id, input);

    revalidatePath(HALAMAN);
    revalidatePath("/keluarga");
    revalidatePath(`${HALAMAN}/${id}`);

    return successState("Perubahan data penduduk disimpan.", { id });
  } catch (error) {
    return toErrorState(error);
  }
}

export async function hapusPendudukAction(formData: FormData): Promise<never> {
  const id = Number(teks(formData, "id"));
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Data penduduk tidak valid.");
  await deletePenduduk(id);
  revalidatePath(HALAMAN);
  revalidatePath("/keluarga");
  revalidatePath("/mutasi-penduduk");
  redirect("/penduduk?deleted=1");
}
