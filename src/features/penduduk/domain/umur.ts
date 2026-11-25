export function hitungUmur(tanggalLahir: string, tanggalAcuan = new Date()): number | null {
  const bagian = /^(\d{4})-(\d{2})-(\d{2})$/.exec(tanggalLahir);
  if (!bagian || !Number.isFinite(tanggalAcuan.getTime())) return null;

  const [, tahunTeks, bulanTeks, hariTeks] = bagian;
  const tahunLahir = Number(tahunTeks);
  const bulanLahir = Number(bulanTeks);
  const hariLahir = Number(hariTeks);
  const tanggalValid = new Date(`${tanggalLahir}T00:00:00Z`);
  if (
    !Number.isFinite(tanggalValid.getTime()) ||
    tanggalValid.toISOString().slice(0, 10) !== tanggalLahir
  ) {
    return null;
  }

  const tahunIni = tanggalAcuan.getFullYear();
  const bulanIni = tanggalAcuan.getMonth() + 1;
  const hariIni = tanggalAcuan.getDate();
  let umur = tahunIni - tahunLahir;
  if (bulanIni < bulanLahir || (bulanIni === bulanLahir && hariIni < hariLahir)) umur -= 1;
  return umur < 0 ? null : umur;
}
