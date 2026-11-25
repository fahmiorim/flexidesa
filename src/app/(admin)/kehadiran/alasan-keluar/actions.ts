"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  hapusAlasanKeluar,
  hapusAlasanKeluarBanyak,
  tambahAlasanKeluar,
  ubahAlasanKeluar,
} from "@/features/kehadiran/application/alasan-keluar-use-cases";
import { toErrorState, type ActionState } from "@/lib/action-state";

const RUTE = "/kehadiran/alasan-keluar";

function idPositif(nilai: FormDataEntryValue | null): number | null {
  const id = Number(nilai);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function bacaForm(formData: FormData) {
  return {
    alasan: String(formData.get("alasan") ?? ""),
    keterangan: String(formData.get("keterangan") ?? ""),
  };
}

/** Simpan alasan keluar: tanpa `id` menambah, dengan `id` mengubah. */
export async function simpanAlasanKeluarAction(
  _state: ActionState<{ id: number }>,
  formData: FormData,
): Promise<ActionState<{ id: number }>> {
  const id = idPositif(formData.get("id"));

  try {
    if (id === null) {
      await tambahAlasanKeluar(bacaForm(formData));
    } else {
      await ubahAlasanKeluar(id, bacaForm(formData));
    }
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath(RUTE);
  redirect(`${RUTE}?status=${id === null ? "ditambah" : "diubah"}`);
}

export async function hapusAlasanKeluarAction(formData: FormData): Promise<void> {
  const id = idPositif(formData.get("id"));
  if (id === null) throw new Error("ID alasan keluar tidak valid.");

  await hapusAlasanKeluar(id);

  revalidatePath(RUTE);
  redirect(`${RUTE}?status=dihapus`);
}

export async function hapusAlasanKeluarMassalAction(formData: FormData): Promise<void> {
  const ids = formData
    .getAll("idCb")
    .map((nilai) => idPositif(nilai))
    .filter((id): id is number => id !== null);

  if (ids.length === 0) redirect(`${RUTE}?status=kosong`);

  await hapusAlasanKeluarBanyak(ids);

  revalidatePath(RUTE);
  redirect(`${RUTE}?status=dihapus&jumlah=${ids.length}`);
}
