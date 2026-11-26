import type { Metadata } from "next";
import Link from "next/link";

import {
  catatDatangAction,
  catatKelahiranAction,
  catatKematianAction,
  catatPerubahanAction,
  catatPindahKeluarAction,
} from "@/app/(admin)/(kependudukan)/kependudukan/mutasi-penduduk/actions";
import { PageHeading } from "@/components/shell/page-heading";
import {
  getPendudukFormData,
  listPendudukOptionsData,
} from "@/features/kependudukan/penduduk/application/use-cases";
import {
  PENOLONG_KEMATIAN,
  PENOLONG_KEMATIAN_LABELS,
  SEBAB_KEMATIAN,
  SEBAB_KEMATIAN_LABELS,
  TUJUAN_PINDAH,
  TUJUAN_PINDAH_LABELS,
} from "@/features/kependudukan/penduduk/domain/riwayat-penduduk";

export const metadata: Metadata = { title: "Catat Mutasi Penduduk" };
const inputClass = "form-input";
type LabelOption = { id: number; label: string };
type NameOption = { id: number; name: string };

function Field({
  label,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="form-field">
      <span className="form-label">{label}</span>
      <input className={inputClass} name={name} type={type} required={required} />
    </label>
  );
}
function ResidentSelect({ residents }: { residents: Array<{ id: number; name: string }> }) {
  return (
    <label className="form-field">
      <span className="form-label">Penduduk</span>
      <select className={inputClass} name="residentId" required defaultValue="">
        <option value="" disabled>
          Pilih penduduk
        </option>
        {residents.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name} · ID {r.id}
          </option>
        ))}
      </select>
    </label>
  );
}
function FamilyFields({
  families,
  relations,
  regions,
}: {
  families: LabelOption[];
  relations: NameOption[];
  regions: LabelOption[];
}) {
  return (
    <>
      <label className="form-field">
        <span className="form-label">Kartu Keluarga</span>
        <select className={inputClass} name="familyId" defaultValue="">
          <option value="">Tidak ditautkan</option>
          {families.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span className="form-label">Hubungan keluarga</span>
        <select className={inputClass} name="familyRelationId" defaultValue="">
          <option value="">Belum ditentukan</option>
          {relations.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span className="form-label">Dusun / RT / RW</span>
        <select className={inputClass} name="regionId" defaultValue="">
          <option value="">Belum ditentukan</option>
          {regions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
export default async function MutasiBaruPage() {
  const [residents, formData] = await Promise.all([
    listPendudukOptionsData(),
    getPendudukFormData(),
  ]);
  const reference = formData.references;
  const familyFields = {
    families: reference.families,
    relations: reference.familyRelations,
    regions: reference.regions,
  };
  return (
    <div className="modul-page data-kependudukan-page">
      <PageHeading
        judul={<>Catat Mutasi Penduduk</>}
        deskripsi={<>Catat peristiwa mutasi penduduk.</>}
        aksi={
          <>
            <Link className="button button-secondary" href="/kependudukan/mutasi-penduduk">
              Kembali
            </Link>
          </>
        }
      />
      <div className="data-kependudukan-grid">
        <section className="platform-card data-panel">
          <header>
            <h2>Penduduk Masuk</h2>
            <p>Catat penduduk yang pindah masuk ke desa.</p>
          </header>
          <form action={catatDatangAction} className="form-stack">
            <Field label="Tanggal masuk" name="eventDate" type="date" required />
            <Field label="Nama lengkap" name="name" required />
            <Field label="NIK" name="nationalId" />
            <label className="form-field">
              <span className="form-label">Jenis kelamin</span>
              <select className={inputClass} name="gender" required defaultValue="">
                <option value="" disabled>
                  Pilih jenis kelamin
                </option>
                <option value="male">Laki-laki</option>
                <option value="female">Perempuan</option>
              </select>
            </label>
            <Field label="Tempat lahir" name="birthPlace" />
            <Field label="Tanggal lahir" name="birthDate" type="date" />
            <Field label="Alamat asal" name="fromAddress" />
            <Field label="Alamat di desa" name="address" />
            <FamilyFields {...familyFields} />
            <Field label="Alasan / keterangan" name="reason" />
            <Field label="Nomor surat" name="referenceNo" />
            <button className="button button-primary" type="submit">
              Simpan Penduduk Masuk
            </button>
          </form>
        </section>
        <section className="platform-card data-panel">
          <header>
            <h2>Kelahiran</h2>
            <p>Daftarkan kelahiran sebagai penduduk desa.</p>
          </header>
          <form action={catatKelahiranAction} className="form-stack">
            <Field label="Tanggal lahir" name="eventDate" type="date" required />
            <Field label="Nama bayi" name="name" required />
            <Field label="NIK (jika tersedia)" name="nationalId" />
            <label className="form-field">
              <span className="form-label">Jenis kelamin</span>
              <select className={inputClass} name="gender" required defaultValue="">
                <option value="" disabled>
                  Pilih jenis kelamin
                </option>
                <option value="male">Laki-laki</option>
                <option value="female">Perempuan</option>
              </select>
            </label>
            <Field label="Nama ayah" name="fatherName" />
            <Field label="Nama ibu" name="motherName" />
            <Field label="Alamat" name="address" />
            <FamilyFields {...familyFields} />
            <Field label="Keterangan" name="reason" />
            <Field label="Nomor surat" name="referenceNo" />
            <button className="button button-primary" type="submit">
              Simpan Kelahiran
            </button>
          </form>
        </section>
        <section className="platform-card data-panel">
          <header>
            <h2>Penduduk Keluar</h2>
            <p>Catat penduduk yang pindah keluar dari desa.</p>
          </header>
          <form action={catatPindahKeluarAction} className="form-stack">
            <ResidentSelect residents={residents} />
            <Field label="Tanggal pindah" name="eventDate" type="date" required />
            <Field label="Tanggal lapor" name="reportDate" type="date" />
            <label className="form-field">
              <span className="form-label">Tujuan Pindah</span>
              <select className={inputClass} name="refPindah" required defaultValue="">
                <option value="" disabled>
                  Pilih Tujuan Pindah
                </option>
                {TUJUAN_PINDAH.map((value) => (
                  <option key={value} value={value}>
                    {TUJUAN_PINDAH_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Alamat tujuan" name="alamatTujuan" required />
            <Field label="Kabupaten / kota tujuan" name="destination" />
            <Field label="Alasan" name="reason" />
            <Field label="Nomor surat" name="referenceNo" />
            <button className="button button-primary" type="submit">
              Simpan Pindah Keluar
            </button>
          </form>
        </section>
        <section className="platform-card data-panel">
          <header>
            <h2>Kematian</h2>
            <p>Catat peristiwa kematian penduduk.</p>
          </header>
          <form action={catatKematianAction} className="form-stack">
            <ResidentSelect residents={residents} />
            <Field label="Tanggal meninggal" name="eventDate" type="date" required />
            <Field label="Tanggal lapor" name="reportDate" type="date" />
            <Field label="Tempat meninggal" name="tempatMeninggal" required />
            <Field label="Jam kematian" name="jamKematian" />
            <label className="form-field">
              <span className="form-label">Penyebab Kematian</span>
              <select className={inputClass} name="sebab" required defaultValue="">
                <option value="" disabled>
                  Pilih Penyebab Kematian
                </option>
                {SEBAB_KEMATIAN.map((value) => (
                  <option key={value} value={value}>
                    {SEBAB_KEMATIAN_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span className="form-label">Yang Menerangkan Kematian</span>
              <select className={inputClass} name="penolong" required defaultValue="">
                <option value="" disabled>
                  Pilih Yang Menerangkan Kematian
                </option>
                {PENOLONG_KEMATIAN.map((value) => (
                  <option key={value} value={value}>
                    {PENOLONG_KEMATIAN_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Anak ke-" name="anakKe" type="number" required />
            <Field label="Nomor akta kematian" name="nomorAkta" />
            <Field label="Alasan / keterangan" name="reason" />
            <Field label="Nomor surat kematian" name="referenceNo" />
            <button className="button button-primary" type="submit">
              Simpan Kematian
            </button>
          </form>
        </section>
        <section className="platform-card data-panel">
          <header>
            <h2>Perubahan Data / Status</h2>
            <p>Catat perubahan status penduduk yang diizinkan.</p>
          </header>
          <form action={catatPerubahanAction} className="form-stack">
            <ResidentSelect residents={residents} />
            <Field label="Tanggal perubahan" name="eventDate" type="date" required />
            <label className="form-field">
              <span className="form-label">Status baru</span>
              <select className={inputClass} name="lifeStatus" required defaultValue="">
                <option value="" disabled>
                  Pilih status
                </option>
                <option value="alive">Hidup</option>
                <option value="missing">Hilang</option>
                <option value="departed">Pergi</option>
                <option value="invalid">Tidak Valid</option>
              </select>
            </label>
            <Field label="Alasan" name="reason" />
            <Field label="Nomor dokumen" name="referenceNo" />
            <button className="button button-primary" type="submit">
              Simpan Perubahan
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
