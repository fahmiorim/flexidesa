"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { PesanDialog } from "@/features/multi-desa/presentation/dialog-bagian";
import { createIdleActionState } from "@/lib/action-state";

import { hapusKategoriBeritaAction, simpanKategoriBeritaFormAction } from "./actions";

export interface KategoriBeritaItem {
  id: number;
  nama: string;
  slug: string;
  jumlahBerita: number;
}

/**
 * Form tambah/ubah kategori di dalam modal kelola.
 *
 * Form ini bukan dialog tersendiri: ia tampil menggantikan daftar di dalam
 * dialog yang sama, sehingga tidak ada dialog bersarang.
 */
function FormKategori({
  item,
  onBatal,
  onSelesai,
}: {
  item: KategoriBeritaItem | null;
  onBatal: () => void;
  onSelesai: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    simpanKategoriBeritaFormAction,
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
      <div className="berita-form">
        <section aria-label="Data kategori" className="berita-form-bagian">
          <div className="berita-form-kepala">
            <span aria-hidden="true" className="berita-form-ikon">
              ▤
            </span>
            <div>
              <h3>Kategori</h3>
              <p>Nama dan alamat kategori.</p>
            </div>
          </div>
          <div className="berita-form-grid">
            <label className="berita-field is-penuh">
              Nama Kategori
              <input
                defaultValue={item?.nama ?? ""}
                maxLength={100}
                name="namaKategori"
                placeholder="Kegiatan Desa"
                required
              />
            </label>
            <label className="berita-field is-penuh">
              Slug
              <input
                defaultValue={item?.slug ?? ""}
                maxLength={100}
                name="slugKategori"
                placeholder="dibuat dari nama"
              />
              <small className="berita-form-hint">Dibuat otomatis dari nama bila kosong.</small>
            </label>
          </div>
        </section>
      </div>
      <PesanDialog state={state} />
      <div className="platform-dialog-actions">
        <button className="button button-secondary" onClick={onBatal} type="button">
          Kembali ke daftar
        </button>
        <button className="button button-primary" disabled={pending} type="submit">
          {pending ? "Menyimpan..." : item ? "Simpan Perubahan" : "Simpan Kategori"}
        </button>
      </div>
    </form>
  );
}

type Tampilan = { jenis: "daftar" } | { jenis: "form"; item: KategoriBeritaItem | null };

/**
 * Tombol "Kelola Kategori" yang membuka modal daftar kategori berita.
 *
 * Daftar, tambah, dan ubah kategori terjadi di dalam satu dialog, sama seperti
 * Kelola Kategori pada halaman Lembaga Desa.
 */
export function KelolaKategoriBeritaDialog({
  kategori,
  bolehUbah,
  bolehHapus,
  tombolClassName = "button button-secondary",
}: {
  kategori: readonly KategoriBeritaItem[];
  bolehUbah: boolean;
  bolehHapus: boolean;
  tombolClassName?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [tampilan, setTampilan] = useState<Tampilan>({ jenis: "daftar" });
  // Dialog dipindah ke `body` agar tampil sama di mana pun tombolnya dipasang.
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
              className="platform-dialog jabatan-dialog berita-kategori-dialog"
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
                      : "Kategori Berita"}
                  </h2>
                  <p>
                    {tampilan.jenis === "form"
                      ? "Nama dan slug harus unik."
                      : "Dipakai sebagai filter berita di website."}
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
                <div className="berita-kat-body">
                  <div className="berita-kat-toolbar">
                    <span className="wilayah-count-pill">{kategori.length} kategori</span>
                    {bolehUbah ? (
                      <button
                        className="button button-primary"
                        onClick={() => setTampilan({ jenis: "form", item: null })}
                        type="button"
                      >
                        ＋ Tambah Kategori
                      </button>
                    ) : null}
                  </div>

                  {kategori.length ? (
                    <div className="modul-table-wrap">
                      <table className="modul-table pemerintah-table berita-tabel">
                        <thead>
                          <tr>
                            <th>No</th>
                            <th>Kategori</th>
                            <th>Slug</th>
                            <th>Berita</th>
                            <th>Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {kategori.map((item, index) => (
                            <tr key={item.id}>
                              <td>{index + 1}</td>
                              <td>
                                <span className="berita-kategori">{item.nama}</span>
                              </td>
                              <td>
                                <span className="berita-slug">/{item.slug}</span>
                              </td>
                              <td>
                                <span className="berita-baca">{item.jumlahBerita} berita</span>
                              </td>
                              <td>
                                <div className="pd-aparat-aksi">
                                  {bolehUbah ? (
                                    <button
                                      className="button button-ghost"
                                      onClick={() => setTampilan({ jenis: "form", item })}
                                      type="button"
                                    >
                                      Ubah
                                    </button>
                                  ) : null}
                                  {item.jumlahBerita ? (
                                    <small className="berita-kat-dipakai">Masih dipakai</small>
                                  ) : null}
                                  {bolehHapus && !item.jumlahBerita ? (
                                    <form action={hapusKategoriBeritaAction}>
                                      <input name="id" type="hidden" value={item.id} />
                                      <ConfirmSubmit
                                        className="button button-danger-ghost"
                                        message={`Hapus kategori ${item.nama}?`}
                                      >
                                        Hapus
                                      </ConfirmSubmit>
                                    </form>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="berita-kosong">
                      <span aria-hidden="true">▤</span>
                      <strong>Belum ada kategori</strong>
                      <p>Tambahkan kategori agar berita mudah dikelompokkan.</p>
                    </div>
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
