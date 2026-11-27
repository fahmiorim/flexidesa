"use client";

import { useCallback, useEffect, useState } from "react";

import { PageHeading } from "@/components/shell/page-heading";
import { validasiUkuranLogo } from "@/features/info-desa/identitas-desa/domain/identitas-form";
import { TIPE_PETA_DEFAULT } from "@/features/info-desa/wilayah/domain/wilayah";
import {
  blankSebutan,
  blankUmum,
  type Data,
  type MediaField,
  type ProfilForm,
  type Sebutan,
} from "@/features/pengaturan/pengaturan/presentation/pengaturan-desa-types";
import styles from "@/features/pengaturan/pengaturan/presentation/pengaturan-desa.module.css";

import { IdentitasDesaView } from "./identitas-desa-view";

/** Kerangka data kosong untuk mode Identitas (tab lain tidak dipakai). */
const dataKosong: Data = {
  desa: null,
  profil: null,
  kontak: {},
  faqKontak: [],
  faqSurat: [],
  favicon: null,
  templates: [],
  temaAktif: null,
  umum: { ...blankUmum },
  sebutan: blankSebutan,
  layanan: [],
  media: { usedBytes: 0, quotaMb: null },
};

const profileKosong: ProfilForm = {
  namaDesa: "",
  kodeDesa: "",
  kodeBps: "",
  namaKecamatan: "",
  namaCamat: "",
  nipCamat: "",
  namaKabupaten: "",
  namaPropinsi: "",
  kodePos: "",
  namaKepalaDesa: "",
  nipKepalaDesa: "",
  visi: "",
  misi: "",
  sejarah: "",
  sambutan: "",
  alamat: "",
  email: "",
  telepon: "",
  nomorOperator: "",
  website: "",
  kontakPemberitahuanNama: "",
  kontakPemberitahuanTelepon: "",
  kontakPemberitahuanJabatan: "",
  koordinat: "",
  mapTipe: TIPE_PETA_DEFAULT,
  luasWilayah: "",
  batasUtara: "",
  batasSelatan: "",
  batasTimur: "",
  batasBarat: "",
  ketinggian: "",
  suhuRataRata: "",
  curahHujan: "",
  topografi: "",
  jenisTanah: "",
  sumberDayaAlam: "",
  floraFauna: "",
  rawanBencana: "",
  kearifanLokal: "",
  jenisJaringan: "",
  providerInternet: "",
  cakupanWilayah: "",
  kecepatanInternet: "",
  aksesPublik: "",
  statusDesa: "",
  lembagaAdat: "",
  strukturAdat: "",
  wilayahAdat: "",
  peraturanAdat: "",
  regulasiPenetapanKampungAdat: "",
  dokumenRegulasiPenetapanKampungAdat: "",
  batasDesa: "",
  tahunBerdiri: "",
  tujuanPembangunan: "",
  nilaiDasar: "",
  arahKebijakan: "",
};

/** Susun form profil dari data tersimpan identitas desa. */
function profilDariData(d: Data): ProfilForm {
  return {
    namaDesa: d.desa?.namaDesa ?? "",
    kodeDesa: d.desa?.kodeDesa ?? "",
    kodeBps: d.desa?.kodeBps ?? "",
    namaKecamatan: d.desa?.namaKecamatan ?? "",
    namaCamat: d.desa?.namaCamat ?? "",
    nipCamat: d.desa?.nipCamat ?? "",
    namaKabupaten: d.desa?.namaKabupaten ?? "",
    namaPropinsi: d.desa?.namaPropinsi ?? "",
    kodePos: d.desa?.kodePos ?? "",
    namaKepalaDesa: d.desa?.namaKepalaDesa ?? "",
    nipKepalaDesa: d.desa?.nipKepalaDesa ?? "",
    visi: d.profil?.visi ?? "",
    misi: d.profil?.misi ?? "",
    sejarah: d.profil?.sejarah ?? "",
    sambutan: d.profil?.sambutan ?? "",
    alamat: d.desa?.alamat ?? "",
    email: d.desa?.email ?? d.kontak?.email ?? "",
    telepon: d.desa?.telepon ?? d.kontak?.telepon ?? "",
    nomorOperator: d.desa?.nomorOperator ?? d.kontak?.nomorOperator ?? "",
    website: d.desa?.website ?? d.kontak?.website ?? "",
    kontakPemberitahuanNama:
      d.desa?.kontakPemberitahuanNama ?? d.kontak?.kontakPemberitahuanNama ?? "",
    kontakPemberitahuanTelepon:
      d.desa?.kontakPemberitahuanTelepon ?? d.kontak?.kontakPemberitahuanTelepon ?? "",
    kontakPemberitahuanJabatan:
      d.desa?.kontakPemberitahuanJabatan ?? d.kontak?.kontakPemberitahuanJabatan ?? "",
    koordinat: d.profil?.koordinat ?? d.kontak?.koordinat ?? "",
    mapTipe: d.profil?.mapTipe ?? TIPE_PETA_DEFAULT,
    luasWilayah: d.profil?.luasWilayah ?? "",
    batasUtara: d.profil?.batasUtara ?? "",
    batasSelatan: d.profil?.batasSelatan ?? "",
    batasTimur: d.profil?.batasTimur ?? "",
    batasBarat: d.profil?.batasBarat ?? "",
    ketinggian: d.profil?.ketinggian ?? "",
    suhuRataRata: d.profil?.suhuRataRata ?? "",
    curahHujan: d.profil?.curahHujan ?? "",
    topografi: d.profil?.topografi ?? "",
    jenisTanah: d.profil?.jenisTanah ?? "",
    sumberDayaAlam: d.profil?.sumberDayaAlam ?? "",
    floraFauna: d.profil?.floraFauna ?? "",
    rawanBencana: d.profil?.rawanBencana ?? "",
    kearifanLokal: d.profil?.kearifanLokal ?? "",
    jenisJaringan: d.profil?.jenisJaringan ?? "",
    providerInternet: d.profil?.providerInternet ?? "",
    cakupanWilayah: d.profil?.cakupanWilayah ?? "",
    kecepatanInternet: d.profil?.kecepatanInternet ?? "",
    aksesPublik: d.profil?.aksesPublik ?? "",
    statusDesa: d.profil?.statusDesa ?? "",
    lembagaAdat: d.profil?.lembagaAdat ?? "",
    strukturAdat: d.profil?.strukturAdat ?? "",
    wilayahAdat: d.profil?.wilayahAdat ?? "",
    peraturanAdat: d.profil?.peraturanAdat ?? "",
    regulasiPenetapanKampungAdat: d.profil?.regulasiPenetapanKampungAdat ?? "",
    dokumenRegulasiPenetapanKampungAdat: d.profil?.dokumenRegulasiPenetapanKampungAdat ?? "",
    batasDesa: d.profil?.batasDesa ?? "",
    tahunBerdiri: d.profil?.tahunBerdiri ? String(d.profil.tahunBerdiri) : "",
    tujuanPembangunan: d.profil?.tujuanPembangunan ?? "",
    nilaiDasar: d.profil?.nilaiDasar ?? "",
    arahKebijakan: d.profil?.arahKebijakan ?? "",
  };
}

/**
 * Client Identitas Desa.
 *
 * Hanya memuat data yang dipakai tab Identitas Desa (desa, profil, sebutan)
 * lewat `/api/identitas-desa`. Pengaturan sebutan, kontak, tampilan, layanan,
 * integrasi, backup, dan preferensi dikelola `PengaturanDesaClient` di menu
 * Pengaturan Desa.
 */
export function IdentitasDesaClient() {
  const [data, setData] = useState<Data | null>(null);
  const [profile, setProfile] = useState<ProfilForm>(profileKosong);
  const [profileTersimpan, setProfileTersimpan] = useState<ProfilForm | null>(null);
  const [sebutan, setSebutan] = useState<Sebutan>(blankSebutan);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const muatIdentitas = useCallback(async (): Promise<Data> => {
    const r = await fetch("/api/identitas-desa", { cache: "no-store" });
    const d = (await r.json()) as Pick<Data, "desa" | "profil" | "sebutan"> & { error?: string };
    if (!r.ok) throw new Error(d.error || "Gagal memuat identitas desa.");
    return { ...dataKosong, desa: d.desa, profil: d.profil, sebutan: d.sebutan };
  }, []);

  function terapkan(d: Data) {
    setData(d);
    const profil = profilDariData(d);
    setProfile(profil);
    setProfileTersimpan(profil);
    setSebutan({ ...blankSebutan, ...d.sebutan });
  }

  async function load() {
    setLoading(true);
    try {
      terapkan(await muatIdentitas());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat identitas desa.");
    } finally {
      setLoading(false);
    }
  }

  // Pemuatan pertama memakai rantai promise agar setState terjadi setelah await,
  // bukan sinkron di dalam effect (react-hooks/set-state-in-effect).
  useEffect(() => {
    let aktif = true;
    muatIdentitas()
      .then((d) => {
        if (aktif) terapkan(d);
      })
      .catch((e: unknown) => {
        if (aktif) setError(e instanceof Error ? e.message : "Gagal memuat identitas desa.");
      })
      .finally(() => {
        if (aktif) setLoading(false);
      });
    return () => {
      aktif = false;
    };
  }, [muatIdentitas]);

  async function save(section: string, payload: unknown): Promise<boolean> {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch("/api/identitas-desa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, data: payload }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Gagal menyimpan.");
      setMessage(d.message || "Perubahan berhasil disimpan.");
      await load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan identitas desa.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function upload(field: MediaField, file?: File, ukuran?: string) {
    if (!file) return;
    // Dimensi logo (paritas OpenSID): kosong = bawaan; 100–400 = persegi.
    let ukuranLogo: number | null = null;
    if (field === "logo" && ukuran !== undefined && ukuran.trim() !== "") {
      const cek = validasiUkuranLogo(ukuran);
      if (!cek.ok) {
        setError(cek.pesan);
        return;
      }
      ukuranLogo = cek.ukuran;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const fd = new FormData();
      fd.set("field", field);
      fd.set("file", file);
      if (ukuranLogo !== null) fd.set("ukuran", String(ukuranLogo));
      const r = await fetch("/api/identitas-desa/media", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Unggah gagal.");
      setMessage(d.message);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unggah gagal.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteMedia(field: MediaField) {
    if (!window.confirm("Hapus file " + field + " yang sedang digunakan?")) return;
    const r = await fetch("/api/identitas-desa/media?field=" + field, { method: "DELETE" });
    const d = await r.json();
    if (!r.ok) {
      setError(d.error || "Gagal menghapus media.");
      return;
    }
    setMessage(d.message);
    await load();
  }

  if (loading) return <div className={styles.loading}>Memuat identitas desa…</div>;
  if (!data)
    return (
      <div className={styles.panel}>
        <p>Identitas desa tidak dapat dimuat.</p>
        <button onClick={() => void load()}>Coba lagi</button>
      </div>
    );

  return (
    <div className={styles.page}>
      <PageHeading
        judul={<>Identitas {sebutan.desa}</>}
        deskripsi={
          <>
            Identitas resmi yang dipakai pada website, surat, dan dokumen{" "}
            {sebutan.desa.toLowerCase()}.
          </>
        }
      />
      {message && (
        <div className={styles.success} role="status">
          ✓ {message}
        </div>
      )}
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}
      <IdentitasDesaView
        data={data}
        profile={profile}
        profileTersimpan={profileTersimpan}
        setProfile={setProfile}
        sebutan={sebutan}
        busy={busy}
        save={save}
        load={load}
        upload={upload}
        deleteMedia={deleteMedia}
      />
    </div>
  );
}
