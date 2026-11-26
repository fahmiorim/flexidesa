import { EventEmitter } from "node:events";
import { PassThrough, type Readable } from "node:stream";
import { gunzipSync } from "node:zlib";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSqlBackup } from "./backup";

const uji = vi.hoisted(() => ({
  output: "CREATE TABLE uji (id INT);",
  stderr: "",
  exitCode: 0,
  spawnError: "",
  holdOpen: false,
  kill: vi.fn(),
}));

vi.mock("node:child_process", async (importOriginal) => {
  const asli = (await importOriginal()) as Record<string, unknown>;
  const spawn = vi.fn(() => {
    const stdout = new PassThrough();
    const stderr = new PassThrough();
    const child = Object.assign(new EventEmitter(), {
      stdout,
      stderr,
      stdin: new PassThrough(),
      kill: uji.kill,
    });

    queueMicrotask(() => {
      if (uji.spawnError) {
        child.emit("error", new Error(uji.spawnError));
        return;
      }
      child.emit("spawn");
      if (uji.holdOpen) return;
      if (uji.stderr) stderr.write(uji.stderr);
      stderr.end();
      stdout.end(Buffer.from(uji.output));
      queueMicrotask(() => child.emit("close", uji.exitCode));
    });

    return child;
  });

  return { ...asli, spawn };
});

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  env: { DATABASE_URL: "mysql://pengguna:rahasia%40ku@db.contoh:3307/desa" },
}));

async function kumpulkan(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

beforeEach(() => {
  uji.output = "CREATE TABLE uji (id INT);";
  uji.stderr = "";
  uji.exitCode = 0;
  uji.spawnError = "";
  uji.holdOpen = false;
  uji.kill.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("createSqlBackup", () => {
  it("streams the SQL dump and resolves completion after a successful process exit", async () => {
    const backup = await createSqlBackup();

    await expect(kumpulkan(backup.stream)).resolves.toEqual(Buffer.from(uji.output));
    await expect(backup.selesai).resolves.toBeUndefined();
  });

  it("streams gzip output without buffering the SQL dump", async () => {
    const backup = await createSqlBackup({ gzip: true });

    const bytes = await kumpulkan(backup.stream);
    await expect(backup.selesai).resolves.toBeUndefined();
    expect(gunzipSync(bytes).toString()).toBe(uji.output);
    expect(backup.mime).toBe("application/gzip");
  });

  it("fails the stream and completion promise when mysqldump exits unsuccessfully", async () => {
    uji.exitCode = 2;
    uji.stderr = "mysqldump gagal";
    const backup = await createSqlBackup();

    await expect(kumpulkan(backup.stream)).rejects.toThrow("mysqldump gagal");
    await expect(backup.selesai).rejects.toThrow("mysqldump gagal");
  });

  it("fails completion when mysqldump cannot start", async () => {
    uji.spawnError = "binary tidak ditemukan";
    await expect(createSqlBackup()).rejects.toThrow("binary tidak ditemukan");
  });

  it("kills mysqldump when the response consumer cancels the stream", async () => {
    uji.holdOpen = true;
    const backup = await createSqlBackup();
    const completion = expect(backup.selesai).rejects.toThrow("dibatalkan");
    backup.stream.destroy();
    await completion;

    expect(uji.kill).toHaveBeenCalled();
  });
});
