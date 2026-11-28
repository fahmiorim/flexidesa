import type { ReactNode } from "react";

import { Button } from "./button";
import { ButtonLink } from "./button-link";
import { FormField } from "./form-field";

interface FilterOpsi {
  name: string;
  label: string;
  options: readonly { value: string; label: string }[];
  defaultValue?: string;
  /** Label aksesibel; bawaan memakai `label`. */
  ariaLabel?: string;
}

/**
 * Bilah pencarian + filter bersama untuk form GET server-side.
 *
 * Field di dalam memakai `FormField`, tombol memakai `Button`/`ButtonLink`.
 * Halaman tidak boleh menulis `<input>`/`<select>` pencarian sendiri.
 */
export function SearchToolbar({
  action,
  search,
  filters = [],
  submitLabel = "Terapkan",
  resetHref,
  children,
}: {
  action: string;
  search?: {
    name: string;
    label: string;
    placeholder?: string;
    defaultValue?: string;
    maxLength?: number;
  };
  filters?: readonly FilterOpsi[];
  submitLabel?: string;
  resetHref?: string;
  children?: ReactNode;
}) {
  return (
    <form action={action} className="ui-toolbar" method="get" role="search">
      {search ? (
        <FormField
          className="ui-toolbar-search"
          containerClassName="ui-toolbar-search"
          defaultValue={search.defaultValue}
          id={search.name}
          label={search.label}
          maxLength={search.maxLength}
          name={search.name}
          placeholder={search.placeholder}
          type="search"
        />
      ) : null}
      {filters.map((filter) => (
        <FormField
          key={filter.name}
          className="ui-toolbar-filter"
          containerClassName="ui-toolbar-filter"
          defaultValue={filter.defaultValue}
          id={filter.name}
          kind="select"
          label={filter.label}
          name={filter.name}
          options={filter.options}
        />
      ))}
      {children}
      <div className="ui-toolbar-actions">
        <Button type="submit" variant="primary">
          {submitLabel}
        </Button>
        {resetHref ? (
          <ButtonLink href={resetHref} variant="secondary">
            Bersihkan
          </ButtonLink>
        ) : null}
      </div>
    </form>
  );
}
