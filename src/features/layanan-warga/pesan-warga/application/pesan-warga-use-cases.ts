import "server-only";

import type {
  PendudukPercakapan,
  PesanPercakapanRow,
  PesanWargaDTO,
} from "@/features/layanan-warga/pesan-warga/domain/pesan-warga";
import {
  findPendudukPercakapan,
  hitungPesanBelumDibacaWarga,
  listPesanPercakapan,
  listPesanWarga,
  tandaiDibacaOperator,
  tandaiDibacaWarga,
} from "@/features/layanan-warga/pesan-warga/infrastructure/pesan-warga-repository";

/**
 * Use case pesan warga (percakapan warga ↔ operator).
 *
 * Lapisan tipis di atas repository: memvalidasi id penduduk dan menjaga
 * `villageId` eksplisit. Route wajib menentukan tenant dari sesi serta
 * membedakan sisi warga (residentId milik sendiri) dan operator (izin modul).
 */

function idValid(id: number, label = "Id penduduk"): number {
  if (!Number.isInteger(id) || id <= 0) throw new Error(`${label} tidak valid.`);
  return id;
}

export async function ambilPendudukPercakapan(
  villageId: number,
  residentId: number,
): Promise<PendudukPercakapan | null> {
  return findPendudukPercakapan(villageId, idValid(residentId));
}

export async function daftarPesanWarga(
  villageId: number,
  residentId: number,
): Promise<PesanWargaDTO[]> {
  return listPesanWarga(villageId, idValid(residentId));
}

export async function daftarPercakapanOperator(villageId: number): Promise<PesanPercakapanRow[]> {
  return listPesanPercakapan(villageId);
}

export async function tandaiPesanDibacaWarga(villageId: number, residentId: number): Promise<void> {
  await tandaiDibacaWarga(villageId, idValid(residentId));
}

export async function tandaiPesanDibacaOperator(
  villageId: number,
  residentId: number,
): Promise<void> {
  await tandaiDibacaOperator(villageId, idValid(residentId));
}

export async function hitungPesanBelumDibaca(
  villageId: number,
  residentId: number,
): Promise<number> {
  return hitungPesanBelumDibacaWarga(villageId, idValid(residentId));
}
