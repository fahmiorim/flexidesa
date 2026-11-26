"use client";

import { FormDialog } from "@/components/ui/form-dialog";
import { PemilihPenduduk } from "@/features/info-desa/pemerintahan/presentation/pemilih-penduduk";
import type { LabelOption } from "@/lib/forms";

import { simpanKelompokFormAction } from "./actions";

export interface KelompokEditAwal {
  id: number;
  nama: string;
  kode: string;
  nomorSk: string;
  kategoriId: number | null;
  keterangan: string;
}

/**
 * Dialog Tambah/Ubah Kelompok (pola Lembaga Desa).
 *
 * Satu dialog dipakai untuk kedua mode: halaman dibuka dengan `?edit=<id>`
 * untuk ubah (dialog terbuka otomatis), tombol pemicu selalu berlabel
 * "Tambah Kelompok" seperti pada halaman Lembaga Desa.
 */
export function DialogKelompok({
  awal,
  kategori,
  bolehTambah,
  tutupHref,
}: {
  awal: KelompokEditAwal | null;
  kategori: LabelOption[];
  bolehTambah: boolean;
  tutupHref?: string;
}) {
  if (!bolehTambah && !awal) return null;
  const ubah = awal !== null;

  return (
    <FormDialog
      aksi={simpanKelompokFormAction}
      bukaAwal={ubah}
      deskripsi={
        ubah
          ? "Perbarui data kelompok."
          : "Ketua langsung tercatat sebagai anggota berjabatan Ketua."
      }
      judul={ubah ? `Ubah ${awal.nama}` : "Tambah Kelompok"}
      key={awal?.id ?? "baru"}
      label="+ Tambah Kelompok"
      labelSimpan={ubah ? "Simpan Perubahan" : "Tambah Kelompok"}
      tutupHref={tutupHref}
    >
      {awal ? <input name="id" type="hidden" value={awal.id} /> : null}

      <fieldset>
        <legend>Identitas kelompok</legend>
        <label>
          Nama Kelompok
          <input
            defaultValue={awal?.nama ?? ""}
            maxLength={150}
            name="nama"
            placeholder="Karang Taruna"
            required
          />
        </label>
        <label>
          Kode Kelompok
          <input
            defaultValue={awal?.kode ?? ""}
            maxLength={50}
            name="kode"
            placeholder="Kode kelompok"
          />
        </label>
        <label>
          Kategori
          <select defaultValue={awal?.kategoriId ?? ""} name="kategoriId">
            <option value="">Tidak diisi</option>
            {kategori.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          No. SK Pendirian
          <input
            defaultValue={awal?.nomorSk ?? ""}
            maxLength={100}
            name="nomorSk"
            placeholder="Nomor SK pendirian"
          />
        </label>
      </fieldset>

      <fieldset>
        <legend>Ketua & keterangan</legend>
        {ubah ? (
          <p className="modul-hint">
            Ketua diubah lewat jabatan anggota pada halaman rincian kelompok.
          </p>
        ) : (
          <label>
            Ketua Kelompok
            <PemilihPenduduk defaultLabel="" defaultValue={null} name="ketuaId" />
          </label>
        )}
        <label>
          Deskripsi / Keterangan
          <textarea
            defaultValue={awal?.keterangan ?? ""}
            maxLength={500}
            name="keterangan"
            rows={3}
          />
        </label>
      </fieldset>
    </FormDialog>
  );
}
