// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ActionState } from "@/lib/action-state";

import { FormDialog } from "./form-dialog";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));

afterEach(() => cleanup());

const aksi = async (): Promise<ActionState<null>> => ({ status: "idle" });

describe("FormDialog", () => {
  it("memakai Button bersama dan Batal bertipe button, bukan submit", () => {
    render(
      <FormDialog aksi={aksi} judul="Tambah" label="Tambah" labelSimpan="Simpan">
        <input name="nama" />
      </FormDialog>,
    );

    const pemicu = screen.getByRole("button", { name: "Tambah" });
    const batal = screen.getByRole("button", { name: "Batal", hidden: true });
    const simpan = screen.getByRole("button", { name: "Simpan", hidden: true });

    expect(pemicu.className).toContain("button-primary");
    expect(pemicu.getAttribute("type")).toBe("button");
    expect(batal.className).toContain("button-secondary");
    expect(batal.getAttribute("type")).toBe("button");
    expect(simpan.getAttribute("type")).toBe("submit");
  });
});
