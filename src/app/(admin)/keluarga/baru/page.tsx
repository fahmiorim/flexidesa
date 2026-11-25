import type { Metadata } from "next";
import Link from "next/link";

import { buatKeluargaAction } from "@/app/(admin)/keluarga/actions";
import { PageHeading } from "@/components/shell/page-heading";
import { getKeluargaFormReference } from "@/features/keluarga/application/use-cases";
import { KELUARGA_WELFARE_CLASSES } from "@/features/keluarga/domain/keluarga";

export const metadata: Metadata = { title: "Tambah Kartu Keluarga" };

export default async function KeluargaBaruPage() {
  const reference = await getKeluargaFormReference();
  return (
    <div className="modul-page penduduk-page data-kependudukan-page keluarga-page">
      <Link className="penduduk-back" href="/keluarga">
        ← Kembali ke daftar Kartu Keluarga
      </Link>
      <PageHeading>
        <header className="page-heading">
          <div>
            <h1>Tambah KK dari Penduduk</h1>
            <p>Pilih penduduk tanpa KK untuk membuat keluarga baru.</p>
          </div>
        </header>
      </PageHeading>
      <Link className="keluarga-choice-banner" href="/keluarga/baru/kepala-baru">
        <span className="keluarga-choice-icon" aria-hidden="true">
          +
        </span>
        <span>
          <strong>Penduduknya belum terdaftar?</strong>
          <small>Buat KK sekaligus daftarkan penduduk baru sebagai kepala keluarga.</small>
        </span>
        <span className="keluarga-choice-arrow" aria-hidden="true">
          →
        </span>
      </Link>
      <section className="platform-card data-panel">
        <form action={buatKeluargaAction} className="form-stack">
          <header className="data-section-heading">
            <div>
              <h2>Data Kartu Keluarga</h2>
              <p>Nomor KK dan data administrasi keluarga.</p>
            </div>
          </header>
          <div className="modul-form-grid">
            <label className="form-field">
              <span className="form-label">Nomor Kartu Keluarga</span>
              <input
                className="form-input"
                inputMode="numeric"
                maxLength={16}
                name="number"
                pattern="[0-9]{16}"
                placeholder="16 angka"
              />
              <span className="form-help">
                Wajib 16 angka untuk KK permanen; kosongkan bila memakai nomor sementara.
              </span>
            </label>
            <label className="form-field">
              <span className="form-label">Nomor KK sementara</span>
              <span className="form-check">
                <input name="temporary" type="checkbox" />
                <span>Buat nomor sementara otomatis</span>
              </span>
              <span className="form-help">
                Nomor memakai awalan 0 + kode desa + urutan, seperti OpenSID.
              </span>
            </label>
            <label className="form-field">
              <span className="form-label">Tanggal Cetak KK</span>
              <input className="form-input" name="cardPrintedAt" type="date" />
              <span className="form-help">Boleh dikosongkan bila KK belum pernah dicetak.</span>
            </label>
            <label className="form-field">
              <span className="form-label">Kelas Sosial</span>
              <select className="form-input" defaultValue="" name="welfareClass">
                <option value="">Belum ditetapkan</option>
                {KELUARGA_WELFARE_CLASSES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <header className="data-section-heading">
            <div>
              <h2>Kepala Keluarga</h2>
              <p>
                Pilih penduduk yang sudah terdaftar tetapi belum masuk KK. Penduduk tersebut akan
                langsung menjadi kepala keluarga.
              </p>
            </div>
          </header>
          <label className="form-field">
            <span className="form-label">Penduduk Lepas</span>
            <select className="form-input" defaultValue="" name="headResidentId">
              <option value="">Belum dipilih — buat KK kosong</option>
              {reference.headCandidates.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            {reference.headCandidates.length === 0 ? (
              <span className="form-help">
                Belum ada penduduk hidup tanpa KK. Tambahkan penduduk terlebih dahulu, atau simpan
                KK kosong dan tambahkan anggotanya nanti.
              </span>
            ) : (
              <span className="form-help">
                Alamat dan wilayah KK akan mengikuti data penduduk bila kolom di bawah dikosongkan.
              </span>
            )}
          </label>

          <header className="data-section-heading">
            <div>
              <h2>Alamat &amp; Wilayah</h2>
              <p>Domisili yang tercantum pada Kartu Keluarga.</p>
            </div>
          </header>
          <label className="form-field">
            <span className="form-label">Alamat</span>
            <textarea className="form-input" maxLength={255} name="address" rows={3} />
          </label>
          <label className="form-field">
            <span className="form-label">Dusun / RT / RW</span>
            <select className="form-input" defaultValue="" name="regionId">
              <option value="">Belum ditentukan</option>
              {reference.regions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <div className="penduduk-heading-actions">
            <Link className="button button-secondary" href="/keluarga">
              Batal
            </Link>
            <button className="button button-primary" type="submit">
              Simpan KK
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
