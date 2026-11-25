import fs from 'node:fs';
import { TENANT_TEMPLATE } from '../src/db/templates/tenant-template.ts';

type Row = {
  id: number | null;
  modul: string;
  slug: string;
  url: string;
  parent: number;
  urut: number;
  hidden: number;
  sumber: 'base' | 'tambahan';
};

const files = [
  ['D:/laragon/www/opensid/app/database/seeders/DataAwal/StrukturTabelSeeder.php', 'base'],
  ['D:/laragon/www/opensid/app/database/seeders/DataAwal/SettingModul.php', 'tambahan'],
] as const;

function parse(file: string, sumber: Row['sumber']): Row[] {
  const text = fs.readFileSync(file, 'utf8');
  const blocks = text.match(/\[\s*'(?:id|modul)'\s*=>[\s\S]*?\n\s*\],/g) ?? [];
  return blocks.flatMap((block) => {
    const str = (key: string) => {
      const match = block.match(new RegExp(`'${key}'\\s*=>\\s*'((?:\\\\.|[^'])*)'`));
      return match ? match[1].replace(/\\'/g, "'") : null;
    };
    const num = (key: string) => {
      const match = block.match(new RegExp(`'${key}'\\s*=>\\s*(\\d+)`));
      return match ? Number(match[1]) : null;
    };
    const modul = str('modul');
    if (!modul) return [];
    return [{
      id: num('id'),
      modul,
      slug: str('slug') ?? '',
      url: str('url') ?? '',
      parent: num('parent') ?? 0,
      urut: num('urut') ?? 999,
      hidden: num('hidden') ?? 0,
      sumber,
    }];
  });
}

const parsed = [...parse(files[0][0], 'base'), ...parse(files[1][0], 'tambahan')];
const bySlug = new Map<string, Row>();
for (const row of parsed) bySlug.set(row.slug, row);
const all = [...bySlug.values()];
const topGroups = all.filter((row) => row.parent === 0).sort((a, b) => a.urut - b.urut);

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/\[[^\]]*\]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const tokens = (value: string) => new Set(normalize(value).split(' ').filter((token) => token.length > 2));

function matchTenant(row: Row) {
  const exactSlug = TENANT_TEMPLATE.modules.find((module) => module.slug === row.slug);
  if (exactSlug) return { module: exactSlug, how: 'slug' };
  const name = normalize(row.modul);
  const exactName = TENANT_TEMPLATE.modules.find((module) => normalize(module.name) === name);
  if (exactName) return { module: exactName, how: 'nama' };
  const target = tokens(row.modul);
  let best: { module: (typeof TENANT_TEMPLATE.modules)[number]; score: number } | null = null;
  for (const module of TENANT_TEMPLATE.modules) {
    const candidate = tokens(module.name);
    const shared = [...target].filter((token) => candidate.has(token)).length;
    const score = shared / Math.max(target.size, 1);
    if (score >= 0.6 && (!best || score > best.score)) best = { module, score };
  }
  return best ? { module: best.module, how: 'mirip' } : null;
}

console.log('=== STRUKTUR MENU OPENSID (BASE + SETTINGMODUL) ===');
for (const group of topGroups) {
  const children = all.filter((row) => row.parent === group.id).sort((a, b) => a.urut - b.urut);
  console.log(`\n[${group.id}] ${group.modul} (${group.slug}) hidden=${group.hidden} anak=${children.length}`);
  for (const child of children) console.log(`  - ${child.modul} | ${child.slug} | ${child.url}`);
}

console.log('\n\n=== PEMETAAN KE MENU TENANT ===');
const matchedTenantSlugs = new Set<string>();
for (const group of topGroups) {
  const children = all.filter((row) => row.parent === group.id).sort((a, b) => a.urut - b.urut);
  console.log(`\n## ${group.modul} (${children.length})`);
  for (const child of children) {
    const match = matchTenant(child);
    if (match) {
      matchedTenantSlugs.add(match.module.slug);
      const groupInfo = match.module.parentSlug === group.slug ? '' : ` [grup tenant: ${match.module.parentSlug ?? '-'}]`;
      console.log(`  OK  ${child.modul} -> ${match.module.name} (${match.module.slug}) via ${match.how}${groupInfo}`);
    } else {
      console.log(`  --  ${child.modul} (${child.slug}) BELUM ADA`);
    }
  }
}

console.log('\n\n=== MENU TENANT YANG TIDAK DIPAKAI PEMETAAN ===');
for (const module of TENANT_TEMPLATE.modules) {
  if (!matchedTenantSlugs.has(module.slug)) console.log(`${module.parentSlug ?? '-'} > ${module.name} (${module.slug})`);
}
