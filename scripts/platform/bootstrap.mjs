#!/usr/bin/env node
/**
 * Bootstrap Super Admin platform.
 *
 * Membuat role `super-admin` (village_id NULL) bila belum ada, lalu satu akun
 * platform beserta kredensial `credential` dengan hash resmi better-auth.
 * Skrip menolak berjalan bila sudah ada akun platform, sehingga tidak mungkin
 * menambah admin kedua tanpa sengaja lewat jalur ini.
 *
 * Kredensial dibaca dari environment, bukan argumen, agar tidak tersimpan di
 * riwayat shell:
 *   PLATFORM_ADMIN_NAME, PLATFORM_ADMIN_USERNAME, PLATFORM_ADMIN_EMAIL,
 *   PLATFORM_ADMIN_PASSWORD
 *
 * Jalankan: npm run platform:bootstrap
 */
import { randomUUID } from "node:crypto";
import nextEnv from "@next/env";
import { hashPassword } from "better-auth/crypto";
import mysql from "mysql2/promise";

nextEnv.loadEnvConfig(process.cwd());

const SLUG_ROLE = "super-admin";
const SANDI_MINIMAL = 12;
const SANDI_MAKSIMAL = 72;

function ambilInput() {
  const nama = (process.env.PLATFORM_ADMIN_NAME ?? "").trim();
  const username = (process.env.PLATFORM_ADMIN_USERNAME ?? "").trim().toLowerCase();
  const email = (process.env.PLATFORM_ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.PLATFORM_ADMIN_PASSWORD ?? "";
  const galat = [];

  if (nama.length < 3) galat.push("PLATFORM_ADMIN_NAME minimal 3 karakter.");
  if (nama.length > 255) galat.push("PLATFORM_ADMIN_NAME maksimal 255 karakter.");
  if (!/^[a-z0-9._-]{3,50}$/.test(username)) {
    galat.push("PLATFORM_ADMIN_USERNAME 3–50 karakter: huruf kecil, angka, titik, garis.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
    galat.push("PLATFORM_ADMIN_EMAIL tidak valid.");
  }
  if (password.length < SANDI_MINIMAL || password.length > SANDI_MAKSIMAL) {
    galat.push(`PLATFORM_ADMIN_PASSWORD wajib ${SANDI_MINIMAL}–${SANDI_MAKSIMAL} karakter.`);
  }

  if (galat.length > 0) {
    throw new Error(`Environment bootstrap belum lengkap:\n- ${galat.join("\n- ")}`);
  }

  return { nama, username, email, password };
}

function opsiKoneksi() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum diisi.");

  const parsed = new URL(url);
  if (parsed.protocol !== "mysql:" && parsed.protocol !== "mysql2:") {
    throw new Error("DATABASE_URL harus memakai protokol mysql:.");
  }

  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (!database) throw new Error("DATABASE_URL tidak menyebutkan nama database.");

  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database,
  };
}

async function main() {
  const input = ambilInput();
  const koneksi = await mysql.createConnection(opsiKoneksi());

  try {
    const [platform] = await koneksi.query(
      "SELECT username FROM users WHERE village_id IS NULL ORDER BY id LIMIT 1",
    );
    if (platform.length > 0) {
      throw new Error(
        `Akun platform sudah ada (${platform[0].username ?? "tanpa username"}). ` +
          "Bootstrap hanya untuk instalasi baru.",
      );
    }

    const [emailDipakai] = await koneksi.query("SELECT id FROM users WHERE email = ? LIMIT 1", [
      input.email,
    ]);
    if (emailDipakai.length > 0) throw new Error("Email sudah digunakan akun lain.");

    const [usernameDipakai] = await koneksi.query(
      "SELECT id FROM users WHERE username = ? LIMIT 1",
      [input.username],
    );
    if (usernameDipakai.length > 0) throw new Error("Username sudah digunakan akun lain.");

    const passwordHash = await hashPassword(input.password);

    await koneksi.beginTransaction();
    try {
      const [peran] = await koneksi.query(
        "SELECT id FROM roles WHERE village_id IS NULL AND slug = ? LIMIT 1",
        [SLUG_ROLE],
      );

      let roleId = peran[0]?.id;
      if (!roleId) {
        const [hasil] = await koneksi.query(
          "INSERT INTO roles (village_id, name, slug, is_system) VALUES (NULL, 'Super Admin', ?, 1)",
          [SLUG_ROLE],
        );
        roleId = hasil.insertId;
      }

      const userId = randomUUID();
      await koneksi.query(
        `INSERT INTO users
           (id, name, email, email_verified, username, display_username,
            village_id, role_id, active, must_change_pin)
         VALUES (?, ?, ?, 1, ?, ?, NULL, ?, 1, 0)`,
        [userId, input.nama, input.email, input.username, input.username, roleId],
      );
      await koneksi.query(
        `INSERT INTO accounts (id, account_id, provider_id, user_id, password)
         VALUES (?, ?, 'credential', ?, ?)`,
        [randomUUID(), userId, userId, passwordHash],
      );

      await koneksi.commit();

      console.log("Super admin platform dibuat.");
      console.log(`  Nama     : ${input.nama}`);
      console.log(`  Username : ${input.username}`);
      console.log(`  Email    : ${input.email}`);
      console.log(`  Role     : ${SLUG_ROLE} (id ${roleId})`);
      console.log("  Sandi    : sesuai PLATFORM_ADMIN_PASSWORD (tidak ditampilkan).");
    } catch (error) {
      await koneksi.rollback();
      throw error;
    }
  } finally {
    await koneksi.end();
  }
}

main().catch((error) => {
  console.error(`Bootstrap gagal: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
