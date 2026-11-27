import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Page from "./page";

const state = vi.hoisted(() => ({ getPerangkatDesaData: vi.fn() }));

vi.mock("@/features/info-desa/pemerintahan/application/perangkat", () => ({
  getPerangkatDesaData: state.getPerangkatDesaData,
}));

vi.mock("@/components/shell/page-heading", () => ({
  PageHeading: ({
    judul,
    isiJudul,
    aksi,
  }: {
    judul?: string;
    isiJudul?: React.ReactNode;
    aksi?: React.ReactNode;
  }) => [isiJudul ?? judul, aksi],
}));

vi.mock("@/components/ui/confirm-submit", () => ({ ConfirmSubmit: () => null }));
vi.mock("@/components/ui/dialog-hapus", () => ({
  DialogHapus: () => null,
  DialogHapusForm: () => null,
}));
vi.mock("@/components/ui/form-dialog", () => ({
  FormDialog: ({ label }: { label: string }) => label,
}));
vi.mock("@/components/ui/hapus-terpilih", () => ({ HapusTerpilih: () => null }));
vi.mock("@/features/info-desa/pemerintahan/presentation/kelola-jabatan-dialog", () => ({
  KelolaJabatanDialog: () => "Kelola Jabatan",
}));
vi.mock("@/features/info-desa/pemerintahan/presentation/foto-perangkat-input", () => ({
  FotoPerangkatInput: () => null,
}));
vi.mock("@/features/info-desa/pemerintahan/presentation/pemilih-jabatan", () => ({
  PemilihJabatan: () => null,
}));
vi.mock("@/features/info-desa/pemerintahan/presentation/pemilih-penduduk", () => ({
  PemilihPenduduk: () => null,
}));
vi.mock("@/features/info-desa/pemerintahan/presentation/pengisi-penduduk", () => ({
  PengisiPenduduk: () => null,
}));
vi.mock("@/features/info-desa/pemerintahan/presentation/actions", () => ({
  hapusDokumenPemerintahanAction: vi.fn(),
  hapusJabatanAction: vi.fn(),
  hapusPerangkatAction: vi.fn(),
  hapusPerangkatMassalAction: vi.fn(),
  hapusRiwayatAction: vi.fn(),
  tetapkanPenandatanganAction: vi.fn(),
  ubahKehadiranPerangkatAction: vi.fn(),
  ubahStatusPerangkatAction: vi.fn(),
}));
vi.mock("@/features/info-desa/pemerintahan/presentation/form-actions", () => ({
  simpanJabatanFormAction: vi.fn(),
  simpanPerangkatFormAction: vi.fn(),
  simpanRiwayatFormAction: vi.fn(),
  ubahDokumenFormAction: vi.fn(),
  unggahDokumenFormAction: vi.fn(),
}));

const aparatUji = {
  id: 1,
  nama: "Kepala Desa Uji",
  status: "aktif",
  jabatan: "Kepala Desa",
  jenisJabatan: "kades",
  jabatanId: 1,
  ttdAn: false,
  ttdUb: false,
  kehadiran: true,
  residentId: 1,
  atasanId: null,
} as never;

describe("PemerintahDesaPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("menampilkan jendela aksi dan panel jabatan saat belum ada aparat", async () => {
    state.getPerangkatDesaData.mockResolvedValue({
      rows: [],
      jabatan: [],
      riwayat: [],
      dokumen: [],
      akses: { ubah: true, hapus: true },
    });
    const html = renderToStaticMarkup(await Page());

    expect(html).not.toContain("Siapkan jabatan inti");
    expect(html).not.toContain("Langkah 1 dari 4");
    expect(html).not.toContain("Ringkasan aparat");
    expect(html).toContain("Kelola Jabatan");
    expect(html).not.toContain("Jabatan & Tugas");
    expect(html).not.toContain("Belum ada jabatan terdaftar");
    expect(html).not.toContain("Buka Jabatan");
    expect(html).not.toContain("0 aparat aktif");
    expect(html).not.toContain("Perlu dilengkapi");
    expect(html).not.toContain("Belum ditetapkan");
    expect(html).not.toContain("Cari aparat");
    expect(html).toContain('href="/profil-desa/pemerintah-desa/bagan"');
    expect(html).toContain('href="/profil-desa/pemerintah-desa/cetak"');
    expect(html).toContain("Tambah Aparat");
    expect(html).toContain("Daftar Perangkat Desa");
    expect(html).not.toContain("Dokumen Tersimpan");
    expect(html).not.toContain("Catatan Riwayat");
    expect(html).not.toContain("Unggah Dokumen");
    expect(html).not.toContain("Tambah Riwayat");
  });
  it("tetap menghilangkan KPI setelah aparat terdaftar", async () => {
    state.getPerangkatDesaData.mockResolvedValue({
      rows: [aparatUji],
      jabatan: [{ id: 1, nama: "Kepala Desa", jenis: "kades", urut: 1 }],
      riwayat: [],
      dokumen: [],
      akses: { ubah: true, hapus: true },
    } as never);
    const html = renderToStaticMarkup(await Page());

    expect(html).toContain("Kepala Desa Uji");
    expect(html).not.toContain("Ringkasan aparat");
    expect(html).not.toContain("Perlu dilengkapi");
  });
});
