"use client";

import { useRef } from "react";

/**
 * Tombol hapus massal data terdata.
 *
 * Checkbox `idTerdata` berada di dalam tabel, sedangkan form-nya dirender di
 * luar tabel agar tidak ada form bersarang. Id terpilih disalin ke form ini saat
 * tombol ditekan, lalu form dikirim ke Server Action.
 */
export function HapusMassalTerdata({
  aksi,
  suplemenId,
}: {
  aksi: (formData: FormData) => Promise<never>;
  suplemenId: number;
}) {
  const ref = useRef<HTMLFormElement>(null);

  return (
    <>
      <button
        className="button button-danger"
        onClick={() => {
          const ids = Array.from(
            document.querySelectorAll<HTMLInputElement>('input[name="idTerdata"]:checked'),
          ).map((input) => input.value);

          if (ids.length === 0) {
            window.alert("Pilih minimal satu data terdata yang akan dihapus.");
            return;
          }
          if (!window.confirm(`Hapus ${ids.length} data terdata terpilih?`)) return;

          const form = ref.current;
          if (!form) return;
          form.querySelectorAll("input[data-id-terdata]").forEach((item) => item.remove());
          for (const id of ids) {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = "idTerdata";
            input.value = id;
            input.dataset.idTerdata = "1";
            form.appendChild(input);
          }
          form.requestSubmit();
        }}
        type="button"
      >
        Hapus
      </button>

      <form action={aksi} hidden ref={ref}>
        <input name="suplemenId" type="hidden" value={suplemenId} />
      </form>
    </>
  );
}
