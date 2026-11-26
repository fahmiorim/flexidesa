import { describe, expect, it } from "vitest";

import { pathMenu, ruteTersedia, susunMenuTampil, type MenuNodeLike } from "./menu-tampil";

function simpul(p: Partial<MenuNodeLike> & Pick<MenuNodeLike, "label">): MenuNodeLike {
  return {
    label: p.label,
    url: p.url ?? null,
    icon: p.icon ?? null,
    children: p.children ?? [],
  };
}

describe("pathMenu", () => {
  it("membuang query dan garis miring di akhir", () => {
    expect(pathMenu("/kependudukan/penduduk/?page=2")).toBe("/kependudukan/penduduk");
    expect(pathMenu("/kependudukan/penduduk")).toBe("/kependudukan/penduduk");
  });

  it("mengembalikan null untuk url kosong", () => {
    expect(pathMenu(null)).toBeNull();
    expect(pathMenu("")).toBeNull();
  });

  it("mempertahankan root", () => {
    expect(pathMenu("/")).toBe("/");
  });

  it("mengubah alias lama menjadi rute kanonis", () => {
    expect(pathMenu("/segera/status-desa")).toBe("/profil-desa/status-desa");
    expect(pathMenu("/segera/status-desa/?tahun=2024")).toBe("/profil-desa/status-desa");
    expect(pathMenu("/segera/rumah-tangga")).toBe("/kependudukan/rumah-tangga");
    expect(pathMenu("/segera/kelompok")).toBe("/kependudukan/kelompok");
    expect(pathMenu("/segera/laporan-bulanan")).toBe("/kependudukan/laporan-bulanan");
    expect(pathMenu("/segera/statistik-kependudukan")).toBe("/kependudukan/statistik");
    expect(pathMenu("/segera/jam-kerja")).toBe("/kehadiran/jam-kerja");
    expect(pathMenu("/segera/persetujuan-izin")).toBe("/kehadiran/persetujuan-izin");
    expect(pathMenu("/segera/alasan-keluar")).toBe("/kehadiran/alasan-keluar");
    expect(pathMenu("/segera/cetak-surat")).toBe("/layanan-surat/persuratan/cetak-surat");
    expect(pathMenu("/segera/laporan-kelompok-rentan")).toBe("/kependudukan/kelompok-rentan");
    expect(pathMenu("/website/dokumen")).toBe("/profil-desa/dokumen");
    expect(pathMenu("/persuratan/surat-masuk")).toBe("/layanan-surat/persuratan/surat-masuk");
    expect(pathMenu("/absensi-kepegawaian/pegawai")).toBe("/kehadiran/pegawai");
  });
});

describe("ruteTersedia", () => {
  it("menerima rute admin yang punya halaman", () => {
    expect(ruteTersedia("/beranda")).toBe(true);
    expect(ruteTersedia("/super-admin")).toBe(true);
    expect(ruteTersedia("/beranda?tab=ringkasan")).toBe(true);
    expect(ruteTersedia("/kependudukan/penduduk")).toBe(true);
    expect(ruteTersedia("/inventaris/123")).toBe(true);
    expect(ruteTersedia("/inventaris/[id]")).toBe(true);
    expect(ruteTersedia("/kependudukan/penduduk/dashboard")).toBe(false);
    expect(ruteTersedia("/kependudukan/keluarga")).toBe(true);
    expect(ruteTersedia("/kependudukan/rumah-tangga")).toBe(true);
    expect(ruteTersedia("/kependudukan/rumah-tangga/123")).toBe(true);
    expect(ruteTersedia("/kependudukan/rumah-tangga/123/ubah")).toBe(true);
    expect(ruteTersedia("/kependudukan/kelompok")).toBe(true);
    expect(ruteTersedia("/kependudukan/kelompok/123")).toBe(true);
    // Tidak ada halaman kategori terpisah lagi; rute ini kini cocok dengan `/kependudukan/kelompok/[id]`.
    expect(ruteTersedia("/kependudukan/kelompok/kategori")).toBe(true);
    expect(ruteTersedia("/kependudukan/mutasi-penduduk")).toBe(true);
    expect(ruteTersedia("/kependudukan/laporan-bulanan")).toBe(true);
    expect(ruteTersedia("/statistik/penduduk")).toBe(false);
    expect(ruteTersedia("/laporan-statistik/laporan-desa")).toBe(false);
    expect(ruteTersedia("/layanan-surat/persuratan/dashboard")).toBe(true);
    expect(ruteTersedia("/layanan-surat/persuratan/surat")).toBe(true);
    expect(ruteTersedia("/layanan-surat/persuratan/verifikasi")).toBe(true);
    expect(ruteTersedia("/layanan-surat/persuratan/jenis-surat")).toBe(true);
    expect(ruteTersedia("/layanan-surat/persuratan/arsip")).toBe(true);
    expect(ruteTersedia("/layanan-surat/persuratan/master")).toBe(true);
    expect(ruteTersedia("/layanan-surat/permohonan-surat")).toBe(true);
    expect(ruteTersedia("/profil-desa/berita")).toBe(true);
    expect(ruteTersedia("/pemetaan/peta")).toBe(true);
    expect(ruteTersedia("/pengaturan/desa")).toBe(true);
    expect(ruteTersedia("/pengaturan/pengguna")).toBe(true);
    expect(ruteTersedia("/kehadiran/hari-libur")).toBe(true);
    expect(ruteTersedia("/kehadiran/jam-kerja")).toBe(true);
    expect(ruteTersedia("/kehadiran/persetujuan-izin")).toBe(true);
    expect(ruteTersedia("/kehadiran/alasan-keluar")).toBe(true);
    expect(ruteTersedia("/layanan-surat/persuratan/cetak-surat")).toBe(true);
  });

  it("menolak rute yang belum punya halaman", () => {
    expect(ruteTersedia("/kependudukan/penduduk/tambah")).toBe(false);
    expect(ruteTersedia("/keuangan/laporan")).toBe(true);
    expect(ruteTersedia(null)).toBe(false);
  });
});

describe("susunMenuTampil", () => {
  it("menjadikan simpul beranak sebagai grup dropdown", () => {
    const menu = [
      simpul({
        label: "Kependudukan",
        icon: "♙",
        children: [
          simpul({ label: "Beranda", url: "/beranda" }),
          simpul({ label: "Data Penduduk", url: "/kependudukan/penduduk" }),
        ],
      }),
    ];

    expect(susunMenuTampil(menu)).toEqual([
      {
        kind: "grup",
        slug: "Kependudukan",
        label: "Kependudukan",
        url: null,
        icon: "♙",
        tersedia: false,
        items: [
          {
            kind: "item",
            slug: "Beranda",
            label: "Beranda",
            url: "/beranda",
            icon: null,
            tersedia: true,
            items: [],
          },
          {
            kind: "item",
            slug: "Data Penduduk",
            label: "Data Penduduk",
            url: "/kependudukan/penduduk",
            icon: null,
            tersedia: true,
            items: [],
          },
        ],
      },
    ]);
  });

  it("mengganti alias lama dengan URL kanonis agar tidak tampil sebagai Segera", () => {
    const [baris] = susunMenuTampil([simpul({ label: "Status Desa", url: "/segera/status-desa" })]);

    expect(baris).toMatchObject({
      url: "/profil-desa/status-desa",
      tersedia: true,
    });
  });

  it("memakai slug simpul bila tersedia", () => {
    const [baris] = susunMenuTampil([
      { slug: "pengaturan", label: "Pengaturan", url: null, children: [] },
    ]);

    expect(baris).toMatchObject({ kind: "item", slug: "pengaturan", tersedia: false });
  });

  it("menandai daun tanpa url sebagai tidak tersedia", () => {
    expect(susunMenuTampil([simpul({ label: "Tanpa URL" })])).toEqual([
      {
        kind: "item",
        slug: "Tanpa URL",
        label: "Tanpa URL",
        url: null,
        icon: null,
        tersedia: false,
        items: [],
      },
    ]);
  });

  it("mempertahankan grup bertingkat", () => {
    const [luar] = susunMenuTampil([
      simpul({
        label: "Luar",
        children: [
          simpul({
            label: "Dalam",
            children: [simpul({ label: "Halaman", url: "/kependudukan/penduduk" })],
          }),
        ],
      }),
    ]);

    expect(luar?.items[0]).toMatchObject({ kind: "grup", label: "Dalam" });
    expect(luar?.items[0]?.items[0]).toMatchObject({ label: "Halaman", tersedia: true });
  });

  it("mengembalikan daftar kosong untuk menu kosong", () => {
    expect(susunMenuTampil([])).toEqual([]);
  });

  it("mengenali lima halaman Website Desa", () => {
    expect(ruteTersedia("/profil-desa/website")).toBe(true);
    expect(ruteTersedia("/profil-desa/website/pengaturan")).toBe(true);
    expect(ruteTersedia("/profil-desa/website/halaman")).toBe(true);
    expect(ruteTersedia("/profil-desa/website/konten")).toBe(true);
    expect(ruteTersedia("/profil-desa/dokumen")).toBe(true);
  });
});
