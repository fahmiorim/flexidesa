"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ubahJamKerja } from "@/features/kehadiran/kehadiran/application/jam-kerja-use-cases";
import { errorState, toErrorState, type ActionState } from "@/lib/action-state";

const RUTE = "/kehadiran/jam-kerja";

function idPositif(nilai: FormDataEntryValue | null): number | null {
  const id = Number(nilai);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** Simpan perubahan jam kerja; baris hanya dapat diubah, tidak ditambah/dihapus. */
export async function simpanJamKerjaAction(
  _state: ActionState<{ id: number }>,
  formData: FormData,
): Promise<ActionState<{ id: number }>> {
  const id = idPositif(formData.get("id"));
  if (id === null) return errorState("ID jam kerja tidak valid.");

  try {
    await ubahJamKerja(id, {
      jamMasuk: String(formData.get("jamMasuk") ?? ""),
      jamKeluar: String(formData.get("jamKeluar") ?? ""),
      status: String(formData.get("status") ?? ""),
      keterangan: String(formData.get("keterangan") ?? ""),
    });
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath(RUTE);
  redirect(`${RUTE}?status=diubah`);
}
