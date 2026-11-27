"use server";

import { adaptasiAksiForm } from "@/lib/form-action-state";

import { simpanHariLiburAction } from "./actions";

export const simpanHariLiburFormAction = adaptasiAksiForm(
  simpanHariLiburAction,
  "Hari libur disimpan.",
);
