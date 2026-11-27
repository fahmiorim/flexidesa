"use server";

import type { ActionState } from "@/lib/action-state";
import { jalankanAksiForm } from "@/lib/form-action-state";

import { simpanLaporanPendudukAction } from "./actions";

export async function simpanLaporanPendudukFormAction(
  _state: ActionState<null>,
  formData: FormData,
): Promise<ActionState<null>> {
  return jalankanAksiForm(formData, simpanLaporanPendudukAction, "Laporan penduduk disimpan.");
}
