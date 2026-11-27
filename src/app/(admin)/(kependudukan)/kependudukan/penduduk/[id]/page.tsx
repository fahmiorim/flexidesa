import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { kembalikanStatusAction } from "@/app/(admin)/(kependudukan)/kependudukan/mutasi-penduduk/actions";
import { hapusPendudukAction } from "@/app/(admin)/(kependudukan)/kependudukan/penduduk/actions";
import { PageHeading } from "@/components/shell/page-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { formatWilayahLabel } from "@/features/info-desa/wilayah/domain/wilayah";
import { getPendudukDetailData } from "@/features/kependudukan/penduduk/application/use-cases";
import {
  ACTIVE_STATUS_LABELS,
  BIRTH_ASSISTANT_LABELS,
  BIRTH_PLACE_TYPE_LABELS,
  BIRTH_TYPE_LABELS,
  calculateAge,
  CHRONIC_ILLNESS_LABELS,
  CONTACT_METHOD_LABELS,
  DISABILITY_LABELS,
  GENDER_LABELS,
  INSURANCE_LABELS,
  KB_METHOD_LABELS,
  KTP_EL_LABELS,
  LIFE_STATUS_LABELS,
  LITERACY_LABELS,
  PENDUDUK_RESOURCE,
  PREGNANCY_STATUS_LABELS,
  RESIDENCE_STATUS_LABELS,
  samarkanNik,
  STATUS_REKAM_LABELS,
} from "@/features/kependudukan/penduduk/domain/penduduk";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Detail Penduduk",
};

const tanggal = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatTanggal(value: string | null): string {
  if (!value) return "Belum diisi";
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : tanggal.format(parsed);
}

function nilaiAtauStrip(value: string | null | undefined): string {
  return value?.trim() ? value : "—";
}

/** Label enum opsional; nilai kosong ditampilkan sebagai strip. */
function label<T extends string>(value: T | null, labels: Readonly<Record<T, string>>): string {
  return value ? labels[value] : "—";
}

/** Nomor dokumen pribadi hanya ditampilkan penuh bagi pengguna berizin ubah. */
function nilaiDokumen(value: string | null | undefined, bolehLihat: boolean): string {
  if (!value?.trim()) return "—";
  return bolehLihat ? value : "Tersembunyi";
}

export default async function PendudukDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const nomor = Number(id);

  if (!Number.isInteger(nomor) || nomor <= 0) notFound();

  const [data, user] = await Promise.all([getPendudukDetailData(nomor), verifySession()]);
  if (!data) notFound();

  const bolehUbah = hasPermission(user.permissions, PENDUDUK_RESOURCE, "update");
  const bolehHapus = hasPermission(user.permissions, PENDUDUK_RESOURCE, "delete");

  const penduduk = data.resident;
  const usia = calculateAge(penduduk.birthDate);
  const wilayah = data.region
    ? formatWilayahLabel({
        dusun: data.region.dusun ?? "",
        rw: data.region.rw ?? "",
        rt: data.region.rt ?? "",
      })
    : null;
  const wilayahTerisi =
    data.region && (data.region.dusun || data.region.rw || data.region.rt) ? wilayah : null;

  return (
    <div className="modul-page penduduk-page data-kependudukan-page">
      <Link className="penduduk-back" href="/kependudukan/penduduk">
        ← Kembali ke Data Penduduk
      </Link>

      <PageHeading
        judul={<>{penduduk.name}</>}
        deskripsi={
          <>
            NIK {samarkanNik(penduduk.nationalId)} · {GENDER_LABELS[penduduk.gender]}
            {usia !== null ? ` · ${usia} tahun` : ""}
          </>
        }
        kelas="page-heading penduduk-detail-heading"
        aksi={
          <>
            <div className="penduduk-heading-actions">
              <span
                className="beranda-chip"
                data-tone={penduduk.lifeStatus === "alive" ? "hijau" : "oranye"}
              >
                {LIFE_STATUS_LABELS[penduduk.lifeStatus]}
              </span>
              {bolehUbah ? (
                <ButtonLink variant="primary" href={`/kependudukan/penduduk/${penduduk.id}/ubah`}>
                  Ubah Data
                </ButtonLink>
              ) : null}
              {bolehUbah && penduduk.lifeStatus === "alive" ? (
                <ButtonLink
                  variant="secondary"
                  href={`/kependudukan/penduduk/${penduduk.id}/mutasi`}
                >
                  Mutasi
                </ButtonLink>
              ) : null}
              {bolehUbah && penduduk.lifeStatus !== "alive" ? (
                <form action={kembalikanStatusAction.bind(null, penduduk.id)}>
                  <ConfirmSubmit
                    variant="secondary"
                    message="Kembalikan status penduduk ini menjadi Hidup? Perubahan ini akan mempengaruhi laporan penduduk bulanan."
                  >
                    Kembalikan Status
                  </ConfirmSubmit>
                </form>
              ) : null}
              {bolehHapus ? (
                <DialogHapusForm
                  aksi={hapusPendudukAction}
                  id={penduduk.id}
                  judul={`Hapus data ${penduduk.name}?`}
                  keterangan="Data penduduk dihapus permanen; riwayat anggota keluarga tetap tersimpan."
                  label="Hapus Data"
                  labelAksi="Hapus penduduk"
                />
              ) : null}
            </div>
          </>
        }
      />

      <div className="penduduk-detail-layout">
        <div className="penduduk-detail-main">
          <section className="platform-card penduduk-detail-card">
            <header className="penduduk-card-head">
              <div>
                <h2>Identitas Penduduk</h2>
                <p>Data pribadi yang tercatat pada desa ini.</p>
              </div>
            </header>
            <dl className="penduduk-detail-grid">
              <div>
                <dt>NIK</dt>
                <dd className="modul-mono">{samarkanNik(penduduk.nationalId)}</dd>
              </div>
              <div>
                <dt>Nama lengkap</dt>
                <dd>{penduduk.name}</dd>
              </div>
              <div>
                <dt>Jenis kelamin</dt>
                <dd>{GENDER_LABELS[penduduk.gender]}</dd>
              </div>
              <div>
                <dt>Tempat lahir</dt>
                <dd>{nilaiAtauStrip(penduduk.birthPlace)}</dd>
              </div>
              <div>
                <dt>Tanggal lahir</dt>
                <dd>{formatTanggal(penduduk.birthDate)}</dd>
              </div>
              <div>
                <dt>Usia</dt>
                <dd>{usia === null ? "—" : `${usia} tahun`}</dd>
              </div>
              <div>
                <dt>Agama</dt>
                <dd>{nilaiAtauStrip(data.religion?.name)}</dd>
              </div>
              <div>
                <dt>Kewarganegaraan</dt>
                <dd>{nilaiAtauStrip(data.citizenship?.name)}</dd>
              </div>
              <div>
                <dt>Golongan darah</dt>
                <dd>{nilaiAtauStrip(data.bloodType?.name)}</dd>
              </div>
              <div>
                <dt>Status perkawinan</dt>
                <dd>{nilaiAtauStrip(data.maritalStatus?.name)}</dd>
              </div>
              <div>
                <dt>Hubungan keluarga</dt>
                <dd>{nilaiAtauStrip(data.familyRelation?.name)}</dd>
              </div>
              <div>
                <dt>Pendidikan terakhir</dt>
                <dd>{nilaiAtauStrip(data.education?.name)}</dd>
              </div>
              <div>
                <dt>Pekerjaan</dt>
                <dd>{nilaiAtauStrip(data.occupation?.name)}</dd>
              </div>
              <div>
                <dt>Pekerja migran</dt>
                <dd>{nilaiAtauStrip(penduduk.migrantWorker)}</dd>
              </div>
              <div>
                <dt>Kepemilikan identitas</dt>
                <dd>{label(penduduk.ktpEl, KTP_EL_LABELS)}</dd>
              </div>
              <div>
                <dt>Status rekam KTP</dt>
                <dd>{label(penduduk.statusRekam, STATUS_REKAM_LABELS)}</dd>
              </div>
              <div>
                <dt>Tempat penerbitan KTP</dt>
                <dd>{nilaiAtauStrip(penduduk.ktpIssuedPlace)}</dd>
              </div>
              <div>
                <dt>Tanggal penerbitan KTP</dt>
                <dd>{formatTanggal(penduduk.ktpIssuedDate)}</dd>
              </div>
              <div>
                <dt>Tag ID Card</dt>
                <dd className="modul-mono">{nilaiAtauStrip(penduduk.idCardTag)}</dd>
              </div>
              <div>
                <dt>Nomor KK sebelumnya</dt>
                <dd className="modul-mono">{nilaiAtauStrip(penduduk.previousFamilyNumber)}</dd>
              </div>
            </dl>
          </section>

          <section className="platform-card penduduk-detail-card">
            <header className="penduduk-card-head">
              <div>
                <h2>Data Kelahiran</h2>
                <p>Detail kelahiran yang tercatat pada dokumen kependudukan.</p>
              </div>
            </header>
            <dl className="penduduk-detail-grid">
              <div>
                <dt>Waktu lahir</dt>
                <dd>{nilaiAtauStrip(penduduk.birthTime)}</dd>
              </div>
              <div>
                <dt>Tempat dilahirkan</dt>
                <dd>{label(penduduk.birthPlaceType, BIRTH_PLACE_TYPE_LABELS)}</dd>
              </div>
              <div>
                <dt>Jenis kelahiran</dt>
                <dd>{label(penduduk.birthType, BIRTH_TYPE_LABELS)}</dd>
              </div>
              <div>
                <dt>Anak ke-</dt>
                <dd>{penduduk.birthChildNumber ?? "—"}</dd>
              </div>
              <div>
                <dt>Penolong kelahiran</dt>
                <dd>{label(penduduk.birthAssistant, BIRTH_ASSISTANT_LABELS)}</dd>
              </div>
              <div>
                <dt>Berat lahir</dt>
                <dd>
                  {penduduk.birthWeightGram === null ? "—" : `${penduduk.birthWeightGram} gram`}
                </dd>
              </div>
              <div>
                <dt>Panjang lahir</dt>
                <dd>{penduduk.birthLengthCm === null ? "—" : `${penduduk.birthLengthCm} cm`}</dd>
              </div>
            </dl>
          </section>

          <section className="platform-card penduduk-detail-card">
            <header className="penduduk-card-head">
              <div>
                <h2>Alamat &amp; Kontak</h2>
                <p>Wilayah dan kontak yang tercatat untuk penduduk ini.</p>
              </div>
            </header>
            <dl className="penduduk-detail-grid">
              <div className="penduduk-detail-lebar">
                <dt>Alamat</dt>
                <dd>{nilaiAtauStrip(penduduk.address)}</dd>
              </div>
              <div>
                <dt>Alamat sebelumnya</dt>
                <dd>{nilaiAtauStrip(penduduk.previousAddress)}</dd>
              </div>
              <div>
                <dt>Alamat sekarang</dt>
                <dd>{nilaiAtauStrip(penduduk.currentAddress)}</dd>
              </div>
              <div>
                <dt>Koordinat</dt>
                <dd className="modul-mono">
                  {penduduk.latitude && penduduk.longitude
                    ? `${penduduk.latitude}, ${penduduk.longitude}`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Telepon</dt>
                <dd>{nilaiAtauStrip(penduduk.phone)}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{nilaiAtauStrip(penduduk.email)}</dd>
              </div>
              <div>
                <dt>Telegram</dt>
                <dd>{nilaiAtauStrip(penduduk.telegram)}</dd>
              </div>
              <div>
                <dt>Cara hubung warga</dt>
                <dd>{label(penduduk.contactMethod, CONTACT_METHOD_LABELS)}</dd>
              </div>
              <div>
                <dt>Wilayah</dt>
                <dd>{wilayahTerisi ?? "Belum diisi"}</dd>
              </div>
              <div>
                <dt>Status tempat tinggal</dt>
                <dd>{RESIDENCE_STATUS_LABELS[penduduk.residenceStatus]}</dd>
              </div>
              <div>
                <dt>Status kependudukan</dt>
                <dd>{LIFE_STATUS_LABELS[penduduk.lifeStatus]}</dd>
              </div>
            </dl>
          </section>

          <section className="platform-card penduduk-detail-card">
            <header className="penduduk-card-head">
              <div>
                <h2>Dokumen &amp; Data Tambahan</h2>
                <p>Nomor dokumen lengkap hanya tampil bagi pengguna berizin ubah.</p>
              </div>
            </header>
            <dl className="penduduk-detail-grid">
              <div>
                <dt>Nomor akta lahir</dt>
                <dd>{nilaiDokumen(penduduk.birthCertificateNumber, bolehUbah)}</dd>
              </div>
              <div>
                <dt>Nomor akta kawin</dt>
                <dd>{nilaiDokumen(penduduk.marriageCertificateNumber, bolehUbah)}</dd>
              </div>
              <div>
                <dt>Tanggal perkawinan</dt>
                <dd>{formatTanggal(penduduk.marriageDate)}</dd>
              </div>
              <div>
                <dt>Nomor akta cerai</dt>
                <dd>{nilaiDokumen(penduduk.divorceCertificateNumber, bolehUbah)}</dd>
              </div>
              <div>
                <dt>Tanggal perceraian</dt>
                <dd>{formatTanggal(penduduk.divorceDate)}</dd>
              </div>
              <div>
                <dt>Nomor paspor</dt>
                <dd>{nilaiDokumen(penduduk.passportNumber, bolehUbah)}</dd>
              </div>
              <div>
                <dt>Tanggal akhir paspor</dt>
                <dd>{formatTanggal(penduduk.passportExpiryDate)}</dd>
              </div>
              <div>
                <dt>Nomor KITAS</dt>
                <dd>{nilaiDokumen(penduduk.kitasNumber, bolehUbah)}</dd>
              </div>
              <div>
                <dt>Suku/etnis</dt>
                <dd>{nilaiAtauStrip(penduduk.ethnicity)}</dd>
              </div>
              <div>
                <dt>Wilayah adat</dt>
                <dd>{nilaiAtauStrip(penduduk.adat)}</dd>
              </div>
              <div>
                <dt>Marga</dt>
                <dd>{nilaiAtauStrip(penduduk.marga)}</dd>
              </div>
              <div>
                <dt>Negara asal</dt>
                <dd>{nilaiAtauStrip(penduduk.originCountry)}</dd>
              </div>
              <div className="penduduk-detail-lebar">
                <dt>Keterangan</dt>
                <dd>{nilaiAtauStrip(penduduk.notes)}</dd>
              </div>
            </dl>
          </section>

          <section className="platform-card penduduk-detail-card">
            <header className="penduduk-card-head">
              <div>
                <h2>Kesehatan &amp; Asuransi</h2>
                <p>Kondisi kesehatan, program KB, dan kepesertaan asuransi.</p>
              </div>
            </header>
            <dl className="penduduk-detail-grid">
              <div>
                <dt>Disabilitas</dt>
                <dd>{label(penduduk.disability, DISABILITY_LABELS)}</dd>
              </div>
              <div>
                <dt>Sakit menahun</dt>
                <dd>{label(penduduk.chronicIllness, CHRONIC_ILLNESS_LABELS)}</dd>
              </div>
              <div>
                <dt>Akseptor KB</dt>
                <dd>{label(penduduk.kbMethod, KB_METHOD_LABELS)}</dd>
              </div>
              <div>
                <dt>Status kehamilan</dt>
                <dd>{label(penduduk.pregnancyStatus, PREGNANCY_STATUS_LABELS)}</dd>
              </div>
              <div>
                <dt>Asuransi kesehatan</dt>
                <dd>{label(penduduk.insurance, INSURANCE_LABELS)}</dd>
              </div>
              <div>
                <dt>Nomor asuransi</dt>
                <dd>{nilaiDokumen(penduduk.insuranceNumber, bolehUbah)}</dd>
              </div>
              <div>
                <dt>Status kepesertaan</dt>
                <dd>{label(penduduk.insuranceStatus, ACTIVE_STATUS_LABELS)}</dd>
              </div>
              <div>
                <dt>BPJS Ketenagakerjaan</dt>
                <dd>{nilaiDokumen(penduduk.bpjsEmploymentNumber, bolehUbah)}</dd>
              </div>
              <div>
                <dt>Dapat membaca huruf</dt>
                <dd>{label(penduduk.literacy, LITERACY_LABELS)}</dd>
              </div>
            </dl>
          </section>

          <section className="platform-card penduduk-detail-card">
            <header className="penduduk-card-head">
              <div>
                <h2>Data Orang Tua</h2>
                <p>Nama dan NIK orang tua sebagaimana tercatat.</p>
              </div>
            </header>
            <dl className="penduduk-detail-grid">
              <div>
                <dt>Nama ayah</dt>
                <dd>{nilaiAtauStrip(penduduk.fatherName)}</dd>
              </div>
              <div>
                <dt>NIK ayah</dt>
                <dd className="modul-mono">{samarkanNik(penduduk.fatherNationalId)}</dd>
              </div>
              <div>
                <dt>Nama ibu</dt>
                <dd>{nilaiAtauStrip(penduduk.motherName)}</dd>
              </div>
              <div>
                <dt>NIK ibu</dt>
                <dd className="modul-mono">{samarkanNik(penduduk.motherNationalId)}</dd>
              </div>
            </dl>
          </section>
        </div>

        <aside className="penduduk-detail-rail">
          <section className="platform-card penduduk-detail-card">
            <header className="penduduk-card-head">
              <div>
                <h2>Kartu Keluarga</h2>
              </div>
            </header>
            {data.family ? (
              <dl className="penduduk-detail-grid penduduk-detail-grid-satu">
                <div>
                  <dt>Nomor KK</dt>
                  <dd className="modul-mono">{data.family.number}</dd>
                </div>
                <div>
                  <dt>Alamat KK</dt>
                  <dd>{nilaiAtauStrip(data.family.address)}</dd>
                </div>
                <div>
                  <dt>Wilayah</dt>
                  <dd>{wilayahTerisi ?? "Belum diisi"}</dd>
                </div>
              </dl>
            ) : (
              <p className="modul-empty">Penduduk ini belum terhubung ke Kartu Keluarga.</p>
            )}
          </section>

          <section className="platform-card penduduk-detail-catatan">
            <h2>Catatan Privasi</h2>
            <p>NIK disamarkan; buka data lengkap hanya lewat alur berwenang.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
