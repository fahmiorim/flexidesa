import "server-only";

/**
 * Query menu navigasi dan widget situs.
 *
 * Seluruh fungsi wajib menerima `villageId` dari host sehingga tidak ada
 * data yang bocor antar-desa.
 */

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { menuPublik, widget } from "@/db/schema";

export interface MenuPublikRingkas {
  id: number;
  nama: string;
  link: string;
  linkTipe: string;
  parentId: number | null;
  urut: number;
  aktif: boolean;
}

export async function listMenuPublik(
  villageId: number,
  includeInactive = false,
): Promise<MenuPublikRingkas[]> {
  const kondisi = [eq(menuPublik.villageId, villageId)];
  if (!includeInactive) kondisi.push(eq(menuPublik.aktif, true));

  return db
    .select({
      id: menuPublik.id,
      nama: menuPublik.nama,
      link: menuPublik.link,
      linkTipe: menuPublik.linkTipe,
      parentId: menuPublik.parentId,
      urut: menuPublik.urut,
      aktif: menuPublik.aktif,
    })
    .from(menuPublik)
    .where(and(...kondisi))
    .orderBy(asc(menuPublik.urut), asc(menuPublik.id));
}

/** Menambahkan baris menu publik. */
export async function createMenuPublik(
  villageId: number,
  data: {
    nama: string;
    link: string;
    linkTipe: string;
    parentId?: number | null;
    urut?: number;
    aktif?: boolean;
  },
): Promise<void> {
  await db.insert(menuPublik).values({ villageId, ...data });
}

/** Mengubah satu baris menu publik. */
export async function updateMenuPublik(
  villageId: number,
  id: number,
  data: Partial<{
    nama: string;
    link: string;
    linkTipe: string;
    parentId: number | null;
    urut: number;
    aktif: boolean;
  }>,
): Promise<void> {
  await db
    .update(menuPublik)
    .set(data)
    .where(and(eq(menuPublik.villageId, villageId), eq(menuPublik.id, id)));
}

/** Menghapus satu baris menu publik. */
export async function deleteMenuPublik(villageId: number, id: number): Promise<void> {
  await db
    .delete(menuPublik)
    .where(and(eq(menuPublik.villageId, villageId), eq(menuPublik.id, id)));
}

/* ---------------------------------------------------------------- widget */

interface WidgetRingkas {
  id: number;
  judul: string | null;
  isi: string | null;
  jenis: number;
  pengaturan: string | null;
  urut: number;
  aktif: boolean;
}

interface WidgetInput {
  judul: string | null;
  isi: string | null;
  jenis: number;
  pengaturan: string | null;
  urut: number;
  aktif: boolean;
}

export async function listWidget(
  villageId: number,
  includeInactive = false,
): Promise<WidgetRingkas[]> {
  const kondisi = [eq(widget.villageId, villageId)];
  if (!includeInactive) kondisi.push(eq(widget.aktif, true));

  return db
    .select({
      id: widget.id,
      judul: widget.judul,
      isi: widget.isi,
      jenis: widget.jenis,
      pengaturan: widget.pengaturan,
      urut: widget.urut,
      aktif: widget.aktif,
    })
    .from(widget)
    .where(and(...kondisi))
    .orderBy(asc(widget.urut), asc(widget.id));
}

/** Menambahkan baris widget. */
export async function createWidget(villageId: number, data: WidgetInput): Promise<void> {
  await db.insert(widget).values({ villageId, ...data });
}

/** Mengubah satu baris widget; selalu dibatasi desa pemilik. */
export async function updateWidget(
  villageId: number,
  id: number,
  data: Partial<WidgetInput>,
): Promise<void> {
  await db
    .update(widget)
    .set(data)
    .where(and(eq(widget.villageId, villageId), eq(widget.id, id)));
}

/** Menghapus satu baris widget; selalu dibatasi desa pemilik. */
export async function deleteWidget(villageId: number, id: number): Promise<void> {
  await db.delete(widget).where(and(eq(widget.villageId, villageId), eq(widget.id, id)));
}

/* ---------------------------------------------------------------- slider */
