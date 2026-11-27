"use client";

import Image from "next/image";
import { useRef, useState } from "react";

const SISI_MAKS = 400;

/**
 * Input foto aparat dengan pengecilan di browser.
 *
 * Foto diperkecil hingga sisi terpanjang 400 px dengan rasio aspek tetap, jadi
 * tidak ada bagian gambar yang terpotong (foto pamong sering berformat potret).
 * Server tetap menerima satu berkas gambar biasa tanpa dependensi pemrosesan
 * gambar.
 *
 * Hasilnya disimpan sebagai PNG bila gambar sumber punya area transparan. JPEG
 * tidak mendukung kanal alfa, sehingga mengompres foto transparan ke JPEG akan
 * mengubah latar transparan menjadi hitam pekat.
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
      // Rasio aspek dipertahankan: mengecilkan sisi terpanjang ke 400 px tidak
      // memotong bagian foto, berbeda dengan pemotongan tengah persegi.
      const skala = Math.min(1, SISI_MAKS / Math.max(bitmap.width, bitmap.height));
      const lebar = Math.max(1, Math.round(bitmap.width * skala));
      const tinggi = Math.max(1, Math.round(bitmap.height * skala));
      const kanvas = document.createElement("canvas");
      kanvas.width = lebar;
      kanvas.height = tinggi;
      const konteks = kanvas.getContext("2d");
      if (!konteks) throw new Error("Kanvas tidak tersedia.");
      konteks.drawImage(bitmap, 0, 0, lebar, tinggi);
      // Pertahankan transparansi: JPEG membuang kanal alfa dan menggantinya
      // dengan hitam, sehingga foto berlatarbelakang transparan tampil hitam.
      const piksel = konteks.getImageData(0, 0, lebar, tinggi).data;
      let transparan = false;
      for (let i = 3; i < piksel.length; i += 4) {
        if (piksel[i]! < 255) {
          transparan = true;
          break;
        }
      }
      const mime = transparan ? "image/png" : "image/jpeg";
      const ekstensi = transparan ? "png" : "jpg";
      const blob = await new Promise<Blob | null>((selesai) =>
        transparan ? kanvas.toBlob(selesai, mime) : kanvas.toBlob(selesai, mime, 0.9),
      );
      if (!blob) throw new Error("Gagal memproses gambar.");
      const hasil = new File(
        [blob],
        `${berkas.name.replace(/\.[^.]+$/, "") || "foto"}.${ekstensi}`,
        {
          type: mime,
        },
      );
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
      <small>Foto diperkecil hingga sisi terpanjang 400 px tanpa dipotong, maks. 5 MB.</small>
      {galat ? <small role="alert">{galat}</small> : null}
    </label>
  );
}
