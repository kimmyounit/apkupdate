// =============================================================
// DATASET RESMI PERMAINAN SISWA SAAT JAM KOSONG TAMVESTA
// Edukatif, Ramah Siswa, Aman, & Sesuai Aturan Sekolah
// =============================================================

export interface TruthDareCard {
  id: string;
  type: 'truth' | 'dare';
  text: string;
  category: 'sekolah' | 'hobi' | 'kreatif' | 'lucu';
}

export const ABC_CATEGORIES = [
  'Negara',
  'Buah',
  'Tempat',
  'Hewan',
  'Nama Orang',
  'Makanan',
  'Minuman',
  'Benda',
  'Tumbuhan',
  'Profesi',
  'Kendaraan',
] as const;

export type AbcCategory = (typeof ABC_CATEGORIES)[number];

// Kartu Truth & Dare Aman & Edukatif
export const TRUTH_CARDS: TruthDareCard[] = [
  { id: 't1', type: 'truth', text: 'Apa mata pelajaran yang paling kamu sukai di sekolah dan apa alasannya?', category: 'sekolah' },
  { id: 't2', type: 'truth', text: 'Ceritakan pengalaman paling lucu atau berkesan saat jam istirahat di Tamansiswa!', category: 'lucu' },
  { id: 't3', type: 'truth', text: 'Siapa guru yang menurutmu paling sabar saat mengajar di kelas?', category: 'sekolah' },
  { id: 't4', type: 'truth', text: 'Apa makanan atau jajanan favoritmu saat jajan di kantin sekolah?', category: 'hobi' },
  { id: 't5', type: 'truth', text: 'Apa cita-citamu setelah lulus dari sekolah nanti?', category: 'hobi' },
  { id: 't6', type: 'truth', text: 'Lagu apa yang paling sering kamu dengarkan akhir-akhir ini?', category: 'hobi' },
  { id: 't7', type: 'truth', text: 'Jika bisa punya kekuatan super untuk membantu teman sekelas, kekuatan apa yang kamu pilih?', category: 'kreatif' },
  { id: 't8', type: 'truth', text: 'Apa hobi yang sering kamu lakukan di rumah saat akhir pekan?', category: 'hobi' },
  { id: 't9', type: 'truth', text: 'Pernahkah kamu lupa membawa buku PR atau perlengkapan sekolah? Ceritakan!', category: 'sekolah' },
  { id: 't10', type: 'truth', text: 'Siapa teman sekelas yang menurutmu paling ramah dan suka menolong?', category: 'sekolah' },
  { id: 't11', type: 'truth', text: 'Apa film atau kartun animasi yang paling kamu sukai sampai sekarang?', category: 'hobi' },
  { id: 't12', type: 'truth', text: 'Buku atau komik apa yang paling seru yang pernah kamu baca di perpustakaan?', category: 'sekolah' },
  { id: 't13', type: 'truth', text: 'Hal apa yang paling membuatmu merasa bangga pada dirimu sendiri tahun ini?', category: 'kreatif' },
  { id: 't14', type: 'truth', text: 'Jika kamu jadi ketua kelas selama 1 hari, aturan apa yang ingin kamu buat?', category: 'sekolah' },
  { id: 't15', type: 'truth', text: 'Apa nama tempat wisata di Batam atau Kepri yang paling ingin kamu kunjungi lagi?', category: 'hobi' },
];

export const DARE_CARDS: TruthDareCard[] = [
  { id: 'd1', type: 'dare', text: 'Sebutkan 3 benda di dalam kelas yang berawalan dari huruf "K" dalam waktu 5 detik!', category: 'kreatif' },
  { id: 'd2', type: 'dare', text: 'Tirukan suara hewan kucing yang sedang kelaparan selama 3 detik!', category: 'lucu' },
  { id: 'd3', type: 'dare', text: 'Nyanyikan potongan lagu kebangsaan atau lagu anak pilihanmu sebanyak 2 bait dengan sopan!', category: 'sekolah' },
  { id: 'd4', type: 'dare', text: 'Ucapkan salam Perguruan Tamansiswa: "Salam dan Bahagia!" dengan sikap hormat dan senyum!', category: 'sekolah' },
  { id: 'd5', type: 'dare', text: 'Sebutkan 5 nama ibu kota negara di Asia Tenggara secara berurutan!', category: 'sekolah' },
  { id: 'd6', type: 'dare', text: 'Peragakan gaya orang sedang main gitar listrik tanpa suara selama 5 detik!', category: 'lucu' },
  { id: 'd7', type: 'dare', text: 'Sebutkan kebaikan dari salah satu teman yang sedang bermain bersamamu sekarang!', category: 'sekolah' },
  { id: 'd8', type: 'dare', text: 'Eja kata "TAMANSISWA" dari huruf belakang ke depan (A-W-S-I-S-N-A-M-A-T)!', category: 'kreatif' },
  { id: 'd9', type: 'dare', text: 'Tirukan gaya seorang guru yang sedang menyuruh murid-muridnya duduk tenang!', category: 'lucu' },
  { id: 'd10', type: 'dare', text: 'Sebutkan 3 nama pahlawan nasional Indonesia dalam waktu 5 detik!', category: 'sekolah' },
  { id: 'd11', type: 'dare', text: 'Lakukan pose patung membeku (freeze) selama 8 detik tanpa berkedip!', category: 'lucu' },
  { id: 'd12', type: 'dare', text: 'Sebutkan perkalian 7 x 8 dan 9 x 6 dengan cepat!', category: 'sekolah' },
  { id: 'd13', type: 'dare', text: 'Buat pantun kilat lucu 2 baris bertema sekolah atau pertemanan!', category: 'kreatif' },
  { id: 'd14', type: 'dare', text: 'Tirukan suara ayam jago berkokok di pagi hari dengan lantang!', category: 'lucu' },
  { id: 'd15', type: 'dare', text: 'Ucapkan kalimat "Kucing kuning kencing di kunci mobil kakek" sebanyak 3 kali tanpa salah!', category: 'kreatif' },
];

// Papan Ular Tangga 1 - 100
export interface BoardLadderSnake {
  from: number;
  to: number;
  type: 'ladder' | 'snake';
}

export const SNAKES_AND_LADDERS_MAP: BoardLadderSnake[] = [
  // Tangga (Naik)
  { from: 4, to: 25, type: 'ladder' },
  { from: 13, to: 46, type: 'ladder' },
  { from: 33, to: 49, type: 'ladder' },
  { from: 42, to: 63, type: 'ladder' },
  { from: 50, to: 69, type: 'ladder' },
  { from: 62, to: 81, type: 'ladder' },
  { from: 74, to: 92, type: 'ladder' },

  // Ular (Turun)
  { from: 27, to: 5, type: 'snake' },
  { from: 40, to: 3, type: 'snake' },
  { from: 43, to: 18, type: 'snake' },
  { from: 54, to: 31, type: 'snake' },
  { from: 66, to: 45, type: 'snake' },
  { from: 76, to: 58, type: 'snake' },
  { from: 89, to: 53, type: 'snake' },
  { from: 99, to: 41, type: 'snake' },
];

// Bank Kata Awal untuk Sambung Kata
export const STARTING_WORDS = [
  'SEKOLAH',
  'TAMANSISWA',
  'BELAJAR',
  'PINTAR',
  'SAHABAT',
  'GURU',
  'KELAS',
  'BUKU',
  'INDONESIA',
  'SEMANGAT',
  'CERIA',
  'BAHAGIA',
  'PRESTASI',
  'JUARA',
  'HARAPAN',
  'MERDEKA',
  'KREATIF',
  'DISIPLIN',
  'MANDIRI',
  'GOTONG',
];

// Two Truths and a Lie Solo Mode Question Bank (Edukasi & Pengetahuan Umum Sekolah)
export interface TwoTruthsSet {
  id: string;
  topic: string;
  statements: { text: string; isLie: boolean }[];
  explanation: string;
}

export const TWO_TRUTHS_PRESETS: TwoTruthsSet[] = [
  {
    id: 'tt1',
    topic: 'Sains & Luar Angkasa',
    statements: [
      { text: 'Planet Venus adalah planet terpanas di tata surya kita.', isLie: false },
      { text: 'Matahari adalah bintang yang paling dekat dengan Bumi.', isLie: false },
      { text: 'Bulan memiliki atmosfer yang tebal seperti Bumi sehingga ada angin kencang.', isLie: true },
    ],
    explanation: 'Bulan tidak memiliki atmosfer yang signifikan, sehingga tidak ada angin maupun cuaca di Bulan.',
  },
  {
    id: 'tt2',
    topic: 'Dunia Hewan',
    statements: [
      { text: 'Lumba-lumba bernapas menggunakan paru-paru, bukan insang.', isLie: false },
      { text: 'Bunglon mengubah warna kulitnya hanya untuk menyamar dari musuh saja.', isLie: true },
      { text: 'Jantung udang terletak di dalam bagian kepalanya.', isLie: false },
    ],
    explanation: 'Bunglon mengubah warna kulit terutama untuk mengatur suhu tubuh dan berkomunikasi/menunjukkan suasana hati.',
  },
  {
    id: 'tt3',
    topic: 'Geografi Indonesia',
    statements: [
      { text: 'Indonesia merupakan negara kepulauan terbesar di dunia.', isLie: false },
      { text: 'Pulau Kalimantan adalah pulau terbesar ketiga di dunia.', isLie: false },
      { text: 'Danau Toba di Sumatera Utara adalah danau buatan manusia terbesar di Asia.', isLie: true },
    ],
    explanation: 'Danau Toba adalah danau vulkanik alami yang terbentuk akibat letusan supervolcano purba, bukan danau buatan manusia.',
  },
  {
    id: 'tt4',
    topic: 'Sejarah Perguruan Tamansiswa',
    statements: [
      { text: 'Perguruan Tamansiswa didirikan oleh Ki Hadjar Dewantara pada tahun 1922.', isLie: false },
      { text: 'Semboyan terkenal Tamansiswa adalah "Ing Ngarsa Sung Tuladha, Ing Madya Mangun Karsa, Tut Wuri Handayani".', isLie: false },
      { text: 'Tamansiswa pertama kali didirikan di kota Batam Kepulauan Riau.', isLie: true },
    ],
    explanation: 'Perguruan Tamansiswa pertama kali didirikan di Yogyakarta pada tanggal 3 Juli 1922 oleh Ki Hadjar Dewantara.',
  },
  {
    id: 'tt5',
    topic: 'Tubuh Manusia',
    statements: [
      { text: 'Tulang paha adalah tulang terpanjang dan terkuat di tubuh manusia.', isLie: false },
      { text: 'Manusia bernapas menghirup gas karbon dioksida dan mengeluarkan oksigen murni.', isLie: true },
      { text: 'Darah manusia berwarna merah karena mengandung hemoglobin yang mengikat oksigen.', isLie: false },
    ],
    explanation: 'Manusia menghirup oksigen untuk metabolisme dan menghembuskan karbon dioksida sebagai zat sisa.',
  },
];
