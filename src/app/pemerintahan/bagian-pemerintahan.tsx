import Image from "next/image";

import type { daftarLembagaPublik } from "@/features/info-desa/pemerintahan/application/publik";
import type { daftarPerangkatPublik } from "@/features/info-desa/publik/application/konten-publik";
import { mediaUrl } from "@/lib/media-url";

import styles from "./pemerintahan.module.css";

export type PerangkatPemerintahan = Awaited<ReturnType<typeof daftarPerangkatPublik>>[number];
export type LembagaPemerintahan = Awaited<ReturnType<typeof daftarLembagaPublik>>[number];

export function namaLengkap(item: {
  gelarDepan: string | null;
  nama: string;
  gelarBelakang: string | null;
}): string {
  return [item.gelarDepan, item.nama, item.gelarBelakang].filter(Boolean).join(" ");
}

export function tugasJabatan(jabatan: string | null): string {
  const nama = (jabatan ?? "").toLocaleLowerCase("id-ID");
  if (nama.includes("kepala desa"))
    return "Memimpin penyelenggaraan pemerintahan, pembangunan, pembinaan kemasyarakatan, dan pelayanan desa.";
  if (nama.includes("sekretaris"))
    return "Mengoordinasikan administrasi pemerintahan, tata usaha, perencanaan, dan pelaporan desa.";
  if (nama.includes("keuangan"))
    return "Membantu pengelolaan administrasi keuangan desa serta penatausahaan dan pelaporan.";
  if (nama.includes("perencanaan"))
    return "Mendukung penyusunan rencana program dan kegiatan pembangunan desa.";
  if (nama.includes("pemerintahan"))
    return "Membantu pelaksanaan administrasi pemerintahan dan urusan kewilayahan desa.";
  if (nama.includes("kesejahteraan"))
    return "Mendukung pelaksanaan kegiatan pembangunan dan pemberdayaan masyarakat.";
  if (nama.includes("pelayanan"))
    return "Mendukung pelayanan administrasi dan kebutuhan masyarakat desa.";
  if (nama.includes("umum") || nama.includes("tata usaha"))
    return "Mendukung administrasi umum, tata usaha, persuratan, dan kearsipan.";
  return "Menjalankan tugas sesuai jabatan dan ketentuan penyelenggaraan pemerintahan desa.";
}

export const fungsiUtama = [
  {
    title: "Kepala Desa",
    icon: "⚑",
    iconClass: styles.functionIcon_purple,
    text: "Memimpin penyelenggaraan pemerintahan desa dan bertanggung jawab atas pelaksanaan pembangunan serta pelayanan masyarakat.",
  },
  {
    title: "Sekretaris Desa",
    icon: "▱",
    iconClass: styles.functionIcon_blue,
    text: "Mengoordinasikan administrasi pemerintahan desa, tata usaha, perencanaan, dan pelaporan.",
  },
  {
    title: "Kaur",
    icon: "♧",
    iconClass: styles.functionIcon_green,
    text: "Membantu urusan administrasi sesuai bidang, termasuk tata usaha, keuangan, dan perencanaan.",
  },
  {
    title: "Kasi",
    icon: "⚙",
    iconClass: styles.functionIcon_orange,
    text: "Membantu pelaksanaan urusan pemerintahan, kesejahteraan, dan pelayanan masyarakat.",
  },
  {
    title: "BPD",
    icon: "♧",
    iconClass: styles.functionIcon_purple,
    text: "Menampung dan menyalurkan aspirasi masyarakat serta menjalankan fungsi permusyawaratan desa.",
  },
];

export function FotoPerangkat({
  item,
  desaId,
  className,
}: {
  item: PerangkatPemerintahan;
  desaId: number;
  className: string | undefined;
}) {
  const src = mediaUrl(item.foto, desaId);
  const name = namaLengkap(item);
  return (
    <div className={className}>
      {src ? (
        <Image
          src={src}
          alt={`Foto ${name}`}
          fill
          unoptimized
          sizes="(max-width:700px) 30vw, 100px"
        />
      ) : (
        <span>{item.nama.slice(0, 1).toUpperCase()}</span>
      )}
    </div>
  );
}
