/**
 * Kontrak baca audit log untuk fitur lain.
 *
 * Persuratan mencatat riwayat verifikasi/penerbitan, dan konsol platform
 * menampilkan audit lintas desa. Keduanya memakai kontrak ini alih-alih
 * mengimpor repository audit langsung.
 */
export {
  listAuditLogs,
  listAuditLogsLintasDesa,
  type AuditLogPlatformPage,
  type AuditLogPlatformRow,
} from "../infrastructure/audit-repository";
