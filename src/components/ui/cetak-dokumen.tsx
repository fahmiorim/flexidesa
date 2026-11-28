import Image from "next/image";

import {
  kopDesaAlamat,
  kopDesaLines,
  type KopDesa,
} from "@/features/administrasi-desa/bumindes/domain/buku-resmi";

/** Pejabat penandatangan pada blok tanda tangan dokumen cetak. */
interface PejabatCetak {
  nama: string;
  gelarDepan?: string | null;
  gelarBelakang?: string | null;
  nip?: string | null;
  niap?: string | null;
}

/** Identitas desa minimum untuk kop sekaligus blok tanda tangan. */
type DesaCetak = KopDesa & {
  namaKepalaDesa: string | null;
  nipKepalaDesa: string | null;
};

const KOSONG: KopDesa = {
  namaDesa: null,
  namaKecamatan: null,
  namaKabupaten: null,
  namaPropinsi: null,
  alamatKantor: null,
  telepon: null,
  emailDesa: null,
};

/** URL media publik tenant dari jalur tersimpan (`<idDesa>/<kategori>/<berkas>`). */
function mediaPublikUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return "/api/publik/media/" + path.split("/").map(encodeURIComponent).join("/");
}

const namaLengkap = (pejabat: PejabatCetak) =>
  [pejabat.gelarDepan, pejabat.nama, pejabat.gelarBelakang].filter(Boolean).join(" ");

/**
 * Kop surat desa: logo desa di kiri, baris pemerintah/kabupaten/kecamatan/desa
 * di tengah, lalu alamat kantor. Kolom kanan dikosongkan sebagai penyeimbang
 * agar teks tetap di tengah seperti kop surat resmi.
 */
export function KopCetak({ desa, logo }: { desa: KopDesa | null; logo?: string | null }) {
  const baris = kopDesaLines(desa ?? KOSONG);
  const alamat = kopDesaAlamat(desa ?? KOSONG);
  const logoSrc = mediaPublikUrl(logo);

  return (
    <header className="pemerintahan-cetak-kop">
      <div className="pemerintahan-cetak-kop-logo">
        {logoSrc ? (
          <Image
            src={logoSrc}
            alt={`Logo ${desa?.namaDesa ?? "desa"}`}
            width={84}
            height={84}
            priority
          />
        ) : null}
      </div>
      <div className="pemerintahan-cetak-kop-teks">
        {baris.map((teks) => (
          <strong key={teks}>{teks}</strong>
        ))}
        {alamat ? <p>{alamat}</p> : null}
      </div>
    </header>
  );
}

/** Judul dokumen cetak, dicetak di tengah dengan garis bawah. */
export function JudulCetak({ children }: { children: React.ReactNode }) {
  return <h2 className="pemerintahan-cetak-judul">{children}</h2>;
}

/**
 * Blok tanda tangan Kepala Desa dan Sekretaris Desa.
 *
 * Nama pejabat diambil dari data aparat aktif bila tersedia; bila belum ada,
 * tampilkan titik-titik agar dokumen tetap dapat ditandatangani manual.
 */
export function TandaTanganCetak({
  desa,
  sekretaris,
  tanggal = new Date(),
}: {
  desa: DesaCetak | null;
  sekretaris: PejabatCetak | null;
  tanggal?: Date;
}) {
  const hari = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(tanggal);
  const namaDesa = desa?.namaDesa ?? "Desa";

  return (
    <div className="pemerintahan-cetak-ttd">
      <div>
        Mengetahui,
        <strong>
          {desa?.namaDesa ? `KEPALA DESA ${desa.namaDesa.toUpperCase()}` : "KEPALA DESA"}
        </strong>
        <div className="pemerintahan-cetak-ttd-space" />
        <strong>
          <u>{desa?.namaKepalaDesa ?? "(........................)"}</u>
        </strong>
        {desa?.nipKepalaDesa ? <span>NIP. {desa.nipKepalaDesa}</span> : null}
      </div>
      <div>
        {namaDesa}, {hari}
        <strong>
          {desa?.namaDesa ? `SEKRETARIS DESA ${desa.namaDesa.toUpperCase()}` : "SEKRETARIS DESA"}
        </strong>
        <div className="pemerintahan-cetak-ttd-space" />
        <strong>
          <u>{sekretaris ? namaLengkap(sekretaris) : "(........................)"}</u>
        </strong>
        {sekretaris?.nip ? (
          <span>NIP. {sekretaris.nip}</span>
        ) : sekretaris?.niap ? (
          <span>NIAP. {sekretaris.niap}</span>
        ) : null}
      </div>
    </div>
  );
}
