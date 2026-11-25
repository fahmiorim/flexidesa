import { desaBaruSchema } from "./src/features/multi-desa/domain/desa-baru";
import { provisionDesa } from "./src/features/multi-desa/infrastructure/provisioning-repository";

const desa = [
  {
    name: "Kwala Gunung",
    code: "1219102009",
    domain: "kwalagunung.flexidesa.test",
    slug: "kwala-gunung",
    district: "DATUK LIMA PULUH",
    districtCode: "121910",
    regency: "BATU BARA",
    regencyCode: "1219",
    province: "SUMATERA UTARA",
    provinceCode: "12",
    adminName: "Admin Kwala Gunung",
    adminUsername: "admin-kwala-gunung",
    adminEmail: "admin@kwalagunung.flexidesa.test",
    adminPassword: "kwalagunung#2026!",
    kuotaMediaMb: null,
  },
  {
    name: "Limau Manis",
    code: "1219042018",
    domain: "limaumanis.flexidesa.test",
    slug: "perk-limau-manis",
    district: "LIMA PULUH",
    districtCode: "121904",
    regency: "BATU BARA",
    regencyCode: "1219",
    province: "SUMATERA UTARA",
    provinceCode: "12",
    adminName: "Admin Limau Manis",
    adminUsername: "admin-limau-manis",
    adminEmail: "admin@limaumanis.flexidesa.test",
    adminPassword: "limaumani#2026!",
    kuotaMediaMb: null,
  },
];

for (const input of desa) {
  const parsed = desaBaruSchema.parse(input);
  const hasil = await provisionDesa(parsed);
  console.log(`OK ${parsed.name} -> villageId=${hasil.id} username=${parsed.adminUsername}`);
}
