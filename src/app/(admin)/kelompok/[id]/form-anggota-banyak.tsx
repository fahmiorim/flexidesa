"use client";

import Link from "next/link";
import { useActionState } from "react";

import { simpanAnggotaKelompokBanyakAction } from "@/app/(admin)/kelompok/actions";
import { PesanDialog } from "@/features/multi-desa/presentation/dialog-bagian";
import { createIdleActionState } from "@/lib/action-state";
import type { LabelOption } from "@/lib/forms";

export function FormAnggotaBanyak({
  kelompokId,
  penduduk,
}: {
  kelompokId: number;
  penduduk: LabelOption[];
}) {
  const aksi = simpanAnggotaKelompokBanyakAction.bind(null, kelompokId);
  const [state, formAction, pending] = useActionState(
    aksi,
    createIdleActionState<{ id: number }>(),
  );

  return (
    <form action={formAction} className="form-stack">
      <PesanDialog state={state} />
      {penduduk.length === 0 ? (
        <p className="form-help">Tidak ada penduduk yang tersedia untuk ditambahkan.</p>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pilih</th>
                <th>Penduduk</th>
              </tr>
            </thead>
            <tbody>
              {penduduk.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input aria-label={item.label} name="idCb" type="checkbox" value={item.id} />
                  </td>
                  <td>{item.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="penduduk-heading-actions">
        <Link className="button button-secondary" href={`/kelompok/${kelompokId}`}>
          Batal
        </Link>
        <button className="button button-primary" disabled={pending} type="submit">
          {pending ? "Menyimpan…" : "Simpan Anggota Terpilih"}
        </button>
      </div>
    </form>
  );
}
