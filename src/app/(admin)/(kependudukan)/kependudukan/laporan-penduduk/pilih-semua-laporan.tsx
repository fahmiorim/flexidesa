"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Checkbox "pilih semua" untuk tabel Laporan Penduduk.
 *
 * Menandai seluruh baris pada halaman ini
 * sehingga tombol Hapus massal bisa dipakai. Status indeterminate dipakai saat
 * hanya sebagian baris terpilih.
 */
export function PilihSemuaLaporan() {
  const [semua, setSemua] = useState(false);
  const [sebagian, setSebagian] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sinkron = () => {
      const kotak = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="id_cb"]'));
      const terpilih = kotak.filter((item) => item.checked).length;
      setSemua(kotak.length > 0 && terpilih === kotak.length);
      setSebagian(terpilih > 0 && terpilih < kotak.length);
    };
    sinkron();
    document.addEventListener("change", sinkron);
    return () => document.removeEventListener("change", sinkron);
  }, []);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = sebagian;
  }, [sebagian]);

  return (
    <input
      aria-label="Pilih semua laporan pada halaman ini"
      checked={semua}
      onChange={() => {
        const tujuan = !semua;
        document
          .querySelectorAll<HTMLInputElement>('input[name="id_cb"]')
          .forEach((item) => (item.checked = tujuan));
        setSemua(tujuan);
        setSebagian(false);
      }}
      ref={ref}
      type="checkbox"
    />
  );
}
