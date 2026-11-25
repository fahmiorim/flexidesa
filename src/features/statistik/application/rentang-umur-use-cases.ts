import { RESOURCES } from "@/features/rbac/domain/resources";
import {
  rentangUmurFormSchema,
  type RentangUmurDTO,
  type RentangUmurFormInput,
} from "@/features/statistik/domain/rentang-umur";
import {
  deleteRentangUmur,
  insertRentangUmur,
  listRentangUmurRows,
  updateRentangUmur,
} from "@/features/statistik/infrastructure/rentang-umur-repository";
import { requirePermission } from "@/lib/dal";

export interface ListRentangUmurParams {
  villageId: number;
  search?: string;
}

export async function listRentangUmurUseCase(
  params: ListRentangUmurParams,
): Promise<RentangUmurDTO[]> {
  await requirePermission(RESOURCES.penduduk, "read");

  return listRentangUmurRows(params);
}

export async function createRentangUmurUseCase(
  villageId: number,
  input: RentangUmurFormInput,
): Promise<{ id: number }> {
  await requirePermission(RESOURCES.penduduk, "update");

  const validated = rentangUmurFormSchema.parse(input);

  const id = await insertRentangUmur(villageId, {
    nama: validated.nama,
    dari: validated.dari,
    sampai: validated.sampai ?? null,
  });

  return { id };
}

export async function updateRentangUmurUseCase(
  villageId: number,
  id: number,
  input: RentangUmurFormInput,
): Promise<void> {
  await requirePermission(RESOURCES.penduduk, "update");

  const validated = rentangUmurFormSchema.parse(input);

  await updateRentangUmur(villageId, id, {
    nama: validated.nama,
    dari: validated.dari,
    sampai: validated.sampai ?? null,
  });
}

export async function deleteRentangUmurUseCase(villageId: number, id: number): Promise<void> {
  await requirePermission(RESOURCES.penduduk, "delete");

  await deleteRentangUmur(villageId, id);
}
