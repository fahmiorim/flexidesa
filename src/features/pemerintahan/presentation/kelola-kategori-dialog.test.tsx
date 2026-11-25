// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { KelolaKategoriDialog } from "./kelola-kategori-dialog";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/components/ui/confirm-submit", () => ({ ConfirmSubmit: () => null }));
vi.mock("@/features/multi-desa/presentation/dialog-bagian", () => ({ PesanDialog: () => null }));
vi.mock("@/features/pemerintahan/presentation/actions", () => ({
  hapusMasterLembagaAction: vi.fn(),
}));
vi.mock("@/features/pemerintahan/presentation/form-actions", () => ({
  simpanMasterLembagaFormAction: vi.fn(),
}));

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value() {
      this.setAttribute("open", "");
    },
  });
});

afterEach(cleanup);

describe("KelolaKategoriDialog", () => {
  it("menamai formulir kategori baru sebagai Tambah Kategori", () => {
    render(<KelolaKategoriDialog kategori={[]} bolehUbah bolehHapus />);

    fireEvent.click(screen.getByRole("button", { name: "Kelola Kategori" }));
    fireEvent.click(screen.getByRole("button", { name: "Tambah Kategori" }));

    expect(screen.getByRole("heading", { name: "Tambah Kategori" })).toBeTruthy();
  });
});
