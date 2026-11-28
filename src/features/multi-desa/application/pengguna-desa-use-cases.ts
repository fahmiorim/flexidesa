import "server-only";

import { hashPassword } from "better-auth/crypto";
import { z } from "zod";

import { requireSuperAdmin } from "@/features/multi-desa/application/provisioning-use-cases";
import { buatSandiSementara } from "@/features/multi-desa/domain/sandi-sementara";
import {
  cabutSesiPenggunaDesa as cabutSesiRepo,
  getPenggunaDesa,
  hitungPenggunaDesa,
  listPenggunaDesa,
  resetSandiPenggunaDesa as resetSandiRepo,
  setStatusPenggunaDesa,
  type FilterPenggunaDesa,
  type PenggunaDesaRow,
} from "@/features/multi-desa/infrastructure/pengguna-desa-repository";
import { recordAuditEvent } from "@/features/pengaturan/audit/application/audit-use-cases";
import { AUDIT_EVENTS } from "@/features/pengaturan/audit/domain/audit";
import { notFound } from "@/lib/errors";

/**
 * Direktori pengguna desa lintas tenant untuk Super Admin.
 *
 * Setiap fungsi memulai dengan `requireSuperAdmin()` dan hanya menyentuh akun
 * dengan `village_id IS NOT NULL`; akun platform tidak dapat diubah lewat jalur
 * ini. Mutasi dicatat ke audit trail dengan `villageId` desa pemilik akun.
 */

const idSchema = z
  .string({ error: "Pengguna tidak valid." })
  .trim()
  .min(1, "Pengguna tidak valid.")
  .max(36, "Pengguna tidak valid.");

const filterSchema = z.object({
  q: z.string().trim().max(120).optional(),
  villageId: z.coerce.number().int().positive().optional(),
  aktif: z.enum(["aktif", "nonaktif", "semua"]).optional(),
});

const statusSchema = z.object({
  id: idSchema,
  active: z
    .union([z.boolean(), z.string()])
    .transform((value) => value === true || value === "true" || value === "1" || value === "on"),
});

/** Daftar akun desa lintas tenant, dengan filter opsional. */
export async function daftarPenggunaDesa(input: unknown = {}): Promise<PenggunaDesaRow[]> {
  await requireSuperAdmin();
  const parsed = filterSchema.parse(input);

  const filter: FilterPenggunaDesa = { q: parsed.q, villageId: parsed.villageId };
  if (parsed.aktif === "aktif") filter.aktif = true;
  if (parsed.aktif === "nonaktif") filter.aktif = false;

  return listPenggunaDesa(filter);
}

/** Akun desa milik satu tenant (tab Pengguna pada detail tenant). */
export async function daftarPenggunaSatuDesa(villageId: number): Promise<PenggunaDesaRow[]> {
  await requireSuperAdmin();
  return listPenggunaDesa({ villageId });
}

/** Jumlah akun desa satu tenant. */
export async function jumlahPenggunaDesa(villageId: number): Promise<number> {
  await requireSuperAdmin();
  return hitungPenggunaDesa(villageId);
}

export async function ubahStatusPenggunaDesaDesa(input: unknown): Promise<{ active: boolean }> {
  const user = await requireSuperAdmin();
  const parsed = statusSchema.parse(input);

  const pengguna = await getPenggunaDesa(parsed.id);
  if (!pengguna) throw notFound("Pengguna desa tidak ditemukan.");

  await setStatusPenggunaDesa(parsed.id, parsed.active);

  await recordAuditEvent({
    villageId: pengguna.villageId,
    actorId: user.id,
    event: AUDIT_EVENTS.platformUserStatus,
    resource: "users",
    resourceId: parsed.id,
    details: {
      username: pengguna.username,
      email: pengguna.email,
      active: parsed.active,
      sumber: "platform",
    },
  });

  return { active: parsed.active };
}

export interface HasilResetSandiDesa {
  username: string | null;
  email: string;
  sandiSementara: string;
}

/** Reset sandi akun desa; sandi sementara hanya dikembalikan sekali. */
export async function resetSandiPenggunaDesaDesa(input: unknown): Promise<HasilResetSandiDesa> {
  const user = await requireSuperAdmin();
  const id = idSchema.parse(input);

  const pengguna = await getPenggunaDesa(id);
  if (!pengguna) throw notFound("Pengguna desa tidak ditemukan.");

  const sandiSementara = buatSandiSementara();
  await resetSandiRepo(id, await hashPassword(sandiSementara));

  await recordAuditEvent({
    villageId: pengguna.villageId,
    actorId: user.id,
    event: AUDIT_EVENTS.platformUserReset,
    resource: "users",
    resourceId: id,
    details: { username: pengguna.username, email: pengguna.email, sumber: "platform" },
  });

  return { username: pengguna.username, email: pengguna.email, sandiSementara };
}

/** Cabut seluruh sesi akun desa. */
export async function cabutSesiPenggunaDesaDesa(input: unknown): Promise<{ jumlah: number }> {
  const user = await requireSuperAdmin();
  const id = idSchema.parse(input);

  const pengguna = await getPenggunaDesa(id);
  if (!pengguna) throw notFound("Pengguna desa tidak ditemukan.");

  const jumlah = await cabutSesiRepo(id);

  await recordAuditEvent({
    villageId: pengguna.villageId,
    actorId: user.id,
    event: AUDIT_EVENTS.platformUserSessionRevoke,
    resource: "sessions",
    resourceId: id,
    details: { username: pengguna.username, jumlahSesi: jumlah, sumber: "platform" },
  });

  return { jumlah };
}
