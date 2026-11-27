"use client";

import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { hapusMasterLembagaAction } from "@/features/info-desa/pemerintahan/presentation/actions";
import { simpanMasterLembagaFormAction } from "@/features/info-desa/pemerintahan/presentation/form-actions";
import { PesanDialog } from "@/features/multi-desa/presentation/dialog-bagian";
import { createIdleActionState } from "@/lib/action-state";

export interface KategoriKelolaItem {
  id: number;
  nama: string;
  deskripsi: string | null;
  urut: number;
  jumlahLembaga: number;
}

function isiKategori(item: KategoriKelolaItem | null) {
  return (
    <>
      {item ? <input name="id" type="hidden" value={item.id} /> : null}
      <label>
        Nama Kategori
        <input
          defaultValue={item?.nama ?? ""}
          maxLength={50}
          name="nama"
          placeholder="Lembaga Pemberdayaan Masyarakat"
          required
        />
      </label>
      <label>
        Deskripsi
        <textarea defaultValue={item?.deskripsi ?? ""} maxLength={400} name="deskripsi" rows={3} />
      </label>
      <label>
        Urutan
        <input defaultValue={item?.urut ?? 0} min="0" name="urut" type="number" />
      </label>
    </>
  );
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
  item: KategoriKelolaItem | null;
  onBatal: () => void;
  onSelesai: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    simpanMasterLembagaFormAction,
    createIdleActionState<null>(),
  );

  useEffect(() => {
    if (state.status !== "success") return;
    onSelesai();
    router.refresh();
  }, [state, onSelesai, router]);

  return (
    <form action={formAction} className="platform-dialog-form pemerintahan-form">
      {isiKategori(item)}
      <PesanDialog state={state} />
      <div className="platform-dialog-actions">
        <Button onClick={onBatal} type="button" variant="secondary">
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
 * Tombol "Kelola Kategori" yang membuka modal daftar kategori lembaga.
 *
 * Daftar, tambah, ubah, dan hapus kategori terjadi di dalam satu dialog,
 * sama seperti Kelola Jabatan pada halaman Pemerintah Desa.
 */
export function KelolaKategoriDialog({
  kategori,
  bolehUbah,
  bolehHapus,
  tombolClassName = "button button-secondary",
}: {
  kategori: readonly KategoriKelolaItem[];
  bolehUbah: boolean;
  bolehHapus: boolean;
  tombolClassName?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const id = useId();
  const [tampilan, setTampilan] = useState<Tampilan>({ jenis: "daftar" });
  const [konfirmasiHapus, setKonfirmasiHapus] = useState<number | null>(null);
  const [menghapus, mulaiHapus] = useTransition();

  function hapusKategori(item: KategoriKelolaItem) {
    const formData = new FormData();
    formData.set("id", String(item.id));
    mulaiHapus(async () => {
      try {
        await hapusMasterLembagaAction(formData);
      } finally {
        setKonfirmasiHapus(null);
        router.refresh();
      }
    });
  }

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
                      : "Kategori Lembaga"}
                  </h2>
                  <p>
                    {tampilan.jenis === "form"
                      ? "Nama kategori unik dalam satu desa dan dipakai sebagai pilihan saat mendata lembaga."
                      : "Klasifikasi lembaga desa, misalnya BPD, LPM, PKK, atau karang taruna. Setiap lembaga wajib memilih satu kategori."}
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
                      <button
                        className="button button-primary"
                        onClick={() => setTampilan({ jenis: "form", item: null })}
                        type="button"
                      >
                        Tambah Kategori
                      </button>
                    ) : null}
                  </div>

                  {kategori.length ? (
                    <TableScroll className="modul-table-wrap">
                      <Table className="modul-table jabatan-table">
                        <THead>
                          <Row>
                            <HeaderCell>No</HeaderCell>
                            <HeaderCell>Kategori</HeaderCell>
                            <HeaderCell>Deskripsi</HeaderCell>
                            <HeaderCell>Lembaga</HeaderCell>
                            <HeaderCell>Urutan</HeaderCell>
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
                              <Cell>{item.jumlahLembaga} lembaga</Cell>
                              <Cell>{item.urut}</Cell>
                              <Cell>
                                <div className="pemerintahan-row-actions">
                                  {bolehUbah ? (
                                    <button
                                      className="button button-ghost"
                                      onClick={() => setTampilan({ jenis: "form", item })}
                                      type="button"
                                    >
                                      Ubah
                                    </button>
                                  ) : null}
                                  {item.jumlahLembaga ? <small>Masih dipakai</small> : null}
                                  {bolehHapus && !item.jumlahLembaga ? (
                                    konfirmasiHapus === item.id ? (
                                      <span className="table-actions">
                                        <Button
                                          loading={menghapus}
                                          onClick={() => hapusKategori(item)}
                                          size="sm"
                                          type="button"
                                          variant="danger"
                                        >
                                          Hapus kategori
                                        </Button>
                                        <Button
                                          onClick={() => setKonfirmasiHapus(null)}
                                          size="sm"
                                          type="button"
                                          variant="secondary"
                                        >
                                          Batal
                                        </Button>
                                      </span>
                                    ) : (
                                      <Button
                                        onClick={() => setKonfirmasiHapus(item.id)}
                                        type="button"
                                        variant="danger-ghost"
                                      >
                                        Hapus
                                      </Button>
                                    )
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
                      Belum ada kategori. Tambahkan kategori pertama agar lembaga dapat didata.
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
