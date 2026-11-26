"use server";

import { revalidatePath } from "next/cache";

import {
  hapusDokumenAdmin,
  tambahDokumenAdmin,
  ubahDokumenAdmin,
  ubahStatusDokumenAdmin,
  type DokumenAdminInput,
} from "@/features/info-desa/publik/application/konten-admin";
import { successState, toErrorState, type ActionState } from "@/lib/action-state";

function field(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function idDari(form: FormData, key = "id") {
  const id = Number(field(form, key));
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function revalidasi() {
  revalidatePath("/profil-desa/dokumen");
  revalidatePath("/dokumen");
  revalidatePath("/informasi");
}

async function bacaInput(form: FormData): Promise<{
  input: DokumenAdminInput;
  file?: { nama: string; mime: string; ukuran: number; isi: Uint8Array };
}> {
  const tahunText = field(form, "tahun");
  const tahun = tahunText ? Number(tahunText) : null;
  const fileRaw = form.get("berkas");
  const file =
    fileRaw instanceof File && fileRaw.size > 0
      ? {
          nama: fileRaw.name,
          mime: fileRaw.type,
          ukuran: fileRaw.size,
          isi: new Uint8Array(await fileRaw.arrayBuffer()),
        }
      : undefined;
  return {
    input: {
      nama: field(form, "nama"),
      slug: field(form, "slug"),
      kategori: field(form, "kategori") || "informasi_publik",
      jenis: field(form, "jenis") || null,
      nomor: field(form, "nomor") || null,
      tahun: tahun !== null && Number.isInteger(tahun) ? tahun : null,
      keterangan: field(form, "keterangan") || null,
      tautan: field(form, "tautan") || null,
      aktif: form.get("aktif") === "on",
    },
    file,
  };
}

/** Simpan dokumen dari modal: tambah bila tanpa id, ubah bila ada id. */
export async function simpanDokumenFormAction(_state: ActionState<null>, fd: FormData) {
  try {
    const id = idDari(fd);
    const { input, file } = await bacaInput(fd);
    if (id) {
      await ubahDokumenAdmin(id, input, file);
    } else {
      await tambahDokumenAdmin(input, file);
    }
    revalidasi();
    return successState("Dokumen disimpan.", null);
  } catch (error) {
    return toErrorState(error);
  }
}

export async function ubahStatusDokumenAction(form: FormData): Promise<void> {
  const id = idDari(form, "dokumenId");
  if (!id) throw new Error("Dokumen tidak valid.");
  await ubahStatusDokumenAdmin(id, field(form, "aktif") === "true");
  revalidasi();
}

export async function hapusDokumenAction(form: FormData): Promise<void> {
  const id = idDari(form, "dokumenId");
  if (!id) throw new Error("Dokumen tidak valid.");
  await hapusDokumenAdmin(id);
  revalidasi();
}
