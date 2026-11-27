// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Button, buttonClassName } from "./button";

afterEach(() => cleanup());

describe("Button", () => {
  it("memakai varian primary dan ukuran md secara bawaan", () => {
    render(<Button>Simpan</Button>);
    const tombol = screen.getByRole("button", { name: "Simpan" });
    expect(tombol.className).toContain("button-primary");
    expect(tombol.className).not.toContain("button-sm");
  });

  it("mendukung varian ghost, danger, danger-ghost, dan ukuran", () => {
    render(
      <>
        <Button variant="ghost">Batal</Button>
        <Button variant="danger">Hapus</Button>
        <Button variant="danger-ghost" size="sm">
          Hapus Cepat
        </Button>
        <Button variant="secondary" size="lg">
          Besar
        </Button>
      </>,
    );
    expect(screen.getByRole("button", { name: "Batal" }).className).toContain("button-ghost");
    expect(screen.getByRole("button", { name: "Hapus" }).className).toContain("button-danger");
    expect(screen.getByRole("button", { name: "Hapus Cepat" }).className).toContain(
      "button-danger-ghost",
    );
    expect(screen.getByRole("button", { name: "Hapus Cepat" }).className).toContain("button-sm");
    expect(screen.getByRole("button", { name: "Besar" }).className).toContain("button-lg");
  });

  it("menonaktifkan dan menandai busy saat loading", () => {
    render(<Button loading>Menyimpan</Button>);
    const tombol = screen.getByRole("button", { name: "Menyimpan" });
    expect((tombol as HTMLButtonElement).disabled).toBe(true);
    expect(tombol.className).toContain("is-loading");
    expect(tombol.getAttribute("aria-busy")).toBe("true");
  });

  it("mempertahankan perilaku lama: block dan className tambahan", () => {
    render(
      <Button block className="aksi-saya">
        Penuh
      </Button>,
    );
    const tombol = screen.getByRole("button", { name: "Penuh" });
    expect(tombol.className).toContain("button-block");
    expect(tombol.className).toContain("aksi-saya");
  });

  it("buttonClassName dipakai bersama oleh ButtonLink", () => {
    expect(buttonClassName({ variant: "ghost", size: "sm" })).toBe("button button-ghost button-sm");
    expect(buttonClassName()).toBe("button button-primary");
  });
});
