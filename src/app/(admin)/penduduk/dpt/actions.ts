"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { deleteElection, saveElection } from "@/features/penduduk/application/dpt-use-cases";
import { electionFormSchema } from "@/features/penduduk/domain/dpt";
import { successState, toErrorState, type ActionState } from "@/lib/action-state";
import { validationError } from "@/lib/errors";

function idPositif(value: FormDataEntryValue | null): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** Simpan pemilihan baru atau perubahan pemilihan yang sudah ada. */
export async function simpanPemilihanAction(
  id: number | null,
  _state: ActionState<{ id: number }>,
  formData: FormData,
): Promise<ActionState<{ id: number }>> {
  try {
    const input = electionFormSchema.parse({
      judul: String(formData.get("judul") ?? ""),
      status: String(formData.get("status") ?? ""),
      tanggal: String(formData.get("tanggal") ?? ""),
      keterangan: String(formData.get("keterangan") ?? ""),
    });
    const hasil = await saveElection(input, id ?? undefined);
    revalidatePath("/penduduk/dpt");
    return successState(id ? "Pemilihan berhasil diperbarui." : "Pemilihan berhasil dibuat.", {
      id: hasil.id,
    });
  } catch (error) {
    return toErrorState(error);
  }
}

/** Hapus pemilihan; DPT hanya memakai pemilihan berstatus aktif. */
export async function hapusPemilihanAction(formData: FormData): Promise<never> {
  const id = idPositif(formData.get("id"));
  if (id === null) throw validationError("Pemilihan tidak valid.");

  await deleteElection(id);
  revalidatePath("/penduduk/dpt");
  redirect("/penduduk/dpt?dihapus=1#pemilihan");
}
