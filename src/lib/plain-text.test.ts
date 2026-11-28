import { describe, expect, it } from "vitest";

import { plainText } from "./plain-text";

describe("plainText", () => {
  it("membuang tag dan script/style", () => {
    expect(plainText("<p>Halo <b>dunia</b></p>")).toBe("Halo dunia");
    expect(plainText("<script>alert(1)</script>Hai")).toBe("Hai");
    expect(plainText("<style>.x{}</style>Hai")).toBe("Hai");
  });

  it("mendecode entitas umum", () => {
    expect(plainText("A&nbsp;B &amp; C &lt;D&gt; &quot;E&quot; &#39;F&#39;")).toBe(
      "A B & C <D> \"E\" 'F'",
    );
  });

  it("menangani null dan memotong bila max diberikan", () => {
    expect(plainText(null)).toBe("");
    expect(plainText(undefined)).toBe("");
    expect(plainText("abcdef", 3)).toBe("abc");
    expect(plainText("abcdef")).toBe("abcdef");
  });
});
