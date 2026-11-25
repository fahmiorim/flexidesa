"use client";

import { useMemo, useState } from "react";

import type { BarisStatistik } from "@/features/statistik/domain/statistik-kependudukan";

import styles from "./statistik-kependudukan.module.css";

const PALETTE = [
  "#6d28d9",
  "#2563eb",
  "#0d9488",
  "#ea580c",
  "#db2777",
  "#7c3aed",
  "#0891b2",
  "#16a34a",
  "#d97706",
  "#be123c",
];

const angka = new Intl.NumberFormat("id-ID");

export function GrafikKependudukan({
  baris,
  total,
  satuan,
}: {
  baris: readonly BarisStatistik[];
  total: number;
  satuan: string;
}) {
  const [mode, setMode] = useState<"batang" | "lingkaran">("batang");
  const data = useMemo(() => baris.filter((row) => row.jumlah > 0), [baris]);
  const max = Math.max(1, ...data.map((row) => row.jumlah));

  const irisan = useMemo(() => {
    if (data.length <= PALETTE.length) return data;
    const teratas = data.slice(0, PALETTE.length - 1);
    const lain = data.slice(PALETTE.length - 1).reduce((jumlah, row) => jumlah + row.jumlah, 0);
    return [...teratas, { label: "Lainnya", lakiLaki: 0, perempuan: 0, jumlah: lain }];
  }, [data]);

  const gradient = useMemo(() => {
    if (!irisan.length) return "#e8e7f4";
    let mulai = 0;
    const bagian = irisan.map((row, index) => {
      const akhir = mulai + (row.jumlah / Math.max(1, total)) * 100;
      const warna = PALETTE[index % PALETTE.length];
      const potongan = `${warna} ${mulai}% ${akhir}%`;
      mulai = akhir;
      return potongan;
    });
    if (mulai < 100) bagian.push(`#e8e7f4 ${mulai}% 100%`);
    return `conic-gradient(${bagian.join(", ")})`;
  }, [irisan, total]);

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <div>
          <h3>Grafik Data</h3>
          <p>
            {angka.format(total)} {satuan} dalam {baris.length} kelompok.
          </p>
        </div>
        <div className={styles.chartToggle} role="group" aria-label="Jenis grafik">
          <button
            type="button"
            aria-pressed={mode === "batang"}
            className={mode === "batang" ? styles.chartActive : ""}
            onClick={() => setMode("batang")}
          >
            Batang
          </button>
          <button
            type="button"
            aria-pressed={mode === "lingkaran"}
            className={mode === "lingkaran" ? styles.chartActive : ""}
            onClick={() => setMode("lingkaran")}
          >
            Lingkaran
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <p className={styles.chartEmpty}>Belum ada data untuk digambarkan.</p>
      ) : mode === "batang" ? (
        <div className={styles.bars} role="list">
          {data.map((row) => (
            <div className={styles.barRow} key={row.label} role="listitem">
              <span title={row.label}>{row.label}</span>
              <div className={styles.barTrack}>
                <i className={styles.barFill} style={{ width: `${(row.jumlah / max) * 100}%` }} />
              </div>
              <strong>{angka.format(row.jumlah)}</strong>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.pieWrap}>
          <div
            className={styles.donut}
            style={{ background: gradient }}
            role="img"
            aria-label={`Diagram lingkaran ${baris.length} kelompok`}
          >
            <div>
              <strong>{angka.format(total)}</strong>
              <span>{satuan}</span>
            </div>
          </div>
          <ul className={styles.legend}>
            {irisan.map((row, index) => (
              <li key={row.label}>
                <i style={{ background: PALETTE[index % PALETTE.length] }} />
                <span title={row.label}>{row.label}</span>
                <strong>{angka.format(row.jumlah)}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
