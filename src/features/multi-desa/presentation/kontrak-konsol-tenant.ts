import type { StatusRetensi } from "@/features/multi-desa/domain/lifecycle-tenant";
import type { HasilEkspor } from "@/features/multi-desa/infrastructure/lifecycle-tenant-repository";
import type { ActionState } from "@/lib/action-state";

/**
 * Kontrak data dan Server Action Konsol Tenant.
 *
 * Dipisah dari komponen agar modul domain, panel lifecycle, dan tabel dapat
 * berbagi tipe tanpa saling mengimpor komponen.
 */

export interface DesaKonsolRow {
  id: number;
  name: string | null;
  slug: string | null;
  code: string | null;
  domain: string | null;
  district: string | null;
  active: boolean;
  kuotaMediaMb: number | null;
  tema: string | null;
  temaNama: string | null;
  temaVersi: string | null;
  pengguna: number;
  penduduk: number;
  jenisSurat: number;
  createdAt: Date;
  nonaktifSejak: Date | null;
  purgedAt: Date | null;
  adaEksporBerlaku: boolean;
  statusRetensi: StatusRetensi;
  hariMenujuPurge: number | null;
}

export interface DomainKonsolRow {
  id: number;
  villageId: number;
  domain: string;
  isPrimary: boolean;
}

export interface AksiKonsol {
  status: (
    state: ActionState<{ active: boolean }>,
    formData: FormData,
  ) => Promise<ActionState<{ active: boolean }>>;
  kuota: (
    state: ActionState<{ kuotaMediaMb: number | null }>,
    formData: FormData,
  ) => Promise<ActionState<{ kuotaMediaMb: number | null }>>;
  reset: (
    state: ActionState<{ username: string | null; email: string; sandiSementara: string }>,
    formData: FormData,
  ) => Promise<ActionState<{ username: string | null; email: string; sandiSementara: string }>>;
  ekspor: (
    state: ActionState<HasilEkspor>,
    formData: FormData,
  ) => Promise<ActionState<HasilEkspor>>;
  purge: (
    state: ActionState<{
      jumlahBarisDihapus: number;
      tabelDiproses: number;
      mediaDihapus: boolean;
    }>,
    formData: FormData,
  ) => Promise<
    ActionState<{ jumlahBarisDihapus: number; tabelDiproses: number; mediaDihapus: boolean }>
  >;
  tambahDomain: (
    state: ActionState<{ id: number }>,
    formData: FormData,
  ) => Promise<ActionState<{ id: number }>>;
  hapusDomain: (state: ActionState<null>, formData: FormData) => Promise<ActionState<null>>;
  jadikanUtama: (state: ActionState<null>, formData: FormData) => Promise<ActionState<null>>;
}
