"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import type { StatusTemplate } from "@/features/multi-desa/domain/template-website";
import { createIdleActionState, type ActionState } from "@/lib/action-state";

export interface PenggunaanTemplateTampil {
  villageId: number;
  namaDesa: string | null;
  domain: string | null;
  themeNama: string;
  versi: string;
  diperbaruiPada: string;
}

type AksiStatus = (
  state: ActionState<{ status: StatusTemplate }>,
  formData: FormData,
) => Promise<ActionState<{ status: StatusTemplate }>>;

type AksiDistribusi = (
  state: ActionState<{ jumlah: number }>,
  formData: FormData,
) => Promise<ActionState<{ jumlah: number }>>;

export function AksiStatusTemplate({
  aksi,
  id,
  status,
  versiTertinggal,
}: {
  aksi: AksiStatus;
  id: number;
  status: StatusTemplate;
  versiTertinggal: number;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    aksi,
    createIdleActionState<{ status: StatusTemplate }>(),
  );

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [router, state]);

  const berikutnya: { status: StatusTemplate; label: string }[] =
    status === "published"
      ? [{ status: "archived", label: "Arsipkan" }]
      : [{ status: "published", label: status === "archived" ? "Terbitkan ulang" : "Terbitkan" }];

  return (
    <div className="template-status-actions">
      {berikutnya.map((item) => (
        <form action={formAction} key={item.status}>
          <input name="id" type="hidden" value={id} />
          <input name="status" type="hidden" value={item.status} />
          <button className="button button-secondary" disabled={pending} type="submit">
            {pending ? "Menyimpan..." : item.label}
          </button>
        </form>
      ))}
      {status === "published" && versiTertinggal > 0 ? (
        <span className="template-warning">{versiTertinggal} tenant tertinggal versi</span>
      ) : null}
      {state.status === "error" ? (
        <span className="alert alert-error" role="alert">
          {state.message}
        </span>
      ) : null}
      {state.status === "success" ? (
        <span className="alert alert-info" role="status">
          {state.message}
        </span>
      ) : null}
    </div>
  );
}

export function FormDistribusiTemplate({
  aksi,
  id,
  penggunaan,
  versi,
}: {
  aksi: AksiDistribusi;
  id: number;
  penggunaan: PenggunaanTemplateTampil[];
  versi: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    aksi,
    createIdleActionState<{ jumlah: number }>(),
  );
  const [dipilih, setDipilih] = useState<number[]>([]);

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [router, state]);

  const tertinggal = penggunaan.filter((item) => item.versi !== versi);

  if (penggunaan.length === 0) {
    return (
      <p className="form-help">
        Belum ada tenant yang memakai template ini. Distribusi versi hanya tersedia untuk tenant
        dengan tema aktif yang sama.
      </p>
    );
  }

  return (
    <form action={formAction} className="template-distribution">
      <div className="template-distribution-head">
        <div>
          <strong>Kirim pembaruan versi {versi}</strong>
          <p>
            {tertinggal.length > 0
              ? `${tertinggal.length} tenant masih memakai versi lama.`
              : "Semua tenant sudah memakai versi ini."}
          </p>
        </div>
        <div className="platform-row-actions">
          <button
            className="button button-secondary"
            onClick={() =>
              setDipilih(
                tertinggal.length > 0
                  ? tertinggal.map((item) => item.villageId)
                  : penggunaan.map((item) => item.villageId),
              )
            }
            type="button"
          >
            Pilih semua
          </button>
          <button className="button button-secondary" onClick={() => setDipilih([])} type="button">
            Kosongkan
          </button>
        </div>
      </div>

      <TableScroll className="tenant-table-scroll">
        <Table className="tenant-table">
          <THead>
            <Row>
              <HeaderCell scope="col">
                <span className="sr-only">Pilih</span>
              </HeaderCell>
              <HeaderCell scope="col">Desa</HeaderCell>
              <HeaderCell scope="col">Domain</HeaderCell>
              <HeaderCell scope="col">Tema</HeaderCell>
              <HeaderCell scope="col">Versi</HeaderCell>
              <HeaderCell scope="col">Diperbarui</HeaderCell>
            </Row>
          </THead>
          <TBody>
            {penggunaan.map((item) => (
              <Row key={item.villageId}>
                <Cell>
                  <input
                    aria-label={`Pilih ${item.namaDesa ?? "desa"}`}
                    checked={dipilih.includes(item.villageId)}
                    name="villageIds"
                    onChange={(event) =>
                      setDipilih((sebelum) =>
                        event.target.checked
                          ? [...sebelum, item.villageId]
                          : sebelum.filter((id) => id !== item.villageId),
                      )
                    }
                    type="checkbox"
                    value={item.villageId}
                  />
                </Cell>
                <Cell>
                  <strong>{item.namaDesa ?? "Tanpa nama"}</strong>
                </Cell>
                <Cell>
                  {item.domain ?? <span className="tenant-secondary">Belum ada domain</span>}
                </Cell>
                <Cell>{item.themeNama}</Cell>
                <Cell>
                  <span
                    className={
                      item.versi === versi ? "template-version" : "template-version is-warning"
                    }
                  >
                    v{item.versi}
                  </span>
                </Cell>
                <Cell>{item.diperbaruiPada}</Cell>
              </Row>
            ))}
          </TBody>
        </Table>
      </TableScroll>

      <input name="id" type="hidden" value={id} />
      <div className="template-distribution-foot">
        <span>{dipilih.length} tenant dipilih</span>
        <button
          className="button button-primary"
          disabled={pending || dipilih.length === 0}
          type="submit"
        >
          {pending ? "Mengirim..." : "Kirim pembaruan"}
        </button>
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

/** Ganti template aktif satu desa (mis. Kwala Gunung) dari Super Admin. */
export function FormGantiTemplateDesa({
  aksi,
  id,
  desa,
}: {
  aksi: AksiDistribusi;
  id: number;
  desa: { id: number; namaDesa: string | null }[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    aksi,
    createIdleActionState<{ jumlah: number }>(),
  );

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [router, state]);

  return (
    <form action={formAction} className="template-distribution">
      <p className="form-help">
        Terapkan template ini sebagai tema aktif satu desa. Situs publik desa langsung memakai token
        template ini.
      </p>
      <label className="form-field">
        <span className="form-label">Desa</span>
        <select className="form-input" name="villageId" required defaultValue="">
          <option value="" disabled>
            — Pilih desa —
          </option>
          {desa.map((item) => (
            <option key={item.id} value={item.id}>
              {item.namaDesa ?? `Desa #${item.id}`}
            </option>
          ))}
        </select>
      </label>
      <input name="id" type="hidden" value={id} />
      <button className="button button-primary" disabled={pending} type="submit">
        {pending ? "Menerapkan..." : "Terapkan ke desa"}
      </button>
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
