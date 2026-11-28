"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { SecondaryText } from "@/components/ui/secondary-text";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import type { ModulePermissionRow } from "@/features/pengaturan/rbac/domain/grup";
import { createIdleActionState, type ActionState } from "@/lib/action-state";

interface Props {
  roleId: number;
  permissions: ModulePermissionRow[];
  readOnly: boolean;
  aksi: (state: ActionState<null>, formData: FormData) => Promise<ActionState<null>>;
  resetAction: (formData: FormData) => Promise<void>;
}

export function FormIzin({ roleId, permissions, readOnly, aksi, resetAction }: Props) {
  const [state, formAction, pending] = useActionState(aksi, createIdleActionState<null>());

  return (
    <form action={formAction} className="pengguna-izin-form">
      <input name="roleId" type="hidden" value={roleId} />

      <TableScroll frame>
        <Table className="pengguna-izin-table">
          <THead>
            <Row>
              <HeaderCell scope="col">Modul</HeaderCell>
              <HeaderCell scope="col">Lihat</HeaderCell>
              <HeaderCell scope="col">Tambah</HeaderCell>
              <HeaderCell scope="col">Ubah</HeaderCell>
              <HeaderCell scope="col">Hapus</HeaderCell>
            </Row>
          </THead>
          <TBody>
            {permissions.map((modul) => (
              <Row key={modul.moduleId} data-grup={modul.isGroup || undefined}>
                <Cell style={{ paddingLeft: modul.parentId === null ? 16 : 32 }}>
                  <span className={modul.isGroup ? "modul-strong" : undefined}>{modul.name}</span>
                  <SecondaryText>{modul.slug}</SecondaryText>
                </Cell>
                {(["read", "create", "update", "delete"] as const).map((akses) => (
                  <Cell key={akses}>
                    <input
                      aria-label={`${modul.name}: ${akses}`}
                      defaultChecked={modul[akses]}
                      disabled={readOnly}
                      name={`${akses}-${modul.moduleId}`}
                      type="checkbox"
                    />
                    <input name="moduleId" type="hidden" value={modul.moduleId} />
                  </Cell>
                ))}
              </Row>
            ))}
          </TBody>
        </Table>
      </TableScroll>

      <div className="pengguna-izin-footer">
        <p>Izin Lihat wajib aktif sebelum Tambah/Ubah/Hapus. Reset = default-deny.</p>
        {readOnly ? (
          <span className="pengguna-rail-note">Grup sistem tidak dapat diubah.</span>
        ) : (
          <div className="pengguna-izin-actions">
            <Button loading={pending} type="submit" variant="primary">
              Simpan izin
            </Button>
            <Button variant="secondary" disabled={pending} formAction={resetAction} type="submit">
              Reset ke Default
            </Button>
          </div>
        )}
      </div>

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
    </form>
  );
}
