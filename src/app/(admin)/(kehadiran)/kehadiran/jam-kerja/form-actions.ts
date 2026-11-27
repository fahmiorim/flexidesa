"use server";

import { adaptasiAksiForm } from "@/lib/form-action-state";

import { simpanJamKerjaAction } from "./actions";

export const simpanJamKerjaFormAction = adaptasiAksiForm(
  simpanJamKerjaAction,
  "Jam kerja disimpan.",
);
