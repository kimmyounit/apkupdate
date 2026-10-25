import type { SpyCategory } from '../types/game.ts';

export interface SpyWordPair {
  civilian: string;
  spy: string;
  category: SpyCategory;
  hint?: string;
}

export const SPY_WORD_PAIRS: SpyWordPair[] = [
  // --- KATEGORI: SEKOLAH ---
  { civilian: 'Pantai', spy: 'Kolam Renang', category: 'tempat', hint: 'Tempat berair untuk santai' },
  { civilian: 'Kucing', spy: 'Harimau', category: 'hewan', hint: 'Hewan berkaki empat' },
  { civilian: 'Nasi Goreng', spy: 'Mi Goreng', category: 'makanan', hint: 'Makanan populer gerobak' },
  { civilian: 'Sepak Bola', spy: 'Futsal', category: 'sekolah', hint: 'Olahraga menendang bola' },
  { civilian: 'Buku Tulis', spy: 'Buku Gambar', category: 'sekolah', hint: 'Perlengkapan siswa' },
  { civilian: 'Guru', spy: 'Dosen', category: 'sekolah', hint: 'Tenaga pengajar' },
  { civilian: 'Ujian Semester', spy: 'Kuis Harian', category: 'sekolah', hint: 'Evaluasi belajar' },
  { civilian: 'Seragam Sekolah', spy: 'Baju Pramuka', category: 'sekolah', hint: 'Pakaian saat ke sekolah' },
  { civilian: 'Papan Tulis', spy: 'Layar Proyektor', category: 'sekolah', hint: 'Media presentasi di depan kelas' },
  { civilian: 'Perpustakaan', spy: 'Toko Buku', category: 'sekolah', hint: 'Tempat banyak buku' },
  { civilian: 'Penggaris', spy: 'Jangka', category: 'sekolah', hint: 'Alat ukur dan gambar geometri' },
  { civilian: 'Pensil', spy: 'Pulpen', category: 'sekolah', hint: 'Alat untuk menulis di kertas' },
  { civilian: 'Tas Sekolah', spy: 'Kotak Pensil', category: 'sekolah', hint: 'Tempat menaruh perlengkapan' },
  { civilian: 'Kantin', spy: 'Koperasi', category: 'sekolah', hint: 'Tempat jajan di lingkungan sekolah' },
  { civilian: 'Kepala Sekolah', spy: 'Wakil Kepala Sekolah', category: 'sekolah', hint: 'Pimpinan di sekolah' },
  { civilian: 'Bel Masuk', spy: 'Sirine', category: 'sekolah', hint: 'Suara pengingat waktu' },
  { civilian: 'Jam Kosong', spy: 'Waktu Istirahat', category: 'sekolah', hint: 'Waktu santai siswa di sekolah' },
  { civilian: 'Laboratorium IPA', spy: 'Ruang Komputer', category: 'sekolah', hint: 'Ruang praktik siswa' },
  { civilian: 'Upacara Bendera', spy: 'Pramuka', category: 'sekolah', hint: 'Kegiatan luar ruangan sekolah' },
  { civilian: 'Wali Kelas', spy: 'Guru BK', category: 'sekolah', hint: 'Sosok pembimbing siswa di sekolah' },
  { civilian: 'Rapor', spy: 'Ijazah', category: 'sekolah', hint: 'Dokumen hasil pencapaian belajar' },

  // --- KATEGORI: HEWAN ---
  { civilian: 'Singa', spy: 'Macan Tutul', category: 'hewan', hint: 'Predator buas berkaki empat' },
  { civilian: 'Kuda', spy: 'Keledai', category: 'hewan', hint: 'Hewan berkaki empat pekerja' },
  { civilian: 'Lumba-Lumba', spy: 'Ikan Paus', category: 'hewan', hint: 'Mamalia cerdas laut' },
  { civilian: 'Bebek', spy: 'Angsa', category: 'hewan', hint: 'Unggas air paruh pipih' },
  { civilian: 'Kelinci', spy: 'Marmut', category: 'hewan', hint: 'Hewan berbulu pemakan rumput' },
  { civilian: 'Elang', spy: 'Burung Hantu', category: 'hewan', hint: 'Burung pemangsa' },
  { civilian: 'Buaya', spy: 'Aligator', category: 'hewan', hint: 'Reptil air bergigi tajam' },
  { civilian: 'Kupu-Kupu', spy: 'Capung', category: 'hewan', hint: 'Serangga bersayap indah' },
  { civilian: 'Katak', spy: 'Kodok', category: 'hewan', hint: 'Hewan amfibi bersuara malam' },
  { civilian: 'Lebah', spy: 'Tawon', category: 'hewan', hint: 'Serangga penghasil sengatan' },
  { civilian: 'Gajah', spy: 'Badak', category: 'hewan', hint: 'Hewan darat berbadan besar' },
  { civilian: 'Ayam Jago', spy: 'Burung Merpati', category: 'hewan', hint: 'Unggas berkokok / terbang' },
  { civilian: 'Pinguin', spy: 'Anjing Laut', category: 'hewan', hint: 'Hewan daerah dingin kutub' },
  { civilian: 'Zebra', spy: 'Jerapah', category: 'hewan', hint: 'Hewan khas padang savana' },
  { civilian: 'Semut', spy: 'Rayap', category: 'hewan', hint: 'Serangga kecil hidup berkoloni' },

  // --- KATEGORI: MAKANAN ---
  { civilian: 'Bakso', spy: 'Soto Daging', category: 'makanan', hint: 'Kuliner berkuah hangat' },
  { civilian: 'Sate Ayam', spy: 'Sate Kambing', category: 'makanan', hint: 'Daging tusuk bumbu kacang/kecap' },
  { civilian: 'Roti Bakar', spy: 'Pisang Bakar', category: 'makanan', hint: 'Camilan manis dipanggang' },
  { civilian: 'Es Teh Manis', spy: 'Es Jeruk', category: 'makanan', hint: 'Minuman dingin penyegar' },
  { civilian: 'Martabak Manis', spy: 'Kue Pukis', category: 'makanan', hint: 'Kue legit manis' },
  { civilian: 'Batagor', spy: 'Siomay', category: 'makanan', hint: 'Jajanan khas bumbu kacang' },
  { civilian: 'Rendang', spy: 'Gulai Daging', category: 'makanan', hint: 'Masakan khas rempah Minang' },
  { civilian: 'Ayam Geprek', spy: 'Ayam Penyet', category: 'makanan', hint: 'Olahan ayam pedas diulek' },
  { civilian: 'Donat', spy: 'Roti Cokelat', category: 'makanan', hint: 'Kudapan manis tepung' },
  { civilian: 'Seblak', spy: 'Cilok Kuah', category: 'makanan', hint: 'Jajanan pedas kenyal' },
  { civilian: 'Burger', spy: 'Sandwich', category: 'makanan', hint: 'Makanan barat berlapis roti' },
  { civilian: 'Jus Alpukat', spy: 'Jus Mangga', category: 'makanan', hint: 'Minuman buah kental segar' },
  { civilian: 'Cireng', spy: 'Cimol', category: 'makanan', hint: 'Gorengan aci kenyal gurih' },
  { civilian: 'Pempek', spy: 'Otak-Otak', category: 'makanan', hint: 'Olahan ikan khas Nusantara' },
  { civilian: 'Kerupuk', spy: 'Keripik', category: 'makanan', hint: 'Pelengkap renyah makanan' },

  // --- KATEGORI: TEMPAT ---
  { civilian: 'Bioskop', spy: 'Teater', category: 'tempat', hint: 'Tempat menonton pertunjukan' },
  { civilian: 'Supermarket', spy: 'Pasar Tradisional', category: 'tempat', hint: 'Pusat belanja kebutuhan pokok' },
  { civilian: 'Bandara', spy: 'Stasiun Kereta', category: 'tempat', hint: 'Terminal moda transportasi umum' },
  { civilian: 'Hotel', spy: 'Villa', category: 'tempat', hint: 'Akomodasi penginapan liburan' },
  { civilian: 'Museum', spy: 'Galeri Seni', category: 'tempat', hint: 'Tempat koleksi karya bersejarah' },
  { civilian: 'Gunung', spy: 'Bukit', category: 'tempat', hint: 'Dataran tinggi di alam' },
  { civilian: 'Hutan', spy: 'Taman Kota', category: 'tempat', hint: 'Area pepohonan hijau' },
  { civilian: 'Danau', spy: 'Waduk', category: 'tempat', hint: 'Genangan air luas' },
  { civilian: 'Stadion', spy: 'Lapangan Futsal', category: 'tempat', hint: 'Tempat pertandingan olahraga' },
  { civilian: 'Rumah Sakit', spy: 'Puskesmas', category: 'tempat', hint: 'Fasilitas layanan kesehatan' },
  { civilian: 'Restoran', spy: 'Warung Tenda', category: 'tempat', hint: 'Tempat makan bersama teman' },
  { civilian: 'Kamar Tidur', spy: 'Ruang Tamu', category: 'tempat', hint: 'Ruangan di dalam rumah' },
  { civilian: 'Kolam Pemancingan', spy: 'Sungai', category: 'tempat', hint: 'Tempat mencari ikan' },

  // --- KATEGORI: BENDA ---
  { civilian: 'Sepeda', spy: 'Sepeda Motor', category: 'benda', hint: 'Kendaraan roda dua' },
  { civilian: 'Kacamata', spy: 'Lensa Kontak', category: 'benda', hint: 'Alat bantu penglihatan' },
  { civilian: 'Payung', spy: 'Jas Hujan', category: 'benda', hint: 'Pelindung dari air hujan' },
  { civilian: 'Sepatu', spy: 'Sandal', category: 'benda', hint: 'Alas kaki harian' },
  { civilian: 'Laptop', spy: 'Komputer PC', category: 'benda', hint: 'Perangkat komputasi layar' },
  { civilian: 'Headphone', spy: 'Earphone', category: 'benda', hint: 'Perangkat audio di telinga' },
  { civilian: 'Jam Tangan', spy: 'Jam Dinding', category: 'benda', hint: 'Penunjuk waktu berputar' },
  { civilian: 'Kipas Angin', spy: 'AC Pendingin', category: 'benda', hint: 'Pendingin hawa ruangan' },
  { civilian: 'Senter', spy: 'Lilin', category: 'benda', hint: 'Penerang saat mati lampu' },
  { civilian: 'Dompet', spy: 'Tas Ransel', category: 'benda', hint: 'Wadah penyimpan barang bawaan' },
  { civilian: 'Gitar', spy: 'Ukulele', category: 'benda', hint: 'Alat musik berdawai dipetik' },
  { civilian: 'Kamera Digital', spy: 'Smartphone', category: 'benda', hint: 'Alat memotret momen' },
  { civilian: 'Sikat Gigi', spy: 'Pasta Gigi', category: 'benda', hint: 'Perlengkapan kebersihan mulut' },
  { civilian: 'Handuk', spy: 'Selimut', category: 'benda', hint: 'Kain tebal lembut penutup tubuh' },
  { civilian: 'Bantal', spy: 'Guling', category: 'benda', hint: 'Perlengkapan tidur empuk' },
];

export function getRandomSpyWordPair(category: SpyCategory): { civilian: string; spy: string; category: SpyCategory } {
  let pool = SPY_WORD_PAIRS;
  if (category && category !== 'campuran') {
    pool = SPY_WORD_PAIRS.filter((p) => p.category === category);
    if (pool.length === 0) pool = SPY_WORD_PAIRS;
  }
  const idx = Math.floor(Math.random() * pool.length);
  const pair = pool[idx];

  // 50% random chance to swap civilian and spy word so players can't memorize who is spy
  const shouldSwap = Math.random() < 0.5;
  return {
    civilian: shouldSwap ? pair.spy : pair.civilian,
    spy: shouldSwap ? pair.civilian : pair.spy,
    category: pair.category,
  };
}
