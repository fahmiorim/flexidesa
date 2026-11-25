import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveVillageByHost } from "@/features/desa/application/resolve-village";
import { terimaPesanEmailWebhook } from "@/features/notifikasi/application/mailbox-use-cases";

import { POST } from "./route";

const secret = "a".repeat(32);
vi.mock("@/lib/env", () => ({ env: { EMAIL_WEBHOOK_TOKEN: "a".repeat(32) } }));
vi.mock("@/features/desa/application/resolve-village", () => ({
  resolveVillageByHost: vi.fn(),
}));
vi.mock("@/features/notifikasi/application/mailbox-use-cases", () => ({
  terimaPesanEmailWebhook: vi.fn(),
}));
const payload = {
  alamat: "warga@example.test",
  subjek: "Informasi",
  isi: "Mohon informasi layanan desa.",
};

function request(
  body: unknown = payload,
  options: {
    host?: string;
    forwardedHost?: string;
    eventId?: string;
    timestamp?: string;
    signature?: string;
  } = {},
) {
  const rawBody = JSON.stringify(body);
  const timestamp = options.timestamp ?? String(Math.floor(Date.now() / 1000));
  const eventId = options.eventId ?? "event-00000001";
  const host = options.host ?? "desa.example.test";
  const signature =
    options.signature ??
    createHmac("sha256", secret)
      .update(`${timestamp}.${eventId}.${host.toLowerCase()}.${rawBody}`)
      .digest("hex");

  return new Request("https://desa.example.test/api/webhooks/email", {
    method: "POST",
    headers: {
      host,
      ...(options.forwardedHost ? { "x-forwarded-host": options.forwardedHost } : {}),
      "content-type": "application/json",
      "x-email-webhook-timestamp": timestamp,
      "x-email-webhook-id": eventId,
      "x-email-webhook-signature": signature,
    },
    body: rawBody,
  });
}

describe("POST /api/webhooks/email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resolveVillageByHost).mockResolvedValue({ id: 17 } as never);
    vi.mocked(terimaPesanEmailWebhook).mockResolvedValue({ id: 42, created: true });
  });

  it("rejects an invalid signature without resolving or storing the payload", async () => {
    const response = await POST(request(payload, { signature: "0".repeat(64) }));

    expect(response.status).toBe(401);
    expect(resolveVillageByHost).not.toHaveBeenCalled();
    expect(terimaPesanEmailWebhook).not.toHaveBeenCalled();
  });

  it("rejects stale signed events", async () => {
    const response = await POST(
      request(payload, { timestamp: String(Math.floor(Date.now() / 1000) - 301) }),
    );

    expect(response.status).toBe(401);
  });

  it("returns the saved message for a repeated event ID", async () => {
    vi.mocked(terimaPesanEmailWebhook).mockResolvedValueOnce({ id: 42, created: false });

    const response = await POST(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ id: 42 });
    expect(terimaPesanEmailWebhook).toHaveBeenCalledWith(
      expect.objectContaining({ villageId: 17, eventId: "event-00000001" }),
    );
  });

  it("allows a provider retry after the first message save fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(terimaPesanEmailWebhook)
      .mockRejectedValueOnce(new Error("database unavailable"))
      .mockResolvedValueOnce({ id: 42, created: true });

    const first = await POST(request());
    const retry = await POST(request());

    expect(first.status).toBe(500);
    expect(retry.status).toBe(201);
    log.mockRestore();
  });

  it("rejects a signed event when Host is changed to another tenant", async () => {
    const signedForA = request(payload, { host: "desa-a.example.test" });
    const altered = new Request("https://desa-b.example.test/api/webhooks/email", {
      method: "POST",
      headers: {
        ...Object.fromEntries(signedForA.headers.entries()),
        host: "desa-b.example.test",
      },
      body: JSON.stringify(payload),
    });

    const response = await POST(altered);

    expect(response.status).toBe(401);
    expect(resolveVillageByHost).not.toHaveBeenCalled();
    expect(terimaPesanEmailWebhook).not.toHaveBeenCalled();
  });

  it("uses Host and ignores a forged X-Forwarded-Host", async () => {
    const response = await POST(
      request(payload, { host: "desa-a.example.test", forwardedHost: "desa-b.example.test" }),
    );

    expect(response.status).toBe(201);
    expect(resolveVillageByHost).toHaveBeenCalledWith("desa-a.example.test");
    expect(terimaPesanEmailWebhook).toHaveBeenCalledWith({
      villageId: 17,
      eventId: "event-00000001",
      alamat: "warga@example.test",
      subjek: "Informasi",
      isi: "Mohon informasi layanan desa.",
      tanggal: undefined,
    });
  });

  it("rejects an unknown host without storing the payload", async () => {
    vi.mocked(resolveVillageByHost).mockRejectedValueOnce(new Error("unknown host"));

    const response = await POST(request(payload, { host: "attacker.example.test" }));

    expect(response.status).toBe(404);
    expect(terimaPesanEmailWebhook).not.toHaveBeenCalled();
  });
});
