import { describe, expect, it } from "vitest";

import { urlMediaDesa } from "./media-url";

describe("urlMediaDesa", () => {
  it("menambahkan folder tenant bila jalur belum memuatnya", () => {
    expect(urlMediaDesa("logo/desa.png", 7)).toBe("/api/publik/media/7/logo/desa.png");
  });

  it("tidak menggandakan folder tenant yang sudah ada", () => {
    expect(urlMediaDesa("7/logo/desa.png", 7)).toBe("/api/publik/media/7/logo/desa.png");
  });

  it("mengembalikan null untuk nilai kosong", () => {
    expect(urlMediaDesa(null, 7)).toBeNull();
    expect(urlMediaDesa("   ", 7)).toBeNull();
  });

  it("menolak jalur yang mencoba keluar folder tenant", () => {
    expect(urlMediaDesa("../8/logo.png", 7)).toBeNull();
    expect(urlMediaDesa("logo/../../8/logo.png", 7)).toBeNull();
    expect(urlMediaDesa("logo/..", 7)).toBeNull();
  });

  it("meng-encode segmen jalur", () => {
    expect(urlMediaDesa("logo/desa satu.png", 7)).toBe("/api/publik/media/7/logo/desa%20satu.png");
  });
});
