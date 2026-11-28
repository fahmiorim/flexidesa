"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { SecondaryText } from "@/components/ui/secondary-text";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { createIdleActionState, type ActionState } from "@/lib/action-state";

/**
 * Konsol pengguna platform.
 *
 * Setiap baris memakai `useActionState` sendiri agar kegagalan satu aksi tidak
 * mengosongkan form atau pesan baris lain. Server Action diterima lewat prop
 * supaya lapisan presentation tidak bergantung pada folder route.
 */

interface PenggunaPlatformRowTampil {
  id: string;
  name: string;
  email: string;
  username: string | null;
  roleName: string | null;
  roleSlug: string | null;
  active: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  sesiAktif: number;
}

interface HasilResetSandi {
  username: string | null;
  email: string;
  sandiSementara: string;
}

interface AksiPengguna {
  status: (
    state: ActionState<{ active: boolean }>,
    formData: FormData,
  ) => Promise<ActionState<{ active: boolean }>>;
  reset: (
    state: ActionState<HasilResetSandi>,
    formData: FormData,
  ) => Promise<ActionState<HasilResetSandi>>;
  cabut: (
    state: ActionState<{ jumlah: number }>,
    formData: FormData,
  ) => Promise<ActionState<{ jumlah: number }>>;
}

const tanggal = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });
const angka = new Intl.NumberFormat("id-ID");

function Pesan({ state }: { state: ActionState<unknown> }) {
  if (state.status === "idle") return null;

  const error = state.status === "error";
  return (
    <p
      className={error ? "alert alert-error" : "alert alert-info"}
      role={error ? "alert" : "status"}
    >
      {state.message}
    </p>
  );
}

function BarisPengguna({
  pengguna,
  idSaya,
  aksi,
}: {
  pengguna: PenggunaPlatformRowTampil;
  idSaya: string;
  aksi: AksiPengguna;
}) {
  const [statusState, statusAction, statusPending] = useActionState(
    aksi.status,
    createIdleActionState<{ active: boolean }>(),
  );
  const [resetState, resetAction, resetPending] = useActionState(
    aksi.reset,
    createIdleActionState<HasilResetSandi>(),
  );
  const [cabutState, cabutAction, cabutPending] = useActionState(
    aksi.cabut,
    createIdleActionState<{ jumlah: number }>(),
  );

  const diriSendiri = pengguna.id === idSaya;

  return (
    <tr>
      <td>
        <strong>{pengguna.name}</strong>
        <SecondaryText>{pengguna.email}</SecondaryText>
      </td>
      <td>
        {pengguna.username ?? <SecondaryText>—</SecondaryText>}
        {diriSendiri ? <SecondaryText>Akun Anda</SecondaryText> : null}
      </td>
      <td>
        {pengguna.roleName ?? <SecondaryText>Tanpa role</SecondaryText>}
        {pengguna.roleSlug ? <SecondaryText>{pengguna.roleSlug}</SecondaryText> : null}
      </td>
      <td>
        <span className={pengguna.active ? "tenant-status is-active" : "tenant-status is-inactive"}>
          <span aria-hidden="true" />
          {pengguna.active ? "Aktif" : "Nonaktif"}
        </span>
      </td>
      <td>{angka.format(pengguna.sesiAktif)}</td>
      <td>
        {pengguna.lastLoginAt ? (
          tanggal.format(new Date(pengguna.lastLoginAt))
        ) : (
          <SecondaryText>Belum pernah</SecondaryText>
        )}
      </td>
      <td>
        <div className="ui-toolbar-actions">
          <form action={statusAction}>
            <input name="id" type="hidden" value={pengguna.id} />
            <input name="active" type="hidden" value={pengguna.active ? "false" : "true"} />
            <Button
              disabled={statusPending || (diriSendiri && pengguna.active)}
              title={
                diriSendiri && pengguna.active
                  ? "Akun yang sedang dipakai tidak dapat dinonaktifkan"
                  : undefined
              }
              type="submit"
              variant="secondary"
            >
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
        </div>

        <Pesan state={statusState} />
        <Pesan state={resetState} />
        <Pesan state={cabutState} />
        {resetState.status === "success" ? (
          <p className="tenant-secret" aria-live="polite">
            Sandi sementara untuk{" "}
            <strong>{resetState.data.username ?? resetState.data.email}</strong>:{" "}
            <code>{resetState.data.sandiSementara}</code>
          </p>
        ) : null}
      </td>
    </tr>
  );
}

export function PenggunaPlatformConsole({
  pengguna,
  idSaya,
  aksi,
}: {
  pengguna: PenggunaPlatformRowTampil[];
  idSaya: string;
  aksi: AksiPengguna;
}) {
  return (
    <>
      <TableScroll frame>
        <Table>
          <THead>
            <Row>
              <HeaderCell scope="col">Nama</HeaderCell>
              <HeaderCell scope="col">Username</HeaderCell>
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
                <BarisPengguna aksi={aksi} idSaya={idSaya} key={item.id} pengguna={item} />
              ))
            ) : (
              <Row>
                <Cell className="tenant-empty" colSpan={7}>
                  Belum ada akun platform. Tambahkan pengguna pertama lewat tombol di atas.
                </Cell>
              </Row>
            )}
          </TBody>
        </Table>
      </TableScroll>
    </>
  );
}
