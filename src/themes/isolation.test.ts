import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function source(path: string) {
  return readFileSync(join(ROOT, path), "utf8");
}

describe("isolasi aset tema", () => {
  it("root layout hanya memuat fondasi global, bukan stylesheet paket tema", () => {
    const rootLayout = source("src/app/layout.tsx");
    expect(rootLayout).toContain('import "./globals.css";');
    expect(rootLayout).not.toMatch(/themes\/(arunika|cakrawala|samudra)\/.*\.css/);
  });

  it.each([
    ["arunika", "src/themes/arunika/1.0.0/layout.tsx", "./theme.module.css"],
    ["cakrawala", "src/themes/cakrawala/1.0.0/layout.tsx", "./cakrawala-v2.module.css"],
    ["samudra", "src/themes/samudra/1.0.0/layout.tsx", "./theme.module.css"],
  ])("%s memuat stylesheet modul dari paketnya sendiri", (_slug, layoutPath, importPath) => {
    const layout = source(layoutPath);
    expect(layout).toContain(`from "${importPath}"`);
  });

  it.each([
    ["cakrawala", "src/themes/cakrawala/1.0.0/layout.tsx", "./cakrawala-publik.css"],
    ["samudra", "src/themes/samudra/1.0.0/layout.tsx", "./samudra-publik.css"],
  ])("%s memuat stylesheet halaman publik dari paketnya sendiri", (slug, layoutPath, importPath) => {
    const layout = source(layoutPath);
    expect(layout).toContain(`import "${importPath}";`);
    expect(existsSync(join(ROOT, layoutPath.replace("layout.tsx", importPath.replace("./", ""))))).toBe(true);
    expect(source("src/app/layout.tsx")).not.toContain(`themes/${slug}/`);
  });

  it("aset preview katalog tetap berada di public/themes per tema", () => {
    for (const slug of ["arunika", "cakrawala", "samudra"]) {
      expect(existsSync(join(ROOT, "public", "themes", slug, "preview.svg"))).toBe(true);
    }
  });
});
