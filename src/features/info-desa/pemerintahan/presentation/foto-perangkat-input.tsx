"use client";

import Image from "next/image";
import { useRef, useState } from "react";

const SISI = 400;

/**
 * Input foto aparat dengan pemotongan persegi di browser.
 *
 * OpenSID memakai cropper sehingga foto pamong tersimpan persegi. Di sini
 * gambar dipotong tengah menjadi 400 × 400 sebelum dikirim, sehingga server
 * tetap menerima satu berkas gambar biasa tanpa dependensi pemrosesan gambar.
 */
export function FotoPerangkatInput({
  nama = "fotoFile",
  label = "Foto Perangkat",
  fotoLama,
}: {
  nama?: string;
  label?: string;
  fotoLama?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pratinjau, setPratinjau] = useState(fotoLama ?? "");
  const [galat, setGalat] = useState("");

  async function pilihBerkas(event: React.ChangeEvent<HTMLInputElement>) {
    const berkas = event.target.files?.[0];
    if (!berkas) return;
    setGalat("");
    try {
      const bitmap = await createImageBitmap(berkas);
      const sisi = Math.min(bitmap.width, bitmap.height);
      const kanvas = document.createElement("canvas");
      kanvas.width = SISI;
      kanvas.height = SISI;
      const konteks = kanvas.getContext("2d");
      if (!konteks) throw new Error("Kanvas tidak tersedia.");
      konteks.drawImage(
        bitmap,
        (bitmap.width - sisi) / 2,
        (bitmap.height - sisi) / 2,
        sisi,
        sisi,
        0,
        0,
        SISI,
        SISI,
      );
      const blob = await new Promise<Blob | null>((selesai) =>
        kanvas.toBlob(selesai, "image/jpeg", 0.9),
      );
      if (!blob) throw new Error("Gagal memproses gambar.");
      const hasil = new File([blob], `${berkas.name.replace(/\.[^.]+$/, "") || "foto"}.jpg`, {
        type: "image/jpeg",
      });
      const transfer = new DataTransfer();
      transfer.items.add(hasil);
      if (inputRef.current) inputRef.current.files = transfer.files;
      setPratinjau(URL.createObjectURL(hasil));
    } catch {
      setGalat("Foto tidak dapat diproses. Gunakan JPG, PNG, atau WEBP.");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <label className="pemerintahan-foto-field">
      {label}
      {pratinjau ? (
        <Image
          className="pemerintahan-foto-preview"
          src={pratinjau}
          alt="Pratinjau foto aparat"
          width={96}
          height={96}
          unoptimized
        />
      ) : null}
      <input
        ref={inputRef}
        type="file"
        name={nama}
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => void pilihBerkas(event)}
      />
      <small>Foto dipotong tengah menjadi persegi 400 × 400, maks. 5 MB.</small>
      {galat ? <small role="alert">{galat}</small> : null}
    </label>
  );
}
