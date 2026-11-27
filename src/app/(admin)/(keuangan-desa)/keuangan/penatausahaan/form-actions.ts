"use server";

import type { ActionState } from "@/lib/action-state";
import { jalankanAksiForm } from "@/lib/form-action-state";

import { simpanJurnal, simpanSaldoBank } from "./actions";

export async function simpanJurnalFormAction(
  _state: ActionState<null>,
  formData: FormData,
): Promise<ActionState<null>> {
  return jalankanAksiForm(formData, simpanJurnal, "Mutasi jurnal disimpan.");
}

export async function simpanSaldoBankFormAction(
  _state: ActionState<null>,
  formData: FormData,
): Promise<ActionState<null>> {
  return jalankanAksiForm(formData, simpanSaldoBank, "Saldo awal bank disimpan.");
}
