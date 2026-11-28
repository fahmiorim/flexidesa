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
import {
  isJenisJabatan,
  LABEL_JENIS_JABATAN,
} from "@/features/info-desa/pemerintahan/domain/aparat-desa";
import { hapusJabatanAction } from "@/features/info-desa/pemerintahan/presentation/actions";
import { simpanJabatanFormAction } from "@/features/info-desa/pemerintahan/presentation/form-actions";
import { PesanDialog } from "@/features/multi-desa/presentation/dialog-bagian";
import { createIdleActionState } from "@/lib/action-state";

interface JabatanKelolaItem {
  id: number;
  nama: string;
  jenis: string;
  urut: number;
  tupoksi: string | null;
  jumlahAparat: number;
}

function labelJenis(jenis: string) {
  return jenis && isJenisJabatan(jenis) ? LABEL_JENIS_JABATAN[jenis] : "Jabatan lain";
}

/** Badge jenis hanya ditampilkan bila tidak mengulang nama jabatan. */
function badgeJenis(item: JabatanKelolaItem) {
  const label = labelJenis(item.jenis);
  return label.toLowerCase() === item.nama.trim().toLowerCase() ? null : label;
}

function isiJabatan(item: JabatanKelolaItem | null) {
  return (
    <>
      {item ? <input name="id" type="hidden" value={item.id} /> : null}
      <label>
        Nama Jabatan
        <input
          defaultValue={item?.nama ?? ""}
          maxLength={100}
          name="nama"
          placeholder="Kaur Keuangan"
          required
        />
      </label>
      <label>
        Jenis Jabatan
        <select defaultValue={item?.jenis ?? "lainnya"} name="jenis">
          <option value="lainnya">Jabatan lain</option>
          <option value="kades">Kepala Desa</option>
          <option value="sekdes">Sekretaris Desa</option>
        </select>
      </label>
      <label>
        Urutan
        <input defaultValue={item?.urut ?? 0} min="0" name="urut" type="number" />
      </label>
      <label>
        Tugas Pokok &amp; Fungsi
        <textarea defaultValue={item?.tupoksi ?? ""} maxLength={2000} name="tupoksi" rows={3} />
      </label>
    </>
  );
}

function labelJudul(item: JabatanKelolaItem | null) {
  return item ? "Ubah Jabatan" : "Tambah Jabatan";
}

/**
 * Form tambah/ubah jabatan di dalam modal kelola.
 *
 * Form ini bukan dialog tersendiri: ia tampil menggantikan daftar di dalam
 * dialog yang sama, sehingga tidak ada dialog bersarang.
 */
function FormJabatan({
  item,
  onBatal,
  onSelesai,
}: {
  item: JabatanKelolaItem | null;
  onBatal: () => void;
  onSelesai: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    simpanJabatanFormAction,
    createIdleActionState<null>(),
  );

  useEffect(() => {
    if (state.status !== "success") return;
    onSelesai();
    router.refresh();
  }, [state, onSelesai, router]);

  return (
    <form action={formAction} className="platform-dialog-form pemerintahan-form">
      {isiJabatan(item)}
      <PesanDialog state={state} />
      <div className="platform-dialog-actions">
        <Button onClick={onBatal} type="button" variant="secondary">
          Kembali ke daftar
        </Button>
        <Button loading={pending} type="submit" variant="primary">
          {item ? "Simpan Perubahan" : "Simpan Jabatan"}
        </Button>
      </div>
    </form>
  );
}

type Tampilan = { jenis: "daftar" } | { jenis: "form"; item: JabatanKelolaItem | null };

/**
 * Tombol "Kelola Jabatan" yang membuka modal daftar jabatan.
 *
 * Daftar, tambah, ubah, dan hapus jabatan terjadi di dalam satu dialog,
 * sehingga halaman utama tidak perlu menampilkan tabel jabatan.
 */
export function KelolaJabatanDialog({
  jabatan,
  bolehUbah,
  bolehHapus,
  tombolClassName = "button button-secondary",
}: {
  jabatan: readonly JabatanKelolaItem[];
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

  function hapusJabatan(item: JabatanKelolaItem) {
    const formData = new FormData();
    formData.set("id", String(item.id));
    mulaiHapus(async () => {
      try {
        await hapusJabatanAction(formData);
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
        Kelola Jabatan{jabatan.length ? ` (${jabatan.length})` : ""}
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
                    {tampilan.jenis === "form" ? labelJudul(tampilan.item) : "Jabatan & Tugas"}
                  </h2>
                  <p>
                    {tampilan.jenis === "form"
                      ? "Nama, jenis, urutan, dan tugas pokok serta fungsi jabatan."
                      : "Dipakai pada profil dan struktur organisasi perangkat desa."}
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
                <FormJabatan
                  item={tampilan.item}
                  onBatal={() => setTampilan({ jenis: "daftar" })}
                  onSelesai={() => setTampilan({ jenis: "daftar" })}
                />
              ) : (
                <div className="jabatan-body">
                  <div className="jabatan-toolbar">
                    <span className="jabatan-count">{jabatan.length} jabatan</span>
                    {bolehUbah ? (
                      <button
                        className="button button-primary"
                        onClick={() => setTampilan({ jenis: "form", item: null })}
                        type="button"
                      >
                        Tambah Jabatan
                      </button>
                    ) : null}
                  </div>

                  {jabatan.length ? (
                    <TableScroll className="modul-table-wrap">
                      <Table className="modul-table jabatan-table">
                        <THead>
                          <Row>
                            <HeaderCell>No</HeaderCell>
                            <HeaderCell>Nama Jabatan</HeaderCell>
                            <HeaderCell>Jenis</HeaderCell>
                            <HeaderCell>Urutan</HeaderCell>
                            <HeaderCell>Aparat</HeaderCell>
                            <HeaderCell>Tugas Pokok &amp; Fungsi</HeaderCell>
                            <HeaderCell>Aksi</HeaderCell>
                          </Row>
                        </THead>
                        <TBody>
                          {jabatan.map((item, index) => (
                            <Row key={item.id}>
                              <Cell>{index + 1}</Cell>
                              <Cell>
                                <strong>{item.nama}</strong>
                              </Cell>
                              <Cell>
                                <span className="jabatan-badges">
                                  {badgeJenis(item) ? (
                                    <span className="jabatan-badge">{badgeJenis(item)}</span>
                                  ) : null}
                                  {item.jenis !== "lainnya" ? (
                                    <span className="jabatan-badge jabatan-badge-wajib">Wajib</span>
                                  ) : null}
                                  {!badgeJenis(item) && item.jenis === "lainnya" ? (
                                    <span className="jabatan-badge">{labelJenis(item.jenis)}</span>
                                  ) : null}
                                </span>
                              </Cell>
                              <Cell>{item.urut}</Cell>
                              <Cell>{item.jumlahAparat}</Cell>
                              <Cell>
                                {item.tupoksi ? (
                                  <span className="jabatan-tupoksi-sel">{item.tupoksi}</span>
                                ) : (
                                  "—"
                                )}
                              </Cell>
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
                                  {bolehHapus && item.jenis === "lainnya" ? (
                                    konfirmasiHapus === item.id ? (
                                      <span className="table-actions">
                                        <Button
                                          loading={menghapus}
                                          onClick={() => hapusJabatan(item)}
                                          size="sm"
                                          type="button"
                                          variant="danger"
                                        >
                                          Hapus jabatan
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
                      Belum ada jabatan. Tambahkan Kepala Desa terlebih dahulu.
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
