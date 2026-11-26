import { beforeEach, describe, expect, it, vi } from "vitest";

import { hash } from "@/features/api-eksternal/domain/api-key";
import {
  findApiKeyByHashedKey,
  touchApiKeyLastUsed,
} from "@/features/api-eksternal/infrastructure/api-key-repository";

import { authenticateApiKey } from "./authenticate";

vi.mock("@/features/api-eksternal/infrastructure/api-key-repository", () => ({
  findApiKeyByHashedKey: vi.fn(),
  touchApiKeyLastUsed: vi.fn(),
}));

const KEY = "SID_0123456789abcdef";

function record(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    villageId: 2,
    name: "Mitra",
    hashedKey: hash(KEY).toString("hex"),
    prefix: "SID_",
    rateLimit: 100,
    active: true,
    expiresAt: null,
    lastUsedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("authenticateApiKey", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(touchApiKeyLastUsed).mockResolvedValue(undefined);
  });

  it("menolak kunci yang sudah kedaluwarsa", async () => {
    vi.mocked(findApiKeyByHashedKey).mockResolvedValueOnce(
      record({ expiresAt: new Date(Date.now() - 60_000) }) as never,
    );

    await expect(authenticateApiKey(KEY)).resolves.toEqual({
      ok: false,
      status: 401,
      message: "Kunci API sudah kedaluwarsa.",
    });
    expect(touchApiKeyLastUsed).not.toHaveBeenCalled();
  });

  it("menerima kunci aktif dan mencatat pemakaian terakhir", async () => {
    vi.mocked(findApiKeyByHashedKey).mockResolvedValueOnce(record() as never);

    const hasil = await authenticateApiKey(KEY);

    expect(hasil.ok).toBe(true);
    expect(touchApiKeyLastUsed).toHaveBeenCalledWith(1);
  });

  it("menolak kunci tidak dikenal tanpa menyentuh pemakaian", async () => {
    vi.mocked(findApiKeyByHashedKey).mockResolvedValueOnce(null);

    await expect(authenticateApiKey(KEY)).resolves.toEqual({
      ok: false,
      status: 401,
      message: "Kunci API tidak valid.",
    });
    expect(touchApiKeyLastUsed).not.toHaveBeenCalled();
  });
});
