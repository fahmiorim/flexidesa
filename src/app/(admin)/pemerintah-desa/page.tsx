import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { getPerangkatDesaData } from "@/features/pemerintahan/application/use-cases";
import { isJenisJabatan, LABEL_JENIS_JABATAN } from "@/features/pemerintahan/domain/aparat-desa";
import {
  hapusPerangkatAction,
  hapusPerangkatMassalAction,
  tetapkanPenandatanganAction,
  ubahStatusPerangkatAction,
} from "@/features/pemerintahan/presentation/actions";
import { simpanPerangkatFormAction } from "@/features/pemerintahan/presentation/form-actions";
import { FormDialog } from "@/features/pemerintahan/presentation/form-dialog";
import { FotoPerangkatInput } from "@/features/pemerintahan/presentation/foto-perangkat-input";
import { KelolaJabatanDialog } from "@/features/pemerintahan/presentation/kelola-jabatan-dialog";
import { PemilihJabatan } from "@/features/pemerintahan/presentation/pemilih-jabatan";
import { PemilihPenduduk } from "@/features/pemerintahan/presentation/pemilih-penduduk";
import { PengisiPenduduk } from "@/features/pemerintahan/presentation/pengisi-penduduk";

export const metadata = { title: "Pemerintah Desa" };

const inisial = (nama: string) =>
  nama
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((kata) => kata[0]?.toUpperCase() ?? "")
    .join("");

const MEDIA_SOSIAL = [
  "facebook",
  "instagram",
  "twitter",
  "tiktok",
  "youtube",
  "telegram",
  "whatsapp",
] as const;

function labelJenis(jenis: string | null) {
  return jenis && isJenisJabatan(jenis) ? LABEL_JENIS_JABATAN[jenis] : "Jabatan lain";
}

function nilaiMediaSosial(media: unknown, kunci: string) {
  if (!media || typeof media !== "object") return "";
  const isi = (media as Record<string, unknown>)[kunci];
  return typeof isi === "string" ? isi : "";
}

export default async function PerangkatDesaPage() {
  const { rows: semuaRows, jabatan, akses } = await getPerangkatDesaData();
  const rows = semuaRows;

  const activeRows = semuaRows.filter((row) => row.status === "aktif");
  /**
   * Isi langkah-langkah form perangkat desa.
   *
   * Dipakai bersama oleh dialog tambah dan dialog ubah per baris agar urutan
   * langkah, penanda wajib, dan penjelasan field teknis konsisten di keduanya.
   */
  const isiFormPerangkat = (perangkatEdit: (typeof semuaRows)[number] | null) => {
    // Aparat aktif yang memegang tiap jabatan, untuk menandai perangkapan jabatan.
    const pemakaiJabatan = new Map<number, string[]>();
    for (const row of activeRows) {
      if (!row.jabatanId || row.id === perangkatEdit?.id) continue;
      pemakaiJabatan.set(row.jabatanId, [...(pemakaiJabatan.get(row.jabatanId) ?? []), row.nama]);
    }
    return (
      <>
        {perangkatEdit ? <input name="id" type="hidden" value={perangkatEdit.id} /> : null}
        <PengisiPenduduk />

        <fieldset>
          <legend>Identitas &amp; kontak</legend>
          <label>
            Data Penduduk
            <PemilihPenduduk
              defaultLabel={perangkatEdit?.nama ?? ""}
              defaultValue={perangkatEdit?.residentId ?? null}
            />
          </label>
          <label>
            Nama Lengkap *
            <input defaultValue={perangkatEdit?.nama ?? ""} maxLength={100} name="nama" required />
          </label>
          <label>
            Jabatan
            <PemilihJabatan
              defaultValue={perangkatEdit?.jabatanId ?? null}
              options={jabatan.map((item) => ({
                id: item.id,
                nama: item.nama,
                pemakai: pemakaiJabatan.get(item.id) ?? [],
              }))}
            />
          </label>
          <label>
            Atasan Langsung
            <select defaultValue={perangkatEdit?.atasanId ?? ""} name="atasanId">
              <option value="">Tidak ada / Kepala Desa</option>
              {activeRows
                .filter((item) => item.id !== perangkatEdit?.id)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nama} — {item.jabatan}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Telepon
            <input defaultValue={perangkatEdit?.telepon ?? ""} name="telepon" />
          </label>
          <label>
            Email
            <input defaultValue={perangkatEdit?.email ?? ""} name="email" type="email" />
          </label>
          <FotoPerangkatInput
            fotoLama={perangkatEdit?.foto}
            label={perangkatEdit ? "Ganti Foto" : "Foto Perangkat"}
          />
        </fieldset>

        <fieldset>
          <legend>Masa jabatan &amp; status</legend>
          <label>
            Periode Jabatan
            <input
              defaultValue={perangkatEdit?.periode ?? ""}
              name="periode"
              placeholder="2024–2030"
            />
          </label>
          <label>
            Nomor SK Pengangkatan
            <input
              defaultValue={perangkatEdit?.nomorSkPengangkatan ?? ""}
              name="nomorSkPengangkatan"
            />
          </label>
          <label>
            Tanggal Pengangkatan
            <input
              defaultValue={perangkatEdit?.tanggalPengangkatan ?? ""}
              name="tanggalPengangkatan"
              type="date"
            />
          </label>
          <label>
            Status
            <select defaultValue={perangkatEdit?.status ?? "aktif"} name="status">
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </label>
          <label className="pemerintahan-check">
            <input
              defaultChecked={perangkatEdit?.statusPejabat ?? false}
              name="statusPejabat"
              type="checkbox"
            />{" "}
            Pejabat sementara (Pj) Kepala Desa
          </label>
          <label className="pemerintahan-check">
            <input
              defaultChecked={perangkatEdit ? perangkatEdit.kehadiran : true}
              name="kehadiran"
              type="checkbox"
            />{" "}
            Status kehadiran aktif
            <input name="kehadiran" type="hidden" value="off" />
          </label>
          <label className="pemerintahan-check">
            <input defaultChecked={perangkatEdit?.ttdAn ?? false} name="ttdAn" type="checkbox" />{" "}
            Penandatangan atas nama (a.n — Sekretaris Desa)
          </label>
          <label className="pemerintahan-check">
            <input defaultChecked={perangkatEdit?.ttdUb ?? false} name="ttdUb" type="checkbox" />{" "}
            Penandatangan untuk beliau (u.b)
          </label>
        </fieldset>

        <details className="pemerintahan-detail">
          <summary>Data lain (opsional)</summary>
          <fieldset>
            <legend>Data pribadi</legend>
            <label>
              Gelar Depan
              <input defaultValue={perangkatEdit?.gelarDepan ?? ""} name="gelarDepan" />
            </label>
            <label>
              Gelar Belakang
              <input defaultValue={perangkatEdit?.gelarBelakang ?? ""} name="gelarBelakang" />
            </label>
            <label>
              NIK (internal)
              <input defaultValue={perangkatEdit?.nik ?? ""} maxLength={16} name="nik" />
            </label>
            <label>
              Jenis Kelamin
              <select defaultValue={perangkatEdit?.jenisKelamin ?? ""} name="jenisKelamin">
                <option value="">Pilih</option>
                <option value="male">Laki-laki</option>
                <option value="female">Perempuan</option>
              </select>
            </label>
            <label>
              Tempat Lahir
              <input defaultValue={perangkatEdit?.tempatLahir ?? ""} name="tempatLahir" />
            </label>
            <label>
              Tanggal Lahir
              <input
                defaultValue={perangkatEdit?.tanggalLahir ?? ""}
                name="tanggalLahir"
                type="date"
              />
            </label>
            <label>
              Agama
              <input defaultValue={perangkatEdit?.agama ?? ""} maxLength={50} name="agama" />
            </label>
            <label>
              Alamat
              <input defaultValue={perangkatEdit?.alamat ?? ""} name="alamat" />
            </label>
          </fieldset>

          <fieldset>
            <legend>Kepegawaian</legend>
            <label>
              NIP
              <input defaultValue={perangkatEdit?.nip ?? ""} name="nip" />
            </label>
            <label>
              NIAP
              <input
                defaultValue={perangkatEdit?.niap ?? ""}
                maxLength={30}
                name="niap"
                placeholder="Nomor Induk Aparatur Pemerintah Desa"
              />
            </label>
            <label>
              Tag ID Card
              <input
                defaultValue={perangkatEdit?.tagIdCard ?? ""}
                maxLength={30}
                name="tagIdCard"
              />
            </label>
            <label>
              Pangkat / Golongan
              <input
                defaultValue={perangkatEdit?.pangkat ?? ""}
                maxLength={50}
                name="pangkat"
                placeholder="Mis. Pembina / IV.a"
              />
            </label>
            <label>
              Pendidikan
              <input defaultValue={perangkatEdit?.pendidikan ?? ""} name="pendidikan" />
            </label>
            <label>
              Urutan
              <input defaultValue={perangkatEdit?.urut ?? 0} min="0" name="urut" type="number" />
            </label>
          </fieldset>

          <fieldset>
            <legend>Pemberhentian</legend>
            <label>
              Nomor SK Pemberhentian
              <input
                defaultValue={perangkatEdit?.nomorSkPemberhentian ?? ""}
                name="nomorSkPemberhentian"
              />
            </label>
            <label>
              Tanggal Pemberhentian
              <input
                defaultValue={perangkatEdit?.tanggalPemberhentian ?? ""}
                name="tanggalPemberhentian"
                type="date"
              />
            </label>
          </fieldset>

          <fieldset>
            <legend>Bagan &amp; media sosial</legend>
            <label>
              Tingkat Bagan
              <input
                defaultValue={perangkatEdit?.baganTingkat ?? ""}
                min="0"
                name="baganTingkat"
                placeholder="0"
                type="number"
              />
            </label>
            <label>
              Geser Bagan (offset)
              <input
                defaultValue={perangkatEdit?.baganOffset ?? ""}
                maxLength={10}
                name="baganOffset"
                placeholder="mis. -75%"
              />
            </label>
            <label>
              Tata Letak Bagan
              <select defaultValue={perangkatEdit?.baganLayout ?? ""} name="baganLayout">
                <option value="">Bawaan</option>
                <option value="hanging">Menggantung</option>
                <option value="normal">Normal</option>
              </select>
            </label>
            <label>
              Warna Bagan
              <input
                defaultValue={perangkatEdit?.baganWarna ?? ""}
                maxLength={10}
                name="baganWarna"
                placeholder="#FFFFFF"
              />
            </label>
            {MEDIA_SOSIAL.map((kunci) => (
              <label key={kunci}>
                Media Sosial — {kunci}
                <input
                  defaultValue={
                    perangkatEdit ? nilaiMediaSosial(perangkatEdit.mediaSosial, kunci) : ""
                  }
                  maxLength={200}
                  name={`mediaSosial[${kunci}]`}
                />
              </label>
            ))}
          </fieldset>
        </details>
      </>
    );
  };

  return (
    <div className="modul-page pemerintahan-page pemerintahan-halaman pemerintah-desa-page">
      <PageHeading>
        <header className="page-heading">
          <div>
            <h1>Pemerintah Desa</h1>
            <p>Kelola aparat, jabatan, dan bagan organisasi desa.</p>
          </div>
        </header>
      </PageHeading>

      <section className="pd-panel" id="daftar-perangkat">
        <div className="pd-panel-kepala">
          <div>
            <h2>Daftar Perangkat Desa</h2>
            <p>
              {semuaRows.length > 0
                ? `${activeRows.length} aparat aktif · ${semuaRows.length - activeRows.length} nonaktif.`
                : "Belum ada aparat terdaftar. Tambahkan aparat pertama lewat tombol di samping."}
            </p>
          </div>
          <div className="wilayah-toolbar">
            <div className="wilayah-toolbar-grup">
              <KelolaJabatanDialog
                bolehHapus={akses.hapus}
                bolehUbah={akses.ubah}
                jabatan={jabatan.map((item) => ({
                  ...item,
                  jumlahAparat: semuaRows.filter((row) => row.jabatanId === item.id).length,
                }))}
                tombolClassName="wilayah-tool"
              />
              <Link className="wilayah-tool" href="/pemerintah-desa/bagan">
                <span aria-hidden="true">▤</span> Bagan
              </Link>
              <Link className="wilayah-tool" href="/pemerintah-desa/cetak">
                <span aria-hidden="true">⧉</span> Cetak
              </Link>
            </div>
            {akses.hapus && semuaRows.length > 0 ? (
              <form id="hapus-perangkat-massal" action={hapusPerangkatMassalAction}>
                <ConfirmSubmit
                  className="button button-danger-ghost"
                  message="Hapus semua aparat yang dicentang? Tindakan ini permanen."
                >
                  Hapus terpilih
                </ConfirmSubmit>
              </form>
            ) : null}
            {akses.ubah ? (
              <FormDialog
                aksi={simpanPerangkatFormAction}
                deskripsi="Identitas, jabatan, kontak, masa jabatan, dan bagan."
                judul="Tambah Aparat Pemerintah Desa"
                label="Tambah Aparat"
                labelSimpan="Simpan Perangkat"
              >
                {isiFormPerangkat(null)}
              </FormDialog>
            ) : null}
          </div>
        </div>

        {rows.length ? (
          <div className="modul-table-wrap">
            <table className="modul-table pemerintah-table">
              <thead>
                <tr>
                  {akses.hapus ? <th aria-label="Pilih" /> : null}
                  <th>No</th>
                  <th>Nama</th>
                  <th>Jabatan</th>
                  <th>Periode</th>
                  <th>Kontak</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    className={row.status === "aktif" ? undefined : "pemerintah-row-nonaktif"}
                    key={row.id}
                  >
                    {akses.hapus ? (
                      <td>
                        <input
                          aria-label={`Pilih ${row.nama}`}
                          form="hapus-perangkat-massal"
                          name="ids"
                          type="checkbox"
                          value={row.id}
                        />
                      </td>
                    ) : null}
                    <td>{index + 1}</td>
                    <td>
                      <div className="pemerintah-nama">
                        <span aria-hidden className="pd-aparat-avatar">
                          {inisial(row.nama)}
                        </span>
                        <div className="pemerintah-nama-isi">
                          <strong>
                            {[row.gelarDepan, row.nama, row.gelarBelakang]
                              .filter(Boolean)
                              .join(" ")}
                          </strong>
                          <span className="pemerintah-chips">
                            <span
                              className={`pd-chip ${row.status === "aktif" ? "is-aktif" : "is-nonaktif"}`}
                            >
                              {row.status === "aktif" ? "Aktif" : "Nonaktif"}
                            </span>
                            {row.statusPejabat ? (
                              <span className="pd-chip is-pj">Pj Kades</span>
                            ) : null}
                            {row.ttdAn ? <span className="pd-chip">a.n</span> : null}
                            {row.ttdUb ? <span className="pd-chip">u.b</span> : null}
                            {row.wilayahId ? (
                              <span
                                className="pd-chip"
                                title="Dibuat dari penunjukan kepala wilayah"
                              >
                                Dari Wilayah
                              </span>
                            ) : null}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong className="pemerintah-jabatan">
                        {row.jabatan ?? "Belum ditentukan"}
                      </strong>
                      <small className="pemerintah-jenis-jabatan">
                        {labelJenis(row.jenisJabatan)}
                      </small>
                    </td>
                    <td>{row.periode || "—"}</td>
                    <td>{row.telepon ?? row.email ?? "—"}</td>
                    <td>
                      <div className="pd-aparat-aksi">
                        {akses.ubah ? (
                          <FormDialog
                            aksi={simpanPerangkatFormAction}
                            deskripsi={`Ubah data ${row.nama}.`}
                            judul={`Ubah Data ${row.nama}`}
                            key={`perangkat-${row.id}`}
                            label="Ubah"
                            labelSimpan="Simpan Perubahan"
                            varian="ghost"
                          >
                            {isiFormPerangkat(row)}
                          </FormDialog>
                        ) : null}

                        {akses.ubah || akses.hapus ? (
                          <details className="pd-menu">
                            <summary aria-label={`Aksi lain untuk ${row.nama}`}>⋯</summary>
                            <div className="pd-menu-isi">
                              {akses.ubah ? (
                                <>
                                  <p className="pd-menu-judul">Status &amp; penandatangan</p>
                                  <form action={ubahStatusPerangkatAction}>
                                    <input name="id" type="hidden" value={row.id} />
                                    <input
                                      name="status"
                                      type="hidden"
                                      value={row.status === "aktif" ? "nonaktif" : "aktif"}
                                    />
                                    <button className="button button-ghost" type="submit">
                                      {row.status === "aktif"
                                        ? "Nonaktifkan aparat"
                                        : "Aktifkan aparat"}
                                    </button>
                                  </form>
                                  {row.ttdAn || row.ttdUb ? (
                                    <form action={tetapkanPenandatanganAction}>
                                      <input name="id" type="hidden" value={row.id} />
                                      <input name="jenis" type="hidden" value="" />
                                      <button className="button button-ghost" type="submit">
                                        Lepas penandatangan
                                      </button>
                                    </form>
                                  ) : (
                                    <>
                                      {row.jenisJabatan === "sekdes" && row.status === "aktif" ? (
                                        <form action={tetapkanPenandatanganAction}>
                                          <input name="id" type="hidden" value={row.id} />
                                          <input name="jenis" type="hidden" value="an" />
                                          <button className="button button-ghost" type="submit">
                                            Jadikan penandatangan a.n
                                          </button>
                                        </form>
                                      ) : null}
                                      {(row.jenisJabatan ?? "lainnya") === "lainnya" &&
                                      row.status === "aktif" ? (
                                        <form action={tetapkanPenandatanganAction}>
                                          <input name="id" type="hidden" value={row.id} />
                                          <input name="jenis" type="hidden" value="ub" />
                                          <button className="button button-ghost" type="submit">
                                            Jadikan penandatangan u.b
                                          </button>
                                        </form>
                                      ) : null}
                                    </>
                                  )}
                                </>
                              ) : null}
                              {akses.hapus ? (
                                <form action={hapusPerangkatAction}>
                                  <input name="id" type="hidden" value={row.id} />
                                  <ConfirmSubmit
                                    className="button button-danger-ghost"
                                    message={`Hapus ${row.nama} dari perangkat desa?`}
                                  >
                                    Hapus aparat
                                  </ConfirmSubmit>
                                </form>
                              ) : null}
                            </div>
                          </details>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="modul-empty">Belum ada aparat terdaftar.</p>
        )}
      </section>
    </div>
  );
}
