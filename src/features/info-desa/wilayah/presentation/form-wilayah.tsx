"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import {
  LABEL_TINGKAT,
  tingkatWilayah,
  type WilayahDTO,
} from "@/features/info-desa/wilayah/domain/wilayah";
import {
  simpanWilayahAction,
  ubahWilayahAction,
} from "@/features/info-desa/wilayah/presentation/actions";
import { PemilihKepala } from "@/features/info-desa/wilayah/presentation/pemilih-kepala";
import { createIdleActionState } from "@/lib/action-state";

interface Props {
  mode: "tambah" | "ubah";
  row?: WilayahDTO;
  induk?: WilayahDTO | null;
  urutAwal: number;
  /** Gaya tombol pemicu; baris tabel memakai "ghost". */
  varian?: "primary" | "secondary" | "ghost";
}

function Galat({ pesan }: { pesan?: string }) {
  if (!pesan) return null;
  return (
    <span className="form-help" role="alert">
      {pesan}
    </span>
  );
}

/**
 * Form identitas wilayah dalam dialog.
 *
 * Tambah dan ubah memakai isian yang sama (dusun, RW, RT, kepala, urutan) agar
 * penomoran yang salah dapat diperbaiki tanpa menghapus baris. Rename induk
 * dirambatkan ke turunannya oleh use case.
 */
export function FormWilayah({ mode, row, induk, urutAwal, varian = "primary" }: Props) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [state, formAction, pending] = useActionState(
    mode === "ubah" ? ubahWilayahAction : simpanWilayahAction,
    createIdleActionState<null>(),
  );
  const fieldErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  // Dialog dipindahkan ke `body` agar tidak mewarisi gaya tabel saat dipicu dari
  // baris (font, warna, dan padding sel). Dengan begitu modal ubah tampil sama
  // persis dengan modal tambah. Portal baru aktif setelah hidrasi selesai.
  const terpasang = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (state.status !== "success") return;
    dialogRef.current?.close();
    router.refresh();
  }, [state, router]);

  const tingkat = row ? tingkatWilayah(row) : null;
  const kepalaAwal = row
    ? row.kepalaResidentId && row.kepalaNik
      ? `${row.kepalaNik} — ${row.kepala}`
      : row.kepala
    : "";

  const labelInduk = induk
    ? [induk.dusun ? `Dusun ${induk.dusun}` : "", induk.rw ? `RW ${induk.rw}` : ""]
        .filter(Boolean)
        .join(" · ")
    : "";
  const judul =
    mode === "tambah" ? "Tambah Wilayah" : `Ubah ${tingkat ? LABEL_TINGKAT[tingkat] : "Wilayah"}`;

  return (
    <>
      <button
        className={`button button-${varian}`}
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        {mode === "tambah" ? "Tambah Wilayah" : "Ubah"}
      </button>

      {terpasang
        ? createPortal(
            <dialog
              aria-labelledby={`${id}-judul`}
              className="platform-dialog wilayah-form-dialog"
              onClick={(event) => {
                if (event.target === dialogRef.current) dialogRef.current.close();
              }}
              ref={dialogRef}
            >
              <div className="platform-dialog-head">
                <div>
                  <h2 id={`${id}-judul`}>
                    {judul}
                    {mode === "tambah" && labelInduk ? ` di bawah ${labelInduk}` : ""}
                  </h2>
                </div>
                <button
                  aria-label="Tutup dialog"
                  className="platform-dialog-close"
                  onClick={() => dialogRef.current?.close()}
                  type="button"
                >
                  ✕
                </button>
              </div>

              <form
                action={formAction}
                className="platform-dialog-form pemerintahan-form wilayah-form"
              >
                {mode === "ubah" && row ? <input name="id" type="hidden" value={row.id} /> : null}

                {/* Isian sama untuk tambah dan ubah agar penomoran dapat diperbaiki. */}
                <label className="wilayah-form-lebar">
                  Nama Dusun
                  <input
                    aria-invalid={Boolean(fieldErrors.dusun)}
                    defaultValue={row?.dusun ?? induk?.dusun ?? ""}
                    maxLength={100}
                    name="dusun"
                    placeholder="Dusun I"
                    required
                  />
                  <Galat pesan={fieldErrors.dusun?.[0]} />
                </label>
                <label>
                  Nomor RW
                  <input
                    aria-invalid={Boolean(fieldErrors.rw)}
                    defaultValue={
                      row?.rw ?? (induk && tingkatWilayah(induk) === "rw" ? induk.rw : "")
                    }
                    maxLength={10}
                    name="rw"
                    placeholder="01"
                  />
                  <Galat pesan={fieldErrors.rw?.[0]} />
                </label>
                <label>
                  Nomor RT
                  <input
                    aria-invalid={Boolean(fieldErrors.rt)}
                    defaultValue={row?.rt ?? ""}
                    maxLength={10}
                    name="rt"
                    placeholder="001"
                  />
                  <Galat pesan={fieldErrors.rt?.[0]} />
                </label>

                <label className="wilayah-form-lebar">
                  Kepala Wilayah (penduduk)
                  <PemilihKepala
                    defaultLabel={kepalaAwal}
                    defaultValue={row?.kepalaResidentId ?? null}
                  />
                  <Galat pesan={fieldErrors.kepalaResidentId?.[0]} />
                </label>

                <label>
                  Nama Kepala (bila bukan penduduk)
                  <input
                    aria-invalid={Boolean(fieldErrors.kepala)}
                    defaultValue={row?.kepala ?? ""}
                    maxLength={100}
                    name="kepala"
                    placeholder="Nama kepala wilayah"
                  />
                  <Galat pesan={fieldErrors.kepala?.[0]} />
                </label>

                <label>
                  Luas Wilayah (Ha)
                  <input
                    aria-invalid={Boolean(fieldErrors.luasHa)}
                    defaultValue={row?.luasHa ?? ""}
                    min={0}
                    name="luasHa"
                    placeholder="Isi pada tingkat dusun"
                    step="0.01"
                    type="number"
                  />
                  <Galat pesan={fieldErrors.luasHa?.[0]} />
                </label>

                <label>
                  Urutan
                  <input
                    aria-invalid={Boolean(fieldErrors.urut)}
                    defaultValue={row?.urut ?? urutAwal}
                    min={0}
                    name="urut"
                    type="number"
                  />
                  <Galat pesan={fieldErrors.urut?.[0]} />
                </label>

                {state.status === "error" ? (
                  <p className="alert alert-error" role="alert">
                    {state.message}
                  </p>
                ) : null}
                {state.status === "success" ? (
                  <p className="alert alert-info" role="status">
                    {state.message}
                  </p>
                ) : null}

                <div className="platform-dialog-actions">
                  <button
                    className="button button-secondary"
                    onClick={() => dialogRef.current?.close()}
                    type="button"
                  >
                    Batal
                  </button>
                  <button className="button button-primary" disabled={pending} type="submit">
                    {pending
                      ? "Menyimpan…"
                      : mode === "tambah"
                        ? "Tambah Wilayah"
                        : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </dialog>,
            document.body,
          )
        : null}
    </>
  );
}
