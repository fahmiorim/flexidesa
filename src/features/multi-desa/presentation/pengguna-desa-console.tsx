"use client";

import { useActionState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SecondaryText } from "@/components/ui/secondary-text";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Cell,
  EmptyRow,
  HeaderCell,
  Row,
  Table,
  TableScroll,
  TBody,
  THead,
} from "@/components/ui/table";
import { createIdleActionState, type ActionState } from "@/lib/action-state";

/**
 * Konsol akun pengguna desa lintas tenant.
 *
 * Setiap baris memakai `useActionState` sendiri agar kegagalan satu aksi tidak
 * mengosongkan pesan baris lain. Tombol, badge, dan pesan memakai komponen
 * bersama; Server Action diterima lewat prop agar presentation tidak bergantung
 * pada folder route.
 */

interface PenggunaDesaRowTampil {
  id: string;
  name: string;
  email: string;
  username: string | null;
  villageId: number;
  villageName: string | null;
  roleName: string | null;
  roleSlug?: string | null;
  active: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  sesiAktif: number;
}

export interface HasilResetSandiDesa {
  username: string | null;
  email: string;
  sandiSementara: string;
}

export interface AksiPenggunaDesa {
  status: (
    state: ActionState<{ active: boolean }>,
    formData: FormData,
  ) => Promise<ActionState<{ active: boolean }>>;
  reset: (
    state: ActionState<HasilResetSandiDesa>,
    formData: FormData,
  ) => Promise<ActionState<HasilResetSandiDesa>>;
  cabut: (
    state: ActionState<{ jumlah: number }>,
    formData: FormData,
  ) => Promise<ActionState<{ jumlah: number }>>;
  /** Masuk sebagai administrator desa ini (impersonasi); hanya untuk role administrator. */
  masukSebagai?: (
    state: ActionState<{ villageId: number; targetUserId: string }>,
    formData: FormData,
  ) => Promise<ActionState<{ villageId: number; targetUserId: string }>>;
}

const tanggal = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });
const angka = new Intl.NumberFormat("id-ID");

function Pesan({ state }: { state: ActionState<unknown> }) {
  if (state.status === "idle") return null;
  return <Alert variant={state.status === "error" ? "error" : "info"}>{state.message}</Alert>;
}

function BarisPengguna({
  pengguna,
  aksi,
  tampilkanDesa,
}: {
  pengguna: PenggunaDesaRowTampil;
  aksi: AksiPenggunaDesa;
  tampilkanDesa: boolean;
}) {
  const [statusState, statusAction, statusPending] = useActionState(
    aksi.status,
    createIdleActionState<{ active: boolean }>(),
  );
  const [resetState, resetAction, resetPending] = useActionState(
    aksi.reset,
    createIdleActionState<HasilResetSandiDesa>(),
  );
  const [cabutState, cabutAction, cabutPending] = useActionState(
    aksi.cabut,
    createIdleActionState<{ jumlah: number }>(),
  );
  const [masukState, masukAction, masukPending] = useActionState(
    aksi.masukSebagai ??
      (async () => createIdleActionState<{ villageId: number; targetUserId: string }>()),
    createIdleActionState<{ villageId: number; targetUserId: string }>(),
  );

  const bisaMasukSebagai =
    aksi.masukSebagai !== undefined && pengguna.roleSlug === "administrator" && pengguna.active;

  return (
    <Row>
      <Cell>
        <strong>{pengguna.name}</strong>
        <SecondaryText>{pengguna.email}</SecondaryText>
      </Cell>
      <Cell>{pengguna.username ?? <SecondaryText>—</SecondaryText>}</Cell>
      {tampilkanDesa ? (
        <Cell>
          {pengguna.villageName ?? <SecondaryText>Tanpa nama</SecondaryText>}
          <SecondaryText>#{pengguna.villageId}</SecondaryText>
        </Cell>
      ) : null}
      <Cell>{pengguna.roleName ?? <SecondaryText>Tanpa role</SecondaryText>}</Cell>
      <Cell>
        <StatusBadge tone={pengguna.active ? "success" : "warning"}>
          {pengguna.active ? "Aktif" : "Nonaktif"}
        </StatusBadge>
      </Cell>
      <Cell>{angka.format(pengguna.sesiAktif)}</Cell>
      <Cell>
        {pengguna.lastLoginAt ? (
          tanggal.format(new Date(pengguna.lastLoginAt))
        ) : (
          <SecondaryText>Belum pernah</SecondaryText>
        )}
      </Cell>
      <Cell>
        <div className="ui-toolbar-actions">
          <form action={statusAction}>
            <input name="id" type="hidden" value={pengguna.id} />
            <input name="active" type="hidden" value={pengguna.active ? "false" : "true"} />
            <Button disabled={statusPending} type="submit" variant="secondary">
              {pengguna.active ? "Nonaktifkan" : "Aktifkan"}
            </Button>
          </form>
          <form action={resetAction}>
            <input name="id" type="hidden" value={pengguna.id} />
            <Button disabled={resetPending} type="submit" variant="secondary">
              {resetPending ? "Mereset..." : "Reset sandi"}
            </Button>
          </form>
          <form action={cabutAction}>
            <input name="id" type="hidden" value={pengguna.id} />
            <Button
              disabled={cabutPending || pengguna.sesiAktif === 0}
              type="submit"
              variant="secondary"
            >
              {cabutPending ? "Mencabut..." : "Cabut sesi"}
            </Button>
          </form>
          {bisaMasukSebagai ? (
            <form action={masukAction}>
              <input name="villageId" type="hidden" value={pengguna.villageId} />
              <Button disabled={masukPending} type="submit" variant="primary">
                {masukPending ? "Masuk..." : "Masuk sebagai"}
              </Button>
            </form>
          ) : null}
        </div>

        <Pesan state={statusState} />
        <Pesan state={resetState} />
        <Pesan state={cabutState} />
        <Pesan state={masukState} />
        {resetState.status === "success" ? (
          <Alert variant="info">
            Sandi sementara untuk{" "}
            <strong>{resetState.data.username ?? resetState.data.email}</strong>:{" "}
            <code>{resetState.data.sandiSementara}</code>
          </Alert>
        ) : null}
      </Cell>
    </Row>
  );
}

export function PenggunaDesaConsole({
  pengguna,
  aksi,
  tampilkanDesa = true,
}: {
  pengguna: PenggunaDesaRowTampil[];
  aksi: AksiPenggunaDesa;
  tampilkanDesa?: boolean;
}) {
  const kolom = tampilkanDesa ? 8 : 7;

  return (
    <TableScroll>
      <Table>
        <THead>
          <Row>
            <HeaderCell scope="col">Nama</HeaderCell>
            <HeaderCell scope="col">Username</HeaderCell>
            {tampilkanDesa ? <HeaderCell scope="col">Desa</HeaderCell> : null}
            <HeaderCell scope="col">Role</HeaderCell>
            <HeaderCell scope="col">Status</HeaderCell>
            <HeaderCell scope="col">Sesi</HeaderCell>
            <HeaderCell scope="col">Login terakhir</HeaderCell>
            <HeaderCell scope="col">Aksi</HeaderCell>
          </Row>
        </THead>
        <TBody>
          {pengguna.length > 0 ? (
            pengguna.map((item) => (
              <BarisPengguna
                aksi={aksi}
                key={item.id}
                pengguna={item}
                tampilkanDesa={tampilkanDesa}
              />
            ))
          ) : (
            <EmptyRow colSpan={kolom}>
              Tidak ada akun desa yang cocok dengan pencarian atau filter.
            </EmptyRow>
          )}
        </TBody>
      </Table>
    </TableScroll>
  );
}
