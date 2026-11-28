import "server-only";

import { requireSuperAdmin } from "@/features/multi-desa/application/provisioning-use-cases";
import {
  bandingkanVersi,
  distribusiTemplateSchema,
  websiteTemplateInputSchema,
  websiteTemplateStatusSchema,
  websiteTemplateUpdateSchema,
  type StatusTemplate,
} from "@/features/multi-desa/domain/template-website";
import {
  buatTemplateWebsite,
  distribusikanVersiTemplate,
  getTemplateWebsite,
  listDesaUntukTemplate,
  listPenggunaanTemplateWebsite,
  listTemplateWebsite,
  listVersiTemplateWebsite,
  opsiTemaTenant,
  setStatusTemplateWebsite,
  slugTemplateDipakai,
  terapkanTemplateKeDesaRepo,
  ubahTemplateWebsite,
  type DesaUntukTemplateRow,
  type PenggunaanTemplateWebsiteRow,
  type TemplateWebsiteRow,
  type VersiTemplateWebsiteRow,
} from "@/features/multi-desa/infrastructure/template-website-repository";
import { recordAuditEvent } from "@/features/pengaturan/audit/application/audit-use-cases";
import { AUDIT_EVENTS } from "@/features/pengaturan/audit/domain/audit";
import { conflict, notFound } from "@/lib/errors";
import { migrasiOpsiUntukTema } from "@/themes/migrasi";
import { resolveTema, slugTerdaftar } from "@/themes/registry";

/**
 * Katalog tema website platform.
 *
 * Semua fungsi memanggil `requireSuperAdmin` sebelum membaca atau menulis.
 * Katalog ini tidak mengunggah kode: template hanya menyimpan metadata dan token
 * tampilan tervalidasi. Distribusi versi dibatasi pada tenant yang benar-benar
 * memakai slug template tersebut.
 */

/** Subtree `templateOptions` dari JSON `theme.opsi` tenant. */
function opsiTersimpan(raw: string | null | undefined): Record<string, unknown> | null {
  try {
    const root: unknown = JSON.parse(raw ?? "{}");
    if (!root || typeof root !== "object" || Array.isArray(root)) return null;
    const opsi = (root as Record<string, unknown>).templateOptions;
    return opsi && typeof opsi === "object" && !Array.isArray(opsi)
      ? (opsi as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

interface DetailTemplateWebsite {
  template: TemplateWebsiteRow;
  versi: VersiTemplateWebsiteRow[];
  penggunaan: PenggunaanTemplateWebsiteRow[];
}

export async function daftarTemplateWebsite(): Promise<TemplateWebsiteRow[]> {
  await requireSuperAdmin();
  return listTemplateWebsite();
}

export async function ambilTemplateWebsite(id: number): Promise<DetailTemplateWebsite | null> {
  await requireSuperAdmin();
  if (!Number.isSafeInteger(id) || id <= 0) return null;

  const template = await getTemplateWebsite(id);
  if (!template) return null;

  const [versi, penggunaan] = await Promise.all([
    listVersiTemplateWebsite(template.id),
    listPenggunaanTemplateWebsite(template),
  ]);

  return { template, versi, penggunaan };
}

export async function buatTemplateWebsiteBaru(input: unknown): Promise<{ id: number }> {
  const user = await requireSuperAdmin();
  const parsed = websiteTemplateInputSchema.parse(input);

  // Katalog hanya menerbitkan paket yang sudah ada di registry statis:
  // slug bebas tanpa paket kode ditolak agar tidak ada tema tak duplikasi.
  if (!slugTerdaftar().has(parsed.slug) || !resolveTema(parsed.slug, parsed.version)) {
    throw conflict(
      "Template hanya dapat dibuat untuk pasangan slug/versi yang sudah dikodekan (ada di registry statis).",
    );
  }

  if (await slugTemplateDipakai(parsed.slug)) {
    throw conflict("Slug template sudah digunakan.");
  }

  const hasil = await buatTemplateWebsite({
    ...parsed,
    createdBy: user.id,
  });

  await recordAuditEvent({
    villageId: null,
    actorId: user.id,
    event: AUDIT_EVENTS.websiteTemplateCreate,
    resource: "website_templates",
    resourceId: String(hasil.id),
    details: { slug: parsed.slug, version: parsed.version },
  });

  return hasil;
}

export async function ubahTemplateWebsiteData(input: unknown): Promise<{ versiBaru: boolean }> {
  const user = await requireSuperAdmin();
  const parsed = websiteTemplateUpdateSchema.parse(input);
  const sebelum = await getTemplateWebsite(parsed.id);
  if (!sebelum) throw notFound("Template website tidak ditemukan.");

  const versiBerubah = parsed.version !== sebelum.version;
  if (versiBerubah) {
    if (bandingkanVersi(parsed.version, sebelum.version) <= 0) {
      throw conflict("Versi baru harus lebih tinggi dari versi saat ini.");
    }
    if (!parsed.changelog.trim()) {
      throw conflict("Catatan perubahan wajib diisi saat menaikkan versi.");
    }
  }

  const hasil = await ubahTemplateWebsite(parsed);

  await recordAuditEvent({
    villageId: null,
    actorId: user.id,
    event: AUDIT_EVENTS.websiteTemplateUpdate,
    resource: "website_templates",
    resourceId: String(parsed.id),
    details: {
      slug: sebelum.slug,
      versiLama: sebelum.version,
      versiBaru: parsed.version,
    },
  });

  return hasil;
}

export async function ubahStatusTemplateWebsiteData(
  input: unknown,
): Promise<{ status: StatusTemplate }> {
  const user = await requireSuperAdmin();
  const parsed = websiteTemplateStatusSchema.parse(input);
  const template = await getTemplateWebsite(parsed.id);
  if (!template) throw notFound("Template website tidak ditemukan.");

  await setStatusTemplateWebsite(parsed.id, parsed.status);

  await recordAuditEvent({
    villageId: null,
    actorId: user.id,
    event: AUDIT_EVENTS.websiteTemplateStatus,
    resource: "website_templates",
    resourceId: String(parsed.id),
    details: { slug: template.slug, status: parsed.status },
  });

  return { status: parsed.status };
}

export async function daftarDesaUntukTemplate(): Promise<DesaUntukTemplateRow[]> {
  await requireSuperAdmin();
  return listDesaUntukTemplate();
}

/** Ganti template aktif satu desa dari Super Admin (template harus terbit). */
export async function gantiTemplateDesa(input: {
  villageId: unknown;
  templateId: unknown;
}): Promise<{ villageId: number; templateId: number }> {
  const user = await requireSuperAdmin();
  const villageId = Number(input.villageId);
  const templateId = Number(input.templateId);
  if (!Number.isSafeInteger(villageId) || villageId <= 0) {
    throw conflict("Desa tidak valid.");
  }
  if (!Number.isSafeInteger(templateId) || templateId <= 0) {
    throw conflict("Template tidak valid.");
  }
  const template = await getTemplateWebsite(templateId);
  if (!template) throw notFound("Template website tidak ditemukan.");
  if (template.status !== "published") {
    throw conflict("Hanya template terbit yang dapat diterapkan.");
  }
  const desa = await listDesaUntukTemplate();
  if (!desa.some((item) => item.id === villageId)) {
    throw notFound("Desa tidak ditemukan.");
  }

  // Opsi tenant lama dimigrasikan ke schema paket tujuan agar ganti template
  // dari Super Admin tidak menghapus opsi yang masih berlaku.
  const [sebelum] = await opsiTemaTenant([villageId]);
  const opsiLama = opsiTersimpan(sebelum?.opsi) ?? {};
  // Warna dasar adalah identitas paket: saat pindah paket, warna lama
  // (mis. merah Cakrawala) tidak boleh terbawa ke tema baru (mis. teal Samudra).
  // Opsi lain yang netral (page-size, foto) tetap dipertahankan.
  if (sebelum && sebelum.slug !== template.slug) delete opsiLama.warna_dasar;
  const migrasi = migrasiOpsiUntukTema(template.slug, template.version, opsiLama);
  if (!migrasi) {
    throw conflict("Template ini belum memiliki paket tema berkode di registry aplikasi.");
  }
  // Nilai yang tidak dikenal schema tujuan tetap disimpan agar tidak hilang
  // diam-diam; renderer mengabaikannya, dan admin dapat memeriksanya kembali
  // bila tema lama dipulihkan. Peringatan dicatat pada audit.
  const opsiFinal = { ...opsiLama, ...migrasi.opsi };

  await terapkanTemplateKeDesaRepo(
    villageId,
    {
      slug: template.slug,
      nama: template.name,
      versi: template.version,
      tokens: template.tokens,
    },
    opsiFinal,
  );

  await recordAuditEvent({
    villageId,
    actorId: user.id,
    event: AUDIT_EVENTS.websiteTemplateDistribute,
    resource: "website_templates",
    resourceId: String(template.id),
    details: {
      slug: template.slug,
      version: template.version,
      aksi: "ganti-tenant",
      opsiTidakDipetakan: migrasi.peringatan.length,
    },
  });

  return { villageId, templateId };
}

export async function distribusikanVersiTemplateWebsite(
  input: unknown,
): Promise<{ jumlah: number }> {
  const user = await requireSuperAdmin();
  const parsed = distribusiTemplateSchema.parse(input);
  const template = await getTemplateWebsite(parsed.id);
  if (!template) throw notFound("Template website tidak ditemukan.");
  if (template.status !== "published") {
    throw conflict("Hanya template terbit yang dapat didistribusikan.");
  }

  // Validasi daftar desa terhadap tenant yang benar-benar memakai template ini.
  const penggunaan = await listPenggunaanTemplateWebsite(template);
  const diizinkan = new Set(penggunaan.map((item) => item.villageId));
  const target = [...new Set(parsed.villageIds)].filter((id) => diizinkan.has(id));
  if (target.length === 0) {
    throw conflict("Tidak ada tenant terpilih yang memakai template ini.");
  }

  // Distribusi versi juga memigrasikan opsi tenant ke schema versi baru.
  // Nilai yang tidak dikenal schema baru dipertahankan agar tidak hilang.
  const opsiBaru = new Map<number, Record<string, unknown>>();
  for (const row of await opsiTemaTenant(target)) {
    const lama = opsiTersimpan(row.opsi) ?? {};
    const migrasi = migrasiOpsiUntukTema(template.slug, template.version, lama);
    if (migrasi) opsiBaru.set(row.villageId, { ...lama, ...migrasi.opsi });
  }
  const jumlah = await distribusikanVersiTemplate(template, target, opsiBaru);

  await recordAuditEvent({
    villageId: null,
    actorId: user.id,
    event: AUDIT_EVENTS.websiteTemplateDistribute,
    resource: "website_templates",
    resourceId: String(template.id),
    details: {
      slug: template.slug,
      version: template.version,
      jumlahTenant: jumlah,
    },
  });

  return { jumlah };
}
