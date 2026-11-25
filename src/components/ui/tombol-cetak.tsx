"use client";

export function TombolCetak() {
  return (
    <button className="button button-primary" type="button" onClick={() => window.print()}>
      <svg
        aria-hidden
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.9}
      >
        <path d="M7 9V4h10v5" />
        <path d="M7 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
        <path d="M7 14h10v6H7z" />
      </svg>
      Cetak
    </button>
  );
}
