"use client";

import { useState } from "react";

import type { FaqItem } from "@/features/info-desa/publik/domain/faq";

import styles from "./kontak.module.css";

export function KontakFaq({ items }: { items: FaqItem[] }) {
  const [active, setActive] = useState(0);
  return (
    <div className={styles.faqList}>
      {items.map(({ q, a }, i) => (
        <article className={styles.faqItem} key={q}>
          <button
            type="button"
            aria-expanded={active === i}
            onClick={() => setActive(active === i ? -1 : i)}
          >
            {q}
            <span>{active === i ? "⌃" : "⌄"}</span>
          </button>
          {active === i ? <p>{a}</p> : null}
        </article>
      ))}
    </div>
  );
}
