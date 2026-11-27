"use server";

import type { ActionState } from "@/lib/action-state";
import { jalankanAksiForm } from "@/lib/form-action-state";

import { ajukanCutiAction, putuskanCutiAction } from "../actions";

export async function ajukanCutiFormAction(
  _state: ActionState<null>,
  formData: FormData,
): Promise<ActionState<null>> {
  return jalankanAksiForm(formData, ajukanCutiAction, "Pengajuan cuti/izin berhasil dikirim.");
}

export async function putuskanCutiFormAction(
  _state: ActionState<null>,
  formData: FormData,
): Promise<ActionState<null>> {
  return jalankanAksiForm(formData, putuskanCutiAction, "Keputusan cuti/izin disimpan.");
}
