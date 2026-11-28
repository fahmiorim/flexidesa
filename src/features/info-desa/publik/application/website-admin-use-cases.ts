import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import {
  getIdentitasDesaUseCase,
  updateIdentitas,
} from "@/features/info-desa/desa/application/use-cases";
import { desaFormSchema, IDENTITAS_DESA_RESOURCE } from "@/features/info-desa/desa/domain/desa";
import {
  hapusAlbumGaleriAdmin,
  hapusBeritaAdmin,
  hapusFotoGaleriAdmin,
  hapusKategoriBeritaAdmin,
  slugBerita,
  tambahAlbumGaleriAdmin,
  tambahBeritaAdmin,
  tambahKategoriBeritaAdmin,
  ubahAlbumGaleriAdmin,
  ubahBeritaAdmin,
  ubahFotoGaleriAdmin,
  ubahKategoriBeritaAdmin,
  ubahStatusBeritaAdmin,
  unggahFotoGaleriAdmin,
} from "@/features/info-desa/publik/application/konten-admin";
import { simpanBerkasMedia } from "@/features/info-desa/publik/application/simpan-berkas-media";
import { IZIN_WEBSITE } from "@/features/info-desa/publik/domain/izin-website";
import {
  buatAgenda,
  cariAgendaById,
  hapusAgenda,
  ubahAgenda,
  ubahStatusAgenda,
} from "@/features/info-desa/publik/infrastructure/agenda-admin-repository";
import {
  ambilGambarSlider,
  ubahSlider,
} from "@/features/info-desa/publik/infrastructure/galeri-admin-repository";
import {
  createSlider,
  deleteSlider,
  updateSlider,
} from "@/features/info-desa/publik/infrastructure/galeri-repository";
import {
  buatHalamanStatis,
  cariHalamanStatisAktifBySlug,
  cariHalamanStatisById,
  cariHalamanStatisBySlug,
  cariMenuById,
  cariMenuInduk,
  cariWidgetById,
  hapusHalamanStatis,
  ubahHalamanStatis,
  ubahMenuDetail,
  ubahStatusHalamanStatis,
} from "@/features/info-desa/publik/infrastructure/halaman-admin-repository";
import {
  createMenuPublik,
  createWidget,
  deleteMenuPublik,
  deleteWidget,
  listMenuPublik,
  updateMenuPublik,
  updateWidget,
} from "@/features/info-desa/publik/infrastructure/tampilan-repository";
import type { BerkasUnggahan } from "@/features/media/domain/media";
import { hapusMedia } from "@/features/media/infrastructure/media-storage";
import { requirePermission } from "@/lib/dal";
import { sanitasiHtml } from "@/lib/sanitize";
import { slugify } from "@/lib/utils";

/**
 * Use case aksi Website (tanpa efek Next.js).
 *
 * Fungsi di sini mengembalikan daftar path yang harus divalidasi ulang dan
 * tujuan redirect; adapter Server Action di route Website
 * (`profil-desa/website/actions.ts`) yang menjalankan `revalidatePath` dan
 * `redirect`. Dengan begitu application tidak bergantung pada framework.
 */

/** Hasil aksi: path untuk `revalidatePath` dan tujuan `redirect`. */
interface HasilAksiWebsite {
  revalidate: string[];
  redirectTo: string;
}

const text = (fd: FormData, key: string) => {
  const value = fd.get(key);
  return typeof value === "string" ? value.trim() : "";
};
const num = (fd: FormData, key: string) => {
  const value = Number(text(fd, key));
  return Number.isSafeInteger(value) && value > 0 ? value : null;
};
/** Berkas unggahan dari FormData; `undefined` bila tidak ada berkas dipilih. */
async function berkasDari(fd: FormData, key: string): Promise<BerkasUnggahan | undefined> {
  const nilai = fd.get(key);
  if (!(nilai instanceof File) || nilai.size === 0) return undefined;
  return {
    nama: nilai.name,
    mime: nilai.type,
    ukuran: nilai.size,
    isi: new Uint8Array(await nilai.arrayBuffer()),
  };
}

/** Tanggal `YYYY-MM-DD` dari form menjadi Date lokal; kosong berarti null. */
function tanggalDari(fd: FormData, key: string): Date | null {
  const nilai = text(fd, key);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nilai)) return null;
  const tanggal = new Date(`${nilai}T00:00:00`);
  return Number.isNaN(tanggal.getTime()) ? null : tanggal;
}

export async function simpanIdentitasWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const user = await requirePermission(IDENTITAS_DESA_RESOURCE, "update");
  const villageId = await resolveVillageId(user);
  const existing = await getIdentitasDesaUseCase(villageId);
  // Field yang tidak dikirim form dipertahankan dari nilai tersimpan, sehingga
  // form parsial (mis. hanya unggah aset surat) tidak mengosongkan identitas.
  const nilai = (key: string, lama: string | null | undefined) => {
    const raw = fd.get(key);
    return typeof raw === "string" ? raw.trim() : (lama ?? "");
  };
  const input = desaFormSchema.parse({
    namaDesa: nilai("namaDesa", existing?.namaDesa),
    kodeDesa: nilai("kodeDesa", existing?.kodeDesa),
    kodePos: nilai("kodePos", existing?.kodePos),
    namaKecamatan: nilai("namaKecamatan", existing?.namaKecamatan),
    // Kode wilayah dan penomoran tidak diedit dari halaman Website.
    kodeKecamatan: existing?.kodeKecamatan ?? "",
    namaKabupaten: nilai("namaKabupaten", existing?.namaKabupaten),
    kodeKabupaten: existing?.kodeKabupaten ?? "",
    namaPropinsi: nilai("namaPropinsi", existing?.namaPropinsi),
    kodePropinsi: existing?.kodePropinsi ?? "",
    alamatKantor: nilai("alamatKantor", existing?.alamatKantor),
    // Kepala desa bersumber dari perangkat desa, bukan form identitas website.
    namaKepalaDesa: existing?.namaKepalaDesa ?? "",
    nipKepalaDesa: existing?.nipKepalaDesa ?? "",
    emailDesa: nilai("emailDesa", existing?.emailDesa),
    telepon: nilai("telepon", existing?.telepon),
    website: nilai("website", existing?.website),
    // Jalur lama dipertahankan bila admin tidak mengunggah berkas baru.
    logo: existing?.logo ?? "",
    tandaTangan: existing?.tandaTangan ?? "",
    stempel: existing?.stempel ?? "",
    penomoranSurat: existing?.penomoranSurat ?? 2,
  });
  const unggahan: Partial<Record<"logo" | "tandaTangan" | "stempel", BerkasUnggahan>> = {};
  for (const field of ["logo", "tandaTangan", "stempel"] as const) {
    const file = fd.get(field);
    if (file instanceof File && file.size > 0)
      unggahan[field] = {
        nama: file.name,
        mime: file.type,
        ukuran: file.size,
        isi: new Uint8Array(await file.arrayBuffer()),
      };
  }
  await updateIdentitas(input, unggahan);
  return {
    revalidate: ["/profil-desa/website", "/profil-desa/website/pengaturan"],
    redirectTo: "/profil-desa/website/pengaturan?saved=1",
  };
}

export async function tambahMenuWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const user = await requirePermission(IZIN_WEBSITE.menu, "update");
  const villageId = await resolveVillageId(user);
  const nama = text(fd, "nama");
  const link = text(fd, "link");
  const linkTipe = text(fd, "linkTipe") || "internal";
  if (
    !nama ||
    !link ||
    nama.length > 50 ||
    link.length > 500 ||
    !["internal", "eksternal", "halaman"].includes(linkTipe)
  ) {
    throw new Error("Data menu tidak valid.");
  }
  if (linkTipe === "internal" && (!link.startsWith("/") || link.startsWith("//")))
    throw new Error("Link internal harus berupa path lokal.");
  if (linkTipe === "eksternal") {
    let url: URL;
    try {
      url = new URL(link);
    } catch {
      throw new Error("URL eksternal tidak valid.");
    }
    if (!["http:", "https:"].includes(url.protocol))
      throw new Error("URL eksternal harus menggunakan HTTP atau HTTPS.");
  }
  if (linkTipe === "halaman") {
    const match = /^\/halaman\/([a-z0-9-]+)$/.exec(link);
    if (!match) throw new Error("Tautan halaman harus menggunakan format /halaman/slug.");
    const page = await cariHalamanStatisAktifBySlug(villageId, match[1]!);
    if (!page) throw new Error("Halaman statis tidak ditemukan atau belum dipublikasikan.");
  }
  const parentId = num(fd, "parentId");
  const menu = await listMenuPublik(villageId, true);
  if (parentId && !menu.some((item) => item.id === parentId && item.parentId === null)) {
    throw new Error("Menu induk tidak ditemukan pada desa ini.");
  }
  await createMenuPublik(villageId, {
    nama,
    link,
    linkTipe,
    parentId,
    urut: Number(text(fd, "urut")) || 0,
    aktif: true,
  });
  return {
    revalidate: ["/profil-desa/website/halaman"],
    redirectTo: "/profil-desa/website/halaman?saved=1",
  };
}

export async function ubahMenuWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const user = await requirePermission(IZIN_WEBSITE.menu, "update");
  const villageId = await resolveVillageId(user);
  const id = num(fd, "id");
  if (!id) throw new Error("Menu tidak valid.");
  const menu = await listMenuPublik(villageId, true);
  if (!menu.some((item) => item.id === id)) throw new Error("Menu tidak ditemukan.");
  await updateMenuPublik(villageId, id, { aktif: text(fd, "aktif") === "true" });
  return {
    revalidate: ["/profil-desa/website/halaman"],
    redirectTo: "/profil-desa/website/halaman?saved=1",
  };
}

export async function hapusMenuWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const user = await requirePermission(IZIN_WEBSITE.menu, "delete");
  const villageId = await resolveVillageId(user);
  const id = num(fd, "id");
  if (!id) throw new Error("Menu tidak valid.");
  const menu = await listMenuPublik(villageId, true);
  if (!menu.some((item) => item.id === id)) throw new Error("Menu tidak ditemukan.");
  if (menu.some((item) => item.parentId === id))
    throw new Error("Pindahkan atau hapus submenu terlebih dahulu.");
  await deleteMenuPublik(villageId, id);
  return {
    revalidate: ["/profil-desa/website/halaman"],
    redirectTo: "/profil-desa/website/halaman?deleted=1",
  };
}

export async function tambahHalamanWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const user = await requirePermission(IZIN_WEBSITE.halaman, "update");
  const villageId = await resolveVillageId(user);
  const judul = text(fd, "judul");
  const slug = slugify(text(fd, "slug") || judul);
  const isi = text(fd, "isi");
  if (!judul || judul.length > 200 || !slug || !isi)
    throw new Error("Judul, slug, dan isi halaman wajib diisi.");
  const existing = await cariHalamanStatisBySlug(villageId, slug);
  if (existing) throw new Error("Slug halaman sudah digunakan.");
  await buatHalamanStatis(villageId, {
    judul,
    slug,
    isi: sanitasiHtml(isi),
    aktif: fd.get("aktif") === "on",
  });
  return {
    revalidate: ["/profil-desa/website/halaman"],
    redirectTo: "/profil-desa/website/halaman?saved=1",
  };
}

export async function ubahStatusHalamanWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const user = await requirePermission(IZIN_WEBSITE.halaman, "update");
  const villageId = await resolveVillageId(user);
  const id = num(fd, "id");
  if (!id) throw new Error("Halaman tidak valid.");
  await ubahStatusHalamanStatis(villageId, id, text(fd, "aktif") === "true");
  return {
    revalidate: ["/profil-desa/website/halaman"],
    redirectTo: "/profil-desa/website/halaman?saved=1",
  };
}

export async function hapusHalamanWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const user = await requirePermission(IZIN_WEBSITE.halaman, "delete");
  const villageId = await resolveVillageId(user);
  const id = num(fd, "id");
  if (!id) throw new Error("Halaman tidak valid.");
  await hapusHalamanStatis(villageId, id);
  return {
    revalidate: ["/profil-desa/website/halaman"],
    redirectTo: "/profil-desa/website/halaman?deleted=1",
  };
}

export async function tambahAlbumWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  await tambahAlbumGaleriAdmin({
    nama: text(fd, "namaAlbum"),
    keterangan: text(fd, "keteranganAlbum"),
    kategori: null,
    publishedAt: null,
    urut: 0,
  });
  return {
    revalidate: ["/profil-desa/website/konten", "/profil-desa/galeri"],
    redirectTo: "/profil-desa/website/konten?saved=1#galeri",
  };
}

export async function unggahFotoWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const albumId = num(fd, "albumId");
  if (!albumId) throw new Error("Pilih album galeri.");
  const berkas = await berkasDari(fd, "gambar");
  if (!berkas) throw new Error("Pilih berkas gambar.");
  await unggahFotoGaleriAdmin(albumId, [berkas], {
    judul: text(fd, "judulFoto"),
    keterangan: text(fd, "keteranganFoto"),
  });
  return {
    revalidate: ["/profil-desa/website/konten", "/profil-desa/galeri"],
    redirectTo: "/profil-desa/website/konten?saved=1#galeri",
  };
}

/** Kembalikan branding tema ke nilai bawaan (opsi branding dihapus). */

export async function ubahMenuWebsiteDetailAction(fd: FormData): Promise<HasilAksiWebsite> {
  const user = await requirePermission(IZIN_WEBSITE.menu, "update");
  const villageId = await resolveVillageId(user);
  const id = num(fd, "id");
  const nama = text(fd, "nama");
  const link = text(fd, "link");
  const linkTipe = text(fd, "linkTipe");
  const parentId = num(fd, "parentId");
  if (
    !id ||
    !nama ||
    nama.length > 50 ||
    !link ||
    link.length > 500 ||
    !["internal", "eksternal", "halaman"].includes(linkTipe)
  )
    throw new Error("Data menu tidak valid.");
  const current = await cariMenuById(villageId, id);
  if (!current) throw new Error("Menu tidak ditemukan.");
  if (linkTipe === "internal" && (!link.startsWith("/") || link.startsWith("//")))
    throw new Error("Link internal harus berupa path lokal.");
  if (linkTipe === "eksternal") {
    let url: URL;
    try {
      url = new URL(link);
    } catch {
      throw new Error("URL eksternal tidak valid.");
    }
    if (!["http:", "https:"].includes(url.protocol))
      throw new Error("URL eksternal harus HTTP atau HTTPS.");
  }
  if (linkTipe === "halaman") {
    const match = /^\/halaman\/([a-z0-9-]+)$/.exec(link);
    if (!match) throw new Error("Tautan halaman harus menggunakan format /halaman/slug.");
    const page = await cariHalamanStatisAktifBySlug(villageId, match[1]!);
    if (!page) throw new Error("Halaman statis tidak ditemukan atau belum dipublikasikan.");
  }
  if (parentId) {
    const parent = await cariMenuInduk(villageId, parentId);
    if (!parent || parentId === id || parent.parentId !== null)
      throw new Error("Menu induk harus menu utama pada desa ini.");
  }
  await ubahMenuDetail(villageId, id, { nama, link, linkTipe, parentId });
  return {
    revalidate: ["/profil-desa/website/halaman"],
    redirectTo: "/profil-desa/website/halaman?saved=1",
  };
}

export async function tambahBeritaWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const judul = text(fd, "judulBerita");
  await tambahBeritaAdmin(
    {
      judul,
      slug: slugBerita(text(fd, "slugBerita") || judul),
      ringkasan: text(fd, "ringkasanBerita") || null,
      isi: text(fd, "isiBerita"),
      kategoriId: num(fd, "kategoriId"),
      status: text(fd, "statusBerita") === "published" ? "published" : "draft",
      terbitPada: tanggalDari(fd, "terbitPada"),
      headline: fd.get("headline") === "on",
      slider: fd.get("tampilSlider") === "on",
    },
    await berkasDari(fd, "gambarBerita"),
  );
  return {
    revalidate: ["/profil-desa/website/konten", "/profil-desa/website", "/profil-desa/berita"],
    redirectTo: "/profil-desa/website/konten?saved=1#berita",
  };
}

export async function ubahStatusBeritaWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const id = num(fd, "id");
  if (!id) throw new Error("Berita tidak valid.");
  await ubahStatusBeritaAdmin(id, text(fd, "status") === "published" ? "published" : "draft");
  return {
    revalidate: ["/profil-desa/website/konten", "/profil-desa/website", "/profil-desa/berita"],
    redirectTo: "/profil-desa/website/konten?saved=1#berita",
  };
}

export async function tambahAgendaWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const user = await requirePermission(IZIN_WEBSITE.agenda, "update");
  const villageId = await resolveVillageId(user);
  const judul = text(fd, "judulAgenda");
  const mulai = text(fd, "mulaiAgenda");
  const selesai = text(fd, "selesaiAgenda");
  if (!judul || judul.length > 200 || !/^\d{4}-\d{2}-\d{2}$/.test(mulai))
    throw new Error("Judul dan tanggal mulai agenda wajib diisi.");
  if (selesai && (!/^\d{4}-\d{2}-\d{2}$/.test(selesai) || selesai < mulai))
    throw new Error("Tanggal selesai tidak valid.");
  await buatAgenda(villageId, {
    judul,
    mulai,
    selesai: selesai || null,
    jamMulai: text(fd, "jamMulai") || null,
    jamSelesai: text(fd, "jamSelesai") || null,
    kategori: text(fd, "kategoriAgenda") || "umum",
    lokasi: text(fd, "lokasiAgenda") || null,
    deskripsi: text(fd, "deskripsiAgenda") || null,
    tayang: fd.get("tayangAgenda") === "on",
  });
  return {
    revalidate: ["/profil-desa/website/konten", "/profil-desa/website"],
    redirectTo: "/profil-desa/website/konten?saved=1#agenda",
  };
}

export async function ubahStatusAgendaWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const user = await requirePermission(IZIN_WEBSITE.agenda, "update");
  const villageId = await resolveVillageId(user);
  const id = num(fd, "id");
  if (!id) throw new Error("Agenda tidak valid.");
  await ubahStatusAgenda(villageId, id, text(fd, "tayang") === "true");
  return {
    revalidate: ["/profil-desa/website/konten", "/profil-desa/website"],
    redirectTo: "/profil-desa/website/konten?saved=1#agenda",
  };
}

export async function tambahWidgetWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const user = await requirePermission(IZIN_WEBSITE.widget, "update");
  const villageId = await resolveVillageId(user);
  const judul = text(fd, "judulWidget");
  const jenis = Number(text(fd, "jenisWidget"));
  if (judul.length > 100) throw new Error("Judul widget maksimal 100 karakter.");
  if (!Number.isInteger(jenis) || jenis < 1 || jenis > 6)
    throw new Error("Jenis widget tidak valid.");
  await createWidget(villageId, {
    judul: judul || null,
    isi: text(fd, "isiWidget") || null,
    jenis,
    pengaturan: null,
    urut: Math.max(0, Number(text(fd, "urutWidget")) || 0),
    aktif: fd.get("aktifWidget") === "on",
  });
  return {
    revalidate: ["/profil-desa/website/halaman"],
    redirectTo: "/profil-desa/website/halaman?saved=1#widget",
  };
}

export async function ubahStatusWidgetWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const user = await requirePermission(IZIN_WEBSITE.widget, "update");
  const villageId = await resolveVillageId(user);
  const id = num(fd, "id");
  if (!id) throw new Error("Widget tidak valid.");
  await updateWidget(villageId, id, { aktif: text(fd, "aktif") === "true" });
  return {
    revalidate: ["/profil-desa/website/halaman"],
    redirectTo: "/profil-desa/website/halaman?saved=1#widget",
  };
}

export async function tambahSliderWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const user = await requirePermission(IZIN_WEBSITE.slider, "update");
  const villageId = await resolveVillageId(user);
  const file = fd.get("gambarSlider");
  if (!(file instanceof File) || file.size === 0) throw new Error("Gambar slider wajib dipilih.");
  const gambar = await simpanBerkasMedia(
    villageId,
    {
      nama: file.name,
      mime: file.type,
      ukuran: file.size,
      isi: new Uint8Array(await file.arrayBuffer()),
    },
    "slider",
    "gambar",
  );
  const tautan = text(fd, "tautanSlider");
  if (tautan) {
    let url: URL;
    try {
      url = new URL(tautan);
    } catch {
      throw new Error("Tautan slider tidak valid.");
    }
    if (!["http:", "https:"].includes(url.protocol))
      throw new Error("Tautan slider harus HTTP atau HTTPS.");
  }
  await createSlider(villageId, {
    gambar,
    judul: text(fd, "judulSlider") || null,
    keterangan: text(fd, "keteranganSlider") || null,
    tautan: tautan || null,
    urut: Math.max(0, Number(text(fd, "urutSlider")) || 0),
    aktif: fd.get("aktifSlider") === "on",
  });
  return {
    revalidate: ["/profil-desa/website/konten", "/profil-desa/website"],
    redirectTo: "/profil-desa/website/konten?saved=1#slider",
  };
}

export async function ubahStatusSliderWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const user = await requirePermission(IZIN_WEBSITE.slider, "update");
  const villageId = await resolveVillageId(user);
  const id = num(fd, "id");
  if (!id) throw new Error("Slider tidak valid.");
  await updateSlider(villageId, id, { aktif: text(fd, "aktif") === "true" });
  return {
    revalidate: ["/profil-desa/website/konten", "/profil-desa/website"],
    redirectTo: "/profil-desa/website/konten?saved=1#slider",
  };
}

export async function hapusBeritaWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const id = num(fd, "id");
  if (!id) throw new Error("Berita tidak valid.");
  await hapusBeritaAdmin(id);
  return {
    revalidate: ["/profil-desa/website/konten", "/profil-desa/website", "/profil-desa/berita"],
    redirectTo: "/profil-desa/website/konten?deleted=1#berita",
  };
}

export async function hapusAgendaWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const user = await requirePermission(IZIN_WEBSITE.agenda, "delete");
  const villageId = await resolveVillageId(user);
  const id = num(fd, "id");
  if (!id) throw new Error("Agenda tidak valid.");
  await hapusAgenda(villageId, id);
  return {
    revalidate: ["/profil-desa/website/konten", "/profil-desa/website"],
    redirectTo: "/profil-desa/website/konten?deleted=1#agenda",
  };
}

export async function hapusSliderWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const user = await requirePermission(IZIN_WEBSITE.slider, "delete");
  const villageId = await resolveVillageId(user);
  const id = num(fd, "id");
  if (!id) throw new Error("Slider tidak valid.");
  const row = await ambilGambarSlider(villageId, id);
  if (!row) throw new Error("Slider tidak ditemukan.");
  await deleteSlider(villageId, id);
  await hapusMedia(row.gambar);
  return {
    revalidate: ["/profil-desa/website/konten", "/profil-desa/website"],
    redirectTo: "/profil-desa/website/konten?deleted=1#slider",
  };
}

export async function ubahHalamanWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const user = await requirePermission(IZIN_WEBSITE.halaman, "update");
  const villageId = await resolveVillageId(user);
  const id = num(fd, "id");
  const judul = text(fd, "judul");
  const slug = slugify(text(fd, "slug") || judul);
  const isi = text(fd, "isi");
  if (!id || !judul || judul.length > 200 || !slug || !isi)
    throw new Error("Data halaman tidak lengkap.");
  const existing = await cariHalamanStatisBySlug(villageId, slug);
  const current = await cariHalamanStatisById(villageId, id);
  if (!current) throw new Error("Halaman tidak ditemukan.");
  if (existing && existing.id !== id) throw new Error("Slug halaman sudah digunakan.");
  await ubahHalamanStatis(villageId, id, { judul, slug, isi: sanitasiHtml(isi) });
  return {
    revalidate: ["/profil-desa/website/halaman"],
    redirectTo: "/profil-desa/website/halaman?saved=1",
  };
}

export async function tambahKategoriBeritaWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const nama = text(fd, "namaKategori");
  await tambahKategoriBeritaAdmin(nama, slugify(text(fd, "slugKategori") || nama).slice(0, 100));
  return {
    revalidate: ["/profil-desa/website/konten", "/profil-desa/berita"],
    redirectTo: "/profil-desa/website/konten?saved=1#berita",
  };
}

export async function hapusFotoGaleriWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const id = num(fd, "id");
  if (!id) throw new Error("Foto tidak valid.");
  await hapusFotoGaleriAdmin(id);
  return {
    revalidate: ["/profil-desa/website/konten", "/profil-desa/galeri"],
    redirectTo: "/profil-desa/website/konten?deleted=1#galeri",
  };
}

export async function hapusWidgetWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const user = await requirePermission(IZIN_WEBSITE.widget, "delete");
  const villageId = await resolveVillageId(user);
  const id = num(fd, "id");
  if (!id) throw new Error("Widget tidak valid.");
  await deleteWidget(villageId, id);
  return {
    revalidate: ["/profil-desa/website/halaman"],
    redirectTo: "/profil-desa/website/halaman?deleted=1#widget",
  };
}

export async function hapusAlbumGaleriWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const id = num(fd, "id");
  if (!id) throw new Error("Album tidak valid.");
  await hapusAlbumGaleriAdmin(id);
  return {
    revalidate: ["/profil-desa/website/konten", "/profil-desa/galeri"],
    redirectTo: "/profil-desa/website/konten?deleted=1#galeri",
  };
}

export async function ubahBeritaWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const id = num(fd, "id");
  if (!id) throw new Error("Berita tidak valid.");
  const judul = text(fd, "judulBerita");
  await ubahBeritaAdmin(
    id,
    {
      judul,
      slug: slugBerita(text(fd, "slugBerita") || judul),
      ringkasan: text(fd, "ringkasanBerita") || null,
      isi: text(fd, "isiBerita"),
      kategoriId: num(fd, "kategoriId"),
      status: text(fd, "statusBerita") === "published" ? "published" : "draft",
      terbitPada: tanggalDari(fd, "terbitPada"),
      headline: fd.get("headline") === "on",
      slider: fd.get("tampilSlider") === "on",
    },
    await berkasDari(fd, "gambarBerita"),
  );
  return {
    revalidate: ["/profil-desa/website/konten", "/profil-desa/website", "/profil-desa/berita"],
    redirectTo: "/profil-desa/website/konten?saved=1#berita",
  };
}

export async function ubahAgendaWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const user = await requirePermission(IZIN_WEBSITE.agenda, "update");
  const villageId = await resolveVillageId(user);
  const id = num(fd, "id"),
    judul = text(fd, "judulAgenda");
  const mulai = text(fd, "mulaiAgenda"),
    selesai = text(fd, "selesaiAgenda");
  if (!id || !judul || judul.length > 200 || !/^\d{4}-\d{2}-\d{2}$/.test(mulai))
    throw new Error("Data agenda tidak valid.");
  if (selesai && (!/^\d{4}-\d{2}-\d{2}$/.test(selesai) || selesai < mulai))
    throw new Error("Tanggal selesai tidak valid.");
  const existing = await cariAgendaById(villageId, id);
  if (!existing) throw new Error("Agenda tidak ditemukan.");
  await ubahAgenda(villageId, id, {
    judul,
    mulai,
    selesai: selesai || null,
    jamMulai: text(fd, "jamMulai") || null,
    jamSelesai: text(fd, "jamSelesai") || null,
    kategori: text(fd, "kategoriAgenda") || "umum",
    lokasi: text(fd, "lokasiAgenda") || null,
    deskripsi: text(fd, "deskripsiAgenda") || null,
  });
  return {
    revalidate: ["/profil-desa/website/konten", "/profil-desa/website"],
    redirectTo: "/profil-desa/website/konten?saved=1#agenda",
  };
}

export async function ubahAlbumWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const id = num(fd, "id");
  if (!id) throw new Error("Album tidak valid.");
  await ubahAlbumGaleriAdmin(
    id,
    {
      nama: text(fd, "namaAlbum"),
      keterangan: text(fd, "keteranganAlbum"),
      kategori: null,
      publishedAt: null,
      urut: Math.max(0, Number(text(fd, "urutAlbum")) || 0),
      aktif: text(fd, "aktifAlbum") !== "false",
    },
    await berkasDari(fd, "sampulAlbum"),
  );
  return {
    revalidate: ["/profil-desa/website/konten", "/profil-desa/galeri"],
    redirectTo: "/profil-desa/website/konten?saved=1#galeri",
  };
}

export async function ubahFotoGaleriWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const id = num(fd, "id");
  if (!id) throw new Error("Foto tidak valid.");
  await ubahFotoGaleriAdmin(
    id,
    {
      judul: text(fd, "judulFoto"),
      keterangan: text(fd, "keteranganFoto"),
      urut: Math.max(0, Number(text(fd, "urutFoto")) || 0),
      aktif: text(fd, "aktifFoto") !== "false",
      slider: text(fd, "sliderFoto") === "true",
    },
    await berkasDari(fd, "gambar"),
  );
  return {
    revalidate: ["/profil-desa/website/konten", "/profil-desa/galeri"],
    redirectTo: "/profil-desa/website/konten?saved=1#galeri",
  };
}

export async function ubahSliderWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const user = await requirePermission(IZIN_WEBSITE.slider, "update");
  const villageId = await resolveVillageId(user);
  const id = num(fd, "id");
  if (!id) throw new Error("Slider tidak valid.");
  const current = await ambilGambarSlider(villageId, id);
  if (!current) throw new Error("Slider tidak ditemukan.");
  const file = fd.get("gambarSlider");
  let gambar = current.gambar;
  if (file instanceof File && file.size > 0)
    gambar = await simpanBerkasMedia(
      villageId,
      {
        nama: file.name,
        mime: file.type,
        ukuran: file.size,
        isi: new Uint8Array(await file.arrayBuffer()),
      },
      "slider",
      "gambar",
    );
  const tautan = text(fd, "tautanSlider");
  if (tautan) {
    let url: URL;
    try {
      url = new URL(tautan);
    } catch {
      throw new Error("Tautan slider tidak valid.");
    }
    if (!["http:", "https:"].includes(url.protocol))
      throw new Error("Tautan slider harus HTTP atau HTTPS.");
  }
  await ubahSlider(villageId, id, {
    gambar,
    judul: text(fd, "judulSlider") || null,
    keterangan: text(fd, "keteranganSlider") || null,
    tautan: tautan || null,
    urut: Math.max(0, Number(text(fd, "urutSlider")) || 0),
  });
  if (file instanceof File && file.size > 0) await hapusMedia(current.gambar);
  return {
    revalidate: ["/profil-desa/website/konten", "/profil-desa/website"],
    redirectTo: "/profil-desa/website/konten?saved=1#slider",
  };
}

export async function ubahKategoriBeritaWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const id = num(fd, "id");
  if (!id) throw new Error("Kategori tidak valid.");
  const nama = text(fd, "namaKategori");
  await ubahKategoriBeritaAdmin(id, nama, slugify(text(fd, "slugKategori") || nama).slice(0, 100));
  return {
    revalidate: ["/profil-desa/website/konten", "/profil-desa/website", "/profil-desa/berita"],
    redirectTo: "/profil-desa/website/konten?saved=1#berita",
  };
}

export async function hapusKategoriBeritaWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const id = num(fd, "id");
  if (!id) throw new Error("Kategori tidak valid.");
  await hapusKategoriBeritaAdmin(id);
  return {
    revalidate: ["/profil-desa/website/konten", "/profil-desa/berita"],
    redirectTo: "/profil-desa/website/konten?deleted=1#berita",
  };
}

export async function ubahWidgetWebsiteAction(fd: FormData): Promise<HasilAksiWebsite> {
  const user = await requirePermission(IZIN_WEBSITE.widget, "update");
  const villageId = await resolveVillageId(user);
  const id = num(fd, "id"),
    judul = text(fd, "judulWidget"),
    jenis = Number(text(fd, "jenisWidget"));
  if (!id || judul.length > 100 || !Number.isInteger(jenis) || jenis < 1 || jenis > 6)
    throw new Error("Data widget tidak valid.");
  const current = await cariWidgetById(villageId, id);
  if (!current) throw new Error("Widget tidak ditemukan.");
  await updateWidget(villageId, id, {
    judul: judul || null,
    isi: text(fd, "isiWidget") || null,
    jenis,
    urut: Math.max(0, Number(text(fd, "urutWidget")) || 0),
  });
  return {
    revalidate: ["/profil-desa/website/halaman", "/profil-desa/website"],
    redirectTo: "/profil-desa/website/halaman?saved=1#widget",
  };
}
