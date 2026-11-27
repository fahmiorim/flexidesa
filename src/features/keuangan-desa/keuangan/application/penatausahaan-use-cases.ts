import "server-only";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import {
  hitungRingkasanJurnal,
  jurnalFormSchema,
  saldoBankFormSchema,
  susunBukuKasUmum,
  totalSaldoAwal,
} from "@/features/keuangan-desa/keuangan/domain/jurnal";
import {
  KEUANGAN_RESOURCE,
  numberToMoney,
} from "@/features/keuangan-desa/keuangan/domain/keuangan";
import { listKeuanganTahunTersedia } from "@/features/keuangan-desa/keuangan/infrastructure/keuangan-repository";
import {
  deleteJurnal,
  insertJurnal,
  listJurnal,
  listSaldoBank,
  listTahunJurnal,
  upsertSaldoBank,
} from "@/features/keuangan-desa/keuangan/infrastructure/penatausahaan-repository";
import { recordAuditEvent } from "@/features/pengaturan/audit/application/audit-use-cases";
import { AUDIT_EVENTS } from "@/features/pengaturan/audit/domain/audit";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { requirePermission } from "@/lib/dal";
import { conflict, notFound, validationError } from "@/lib/errors";

/**
 * Penatausahaan keuangan desa.
 *
 * Jurnal mencatat setiap mutasi kas (debet menambah, kredit mengurangi) dan
 * buku kas umum menurunkannya menjadi saldo berjalan. Tidak ada angka yang
 * ditulis balik ke pagu APBDes: penatausahaan hanya membaca/menambah catatan
 * kas, sehingga laporan anggaran tetap berasal dari tabel `keuangan`.
 */

const TAHUN_MIN = 2000;
const TAHUN_MAX = 2100;

function tahunValid(value: number): boolean {
  return Number.isInteger(value) && value >= TAHUN_MIN && value <= TAHUN_MAX;
}

function tahunTerpilih(tahunParam: number | undefined, tersedia: number[]): number {
  if (tahunParam !== undefined && tahunValid(tahunParam)) return tahunParam;
  return tersedia.at(-1) ?? new Date().getFullYear();
}

function namaPengguna(user: { name: string; username: string | null; email: string }) {
  return user.name || user.username || user.email;
}

/** Data halaman penatausahaan: jurnal, saldo awal bank, dan ringkasan. */
export async function getPenatausahaan(tahunParam?: number) {
  const user = await requirePermission(KEUANGAN_RESOURCE, "read");
  const villageId = await resolveVillageId(user);

  const [tahunAnggaran, tahunJurnal] = await Promise.all([
    listKeuanganTahunTersedia(villageId),
    listTahunJurnal(villageId),
  ]);
  const tersedia = [...new Set([...tahunAnggaran, ...tahunJurnal])].sort((a, b) => a - b);
  const tahun = tahunTerpilih(tahunParam, tersedia);

  const [jurnal, saldoBank] = await Promise.all([
    listJurnal(villageId, tahun),
    listSaldoBank(villageId, tahun),
  ]);

  return {
    tahun,
    tersedia,
    jurnal,
    saldoBank,
    ringkasan: hitungRingkasanJurnal(jurnal),
    saldoAwalBank: totalSaldoAwal(saldoBank),
    akses: {
      bolehTambah: hasPermission(user.permissions, KEUANGAN_RESOURCE, "create"),
      bolehHapus: hasPermission(user.permissions, KEUANGAN_RESOURCE, "delete"),
      bolehUbahSaldo: hasPermission(user.permissions, KEUANGAN_RESOURCE, "update"),
    },
  };
}

/** Buku kas umum satu tahun anggaran beserta saldo berjalan. */
export async function getBukuKasUmum(tahunParam?: number) {
  const user = await requirePermission(KEUANGAN_RESOURCE, "read");
  const villageId = await resolveVillageId(user);

  const [tahunAnggaran, tahunJurnal] = await Promise.all([
    listKeuanganTahunTersedia(villageId),
    listTahunJurnal(villageId),
  ]);
  const tersedia = [...new Set([...tahunAnggaran, ...tahunJurnal])].sort((a, b) => a - b);
  const tahun = tahunTerpilih(tahunParam, tersedia);

  const [jurnal, saldoBank] = await Promise.all([
    listJurnal(villageId, tahun),
    listSaldoBank(villageId, tahun),
  ]);

  return {
    tahun,
    tersedia,
    buku: susunBukuKasUmum(jurnal, totalSaldoAwal(saldoBank)),
  };
}

/** Tambah satu mutasi jurnal; masukan mentah divalidasi di sini. */
export async function simpanJurnalData(input: unknown): Promise<number> {
  const user = await requirePermission(KEUANGAN_RESOURCE, "create");
  const villageId = await resolveVillageId(user);

  const hasil = jurnalFormSchema.safeParse(input);
  if (!hasil.success) {
    throw validationError(hasil.error.issues[0]?.message ?? "Data jurnal tidak valid.");
  }
  const data = hasil.data;
  if (!tahunValid(data.tahun)) throw conflict("Tahun anggaran tidak valid.");

  const id = await insertJurnal(villageId, {
    tahun: data.tahun,
    tanggal: data.tanggal,
    kodeRekening: data.kodeRekening,
    uraian: data.uraian,
    debet: numberToMoney(data.debet),
    kredit: numberToMoney(data.kredit),
    referensi: data.referensi,
    createdBy: namaPengguna(user),
  });

  await recordAuditEvent({
    villageId,
    actorId: user.id,
    event: AUDIT_EVENTS.keuanganSave,
    resource: KEUANGAN_RESOURCE,
    resourceId: String(id),
    details: { jenis: "jurnal", tahun: data.tahun },
  });

  return id;
}

/** Hapus satu baris jurnal desa sendiri. */
export async function hapusJurnalData(id: number): Promise<void> {
  const user = await requirePermission(KEUANGAN_RESOURCE, "delete");
  const villageId = await resolveVillageId(user);

  const terhapus = await deleteJurnal(villageId, id);
  if (!terhapus) throw notFound("Baris jurnal tidak ditemukan.");

  await recordAuditEvent({
    villageId,
    actorId: user.id,
    event: AUDIT_EVENTS.keuanganSave,
    resource: KEUANGAN_RESOURCE,
    resourceId: String(id),
    details: { jenis: "jurnal-hapus" },
  });
}

/** Simpan saldo awal satu rekening bank. */
export async function simpanSaldoBankData(input: unknown) {
  const user = await requirePermission(KEUANGAN_RESOURCE, "update");
  const villageId = await resolveVillageId(user);

  const hasil = saldoBankFormSchema.safeParse(input);
  if (!hasil.success) {
    throw validationError(hasil.error.issues[0]?.message ?? "Data saldo bank tidak valid.");
  }
  const data = hasil.data;
  if (!tahunValid(data.tahun)) throw conflict("Tahun anggaran tidak valid.");

  await upsertSaldoBank(villageId, {
    tahun: data.tahun,
    rekeningBank: data.rekeningBank,
    namaBank: data.namaBank,
    saldoAwal: numberToMoney(data.saldoAwal),
  });

  return { tahun: data.tahun };
}
