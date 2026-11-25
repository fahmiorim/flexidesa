"use client";

import { useEffect, useId, useRef, useState } from "react";

interface Kepala {
  id: number;
  nama: string;
  nik: string;
  alamat: string;
}

interface Props {
  defaultValue: number | null;
  defaultLabel: string;
  name?: string;
}

function labelKepala(kepala: Kepala) {
  return kepala.nik ? `${kepala.nik} — ${kepala.nama}` : kepala.nama;
}

/**
 * Pencarian kepala wilayah ke `/api/wilayah/kepala`.
 *
 * Hanya id penduduk yang dikirim lewat input tersembunyi; nama dan NIK
 * ditampilkan agar operator dapat memastikan orang yang dipilih.
 */
export function PemilihKepala({ defaultValue, defaultLabel, name = "kepalaResidentId" }: Props) {
  const daftarId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [terpilih, setTerpilih] = useState<{ id: number; label: string } | null>(
    defaultValue ? { id: defaultValue, label: defaultLabel || `Penduduk #${defaultValue}` } : null,
  );
  const [q, setQ] = useState("");
  const [hasil, setHasil] = useState<Kepala[]>([]);
  const [buka, setBuka] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [aktif, setAktif] = useState(0);

  useEffect(() => {
    const term = q.trim();
    if (!buka || term.length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setMemuat(true);
      setGalat(null);
      try {
        const response = await fetch(`/api/wilayah/kepala?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Pencarian gagal.");
        const data = (await response.json()) as { hasil?: Kepala[] };
        setHasil(data.hasil ?? []);
        setAktif(0);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setGalat("Pencarian kepala gagal.");
      } finally {
        setMemuat(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [q, buka]);

  function pilih(kepala: Kepala) {
    setTerpilih({ id: kepala.id, label: labelKepala(kepala) });
    setBuka(false);
    setQ("");
    setHasil([]);
  }

  function kosongkan() {
    setTerpilih(null);
    setQ("");
    setHasil([]);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <div className="wilayah-pemilih-kepala">
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
            aria-label="Cari kepala wilayah berdasarkan NIK atau nama"
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
              {hasil.map((kepala, index) => (
                <li
                  aria-selected={index === aktif}
                  key={kepala.id}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    pilih(kepala);
                  }}
                  role="option"
                >
                  <strong>{kepala.nama}</strong>
                  <small>
                    {kepala.nik || "NIK belum tercatat"}
                    {kepala.alamat ? ` · ${kepala.alamat}` : ""}
                  </small>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </div>
  );
}
