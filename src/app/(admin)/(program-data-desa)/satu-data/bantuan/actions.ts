"use server";

import { revalidatePath } from "next/cache";

import {
  createBantuan,
  deleteBantuan,
  hapusPeserta,
  hapusSemuaPeserta,
  tambahPeserta,
  updateBantuan,
  updatePeserta,
} from "@/features/program-data-desa/bantuan/application/use-cases";
import {
  bantuanFormSchema,
  pesertaFormSchema,
} from "@/features/program-data-desa/bantuan/domain/bantuan";
import { validationError } from "@/lib/errors";

function value(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function refresh() {
  revalidatePath("/satu-data/bantuan");
}

function parseProgram(form: FormData) {
  const hasil = bantuanFormSchema.safeParse({
    nama: value(form, "nama"),
    sasaran: value(form, "sasaran"),
    keterangan: value(form, "keterangan"),
    tanggalMulai: value(form, "tanggalMulai"),
    tanggalAkhir: value(form, "tanggalAkhir"),
    asalDana: value(form, "asalDana"),
  });
  if (!hasil.success) {
    throw validationError(hasil.error.issues[0]?.message ?? "Data program tidak valid.");
  }
  return hasil.data;
}

function parsePeserta(form: FormData) {
  const hasil = pesertaFormSchema.safeParse({
    programId: value(form, "programId"),
    sasaranId: value(form, "sasaranId"),
    nomorKartu: value(form, "nomorKartu"),
    kartuNik: value(form, "kartuNik"),
    kartuNama: value(form, "kartuNama"),
    kartuTempatLahir: value(form, "kartuTempatLahir"),
    kartuTanggalLahir: value(form, "kartuTanggalLahir"),
    kartuAlamat: value(form, "kartuAlamat"),
  });
  if (!hasil.success) {
    throw validationError(hasil.error.issues[0]?.message ?? "Data peserta tidak valid.");
  }
  return hasil.data;
}

function idValid(form: FormData, key = "id") {
  const id = Number(value(form, key));
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("ID tidak valid.");
  return id;
}

export async function simpanProgram(form: FormData) {
  const input = parseProgram(form);
  const id = Number(value(form, "id") || 0);
  if (id > 0) {
    await updateBantuan(id, input);
  } else {
    await createBantuan(input);
  }
  refresh();
}

export async function hapusProgram(form: FormData) {
  await deleteBantuan(idValid(form));
  refresh();
}

export async function tambahPesertaKeProgram(form: FormData) {
  const programId = idValid(form, "programId");
  const input = parsePeserta(form);
  await tambahPeserta(programId, input);
  revalidatePath(`/satu-data/bantuan/${programId}`);
}

export async function ubahPesertaProgram(form: FormData) {
  const programId = idValid(form, "programId");
  const pesertaId = idValid(form, "pesertaId");
  const input = parsePeserta(form);
  await updatePeserta(programId, pesertaId, input);
  revalidatePath(`/satu-data/bantuan/${programId}`);
}

export async function hapusPesertaProgram(form: FormData) {
  const programId = idValid(form, "programId");
  const pesertaId = idValid(form, "pesertaId");
  await hapusPeserta(programId, pesertaId);
  revalidatePath(`/satu-data/bantuan/${programId}`);
}

export async function hapusSemuaPesertaProgram(form: FormData) {
  const programId = idValid(form, "programId");
  await hapusSemuaPeserta(programId);
  revalidatePath(`/satu-data/bantuan/${programId}`);
}
