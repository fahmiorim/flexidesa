import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { SEGERA_INFO } from "@/app/(admin)/segera/segera-info";
import { TENANT_TEMPLATE } from "@/features/multi-desa/domain/tenant-template-data";
import { ruteTersedia } from "@/features/navigation/domain/menu-tampil";

import {
  parseTemplateTenant,
  ROLE_ADMINISTRATOR,
  templateTenantSchema,
  urutkanModulIndukDulu,
  type TemplateTenant,
} from "./template-tenant";

/** Template valid minimal; setiap test hanya mengubah bagian yang diuji. */
function template(overrides: Partial<TemplateTenant> = {}): TemplateTenant {
  return {
    versi: 1,
    sumber: { jenis: "bawaan", villageId: null, dibuatPada: "2026-11-17" },
    roles: [{ slug: ROLE_ADMINISTRATOR, name: "Administrator", isSystem: true }],
    modules: [
      {
        slug: "penduduk",
        name: "Penduduk",
        url: "/kependudukan/penduduk",
        icon: null,
        isGroup: false,
        isHidden: false,
        isActive: true,
        sortOrder: 1,
        parentSlug: null,
      },
    ],
    akses: [{ roleSlug: ROLE_ADMINISTRATOR, moduleSlug: "penduduk", access: "manage" }],
    tema: { slug: "esensi", nama: "Esensi", versi: "1.0.0", opsi: null },
    menuPublik: [],
    ...overrides,
  };
}

/** Pesan gabungan dari seluruh issue validasi. */
function pesanValidasi(input: unknown): string {
  const hasil = templateTenantSchema.safeParse(input);
  if (hasil.success) return "";
  return hasil.error.issues.map((issue) => issue.message).join(" | ");
}

describe("template bawaan platform", () => {
  it("lolos validasi skema dan memuat role administrator", () => {
    const hasil = parseTemplateTenant(TENANT_TEMPLATE);

    expect(hasil.versi).toBe(1);
    expect(hasil.roles.map((role) => role.slug)).toContain(ROLE_ADMINISTRATOR);
  });
});

/**
 * Penjaga isi template yang benar-benar dikirim.
 *
 * Kesalahan di sini tidak terlihat saat typecheck karena template adalah data;
 * akibatnya baru muncul sebagai sidebar penuh label "Segera", tautan 404, atau
 * role yang tidak bisa membuka apa pun pada tenant baru.
 */
describe("template bawaan yang dikirim", () => {
  const template = parseTemplateTenant(TENANT_TEMPLATE);

  it("memuat administrator sebagai satu-satunya role sistem", () => {
    expect(template.roles.map((role) => role.slug).sort()).toEqual([
      "administrator",
      "kepala-desa",
      "operator",
      "sekretaris",
    ]);
    expect(template.roles.filter((role) => role.isSystem).map((role) => role.slug)).toEqual([
      ROLE_ADMINISTRATOR,
    ]);
  });

  it("memberi setiap role minimal satu grant dan hanya administrator memegang manage", () => {
    for (const role of template.roles) {
      const punyaGrant = template.akses.some((grant) => grant.roleSlug === role.slug);
      expect(punyaGrant, `Role "${role.slug}" tidak memiliki grant apa pun`).toBe(true);
    }

    const pemegangManage = new Set(
      template.akses.filter((grant) => grant.access === "manage").map((grant) => grant.roleSlug),
    );
    expect([...pemegangManage]).toEqual([ROLE_ADMINISTRATOR]);
  });

  it("menyusun menu tingkat atas mengikuti urutan acuan", () => {
    const atas = template.modules
      .filter((modul) => modul.parentSlug === null && !modul.isHidden)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((modul) => modul.slug);

    // Urutan acuan 12 grup: Beranda, Profil & Website Desa, Kependudukan,
    // Pelayanan & Persuratan, Kehadiran & Kepegawaian, Administrasi Desa,
    // Keuangan Desa, Pembangunan & Aset, Pertanahan & GIS, Program & Data
    // Desa, Layanan Warga, Pengaturan. Grup lama yang dibubarkan
    // (Statistik, Kesehatan, Buku Administrasi Desa, Pemetaan, Hubung Warga,
    // Admin Web, Buku Tamu) tetap tersembunyi agar grant lama tidak yatim.
    expect(atas).toEqual([
      "beranda",
      "profil-desa",
      "kependudukan",
      "layanan-surat",
      "kehadiran",
      "sekretariat",
      "keuangan",
      "pembangunan-aset",
      "pertanahan",
      "satu-data",
      "layanan-mandiri",
      "pengaturan",
    ]);
  });

  it("menghapus modul menu tanpa padanan OpenSID dari template dan izin", () => {
    const dihapus = [
      "dashboard-kependudukan",
      "kehadiran-dashboard",
      "absensi-pegawai",
      "kepegawaian",
      "surat-daftar",
      "arsip-surat",
      "tte",
      "inventaris-dashboard",
      "inventaris-pengelolaan",
      "mutasi-inventaris",
      "inventaris-laporan",
      "produk-hukum",
      "informasi-publik",
      "keuangan-dashboard",
      "realisasi-keuangan",
      "kegiatan-keuangan",
      "simbol-peta",
      "grup-kontak",
      "umpan-balik",
      "pengaturan-desa-lanjutan",
      "audit-log",
      "website-dashboard",
      "website-dokumen",
      "potensi-desa",
      "layanan-publik",
      "katalog-layanan",
      "survei-layanan",
    ];
    const slugModul = new Set(template.modules.map((modul) => modul.slug));

    for (const slug of dihapus) {
      expect(slugModul.has(slug), `Modul "${slug}" masih ada`).toBe(false);
      expect(template.akses.some((grant) => grant.moduleSlug === slug)).toBe(false);
    }
  });

  it("menampilkan seluruh modul yang tersisa, termasuk yang halamannya belum dibangun", () => {
    const izinSaja: Record<string, true> = {
      // Resource master surat dipakai halaman /layanan-surat/persuratan/jenis-surat yang
      // pintu masuknya lewat menu Pengaturan Surat; tanpa baris modul ini
      // use case-nya melempar 403.
      "jenis-surat": true,
      // Grup yang dibubarkan penataannya: modul & grant-nya tetap ada agar
      // izin lama tidak yatim, tetapi tidak tampil di sidebar.
      statistik: true,
      kesehatan: true,
      "buku-administrasi-desa": true,
      pemetaan: true,
      "hubung-warga": true,
      "admin-web": true,
      "buku-tamu": true,
      // Menunya sudah tercakup halaman lain (peta, kegiatan, inventaris, bantuan);
      // modul izinnya tetap ada agar grant lama tidak yatim.
      "peta-wilayah": true,
      "batas-wilayah": true,
      "proyek-desa": true,
      "aset-desa": true,
      "data-penerima-bantuan": true,
      // Perencanaan & aspirasi memakai alur yang sudah ada (/keuangan/kegiatan,
      // pengaduan); modul izinnya tetap ada agar grant lama tidak yatim.
      "perencanaan-pembangunan": true,
      "aspirasi-warga": true,
    };

    for (const modul of template.modules) {
      expect(modul.isActive, `Modul "${modul.slug}" tidak aktif`).toBe(true);
      if (izinSaja[modul.slug] === true) {
        expect(modul.isHidden, `Modul izin "${modul.slug}" tidak perlu tampil di menu`).toBe(true);
        expect(modul.url).toBeNull();
        continue;
      }
      expect(modul.isHidden, `Modul "${modul.slug}" disembunyikan dari menu`).toBe(false);
    }
  });

  it("menayangkan modul tanpa halaman penuh lewat placeholder /segera/[slug]", () => {
    for (const modul of template.modules) {
      if (modul.url === null) continue;

      if (modul.url.startsWith("/segera/")) {
        expect(modul.url).toBe(`/segera/${modul.slug}`);
        // Placeholder kini halaman nyata yang bisa diklik dari sidebar.
        expect(ruteTersedia(modul.url), `Placeholder "${modul.slug}" harus tersedia`).toBe(true);
        expect(
          SEGERA_INFO[modul.slug],
          `Modul Segera "${modul.slug}" belum punya info di segera-info.ts`,
        ).toMatchObject({ judul: modul.name });
        continue;
      }

      expect(
        ruteTersedia(modul.url),
        `Modul "${modul.slug}" menunjuk ${modul.url} yang belum terdaftar di RUTE_ADMIN_TERSEDIA`,
      ).toBe(true);
    }
  });

  it("membuang Dashboard Pemerintahan dan memakai slug profil-desa untuk grup", () => {
    const slugs = template.modules.map((modul) => modul.slug);

    expect(slugs).not.toContain("pemerintahan-dashboard");
    expect(template.akses.some((grant) => grant.moduleSlug === "pemerintahan-dashboard")).toBe(
      false,
    );

    // Modul izin tersembunyi `profil-desa` lama digabung ke grup "Profil &
    // Website Desa" supaya slug izin sama dengan prefiks rutenya.
    expect(slugs).not.toContain("info-desa");
    expect(template.modules.find((modul) => modul.slug === "profil-desa")).toMatchObject({
      url: null,
      isGroup: true,
      isHidden: false,
      isActive: true,
      parentSlug: null,
    });
    expect(template.modules.some((modul) => modul.parentSlug === "profil-desa")).toBe(true);
  });

  it("memindah Stunting ke Kependudukan dan menghapus modul kesehatan Covid", () => {
    const slugs = template.modules.map((modul) => modul.slug);

    expect(
      template.modules.filter((modul) => modul.parentSlug === "kesehatan").map((m) => m.slug),
    ).toEqual([]);
    expect(template.modules.find((modul) => modul.slug === "stunting")).toMatchObject({
      parentSlug: "kependudukan",
    });
    // Vaksin (`vaksin_covid`), Pendataan Covid, dan Pemantauan Covid dihapus
    // sesuai keputusan pengguna.
    for (const slug of [
      "kia",
      "pemantauan-anak",
      "vaksin",
      "covid-pendataan",
      "covid-pemantauan",
    ]) {
      expect(slugs, `Modul "${slug}" masih ada`).not.toContain(slug);
      expect(template.akses.some((grant) => grant.moduleSlug === slug)).toBe(false);
    }
  });

  it("tidak memuat menu laporan desa, statistik desa, dan rekap analisis", () => {
    const dihapus = ["laporan-desa", "statistik-desa", "rekap-analisis"];
    const slugs = template.modules.map((modul) => modul.slug);

    for (const slug of dihapus) {
      expect(slugs, `Modul "${slug}" masih ada`).not.toContain(slug);
      expect(template.akses.some((grant) => grant.moduleSlug === slug)).toBe(false);
    }
  });

  it("menautkan modul yang halamannya sudah ada ke rute nyata", () => {
    const halaman = new Map([
      ["pengaturan-desa", "/profil-desa/identitas-desa"],
      ["wilayah", "/profil-desa/wilayah-administratif"],
      ["peta", "/pemetaan/peta"],
      ["penduduk", "/kependudukan/penduduk"],
      ["calon-pemilih", "/kependudukan/penduduk/dpt"],
      ["keluarga", "/kependudukan/keluarga"],
      ["laporan-bulanan", "/kependudukan/laporan-bulanan"],
      ["laporan-penduduk", "/kependudukan/laporan-penduduk"],
      ["inventaris", "/inventaris"],
      ["bumindes", "/bumindes/buku-administrasi?golongan=A"],
      ["pengaduan", "/pengaduan-admin"],
      ["agenda-kegiatan", "/profil-desa/website/agenda"],
      ["arsip", "/layanan-surat/persuratan/arsip"],
      ["mutasi-penduduk", "/kependudukan/mutasi-penduduk"],
      ["dokumen-keuangan", "/keuangan/dokumen"],
      ["website-konten", "/profil-desa/website/konten"],
      ["website-halaman", "/profil-desa/website/halaman"],
      ["pengajuan-layanan", "/pelayanan-publik/pengajuan"],
      ["analisis-survei", "/pelayanan-publik/survei"],
      ["cuti-izin", "/kehadiran/cuti-izin"],
      ["verifikasi-surat", "/layanan-surat/persuratan/verifikasi"],
      ["master-surat", "/layanan-surat/persuratan/master"],
    ]);

    for (const [slug, url] of halaman) {
      expect(
        template.modules.find((modul) => modul.slug === slug),
        `Modul "${slug}" hilang`,
      ).toMatchObject({ url });
    }
  });

  it("menempatkan modul yang tersisa pada grup menu acuan", () => {
    const grup = (slug: string) =>
      template.modules
        .filter((modul) => modul.parentSlug === slug)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((modul) => modul.slug);

    expect(grup("kependudukan")).toEqual([
      "penduduk",
      "keluarga",
      "rumah-tangga",
      "kelompok",
      "suplemen",
      "calon-pemilih",
      "stunting",
      "statistik-kependudukan",
      "laporan-penduduk",
      "laporan-bulanan",
      "laporan-kelompok-rentan",
      "mutasi-penduduk",
    ]);
    expect(grup("layanan-surat")).toEqual([
      "permohonan-surat",
      "surat",
      "pengaturan-surat",
      "syarat-surat",
      "klasifikasi-surat",
      "cetak-surat",
      "surat-masuk",
      "surat-keluar",
      "surat-dinas",
      "verifikasi-surat",
      "master-surat",
    ]);
    expect(grup("kehadiran")).toEqual([
      "data-pegawai",
      "absensi",
      "rekapitulasi-kehadiran",
      "pengajuan-izin",
      "persetujuan-izin",
      "hari-libur",
      "jam-kerja",
      "alasan-keluar",
      "cuti-izin",
    ]);
    expect(grup("keuangan")).toEqual([
      "apbdes",
      "pendapatan",
      "belanja",
      "pembiayaan",
      "penatausahaan",
      "buku-kas-umum",
      "realisasi",
      "laporan-keuangan",
      "dokumen-keuangan",
    ]);
    expect(grup("sekretariat")).toEqual([
      "bumindes",
      "buku-administrasi-penduduk",
      "buku-administrasi-pembangunan",
      "buku-administrasi-lainnya",
      "agenda-kegiatan",
      "arsip",
    ]);
    expect(grup("buku-administrasi-desa")).toEqual([]);
    expect(grup("pembangunan-aset")).toEqual([
      "perencanaan-pembangunan",
      "pembangunan",
      "proyek-desa",
      "inventaris",
      "aset-desa",
      "mutasi-aset",
      "laporan-aset",
    ]);
    expect(grup("pengaturan")).toEqual([
      "pengguna",
      "grup-akses",
      "pengaturan-sistem",
      "integrasi",
      "template-website",
      "log-aktivitas",
    ]);
    expect(grup("profil-desa")).toEqual([
      "pengaturan-desa",
      "wilayah",
      "perangkat-desa",
      "lembaga-desa",
      "status-desa",
      "berita",
      "galeri",
      "dokumen",
      "website-konten",
      "website-halaman",
      "website-pengaturan",
    ]);
    expect(grup("admin-web")).toEqual([]);
    expect(grup("pertanahan")).toEqual([
      "peta",
      "peta-wilayah",
      "data-pertanahan",
      "batas-wilayah",
      "peta-penduduk",
    ]);
    expect(grup("layanan-mandiri")).toEqual([
      "pengaduan",
      "aspirasi-warga",
      "lapak",
      "informasi-pelayanan",
      "pengajuan-layanan",
      "analisis-survei",
    ]);
    expect(grup("satu-data")).toEqual([
      "bantuan",
      "data-penerima-bantuan",
      "idm-sdgs",
      "potensi",
      "sarana-prasarana",
      "statistik-program-desa",
    ]);
  });

  it("memberi grant baca pada kepala grup agar menunya tidak tersaring", () => {
    for (const grup of template.modules.filter((modul) => modul.isGroup)) {
      for (const role of template.roles) {
        expect(
          template.akses.some(
            (grant) => grant.roleSlug === role.slug && grant.moduleSlug === grup.slug,
          ),
          `Grup "${grup.slug}" tidak memiliki grant untuk role "${role.slug}"`,
        ).toBe(true);
      }
      expect(grup.url, `Grup "${grup.slug}" tidak boleh punya tautan sendiri`).toBeNull();
    }
  });

  it("membatasi modul administrasi yang tersisa untuk administrator", () => {
    for (const slug of [
      "pengguna",
      "grup-akses",
      "pengaturan-sistem",
      "integrasi",
      "template-website",
      "log-aktivitas",
    ]) {
      const akses = template.akses
        .filter((grant) => grant.moduleSlug === slug)
        .map((grant) => `${grant.roleSlug}:${grant.access}`)
        .sort();
      expect(akses, `Grant modul "${slug}" tidak sesuai`).toEqual(["administrator:manage"]);
    }
    // Bantuan kini tampil di menu Data Desa, jadi role lain ikut membaca.
    const aksesBantuan = template.akses
      .filter((grant) => grant.moduleSlug === "bantuan")
      .map((grant) => `${grant.roleSlug}:${grant.access}`)
      .sort();
    expect(aksesBantuan).toEqual([
      "administrator:manage",
      "kepala-desa:read",
      "operator:read",
      "sekretaris:read",
    ]);
  });

  it("menampilkan SDGs sebagai submenu Data Desa ke halaman IDM", () => {
    expect(template.modules.find((modul) => modul.slug === "idm-sdgs")).toMatchObject({
      url: "/desa/idm",
      isGroup: false,
      isHidden: false,
      isActive: true,
      parentSlug: "satu-data",
    });
    expect(
      template.akses
        .filter((grant) => grant.moduleSlug === "idm-sdgs")
        .map((grant) => grant.roleSlug)
        .sort(),
    ).toEqual(["administrator", "kepala-desa", "operator", "sekretaris"]);
  });

  it("memakai sort_order unik di antara modul seinduk", () => {
    const perInduk = new Map<string, string[]>();
    for (const modul of template.modules) {
      const induk = modul.parentSlug ?? "(tingkat atas)";
      const kunci = `${induk}#${modul.sortOrder}`;
      perInduk.set(kunci, [...(perInduk.get(kunci) ?? []), modul.slug]);
    }

    const kembar = [...perInduk.entries()].filter(([, slug]) => slug.length > 1);
    expect(
      kembar.map(([kunci, slug]) => `${kunci} dipakai ${slug.join(", ")}`),
      "sort_order kembar membuat urutan menu bergantung pada tie-break alfabetis",
    ).toEqual([]);
  });

  it("menu publik hanya menunjuk halaman yang ada, tanpa duplikat", () => {
    const nama = template.menuPublik.map((menu) => menu.nama);
    expect(new Set(nama).size).toBe(nama.length);

    const urutan = template.menuPublik.map((menu) => menu.urut);
    expect([...urutan].sort((a, b) => a - b)).toEqual(urutan);

    for (const menu of template.menuPublik) {
      if (menu.linkTipe !== "internal") continue;
      const berkas = menu.link === "/" ? "page.tsx" : `${menu.link.replace(/^\//, "")}/page.tsx`;
      expect(
        existsSync(join(process.cwd(), "src", "app", berkas)),
        `Menu "${menu.nama}" menunjuk ${menu.link} tetapi src/app/${berkas} tidak ada`,
      ).toBe(true);
    }
  });
});

describe("validasi template tenant", () => {
  it("menerima template yang konsisten", () => {
    expect(parseTemplateTenant(template()).modules).toHaveLength(1);
  });

  it("menolak template tanpa role administrator", () => {
    const pesan = pesanValidasi({
      ...template(),
      roles: [{ slug: "operator", name: "Operator", isSystem: false }],
      akses: [],
    });

    expect(pesan).toMatch(/administrator/);
  });

  it("menolak slug role ganda", () => {
    const pesan = pesanValidasi({
      ...template(),
      roles: [
        { slug: ROLE_ADMINISTRATOR, name: "Administrator", isSystem: true },
        { slug: ROLE_ADMINISTRATOR, name: "Administrator 2", isSystem: true },
      ],
    });

    expect(pesan).toMatch(/lebih dari sekali/);
  });

  it("menolak slug modul ganda", () => {
    const modul = template().modules[0]!;
    const pesan = pesanValidasi({ ...template(), modules: [modul, { ...modul }] });

    expect(pesan).toMatch(/lebih dari sekali/);
  });

  it("menolak akses yang menunjuk role atau modul di luar template", () => {
    const pesan = pesanValidasi({
      ...template(),
      akses: [{ roleSlug: "operator", moduleSlug: "surat", access: "read" }],
    });

    expect(pesan).toMatch(/Role "operator"/);
    expect(pesan).toMatch(/Modul "surat"/);
  });

  it("menolak induk modul yang tidak ada", () => {
    const pesan = pesanValidasi({
      ...template(),
      modules: [{ ...template().modules[0]!, parentSlug: "tidak-ada" }],
    });

    expect(pesan).toMatch(/Induk "tidak-ada"/);
  });

  it("menolak modul yang menjadi induk dirinya sendiri", () => {
    const pesan = pesanValidasi({
      ...template(),
      modules: [{ ...template().modules[0]!, parentSlug: "penduduk" }],
    });

    expect(pesan).toMatch(/induk dirinya sendiri/);
  });
});

describe("urutkanModulIndukDulu", () => {
  const anak = {
    slug: "penduduk-detail",
    name: "Detail Penduduk",
    url: "/kependudukan/penduduk/detail",
    icon: null,
    isGroup: false,
    isHidden: false,
    isActive: true,
    sortOrder: 2,
    parentSlug: "penduduk",
  };

  it("menempatkan induk sebelum anak meski urutan masukan terbalik", () => {
    const hasil = urutkanModulIndukDulu([anak, ...template().modules]);

    expect(hasil.map((modul) => modul.slug)).toEqual(["penduduk", "penduduk-detail"]);
  });

  it("mempertahankan urutan asli antar simpul selevel", () => {
    const modul = template().modules[0]!;
    const kedua = { ...modul, slug: "surat", name: "Surat", url: "/surat", sortOrder: 2 };

    expect(urutkanModulIndukDulu([modul, kedua]).map((item) => item.slug)).toEqual([
      "penduduk",
      "surat",
    ]);
  });

  it("melempar bila relasi induk melingkar", () => {
    const a = { ...template().modules[0]!, slug: "a", parentSlug: "b" };
    const b = { ...template().modules[0]!, slug: "b", parentSlug: "a" };

    expect(() => urutkanModulIndukDulu([a, b])).toThrow(/melingkar/);
  });
});
