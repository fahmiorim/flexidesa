/**
 * Kontrak RBAC untuk fitur lain.
 *
 * Navigasi (menu sidebar), persuratan, inventaris, dan konsol platform membaca
 * role/modul lewat berkas ini. Dengan begitu `rbac-repository` tetap milik modul
 * RBAC, sementara pemanggil mendapat kontrak yang stabil.
 */
export {
  findRoleById,
  getRoleById,
  listLevelsByRole,
  listModules,
  listRoles,
  type ModuleRecord,
  type RoleRecord,
} from "../infrastructure/rbac-repository";
