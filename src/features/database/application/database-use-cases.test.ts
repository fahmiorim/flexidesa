import { Readable } from "node:stream";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as audit from "@/features/audit/application/audit-use-cases";
import * as gate from "@/features/multi-desa/application/provisioning-use-cases";

import * as backup from "../infrastructure/backup";
import * as restore from "../infrastructure/restore";
import * as verifikasi from "../infrastructure/verifikasi-restore";
import { pulihkanBackupSql, unduhBackupSql } from "./database-use-cases";

vi.mock("@/features/multi-desa/application/provisioning-use-cases", () => ({
  requireSuperAdmin: vi.fn(),
}));
vi.mock("@/features/audit/application/audit-use-cases", () => ({ recordAuditEvent: vi.fn() }));
vi.mock("../infrastructure/backup", () => ({ createSqlBackup: vi.fn() }));
vi.mock("../infrastructure/restore", () => ({ restoreSqlDump: vi.fn(async () => {}) }));
vi.mock("../infrastructure/verifikasi-restore", () => ({
  verifikasiPascaRestore: vi.fn(async () => {}),
}));

const platform = { id: "u-platform", villageId: null } as never;

function input(overrides: Partial<Parameters<typeof pulihkanBackupSql>[0]> = {}) {
  return {
    filename: "backup.sql",
    stream: Readable.from([Buffer.from("SELECT 1;")]),
    konfirmasi: true,
    ...overrides,
  };
}

describe("pulihkanBackupSql", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(gate.requireSuperAdmin).mockResolvedValue(platform);
  });

  it("menolak pemanggil yang bukan pengelola platform", async () => {
    vi.mocked(gate.requireSuperAdmin).mockRejectedValueOnce(new Error("Hanya super admin"));

    await expect(pulihkanBackupSql(input())).rejects.toThrow("Hanya super admin");
    expect(restore.restoreSqlDump).not.toHaveBeenCalled();
  });

  it("menolak restore tanpa konfirmasi", async () => {
    await expect(pulihkanBackupSql(input({ konfirmasi: false }))).rejects.toThrow("Konfirmasi");
    expect(restore.restoreSqlDump).not.toHaveBeenCalled();
  });

  it("menolak ekstensi selain sql/sql.gz", async () => {
    await expect(pulihkanBackupSql(input({ filename: "backup.zip" }))).rejects.toThrow(".sql");
    expect(restore.restoreSqlDump).not.toHaveBeenCalled();
  });

  it("menjalankan restore, verifikasi skema, lalu audit", async () => {
    const data = input();
    await pulihkanBackupSql(data);

    expect(restore.restoreSqlDump).toHaveBeenCalledWith(data.stream, { gzip: false });
    expect(verifikasi.verifikasiPascaRestore).toHaveBeenCalled();
    expect(audit.recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: "database.restore", villageId: null }),
    );
  });

  it("meneruskan flag gzip untuk berkas .sql.gz", async () => {
    const data = input({ filename: "backup.sql.gz" });
    await pulihkanBackupSql(data);

    expect(restore.restoreSqlDump).toHaveBeenCalledWith(data.stream, { gzip: true });
  });

  it("tidak mengaudit bila verifikasi skema gagal", async () => {
    vi.mocked(verifikasi.verifikasiPascaRestore).mockRejectedValueOnce(
      new Error("Restore tidak lengkap"),
    );

    await expect(pulihkanBackupSql(input())).rejects.toThrow("tidak lengkap");
    expect(audit.recordAuditEvent).not.toHaveBeenCalled();
  });
});

describe("unduhBackupSql", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(gate.requireSuperAdmin).mockResolvedValue(platform);
    vi.mocked(backup.createSqlBackup).mockResolvedValue({
      stream: Readable.from([Buffer.from("dump")]),
      selesai: Promise.resolve(),
      filename: "backup.sql.gz",
      mime: "application/gzip",
    });
  });

  it("menolak administrator desa sebelum membuat dump", async () => {
    vi.mocked(gate.requireSuperAdmin).mockRejectedValueOnce(new Error("Hanya super admin"));

    await expect(unduhBackupSql()).rejects.toThrow("Hanya super admin");
    expect(backup.createSqlBackup).not.toHaveBeenCalled();
  });

  it("mencatat audit tanpa desa untuk pengelola platform", async () => {
    let tandaiSelesai: (() => void) | undefined;
    const proses = new Promise<void>((resolve) => {
      tandaiSelesai = resolve;
    });
    vi.mocked(backup.createSqlBackup).mockResolvedValueOnce({
      stream: Readable.from([Buffer.from("dump")]),
      selesai: proses,
      filename: "backup.sql.gz",
      mime: "application/gzip",
    });

    const hasil = await unduhBackupSql();

    expect(audit.recordAuditEvent).not.toHaveBeenCalled();
    tandaiSelesai?.();
    await hasil.selesai;

    expect(audit.recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: "database.backup", villageId: null }),
    );
  });

  it("tidak mencatat backup bila proses dump gagal", async () => {
    const selesai = Promise.reject(new Error("mysqldump gagal"));
    vi.mocked(backup.createSqlBackup).mockResolvedValueOnce({
      stream: Readable.from([]),
      selesai,
      filename: "backup.sql.gz",
      mime: "application/gzip",
    });

    const hasil = await unduhBackupSql();

    await expect(hasil.selesai).rejects.toThrow("mysqldump gagal");
    expect(audit.recordAuditEvent).not.toHaveBeenCalled();
  });
});
