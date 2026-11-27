"use server";

import type { ActionState } from "@/lib/action-state";
import { jalankanAksiForm } from "@/lib/form-action-state";

import { simpanLapak, simpanProdukLapakAction } from "./actions";

export async function simpanLapakFormAction(
  _state: ActionState<null>,
  formData: FormData,
): Promise<ActionState<null>> {
  return jalankanAksiForm(formData, simpanLapak, "Lapak disimpan.");
}

export async function simpanProdukLapakFormAction(
  _state: ActionState<null>,
  formData: FormData,
): Promise<ActionState<null>> {
  return jalankanAksiForm(formData, simpanProdukLapakAction, "Produk lapak disimpan.");
}
