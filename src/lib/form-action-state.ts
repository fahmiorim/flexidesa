import {
  createIdleActionState,
  errorState,
  successState,
  toErrorState,
  type ActionState,
} from "@/lib/action-state";

/** True bila Server Action mengakhiri alurnya dengan `redirect()`. */
export function isRedirectError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

const isRedirect = isRedirectError;

/**
 * Bungkus aksi berbasis `FormData` agar bisa dipakai `FormDialog`.
 * Redirect dianggap berhasil supaya dialog tetap menutup dan daftar dimuat ulang.
 */
/**
 * Adaptasi aksi yang sudah mengembalikan `ActionState` (mis. dengan data id)
 * menjadi aksi `ActionState<null>` untuk `FormDialog`. Redirect dianggap
 * berhasil; galat diteruskan apa adanya.
 */
export function adaptasiAksiForm(
  aksi: (state: ActionState<never>, fd: FormData) => Promise<ActionState<unknown>>,
  pesan: string,
) {
  return async (_state: ActionState<null>, fd: FormData): Promise<ActionState<null>> => {
    try {
      const hasil = await aksi(createIdleActionState<never>(), fd);
      if (hasil.status === "error") return errorState(hasil.message, hasil.fieldErrors);
      return successState(pesan, null);
    } catch (error) {
      if (isRedirectError(error)) return successState(pesan, null);
      return toErrorState(error);
    }
  };
}

export async function jalankanAksiForm(
  formData: FormData,
  aksi: (fd: FormData) => Promise<void>,
  pesan: string,
): Promise<ActionState<null>> {
  try {
    await aksi(formData);
    return successState(pesan, null);
  } catch (error) {
    if (isRedirect(error)) return successState(pesan, null);
    return toErrorState(error);
  }
}
