"use server";

import { revalidatePath } from "next/cache";

import { simpanPengaturanSuratData } from "@/features/pelayanan-persuratan/surat/application/pengaturan-surat-use-cases";
import { simpanKonfigurasiTteData } from "@/features/pelayanan-persuratan/surat/application/tte-use-cases";
import { FIELD_PENDUDUK_LUAR } from "@/features/pengaturan/pengaturan/domain/pengaturan";
import { successState, toErrorState, type ActionState } from "@/lib/action-state";

const RUTE = "/layanan-surat/persuratan/jenis-surat/pengaturan";

function angka(formData: FormData, key: string, fallback: number) {
  const nilai = String(formData.get(key) ?? "").trim();
  if (nilai === "") return fallback;
  const angka = Number(nilai.replace(",", "."));
  return Number.isFinite(angka) ? angka : fallback;
}

function teks(formData: FormData, key: string, fallback = "") {
  return String(formData.get(key) ?? fallback);
}

/** Isian penduduk luar: hanya kunci yang dikenal yang disimpan. */
function fieldPendudukLuar(formData: FormData) {
  const dipilih = new Set(formData.getAll("suratPendudukLuarField").map(String));
  return FIELD_PENDUDUK_LUAR.filter((field) => dipilih.has(field));
}

export async function simpanPengaturanSuratAction(
  _state: ActionState<null>,
  formData: FormData,
): Promise<ActionState<null>> {
  const logo = formData.get("logo");
  const berkasLogo = logo instanceof File && logo.size > 0 ? logo : null;

  try {
    await simpanPengaturanSuratData(
      {
        suratTinggiHeader: angka(formData, "suratTinggiHeader", 3.3),
        suratTinggiFooter: angka(formData, "suratTinggiFooter", 2),
        suratTemplateHeader: teks(formData, "suratTemplateHeader"),
        suratTemplateFooter: teks(formData, "suratTemplateFooter"),
        suratVerifikasiSekdes: formData.get("suratVerifikasiSekdes") === "on",
        suratVerifikasiKades: formData.get("suratVerifikasiKades") === "on",
        suratGantiDataKosong: teks(formData, "suratGantiDataKosong", "-"),
        suratFormatTanggal: teks(formData, "suratFormatTanggal", "indonesia"),
        suratPanjangNomor: angka(formData, "suratPanjangNomor", 0),
        suratMarginKiri: angka(formData, "suratMarginKiri", 3),
        suratMarginAtas: angka(formData, "suratMarginAtas", 2),
        suratMarginKanan: angka(formData, "suratMarginKanan", 2),
        suratMarginBawah: angka(formData, "suratMarginBawah", 2.5),
        suratPendudukLuarField: fieldPendudukLuar(formData),
        suratGarisGanda: formData.get("suratGarisGanda") === "on",
        suratLogoLebar: angka(formData, "suratLogoLebar", 10),
        suratLogoPosisi: teks(formData, "suratLogoPosisi", "kiri"),
      },
      { berkas: berkasLogo, hapus: formData.get("hapusLogo") === "1" },
    );
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath(RUTE);
  return successState("Pengaturan surat tersimpan.");
}

export async function simpanTteSuratAction(
  _state: ActionState<null>,
  formData: FormData,
): Promise<ActionState<null>> {
  try {
    await simpanKonfigurasiTteData({
      mode: teks(formData, "mode", "nonaktif") as "nonaktif" | "manual" | "bsre",
      api: teks(formData, "api"),
      username: teks(formData, "username"),
      nik: teks(formData, "nik"),
      aktif: formData.get("aktif") === "on",
    });
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath(RUTE);
  return successState("Konfigurasi TTE tersimpan.");
}
