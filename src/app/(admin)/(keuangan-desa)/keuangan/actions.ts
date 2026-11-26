"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { simpanKeuanganBulanan } from "@/features/keuangan-desa/keuangan/application/keuangan-bulanan-use-cases";
import {
  listKeuangan,
  saveKeuanganData,
  saveKeuanganTriwulanData,
} from "@/features/keuangan-desa/keuangan/application/keuangan-use-cases";
import {
  deleteLaporanKeuanganDokumen,
  saveLaporanKeuanganDokumen,
  setLaporanKeuanganDiserahkan,
} from "@/features/keuangan-desa/keuangan/application/laporan-dokumen-use-cases";
import { isInputRow } from "@/features/keuangan-desa/keuangan/domain/keuangan";

export async function simpanPaguApbdesAction(formData: FormData): Promise<void> {
  const tahun = Number(formData.get("tahun"));
  const data = await listKeuangan(tahun);
  const rows = data.rows
    .filter((row) => isInputRow(row.templateUuid))
    .map((row) => ({
      templateUuid: row.templateUuid,
      anggaran: Number(formData.get("anggaran:" + row.templateUuid) ?? 0),
      realisasi: Number(row.realisasi),
    }));
  await saveKeuanganData(tahun, rows);
  revalidatePath("/keuangan");
  revalidatePath("/keuangan/apbdes");
  revalidatePath("/keuangan/realisasi");
  revalidatePath("/keuangan/laporan");
  redirect("/keuangan/apbdes?tersimpan=1");
}

export async function simpanRealisasiKeuanganAction(formData: FormData): Promise<void> {
  const tahun = Number(formData.get("tahun"));
  const data = await listKeuangan(tahun);
  const rows = data.rows
    .filter((row) => isInputRow(row.templateUuid))
    .map((row) => ({
      templateUuid: row.templateUuid,
      anggaran: Number(row.anggaran),
      realisasi: Number(formData.get("realisasi:" + row.templateUuid) ?? row.realisasi),
    }));
  await saveKeuanganData(tahun, rows);
  revalidatePath("/keuangan");
  revalidatePath("/keuangan/realisasi");
  revalidatePath("/keuangan/laporan");
  redirect("/keuangan/realisasi?tersimpan=1");
}

export async function simpanRealisasiTriwulanAction(formData: FormData): Promise<void> {
  const tahun = Number(formData.get("tahun"));
  const data = await listKeuangan(tahun);
  const rows = data.rows
    .filter((row) => row.templateUuid.length === 3 && row.templateUuid.startsWith("5."))
    .map((row) => ({
      kode: row.templateUuid,
      tw1: Number(formData.get("tw1:" + row.templateUuid) ?? 0),
      tw2: Number(formData.get("tw2:" + row.templateUuid) ?? 0),
      tw3: Number(formData.get("tw3:" + row.templateUuid) ?? 0),
      tw4: Number(formData.get("tw4:" + row.templateUuid) ?? 0),
    }));
  await saveKeuanganTriwulanData(tahun, rows);
  revalidatePath("/keuangan");
  revalidatePath("/keuangan/realisasi");
  redirect("/keuangan/realisasi?triwulan=1");
}

export async function simpanDokumenLaporanAction(formData: FormData): Promise<void> {
  const file = formData.get("berkas");
  if (!(file instanceof File) || file.size === 0) throw new Error("Pilih dokumen PDF.");
  await saveLaporanKeuanganDokumen({
    metadata: {
      tipe: formData.get("tipe"),
      judul: formData.get("judul"),
      tahun: formData.get("tahun"),
      semester: formData.get("semester"),
    },
    berkas: { nama: file.name, tipe: file.type, isi: new Uint8Array(await file.arrayBuffer()) },
  });
  revalidatePath("/keuangan/dokumen");
  revalidatePath("/keuangan/laporan");
  redirect("/keuangan/dokumen?tersimpan=1");
}

export async function tandaiDokumenLaporanAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id < 1) throw new Error("ID dokumen tidak valid.");
  const tanggal = String(formData.get("diserahkanPada") ?? "");
  await setLaporanKeuanganDiserahkan(id, tanggal || null);
  revalidatePath("/keuangan/dokumen");
  redirect("/keuangan/dokumen?diperbarui=1");
}

export async function hapusDokumenLaporanAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id < 1) throw new Error("ID dokumen tidak valid.");
  await deleteLaporanKeuanganDokumen(id);
  revalidatePath("/keuangan/dokumen");
  redirect("/keuangan/dokumen?dihapus=1");
}

export async function simpanTargetRealisasiBulananAction(formData: FormData): Promise<void> {
  const tahun = Number(formData.get("tahun"));
  const rows = Array.from({ length: 12 }, (_, index) => ({
    bulan: index + 1,
    target: Number(formData.get("target:" + (index + 1)) ?? 0),
    realisasi: Number(formData.get("realisasi:" + (index + 1)) ?? 0),
  }));
  await simpanKeuanganBulanan(tahun, rows);
  revalidatePath("/keuangan");
  redirect("/keuangan?bulanan=1");
}
