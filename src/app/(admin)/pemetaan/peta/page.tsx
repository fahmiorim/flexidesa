import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { getWilayahPemerintahanData } from "@/features/pemerintahan/application/use-cases";
import {
  hapusAreaPetaAction,
  hapusLayerPetaAction,
} from "@/features/pemerintahan/presentation/actions";
import {
  simpanAreaPetaFormAction,
  simpanLayerPetaFormAction,
} from "@/features/pemerintahan/presentation/form-actions";
import { FormDialog } from "@/features/pemerintahan/presentation/form-dialog";

export const metadata = { title: "Pemetaan Umum" };

function idDari(nilai: string | string[] | undefined) {
  const angka = Number(typeof nilai === "string" ? nilai : "");
  return Number.isSafeInteger(angka) && angka > 0 ? angka : null;
}

export default async function PetaWilayahPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { shapes, layers } = await getWilayahPemerintahanData();
  const areaEdit = shapes.find((shape) => shape.id === idDari(params.editArea)) ?? null;

  type Layer = (typeof layers)[number];
  type Area = (typeof shapes)[number];

  const layerAktif = layers.filter((layer) => layer.enabled === 1).length;
  const areaTayang = shapes.filter((shape) => shape.enabled === 1).length;
  const areaTanpaLayer = shapes.filter((shape) => !shape.refPolygon).length;
  const layerTerpakai = layers.filter((layer) =>
    shapes.some((shape) => shape.refPolygon === layer.id),
  ).length;
  const namaLayer = (id: number | null) =>
    (id ? layers.find((layer) => layer.id === id)?.nama : null) ?? "";

  const isiLayer = (layer: Layer | null) => (
    <>
      {layer ? <input type="hidden" name="id" value={layer.id} /> : null}
      <label>
        Nama Layer
        <input
          defaultValue={layer?.nama ?? ""}
          name="nama"
          placeholder="Contoh: Kawasan layanan"
          required
        />
      </label>
      <label>
        Warna Layer
        <input defaultValue={layer?.color ?? "#7c3aed"} name="color" type="color" />
      </label>
      <label>
        Urutan
        <input defaultValue={layer?.sortOrder ?? 0} name="sortOrder" type="number" />
      </label>
      <label className="pemerintahan-check">
        <input defaultChecked={layer ? layer.enabled === 1 : true} name="enabled" type="checkbox" />{" "}
        Aktif
      </label>
    </>
  );

  const isiArea = (area: Area | null) => (
    <>
      {area ? (
        <>
          <input type="hidden" name="id" value={area.id} />
          <input type="hidden" name="foto" value={area.foto ?? ""} />
        </>
      ) : null}
      <label>
        Nama Area
        <input
          defaultValue={area?.nama ?? ""}
          name="nama"
          placeholder="Contoh: Kawasan layanan"
          required
        />
      </label>
      <label>
        Deskripsi Area
        <textarea
          defaultValue={area?.desk ?? ""}
          name="desk"
          placeholder="Keterangan wilayah atau batas area"
          rows={2}
        />
      </label>
      <label>
        {area ? "Ganti Foto Area" : "Foto Area"}
        <input accept="image/jpeg,image/png,image/webp" name="fotoFile" type="file" />
      </label>
      <label>
        GeoJSON Polygon
        <textarea
          defaultValue={area?.path ?? ""}
          name="path"
          placeholder='{"type":"Polygon","coordinates":[[[lng,lat],[lng,lat],[lng,lat],[lng,lat]]]}'
          rows={5}
        />
      </label>
      <label>
        Layer Polygon
        <select defaultValue={area?.refPolygon ?? ""} name="refPolygon">
          <option value="">Pilih layer (opsional)</option>
          {layers.map((layer) => (
            <option key={layer.id} value={layer.id}>
              {layer.nama}
            </option>
          ))}
        </select>
      </label>
      <label>
        Urutan
        <input defaultValue={area?.sortOrder ?? 0} name="sortOrder" type="number" />
      </label>
      <label className="pemerintahan-check">
        <input defaultChecked={area ? area.enabled === 1 : true} name="enabled" type="checkbox" />{" "}
        Tampilkan di peta publik
      </label>
    </>
  );

  return (
    <div className="modul-page pemerintahan-page pemerintahan-halaman peta-page">
      <PageHeading>
        <header className="page-heading">
          <div>
            <h1>Pemetaan Umum</h1>
            <p>Kelola layer dan area peta desa.</p>
          </div>
          <div className="page-heading-actions">
            <Link className="button button-ghost" href="/wilayah-administratif">
              Kelola Dusun / RW / RT ↗
            </Link>
            <Link className="button button-ghost" href="/identitas-desa">
              Identitas Desa ↗
            </Link>
          </div>
        </header>
      </PageHeading>

      <section aria-label="Ringkasan peta" className="peta-kpi">
        <article className="wilayah-kpi-kartu is-utama">
          <div className="wilayah-kpi-kepala">
            <span aria-hidden="true" className="wilayah-kpi-ikon">
              ◈
            </span>
            <span className="wilayah-kpi-label">Area tayang</span>
          </div>
          <strong className="wilayah-kpi-nilai">{areaTayang}</strong>
          <small className="wilayah-kpi-catatan">
            dari {shapes.length} area terdaftar di peta publik
          </small>
        </article>
        <article className="wilayah-kpi-kartu">
          <div className="wilayah-kpi-kepala">
            <span aria-hidden="true" className="wilayah-kpi-ikon is-biru">
              ▤
            </span>
            <span className="wilayah-kpi-label">Layer aktif</span>
          </div>
          <strong className="wilayah-kpi-nilai">{layerAktif}</strong>
          <small className="wilayah-kpi-catatan">dari {layers.length} layer peta</small>
        </article>
        <article className="wilayah-kpi-kartu">
          <div className="wilayah-kpi-kepala">
            <span aria-hidden="true" className="wilayah-kpi-ikon is-hijau">
              ◍
            </span>
            <span className="wilayah-kpi-label">Layer terpakai</span>
          </div>
          <strong className="wilayah-kpi-nilai">{layerTerpakai}</strong>
          <small className="wilayah-kpi-catatan">layer dipakai minimal satu area</small>
        </article>
        <article className="wilayah-kpi-kartu">
          <div className="wilayah-kpi-kepala">
            <span aria-hidden="true" className="wilayah-kpi-ikon">
              ⚑
            </span>
            <span className="wilayah-kpi-label">Area tanpa layer</span>
          </div>
          <strong className="wilayah-kpi-nilai">{areaTanpaLayer}</strong>
          <small className="wilayah-kpi-catatan">belum dikelompokkan ke layer</small>
        </article>
      </section>

      <section aria-label="Layer Peta Umum" className="pd-panel">
        <div className="pd-panel-kepala">
          <div>
            <h2>Layer Peta Umum</h2>
            <p>Batas desa di Identitas Desa; batas dusun/RW/RT di Wilayah Administratif.</p>
          </div>
          <div className="wilayah-toolbar">
            <FormDialog
              aksi={simpanLayerPetaFormAction}
              deskripsi="Nama layer, warna, dan urutan tampil."
              judul="Tambah Layer Peta"
              label="Tambah Layer"
              labelSimpan="Simpan Layer"
              varian="secondary"
            >
              {isiLayer(null)}
            </FormDialog>
          </div>
        </div>

        {layers.length ? (
          <div className="modul-table-wrap">
            <table className="modul-table pemerintah-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Layer</th>
                  <th>Status</th>
                  <th>Urutan</th>
                  <th>Area</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {layers.map((layer, index) => {
                  const jumlahArea = shapes.filter((shape) => shape.refPolygon === layer.id).length;
                  return (
                    <tr key={layer.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="pemerintah-nama">
                          <span
                            aria-hidden
                            className="pemerintahan-warna peta-warna"
                            style={{ background: layer.color ?? "#7c3aed" }}
                          />
                          <div className="pemerintah-nama-isi">
                            <strong>{layer.nama}</strong>
                            <small className="pemerintah-jenis-jabatan">
                              {layer.color ?? "Tanpa warna"}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`pd-chip ${layer.enabled === 1 ? "is-aktif" : "is-nonaktif"}`}
                        >
                          {layer.enabled === 1 ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td>{layer.sortOrder}</td>
                      <td>{jumlahArea} area</td>
                      <td>
                        <div className="pd-aparat-aksi">
                          <FormDialog
                            aksi={simpanLayerPetaFormAction}
                            deskripsi={`Ubah nama, warna, urutan, dan status layer ${layer.nama}.`}
                            judul="Ubah Layer Peta"
                            key={`layer-${layer.id}`}
                            label="Ubah"
                            labelSimpan="Simpan"
                            varian="ghost"
                          >
                            {isiLayer(layer)}
                          </FormDialog>
                          <form action={hapusLayerPetaAction}>
                            <input type="hidden" name="id" value={layer.id} />
                            <ConfirmSubmit
                              className="button button-danger-ghost"
                              message={`Hapus layer ${layer.nama}?`}
                            >
                              Hapus
                            </ConfirmSubmit>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="modul-empty">Belum ada layer peta.</p>
        )}
      </section>

      <section aria-label="Area GIS Umum" className="pd-panel" id="peta">
        <div className="pd-panel-kepala">
          <div>
            <h2>Area GIS Umum</h2>
            <p>Polygon GeoJSON non-administratif yang dipakai halaman wilayah publik.</p>
          </div>
          <div className="wilayah-toolbar">
            <FormDialog
              aksi={simpanAreaPetaFormAction}
              deskripsi="Tempel GeoJSON, pilih layer, lalu simpan."
              judul="Tambah Area GIS"
              label="Tambah Area"
              labelSimpan="Simpan Area"
              varian="secondary"
            >
              {isiArea(null)}
            </FormDialog>
          </div>
        </div>

        {areaEdit ? (
          <div className="pemerintahan-aksi-bar">
            <FormDialog
              aksi={simpanAreaPetaFormAction}
              bukaAwal
              deskripsi={`Perbarui geometri dan publikasi area ${areaEdit.nama}.`}
              judul="Ubah Area GIS"
              key={`area-${areaEdit.id}`}
              label="Ubah Area"
              labelSimpan="Simpan Perubahan"
              tutupHref="/pemetaan/peta"
            >
              {isiArea(areaEdit)}
            </FormDialog>
          </div>
        ) : null}

        {shapes.length ? (
          <div className="modul-table-wrap">
            <table className="modul-table pemerintah-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Area</th>
                  <th>Layer Polygon</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {shapes.map((shape, index) => (
                  <tr key={shape.id}>
                    <td>{index + 1}</td>
                    <td>
                      <strong className="pemerintah-jabatan">{shape.nama}</strong>
                      <small className="pemerintah-jenis-jabatan">
                        {shape.desk?.trim() || "Tanpa deskripsi"}
                      </small>
                    </td>
                    <td>{namaLayer(shape.refPolygon) || "Belum terhubung"}</td>
                    <td>
                      <span
                        className={`pd-chip ${shape.enabled === 1 ? "is-aktif" : "is-nonaktif"}`}
                      >
                        {shape.enabled === 1 ? "Tayang" : "Disembunyikan"}
                      </span>
                    </td>
                    <td>
                      <div className="pd-aparat-aksi">
                        <Link
                          className="button button-ghost"
                          href={`/pemetaan/peta?editArea=${shape.id}#peta`}
                        >
                          Ubah
                        </Link>
                        <form action={hapusAreaPetaAction}>
                          <input type="hidden" name="id" value={shape.id} />
                          <ConfirmSubmit
                            className="button button-danger-ghost"
                            message={`Hapus area ${shape.nama}?`}
                          >
                            Hapus
                          </ConfirmSubmit>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="modul-empty">
            Belum ada area GIS. Tambahkan GeoJSON Polygon untuk menampilkan batas wilayah.
          </p>
        )}
      </section>
    </div>
  );
}
