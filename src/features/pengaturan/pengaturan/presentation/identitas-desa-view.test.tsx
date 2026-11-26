// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { IdentitasDesaView } from "./identitas-desa-view";
import { InputBatasDesa } from "./input-batas-desa";
import type { Data, ProfilForm, Sebutan } from "./pengaturan-desa-types";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { src, alt } = props as { src: string; alt: string };
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={typeof src === "string" ? src : ""} alt={alt} />;
  },
}));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const SEBUTAN: Sebutan = {
  desa: "Desa",
  desaSingkat: "Desa",
  kecamatan: "Kecamatan",
  kecamatanSingkat: "Kec",
  camat: "Camat",
  kabupaten: "Kabupaten",
  kabupatenSingkat: "Kab",
};

const PROFIL: ProfilForm = {
  namaDesa: "Sukamaju",
  kodeDesa: "",
  kodeBps: "",
  namaKecamatan: "Sukamaju",
  namaCamat: "",
  nipCamat: "",
  namaKabupaten: "Sukamaju",
  namaPropinsi: "Jawa",
  kodePos: "12345",
  namaKepalaDesa: "Budi",
  nipKepalaDesa: "",
  visi: "Maju",
  misi: "",
  sejarah: "",
  sambutan: "",
  alamat: "",
  email: "",
  telepon: "",
  nomorOperator: "",
  website: "",
  kontakPemberitahuanNama: "",
  kontakPemberitahuanTelepon: "",
  kontakPemberitahuanJabatan: "",
  koordinat: "",
  mapTipe: "osm",
  luasWilayah: "",
  batasUtara: "",
  batasSelatan: "",
  batasTimur: "",
  batasBarat: "",
  ketinggian: "",
  suhuRataRata: "",
  curahHujan: "",
  topografi: "",
  jenisTanah: "",
  sumberDayaAlam: "",
  floraFauna: "",
  rawanBencana: "",
  kearifanLokal: "",
  jenisJaringan: "",
  providerInternet: "",
  cakupanWilayah: "",
  kecepatanInternet: "",
  aksesPublik: "",
  statusDesa: "",
  lembagaAdat: "",
  strukturAdat: "",
  wilayahAdat: "",
  peraturanAdat: "",
  regulasiPenetapanKampungAdat: "",
  dokumenRegulasiPenetapanKampungAdat: "",
  batasDesa: "",
  tahunBerdiri: "",
  tujuanPembangunan: "",
  nilaiDasar: "",
  arahKebijakan: "",
};

const DATA: Data = {
  desa: {
    id: 1,
    namaDesa: "Sukamaju",
    kodeDesa: null,
    kodeBps: null,
    namaKecamatan: null,
    kodeKecamatan: null,
    namaCamat: null,
    nipCamat: null,
    namaKabupaten: null,
    kodeKabupaten: null,
    namaPropinsi: null,
    kodePropinsi: null,
    kodePos: null,
    alamat: null,
    email: null,
    telepon: null,
    website: null,
    logo: null,
    fotoKantor: null,
    tandaTangan: null,
    stempel: null,
    nomorOperator: null,
    kontakPemberitahuanNama: null,
    kontakPemberitahuanTelepon: null,
    kontakPemberitahuanJabatan: null,
    namaKepalaDesa: null,
    nipKepalaDesa: null,
    updatedAt: "",
  },
  profil: null,
  kontak: {},
  faqKontak: [],
  faqSurat: [],
  favicon: null,
  templates: [],
  temaAktif: null,
  umum: {
    komentarAktif: false,
    beritaBeranda: 3,
    pendaftaranWargaAktif: false,
    penomoranSurat: 1,
  },
  sebutan: SEBUTAN,
  layanan: [],
  media: { usedBytes: 0, quotaMb: null },
};

afterEach(cleanup);

function renderView({
  tersimpan = PROFIL,
  awal = PROFIL,
  load = vi.fn(async () => {}),
  busy = false,
}: {
  tersimpan?: ProfilForm;
  awal?: ProfilForm;
  load?: () => Promise<void>;
  busy?: boolean;
} = {}) {
  function Wrapper() {
    const [profile, setProfile] = useState<ProfilForm>(awal);
    return (
      <IdentitasDesaView
        data={DATA}
        profile={profile}
        profileTersimpan={tersimpan}
        setProfile={setProfile}
        sebutan={SEBUTAN}
        busy={busy}
        save={vi.fn(async () => true)}
        load={load}
        upload={vi.fn(async () => {})}
        deleteMedia={vi.fn(async () => {})}
      />
    );
  }
  render(<Wrapper />);
  return { load };
}

const tab = (nama: string) => screen.getByRole("tab", { name: new RegExp(nama, "i") });

describe("Reset Identitas Desa", () => {
  it("langsung memuat ulang saat form bersih", () => {
    const load = vi.fn(async () => {});
    renderView({ load });

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(load).toHaveBeenCalledTimes(1);
  });

  it("meminta konfirmasi bila ada perubahan; batal mempertahankan nilai", () => {
    const load = vi.fn(async () => {});
    const konfirmasi = vi.spyOn(window, "confirm").mockReturnValue(false);
    renderView({ load });

    const nama = screen.getByLabelText(/Nama Desa/i) as HTMLInputElement;
    fireEvent.change(nama, { target: { value: "Sukamaju Baru" } });
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(konfirmasi).toHaveBeenCalledTimes(1);
    expect(load).not.toHaveBeenCalled();
    expect(nama.value).toBe("Sukamaju Baru");
    konfirmasi.mockRestore();
  });

  it("setuju pada konfirmasi memanggil load untuk memulihkan nilai tersimpan", () => {
    const load = vi.fn(async () => {});
    const konfirmasi = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderView({ load });

    fireEvent.change(screen.getByLabelText(/Nama Desa/i), {
      target: { value: "Sukamaju Baru" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(konfirmasi).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledTimes(1);
    konfirmasi.mockRestore();
  });

  it("autofill kode desa saat pemuatan tidak menandai form berubah", async () => {
    const load = vi.fn(async () => {});
    const konfirmasi = vi.spyOn(window, "confirm").mockReturnValue(false);
    // Kode desa sudah tersimpan tetapi BPS/kode pos kosong: tanpa penjagaan,
    // autofill saat pemuatan akan mengisi dua field dan form tampak berubah
    // padahal pengguna belum mengedit apa pun.
    const tersimpanDenganKode: ProfilForm = {
      ...PROFIL,
      kodeDesa: "1207012001",
      kodeBps: "",
      kodePos: "",
    };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: { kodeBps: "1207012001", kodePos: "46311" } }), {
        status: 200,
      }),
    );

    renderView({ tersimpan: tersimpanDenganKode, awal: tersimpanDenganKode, load });
    // Beri kesempatan efek autofill (debounce 300 ms) berjalan.
    await new Promise((selesai) => setTimeout(selesai, 400));

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(konfirmasi).not.toHaveBeenCalled();
    expect(load).toHaveBeenCalledTimes(1);
    konfirmasi.mockRestore();
    fetchMock.mockRestore();
  });

  it("tetap nonaktif saat busy", () => {
    renderView({ busy: true });
    expect(screen.getByRole("button", { name: "Reset" })).toHaveProperty("disabled", true);
  });
});

describe("kelompok kontak identitas desa", () => {
  it("membedakan kontak kantor dari kontak pemberitahuan", () => {
    renderView();
    fireEvent.click(tab("Kantor"));

    expect(screen.getByRole("heading", { name: "Kontak kantor" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Kontak pemberitahuan" })).toBeTruthy();
  });
});

describe("navigasi keyboard tab identitas", () => {
  it("panah kanan berpindah tab, memindahkan fokus dan panel aktif", () => {
    renderView();
    const pertama = tab("Identitas");
    expect(pertama.getAttribute("aria-selected")).toBe("true");
    pertama.focus();

    fireEvent.keyDown(pertama, { key: "ArrowRight" });

    const kantor = tab("Kantor");
    expect(kantor.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(kantor);
    expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe(kantor.id);
    expect(pertama.getAttribute("tabIndex")).toBe("-1");
    expect(kantor.getAttribute("tabIndex")).toBe("0");
  });

  it("panah kiri membungkus ke tab terakhir dan Home/End menuju ujung", () => {
    renderView();

    fireEvent.keyDown(tab("Identitas"), { key: "ArrowLeft" });
    expect(tab("Adat").getAttribute("aria-selected")).toBe("true");

    fireEvent.keyDown(tab("Adat"), { key: "Home" });
    expect(tab("Identitas").getAttribute("aria-selected")).toBe("true");

    fireEvent.keyDown(tab("Identitas"), { key: "End" });
    expect(tab("Adat").getAttribute("aria-selected")).toBe("true");
  });

  it("aria-controls setiap tab menunjuk panel yang benar-benar ada", () => {
    renderView();
    const panel = screen.getByRole("tabpanel");

    for (const t of screen.getAllByRole("tab")) {
      expect(t.getAttribute("aria-controls")).toBe(panel.id);
    }
    expect(document.getElementById(panel.getAttribute("aria-labelledby")!)).toBe(
      screen.getAllByRole("tab").find((el) => el.getAttribute("aria-selected") === "true"),
    );
  });

  it("Tab tetap berpindah biasa (roving tabindex hanya satu tab berhenti)", () => {
    renderView();
    const semua = screen.getAllByRole("tab");
    const berhenti = semua.filter((el) => el.getAttribute("tabIndex") === "0");
    expect(berhenti).toHaveLength(1);
    expect(berhenti[0]).toBe(semua[0]);

    fireEvent.keyDown(semua[0]!, { key: "Tab" });
    expect(semua[0]!.getAttribute("aria-selected")).toBe("true");
  });
});

describe("simpan terikat validitas polygon batas desa", () => {
  it("menonaktifkan Simpan saat polygon tidak valid dan mengaktifkan lagi setelah diperbaiki", () => {
    renderView();
    fireEvent.click(tab("Wilayah"));

    const isian = screen.getByLabelText(/GeoJSON Polygon Batas Desa/i);
    fireEvent.change(isian, { target: { value: "{rusak" } });
    expect(screen.getByRole("button", { name: /Simpan Perubahan/ })).toHaveProperty(
      "disabled",
      true,
    );

    fireEvent.change(isian, {
      target: {
        value: JSON.stringify({
          type: "Polygon",
          coordinates: [
            [
              [100, -7],
              [101, -7],
              [101, -6],
              [100, -7],
            ],
          ],
        }),
      },
    });
    expect(screen.getByRole("button", { name: /Simpan Perubahan/ })).toHaveProperty(
      "disabled",
      false,
    );
  });
});

describe("InputBatasDesa", () => {
  function renderInput(awal = "") {
    function Wrapper() {
      const [nilai, setNilai] = useState(awal);
      return <InputBatasDesa nilai={nilai} onChange={setNilai} />;
    }
    render(<Wrapper />);
    return screen.getByLabelText(/GeoJSON Polygon Batas Desa/i) as HTMLTextAreaElement;
  }

  const POLYGON = JSON.stringify({
    type: "Polygon",
    coordinates: [
      [
        [100, -7],
        [101, -7],
        [101, -6],
        [100, -6],
        [100, -7],
      ],
    ],
  });

  it("polygon valid dipratinjau dan teks asli dipertahankan", () => {
    const isian = renderInput();
    fireEvent.change(isian, { target: { value: POLYGON } });

    expect(screen.getByRole("img", { name: /Pratinjau polygon/i })).toBeTruthy();
    expect(isian.value).toBe(POLYGON);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("polygon lama tetap tampil saat dimuat dan bisa diedit", () => {
    const isian = renderInput(POLYGON);
    expect(isian.value).toBe(POLYGON);
    expect(screen.getByRole("img", { name: /Pratinjau polygon/i })).toBeTruthy();

    fireEvent.change(isian, { target: { value: POLYGON.replace("101", "101.5") } });
    expect(isian.value).toContain("101.5");
  });

  it("JSON rusak menampilkan galat inline dan tidak menormalkan nilai", () => {
    const isian = renderInput();
    fireEvent.change(isian, { target: { value: "{rusak" } });

    expect(screen.getByRole("alert").textContent).toContain("Polygon");
    expect(isian.value).toBe("{rusak");
    expect(isian.getAttribute("aria-invalid")).toBe("true");
    expect(screen.queryByRole("img", { name: /Pratinjau polygon/i })).toBeNull();
  });

  it("ring tidak tertutup menampilkan pesan yang dapat ditindaklanjuti", () => {
    const isian = renderInput();
    fireEvent.change(isian, {
      target: {
        value: JSON.stringify({
          type: "Polygon",
          coordinates: [
            [
              [100, -7],
              [101, -7],
              [101, -6],
            ],
          ],
        }),
      },
    });

    expect(within(screen.getByRole("alert")).getByText(/tertutup/i)).toBeTruthy();
  });
});
