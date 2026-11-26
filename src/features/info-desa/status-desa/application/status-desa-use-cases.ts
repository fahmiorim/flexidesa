import "server-only";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { bacaIdentitasDesa } from "@/features/info-desa/identitas-desa/application/kontrak";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import {
  gantiIdmTahun,
  getRingkasanIdm,
  listIdm,
  listTahunIdm,
  simpanRingkasanIdm,
} from "@/features/program-data-desa/idm/application/kontrak";
import { IDM_RESOURCE } from "@/features/program-data-desa/idm/domain/idm";
import { requirePermission } from "@/lib/dal";
import { forbidden, validationError } from "@/lib/errors";

import { ambilIdmKemendesa } from "../infrastructure/kemendesa-idm-client";

/**
 * Data dasbor Status Desa.
 *
 * Status desa memakai data IDM yang sudah tersimpan, bukan sumber terpisah,
 * sehingga angka pada dasbor selalu sama dengan halaman pantau IDM. Izin yang
 * diperiksa adalah izin modul `status-desa`; tombol sinkronisasi hanya muncul
 * bila pengguna juga berhak mengubah data IDM.
 */
export async function getStatusDesaData(tahunDiminta?: number) {
  const user = await requirePermission(RESOURCES.statusDesa, "read");
  const villageId = await resolveVillageId(user);

  const [tahunIdm, identitas] = await Promise.all([
    listTahunIdm(villageId),
    bacaIdentitasDesa(villageId),
  ]);

  const tahunTersedia = [...new Set(tahunIdm)].sort((a, b) => b - a);
  const tahun =
    tahunDiminta && Number.isInteger(tahunDiminta) && tahunDiminta > 2000
      ? tahunDiminta
      : (tahunTersedia[0] ?? new Date().getFullYear());

  const [indikator, ringkasan] = await Promise.all([
    listIdm(villageId, tahun),
    getRingkasanIdm(villageId, tahun),
  ]);

  return {
    tahun,
    tahunTersedia,
    identitas,
    indikator,
    ringkasan,
    akses: {
      // Tautan ke halaman pantau IDM hanya butuh izin baca modulnya.
      idmBaca: hasPermission(user.permissions, IDM_RESOURCE, "read"),
      sinkron:
        hasPermission(user.permissions, RESOURCES.statusDesa, "update") &&
        hasPermission(user.permissions, IDM_RESOURCE, "update"),
    },
  };
}

/** Format angka API menjadi nilai desimal kolom database. */
function desimal(nilai: number | null): string | null {
  return nilai === null ? null : nilai.toFixed(4);
}

/**
 * Tarik data IDM dari API Kemendesa lalu ganti indikator satu tahun.
 *
 * Ringkasan sumber (skor minimal, target status, skor API) disimpan terpisah
 * karena tidak dapat dihitung dari indikator. Izin yang diperlukan: mengubah
 * Status Desa sekaligus mengubah data IDM, agar sinkronisasi tidak menjadi
 * jalur menulis data IDM tanpa izin modulnya.
 */
export async function sinkronkanIdmKemendesa(tahun: number) {
  const user = await requirePermission(RESOURCES.statusDesa, "update");
  if (!hasPermission(user.permissions, IDM_RESOURCE, "update")) {
    throw forbidden("Anda tidak memiliki izin mengubah data IDM.");
  }

  const villageId = await resolveVillageId(user);
  const identitas = await bacaIdentitasDesa(villageId);
  if (!identitas?.kodeDesa) {
    throw validationError("Kode desa belum diisi pada Identitas Desa.");
  }

  const hasil = await ambilIdmKemendesa(identitas.kodeDesa, tahun);
  await gantiIdmTahun(villageId, tahun, hasil.indikator);
  await simpanRingkasanIdm(villageId, {
    tahun,
    skorMinimal: desimal(hasil.ringkasan.skorMinimal),
    targetStatus: hasil.ringkasan.targetStatus,
    statusApi: hasil.ringkasan.statusApi,
    skorApi: desimal(hasil.ringkasan.skorApi),
    penambahan: desimal(hasil.ringkasan.penambahan),
  });

  return { jumlah: hasil.indikator.length };
}
