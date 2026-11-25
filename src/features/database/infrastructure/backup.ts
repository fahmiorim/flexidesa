import "server-only";

import { spawn } from "node:child_process";
import { PassThrough } from "node:stream";
import { createGzip } from "node:zlib";

import { env } from "@/lib/env";

import type { BackupResult } from "../domain/database";
import { parseDatabaseUrl } from "./database-url";

export async function createSqlBackup(
  options: {
    gzip?: boolean;
  } = {},
): Promise<BackupResult> {
  const { username, password, host, port, database } = parseDatabaseUrl(env.DATABASE_URL);
  const date = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `backup-sid-${database}-${date}${options.gzip ? ".sql.gz" : ".sql"}`;
  const mime: BackupResult["mime"] = options.gzip ? "application/gzip" : "application/sql";

  const args = [
    `--host=${host}`,
    `--port=${port}`,
    `--user=${username}`,
    `--single-transaction`,
    `--routines`,
    `--triggers`,
    `--events`,
    `--hex-blob`,
    database,
  ];

  const child = spawn("mysqldump", args, {
    env: { ...process.env, MYSQL_PWD: password },
  });
  const stream = new PassThrough();
  const output = options.gzip ? child.stdout.pipe(createGzip({ level: 9 })) : child.stdout;
  let pesanGalat = "";
  let prosesTertutup = false;
  let keluaranSelesai = false;
  let kodeKeluar: number | null = null;
  let selesai = false;
  let prosesDimulai = false;
  let resolveSelesai: () => void = () => {};
  let rejectSelesai: (error: Error) => void = () => {};
  let resolveMulai: () => void = () => {};
  let rejectMulai: (error: Error) => void = () => {};

  const completion = new Promise<void>((resolve, reject) => {
    resolveSelesai = resolve;
    rejectSelesai = reject;
  });
  void completion.catch(() => {});
  const started = new Promise<void>((resolve, reject) => {
    resolveMulai = resolve;
    rejectMulai = reject;
  });

  const gagal = (error: Error) => {
    if (selesai) return;
    selesai = true;
    rejectSelesai(error);
    if (!prosesTertutup) child.kill();
    if (!stream.destroyed) stream.destroy(prosesDimulai ? error : undefined);
  };

  const periksaSelesai = () => {
    if (selesai || !prosesTertutup || !keluaranSelesai) return;
    if (kodeKeluar !== 0) {
      gagal(new Error(pesanGalat || `mysqldump gagal dengan kode ${kodeKeluar}`));
      return;
    }
    selesai = true;
    stream.end();
    resolveSelesai();
  };

  child.stderr.on("data", (chunk: Buffer) => {
    if (pesanGalat.length < 4_000)
      pesanGalat += chunk.toString().slice(0, 4_000 - pesanGalat.length);
  });
  child.once("spawn", () => {
    prosesDimulai = true;
    resolveMulai();
  });
  child.once("error", (error: Error) => {
    rejectMulai(error);
    gagal(error);
  });
  child.once("close", (code: number | null) => {
    prosesTertutup = true;
    kodeKeluar = code;
    periksaSelesai();
  });
  output.once("end", () => {
    keluaranSelesai = true;
    periksaSelesai();
  });
  output.once("error", gagal);
  stream.once("close", () => {
    if (!selesai) gagal(new Error("Unduhan backup dibatalkan."));
  });
  output.pipe(stream, { end: false });

  await started;
  return { stream, selesai: completion, filename, mime };
}
