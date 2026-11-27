"use client";

import { useState } from "react";

import { ButtonLink } from "@/components/ui/button-link";

function denganSensor(href: string, sensor: boolean): string {
  if (!sensor) return href;
  return `${href}${href.includes("?") ? "&" : "?"}sensor=1`;
}

export function MenuCetakDpt({
  cetakHref,
  unduhHref,
  exportHref,
}: {
  cetakHref: string;
  unduhHref: string;
  exportHref: string;
}) {
  const [sensor, setSensor] = useState(false);

  return (
    <div className="dpt-export-menu">
      <details>
        <summary className="button button-secondary">Cetak &amp; unduh</summary>
        <div className="dpt-export-panel">
          <label className="keluarga-toolbar-menu-option">
            <input
              checked={sensor}
              onChange={(event) => setSensor(event.target.checked)}
              type="checkbox"
            />
            <span>Sensor NIK/No. KK</span>
          </label>
          <ButtonLink
            variant="secondary"
            className="keluarga-toolbar-menu-item"
            href={denganSensor(cetakHref, sensor)}
            rel="noopener noreferrer"
            target="_blank"
          >
            Cetak PDF
          </ButtonLink>
          <ButtonLink
            variant="secondary"
            className="keluarga-toolbar-menu-item"
            href={denganSensor(unduhHref, sensor)}
          >
            Unduh XLSX
          </ButtonLink>
          <div className="keluarga-toolbar-menu-divider" />
          <ButtonLink variant="secondary" className="keluarga-toolbar-menu-item" href={exportHref}>
            Ekspor CSV
          </ButtonLink>
        </div>
      </details>
    </div>
  );
}
