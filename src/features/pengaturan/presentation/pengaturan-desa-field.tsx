import type { ReactNode } from "react";

import styles from "./pengaturan-desa.module.css";

export function Field({
  label,
  children,
  required = false,
  hint,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className={styles.field}>
      <span>
        {label}
        {required && <b> *</b>}
      </span>
      {children}
      {hint ? <small className={styles.fieldHintText}>{hint}</small> : null}
    </label>
  );
}
