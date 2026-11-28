#!/usr/bin/env node
/**
 * Tambah template kedua "Samudra" (published, varian modern + gelap).
 * Idempotent: bila slug sudah ada, tidak menambah lagi.
 * Dijalankan: node scripts/platform/tambah-template-samudra.mjs
 */
import nextEnv from "@next/env";
import mysql from "mysql2/promise";

nextEnv.loadEnvConfig(process.cwd());

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL belum diisi.");

const tokens = {
  primary: "#0e7a6d",
  secondary: "#083344",
  accent: "#f59e0b",
  background: "#06202a",
  surface: "#0f2b36",
  text: "#e6f4f1",
  fontHeading: "sans",
  radius: "besar",
  style: "gelap",
  layout: "modern",
  judulHero: "Portal Desa Digital",
  subHero:
    "Layanan administrasi, informasi, dan keterbukaan data desa dapat diakses kapan saja melalui perangkat warga.",
  taglineFooter: "Portal modern untuk warga desa — cepat, transparan, dan mudah diakses.",
};

const conn = await mysql.createConnection(url);
try {
  const [rows] = await conn.query("SELECT id FROM website_templates WHERE slug = ?", [
    "samudra",
  ]);
  if (rows.length > 0) {
    console.log("Template sudah ada (id=" + rows[0].id + "), dilewati.");
    process.exit(0);
  }

  const [res] = await conn.query(
    `INSERT INTO website_templates (slug, name, category, description, version, status, tokens, tags, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [
      "samudra",
      "Samudra",
      "pedesaan",
      "Varian modern gelap: bilah atas lengket, hero di tengah, warna dasar teal dengan aksen amber — paket kode `samudra@1.0.0`.",
      "1.0.0",
      "published",
      JSON.stringify(tokens),
      JSON.stringify(["pedesaan", "modern", "layanan"]),
    ],
  );
  const id = res.insertId;
  await conn.query(
    `INSERT INTO website_template_versions (template_id, version, changelog, tokens) VALUES (?, ?, ?, ?)`,
    [id, "1.0.0", "Versi awal template.", JSON.stringify(tokens)],
  );
  console.log("Template dibuat: samudra (id=" + id + ", published)");
} finally {
  await conn.end();
}
