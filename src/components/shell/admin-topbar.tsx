"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { PAGE_HEADING_SLOT_ID } from "@/components/shell/page-heading";
import { authClient } from "@/lib/auth-client";

import { PlatformTopbarHead } from "./platform-topbar-head";

export function AdminTopbar({
  name,
  isPlatformAdmin = false,
}: {
  name: string;
  /** Konsol platform memakai judul halamannya sendiri, bukan breadcrumb desa. */
  isPlatformAdmin?: boolean;
}) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDetailsElement>(null);

  // Menu pengguna memakai <details>; tutup saat pengguna mengeklik di luar
  // menu atau menekan Escape agar tidak tertinggal terbuka.
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;

    const tutupJikaDiLuar = (event: PointerEvent) => {
      if (!menu.open) return;
      if (event.target instanceof Node && menu.contains(event.target)) return;
      menu.open = false;
    };
    const tutupDenganEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menu.open) menu.open = false;
    };

    document.addEventListener("pointerdown", tutupJikaDiLuar);
    document.addEventListener("keydown", tutupDenganEscape);
    return () => {
      document.removeEventListener("pointerdown", tutupJikaDiLuar);
      document.removeEventListener("keydown", tutupDenganEscape);
    };
  }, []);

  async function handleSignOut() {
    if (menuRef.current) menuRef.current.open = false;
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      router.replace(isPlatformAdmin ? "/super-admin-login" : "/masuk-admin");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <header className="admin-topbar">
      {isPlatformAdmin ? (
        <PlatformTopbarHead />
      ) : (
        <div className="admin-topbar-heading" id={PAGE_HEADING_SLOT_ID} />
      )}
      <div className="admin-topbar-user">
        {isPlatformAdmin ? (
          <details className="platform-user-menu" ref={menuRef}>
            <summary className="admin-user-chip">
              <span className="avatar" aria-hidden="true">
                {initials || "U"}
              </span>
              <span className="admin-user-text">
                <strong>{name}</strong>
                <span>Platform FlexiDesa</span>
              </span>
              <span aria-hidden="true" className="platform-user-chevron">
                ▾
              </span>
            </summary>
            <div className="platform-user-menu-panel">
              <button
                className="button button-secondary button-block"
                disabled={isSigningOut}
                onClick={handleSignOut}
                type="button"
              >
                {isSigningOut ? "Keluar..." : "Keluar"}
              </button>
            </div>
          </details>
        ) : (
          <details className="admin-user-menu" ref={menuRef}>
            <summary className="admin-user-chip">
              <span className="avatar" aria-hidden="true">
                {initials || "U"}
              </span>
              <span className="admin-user-text">
                <strong>{name}</strong>
                <span>Pengguna aktif</span>
              </span>
              <span aria-hidden="true" className="admin-user-chevron">
                ▾
              </span>
            </summary>
            <div className="admin-user-menu-panel">
              <button
                className="button button-secondary button-block"
                disabled={isSigningOut}
                onClick={handleSignOut}
                type="button"
              >
                {isSigningOut ? "Keluar..." : "Keluar"}
              </button>
            </div>
          </details>
        )}
      </div>
    </header>
  );
}
