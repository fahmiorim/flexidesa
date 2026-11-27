import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { sisaLebih, type SisaLebih } from "@/db/schema/keuangan-sisa";

export async function listSisaLebih(villageId: number): Promise<SisaLebih[]> {
  return db
    .select()
    .from(sisaLebih)
    .where(eq(sisaLebih.villageId, villageId))
    .orderBy(desc(sisaLebih.tahun));
}
