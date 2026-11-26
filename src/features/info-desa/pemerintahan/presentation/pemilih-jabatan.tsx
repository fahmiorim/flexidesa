"use client";

import { useEffect, useRef, useState } from "react";

interface OpsiJabatan {
  id: number;
  nama: string;
  /** Nama aparat aktif yang sudah memakai jabatan ini. */
  pemakai: string[];
}

interface Props {
  defaultValue: number | null;
  options: OpsiJabatan[];
}

/**
 * Pemilih jabatan aparat desa.
 *
 * OpenSID mengizinkan beberapa pamong berbagi satu jabatan (mis. staf), jadi
 * pemilihan tidak diblokir. Sebagai gantinya, jabatan yang sudah dipegang
 * aparat aktif ditandai dan pilihan ganda diberi peringatan agar operator
 * tidak tanpa sengaja merangkap jabatan struktural.
 */
export function PemilihJabatan({ defaultValue, options }: Props) {
  const selectRef = useRef<HTMLSelectElement>(null);
  const nilaiAwal = defaultValue ? String(defaultValue) : "";
  const [nilai, setNilai] = useState(nilaiAwal);

  // Dialog memanggil form.reset(); samakan state dengan nilai awal form.
  useEffect(() => {
    const form = selectRef.current?.closest("form");
    if (!form) return;
    const padaReset = () => setNilai(nilaiAwal);
    form.addEventListener("reset", padaReset);
    return () => form.removeEventListener("reset", padaReset);
  }, [nilaiAwal]);

  const pemakai = options.find((opsi) => String(opsi.id) === nilai)?.pemakai ?? [];

  return (
    <>
      <select
        name="jabatanId"
        onChange={(event) => setNilai(event.target.value)}
        ref={selectRef}
        value={nilai}
      >
        <option value="">Pilih jabatan</option>
        {options.map((opsi) => (
          <option key={opsi.id} value={opsi.id}>
            {opsi.nama}
            {opsi.pemakai.length ? ` — dipakai ${opsi.pemakai.join(", ")}` : ""}
          </option>
        ))}
      </select>
      {pemakai.length ? (
        <small className="pemerintahan-jabatan-peringatan" role="status">
          Jabatan ini sudah dipakai {pemakai.join(", ")}. Pastikan perangkapan jabatan memang
          disengaja.
        </small>
      ) : null}
    </>
  );
}
