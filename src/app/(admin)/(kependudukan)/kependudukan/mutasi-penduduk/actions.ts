"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  catatDatang,
  catatKelahiran,
  catatKematian,
  catatPerubahan,
  catatPindahKeluar,
  kembalikanStatusMassal,
  kembalikanStatusPenduduk,
  ubahRiwayat,
  ubahStatusDasar,
} from "@/features/kependudukan/penduduk/application/riwayat-penduduk-use-cases";
import type {
  CatatDatangInput,
  CatatKelahiranInput,
  CatatKematianInput,
  CatatPerubahanInput,
  CatatPindahKeluarInput,
  UbahStatusDasarInput,
} from "@/features/kependudukan/penduduk/domain/riwayat-penduduk";

function text(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}
function optionalId(form: FormData, key: string): number | null {
  const value = text(form, key);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
async function selesai() {
  revalidatePath("/kependudukan/mutasi-penduduk");
  revalidatePath("/kependudukan/penduduk");
  revalidatePath("/kependudukan/keluarga");
  redirect("/kependudukan/mutasi-penduduk");
}
export async function catatKelahiranAction(form: FormData) {
  await catatKelahiran({
    eventDate: text(form, "eventDate"),
    name: text(form, "name"),
    nationalId: text(form, "nationalId"),
    gender: text(form, "gender") as CatatKelahiranInput["gender"],
    familyId: optionalId(form, "familyId"),
    familyRelationId: optionalId(form, "familyRelationId"),
    regionId: optionalId(form, "regionId"),
    address: text(form, "address"),
    fatherName: text(form, "fatherName"),
    motherName: text(form, "motherName"),
    reason: text(form, "reason"),
    notes: text(form, "notes"),
    referenceNo: text(form, "referenceNo"),
  });
  await selesai();
}
export async function catatDatangAction(form: FormData) {
  await catatDatang({
    eventDate: text(form, "eventDate"),
    name: text(form, "name"),
    nationalId: text(form, "nationalId"),
    gender: text(form, "gender") as CatatDatangInput["gender"],
    birthDate: text(form, "birthDate"),
    birthPlace: text(form, "birthPlace"),
    familyId: optionalId(form, "familyId"),
    familyRelationId: optionalId(form, "familyRelationId"),
    regionId: optionalId(form, "regionId"),
    address: text(form, "address"),
    fromAddress: text(form, "fromAddress"),
    reason: text(form, "reason"),
    notes: text(form, "notes"),
    referenceNo: text(form, "referenceNo"),
  });
  await selesai();
}
export async function catatKematianAction(form: FormData) {
  await catatKematian({
    residentId: Number(text(form, "residentId")),
    eventDate: text(form, "eventDate"),
    reportDate: text(form, "reportDate"),
    notes: text(form, "notes"),
    referenceNo: text(form, "referenceNo"),
    tempatMeninggal: text(form, "tempatMeninggal"),
    jamKematian: text(form, "jamKematian"),
    sebab: text(form, "sebab") as CatatKematianInput["sebab"],
    penolong: text(form, "penolong") as CatatKematianInput["penolong"],
    anakKe: Number(text(form, "anakKe")),
    nomorAkta: text(form, "nomorAkta"),
  });
  await selesai();
}
export async function catatPindahKeluarAction(form: FormData) {
  await catatPindahKeluar({
    residentId: Number(text(form, "residentId")),
    eventDate: text(form, "eventDate"),
    reportDate: text(form, "reportDate"),
    toAddress: text(form, "toAddress"),
    destination: text(form, "destination"),
    refPindah: text(form, "refPindah") as CatatPindahKeluarInput["refPindah"],
    alamatTujuan: text(form, "alamatTujuan"),
    reason: text(form, "reason"),
    notes: text(form, "notes"),
    referenceNo: text(form, "referenceNo"),
  });
  await selesai();
}
export async function ubahStatusDasarAction(residentId: number, form: FormData) {
  await ubahStatusDasar({
    residentId,
    lifeStatus: text(form, "lifeStatus") as UbahStatusDasarInput["lifeStatus"],
    eventDate: text(form, "eventDate"),
    reportDate: text(form, "reportDate"),
    notes: text(form, "notes"),
    tempatMeninggal: text(form, "tempatMeninggal"),
    jamKematian: text(form, "jamKematian"),
    sebab: text(form, "sebab") as UbahStatusDasarInput["sebab"],
    penolong: text(form, "penolong") as UbahStatusDasarInput["penolong"],
    anakKe: text(form, "anakKe") ? Number(text(form, "anakKe")) : undefined,
    nomorAkta: text(form, "nomorAkta"),
    refPindah: text(form, "refPindah") as UbahStatusDasarInput["refPindah"],
    alamatTujuan: text(form, "alamatTujuan"),
  });
  revalidatePath("/kependudukan/mutasi-penduduk");
  revalidatePath("/kependudukan/penduduk");
  revalidatePath("/kependudukan/penduduk/dashboard");
  revalidatePath("/kependudukan/keluarga");
  revalidatePath(`/kependudukan/penduduk/${residentId}`);
  redirect("/kependudukan/mutasi-penduduk");
}
export async function kembalikanStatusAction(residentId: number) {
  await kembalikanStatusPenduduk(residentId);
  revalidatePath("/kependudukan/mutasi-penduduk");
  revalidatePath("/kependudukan/penduduk");
  revalidatePath(`/kependudukan/penduduk/${residentId}`);
  redirect("/kependudukan/mutasi-penduduk");
}
export async function kembalikanStatusMassalAction(form: FormData) {
  const ids = form
    .getAll("idCb")
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);
  if (ids.length > 0) {
    await kembalikanStatusMassal(ids);
  }
  revalidatePath("/kependudukan/mutasi-penduduk");
  revalidatePath("/kependudukan/penduduk");
  redirect("/kependudukan/mutasi-penduduk");
}
export async function ubahRiwayatAction(id: number, form: FormData) {
  await ubahRiwayat(id, {
    eventDate: text(form, "eventDate"),
    reportDate: text(form, "reportDate"),
    notes: text(form, "notes"),
    tempatMeninggal: text(form, "tempatMeninggal"),
    jamKematian: text(form, "jamKematian"),
    sebab: text(form, "sebab"),
    penolong: text(form, "penolong"),
    nomorAkta: text(form, "nomorAkta"),
    anakKe: text(form, "anakKe") ? Number(text(form, "anakKe")) : undefined,
    refPindah: text(form, "refPindah"),
    alamatTujuan: text(form, "alamatTujuan"),
  });
  revalidatePath("/kependudukan/mutasi-penduduk");
  redirect("/kependudukan/mutasi-penduduk");
}
export async function catatPerubahanAction(form: FormData) {
  await catatPerubahan({
    residentId: Number(text(form, "residentId")),
    eventDate: text(form, "eventDate"),
    lifeStatus: text(form, "lifeStatus") as CatatPerubahanInput["lifeStatus"],
    reason: text(form, "reason"),
    notes: text(form, "notes"),
    referenceNo: text(form, "referenceNo"),
  });
  await selesai();
}
