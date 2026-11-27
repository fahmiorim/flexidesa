"use server";

import type { ActionState } from "@/lib/action-state";
import { jalankanAksiForm } from "@/lib/form-action-state";

import { simpanSoalSurveiAction } from "../actions";

export async function simpanSoalSurveiFormAction(
  _state: ActionState<null>,
  formData: FormData,
): Promise<ActionState<null>> {
  return jalankanAksiForm(formData, simpanSoalSurveiAction, "Pertanyaan survei disimpan.");
}
