/**
 * Kontrak akun pengguna untuk fitur RBAC.
 *
 * Pemetaan grup akses memerlukan jumlah pengguna per role agar role yang masih
 * dipakai tidak bisa dihapus. Query itu milik modul Pengguna, jadi RBAC
 * memanggilnya lewat kontrak ini.
 */
export { countPenggunaDenganRole } from "../infrastructure/pengguna-repository";
