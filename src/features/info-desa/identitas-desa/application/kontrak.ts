/**
 * Kontrak baca identitas/profil/sebutan desa untuk fitur lain.
 *
 * Pengaturan desa dan status desa butuh nilai tersimpan (profil, sebutan, kop
 * surat) tanpa memanggil `identitas-desa-repository` langsung. Operasi tulis
 * tetap lewat use case pemiliknya yang memeriksa izin.
 */
export {
  bacaIdentitasDesa,
  bacaProfilDesa,
  bacaSebutanDesa,
  sinkronkanKepalaDesa,
} from "../infrastructure/identitas-desa-repository";
