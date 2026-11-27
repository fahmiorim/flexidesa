export const STATISTIK_BANTUAN_KINDS = ["program", "sasaran"] as const;

export type StatistikBantuanKind = (typeof STATISTIK_BANTUAN_KINDS)[number];

export const STATISTIK_BANTUAN_LABELS: Record<StatistikBantuanKind, string> = {
  program: "Program Bantuan",
  sasaran: "Sasaran Bantuan",
};

export interface StatistikBantuanRow {
  label: string;
  total: number;
  male: number;
  female: number;
  percentage: number;
}

export interface StatistikBantuanSummary {
  total: number;
  male: number;
  female: number;
}

export interface StatistikBantuanParams {
  kind: StatistikBantuanKind;
  programSlug?: string;
  sasaran?: number;
  dusun?: string;
  rw?: string;
  rt?: string;
  periodeMulai?: string;
  periodeAkhir?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface StatistikBantuanResult {
  rows: StatistikBantuanRow[];
  summary: StatistikBantuanSummary;
  page: number;
  perPage: number;
  pageCount: number;
}
