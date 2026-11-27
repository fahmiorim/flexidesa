"use server";

import type { ActionState } from "@/lib/action-state";
import { jalankanAksiForm } from "@/lib/form-action-state";

import { absensiManualAction } from "../actions";

export async function absensiManualFormAction(
  _state: ActionState<null>,
  formData: FormData,
): Promise<ActionState<null>> {
  return jalankanAksiForm(formData, absensiManualAction, "Absensi pegawai disimpan.");
}
