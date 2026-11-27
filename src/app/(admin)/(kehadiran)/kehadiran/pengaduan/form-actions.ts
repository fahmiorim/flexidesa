"use server";

import type { ActionState } from "@/lib/action-state";
import { jalankanAksiForm } from "@/lib/form-action-state";

import { ubahPengaduanKehadiranAction } from "./actions";

export async function ubahPengaduanKehadiranFormAction(
  _state: ActionState<null>,
  formData: FormData,
): Promise<ActionState<null>> {
  return jalankanAksiForm(formData, ubahPengaduanKehadiranAction, "Keterangan pengaduan disimpan.");
}
