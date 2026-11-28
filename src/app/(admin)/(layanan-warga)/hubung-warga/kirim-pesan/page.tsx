import { type Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { TableCard } from "@/components/ui/table-card";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";

import { dataGrupKontakUseCase, listPesanArsipUseCase, village } from "@/features/layanan-warga/kontak/application/use-cases";
import { KONTAK_GRUP_RESOURCE } from "@/features/layanan-warga/kontak/domain/kontak";

import { kirimPesanAction } from "./actions";

export const metadata: Metadata = { title: "Kirim Pesan" };

export default async function KirimPesanPage() {
  const { villageId } = await village(KONTAK_GRUP_RESOURCE, "read");
  const [{ grup }, riwayat] = await Promise.all([
    dataGrupKontakUseCase(villageId),
    listPesanArsipUseCase(villageId),
  ]);

  if (grup.length === 0) {
    return (
      <main className="space-y-6">
        <PageHeading
          judul="Kirim Pesan"
          deskripsi="Kirim pesan broadcast ke grup kontak."
        />
        <Card variant="panel">
          <CardHeader title="Kirim Pesan" />
          <CardBody className="text-center py-8 text-muted">
            Belum ada grup kontak. <Link href="/hubung-warga/grup-kontak/baru" className="text-primary underline">Buat grup terlebih dahulu</Link>.
          </CardBody>
        </Card>
      </main>
    );
  }

  const grupOptions = [
    { value: "", label: "Pilih grup", disabled: true },
    ...grup.map((g) => ({ value: String(g.id), label: `${g.namaGrup} (${g.jumlahAnggota} anggota)` })),
  ];

  return (
    <main className="space-y-6">
      <PageHeading
        judul="Kirim Pesan"
        deskripsi="Kirim pesan broadcast ke grup kontak. Pesan akan disimpan ke arsip."
      />
      <Card variant="panel">
        <CardHeader title="Kirim Pesan Baru" />
        <CardBody>
          <form action={kirimPesanAction} className="space-y-4">
            <FormField
              name="grupId"
              label="Grup Kontak"
              kind="select"
              options={grupOptions}
              defaultValue=""
              required
            />
            <FormField
              name="subjek"
              label="Subjek"
              placeholder="Subjek pesan"
              defaultValue=""
              required
            />
            <FormField
              name="isi"
              label="Isi Pesan"
              kind="textarea"
              placeholder="Isi pesan yang akan dikirim"
              defaultValue=""
              required
              rows={8}
            />
            <Button type="submit" variant="primary">Kirim & Simpan ke Arsip</Button>
          </form>
        </CardBody>
      </Card>

      <TableCard title="Riwayat Pesan" description="Daftar pesan broadcast yang pernah dikirim.">
        <Table>
          <TableScroll>
            <THead>
              <Row>
                <HeaderCell className="w-12">No</HeaderCell>
                <HeaderCell>Tanggal</HeaderCell>
                <HeaderCell>Grup</HeaderCell>
                <HeaderCell>Subjek</HeaderCell>
                <HeaderCell>Pengirim</HeaderCell>
              </Row>
            </THead>
            <TBody>
              {riwayat.length === 0 ? (
                <Row>
                  <Cell colSpan={5} className="text-center py-8 text-muted">
                    Belum ada riwayat pesan.
                  </Cell>
                </Row>
              ) : (
                riwayat.map((item, idx) => (
                  <Row key={item.id}>
                    <Cell className="text-center">{idx + 1}</Cell>
                    <Cell>{item.createdAt.toLocaleString("id-ID")}</Cell>
                    <Cell>{item.namaGrup}</Cell>
                    <Cell>{item.subjek}</Cell>
                    <Cell>{item.creatorName}</Cell>
                  </Row>
                ))
              )}
            </TBody>
          </TableScroll>
        </Table>
      </TableCard>
    </main>
  );
}