// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { WilayahDTO } from "@/features/wilayah/domain/wilayah";

import { FormWilayah } from "./form-wilayah";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/features/wilayah/presentation/actions", () => ({
  simpanWilayahAction: vi.fn(),
  ubahWilayahAction: vi.fn(),
}));
vi.mock("@/features/wilayah/presentation/pemilih-kepala", () => ({
  PemilihKepala: () => null,
}));

const ROW: WilayahDTO = {
  id: 3,
  dusun: "DUSUN I",
  rw: "",
  rt: "",
  kepala: "",
  kepalaNik: "",
  kepalaResidentId: null,
  koordinat: "",
  path: "",
  zoom: null,
  mapTipe: null,
  warna: null,
  border: null,
  urut: 0,
};

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

describe("FormWilayah", () => {
  it("merender dialog ubah di body, bukan di dalam tabel", () => {
    render(
      <table>
        <tbody>
          <tr>
            <td>
              <FormWilayah induk={null} mode="ubah" row={ROW} urutAwal={0} varian="ghost" />
            </td>
          </tr>
        </tbody>
      </table>,
    );

    const dialog = screen.getByRole("dialog", { hidden: true });
    expect(dialog.parentElement).toBe(document.body);
  });

  it("memakai isian yang sama pada mode ubah dan tambah", () => {
    const { unmount } = render(<FormWilayah induk={null} mode="ubah" row={ROW} urutAwal={0} />);
    const ubah = screen
      .getAllByRole("textbox", { hidden: true })
      .map((el) => (el as HTMLInputElement).name)
      .filter(Boolean)
      .sort();
    unmount();

    render(<FormWilayah induk={null} mode="tambah" urutAwal={0} />);
    const tambah = screen
      .getAllByRole("textbox", { hidden: true })
      .map((el) => (el as HTMLInputElement).name)
      .filter(Boolean)
      .sort();

    expect(ubah).toEqual(tambah);
    expect(tambah).toContain("dusun");
    expect(tambah).toContain("rw");
    expect(tambah).toContain("rt");
  });
});
