"use client";

import Link from "next/link";
import type { ReactNode } from "react";

interface TabItem<T extends string = string> {
  id: T;
  label: ReactNode;
  /** Bila ada, tab dirender sebagai tautan; bila tidak, sebagai tombol. */
  href?: string;
  count?: number;
}

/**
 * Tab bersama.
 *
 * Mendukung dua mode: tautan (`href` per item, untuk tab server-side via
 * query) atau klik (`onSelect`, untuk tab client-side). Halaman tidak boleh
 * menulis tab sendiri.
 */
export function Tabs<T extends string>({
  items,
  active,
  onSelect,
  label = "Tab",
}: {
  items: readonly TabItem<T>[];
  active: T;
  onSelect?: (id: T) => void;
  label?: string;
}) {
  return (
    <div aria-label={label} className="ui-tabs" role="group">
      {items.map((item) => {
        const isActive = item.id === active;
        const className = `ui-tab${isActive ? " is-active" : ""}`;
        const isi = (
          <>
            <span>{item.label}</span>
            {typeof item.count === "number" && item.count > 0 ? (
              <span className="ui-tab-count">{item.count}</span>
            ) : null}
          </>
        );
        if (item.href) {
          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={className}
              href={item.href}
              key={item.id}
            >
              {isi}
            </Link>
          );
        }
        return (
          <button
            aria-pressed={isActive}
            className={className}
            key={item.id}
            onClick={() => onSelect?.(item.id)}
            type="button"
          >
            {isi}
          </button>
        );
      })}
    </div>
  );
}
