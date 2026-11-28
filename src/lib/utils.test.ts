import { describe, expect, it } from "vitest";

import { slugify } from "./utils";

describe("slugify", () => {
  it("huruf kecil dan strip untuk spasi", () => {
    expect(slugify("Kantor Desa Kwala Gunung")).toBe("kantor-desa-kwala-gunung");
  });

  it("mentransliterasi aksen", () => {
    expect(slugify("Café Sehat")).toBe("cafe-sehat");
  });

  it("merapikan tanda baca dan strip ujung", () => {
    expect(slugify("  APBDes 2027! ")).toBe("apbdes-2027");
    expect(slugify("a_b")).toBe("a-b");
  });
});
