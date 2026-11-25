import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  simpanBatasWilayah,
  simpanPetaKantor,
  ubahWilayah,
} from "@/features/wilayah/application/use-cases";
import {
  simpanBatasWilayahAction,
  simpanPetaKantorAction,
  ubahWilayahAction,
} from "@/features/wilayah/presentation/actions";
import { createIdleActionState } from "@/lib/action-state";
import { conflict } from "@/lib/errors";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/features/wilayah/application/use-cases", () => ({
  geserUrutanWilayah: vi.fn(),
  hapusWilayah: vi.fn(),
  simpanBatasWilayah: vi.fn(),
  simpanPetaKantor: vi.fn(),
  simpanWilayah: vi.fn(),
  ubahWilayah: vi.fn(),
}));

function formData(nilai: Record<string, string>) {
  const fd = new FormData();
  for (const [kunci, isi] of Object.entries(nilai)) fd.set(kunci, isi);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("action wilayah", () => {
  it("mengubah error use case menjadi ActionState error", async () => {
    vi.mocked(ubahWilayah).mockRejectedValueOnce(conflict("Nama wilayah sudah dipakai."));
    const state = await ubahWilayahAction(
      createIdleActionState<null>(),
      formData({ id: "1", dusun: "X", rw: "", rt: "" }),
    );
    expect(state).toEqual({ status: "error", message: "Nama wilayah sudah dipakai." });
  });

  it("mengembalikan success setelah simpan batas", async () => {
    const state = await simpanBatasWilayahAction(
      createIdleActionState<null>(),
      formData({ id: "1", path: "", zoom: "15" }),
    );
    expect(state).toEqual({
      status: "success",
      message: "Batas wilayah disimpan.",
      data: null,
    });
    expect(simpanBatasWilayah).toHaveBeenCalledWith(1, {
      path: "",
      zoom: "15",
      warna: null,
      border: null,
    });
  });

  it("menolak id tidak valid tanpa memanggil use case", async () => {
    const state = await simpanPetaKantorAction(
      createIdleActionState<null>(),
      formData({ id: "0" }),
    );
    expect(state.status).toBe("error");
    expect(simpanPetaKantor).not.toHaveBeenCalled();
  });
});
