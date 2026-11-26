"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  hapusBulananAnak,
  hapusIbuHamil,
  hapusKia,
  hapusPosyandu,
  hapusSasaranPaud,
  tambahBulananAnak,
  tambahIbuHamil,
  tambahKia,
  tambahPosyandu,
  tambahSasaranPaud,
  ubahBulananAnak,
  ubahIbuHamil,
  ubahKia,
  ubahPosyandu,
  ubahSasaranPaud,
} from "@/features/kependudukan/kesehatan/application/kia-use-cases";
import { BULAN_PAUD } from "@/features/kependudukan/kesehatan/domain/kesehatan";

const RUTE = "/kependudukan/stunting";

function tab(tab: string): never {
  revalidatePath(RUTE);
  redirect(`${RUTE}?tab=${tab}`);
}

function bool(formData: FormData, key: string) {
  return formData.get(key) === "ya";
}

function numOrNull(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  if (raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

// --- Posyandu ---

export async function simpanPosyanduAction(formData: FormData): Promise<never> {
  const idRaw = String(formData.get("id") ?? "").trim();
  const payload = {
    nama: str(formData, "nama"),
    alamat: str(formData, "alamat"),
    namaKetua: str(formData, "namaKetua"),
    namaBidan: str(formData, "namaBidan"),
  };
  if (idRaw === "") {
    await tambahPosyandu(payload);
  } else {
    await ubahPosyandu(Number(idRaw), payload);
  }
  tab("posyandu");
}

export async function hapusPosyanduAction(formData: FormData): Promise<never> {
  await hapusPosyandu(Number(formData.get("id")));
  tab("posyandu");
}

// --- KIA ---

export async function simpanKiaAction(formData: FormData): Promise<never> {
  const idRaw = String(formData.get("id") ?? "").trim();
  const payload = {
    noKia: str(formData, "noKia"),
    ibuId: Number(formData.get("ibuId")),
    anakId: str(formData, "anakId") === "" ? null : Number(formData.get("anakId")),
    hariPerkiraanLahir: str(formData, "hariPerkiraanLahir"),
  };
  if (idRaw === "") {
    await tambahKia(payload);
  } else {
    await ubahKia(Number(idRaw), payload);
  }
  tab("kia");
}

export async function hapusKiaAction(formData: FormData): Promise<never> {
  await hapusKia(Number(formData.get("id")));
  tab("kia");
}

// --- Pemantauan Ibu Hamil ---

export async function simpanIbuHamilAction(formData: FormData): Promise<never> {
  const idRaw = String(formData.get("id") ?? "").trim();
  const payload = {
    posyanduId: Number(formData.get("posyanduId")),
    kiaId: Number(formData.get("kiaId")),
    tanggalPeriksa: str(formData, "tanggalPeriksa"),
    statusKehamilan: numOrNull(formData, "statusKehamilan"),
    usiaKehamilan: numOrNull(formData, "usiaKehamilan"),
    tanggalMelahirkan: str(formData, "tanggalMelahirkan"),
    pemeriksaanKehamilan: bool(formData, "pemeriksaanKehamilan"),
    konsumsiPilFe: bool(formData, "konsumsiPilFe"),
    butirPilFe: numOrNull(formData, "butirPilFe"),
    pemeriksaanNifas: bool(formData, "pemeriksaanNifas"),
    konselingGizi: bool(formData, "konselingGizi"),
    kunjunganRumah: bool(formData, "kunjunganRumah"),
    aksesAirBersih: bool(formData, "aksesAirBersih"),
    kepemilikanJamban: bool(formData, "kepemilikanJamban"),
    jaminanKesehatan: bool(formData, "jaminanKesehatan"),
  };
  if (idRaw === "") {
    await tambahIbuHamil(payload);
  } else {
    await ubahIbuHamil(Number(idRaw), payload);
  }
  tab("ibu-hamil");
}

export async function hapusIbuHamilAction(formData: FormData): Promise<never> {
  await hapusIbuHamil(Number(formData.get("id")));
  tab("ibu-hamil");
}

// --- Pemantauan Anak ---

export async function simpanAnakAction(formData: FormData): Promise<never> {
  const idRaw = String(formData.get("id") ?? "").trim();
  const payload = {
    posyanduId: Number(formData.get("posyanduId")),
    kiaId: Number(formData.get("kiaId")),
    tanggalPeriksa: str(formData, "tanggalPeriksa"),
    statusGizi: Number(formData.get("statusGizi")),
    umurBulan: Number(formData.get("umurBulan")),
    statusTikar: Number(formData.get("statusTikar")),
    pemberianImunisasiDasar: bool(formData, "pemberianImunisasiDasar"),
    pemberianImunisasiCampak: bool(formData, "pemberianImunisasiCampak"),
    pengukuranBeratBadan: bool(formData, "pengukuranBeratBadan"),
    beratBadan: numOrNull(formData, "beratBadan"),
    pengukuranTinggiBadan: bool(formData, "pengukuranTinggiBadan"),
    tinggiBadan: numOrNull(formData, "tinggiBadan"),
    konselingGiziAyah: bool(formData, "konselingGiziAyah"),
    konselingGiziIbu: bool(formData, "konselingGiziIbu"),
    kunjunganRumah: bool(formData, "kunjunganRumah"),
    airBersih: bool(formData, "airBersih"),
    kepemilikanJamban: bool(formData, "kepemilikanJamban"),
    aktaLahir: bool(formData, "aktaLahir"),
    jaminanKesehatan: bool(formData, "jaminanKesehatan"),
    pengasuhanPaud: bool(formData, "pengasuhanPaud"),
    keterangan: str(formData, "keterangan"),
  };
  if (idRaw === "") {
    await tambahBulananAnak(payload);
  } else {
    await ubahBulananAnak(Number(idRaw), payload);
  }
  tab("anak");
}

export async function hapusAnakAction(formData: FormData): Promise<never> {
  await hapusBulananAnak(Number(formData.get("id")));
  tab("anak");
}

// --- Sasaran PAUD 2-6 tahun ---

export async function simpanPaudAction(formData: FormData): Promise<never> {
  const idRaw = String(formData.get("id") ?? "").trim();
  const bulan = Object.fromEntries(
    BULAN_PAUD.map((nama) => [nama, numOrNull(formData, nama) ?? 1]),
  ) as Record<(typeof BULAN_PAUD)[number], number>;
  const payload = {
    posyanduId: Number(formData.get("posyanduId")),
    kiaId: Number(formData.get("kiaId")),
    tanggalPeriksa: str(formData, "tanggalPeriksa"),
    kategoriUsia: Number(formData.get("kategoriUsia")),
    ...bulan,
  };
  if (idRaw === "") {
    await tambahSasaranPaud(payload);
  } else {
    await ubahSasaranPaud(Number(idRaw), payload);
  }
  tab("paud");
}

export async function hapusPaudAction(formData: FormData): Promise<never> {
  await hapusSasaranPaud(Number(formData.get("id")));
  tab("paud");
}
