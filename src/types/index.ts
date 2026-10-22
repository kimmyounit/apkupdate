export type UserRole = 'admin' | 'guru' | 'siswa' | 'kepala_sekolah' | 'tata_usaha' | 'panitia';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  jabatan?: string;
  initialPassword?: string;
  password?: string;
  passwordHash: string;
  salt: string;
  mustChangePassword?: boolean;
  isActive: boolean;
  isAlumni?: boolean; // Status Siswa: Siswa Aktif vs Alumni
  isVerified?: boolean; // Centang biru resmi (Verified Badge)
  nisn?: string;
  kelas?: string;
  classGrade?: string;
  classMajor?: string;
  qrToken: string; // Secure unique identification token for attendance
  avatarUrl?: string;
  bio?: string;
  phone?: string; // Nomor Telepon / WhatsApp
  email?: string; // Gmail / Email siswa
  lastUsernameChange?: string; // Catatan waktu perubahan username terakhir (maksimal 1x per 30 hari)
  usernameChangeHistory?: { oldUsername: string; newUsername: string; changedAt: string }[];
  following?: string[]; // Daftar ID pengguna yang diikuti
  followers?: string[]; // Daftar ID pengikut
  createdAt: string;
  updatedAt: string;
}

export interface PasswordResetRequest {
  id: string;
  userId: string;
  username: string;
  name: string;
  role: UserRole;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
  adminNote?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  teacherId?: string;
  teacherName: string;
  description: string;
  grade: string;
  schedule: string;
  imageUrl: string;
  room?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DigitalBook {
  id: string;
  title: string;
  author: string;
  category: string;
  coverUrl: string;
  description: string;
  totalPages: number;
  publishedYear: string;
  content: string[];
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'Penting' | 'Akademik' | 'Kegiatan' | 'Umum';
  authorName: string;
  authorRole: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// ARTIKEL GURU & METODE PEMBELAJARAN
// -------------------------------------------------------------
export interface TeacherArticle {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorSubject?: string;
  title: string;
  summary: string;
  content: string;
  category: 'Artikel Guru' | 'Metode Pembelajaran';
  coverUrl?: string;
  isPublished: boolean; // Diterbitkan ke siswa atau masih draf
  likesCount?: number;
  readsCount?: number;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// KUIS SISWA
// -------------------------------------------------------------
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  teacherName: string;
  description: string;
  durationMinutes: number;
  passingScore: number;
  token: string;
  sourceType: 'interactive' | 'google_forms';
  externalUrl?: string;
  password?: string;
  scheduleStart?: string;
  scheduleEnd?: string;
  questions: QuizQuestion[];
  isActive: boolean;
  status?: 'active' | 'inactive' | 'scheduled';
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  studentId: string;
  studentName: string;
  username: string;
  tokenUsed: string;
  score: number;
  totalQuestions: number;
  correctAnswersCount: number;
  passed: boolean;
  answers: { questionId: string; selectedOption: number; isCorrect: boolean }[];
  completedAt: string;
}

// -------------------------------------------------------------
// ABSENSI & DATA KEHADIRAN (EVENT & HARIAN KELAS GURU)
// -------------------------------------------------------------
export type ClassAttendanceStatus = 'Hadir' | 'Izin' | 'Sakit' | 'Alpa' | 'hadir' | 'izin' | 'sakit' | 'alpa';

export interface ClassAttendanceEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  kelas?: string;
  studentKelas?: string;
  subjectName?: string;
  teacherId?: string;
  teacherName?: string;
  studentId: string;
  studentName: string;
  studentUsername?: string;
  status: ClassAttendanceStatus;
  notes?: string;
  method?: 'qr_scan' | 'manual';
  recordedBy?: string;
  recordedRole?: string;
  createdAt?: string;
}

export interface AttendanceEvent {
  id: string;
  name: string;
  category?: 'Event Sekolah' | 'Kegiatan OSIS' | 'Rapat OSIS' | 'Lomba Sekolah' | 'Kegiatan Khusus Siswa' | string;
  description?: string;
  location?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  isOpen?: boolean;
  isActive?: boolean;
  createdAt?: string;
  createdBy?: string;
  timestamp?: string;
  type?: string;
  studentName?: string;
  studentKelas?: string;
}

export interface AttendanceRecord {
  id: string;
  eventId: string;
  eventName: string;
  studentId: string;
  studentName: string;
  username: string;
  kelas?: string;
  verifiedAt: string;
  verifiedBy: string;
  status: 'TELAH MASUK' | 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';
  verificationResult: 'BERHASIL';
  notes?: string;
}

export type ScanVerificationStatus =
  | 'SUCCESS'
  | 'ALREADY_SCANNED'
  | 'INVALID_QR'
  | 'ACCOUNT_INACTIVE'
  | 'SESSION_CLOSED'
  | 'SERVER_ERROR';

export interface ScanResultPayload {
  status: ScanVerificationStatus;
  message: string;
  record?: AttendanceRecord;
  student?: {
    id: string;
    name: string;
    username: string;
    kelas?: string;
  };
  event?: {
    id: string;
    name: string;
  };
  scanTime?: string;
}

// -------------------------------------------------------------
// POSTINGAN & FEED SOSIAL SISWA
// -------------------------------------------------------------
export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

export interface StudentPost {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorKelas?: string;
  authorAvatar?: string;
  authorIsVerified?: boolean;
  caption: string;
  mediaType: 'photo' | 'video' | 'none';
  mediaUrl?: string;
  mediaName?: string;
  likes: string[];
  comments: PostComment[];
  createdAt: string;
}

export interface Story {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string;
  authorKelas?: string;
  authorIsVerified?: boolean;
  mediaType: 'photo' | 'video';
  mediaUrl: string;
  caption?: string;
  createdAt: string;
  expiresAt: string;
}

export interface PersonalNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// ADMINISTRASI SEKOLAH / TATA USAHA (TU) & CHAT RESMI
// -------------------------------------------------------------
export interface TuitionBill {
  id: string;
  studentId: string;
  studentName: string;
  studentUsername: string;
  studentKelas: string;
  title: string;
  category: 'SPP' | 'Uang Gedung' | 'Seragam' | 'Ujian' | 'Lainnya';
  amount: number;
  dueDate: string;
  status: 'belum_lunas' | 'menunggu_verifikasi' | 'lunas';
  paidAt?: string;
  paymentProofUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface TuitionTransaction {
  id: string;
  billId?: string;
  studentId?: string;
  studentName?: string;
  studentKelas?: string;
  amount: number;
  type: 'pemasukan' | 'pengeluaran';
  category: string;
  paymentMethod: 'Transfer Bank' | 'Tunai / Kasir TU' | 'QRIS' | 'Virtual Account';
  verifiedBy: string;
  verifiedAt: string;
  receiptNumber: string; // No Kwitansi resmi KW-2026-XXXX
  description: string;
  createdAt?: string;
  notes?: string;
}

export interface TuDocument {
  id: string;
  title: string;
  docNumber: string;
  category: 'Surat Masuk' | 'Surat Keluar' | 'Surat Keterangan Siswa' | 'Arsip Ijazah' | 'Dokumen Kurikulum';
  date: string;
  recipientOrSender: string;
  fileUrl?: string;
  status: 'Arsip' | 'Menunggu TTD' | 'Selesai';
  notes?: string;
  createdAt: string;
}

export interface TuChatMessage {
  id: string;
  studentId: string;
  studentName: string;
  studentKelas?: string;
  senderRole: 'siswa' | 'tata_usaha';
  senderName: string;
  message: string;
  proofUrl?: string;
  billId?: string;
  createdAt: string;
  isReadByTu?: boolean;
  isReadByStudent?: boolean;
}

// -------------------------------------------------------------
// NOTIFIKASI SISTEM
// -------------------------------------------------------------
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'announcement' | 'subject_change' | 'general' | 'tuition' | 'article';
  isImportant?: boolean;
  linkType?: 'announcement' | 'subject' | 'quiz' | 'tuition' | 'article' | 'none';
  linkId?: string;
  targetRole?: UserRole;
  targetClass?: string;
  targetUserId?: string;
  readBy: string[];
  deletedBy: string[];
  createdAt: string;
}
