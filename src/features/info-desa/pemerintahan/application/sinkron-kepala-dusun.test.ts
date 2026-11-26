import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  sinkronkanKepalaDusun,
  slugJabatanKepalaDusun,
} from "@/features/info-desa/pemerintahan/application/sinkron-kepala-dusun";
import {
  getJabatanBySlug,
  insertJabatan,
  updateJabatan,
} from "@/features/info-desa/pemerintahan/infrastructure/jabatan-repository";
import {
  getKepalaDesaAktifId,
  getMaxUrutPerangkat,
  getPerangkatByWilayah,
  insertPerangkat,
  listJabatanRingkas,
  updatePerangkat,
} from "@/features/info-desa/pemerintahan/infrastructure/perangkat-repository";

vi.mock("@/features/info-desa/pemerintahan/infrastructure/jabatan-repository", () => ({
  getJabatanBySlug: vi.fn(),
  insertJabatan: vi.fn(),
  updateJabatan: vi.fn(),
}));

vi.mock("@/features/info-desa/pemerintahan/infrastructure/perangkat-repository", () => ({
  getKepalaDesaAktifId: vi.fn(),
  getMaxUrutPerangkat: vi.fn(),
  getPerangkatByWilayah: vi.fn(),
  insertPerangkat: vi.fn(),
  listJabatanRingkas: vi.fn(),
  updatePerangkat: vi.fn(),
}));

const dasar = {
  villageId: 7,
  wilayahId: 9,
  dusun: "Sukamaju",
  kepalaResidentId: 5,
  namaKepala: "Budi Santoso",
  kepalaDusun: true,
};

const jabatanSukamaju = {
  id: 11,
  nama: "Kepala Dusun Sukamaju",
  slug: "kepala-dusun-sukamaju",
  jenis: "lainnya",
  tupoksi: null,
  urut: 4,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getPerangkatByWilayah).mockResolvedValue(null);
  vi.mocked(getJabatanBySlug).mockResolvedValue(null);
  vi.mocked(listJabatanRingkas).mockResolvedValue([]);
  vi.mocked(getMaxUrutPerangkat).mockResolvedValue(3);
  vi.mocked(getKepalaDesaAktifId).mockResolvedValue(1);
  vi.mocked(insertJabatan).mockResolvedValue(11);
});

describe("slugJabatanKepalaDusun", () => {
  it("membentuk slug aman dari nama dusun", () => {
    expect(slugJabatanKepalaDusun("Suka Maju")).toBe("kepala-dusun-suka-maju");
    expect(slugJabatanKepalaDusun("  ")).toBe("kepala-dusun-wilayah");
  });
});

describe("sinkronkanKepalaDusun", () => {
  it("membuat jabatan dan aparat saat kepala dusun baru diangkat", async () => {
    await sinkronkanKepalaDusun(dasar);

    expect(insertJabatan).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        nama: "Kepala Dusun Sukamaju",
        slug: "kepala-dusun-sukamaju",
        jenis: "lainnya",
        urut: 1,
      }),
    );
    expect(insertPerangkat).toHaveBeenCalledWith(7, {
      nama: "Budi Santoso",
      residentId: 5,
      jabatanId: 11,
      wilayahId: 9,
      atasanId: 1,
      status: "aktif",
      kehadiran: true,
      urut: 4,
    });
  });

  it("memakai ulang jabatan yang sudah ada tanpa membuat duplikat", async () => {
    vi.mocked(getJabatanBySlug).mockResolvedValue({ id: 11 });

    await sinkronkanKepalaDusun(dasar);

    expect(insertJabatan).not.toHaveBeenCalled();
    expect(insertPerangkat).toHaveBeenCalledWith(7, expect.objectContaining({ jabatanId: 11 }));
  });

  it("memperbarui aparat tertaut saat kepala dusun diganti", async () => {
    vi.mocked(getPerangkatByWilayah).mockResolvedValue({
      id: 42,
      nama: "Budi Santoso",
      residentId: 5,
      jabatanId: 11,
      wilayahId: 9,
      atasanId: null,
      status: "aktif",
    });
    vi.mocked(listJabatanRingkas).mockResolvedValue([jabatanSukamaju]);
    vi.mocked(getJabatanBySlug).mockResolvedValue({ id: 11 });

    await sinkronkanKepalaDusun({ ...dasar, kepalaResidentId: 8, namaKepala: "Siti Aminah" });

    expect(updatePerangkat).toHaveBeenCalledWith(7, 42, {
      nama: "Siti Aminah",
      residentId: 8,
      jabatanId: 11,
      status: "aktif",
      atasanId: 1,
    });
    expect(insertPerangkat).not.toHaveBeenCalled();
  });

  it("menonaktifkan aparat tanpa menghapusnya saat kepala dusun dikosongkan", async () => {
    vi.mocked(getPerangkatByWilayah).mockResolvedValue({
      id: 42,
      nama: "Budi Santoso",
      residentId: 5,
      jabatanId: 11,
      wilayahId: 9,
      atasanId: null,
      status: "aktif",
    });

    await sinkronkanKepalaDusun({ ...dasar, kepalaResidentId: null, namaKepala: null });

    expect(updatePerangkat).toHaveBeenCalledWith(7, 42, { status: "nonaktif" });
    expect(insertPerangkat).not.toHaveBeenCalled();
  });

  it("melepas tautan wilayah saat baris bukan lagi tingkat dusun", async () => {
    vi.mocked(getPerangkatByWilayah).mockResolvedValue({
      id: 42,
      nama: "Budi Santoso",
      residentId: 5,
      jabatanId: 11,
      wilayahId: 9,
      atasanId: null,
      status: "aktif",
    });

    await sinkronkanKepalaDusun({ ...dasar, kepalaDusun: false });

    expect(updatePerangkat).toHaveBeenCalledWith(7, 42, {
      status: "nonaktif",
      wilayahId: null,
    });
  });

  it("mengganti nama jabatan saat dusun diganti nama", async () => {
    vi.mocked(getPerangkatByWilayah).mockResolvedValue({
      id: 42,
      nama: "Budi Santoso",
      residentId: 5,
      jabatanId: 11,
      wilayahId: 9,
      atasanId: null,
      status: "aktif",
    });
    vi.mocked(listJabatanRingkas).mockResolvedValue([jabatanSukamaju]);

    await sinkronkanKepalaDusun({ ...dasar, dusun: "Sukamaju Baru" });

    expect(updateJabatan).toHaveBeenCalledWith(
      7,
      11,
      expect.objectContaining({
        nama: "Kepala Dusun Sukamaju Baru",
        slug: "kepala-dusun-sukamaju-baru",
      }),
    );
    expect(insertJabatan).not.toHaveBeenCalled();
    expect(updatePerangkat).toHaveBeenCalledWith(7, 42, expect.objectContaining({ jabatanId: 11 }));
  });

  it("tidak membuat aparat tanpa penduduk tertaut", async () => {
    await sinkronkanKepalaDusun({ ...dasar, kepalaResidentId: null });

    expect(insertPerangkat).not.toHaveBeenCalled();
    expect(updatePerangkat).not.toHaveBeenCalled();
  });
});
