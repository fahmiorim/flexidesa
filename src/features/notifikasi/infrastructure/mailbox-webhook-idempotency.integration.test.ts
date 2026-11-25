import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/db";
import { mailboxPesan, villages } from "@/db/schema";
import { siapkanDatabaseUji } from "@/testing/migrasi-uji";

import { simpanMailboxPesanWebhook } from "./mailbox-repository";

const MIGRATIONS_FOLDER = fileURLToPath(new URL("../../../db/migrations", import.meta.url));
const RUN = randomUUID().replaceAll("-", "").slice(0, 8);
let villageIds: number[] = [];

beforeAll(async () => {
  await siapkanDatabaseUji(db, { migrationsFolder: MIGRATIONS_FOLDER });
  const [villageA] = await db
    .insert(villages)
    .values({ name: `Webhook A ${RUN}`, code: `WA${RUN}` })
    .$returningId();
  if (!villageA) throw new Error("Fixture desa webhook A gagal dibuat.");
  villageIds = [villageA.id];
  const [villageB] = await db
    .insert(villages)
    .values({ name: `Webhook B ${RUN}`, code: `WB${RUN}` })
    .$returningId();
  if (!villageB) throw new Error("Fixture desa webhook B gagal dibuat.");
  villageIds.push(villageB.id);
});

afterAll(async () => {
  for (const villageId of villageIds) {
    await db.delete(mailboxPesan).where(eq(mailboxPesan.villageId, villageId));
    await db.delete(villages).where(eq(villages.id, villageId));
  }
});

describe("idempotensi webhook mailbox", () => {
  it("mengembalikan pesan yang sama untuk dua insert bersamaan dalam satu desa", async () => {
    const villageId = villageIds[0];
    if (villageId === undefined) throw new Error("Fixture desa webhook belum siap.");
    const data = {
      villageId,
      webhookEventId: `event-${RUN}-same`,
      arah: "masuk" as const,
      alamat: "warga@example.test",
      subjek: "Informasi",
      isi: "Pesan uji webhook.",
      dibaca: false,
    };

    const hasil = await Promise.all([
      simpanMailboxPesanWebhook(data),
      simpanMailboxPesanWebhook(data),
    ]);
    const rows = await db
      .select({ id: mailboxPesan.id })
      .from(mailboxPesan)
      .where(
        and(
          eq(mailboxPesan.villageId, villageId),
          eq(mailboxPesan.webhookEventId, data.webhookEventId),
        ),
      );

    expect(hasil[0]?.id).toBe(hasil[1]?.id);
    expect(hasil.filter((item) => item.created)).toHaveLength(1);
    expect(rows).toHaveLength(1);
  });

  it("mengizinkan ID event yang sama pada desa berbeda", async () => {
    const [villageA, villageB] = villageIds;
    if (villageA === undefined || villageB === undefined)
      throw new Error("Fixture desa webhook belum siap.");
    const webhookEventId = `event-${RUN}-different-village`;

    const hasil = await Promise.all(
      [villageA, villageB].map((villageId) =>
        simpanMailboxPesanWebhook({
          villageId,
          webhookEventId,
          arah: "masuk",
          alamat: "warga@example.test",
          isi: "Pesan uji webhook.",
          dibaca: false,
        }),
      ),
    );

    expect(hasil.every((item) => item.created)).toBe(true);
    expect(hasil[0]?.id).not.toBe(hasil[1]?.id);
  });
});
