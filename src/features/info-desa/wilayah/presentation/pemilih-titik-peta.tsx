"use client";

import "leaflet/dist/leaflet.css";

import type { Map as LeafletMap, Marker, TileLayer } from "leaflet";
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import {
  formatKoordinat,
  parseKoordinat,
  TILE_PETA,
  type KoordinatWilayah,
} from "@/features/info-desa/wilayah/domain/peta-wilayah";
import {
  LABEL_TIPE_PETA,
  TIPE_PETA,
  ZOOM_PETA_DEFAULT,
  type TipePeta,
} from "@/features/info-desa/wilayah/domain/wilayah";
import { ikonPenanda } from "@/features/info-desa/wilayah/presentation/ikon-penanda";

const PUSAT_INDONESIA = { lat: -2.5, lng: 118 };
const PANJANG_MINIMAL = 3;
const JEDA_KETIK = 800;

type HasilAlamat = { label: string; lat: number; lng: number };

export type PerubahanTitik = { koordinat: string | null; zoom: number };

/** Cari alamat lewat layanan publik OpenStreetMap; tanpa API key. */
async function cariAlamat(kueri: string, signal: AbortSignal): Promise<HasilAlamat[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "id");
  url.searchParams.set("q", kueri);

  const respons = await fetch(url, { headers: { Accept: "application/json" }, signal });
  if (!respons.ok) throw new Error("Pencarian alamat gagal.");

  const data = (await respons.json()) as { display_name: string; lat: string; lon: string }[];
  return data.map((item) => ({
    label: item.display_name,
    lat: Number(item.lat),
    lng: Number(item.lon),
  }));
}

/**
 * Peta pemilih satu titik beserta pencarian alamat, tipe peta, dan geolokasi.
 * Dipakai dialog lokasi kantor desa maupun peta kantor wilayah.
 */
export function PemilihTitikPeta({
  aktif,
  koordinatAwal,
  zoomAwal,
  tipePeta,
  onTipePetaChange,
  onTitikChange,
}: {
  /** Peta baru dibangun saat dialog pemanggil terbuka. */
  aktif: boolean;
  koordinatAwal: string;
  zoomAwal?: number | null;
  tipePeta: TipePeta;
  onTipePetaChange: (tipe: TipePeta) => void;
  onTitikChange: (perubahan: PerubahanTitik) => void;
}) {
  const id = useId();
  const wadahRef = useRef<HTMLDivElement>(null);
  const petaRef = useRef<LeafletMap | null>(null);
  const penandaRef = useRef<Marker | null>(null);
  const letakkanRef = useRef<((lat: number, lng: number) => void) | null>(null);
  const pasangTileRef = useRef<((tipe: TipePeta) => void) | null>(null);
  const batalRef = useRef<AbortController | null>(null);
  const titikRef = useRef<KoordinatWilayah | null>(parseKoordinat(koordinatAwal));
  const laporRef = useRef(onTitikChange);
  const [titik, setTitik] = useState<KoordinatWilayah | null>(() => parseKoordinat(koordinatAwal));
  const [kataKunci, setKataKunci] = useState("");
  const [hasil, setHasil] = useState<HasilAlamat[]>([]);
  const [pesanCari, setPesanCari] = useState<string | null>(null);
  const [mencari, setMencari] = useState(false);
  const [sorot, setSorot] = useState(-1);

  useEffect(() => {
    laporRef.current = onTitikChange;
  }, [onTitikChange]);

  useEffect(() => {
    if (!aktif || !wadahRef.current) return;
    let dibuang = false;

    import("leaflet").then((L) => {
      if (dibuang || !wadahRef.current) return;
      const tersimpan = parseKoordinat(koordinatAwal);
      const awal = tersimpan ?? PUSAT_INDONESIA;
      const peta = L.map(wadahRef.current, {
        center: [awal.lat, awal.lng],
        zoom: tersimpan ? (zoomAwal ?? ZOOM_PETA_DEFAULT) : 5,
      });

      let lapisanTile: TileLayer | null = null;
      pasangTileRef.current = (nilai) => {
        if (lapisanTile) peta.removeLayer(lapisanTile);
        const tile = TILE_PETA[nilai];
        lapisanTile = L.tileLayer(tile.url, {
          attribution: tile.atribusi,
          maxZoom: tile.maxZoom,
        }).addTo(peta);
      };
      pasangTileRef.current(tipePeta);

      const letakkan = (lat: number, lng: number) => {
        if (penandaRef.current) {
          penandaRef.current.setLatLng([lat, lng]);
          return;
        }
        const penanda = L.marker([lat, lng], { draggable: true, icon: ikonPenanda(L) }).addTo(peta);
        penanda.on("dragend", () => {
          const posisi = penanda.getLatLng();
          const baru = { lat: posisi.lat, lng: posisi.lng };
          titikRef.current = baru;
          setTitik(baru);
          laporRef.current({
            koordinat: formatKoordinat(baru.lat, baru.lng),
            zoom: peta.getZoom(),
          });
        });
        penandaRef.current = penanda;
      };
      letakkanRef.current = letakkan;

      if (tersimpan) letakkan(tersimpan.lat, tersimpan.lng);

      peta.on("click", (event) => {
        const baru = { lat: event.latlng.lat, lng: event.latlng.lng };
        titikRef.current = baru;
        setTitik(baru);
        letakkan(baru.lat, baru.lng);
        laporRef.current({ koordinat: formatKoordinat(baru.lat, baru.lng), zoom: peta.getZoom() });
      });

      peta.on("zoomend", () => {
        const sekarang = titikRef.current;
        laporRef.current({
          koordinat: sekarang ? formatKoordinat(sekarang.lat, sekarang.lng) : null,
          zoom: peta.getZoom(),
        });
      });

      petaRef.current = peta;
      window.setTimeout(() => {
        if (petaRef.current === peta) peta.invalidateSize();
      }, 50);
    });

    return () => {
      dibuang = true;
      petaRef.current?.remove();
      petaRef.current = null;
      penandaRef.current = null;
      letakkanRef.current = null;
      pasangTileRef.current = null;
    };
    // Peta dibangun ulang hanya saat dialog dibuka.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktif]);

  /** Tukar lapisan dasar tanpa membangun ulang peta, agar penanda tetap di tempat. */
  function gantiTipePeta(nilai: TipePeta) {
    onTipePetaChange(nilai);
    pasangTileRef.current?.(nilai);
  }

  function pakaiLokasiSaya() {
    if (!navigator.geolocation) {
      setPesanCari("Peramban tidak mendukung geolokasi.");
      return;
    }
    setPesanCari("Mengambil lokasi…");
    navigator.geolocation.getCurrentPosition(
      (posisi) => {
        const { latitude, longitude } = posisi.coords;
        const baru = { lat: latitude, lng: longitude };
        setPesanCari(null);
        titikRef.current = baru;
        setTitik(baru);
        petaRef.current?.setView([latitude, longitude], Math.max(petaRef.current.getZoom(), 16));
        letakkanRef.current?.(latitude, longitude);
        laporRef.current({
          koordinat: formatKoordinat(latitude, longitude),
          zoom: petaRef.current?.getZoom() ?? ZOOM_PETA_DEFAULT,
        });
      },
      () => setPesanCari("Lokasi tidak dapat diambil. Periksa izin lokasi peramban."),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  function reset() {
    batalRef.current?.abort();
    setTitik(null);
    setHasil([]);
    setSorot(-1);
    setPesanCari(null);
    setMencari(false);
    titikRef.current = null;
    penandaRef.current?.remove();
    penandaRef.current = null;
    petaRef.current?.setView([PUSAT_INDONESIA.lat, PUSAT_INDONESIA.lng], 5);
    laporRef.current({ koordinat: null, zoom: 5 });
  }

  async function jalankanPencarian(kueri: string) {
    batalRef.current?.abort();
    const kendali = new AbortController();
    batalRef.current = kendali;
    setMencari(true);
    setPesanCari(null);

    try {
      const daftar = await cariAlamat(kueri, kendali.signal);
      if (kendali.signal.aborted) return;
      setHasil(daftar);
      setSorot(-1);
      if (!daftar.length) setPesanCari("Alamat tidak ditemukan. Coba kata kunci lain.");
    } catch {
      if (kendali.signal.aborted) return;
      setHasil([]);
      setPesanCari("Pencarian alamat gagal. Periksa koneksi lalu coba lagi.");
    } finally {
      if (!kendali.signal.aborted) setMencari(false);
    }
  }

  useEffect(() => {
    if (!aktif) return;
    const kueri = kataKunci.trim();
    if (kueri.length < PANJANG_MINIMAL) return; // Pembersihan saran dilakukan saat mengetik.

    const jeda = window.setTimeout(() => void jalankanPencarian(kueri), JEDA_KETIK);
    return () => window.clearTimeout(jeda);
  }, [kataKunci, aktif]);

  useEffect(() => () => batalRef.current?.abort(), []);

  function ubahKataKunci(nilaiBaru: string) {
    setKataKunci(nilaiBaru);
    if (nilaiBaru.trim().length >= PANJANG_MINIMAL) return;
    batalRef.current?.abort();
    setHasil([]);
    setSorot(-1);
    setPesanCari(null);
    setMencari(false);
  }

  function sorotOpsi(index: number) {
    setSorot(index);
    requestAnimationFrame(() => {
      document.getElementById(`${id}-opsi-${index}`)?.scrollIntoView({ block: "nearest" });
    });
  }

  function pilihAlamat(item: HasilAlamat) {
    const baru = { lat: item.lat, lng: item.lng };
    setTitik(baru);
    titikRef.current = baru;
    letakkanRef.current?.(item.lat, item.lng);
    petaRef.current?.setView([item.lat, item.lng], 16);
    setHasil([]);
    setSorot(-1);
    setPesanCari(null);
    laporRef.current({ koordinat: formatKoordinat(item.lat, item.lng), zoom: 16 });
  }

  function tekanTombol(event: KeyboardEvent<HTMLInputElement>) {
    if (!hasil.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      sorotOpsi(sorot >= hasil.length - 1 ? 0 : sorot + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      sorotOpsi(sorot <= 0 ? hasil.length - 1 : sorot - 1);
    } else if (event.key === "Enter" && sorot >= 0) {
      event.preventDefault();
      const item = hasil[sorot];
      if (item) pilihAlamat(item);
    } else if (event.key === "Escape") {
      setHasil([]);
      setSorot(-1);
    }
  }

  function kirimPencarian(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const kueri = kataKunci.trim();
    if (kueri.length < PANJANG_MINIMAL) {
      setPesanCari(`Ketik minimal ${PANJANG_MINIMAL} huruf untuk mencari alamat.`);
      return;
    }
    void jalankanPencarian(kueri);
  }

  return (
    <div className="wilayah-peta-pemilih">
      <form className="wilayah-peta-cari" onSubmit={kirimPencarian}>
        <input
          aria-activedescendant={sorot >= 0 ? `${id}-opsi-${sorot}` : undefined}
          aria-autocomplete="list"
          aria-controls={`${id}-saran`}
          aria-expanded={hasil.length > 0}
          aria-label="Cari alamat"
          onChange={(event) => ubahKataKunci(event.target.value)}
          onKeyDown={tekanTombol}
          placeholder="Ketik alamat, contoh: Kantor Kecamatan Wates, Kulon Progo"
          role="combobox"
          type="search"
          value={kataKunci}
        />
        <button className="button button-primary" disabled={mencari} type="submit">
          {mencari ? "Mencari…" : "Cari"}
        </button>
      </form>

      <p aria-live="polite" className="wilayah-peta-status">
        {pesanCari ?? (mencari ? "Mencari alamat…" : null)}
      </p>

      {hasil.length ? (
        <ul className="wilayah-peta-hasil" id={`${id}-saran`} role="listbox">
          {hasil.map((item, index) => (
            <li key={`${item.lat}-${item.lng}-${item.label}`} role="presentation">
              <button
                aria-selected={sorot === index}
                id={`${id}-opsi-${index}`}
                onClick={() => pilihAlamat(item)}
                onMouseEnter={() => setSorot(index)}
                role="option"
                type="button"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="wilayah-peta-toolbar">
        <label>
          Tipe peta
          <select
            className="form-input"
            onChange={(event) => gantiTipePeta(event.target.value as TipePeta)}
            value={tipePeta}
          >
            {TIPE_PETA.map((nilai) => (
              <option key={nilai} value={nilai}>
                {LABEL_TIPE_PETA[nilai]}
              </option>
            ))}
          </select>
        </label>
        <button className="button button-ghost" onClick={pakaiLokasiSaya} type="button">
          Lokasi saya
        </button>
        <button className="button button-ghost" disabled={!titik} onClick={reset} type="button">
          Reset
        </button>
        <small className="wilayah-peta-kredit">Pencarian alamat oleh OpenStreetMap Nominatim</small>
      </div>

      <div className="wilayah-peta-kanvas" ref={wadahRef} />

      <p className="modul-hint wilayah-peta-titik">
        {titik
          ? `Titik: ${formatKoordinat(titik.lat, titik.lng)}`
          : "Belum ada titik yang dipilih."}
      </p>
    </div>
  );
}
