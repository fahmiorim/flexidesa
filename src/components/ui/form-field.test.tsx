// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FormField } from "./form-field";

afterEach(() => cleanup());

describe("FormField", () => {
  it("tetap bekerja sebagai input seperti perilaku lama", () => {
    render(<FormField label="Nama" name="nama" placeholder="Tulis nama" />);
    const input = screen.getByLabelText("Nama");
    expect(input.tagName).toBe("INPUT");
    expect(input.getAttribute("placeholder")).toBe("Tulis nama");
    expect(input.className).toContain("form-input");
  });

  it("merender select dengan opsi dan mengikat label", () => {
    render(
      <FormField
        kind="select"
        label="Status"
        name="status"
        options={[
          { value: "", label: "Pilih status" },
          { value: "aktif", label: "Aktif" },
        ]}
        defaultValue="aktif"
      />,
    );
    const select = screen.getByLabelText("Status") as HTMLSelectElement;
    expect(select.tagName).toBe("SELECT");
    expect(select.value).toBe("aktif");
    expect(select.querySelectorAll("option")).toHaveLength(2);
    expect(select.hasAttribute("options")).toBe(false);
  });

  it("merender textarea dengan rows", () => {
    render(<FormField kind="textarea" label="Keterangan" name="keterangan" rows={4} />);
    const textarea = screen.getByLabelText("Keterangan");
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea.getAttribute("rows")).toBe("4");
  });

  it("mengikat bantuan dan galat ke field lewat aria-describedby", () => {
    render(<FormField label="NIK" name="nik" helpText="16 digit" error="Wajib diisi" />);
    const input = screen.getByLabelText("NIK");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toContain("nik-help");
    expect(input.getAttribute("aria-describedby")).toContain("nik-error");
    expect(screen.getByRole("alert").textContent).toBe("Wajib diisi");
  });
});
