import type { ReactNode } from "react";

import type {
  PendudukDTO,
  PendudukReferenceData,
  ReferenceOption,
} from "@/features/kependudukan/penduduk/domain/penduduk";

/** Props yang dibutuhkan setiap bagian form penduduk. */
export interface BagianPendudukProps {
  penduduk?: PendudukDTO;
  references: PendudukReferenceData;
  galat: (name: string) => string | undefined;
  tidakValid: (name: string) => boolean;
}

export function OpsiKatalog({ options }: { options: ReferenceOption[] }) {
  return (
    <>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
    </>
  );
}

export function OpsiLabel({ options }: { options: PendudukReferenceData["families"] }) {
  return (
    <>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </>
  );
}

export function OpsiEnum<T extends string>({
  values,
  labels,
}: {
  values: readonly T[];
  labels: Readonly<Record<T, string>>;
}) {
  return (
    <>
      {values.map((value) => (
        <option key={value} value={value}>
          {labels[value]}
        </option>
      ))}
    </>
  );
}

export function Bagian({
  nomor,
  id,
  judul,
  keterangan,
  children,
}: {
  nomor: string;
  id: string;
  judul: string;
  keterangan: string;
  children: ReactNode;
}) {
  return (
    <section className="platform-card penduduk-form-card" id={id}>
      <header className="penduduk-form-section-head">
        <span aria-hidden="true" className="penduduk-form-step">
          {nomor}
        </span>
        <div>
          <h2>{judul}</h2>
          <p>{keterangan}</p>
        </div>
      </header>
      <div className="platform-card-body">
        <div className="ui-form-grid">{children}</div>
      </div>
    </section>
  );
}
