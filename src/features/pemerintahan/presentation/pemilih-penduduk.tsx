"use client";

import { useEffect, useId, useRef, useState } from "react";

interface Penduduk {
  id: number;
  nama: string;
  nik: string | null;
  jenisKelamin?: string | null;
  tempatLahir?: string | null;
  tanggalLahir?: string | null;
  agama?: string | null;
  pendidikan?: string | null;
}

interface Props {
  defaultValue: number | null;
  defaultLabel: string;
  name?: string;
}

/** Nama event untuk pengisi otomatis komponen lain dalam form yang sama. */
export const EVENT_PILIH_PENDUDUK = "pemilih-penduduk-terpilih";

function labelPenduduk(penduduk: Penduduk) {
  return penduduk.nik ? `${penduduk.nama} — NIK ${penduduk.nik}` : penduduk.nama;
}

/**
 * Pencarian penduduk untuk form aparat desa.
 *
 * Daftar penduduk tidak lagi dikirim seluruhnya ke halaman: pencarian dilakukan
 * ke `/api/pemerintahan/penduduk` dan hanya id penduduk yang dikirim lewat input
 * tersembunyi. Gaya memakai kelas pemilih yang sama dengan PemilihKepala wilayah.
 */
export function PemilihPenduduk({ defaultValue, defaultLabel, name = "residentId" }: Props) {
  const daftarId = useId();
  const wadahRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [terpilih, setTerpilih] = useState<{ id: number; label: string } | null>(
    defaultValue ? { id: defaultValue, label: defaultLabel || `Penduduk #${defaultValue}` } : null,
  );
  const [q, setQ] = useState("");
  const [hasil, setHasil] = useState<Penduduk[]>([]);
  const [buka, setBuka] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [aktif, setAktif] = useState(0);

  // Dialog memanggil form.reset() setelah simpan; kembalikan pilihan ke kondisi awal
  // agar dialog tambah berikutnya tidak mewarisi penduduk yang dipilih sebelumnya.
  useEffect(() => {
    const form = wadahRef.current?.closest("form");
    if (!form) return;
    const padaReset = () => {
      setTerpilih(defaultValue ? { id: defaultValue, label: defaultLabel } : null);
      setQ("");
      setHasil([]);
      setBuka(false);
      setGalat(null);
    };
    form.addEventListener("reset", padaReset);
    return () => form.removeEventListener("reset", padaReset);
  }, [defaultValue, defaultLabel]);

  useEffect(() => {
    const term = q.trim();
    if (!buka || term.length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setMemuat(true);
      setGalat(null);
      try {
        const response = await fetch(`/api/pemerintahan/penduduk?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Pencarian gagal.");
        const data = (await response.json()) as { hasil?: Penduduk[] };
        setHasil(data.hasil ?? []);
        setAktif(0);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setGalat("Pencarian penduduk gagal.");
      } finally {
        setMemuat(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [q, buka]);

  function arahkan(penduduk: Penduduk | null) {
    wadahRef.current?.dispatchEvent(
      new CustomEvent<Penduduk | null>(EVENT_PILIH_PENDUDUK, {
        bubbles: true,
        detail: penduduk,
      }),
    );
  }

  function pilih(penduduk: Penduduk) {
    setTerpilih({ id: penduduk.id, label: labelPenduduk(penduduk) });
    setBuka(false);
    setQ("");
    setHasil([]);
    arahkan(penduduk);
  }

  function kosongkan() {
    setTerpilih(null);
    setQ("");
    setHasil([]);
    arahkan(null);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <div className="wilayah-pemilih-kepala" ref={wadahRef}>
      <input name={name} type="hidden" value={terpilih?.id ?? ""} />

      {terpilih ? (
        <div className="wilayah-kepala-terpilih">
          <span>{terpilih.label}</span>
          <button className="button button-ghost" onClick={kosongkan} type="button">
            Kosongkan
          </button>
        </div>
      ) : (
        <>
          <input
            aria-autocomplete="list"
            aria-controls={daftarId}
            aria-expanded={buka}
            aria-label="Cari penduduk berdasarkan NIK atau nama"
            autoComplete="off"
            className="form-input"
            onChange={(event) => {
              const nilai = event.target.value;
              setQ(nilai);
              setBuka(true);
              if (nilai.trim().length < 2) {
                setHasil([]);
                setMemuat(false);
                setGalat(null);
              }
            }}
            onFocus={() => setBuka(true)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setBuka(false);
                return;
              }
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setBuka(true);
                setAktif((index) => Math.min(index + 1, Math.max(hasil.length - 1, 0)));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setAktif((index) => Math.max(index - 1, 0));
              }
              if (event.key === "Enter" && buka && hasil[aktif]) {
                event.preventDefault();
                pilih(hasil[aktif]);
              }
            }}
            placeholder="Ketik minimal 2 huruf NIK atau nama"
            ref={inputRef}
            role="combobox"
            value={q}
          />

          {buka && q.trim().length >= 2 ? (
            <ul className="wilayah-kepala-hasil" id={daftarId} role="listbox">
              {memuat ? <li className="wilayah-kepala-kosong">Mencari…</li> : null}
              {galat ? (
                <li className="wilayah-kepala-kosong" role="alert">
                  {galat}
                </li>
              ) : null}
              {!memuat && !galat && hasil.length === 0 ? (
                <li className="wilayah-kepala-kosong">Tidak ada penduduk hidup yang cocok.</li>
              ) : null}
              {hasil.map((penduduk, index) => (
                <li
                  aria-selected={index === aktif}
                  key={penduduk.id}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    pilih(penduduk);
                  }}
                  role="option"
                >
                  <strong>{penduduk.nama}</strong>
                  <small>{penduduk.nik || "NIK belum tercatat"}</small>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </div>
  );
}
