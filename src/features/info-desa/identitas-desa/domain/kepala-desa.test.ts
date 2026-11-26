import { describe, expect, it } from "vitest";

import { namaLengkapKepalaDesa } from "./kepala-desa";

describe("namaLengkapKepalaDesa", () => {
  it("menggabungkan gelar depan, nama, dan gelar belakang", () => {
    expect(
      namaLengkapKepalaDesa({
        gelarDepan: "H.",
        nama: "Budi Santoso",
        gelarBelakang: "S.E.",
        nip: "198001012010011001",
      }),
    ).toBe("H. Budi Santoso S.E.");
  });

  it("membuang bagian kosong dan merapikan spasi", () => {
    expect(
      namaLengkapKepalaDesa({
        gelarDepan: " ",
        nama: "  Siti   Aminah ",
        gelarBelakang: null,
        nip: null,
      }),
    ).toBe("Siti Aminah");
  });
});
