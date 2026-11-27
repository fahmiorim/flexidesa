"use client";

import Link from "next/link";
import { useActionState } from "react";

import { simpanAnggotaKelompokBanyakAction } from "@/app/(admin)/(kependudukan)/kependudukan/kelompok/actions";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { PesanDialog } from "@/features/multi-desa/presentation/dialog-bagian";
import { createIdleActionState } from "@/lib/action-state";
import type { LabelOption } from "@/lib/forms";

export function FormAnggotaBanyak({
  kelompokId,
  penduduk,
  labelKembali,
}: {
  kelompokId: number;
  penduduk: LabelOption[];
  labelKembali?: string;
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
        <TableScroll>
          <Table>
            <THead>
              <Row>
                <HeaderCell>Pilih</HeaderCell>
                <HeaderCell>Penduduk</HeaderCell>
              </Row>
            </THead>
            <TBody>
              {penduduk.map((item) => (
                <Row key={item.id}>
                  <Cell>
                    <input aria-label={item.label} name="idCb" type="checkbox" value={item.id} />
                  </Cell>
                  <Cell>{item.label}</Cell>
                </Row>
              ))}
            </TBody>
          </Table>
        </TableScroll>
      )}
      <div className="penduduk-heading-actions">
        {labelKembali ? (
          <Link
            className="penduduk-back penduduk-form-back"
            href={`/kependudukan/kelompok/${kelompokId}`}
          >
            {labelKembali}
          </Link>
        ) : null}
        <ButtonLink variant="secondary" href={`/kependudukan/kelompok/${kelompokId}`}>
          Batal
        </ButtonLink>
        <Button variant="primary" disabled={pending} type="submit">
          {pending ? "Menyimpan…" : "Simpan Anggota Terpilih"}
        </Button>
      </div>
    </form>
  );
}
