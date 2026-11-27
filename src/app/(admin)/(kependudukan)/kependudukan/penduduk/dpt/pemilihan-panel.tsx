"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import type { ElectionDTO } from "@/features/kependudukan/penduduk/domain/dpt";
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
          <Link className="penduduk-reset" href="/kependudukan/penduduk/dpt#pemilihan">
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
            <Button variant="primary" disabled={pending} type="submit">
              {pending ? "Menyimpan..." : edit ? "Simpan Perubahan" : "Simpan Pemilihan"}
            </Button>
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
        <TableScroll>
          <Table className="dpt-election-table">
            <THead>
              <Row>
                <HeaderCell scope="col">Pemilihan</HeaderCell>
                <HeaderCell scope="col">Tanggal</HeaderCell>
                <HeaderCell scope="col">Status</HeaderCell>
                <HeaderCell scope="col">Aksi</HeaderCell>
              </Row>
            </THead>
            <TBody>
              {elections.map((item) => (
                <Row key={item.id}>
                  <Cell>
                    <strong>{item.judul}</strong>
                    {item.keterangan ? (
                      <span className="modul-muted">{item.keterangan}</span>
                    ) : null}
                  </Cell>
                  <Cell>{item.tanggal}</Cell>
                  <Cell>
                    <span className="beranda-chip" data-tone={tone(item.status)}>
                      {STATUS_LABELS[item.status]}
                    </span>
                  </Cell>
                  <Cell>
                    <div className="dpt-election-row-actions">
                      {bolehUbah ? (
                        <Link
                          className="penduduk-aksi"
                          href={`/kependudukan/penduduk/dpt?election=${item.id}#pemilihan`}
                        >
                          Ubah
                        </Link>
                      ) : null}
                      {bolehHapus ? (
                        <DialogHapusForm
                          aksi={hapusPemilihanAction}
                          id={item.id}
                          judul={`Hapus pemilihan "${item.judul}"?`}
                          keterangan="Pemilihan dan data calon pemilihnya akan dihapus permanen."
                          labelAksi="Hapus pemilihan"
                        />
                      ) : null}
                    </div>
                  </Cell>
                </Row>
              ))}
            </TBody>
          </Table>
        </TableScroll>
      )}
    </section>
  );
}
