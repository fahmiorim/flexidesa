import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

interface FieldBase {
  label: string;
  error?: string;
  helpText?: string;
  className?: string;
  /** Kelas pada wadah field, mis. untuk bentang grid. */
  containerClassName?: string;
  children?: ReactNode;
}

type FormFieldProps = FieldBase &
  (
    | (InputHTMLAttributes<HTMLInputElement> & {
        kind?: "input" | "file" | "checkbox";
        options?: never;
        rows?: never;
      })
    | (SelectHTMLAttributes<HTMLSelectElement> & {
        kind: "select";
        options: readonly { value: string; label: string; disabled?: boolean }[];
        rows?: never;
      })
    | (TextareaHTMLAttributes<HTMLTextAreaElement> & {
        kind: "textarea";
        options?: never;
        rows?: number;
      })
  );

export function FieldShell({
  label,
  error,
  helpText,
  id,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  helpText?: string;
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  const errorId = error && id ? `${id}-error` : undefined;
  const helpId = helpText && id ? `${id}-help` : undefined;
  return (
    <div className={`form-field${className ? ` ${className}` : ""}`}>
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      {children}
      {helpText ? (
        <span className="form-help" id={helpId}>
          {helpText}
        </span>
      ) : null}
      {error ? (
        <span className="form-help" id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Field form bersama untuk input, select, dan textarea. Label, bantuan,
 * dan galat diikat lewat `id` yang sama di semua jenis field.
 */
export function FormField(props: FormFieldProps) {
  const {
    label,
    error,
    helpText,
    kind = "input",
    id,
    name,
    className,
    containerClassName,
    options,
    ...rest
  } = props;
  const inputId = id ?? name;

  if (kind === "checkbox") {
    return (
      <div className={`form-field${containerClassName ? ` ${containerClassName}` : ""}`}>
        <label className="form-check" htmlFor={inputId}>
          <input
            id={inputId}
            name={name}
            type="checkbox"
            {...(rest as InputHTMLAttributes<HTMLInputElement>)}
          />
          <span>{label}</span>
        </label>
        {helpText ? <span className="form-help">{helpText}</span> : null}
        {error ? (
          <span className="form-help" role="alert">
            {error}
          </span>
        ) : null}
      </div>
    );
  }

  const describedBy = [
    helpText && inputId ? `${inputId}-help` : undefined,
    error && inputId ? `${inputId}-error` : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  const shared = {
    id: inputId,
    name,
    className: `form-input${className ? ` ${className}` : ""}`,
    "aria-invalid": Boolean(error) || undefined,
    "aria-describedby": describedBy || undefined,
  };

  return (
    <FieldShell
      label={label}
      error={error}
      helpText={helpText}
      id={inputId}
      className={containerClassName}
    >
      {kind === "select" ? (
        <select {...shared} {...(rest as SelectHTMLAttributes<HTMLSelectElement>)}>
          {(options ?? []).map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      ) : kind === "textarea" ? (
        <textarea {...shared} {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)} />
      ) : (
        <input
          {...shared}
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
          type={
            kind === "file"
              ? "file"
              : ((rest as InputHTMLAttributes<HTMLInputElement>).type ?? "text")
          }
        />
      )}
    </FieldShell>
  );
}
