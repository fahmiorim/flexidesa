export type Desa = {
  id: number;
  namaDesa: string | null;
  kodeDesa: string | null;
  kodeBps: string | null;
  namaKecamatan: string | null;
  kodeKecamatan: string | null;
  namaCamat: string | null;
  nipCamat: string | null;
  namaKabupaten: string | null;
  kodeKabupaten: string | null;
  namaPropinsi: string | null;
  kodePropinsi: string | null;
  kodePos: string | null;
  alamat: string | null;
  email: string | null;
  telepon: string | null;
  website: string | null;
  logo: string | null;
  fotoKantor: string | null;
  nomorOperator: string | null;
  kontakPemberitahuanNama: string | null;
  kontakPemberitahuanTelepon: string | null;
  kontakPemberitahuanJabatan: string | null;
  namaKepalaDesa: string | null;
  nipKepalaDesa: string | null;
  updatedAt: string;
};

export type Profil = {
  visi: string | null;
  misi: string | null;
  sejarah: string | null;
  sambutan: string | null;
  koordinat: string | null;
  mapTipe: string | null;
  luasWilayah: string | null;
  batasUtara: string | null;
  batasSelatan: string | null;
  batasTimur: string | null;
  batasBarat: string | null;
  ketinggian: string | null;
  suhuRataRata: string | null;
  curahHujan: string | null;
  topografi: string | null;
  jenisTanah: string | null;
  sumberDayaAlam: string | null;
  floraFauna: string | null;
  rawanBencana: string | null;
  kearifanLokal: string | null;
  jenisJaringan: string | null;
  providerInternet: string | null;
  cakupanWilayah: string | null;
  kecepatanInternet: string | null;
  aksesPublik: string | null;
  statusDesa: string | null;
  lembagaAdat: string | null;
  strukturAdat: string | null;
  wilayahAdat: string | null;
  peraturanAdat: string | null;
  regulasiPenetapanKampungAdat: string | null;
  dokumenRegulasiPenetapanKampungAdat: string | null;
  batasDesa: string | null;
};

export type Sebutan = {
  desa: string;
  desaSingkat: string;
  kecamatan: string;
  kecamatanSingkat: string;
  camat: string;
  kabupaten: string;
  kabupatenSingkat: string;
};

export type Kontak = {
  whatsapp: string;
  telepon: string;
  nomorOperator: string;
  kontakPemberitahuanNama: string;
  kontakPemberitahuanTelepon: string;
  kontakPemberitahuanJabatan: string;
  email: string;
  alamat: string;
  website: string;
  instagram: string;
  facebook: string;
  youtube: string;
  koordinat: string;
  tautanPeta: string;
  jamLayanan: string;
};

export type Umum = {
  komentarAktif: boolean;
  beritaBeranda: number;
  pendaftaranWargaAktif: boolean;
  penomoranSurat: number;
};

export type Template = {
  id: number;
  slug: string;
  nama: string;
  kategori: string;
  deskripsi: string;
  versi: string;
  tokens: Record<string, string>;
  tags: string[];
};

export type Layanan = {
  id: number;
  nama: string;
  kategori: string;
  deskripsi: string | null;
  persyaratan: string | null;
  estimasiHari: number;
  biaya: number;
  metode: string;
  aktif: boolean;
};

export type Data = {
  desa: Desa | null;
  profil: Profil | null;
  kontak: Partial<Kontak>;
  favicon: string | null;
  templates: Template[];
  temaAktif: { slug: string; nama: string; versi: string; opsi: string | null } | null;
  umum: Umum;
  sebutan: Sebutan;
  layanan: Layanan[];
  media: { usedBytes: number; quotaMb: number | null };
};

/** Nilai form identitas + profil publik yang disunting bersama. */
export type ProfilForm = {
  namaDesa: string;
  kodeDesa: string;
  kodeBps: string;
  namaKecamatan: string;
  namaCamat: string;
  nipCamat: string;
  namaKabupaten: string;
  namaPropinsi: string;
  kodePos: string;
  namaKepalaDesa: string;
  nipKepalaDesa: string;
  visi: string;
  misi: string;
  sejarah: string;
  sambutan: string;
  alamat: string;
  /** Kanal kontak yang juga disunting dari Identitas Desa (paritas OpenSID). */
  email: string;
  telepon: string;
  nomorOperator: string;
  website: string;
  kontakPemberitahuanNama: string;
  kontakPemberitahuanTelepon: string;
  kontakPemberitahuanJabatan: string;
  koordinat: string;
  mapTipe: string;
  luasWilayah: string;
  batasUtara: string;
  batasSelatan: string;
  batasTimur: string;
  batasBarat: string;
  ketinggian: string;
  suhuRataRata: string;
  curahHujan: string;
  topografi: string;
  jenisTanah: string;
  sumberDayaAlam: string;
  floraFauna: string;
  rawanBencana: string;
  kearifanLokal: string;
  jenisJaringan: string;
  providerInternet: string;
  cakupanWilayah: string;
  kecepatanInternet: string;
  aksesPublik: string;
  statusDesa: string;
  lembagaAdat: string;
  strukturAdat: string;
  wilayahAdat: string;
  peraturanAdat: string;
  regulasiPenetapanKampungAdat: string;
  dokumenRegulasiPenetapanKampungAdat: string;
  batasDesa: string;
};

export const settingsSections = [
  ["sebutan", "Sebutan Wilayah"],
  ["kontak", "Kontak & Lokasi"],
  ["tampilan", "Tampilan Website"],
  ["layanan", "Layanan Desa"],
  ["integrasi", "Integrasi & Sistem"],
  ["backup", "Backup & Data"],
  ["umum", "Pengaturan Umum"],
] as const;

export type TabId = "profil" | (typeof settingsSections)[number][0];

export const blankKontak: Kontak = {
  whatsapp: "",
  telepon: "",
  nomorOperator: "",
  kontakPemberitahuanNama: "",
  kontakPemberitahuanTelepon: "",
  kontakPemberitahuanJabatan: "",
  email: "",
  alamat: "",
  website: "",
  instagram: "",
  facebook: "",
  youtube: "",
  koordinat: "",
  tautanPeta: "",
  jamLayanan: "",
};

export const blankSebutan: Sebutan = {
  desa: "Desa",
  desaSingkat: "Desa",
  kecamatan: "Kecamatan",
  kecamatanSingkat: "Kec.",
  camat: "Camat",
  kabupaten: "Kabupaten",
  kabupatenSingkat: "Kab.",
};

export const blankUmum: Umum = {
  komentarAktif: true,
  beritaBeranda: 5,
  pendaftaranWargaAktif: true,
  penomoranSurat: 2,
};

export const blankService = {
  nama: "",
  kategori: "administrasi",
  deskripsi: "",
  persyaratan: "",
  estimasiHari: 1,
  biaya: 0,
  metode: "online_dan_langsung",
  aktif: true,
};

export const mediaUrl = (path: string | null | undefined) =>
  path ? "/api/publik/media/" + path.split("/").map(encodeURIComponent).join("/") : "";

export const formatBytes = (value: number) =>
  value < 1024
    ? value + " B"
    : value < 1024 * 1024
      ? (value / 1024).toFixed(1) + " KB"
      : (value / (1024 * 1024)).toFixed(1) + " MB";

export type MediaField = "logo" | "favicon" | "foto-kantor" | "struktur-adat" | "dokumen-adat";
