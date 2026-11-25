"use client";

import { inferAdditionalFields, twoFactorClient, usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import type { auth } from "@/lib/auth";

export const authClient = createAuthClient({
  plugins: [
    usernameClient(),
    // Menyelaraskan tipe `session.user` di client dengan additionalFields server
    // (mis. `villageId` dan `residentId`). Import hanya untuk tipe.
    inferAdditionalFields<typeof auth>(),
    twoFactorClient(),
  ],
});

/**
 * URL halaman verifikasi 2FA sesuai metode yang aktif pada akun.
 *
 * Pengalihan dijalankan form masuk lewat `useRouter()`, bukan di callback plugin,
 * agar navigasi memakai router Next.js dan bukan `window.location.assign`.
 */
export function twoFactorPath(methods?: readonly string[]) {
  return `/two-factor?method=${(methods ?? []).includes("totp") ? "totp" : "otp"}`;
}
