"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  updateKontakUseCase,
  village,
} from "@/features/layanan-warga/kontak/application/use-cases";
import {
  KONTAK_RESOURCE,
  kontakSchema,
} from "@/features/layanan-warga/kontak/domain/kontak";
import {
  errorState,
  type ActionState,
  zodToFieldErrors,
} from "@/lib/action-state";

/** Schema form tanpa `villageId` (dikendalikan server). */
const formSchema = z.object(kontakSchema.shape).omit({
  villageId: true,
});

function field(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

export async function ubahKontakAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const idRaw = field(formData, "id");
  const id = Number(idRaw);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return errorState("Kontak tidak valid.", { id: ["Kontak tidak valid."] });
  }

  const { villageId } = await village(KONTAK_RESOURCE, "update");

  const parsed = formSchema.safeParse({
    id,
    nama: field(formData, "nama"),
    residentId: field(formData, "residentId") ? Number(field(formData, "residentId")) : null,
    hubungWarga: field(formData, "hubungWarga") || "Telegram",
    telepon: field(formData, "telepon"),
    email: field(formData, "email"),
    telegram: field(formData, "telegram"),
    keterangan: field(formData, "keterangan"),
  });

  if (!parsed.success) {
    return errorState("Data yang dikirim tidak valid.", zodToFieldErrors(parsed.error));
  }

  const data = parsed.data;

  if (data.hubungWarga === "SMS" && !data.telepon) {
    return errorState("Data tidak valid.", {
      telepon: ["Telepon diperlukan jika SMS dipilih sebagai cara hubung."],
    });
  }
  if (data.hubungWarga === "Email" && !data.email) {
    return errorState("Data tidak valid.", {
      email: ["Email diperlukan jika Email dipilih sebagai cara hubung."],
    });
  }
  if (data.hubungWarga === "Telegram" && !data.telegram) {
    return errorState("Data tidak valid.", {
      telegram: ["ID Telegram diperlukan jika Telegram dipilih sebagai cara hubung."],
    });
  }

  try {
    await updateKontakUseCase(villageId, { ...data, villageId });
    revalidatePath("/hubung-warga/daftar-kontak");
    revalidatePath(`/hubung-warga/daftar-kontak/${id}`);
    redirect(`/hubung-warga/daftar-kontak/${id}/ubah?updated=1`);
  } catch (error) {
    return errorState(error instanceof Error ? error.message : "Kontak tidak dapat disimpan.");
  }
}