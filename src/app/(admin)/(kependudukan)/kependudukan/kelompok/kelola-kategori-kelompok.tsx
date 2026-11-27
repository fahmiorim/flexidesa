"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { DialogHapus } from "@/components/ui/dialog-hapus";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { PesanDialog } from "@/features/multi-desa/presentation/dialog-bagian";
import { createIdleActionState } from "@/lib/action-state";

import { hapusKategoriDialogAction, simpanKategoriFormAction } from "./actions";

export interface KategoriKelolaItem {
  id: number;
  nama: string;
  deskripsi: string | null;
  jumlahKelompok: number;
}

function FormKategori({
  item,
  onBatal,
  onSelesai,
}: {
  item: KategoriKelolaItem | null;
  onBatal: () => void;
  onSelesai: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    simpanKategoriFormAction,
    createIdleActionState<null>(),
  );

  useEffect(() => {
    if (state.status !== "success") return;
    onSelesai();
    router.refresh();
  }, [state, onSelesai, router]);

  return (
    <form action={formAction} className="platform-dialog-form pemerintahan-form">
      {item ? <input name="id" type="hidden" value={item.id} /> : null}
      <label>
        Nama Kategori
        <input
          defaultValue={item?.nama ?? ""}
          maxLength={100}
          name="nama"
          placeholder="Kepemudaan"
          required
        />
      </label>
      <label>
        Deskripsi
        <textarea defaultValue={item?.deskripsi ?? ""} maxLength={500} name="deskripsi" rows={3} />
      </label>
      <PesanDialog state={state} />
      <div className="platform-dialog-actions">
        <Button variant="secondary" onClick={onBatal} type="button">
          Kembali ke daftar
        </Button>
        <Button loading={pending} type="submit" variant="primary">
          {item ? "Simpan Perubahan" : "Simpan Kategori"}
        </Button>
      </div>
    </form>
  );
}

type Tampilan = { jenis: "daftar" } | { jenis: "form"; item: KategoriKelolaItem | null };

/**
 * Tombol "Kelola Kategori" yang membuka modal daftar kategori kelompok.
 * Daftar, tambah, ubah, dan hapus terjadi di dalam satu dialog,
 * sama seperti Kelola Kategori pada halaman Lembaga Desa.
 */
export function KelolaKategoriKelompok({
  kategori,
  bolehUbah,
  bolehHapus,
  tombolClassName = "wilayah-tool",
}: {
  kategori: readonly KategoriKelolaItem[];
  bolehUbah: boolean;
  bolehHapus: boolean;
  tombolClassName?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [tampilan, setTampilan] = useState<Tampilan>({ jenis: "daftar" });
  const terpasang = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <>
      <button
        className={tombolClassName}
        onClick={() => {
          setTampilan({ jenis: "daftar" });
          dialogRef.current?.showModal();
        }}
        type="button"
      >
        Kelola Kategori{kategori.length ? ` (${kategori.length})` : ""}
      </button>

      {terpasang
        ? createPortal(
            <dialog
              aria-labelledby={`${id}-judul`}
              className="platform-dialog jabatan-dialog"
              onClick={(event) => {
                if (event.target === dialogRef.current) dialogRef.current.close();
              }}
              ref={dialogRef}
            >
              <div className="platform-dialog-head">
                <div>
                  <h2 id={`${id}-judul`}>
                    {tampilan.jenis === "form"
                      ? tampilan.item
                        ? "Ubah Kategori"
                        : "Tambah Kategori"
                      : "Kategori Kelompok"}
                  </h2>
                  <p>
                    {tampilan.jenis === "form"
                      ? "Nama kategori unik dalam satu desa dan dipakai sebagai pilihan saat mendata kelompok."
                      : "Klasifikasi kelompok masyarakat, misalnya kepemudaan, perempuan, atau pertanian."}
                  </p>
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

              {tampilan.jenis === "form" ? (
                <FormKategori
                  item={tampilan.item}
                  onBatal={() => setTampilan({ jenis: "daftar" })}
                  onSelesai={() => setTampilan({ jenis: "daftar" })}
                />
              ) : (
                <div className="jabatan-body">
                  <div className="jabatan-toolbar">
                    <span className="jabatan-count">{kategori.length} kategori</span>
                    {bolehUbah ? (
                      <Button
                        variant="primary"
                        onClick={() => setTampilan({ jenis: "form", item: null })}
                        type="button"
                      >
                        Tambah Kategori
                      </Button>
                    ) : null}
                  </div>

                  {kategori.length ? (
                    <TableScroll>
                      <Table className="jabatan-table">
                        <THead>
                          <Row>
                            <HeaderCell>No</HeaderCell>
                            <HeaderCell>Kategori</HeaderCell>
                            <HeaderCell>Deskripsi</HeaderCell>
                            <HeaderCell>Kelompok</HeaderCell>
                            <HeaderCell>Aksi</HeaderCell>
                          </Row>
                        </THead>
                        <TBody>
                          {kategori.map((item, index) => (
                            <Row key={item.id}>
                              <Cell>{index + 1}</Cell>
                              <Cell>
                                <strong>{item.nama}</strong>
                              </Cell>
                              <Cell>{item.deskripsi ?? "—"}</Cell>
                              <Cell>{item.jumlahKelompok} kelompok</Cell>
                              <Cell>
                                <div className="pemerintahan-row-actions">
                                  {bolehUbah ? (
                                    <Button
                                      variant="ghost"
                                      onClick={() => setTampilan({ jenis: "form", item })}
                                      type="button"
                                    >
                                      Ubah
                                    </Button>
                                  ) : null}
                                  {item.jumlahKelompok ? <small>Masih dipakai</small> : null}
                                  {bolehHapus && !item.jumlahKelompok ? (
                                    <DialogHapus
                                      aksi={hapusKategoriDialogAction}
                                      id={String(item.id)}
                                      judul={`Hapus kategori "${item.nama}"?`}
                                      keterangan="Kategori akan dihapus permanen. Kategori yang masih dipakai kelompok tidak dapat dihapus."
                                    />
                                  ) : null}
                                </div>
                              </Cell>
                            </Row>
                          ))}
                        </TBody>
                      </Table>
                    </TableScroll>
                  ) : (
                    <p className="modul-empty">
                      Belum ada kategori. Tambahkan kategori pertama agar kelompok dapat didata.
                    </p>
                  )}
                </div>
              )}
            </dialog>,
            document.body,
          )
        : null}
    </>
  );
}
