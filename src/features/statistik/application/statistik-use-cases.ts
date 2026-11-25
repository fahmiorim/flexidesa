import "server-only";

import {
  type StatistikBantuanParams,
  type StatistikBantuanResult,
} from "@/features/statistik/domain/statistik";
import { getStatistikBantuan } from "@/features/statistik/infrastructure/statistik-repository";

export async function getStatistikBantuanUseCase(
  villageId: number,
  params: StatistikBantuanParams,
): Promise<StatistikBantuanResult> {
  return getStatistikBantuan(villageId, params);
}
