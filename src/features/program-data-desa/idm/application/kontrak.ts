/**
 * Kontrak baca/tulis capaian IDM untuk fitur lain.
 *
 * Status desa menggabungkan identitas, IDM, dan SDGs; kelompok data itu memakai
 * kontrak ini agar repository IDM tetap milik modul IDM.
 */
export {
  gantiIdmTahun,
  getRingkasanIdm,
  listIdm,
  listTahunIdm,
  simpanRingkasanIdm,
} from "../infrastructure/idm-repository";
