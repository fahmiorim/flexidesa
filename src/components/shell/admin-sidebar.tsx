"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { MenuNode } from "@/features/navigation/application/build-menu";
import {
  grupMenuPlatform,
  menuPlatformAktif,
  submenuPlatformAktif,
} from "@/features/navigation/domain/menu-platform";
import {
  pathMenu,
  susunMenuTampil,
  type BarisMenu,
} from "@/features/navigation/domain/menu-tampil";

/**
 * Menu tetap aktif pada halaman turunannya, mis. /penduduk/baru.
 *
 * Bila menu membawa query (mis. tiga submenu Buku Administrasi memakai path
 * yang sama dengan `?golongan=` berbeda), query itu juga harus cocok agar
 * hanya submenu yang sedang dibuka yang tersorot.
 */
function ruteMenuAktif(url: string | null, pathname: string, query: string): boolean {
  if (!url) return false;
  const [alamat, queryMenu] = url.split("?", 2);
  const path = pathMenu(alamat);
  const current = pathMenu(pathname);
  if (path === null || current === null) return false;
  if (current !== path && !current.startsWith(`${path}/`)) return false;
  if (!queryMenu) return true;

  const diminta = new URLSearchParams(queryMenu);
  const sekarang = new URLSearchParams(query);
  return [...diminta].every(([kunci, nilai]) => sekarang.get(kunci) === nilai);
}

export function AdminSidebar({
  menu,
  canReadDashboard,
  isPlatformAdmin = false,
  villageName = "",
}: {
  menu: readonly MenuNode[];
  canReadDashboard: boolean;
  isPlatformAdmin?: boolean;
  /** Nama tenant desa yang ditampilkan sebagai identitas di kepala sidebar. */
  villageName?: string;
}) {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const [open, setOpen] = useState(false);
  // Submenu platform mengikuti pola grup desa: status disimpan bersama pathname
  // asalnya, sehingga pindah halaman menutup submenu yang dibuka manual dan
  // hanya submenu yang memuat halaman aktif terbuka otomatis.
  const [submenuPlatform, setSubmenuPlatform] = useState<{
    path: string;
    buka: Record<string, boolean>;
  }>({ path: pathname, buka: {} });
  // Status buka/tutup grup disimpan bersama pathname asalnya. Saat pengguna
  // pindah halaman, data lama tidak berlaku lagi sehingga semua grup yang
  // dibuka manual tertutup; grup yang memuat halaman aktif terbuka otomatis.
  const [grupTerbuka, setGrupTerbuka] = useState<{
    path: string;
    buka: Record<string, boolean>;
  }>({ path: pathname, buka: {} });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const homeHref = isPlatformAdmin ? "/super-admin" : "/beranda";
  const baris = susunMenuTampil(menu).filter((row) => pathMenu(row.url) !== homeHref);
  const bukaGrup = grupTerbuka.path === pathname ? grupTerbuka.buka : {};
  const bukaSubmenuPlatform = submenuPlatform.path === pathname ? submenuPlatform.buka : {};

  /** Grup dianggap aktif bila salah satu anaknya sedang dibuka. */
  const grupAktif = (row: BarisMenu): boolean =>
    row.items.some((item) => ruteMenuAktif(item.url, pathname, query));

  function closeDrawer() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  useEffect(() => {
    const drawer = drawerRef.current;
    if (!open || !drawer) return;

    const ambilFocusable = () =>
      Array.from(drawer.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")).filter(
        (element) => element.getClientRects().length > 0,
      );

    ambilFocusable()[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = ambilFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement;
      const diLuarDrawer = active === null || !drawerRef.current?.contains(active);
      if (event.shiftKey && (diLuarDrawer || active === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (diLuarDrawer || active === last)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <button
        className="mobile-menu-button button button-secondary"
        type="button"
        ref={triggerRef}
        aria-label={open ? "Tutup navigasi" : "Buka navigasi"}
        aria-expanded={open}
        aria-controls="admin-sidebar-navigation"
        onClick={() => setOpen((value) => !value)}
      >
        ☰
      </button>
      {open ? (
        <div className="admin-drawer-backdrop" aria-hidden="true" onClick={closeDrawer} />
      ) : null}
      <aside
        className="admin-sidebar"
        data-open={open}
        data-desa={isPlatformAdmin ? undefined : "true"}
        data-platform={isPlatformAdmin ? "true" : undefined}
        id="admin-sidebar-navigation"
        ref={drawerRef}
      >
        <Link className="admin-sidebar-brand" href={homeHref} onClick={() => setOpen(false)}>
          <Image
            className="admin-brand-logo"
            src="/images/logo.png"
            alt=""
            width={44}
            height={44}
            priority
            unoptimized
          />
          <span className="admin-brand-text">
            {isPlatformAdmin ? (
              <strong>
                FlexiDesa<span className="admin-brand-domain">.id</span>
              </strong>
            ) : (
              <strong>{villageName || "Desa"}</strong>
            )}
            <span>{isPlatformAdmin ? "Konsol Super Admin" : "Admin Desa"}</span>
          </span>
        </Link>
        <nav className="admin-nav" aria-label="Navigasi administrasi">
          {isPlatformAdmin
            ? grupMenuPlatform().map((kelompok) => (
                <div className="platform-nav-group" key={kelompok.grup}>
                  {kelompok.item.map((item) => {
                    const aktif = menuPlatformAktif(item.href, pathname);

                    if (!item.submenu?.length) {
                      return (
                        <Link
                          className="admin-nav-link"
                          href={item.href}
                          key={item.href}
                          aria-current={aktif ? "page" : undefined}
                          onClick={() => setOpen(false)}
                        >
                          <span className="admin-nav-icon" aria-hidden="true">
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </Link>
                      );
                    }

                    const idSubmenu = `platform-submenu-${item.href.replace(/[^a-z0-9]+/gi, "-")}`;
                    const terbuka = bukaSubmenuPlatform[item.href] ?? aktif;

                    return (
                      <div className="platform-nav-item" key={item.href}>
                        <button
                          aria-controls={idSubmenu}
                          aria-expanded={terbuka}
                          className="admin-nav-link platform-nav-parent"
                          data-aktif={aktif ? "true" : undefined}
                          onClick={() =>
                            setSubmenuPlatform((sebelumnya) => {
                              const buka = sebelumnya.path === pathname ? sebelumnya.buka : {};
                              return { path: pathname, buka: { ...buka, [item.href]: !terbuka } };
                            })
                          }
                          type="button"
                        >
                          <span className="admin-nav-icon" aria-hidden="true">
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                          <span aria-hidden="true" className="platform-nav-caret">
                            ⌄
                          </span>
                        </button>
                        {terbuka ? (
                          <div className="platform-nav-sub" id={idSubmenu}>
                            {item.submenu.map((sub) => (
                              <Link
                                aria-current={
                                  submenuPlatformAktif(item.submenu ?? [], pathname) === sub.href
                                    ? "page"
                                    : undefined
                                }
                                className="platform-nav-sublink"
                                href={sub.href}
                                key={sub.href}
                                onClick={() => setOpen(false)}
                              >
                                {sub.label}
                              </Link>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ))
            : null}

          {!isPlatformAdmin && canReadDashboard ? (
            <Link
              className="admin-nav-link"
              href="/beranda"
              aria-current={pathname === "/beranda" ? "page" : undefined}
              onClick={() => {
                setOpen(false);
                setGrupTerbuka({ path: pathname, buka: {} });
              }}
            >
              <span className="admin-nav-icon" aria-hidden="true">
                ⌂
              </span>
              <span>Beranda</span>
            </Link>
          ) : null}

          {isPlatformAdmin
            ? null
            : baris.map((row, index) => {
                const key = `${row.kind}-${row.label}-${index}`;
                if (row.kind === "grup") {
                  const aktif = grupAktif(row);
                  const terbuka = bukaGrup[row.slug] ?? aktif;
                  const idSubmenu = `admin-submenu-${row.slug}`;

                  return (
                    <div className="admin-nav-group" key={key}>
                      <button
                        aria-controls={idSubmenu}
                        aria-expanded={terbuka}
                        className="admin-nav-link admin-nav-parent"
                        data-aktif={aktif ? "true" : undefined}
                        onClick={() =>
                          setGrupTerbuka((sebelumnya) => {
                            const buka = sebelumnya.path === pathname ? sebelumnya.buka : {};
                            return { path: pathname, buka: { ...buka, [row.slug]: !terbuka } };
                          })
                        }
                        type="button"
                      >
                        <span className="admin-nav-icon" aria-hidden="true">
                          {row.icon ?? "▤"}
                        </span>
                        <span>{row.label}</span>
                        <span aria-hidden="true" className="admin-nav-caret">
                          ⌄
                        </span>
                      </button>
                      {terbuka ? (
                        <div className="admin-nav-sub" id={idSubmenu}>
                          {row.items.map((item) => {
                            const kunciAnak = `sub-${item.slug}`;

                            if (item.tersedia && item.url) {
                              return (
                                <Link
                                  className="admin-nav-sublink"
                                  href={item.url}
                                  key={kunciAnak}
                                  aria-current={
                                    ruteMenuAktif(item.url, pathname, query) ? "page" : undefined
                                  }
                                  onClick={() => setOpen(false)}
                                >
                                  {item.label}
                                </Link>
                              );
                            }

                            return (
                              <span
                                className="admin-nav-sublink admin-nav-pending"
                                key={kunciAnak}
                                aria-disabled="true"
                              >
                                {item.label}
                                <span className="admin-nav-badge">Segera</span>
                              </span>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                }
                if (row.tersedia && row.url) {
                  const aktif = ruteMenuAktif(row.url, pathname, query);
                  return (
                    <Link
                      className="admin-nav-link"
                      href={row.url}
                      key={key}
                      aria-current={aktif ? "page" : undefined}
                      onClick={() => setOpen(false)}
                    >
                      <span className="admin-nav-icon" aria-hidden="true">
                        {row.icon ?? "·"}
                      </span>
                      <span>{row.label}</span>
                    </Link>
                  );
                }
                return (
                  <span className="admin-nav-link admin-nav-pending" key={key} aria-disabled="true">
                    <span className="admin-nav-icon" aria-hidden="true">
                      ·
                    </span>
                    <span>{row.label}</span>
                    <span className="admin-nav-badge">Segera</span>
                  </span>
                );
              })}
        </nav>
        {isPlatformAdmin ? (
          <div className="platform-sidebar-footer">
            <Image
              src="/images/platform-sidebar-landscape.svg"
              alt=""
              width={220}
              height={92}
              unoptimized
            />
            <strong>
              FlexiDesa<span className="admin-brand-domain">.id</span>
            </strong>
            <span>Platform Desa Terpadu</span>
            <span className="platform-sidebar-role">Super Admin</span>
          </div>
        ) : (
          <>
            <div className="admin-sidebar-footer">
              Sistem Informasi Desa
              <br />
              {villageName || "Pemerintah Desa"}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
