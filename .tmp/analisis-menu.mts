import fs from 'node:fs';
import { TENANT_TEMPLATE } from '../src/db/templates/tenant-template.ts';

type Row = {
  id: number | null;
  modul: string;
  slug: string;
  url: string;
  parent: number;
  urut: number | null;
  hidden: number;
  level: number | null;
  sumber: 'base' | 'tambahan';
};

const files = [
  ['D:/laragon/www/opensid/app/database/seeders/DataAwal/StrukturTabelSeeder.php', 'base'],
  ['D:/laragon/www/opensid/app/database/seeders/DataAwal/SettingModul.php', 'tambahan'],
] as const;

function parse(file: string, sumber: Row['sumber']): Row[] {
  const text = fs.readFileSync(file, 'utf8');
  const blocks = text.match(/\[\s*'(?:id|modul)'\s*=>[\s\S]*?\n\s*\],/g) ?? [];
  const rows: Row[] = [];
  for (const block of blocks) {
    const str = (key: string) => {
      const match = block.match(new RegExp(`'${key}'\\s*=>\\s*'((?:\\\\.|[^'])*)'`));
      return match ? match[1].replace(/\\'/g, "'") : null;
    };
    const num = (key: string) => {
      const match = block.match(new RegExp(`'${key}'\\s*=>\\s*(\\d+)`));
      return match ? Number(match[1]) : null;
    };
    const modul = str('modul');
    if (!modul) continue;
    rows.push({
      id: num('id'),
      modul,
      slug: str('slug') ?? '',
      url: str('url') ?? '',
      parent: num('parent') ?? 0,
      urut: num('urut'),
      hidden: num('hidden') ?? 0,
      level: num('level'),
      sumber,
    });
  }
  return rows;
}

const base = parse(files[0][0], 'base');
const tambahan = parse(files[1][0], 'tambahan');

console.log(`BASE ${base.length} baris, TAMBAHAN ${tambahan.length} baris`);

const groups = base.filter((row) => row.parent === 0).sort((a, b) => (a.urut ?? 0) - (b.urut ?? 0));
console.log('\n=== GRUP OPENSSID (BASE) ===');
for (const group of groups) {
  const children = base
    .filter((row) => row.parent === group.id)
    .sort((a, b) => (a.urut ?? 0) - (b.urut ?? 0));
  console.log(`\n[${group.id}] ${group.modul} (${group.slug}) urut=${group.urut} hidden=${group.hidden} anak=${children.length}`);
  for (const child of children) {
    console.log(`  - ${child.modul} | ${child.slug} | ${child.url} | urut=${child.urut} hidden=${child.hidden}`);
  }
}

const baseIds = new Set(base.map((row) => row.id));
const orphanParent = base.filter((row) => row.parent !== 0 && !baseIds.has(row.parent));
console.log(`\nAnak dengan parent tidak ada di base: ${orphanParent.length}`);

console.log('\n=== GRUP TAMBAHAN (SETTINGMODUL) ===');
const tambahanGroups = tambahan.filter((row) => row.parent === 0);
for (const group of tambahanGroups) {
  console.log(`[?] ${group.modul} (${group.slug}) urut=${group.urut}`);
}
console.log(`total parent=0 di tambahan: ${tambahanGroups.length}; total parent!=0: ${tambahan.filter((r) => r.parent !== 0).length}`);

console.log('\n=== MENU TENANT KITA ===');
for (const group of TENANT_TEMPLATE.modules.filter((module) => module.parentSlug === null)) {
  const children = TENANT_TEMPLATE.modules.filter((module) => module.parentSlug === group.slug);
  console.log(`\n${group.name} (${group.slug}) anak=${children.length}`);
  for (const child of children) console.log(`  - ${child.name} | ${child.slug}`);
}

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/\[[^\]]*\]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

console.log('\n=== LABEL BASE YANG TIDAK PUNYA PADANAN PERSIS DI TENANT ===');
const tenantNames = new Set(TENANT_TEMPLATE.modules.map((module) => normalize(module.name)));
for (const group of groups) {
  for (const child of base.filter((row) => row.parent === group.id)) {
    if (!tenantNames.has(normalize(child.modul))) {
      console.log(`${group.modul} > ${child.modul} (${child.slug})`);
    }
  }
}

console.log('\n=== LABEL TENANT YANG TIDAK ADA DI BASE ===');
const baseNames = new Set(base.map((row) => normalize(row.modul)));
for (const module of TENANT_TEMPLATE.modules) {
  if (!baseNames.has(normalize(module.name))) console.log(`${module.parentSlug ?? '-'} > ${module.name} (${module.slug})`);
}
