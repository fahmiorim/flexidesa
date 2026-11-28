#!/usr/bin/env node
/**
 * Tambah template ketiga "Cakrawala" (published, varian terang-editorial).
 * Idempotent: bila slug sudah ada, tidak menambah lagi.
 * Dijalankan: node scripts/platform/tambah-template-cakrawala.mjs
 */
import nextEnv from "@next/env";
import mysql from "mysql2/promise";

nextEnv.loadEnvConfig(process.cwd());

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL belum diisi.");

const tokens = {
  primary: "#a93526",
  secondary: "#1f4c38",
  accent: "#a93526",
  background: "#faf7f0",
  surface: "#fffdf8",
  text: "#202126",
  fontHeading: "serif",
  radius: "kecil",
  style: "terang",
  layout: "modern",
  judulHero: "Portal Desa Digital",
  subHero:
    "Layanan administrasi, informasi, dan keterbukaan data desa dapat diakses kapan saja melalui perangkat warga.",
  taglineFooter: "Portal terang-editorial untuk warga desa — cepat, transparan, dan mudah diakses.",
};

const conn = await mysql.createConnection(url);
try {
  const [rows] = await conn.query("SELECT id FROM website_templates WHERE slug = ?", ["cakrawala"]);
  if (rows.length > 0) {
    console.log("Template sudah ada (id=" + rows[0].id + "), dilewati.");
    process.exit(0);
  }

  const [res] = await conn.query(
    `INSERT INTO website_templates (slug, name, category, description, version, status, tokens, tags, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [
      "cakrawala",
      "Cakrawala",
      "pedesaan",
      "Varian terang-editorial: kertas gading, tajuk serif, aksen bata dengan hijau botol — paket kode `cakrawala@1.0.0`.",
      "1.0.0",
      "published",
      JSON.stringify(tokens),
      JSON.stringify(["pedesaan", "terang", "editorial"]),
    ],
  );
  const id = res.insertId;
  await conn.query(
    `INSERT INTO website_template_versions (template_id, version, changelog, tokens) VALUES (?, ?, ?, ?)`,
    [id, "1.0.0", "Versi awal template.", JSON.stringify(tokens)],
  );
  console.log("Template dibuat: cakrawala (id=" + id + ", published)");
} finally {
  await conn.end();
}
