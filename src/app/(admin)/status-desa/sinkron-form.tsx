"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { createIdleActionState } from "@/lib/action-state";

import { sinkronkanIdmAction } from "./actions";

export function SinkronIdmForm({ tahun }: { tahun: number }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    sinkronkanIdmAction,
    createIdleActionState<{ jumlah: number }>(),
  );

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className="sd-sinkron">
      <input name="tahun" type="hidden" value={tahun} />
      <button className="button button-primary" disabled={pending} type="submit">
        {pending ? "Menyinkronkan…" : "Sinkronkan IDM"}
      </button>
      {state.status === "idle" ? null : (
        <p
          className={
            state.status === "success" ? "sd-sinkron-pesan is-ok" : "sd-sinkron-pesan is-gagal"
          }
          role="status"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
