import type { Metadata } from "next";

import { DefinitionItem, DefinitionList } from "@/components/ui/definition-list";
import { SecondaryText } from "@/components/ui/secondary-text";
import { StatusBadge } from "@/components/ui/status-badge";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { getTemplateTenantPlatform } from "@/features/multi-desa/application/platform-info-use-cases";
import {
  PlatformCard,
  PlatformEmpty,
  PlatformPageHeader,
  PlatformStat,
  PlatformStatGrid,
  PlatformStatus,
} from "@/features/multi-desa/presentation/platform-ui";

import { pastikanSuperAdmin } from "../../guard";

export const metadata: Metadata = {
  title: "Fondasi tenant baru",
  robots: { index: false, follow: false },
};

const angka = new Intl.NumberFormat("id-ID");

export default async function SuperAdminTemplatePage() {
  await pastikanSuperAdmin();

  const template = await getTemplateTenantPlatform();
  const namaInduk = new Map(template.modules.map((modul) => [modul.slug, modul.name]));
  const aksesPerRole = new Map<string, number>();
  for (const grant of template.akses) {
    aksesPerRole.set(grant.roleSlug, (aksesPerRole.get(grant.roleSlug) ?? 0) + 1);
  }

  return (
    <>
      <PlatformPageHeader path="/super-admin/template/fondasi" />
      <PlatformStatGrid columns={5}>
        <PlatformStat
          icon={
            <>
              <path d="M6 3.8h9.2L19 7.6v12.6H6z" />
              <path d="M14.6 3.8v4h4" />
            </>
          }
          label="Versi template"
          note={`Sumber: ${template.sumber.jenis} · ${template.sumber.dibuatPada}`}
          tone="ungu"
          value={template.versi}
        />
        <PlatformStat
          icon={
            <>
              <circle cx="12" cy="8.4" r="3.4" />
              <path d="M5.4 20a6.6 6.6 0 0 1 13.2 0" />
            </>
          }
          label="Role"
          note="Dibuat ulang untuk setiap tenant"
          tone="biru"
          value={angka.format(template.roles.length)}
        />
        <PlatformStat
          icon={
            <>
              <rect height="6" rx="1.6" width="7" x="3.5" y="4" />
              <rect height="6" rx="1.6" width="7" x="13.5" y="4" />
              <rect height="6" rx="1.6" width="7" x="3.5" y="14" />
              <rect height="6" rx="1.6" width="7" x="13.5" y="14" />
            </>
          }
          label="Modul"
          note={`${angka.format(template.modules.filter((modul) => modul.isGroup).length)} grup, ${angka.format(template.modules.filter((modul) => !modul.isGroup).length)} item`}
          tone="hijau"
          value={angka.format(template.modules.length)}
        />
        <PlatformStat
          icon={
            <>
              <path d="M4.5 7.5h15" />
              <path d="M4.5 12h15" />
              <path d="M4.5 16.5h9" />
            </>
          }
          label="Aturan akses"
          note="Pasangan role × modul"
          tone="oranye"
          value={angka.format(template.akses.length)}
        />
      </PlatformStatGrid>

      <PlatformCard
        description="Jumlah modul yang dapat dibaca atau dikelola tiap role."
        flush
        title="Role dan akses"
      >
        <TableScroll frame>
          <Table>
            <THead>
              <Row>
                <HeaderCell scope="col">Role</HeaderCell>
                <HeaderCell scope="col">Slug</HeaderCell>
                <HeaderCell scope="col">Sistem</HeaderCell>
                <HeaderCell scope="col">Aturan akses</HeaderCell>
              </Row>
            </THead>
            <TBody>
              {template.roles.map((role) => (
                <Row key={role.slug}>
                  <Cell>
                    <strong>{role.name}</strong>
                  </Cell>
                  <Cell>{role.slug}</Cell>
                  <Cell>{role.isSystem ? "Ya" : "Tidak"}</Cell>
                  <Cell>{angka.format(aksesPerRole.get(role.slug) ?? 0)}</Cell>
                </Row>
              ))}
            </TBody>
          </Table>
        </TableScroll>
      </PlatformCard>

      <PlatformCard
        description="Modul level platform yang dibuat untuk setiap desa baru."
        flush
        title="Modul dan menu"
      >
        {template.modules.length > 0 ? (
          <TableScroll frame>
            <Table>
              <THead>
                <Row>
                  <HeaderCell scope="col">Modul</HeaderCell>
                  <HeaderCell scope="col">Slug</HeaderCell>
                  <HeaderCell scope="col">URL</HeaderCell>
                  <HeaderCell scope="col">Induk</HeaderCell>
                  <HeaderCell scope="col">Status</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {template.modules.map((modul) => (
                  <Row key={modul.slug}>
                    <Cell>
                      <strong>{modul.name}</strong>
                      {modul.icon ? <SecondaryText>{modul.icon}</SecondaryText> : null}
                    </Cell>
                    <Cell>{modul.slug}</Cell>
                    <Cell>{modul.url ?? <SecondaryText>—</SecondaryText>}</Cell>
                    <Cell>
                      {modul.parentSlug ? (
                        (namaInduk.get(modul.parentSlug) ?? modul.parentSlug)
                      ) : (
                        <SecondaryText>Tingkat atas</SecondaryText>
                      )}
                    </Cell>
                    <Cell>
                      <PlatformStatus
                        aktif={modul.isActive}
                        label={modul.isActive ? "Aktif" : "Nonaktif"}
                      />
                      {modul.isHidden ? <SecondaryText>Disembunyikan</SecondaryText> : null}
                    </Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        ) : (
          <PlatformEmpty
            description="Sidebar desa baru akan kosong sampai modul ditambahkan ke template."
            title="Template tidak memuat modul"
          />
        )}
      </PlatformCard>

      <PlatformCard
        description="Nilai awal yang dipakai website desa baru."
        title="Tema dan menu publik"
      >
        <DefinitionList>
          <DefinitionItem label="Tema bawaan">
            {template.tema ? (
              <>
                {template.tema.nama} · slug <strong>{template.tema.slug}</strong> · versi{" "}
                {template.tema.versi}
              </>
            ) : (
              "Website desa baru memakai tema bawaan aplikasi."
            )}
          </DefinitionItem>
          <DefinitionItem
            extra={
              <StatusBadge tone="info">{angka.format(template.menuPublik.length)} menu</StatusBadge>
            }
            label="Menu publik"
          >
            {template.menuPublik.length > 0
              ? template.menuPublik.map((menu) => menu.nama).join(", ")
              : "Belum ada menu publik pada template."}
          </DefinitionItem>
        </DefinitionList>

        <p className="form-help">
          Template bersifat baca-saja di konsol dan diperbarui lewat rilis aplikasi, bukan dari
          halaman ini.
        </p>
      </PlatformCard>
    </>
  );
}
