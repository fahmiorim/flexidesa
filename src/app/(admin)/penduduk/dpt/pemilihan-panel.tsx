"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { ElectionDTO } from "@/features/penduduk/domain/dpt";
import { createIdleActionState } from "@/lib/action-state";

import { hapusPemilihanAction, simpanPemilihanAction } from "./actions";

const STATUS_LABELS = {
  draf: "Draf",
  aktif: "Aktif",
  selesai: "Selesai",
} as const;

function tone(status: ElectionDTO["status"]): "hijau" | "oranye" | "netral" {
  if (status === "aktif") return "hijau";
  if (status === "selesai") return "oranye";
  return "netral";
}

export function PanelPemilihan({
  elections,
  edit,
  bolehUbah,
  bolehHapus,
}: {
  elections: ElectionDTO[];
  edit: ElectionDTO | null;
  bolehUbah: boolean;
  bolehHapus: boolean;
}) {
  const [state, action, pending] = useActionState(
    simpanPemilihanAction.bind(null, edit?.id ?? null),
    createIdleActionState<{ id: number }>(),
  );

  return (
    <section className="platform-card dpt-election-panel" id="pemilihan">
      <div className="penduduk-card-head">
        <div>
          <h2>{edit ? "Ubah Pemilihan" : "Kelola Pemilihan"}</h2>
          <p>
            DPT dihitung pada tanggal pemilihan berstatus aktif. Hanya satu pemilihan yang boleh
            aktif dalam satu waktu.
          </p>
        </div>
        {edit ? (
          <Link className="penduduk-reset" href="/penduduk/dpt#pemilihan">
            Batal ubah
          </Link>
        ) : null}
      </div>

      {bolehUbah ? (
        <form action={action} className="dpt-election-form">
          {edit ? <input name="id" type="hidden" value={edit.id} /> : null}
          <label className="dpt-election-title">
            <span>Nama pemilihan</span>
            <input
              defaultValue={edit?.judul ?? ""}
              maxLength={200}
              name="judul"
              placeholder="Contoh: Pemilihan Kepala Desa 2026"
              required
            />
          </label>
          <label>
            <span>Tanggal pemilihan</span>
            <input
              defaultValue={edit?.tanggal ?? new Date().toISOString().slice(0, 10)}
              name="tanggal"
              required
              type="date"
            />
          </label>
          <label>
            <span>Status</span>
            <select defaultValue={edit?.status ?? "draf"} name="status">
              <option value="draf">Draf</option>
              <option value="aktif">Aktif</option>
              <option value="selesai">Selesai</option>
            </select>
          </label>
          <label className="dpt-election-note">
            <span>Keterangan</span>
            <input
              defaultValue={edit?.keterangan ?? ""}
              maxLength={1000}
              name="keterangan"
              placeholder="Opsional"
            />
          </label>
          <div className="dpt-election-actions">
            <button className="button button-primary" disabled={pending} type="submit">
              {pending ? "Menyimpan..." : edit ? "Simpan Perubahan" : "Simpan Pemilihan"}
            </button>
            {state.status === "success" ? (
              <p className="dpt-form-success">{state.message}</p>
            ) : null}
            {state.status === "error" ? <p className="dpt-form-error">{state.message}</p> : null}
          </div>
        </form>
      ) : null}

      {elections.length === 0 ? (
        <p className="modul-empty">
          Belum ada pemilihan. Buat pemilihan dan set statusnya menjadi aktif agar daftar calon
          pemilih dapat dihitung.
        </p>
      ) : (
        <div className="modul-scroll">
          <table className="modul-table dpt-election-table">
            <thead>
              <tr>
                <th scope="col">Pemilihan</th>
                <th scope="col">Tanggal</th>
                <th scope="col">Status</th>
                <th scope="col">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {elections.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.judul}</strong>
                    {item.keterangan ? (
                      <span className="modul-muted">{item.keterangan}</span>
                    ) : null}
                  </td>
                  <td>{item.tanggal}</td>
                  <td>
                    <span className="beranda-chip" data-tone={tone(item.status)}>
                      {STATUS_LABELS[item.status]}
                    </span>
                  </td>
                  <td>
                    <div className="dpt-election-row-actions">
                      {bolehUbah ? (
                        <Link
                          className="penduduk-aksi"
                          href={`/penduduk/dpt?election=${item.id}#pemilihan`}
                        >
                          Ubah
                        </Link>
                      ) : null}
                      {bolehHapus ? (
                        <form
                          action={hapusPemilihanAction}
                          onSubmit={(event) => {
                            if (!window.confirm(`Hapus pemilihan "${item.judul}"?`)) {
                              event.preventDefault();
                            }
                          }}
                        >
                          <input name="id" type="hidden" value={item.id} />
                          <button className="dpt-link-danger" type="submit">
                            Hapus
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
