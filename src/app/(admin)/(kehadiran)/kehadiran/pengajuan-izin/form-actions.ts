"use server";

import type { ActionState } from "@/lib/action-state";
import { jalankanAksiForm } from "@/lib/form-action-state";

import { ajukanPengajuanIzinAction } from "./actions";

export async function ajukanPengajuanIzinFormAction(
  _state: ActionState<null>,
  formData: FormData,
): Promise<ActionState<null>> {
  return jalankanAksiForm(formData, ajukanPengajuanIzinAction, "Pengajuan izin berhasil dikirim.");
}
