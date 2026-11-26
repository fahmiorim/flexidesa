/**
 * Kontrak baca wilayah untuk fitur lain.
 *
 * Fitur di luar `wilayah` memakai berkas ini, bukan repository langsung, agar
 * perubahan penyimpanan/query wilayah tidak menjalar ke pemanggil dan batas
 * kepemilikan data tetap jelas. Fungsi di sini murni baca dan tetap
 * tenant-scoped seperti repository-nya.
 */
export {
  findWilayahById,
  listWilayahOptions,
  pastikanWilayah,
} from "../infrastructure/wilayah-repository";
