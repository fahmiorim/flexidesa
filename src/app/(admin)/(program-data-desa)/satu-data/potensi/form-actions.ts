"use server";

import type { ActionState } from "@/lib/action-state";
import { jalankanAksiForm } from "@/lib/form-action-state";

import { simpanPotensi } from "./actions";

export async function simpanPotensiFormAction(
  _state: ActionState<null>,
  fd: FormData,
): Promise<ActionState<null>> {
  return jalankanAksiForm(fd, simpanPotensi, "Potensi disimpan.");
}
