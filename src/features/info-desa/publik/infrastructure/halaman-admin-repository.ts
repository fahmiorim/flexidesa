import "server-only";

/**
 * Query halaman statis, menu, dan widget (admin).
 *
 * Seluruh fungsi wajib menerima `villageId` dari sesi sehingga tidak ada
 * data yang bocor antar-desa.
 */

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { halamanStatis, menuPublik, widget } from "@/db/schema";

export async function listHalamanStatisAdmin(villageId: number) {
  return db
    .select({
      id: halamanStatis.id,
      judul: halamanStatis.judul,
      slug: halamanStatis.slug,
      aktif: halamanStatis.aktif,
    })
    .from(halamanStatis)
    .where(eq(halamanStatis.villageId, villageId));
}

export async function listHalamanStatisLengkap(villageId: number) {
  return db
    .select({
      id: halamanStatis.id,
      judul: halamanStatis.judul,
      slug: halamanStatis.slug,
      isi: halamanStatis.isi,
      aktif: halamanStatis.aktif,
      updatedAt: halamanStatis.updatedAt,
    })
    .from(halamanStatis)
    .where(eq(halamanStatis.villageId, villageId))
    .orderBy(desc(halamanStatis.updatedAt));
}

export async function cariHalamanStatisBySlug(villageId: number, slug: string) {
  const [row] = await db
    .select({ id: halamanStatis.id })
    .from(halamanStatis)
    .where(and(eq(halamanStatis.villageId, villageId), eq(halamanStatis.slug, slug)))
    .limit(1);
  return row;
}

export async function cariHalamanStatisAktifBySlug(villageId: number, slug: string) {
  const [row] = await db
    .select({ id: halamanStatis.id })
    .from(halamanStatis)
    .where(
      and(
        eq(halamanStatis.villageId, villageId),
        eq(halamanStatis.slug, slug),
        eq(halamanStatis.aktif, true),
      ),
    )
    .limit(1);
  return row;
}

export async function cariHalamanStatisById(villageId: number, id: number) {
  const [row] = await db
    .select({ id: halamanStatis.id })
    .from(halamanStatis)
    .where(and(eq(halamanStatis.villageId, villageId), eq(halamanStatis.id, id)))
    .limit(1);
  return row;
}

export async function buatHalamanStatis(
  villageId: number,
  data: { judul: string; slug: string; isi: string; aktif: boolean },
) {
  await db.insert(halamanStatis).values({ villageId, ...data });
}

export async function ubahHalamanStatis(
  villageId: number,
  id: number,
  data: { judul: string; slug: string; isi: string },
) {
  await db
    .update(halamanStatis)
    .set(data)
    .where(and(eq(halamanStatis.villageId, villageId), eq(halamanStatis.id, id)));
}

export async function ubahStatusHalamanStatis(villageId: number, id: number, aktif: boolean) {
  await db
    .update(halamanStatis)
    .set({ aktif })
    .where(and(eq(halamanStatis.villageId, villageId), eq(halamanStatis.id, id)));
}

export async function hapusHalamanStatis(villageId: number, id: number) {
  await db
    .delete(halamanStatis)
    .where(and(eq(halamanStatis.villageId, villageId), eq(halamanStatis.id, id)));
}

/* --------------------------------------------------------------- berita */

export async function cariMenuById(villageId: number, id: number) {
  const [row] = await db
    .select({ id: menuPublik.id })
    .from(menuPublik)
    .where(and(eq(menuPublik.villageId, villageId), eq(menuPublik.id, id)))
    .limit(1);
  return row;
}

/** Menu induk kandidat; `parentId` dipakai untuk menolak submenu sebagai induk. */
export async function cariMenuInduk(villageId: number, id: number) {
  const [row] = await db
    .select({ id: menuPublik.id, parentId: menuPublik.parentId })
    .from(menuPublik)
    .where(and(eq(menuPublik.villageId, villageId), eq(menuPublik.id, id)))
    .limit(1);
  return row;
}

export async function ubahMenuDetail(
  villageId: number,
  id: number,
  data: { nama: string; link: string; linkTipe: string; parentId: number | null },
) {
  await db
    .update(menuPublik)
    .set(data)
    .where(and(eq(menuPublik.villageId, villageId), eq(menuPublik.id, id)));
}

/* ------------------------------------------------------- kategori berita */

export async function cariWidgetById(villageId: number, id: number) {
  const [row] = await db
    .select({ id: widget.id })
    .from(widget)
    .where(and(eq(widget.villageId, villageId), eq(widget.id, id)))
    .limit(1);
  return row;
}

/* ------------------------------------------------------------- dokumen */
