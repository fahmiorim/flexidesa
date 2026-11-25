"use client";

import { useEffect, useRef } from "react";

import { EVENT_PILIH_PENDUDUK } from "./pemilih-penduduk";

interface PendudukTerpilih {
  nama?: string | null;
  jenisKelamin?: string | null;
  tempatLahir?: string | null;
  tanggalLahir?: string | null;
  agama?: string | null;
  pendidikan?: string | null;
}

/**
 * Pengisi otomatis field identitas aparat dari data penduduk.
 *
 * Mendengarkan pilihan pada PemilihPenduduk di form yang sama lalu mengisi
 * field nama, jenis kelamin, tempat/tanggal lahir, agama, dan pendidikan.
 * Nilai kosong dari data penduduk tidak menimpa isian manual. Pendengar
 * dipasang pada form terdekat agar dialog per baris tidak saling memengaruhi.
 */
export function PengisiPenduduk() {
  const penandaRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const form = penandaRef.current?.closest("form");
    if (!form) return;

    function padaPilih(event: Event) {
      const detail = (event as CustomEvent<PendudukTerpilih | null>).detail;
      if (!detail) return;
      const isi = (namaField: string, nilai: string | null | undefined) => {
        if (!nilai) return;
        const field = form?.querySelector<HTMLInputElement | HTMLSelectElement>(
          `[name="${namaField}"]`,
        );
        if (field) field.value = nilai;
      };
      isi("nama", detail.nama);
      isi("jenisKelamin", detail.jenisKelamin);
      isi("tempatLahir", detail.tempatLahir);
      isi("tanggalLahir", detail.tanggalLahir);
      isi("agama", detail.agama);
      isi("pendidikan", detail.pendidikan);
    }

    form.addEventListener(EVENT_PILIH_PENDUDUK, padaPilih);
    return () => form.removeEventListener(EVENT_PILIH_PENDUDUK, padaPilih);
  }, []);

  return <span hidden ref={penandaRef} />;
}
