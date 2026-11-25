"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  hapusHariLibur,
  hapusHariLiburBanyak,
  tambahHariLibur,
  ubahHariLibur,
} from "@/features/kehadiran/application/hari-libur-use-cases";
import { toErrorState, type ActionState } from "@/lib/action-state";

const RUTE = "/kehadiran/hari-libur";

function idPositif(nilai: FormDataEntryValue | null): number | null {
  const id = Number(nilai);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function bacaForm(formData: FormData) {
  return {
    tanggal: String(formData.get("tanggal") ?? ""),
    keterangan: String(formData.get("keterangan") ?? ""),
  };
}

/** Simpan hari libur: tanpa `id` menambah, dengan `id` mengubah. */
export async function simpanHariLiburAction(
  _state: ActionState<{ id: number }>,
  formData: FormData,
): Promise<ActionState<{ id: number }>> {
  const id = idPositif(formData.get("id"));

  try {
    if (id === null) {
      await tambahHariLibur(bacaForm(formData));
    } else {
      await ubahHariLibur(id, bacaForm(formData));
    }
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath(RUTE);
  redirect(`${RUTE}?status=${id === null ? "ditambah" : "diubah"}`);
}

export async function hapusHariLiburAction(formData: FormData): Promise<void> {
  const id = idPositif(formData.get("id"));
  if (id === null) throw new Error("ID hari libur tidak valid.");

  await hapusHariLibur(id);

  revalidatePath(RUTE);
  redirect(`${RUTE}?status=dihapus`);
}

export async function hapusHariLiburMassalAction(formData: FormData): Promise<void> {
  const ids = formData
    .getAll("idCb")
    .map((nilai) => idPositif(nilai))
    .filter((id): id is number => id !== null);

  if (ids.length === 0) redirect(`${RUTE}?status=kosong`);

  await hapusHariLiburBanyak(ids);

  revalidatePath(RUTE);
  redirect(`${RUTE}?status=dihapus&jumlah=${ids.length}`);
}
