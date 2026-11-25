"use client";

import { useRef } from "react";

/**
 * Tombol Hapus massal Laporan Penduduk.
 *
 * Checkbox `id_cb` berada di dalam tabel, sedangkan form-nya dirender di luar
 * tabel agar tidak ada form bersarang. Id terpilih disalin ke form ini saat
 * tombol ditekan, lalu form dikirim ke Server Action.
 */
export function HapusMassalLaporan({ aksi }: { aksi: (formData: FormData) => Promise<void> }) {
  const ref = useRef<HTMLFormElement>(null);

  return (
    <>
      <button
        className="button button-danger"
        onClick={() => {
          const ids = Array.from(
            document.querySelectorAll<HTMLInputElement>('input[name="id_cb"]:checked'),
          ).map((input) => input.value);

          if (ids.length === 0) {
            window.alert("Pilih minimal satu laporan yang akan dihapus.");
            return;
          }
          if (!window.confirm(`Hapus ${ids.length} laporan terpilih beserta berkasnya?`)) return;

          const form = ref.current;
          if (!form) return;
          form.querySelectorAll("input[data-id-laporan]").forEach((item) => item.remove());
          for (const id of ids) {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = "id_cb";
            input.value = id;
            input.dataset.idLaporan = "1";
            form.appendChild(input);
          }
          form.requestSubmit();
        }}
        type="button"
      >
        Hapus
      </button>

      <form action={aksi} hidden ref={ref} />
    </>
  );
}
