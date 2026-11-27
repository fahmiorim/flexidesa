"use server";

import type { ActionState } from "@/lib/action-state";
import { jalankanAksiForm } from "@/lib/form-action-state";

import { simpanSarana } from "./actions";

export async function simpanSaranaFormAction(
  _state: ActionState<null>,
  fd: FormData,
): Promise<ActionState<null>> {
  return jalankanAksiForm(fd, simpanSarana, "Sarana/prasarana disimpan.");
}
