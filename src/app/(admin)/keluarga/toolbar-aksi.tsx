"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react";

import {
  hapusKeluargaKolektifAction,
  pindahWilayahKolektifAction,
  tambahRtmKolektifAction,
} from "@/app/(admin)/keluarga/actions";
import type { LabelOption } from "@/lib/forms";

type MenuKeluarga = "tambah" | "aksi" | "lainnya";

function idTerpilih(): string[] {
  return Array.from(
    document.querySelectorAll<HTMLInputElement>('input[name="familyIds"]:checked'),
  ).map((input) => input.value);
}

function tambahSensor(href: string, sensor: boolean): string {
  if (!sensor) return href;
  return `${href}${href.includes("?") ? "&" : "?"}sensor=1`;
}

export function PilihSemuaKeluarga() {
  const [semuaTerpilih, setSemuaTerpilih] = useState(false);
  const [sebagianTerpilih, setSebagianTerpilih] = useState(false);
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sinkron = () => {
      const semua = Array.from(
        document.querySelectorAll<HTMLInputElement>('input[name="familyIds"]'),
      );
      const terpilih = semua.filter((input) => input.checked).length;
      setSemuaTerpilih(semua.length > 0 && terpilih === semua.length);
      setSebagianTerpilih(terpilih > 0 && terpilih < semua.length);
    };
    sinkron();
    document.addEventListener("change", sinkron);
    return () => document.removeEventListener("change", sinkron);
  }, []);

  useEffect(() => {
    if (checkboxRef.current) checkboxRef.current.indeterminate = sebagianTerpilih;
  }, [sebagianTerpilih]);

  const pilihSemua = () => {
    const target = !semuaTerpilih;
    const inputs = document.querySelectorAll<HTMLInputElement>('input[name="familyIds"]');
    inputs.forEach((input) => (input.checked = target));
    setSemuaTerpilih(target);
    setSebagianTerpilih(false);
  };

  return (
    <input
      aria-label="Pilih semua Kartu Keluarga di halaman ini"
      checked={semuaTerpilih}
      onChange={pilihSemua}
      ref={checkboxRef}
      type="checkbox"
    />
  );
}

export function ToolbarAksiKeluarga({
  regions,
  exportHref,
  cetakDaftarHref,
  unduhDaftarHref,
  bolehUbah,
  bolehTambah,
  bolehHapus,
  bolehRtm,
  adaData,
}: {
  regions: LabelOption[];
  exportHref: string;
  cetakDaftarHref: string;
  unduhDaftarHref: string;
  bolehUbah: boolean;
  bolehTambah: boolean;
  bolehHapus: boolean;
  bolehRtm: boolean;
  adaData: boolean;
}) {
  const [jumlahTerpilih, setJumlahTerpilih] = useState(0);
  const [menuTerbuka, setMenuTerbuka] = useState<MenuKeluarga | null>(null);
  const [sensorIdentitas, setSensorIdentitas] = useState(false);
  const inputPindah = useRef<HTMLInputElement>(null);
  const inputRtm = useRef<HTMLInputElement>(null);
  const inputHapus = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sinkron = () => {
      const semua = Array.from(
        document.querySelectorAll<HTMLInputElement>('input[name="familyIds"]'),
      );
      setJumlahTerpilih(semua.filter((input) => input.checked).length);
    };
    sinkron();
    document.addEventListener("change", sinkron);
    return () => document.removeEventListener("change", sinkron);
  }, []);

  useEffect(() => {
    const tutupDiLuar = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".keluarga-toolbar-menu")) setMenuTerbuka(null);
    };
    const tutupDenganEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuTerbuka(null);
    };
    document.addEventListener("mousedown", tutupDiLuar);
    document.addEventListener("keydown", tutupDenganEscape);
    return () => {
      document.removeEventListener("mousedown", tutupDiLuar);
      document.removeEventListener("keydown", tutupDenganEscape);
    };
  }, []);

  const toggleMenu = (menu: MenuKeluarga) => {
    setMenuTerbuka((current) => (current === menu ? null : menu));
  };

  const bukaCetak = (mode: "cetak" | "unduh") => {
    const ids = idTerpilih();
    if (ids.length === 0) {
      window.alert("Pilih minimal satu Kartu Keluarga terlebih dahulu.");
      return;
    }
    const url = `/keluarga/${mode}?ids=${encodeURIComponent(ids.join(","))}`;
    if (mode === "cetak") {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    const tautan = document.createElement("a");
    tautan.href = url;
    tautan.rel = "noopener";
    tautan.click();
  };

  const isiIds = (event: FormEvent<HTMLFormElement>, input: RefObject<HTMLInputElement | null>) => {
    const ids = idTerpilih();
    if (ids.length === 0) {
      event.preventDefault();
      window.alert("Pilih minimal satu Kartu Keluarga terlebih dahulu.");
      return;
    }
    if (input.current) input.current.value = ids.join(",");
  };

  return (
    <section
      aria-label="Aksi Kartu Keluarga"
      className={adaData ? "keluarga-toolbar" : "keluarga-toolbar is-empty"}
    >
      <div className="keluarga-toolbar-info">
        <span>Aksi data</span>
        <strong aria-live="polite">
          {!adaData
            ? "Belum ada KK pada halaman ini"
            : jumlahTerpilih > 0
              ? `${jumlahTerpilih} Kartu Keluarga dipilih`
              : "Pilih KK untuk menjalankan aksi massal"}
        </strong>
      </div>

      <div className="keluarga-toolbar-controls">
        {bolehTambah ? (
          <div className="keluarga-toolbar-menu">
            <button
              aria-expanded={menuTerbuka === "tambah"}
              className="keluarga-toolbar-menu-toggle is-primary"
              onClick={() => toggleMenu("tambah")}
              type="button"
            >
              <span>+ Tambah KK</span>
            </button>

            {menuTerbuka === "tambah" ? (
              <div className="keluarga-toolbar-menu-panel" role="menu">
                <p className="keluarga-toolbar-menu-label">Tambah Kartu Keluarga</p>
                <Link
                  className="button button-primary keluarga-toolbar-menu-item"
                  href="/keluarga/baru/kepala-baru"
                  role="menuitem"
                >
                  Tambah Penduduk Masuk
                </Link>
                <Link
                  className="button button-secondary keluarga-toolbar-menu-item"
                  href="/keluarga/baru"
                  role="menuitem"
                >
                  Dari Penduduk yang Sudah Ada
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="keluarga-toolbar-menu">
          <button
            aria-expanded={menuTerbuka === "aksi"}
            className="keluarga-toolbar-menu-toggle"
            disabled={!adaData}
            onClick={() => toggleMenu("aksi")}
            type="button"
          >
            <span>Aksi Data Terpilih</span>
            {jumlahTerpilih > 0 ? (
              <span className="keluarga-toolbar-menu-count">{jumlahTerpilih}</span>
            ) : null}
          </button>

          {menuTerbuka === "aksi" ? (
            <div className="keluarga-toolbar-menu-panel" role="menu">
              <p className="keluarga-toolbar-menu-label">Untuk KK terpilih</p>
              {jumlahTerpilih === 0 ? (
                <p className="keluarga-toolbar-menu-empty">
                  Pilih minimal satu Kartu Keluarga terlebih dahulu.
                </p>
              ) : null}
              <button
                className="button button-secondary keluarga-toolbar-menu-item"
                disabled={jumlahTerpilih === 0}
                onClick={() => bukaCetak("cetak")}
                role="menuitem"
                type="button"
              >
                Cetak KK
              </button>
              <button
                className="button button-secondary keluarga-toolbar-menu-item"
                disabled={jumlahTerpilih === 0}
                onClick={() => bukaCetak("unduh")}
                role="menuitem"
                type="button"
              >
                Unduh KK
              </button>

              {bolehRtm ? (
                <form
                  action={tambahRtmKolektifAction}
                  onSubmit={(event) => isiIds(event, inputRtm)}
                >
                  <input name="ids" ref={inputRtm} type="hidden" />
                  <button
                    className="button button-secondary keluarga-toolbar-menu-item"
                    disabled={jumlahTerpilih === 0}
                    role="menuitem"
                  >
                    Tambah RTM kolektif
                  </button>
                </form>
              ) : null}

              {bolehUbah ? (
                <form
                  action={pindahWilayahKolektifAction}
                  className="keluarga-toolbar-menu-form"
                  onSubmit={(event) => isiIds(event, inputPindah)}
                >
                  <input name="ids" ref={inputPindah} type="hidden" />
                  <label className="keluarga-toolbar-menu-field">
                    <span>Pindah ke wilayah</span>
                    <select
                      aria-label="Wilayah tujuan pindah kolektif"
                      className="form-input"
                      name="regionId"
                      required
                    >
                      <option value="">Pilih wilayah tujuan...</option>
                      {regions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="button button-secondary keluarga-toolbar-menu-item"
                    disabled={jumlahTerpilih === 0}
                    role="menuitem"
                  >
                    Pindahkan KK terpilih
                  </button>
                </form>
              ) : null}

              {bolehHapus ? (
                <form
                  action={hapusKeluargaKolektifAction}
                  onSubmit={(event) => {
                    isiIds(event, inputHapus);
                    if (event.defaultPrevented) return;
                    const jumlah = idTerpilih().length;
                    if (
                      !window.confirm(
                        `Hapus ${jumlah} Kartu Keluarga terpilih? Hanya KK kosong yang akan dihapus; KK yang masih memiliki anggota dilewati.`,
                      )
                    ) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input name="ids" ref={inputHapus} type="hidden" />
                  <button
                    className="button button-danger keluarga-toolbar-menu-item"
                    disabled={jumlahTerpilih === 0}
                    role="menuitem"
                    type="submit"
                  >
                    Hapus KK terpilih
                  </button>
                </form>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="keluarga-toolbar-menu is-end">
          <button
            aria-expanded={menuTerbuka === "lainnya"}
            className="keluarga-toolbar-menu-toggle"
            onClick={() => toggleMenu("lainnya")}
            type="button"
          >
            <span>Aksi Data Lainnya</span>
          </button>

          {menuTerbuka === "lainnya" ? (
            <div className="keluarga-toolbar-menu-panel" role="menu">
              <p className="keluarga-toolbar-menu-label">Daftar sesuai filter aktif</p>
              <label className="keluarga-toolbar-menu-option">
                <input
                  checked={sensorIdentitas}
                  onChange={(event) => setSensorIdentitas(event.target.checked)}
                  type="checkbox"
                />
                <span>Sensor NIK/No. KK</span>
              </label>
              <Link
                className="button button-secondary keluarga-toolbar-menu-item"
                href={tambahSensor(cetakDaftarHref, sensorIdentitas)}
                rel="noopener noreferrer"
                role="menuitem"
                target="_blank"
              >
                Cetak Daftar KK
              </Link>
              <Link
                className="button button-secondary keluarga-toolbar-menu-item"
                href={tambahSensor(unduhDaftarHref, sensorIdentitas)}
                role="menuitem"
              >
                Unduh Daftar KK
              </Link>
              <div className="keluarga-toolbar-menu-divider" />
              <Link
                className="button button-secondary keluarga-toolbar-menu-item"
                href={exportHref}
                role="menuitem"
              >
                Ekspor CSV
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
