"use server";

import type { ActionState } from "@/lib/action-state";
import { jalankanAksiForm } from "@/lib/form-action-state";

import { simpanProgram, tambahPesertaKeProgram, ubahPesertaProgram } from "./actions";

export async function simpanProgramFormAction(
  _state: ActionState<null>,
  formData: FormData,
): Promise<ActionState<null>> {
  return jalankanAksiForm(formData, simpanProgram, "Program bantuan disimpan.");
}

export async function tambahPesertaFormAction(
  _state: ActionState<null>,
  formData: FormData,
): Promise<ActionState<null>> {
  return jalankanAksiForm(formData, tambahPesertaKeProgram, "Peserta ditambahkan.");
}

export async function ubahPesertaFormAction(
  _state: ActionState<null>,
  formData: FormData,
): Promise<ActionState<null>> {
  return jalankanAksiForm(formData, ubahPesertaProgram, "Peserta diperbarui.");
}
