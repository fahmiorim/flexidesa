import { describe, expect, it } from "vitest";

import { mediaUrl } from "./media-url";

describe("mediaUrl", () => {
  it("mengikat path ke villageId tenant", () => {
    expect(mediaUrl("foto/kantor.jpg", 7)).toBe("/api/publik/media/7/foto/kantor.jpg");
  });

  it("tidak menggandakan awalan villageId yang sudah ada", () => {
    expect(mediaUrl("7/foto/kantor.jpg", 7)).toBe("/api/publik/media/7/foto/kantor.jpg");
  });

  it("menolak nilai kosong", () => {
    expect(mediaUrl(null, 7)).toBeNull();
    expect(mediaUrl(undefined, 7)).toBeNull();
    expect(mediaUrl("", 7)).toBeNull();
  });

  it("menolak segmen dot dan traversal", () => {
    expect(mediaUrl("../rahasia.jpg", 7)).toBeNull();
    expect(mediaUrl("foto/../rahasia.jpg", 7)).toBeNull();
    expect(mediaUrl("./foto.jpg", 7)).toBeNull();
    expect(mediaUrl("foto/..hidden.jpg", 7)).toBeNull();
  });

  it("mengodekan segmen bermakna khusus", () => {
    expect(mediaUrl("foto kantor.jpg", 7)).toBe("/api/publik/media/7/foto%20kantor.jpg");
  });
});
