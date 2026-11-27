import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { keuanganJurnal, keuanganSaldoBank } from "@/db/schema";
import type { JurnalBaris } from "@/features/keuangan-desa/keuangan/domain/jurnal";

/**
 * Akses data penatausahaan keuangan: jurnal kas dan saldo awal bank.
 *
 * Seluruh fungsi menerima `villageId` dari pemanggil (use case) dan memakainya
 * sebagai syarat mutlak, sehingga baris desa lain tidak pernah terbaca atau
 * tertimpa.
 */

export interface SaldoBankBaris {
  id: number;
  rekeningBank: string;
  namaBank: string;
  saldoAwal: string;
}

/** Jurnal satu tahun anggaran, urut tanggal lalu id. */
export async function listJurnal(villageId: number, tahun: number): Promise<JurnalBaris[]> {
  return db
    .select({
      id: keuanganJurnal.id,
      tahun: keuanganJurnal.tahun,
      tanggal: keuanganJurnal.tanggal,
      kodeRekening: keuanganJurnal.kodeRekening,
      uraian: keuanganJurnal.uraian,
      debet: keuanganJurnal.debet,
      kredit: keuanganJurnal.kredit,
      sumber: keuanganJurnal.sumber,
      referensi: keuanganJurnal.referensi,
    })
    .from(keuanganJurnal)
    .where(and(eq(keuanganJurnal.villageId, villageId), eq(keuanganJurnal.tahun, tahun)))
    .orderBy(asc(keuanganJurnal.tanggal), asc(keuanganJurnal.id));
}

/** Tahun anggaran yang sudah memiliki jurnal pada desa ini. */
export async function listTahunJurnal(villageId: number): Promise<number[]> {
  const rows = await db
    .selectDistinct({ tahun: keuanganJurnal.tahun })
    .from(keuanganJurnal)
    .where(eq(keuanganJurnal.villageId, villageId))
    .orderBy(asc(keuanganJurnal.tahun));
  return rows.map((row) => row.tahun);
}

export interface JurnalInput {
  tahun: number;
  tanggal: string;
  kodeRekening: string;
  uraian: string;
  debet: string;
  kredit: string;
  referensi?: string;
  createdBy: string;
}

/** Simpan satu mutasi jurnal; id baris baru dikembalikan. */
export async function insertJurnal(villageId: number, input: JurnalInput): Promise<number> {
  const [inserted] = await db
    .insert(keuanganJurnal)
    .values({
      villageId,
      tahun: input.tahun,
      tanggal: input.tanggal,
      kodeRekening: input.kodeRekening,
      uraian: input.uraian,
      debet: input.debet,
      kredit: input.kredit,
      sumber: "manual",
      referensi: input.referensi ?? null,
      createdBy: input.createdBy,
    })
    .$returningId();

  if (!inserted) throw new Error("Gagal menyimpan jurnal keuangan.");
  return inserted.id;
}

/** Hapus satu baris jurnal milik desa; `false` bila tidak ada. */
export async function deleteJurnal(villageId: number, id: number): Promise<boolean> {
  const res = await db
    .delete(keuanganJurnal)
    .where(and(eq(keuanganJurnal.villageId, villageId), eq(keuanganJurnal.id, id)));
  return Number((res as { affectedRows?: number }).affectedRows ?? 0) > 0;
}

/** Saldo awal bank per rekening pada satu tahun anggaran. */
export async function listSaldoBank(villageId: number, tahun: number): Promise<SaldoBankBaris[]> {
  return db
    .select({
      id: keuanganSaldoBank.id,
      rekeningBank: keuanganSaldoBank.rekeningBank,
      namaBank: keuanganSaldoBank.namaBank,
      saldoAwal: keuanganSaldoBank.saldoAwal,
    })
    .from(keuanganSaldoBank)
    .where(and(eq(keuanganSaldoBank.villageId, villageId), eq(keuanganSaldoBank.tahun, tahun)))
    .orderBy(asc(keuanganSaldoBank.namaBank), asc(keuanganSaldoBank.rekeningBank));
}

export interface SaldoBankInput {
  tahun: number;
  rekeningBank: string;
  namaBank: string;
  saldoAwal: string;
}

/** Simpan (upsert) saldo awal satu rekening bank. */
export async function upsertSaldoBank(villageId: number, input: SaldoBankInput): Promise<void> {
  await db
    .insert(keuanganSaldoBank)
    .values({
      villageId,
      tahun: input.tahun,
      rekeningBank: input.rekeningBank,
      namaBank: input.namaBank,
      saldoAwal: input.saldoAwal,
    })
    .onDuplicateKeyUpdate({
      set: {
        namaBank: input.namaBank,
        saldoAwal: input.saldoAwal,
      },
    });
}
