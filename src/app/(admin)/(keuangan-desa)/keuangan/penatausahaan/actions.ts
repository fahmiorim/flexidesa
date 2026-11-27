"use server";

import { revalidatePath } from "next/cache";

import {
  hapusJurnalData,
  simpanJurnalData,
  simpanSaldoBankData,
} from "@/features/keuangan-desa/keuangan/application/penatausahaan-use-cases";

function value(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function refresh() {
  revalidatePath("/keuangan/penatausahaan");
  revalidatePath("/keuangan/buku-kas-umum");
}

export async function simpanJurnal(form: FormData) {
  await simpanJurnalData({
    tahun: value(form, "tahun"),
    tanggal: value(form, "tanggal"),
    kodeRekening: value(form, "kodeRekening"),
    uraian: value(form, "uraian"),
    debet: value(form, "debet") || "0",
    kredit: value(form, "kredit") || "0",
    referensi: value(form, "referensi"),
  });
  refresh();
}

export async function hapusJurnal(form: FormData) {
  const id = Number(value(form, "id"));
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("ID jurnal tidak valid.");
  await hapusJurnalData(id);
  refresh();
}

export async function simpanSaldoBank(form: FormData) {
  await simpanSaldoBankData({
    tahun: value(form, "tahun"),
    rekeningBank: value(form, "rekeningBank"),
    namaBank: value(form, "namaBank"),
    saldoAwal: value(form, "saldoAwal") || "0",
  });
  refresh();
}
