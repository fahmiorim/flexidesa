"use client";

import { useActionState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { type KontakInput } from "@/features/layanan-warga/kontak/domain/kontak";
import { createIdleActionState, type ActionState } from "@/lib/action-state";

export type KontakSubmitAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

interface KontakFormProps {
  initialData?: Omit<KontakInput, "villageId">;
  pendudukOptions: { id: number; nama: string }[];
  action: KontakSubmitAction;
  title: string;
  description: string;
}

const HUBUNG_OPTIONS: { value: string; label: string }[] = [
  { value: "Telegram", label: "Telegram" },
  { value: "SMS", label: "SMS" },
  { value: "Email", label: "Email" },
];

export function KontakForm({
  initialData,
  pendudukOptions,
  action,
  title,
  description,
}: KontakFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, createIdleActionState());

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [state, router]);

  const fieldError = (nama: string) =>
    state.status === "error" ? (state.fieldErrors?.[nama]?.[0] ?? state.message) : undefined;

  const residentOptions = useMemo(
    () => [
      { value: "", label: "Tidak ditautkan" },
      ...pendudukOptions.map((p: { id: number; nama: string }) => ({
        value: String(p.id),
        label: p.nama,
      })),
    ],
    [pendudukOptions],
  );

  return (
    <main className="space-y-6">
      <PageHeading judul={title} deskripsi={description} />
      <Card variant="panel">
        <CardHeader title={title} description={description} />
        <CardBody>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="id" value={initialData?.id ?? ""} />
            <FormField
              name="nama"
              label="Nama"
              placeholder="Nama kontak"
              defaultValue={initialData?.nama ?? ""}
              error={fieldError("nama")}
              required
            />
            <FormField
              name="residentId"
              label="Tautkan ke Penduduk"
              kind="select"
              options={residentOptions}
              defaultValue={initialData?.residentId ? String(initialData.residentId) : ""}
              error={fieldError("residentId")}
              helpText="Opsional: tautkan kontak ke NIK penduduk desa."
            />
            <FormField
              name="hubungWarga"
              label="Cara Hubung Warga"
              kind="select"
              options={HUBUNG_OPTIONS}
              defaultValue={initialData?.hubungWarga ?? "Telegram"}
              error={fieldError("hubungWarga")}
            />
            <FormField
              name="telepon"
              label="Telepon (SMS)"
              placeholder="Nomor telepon"
              defaultValue={initialData?.telepon ?? ""}
              error={fieldError("telepon")}
              helpText="Diperlukan jika SMS dipilih sebagai cara hubung."
            />
            <FormField
              name="email"
              label="Email"
              placeholder="Alamat email"
              defaultValue={initialData?.email ?? ""}
              error={fieldError("email")}
              helpText="Diperlukan jika Email dipilih sebagai cara hubung."
            />
            <FormField
              name="telegram"
              label="ID Telegram"
              placeholder="ID atau username Telegram"
              defaultValue={initialData?.telegram ?? ""}
              error={fieldError("telegram")}
              helpText="Diperlukan jika Telegram dipilih sebagai cara hubung."
            />
            <FormField
              name="keterangan"
              label="Keterangan"
              kind="textarea"
              placeholder="Keterangan tambahan"
              defaultValue={initialData?.keterangan ?? ""}
              error={fieldError("keterangan")}
            />
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Memproses…" : "Simpan"}
            </Button>
          </form>
        </CardBody>
      </Card>
    </main>
  );
}