"use server";

import { adaptasiAksiForm } from "@/lib/form-action-state";

import { simpanAlasanKeluarAction } from "./actions";

export const simpanAlasanKeluarFormAction = adaptasiAksiForm(
  simpanAlasanKeluarAction,
  "Alasan keluar disimpan.",
);
