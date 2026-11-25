"use client";

/**
 * Kop laporan kelompok rentan.
 *
 * Meniru formulir OpenSID: identitas desa/kecamatan/bulan ditampilkan sebagai
 * isian mati, dan dusun dipilih lewat dropdown yang langsung memuat ulang
 * laporan. Tanpa JavaScript, dropdown tetap bisa dikirim dengan Enter.
 */
export function KopLaporanRentan({
  kabupaten,
  desa,
  kecamatan,
  bulan,
  options,
  dusun,
}: {
  kabupaten: string | null;
  desa: string | null;
  kecamatan: string | null;
  bulan: string;
  options: string[];
  dusun: string | null;
}) {
  return (
    <form className="kelompok-rentan-kop" method="get">
      <strong>PEMERINTAH KABUPATEN/KOTA {kabupaten?.toUpperCase() ?? "—"}</strong>
      <h2>DATA PILAH KEPENDUDUKAN MENURUT UMUR DAN FAKTOR KERENTANAN (LAMPIRAN A - 9)</h2>
      <div className="kelompok-rentan-kop-grid">
        <label>
          <span>Desa/Kel</span>
          <input disabled value={desa ?? "—"} />
        </label>
        <label>
          <span>Kecamatan</span>
          <input disabled value={kecamatan ?? "—"} />
        </label>
        <label>
          <span>Lap. Bulan</span>
          <input disabled value={bulan} />
        </label>
        <label>
          <span>Dusun</span>
          <select
            defaultValue={dusun ?? ""}
            name="dusun"
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
          >
            <option value="">Pilih Dusun</option>
            {options.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>
    </form>
  );
}
