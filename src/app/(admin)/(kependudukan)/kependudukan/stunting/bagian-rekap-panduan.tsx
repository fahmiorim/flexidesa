import styles from "./stunting.module.css";

export function PanduanIbuHamil() {
  return (
    <div className={styles.panduanSeksi}>
      <section>
        <h3>Tentang program konvergensi stunting</h3>
        <p>Konvergensi dihitung dari delapan indikator per ibu hamil (1.000 HPK).</p>
      </section>

      <section>
        <h3>Faktor risiko KEK pada ibu hamil</h3>
        <ul>
          <li>Lingkar Lengan Atas (LILA) kurang dari 23,5 cm</li>
          <li>Berat badan sebelum hamil kurang dari 45 kg</li>
          <li>Tinggi badan kurang dari 145 cm</li>
          <li>Penambahan berat badan tidak sesuai standar</li>
          <li>Riwayat melahirkan bayi BBLR</li>
          <li>Jarak kehamilan terlalu dekat</li>
          <li>Usia hamil kurang dari 20 tahun atau lebih dari 35 tahun</li>
        </ul>
      </section>

      <section>
        <h3>Indikator yang dinilai (8 total)</h3>
        <ol>
          <li>Pemeriksaan kehamilan minimal 4 kali (K1-K4)</li>
          <li>Konsumsi pil Fe minimal 90 tablet</li>
          <li>Pemeriksaan nifas minimal 3 kali</li>
          <li>Konseling gizi minimal 3 kali</li>
          <li>Kunjungan rumah minimal 2 kali</li>
          <li>Akses air bersih</li>
          <li>Kepemilikan jamban sehat</li>
          <li>Jaminan kesehatan</li>
        </ol>
      </section>

      <section>
        <h3>Kategori capaian</h3>
        <ul>
          <li>Tinggi (≥80%): sangat baik</li>
          <li>Sedang (60-79%): perlu perbaikan</li>
          <li>Rendah (&lt;60%): perlu perhatian khusus</li>
        </ul>
      </section>

      <section>
        <h3>Keterangan status</h3>
        <ul>
          <li>Y: ya, memenuhi syarat</li>
          <li>T: tidak, tidak memenuhi syarat</li>
          <li>-: data tidak tersedia / belum seharusnya dinilai</li>
        </ul>
      </section>
    </div>
  );
}

export function PanduanAnak() {
  return (
    <div className={styles.panduanSeksi}>
      <section>
        <h3>Program konvergensi stunting anak 0-2 tahun</h3>
        <p>Usia 0–23 bulan adalah periode kritis 1.000 HPK.</p>
      </section>

      <section>
        <h3>Fokus tiap kategori usia</h3>
        <ul>
          <li>
            <strong>0 - &lt; 6 bulan:</strong> ASI eksklusif, imunisasi dasar, dan pemantauan
            pertumbuhan; indikator pengasuhan PAUD belum berlaku.
          </li>
          <li>
            <strong>6 - 12 bulan:</strong> MP-ASI, imunisasi lanjutan, penimbangan bulanan, dan
            konseling gizi.
          </li>
          <li>
            <strong>&gt; 12 - &lt; 18 bulan:</strong> pola makan keluarga, deteksi dini gangguan
            pertumbuhan, dan pengasuhan stimulatif.
          </li>
          <li>
            <strong>&gt; 18 - 23 bulan:</strong> kesempatan terakhir 1.000 HPK; seluruh indikator
            termasuk pengasuhan PAUD harus optimal.
          </li>
        </ul>
      </section>

      <section>
        <h3>Status gizi</h3>
        <ul>
          <li>Normal: pertumbuhan sesuai standar WHO</li>
          <li>Gizi kurang/buruk: berat badan menurut umur di bawah standar</li>
          <li>Stunting: tinggi badan menurut umur di bawah standar</li>
        </ul>
      </section>

      <section>
        <h3>Keterangan status indikator</h3>
        <ul>
          <li>Y: ya, memenuhi syarat</li>
          <li>T: tidak, tidak memenuhi syarat</li>
          <li>-: data tidak tersedia / belum seharusnya dinilai</li>
        </ul>
      </section>
    </div>
  );
}
