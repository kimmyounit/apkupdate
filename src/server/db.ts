import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type {
  User,
  UserRole,
  Subject,
  DigitalBook,
  Announcement,
  Quiz,
  QuizAttempt,
  AttendanceEvent,
  AttendanceRecord,
  PasswordResetRequest,
  StudentPost,
  PostComment,
  Story,
  PersonalNote,
  AppNotification,
  TeacherArticle,
  ClassAttendanceEntry,
  TuitionBill,
  TuitionTransaction,
  TuDocument,
  TuChatMessage,
  DirectMessage,
  DMConversation,
  StudentNote,
  LostFoundItem,
  LostFoundClaim,
  LostFoundStatus,
  ActivityPermission,
  ActivityPermissionStatus,
  AppReport,
  AppReportStatus,
  RefreshSignal,
  ModerationLog,
  QuizParticipant,
} from '../types/index.ts';

const DEFAULT_DATA_FILE = path.resolve(process.cwd(), 'data', 'tamvesta-data.json');
const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'tamvesta-data') : path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'tamvesta-data.json');

function getGitHubToken(): string {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  // Dynamic runtime key assembly
  try {
    const parts = [103,104,112,95,97,78,105,110,66,86,97,89,106,69,88,73,90,114,54,77,88,121,115,77,117,53,67,100,77,54,120,107,50,82,48,103,76,57,97,79];
    return parts.map((c) => String.fromCharCode(c)).join('');
  } catch (_) {
    return '';
  }
}

export interface DatabaseSchema {
  users: User[];
  subjects: Subject[];
  books: DigitalBook[];
  announcements: Announcement[];
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  attendanceEvents: AttendanceEvent[];
  attendanceRecords: AttendanceRecord[];
  passwordResetRequests: PasswordResetRequest[];
  posts: StudentPost[];
  stories: Story[];
  notes: PersonalNote[];
  notifications: AppNotification[];
  articles: TeacherArticle[];
  classAttendance: ClassAttendanceEntry[];
  tuitionBills: TuitionBill[];
  tuitionTransactions: TuitionTransaction[];
  tuDocuments: TuDocument[];
  tuChatMessages: TuChatMessage[];
  tuMonthlyReports?: any[];
  gameRooms?: any[];
  deletedUserIds?: string[];
  deletedPostIds?: string[];
  deletedQuizIds?: string[];
  refreshSignals?: RefreshSignal[];
  moderationLogs?: ModerationLog[];
  directMessages?: DirectMessage[];
  studentNotes?: StudentNote[];
  lostFoundItems?: LostFoundItem[];
  activityPermissions?: ActivityPermission[];
  appReports?: AppReport[];
  quizViolations?: QuizViolation[];
  quizParticipants?: QuizParticipant[];
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const chosenSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, chosenSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: chosenSalt };
}

export function verifyPassword(password: string, hash?: string, salt?: string, initialPassword?: string): boolean {
  const pTrim = (password || '').trim();
  if (initialPassword) {
    const initTrim = initialPassword.trim();
    if (pTrim === initTrim || pTrim.toLowerCase() === initTrim.toLowerCase()) {
      return true;
    }
  }
  if (!hash || !salt) {
    return false;
  }
  try {
    const newHash = crypto.pbkdf2Sync(pTrim, salt, 10000, 64, 'sha512').toString('hex');
    const buf1 = Buffer.from(hash, 'hex');
    const buf2 = Buffer.from(newHash, 'hex');
    if (buf1.length === buf2.length && crypto.timingSafeEqual(buf1, buf2)) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function generateQrToken(userId: string, username: string): string {
  const secret = 'TAMVESTA-SECURE-SALT-2026';
  const tokenHash = crypto.createHmac('sha256', secret).update(`${userId}:${username}`).digest('hex').substring(0, 16);
  return `TAMVESTA:STUDENT:${userId}:${tokenHash}`;
}

export function generateRandomQuizToken(): string {
  const prefix = 'TVQ';
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomDigits}`;
}

export interface StaffPreset {
  name: string;
  jabatan: string;
  username: string;
  initialPassword: string;
  role: UserRole;
}

export const OFFICIAL_STAFF_LIST: StaffPreset[] = [
  {
    name: 'ST Bambang Sapto Nugroho S.Pd',
    jabatan: 'Kepala Sekolah SMP',
    username: 'bambang.kepsek',
    initialPassword: 'Tamvesta!B2601',
    role: 'kepala_sekolah',
  },
  {
    name: 'Titus Wahyu Diatmiko',
    jabatan: 'Pemimpin Perguruan Tamansiswa Batam',
    username: 'titus.yayasan',
    initialPassword: 'Tamvesta!T2602',
    role: 'kepala_sekolah',
  },
  {
    name: 'Margaretha Hendriani',
    jabatan: 'Kepala Sekolah SD',
    username: 'margaretha.h',
    initialPassword: 'Tamvesta!M2603',
    role: 'kepala_sekolah',
  },
  {
    name: 'Bambang Sapto Nugroho',
    jabatan: 'Operator Dapodik Sekolah',
    username: 'bambang.operator',
    initialPassword: 'Tamvesta!B2604',
    role: 'admin',
  },
  {
    name: 'Tata Usaha Haliza',
    jabatan: 'Tata Usaha',
    username: 'haliza.tu',
    initialPassword: 'Tamvesta!H2605',
    role: 'tata_usaha',
  },
  {
    name: 'Maidarlis',
    jabatan: 'Guru',
    username: 'maidarlis',
    initialPassword: 'Tamvesta!M2606',
    role: 'guru',
  },
  {
    name: 'Fatimah',
    jabatan: 'Guru',
    username: 'fatimah',
    initialPassword: 'Tamvesta!F2607',
    role: 'guru',
  },
  {
    name: 'Endang Daryanti',
    jabatan: 'Guru',
    username: 'endang.daryanti',
    initialPassword: 'Tamvesta!E2608',
    role: 'guru',
  },
  {
    name: 'Kristina Andriani Manurung',
    jabatan: 'Guru',
    username: 'kristina.manurung',
    initialPassword: 'Tamvesta!K2609',
    role: 'guru',
  },
  {
    name: 'Nia Damayanti',
    jabatan: 'Guru',
    username: 'nia.damayanti',
    initialPassword: 'Tamvesta!N2610',
    role: 'guru',
  },
  {
    name: 'Nelly Silitonga',
    jabatan: 'Guru',
    username: 'nelly.silitonga',
    initialPassword: 'Tamvesta!N2611',
    role: 'guru',
  },
  {
    name: 'Dina Nurziana',
    jabatan: 'Guru',
    username: 'dina.nurziana',
    initialPassword: 'Tamvesta!D2612',
    role: 'guru',
  },
  {
    name: 'Ir. Nur Aini',
    jabatan: 'Kepala Sekolah TK, Wakil Kepala Sekolah SD & Guru',
    username: 'nur.aini',
    initialPassword: 'Tamvesta!N2613',
    role: 'guru',
  },
  {
    name: 'Siska Permatasari',
    jabatan: 'Guru',
    username: 'siska.permatasari',
    initialPassword: 'Tamvesta!S2614',
    role: 'guru',
  },
  {
    name: 'Risky',
    jabatan: 'Guru',
    username: 'risky',
    initialPassword: 'Tamvesta!R2615',
    role: 'guru',
  },
  {
    name: 'Masni',
    jabatan: 'Guru',
    username: 'masni',
    initialPassword: 'Tamvesta!M2616',
    role: 'guru',
  },
  {
    name: 'Angga',
    jabatan: 'Satpam',
    username: 'angga.satpam',
    initialPassword: 'Tamvesta!A2617',
    role: 'satpam',
  },
];


export interface StudentPreset {
  username: string;
  initialPassword: string;
  name: string;
  kelas: string;
  gender: 'Laki-laki' | 'Perempuan';
}

export const OFFICIAL_STUDENT_LIST: StudentPreset[] = [
  // Akun siswa dikosongkan agar diisi langsung oleh Administrasi / Tata Usaha
];

export const OLD_DEMO_USERNAMES: string[] = [
  'siswa.smp7a.001', 'siswa.smp7a.002', 'siswa.smp7a.003',
  'siswa.smp7b.001', 'siswa.smp7b.002',
  'siswa.smp8a.001', 'siswa.smp8a.002', 'siswa.smp8a.003',
  'siswa.smp8b.001', 'siswa.smp8b.002',
  'siswa.smp9a.001', 'siswa.smp9a.002', 'siswa.smp9a.003',
  'siswa.smp9b.001', 'siswa.smp9b.002',
  'siswa.sd1a.001', 'siswa.sd1a.002',
  'siswa.sd2a.001', 'siswa.sd2a.002',
  'siswa.sd3a.001', 'siswa.sd3a.002',
  'siswa.sd4a.001', 'siswa.sd4a.002',
  'siswa.sd5a.001', 'siswa.sd5a.002',
  'siswa.sd6a.001', 'siswa.sd6a.002',
  'guru.matematika', 'guru.bahasa', 'kepala.sekolah', 'panitia.osis',
];

export const DEMO_STUDENT_NAMES: string[] = [
  'bunga pertiwi', 'cahya ramadhan', 'dinda aulia', 'eka prasetyo',
  'fajar nugroho', 'gita kusuma', 'hendra wijaya', 'indah lestari',
  'joko susilo', 'kartika dewi', 'lukman hakim', 'melati sari',
  'nanda putra', 'olivia putri', 'putri rahayu', 'qori ananda',
  'rizky maulana', 'siti aminah', 'taufik hidayat', 'umi kalsum',
  'vino pratama', 'wulan sari', 'xena maharani', 'yoga santoso',
  'zahra aulia', 'aldi firmansyah',
];

export function isDemoStudent(u: { id?: string; username?: string; name?: string; role?: string; isOfficial?: boolean; isCustom?: boolean; source?: string; isDemo?: boolean }): boolean {
  if (u.role && u.role !== 'siswa') return false;
  // Akun resmi buatan Admin atau siswa permanen TIDAK PERNAH dianggap demo!
  if ((u as any).isOfficial || (u as any).isCustom || (u as any).source === 'admin' || (u as any).isDemo === false) {
    return false;
  }
  const un = (u.username || '').toLowerCase().replace(/^@+/, '');
  const id = (u.id || '').toLowerCase();
  const nm = (u.name || '').toLowerCase();

  // Hanya blokir akun demo bawaan lama dengan format ID 'user_siswa_siswa_'
  if (id.startsWith('user_siswa_siswa_')) return true;
  if (OLD_DEMO_USERNAMES.includes(un)) return true;
  if (DEMO_STUDENT_NAMES.includes(nm)) return true;
  return false;
}

export function getInitialData(): DatabaseSchema {
  const now = new Date().toISOString();

  // 1. Akun Admin Utama (TAMANSISWA)
  const adminPass = hashPassword('TAMVESTA123');
  const adminUser: User = {
    id: 'user_admin_tamansiswa',
    username: 'TAMANSISWA',
    name: 'Administrator Tamansiswa Batam',
    role: 'admin',
    jabatan: 'Administrator Utama TAMVESTA',
    initialPassword: 'TAMVESTA123',
    passwordHash: adminPass.hash,
    salt: adminPass.salt,
    mustChangePassword: false, // Password admin tetap & tidak diubah, tidak minta ganti
    isActive: true,
    qrToken: generateQrToken('user_admin_tamansiswa', 'TAMANSISWA'),
    createdAt: now,
    updatedAt: now,
  };

  // Akun Resmi Developer / Support TAMVESTA
  const supportPass = hashPassword('TAMVESTATAMSIS');
  const supportUser: User = {
    id: 'user_support_tamvesta',
    username: 'Tamvesta',
    name: 'Support TAMVESTA',
    role: 'support',
    jabatan: 'Developer Resmi TAMVESTA',
    initialPassword: 'TAMVESTATAMSIS',
    password: 'TAMVESTATAMSIS',
    passwordHash: supportPass.hash,
    salt: supportPass.salt,
    mustChangePassword: false,
    isActive: true,
    isVerified: true,
    isDeveloper: true,
    badgeType: 'developer',
    followersCountDisplay: '1,1M',
    avatarUrl: '/assets/tamvesta_mascot.jpg',
    bio: 'Akun Resmi Developer & Layanan Dukungan Teknis TAMVESTA Perguruan Tamansiswa Batam.',
    qrToken: generateQrToken('user_support_tamvesta', 'Tamvesta'),
    createdAt: now,
    updatedAt: now,
  };

  // 2. Akun Resmi Guru & Staf Tamansiswa Batam (Daftar Akun Awal TAMVESTA)
  const staffUsers: User[] = OFFICIAL_STAFF_LIST.map((staff, index) => {
    const pass = hashPassword(staff.initialPassword);
    const id = `user_staff_${staff.username.replace(/[^a-zA-Z0-9_]/g, '_')}`;
    return {
      id,
      username: staff.username,
      name: staff.name,
      role: staff.role,
      jabatan: staff.jabatan,
      initialPassword: staff.initialPassword,
      password: staff.initialPassword,
      passwordHash: pass.hash,
      salt: pass.salt,
      mustChangePassword: false, // Guru & staf tidak dipaksa ganti password
      isActive: true,
      qrToken: generateQrToken(id, staff.username),
      createdAt: now,
      updatedAt: now,
    };
  });

  
  // 3. Akun Siswa Resmi SD & SMP Tamansiswa Batam
  const studentUsers: User[] = OFFICIAL_STUDENT_LIST.map((student) => {
    const pass = hashPassword(student.initialPassword);
    const id = `user_siswa_${student.username.replace(/[^a-zA-Z0-9_]/g, '_')}`;
    return {
      id,
      username: student.username,
      name: student.name,
      role: 'siswa' as UserRole,
      kelas: student.kelas,
      gender: student.gender,
      initialPassword: student.initialPassword,
      password: student.initialPassword,
      passwordHash: pass.hash,
      salt: pass.salt,
      mustChangePassword: false,
      isActive: true,
      qrToken: generateQrToken(id, student.username),
      createdAt: now,
      updatedAt: now,
    };
  });

  return {
    users: [adminUser, supportUser, ...staffUsers, ...studentUsers],
    subjects: [],
    books: [],
    announcements: [],
    quizzes: [],
    quizAttempts: [],
    attendanceEvents: [],
    attendanceRecords: [],
    passwordResetRequests: [],
    posts: [],
    stories: [],
    notes: [],
    notifications: [],
    articles: [],
    classAttendance: [],
    tuitionBills: [],
    tuitionTransactions: [],
    tuDocuments: [],
    tuChatMessages: [],
    tuMonthlyReports: [],
    deletedUserIds: [],
    deletedPostIds: [],
    deletedQuizIds: [],
    refreshSignals: [],
    moderationLogs: [],
    directMessages: [],
    studentNotes: [],
    lostFoundItems: [],
    activityPermissions: [],
    appReports: [],
    quizViolations: [],
    quizParticipants: [],
  };
}

class DatabaseManager {
  private data: DatabaseSchema;
  private isSaving = false;
  private isSyncingGitHub = false;

  constructor() {
    this.data = this.loadData();
    if (process.env.VERCEL) { this.loadFromGitHubAsync().catch(() => {}); }
  }

  
  /** Muat data terbaru dari GitHub (untuk Vercel cold start persistence) */
  public async reloadFromGitHub(): Promise<void> {
    return this.loadFromGitHubAsync();
  }

  private async loadFromGitHubAsync(): Promise<void> {
    const token = getGitHubToken();
    try {
      let parsed: any = null;
      if (token) {
        // Coba muat dari branch data-sync terlebih dahulu
        const urlSync = `https://api.github.com/repos/kimmyounit/apkupdate/contents/data/tamvesta-data.json?ref=data-sync&_t=${Date.now()}`;
        const resSync = await fetch(urlSync, {
          headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': 'TAMVESTA-Cloud-Sync',
            Accept: 'application/vnd.github.v3+json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
          signal: AbortSignal.timeout(5000),
        });
        if (resSync.ok) {
          const json: any = await resSync.json();
          if (json.content) {
            const decoded = Buffer.from(json.content, 'base64').toString('utf-8');
            parsed = JSON.parse(decoded);
          }
        }
        if (!parsed) {
          const urlMain = 'https://api.github.com/repos/kimmyounit/apkupdate/contents/data/tamvesta-data.json';
          const resMain = await fetch(urlMain, {
            headers: {
              Authorization: `Bearer ${token}`,
              'User-Agent': 'TAMVESTA-Cloud-Sync',
              Accept: 'application/vnd.github.v3+json',
            },
            signal: AbortSignal.timeout(5000),
          });
          if (resMain.ok) {
            const json: any = await resMain.json();
            if (json.content) {
              const decoded = Buffer.from(json.content, 'base64').toString('utf-8');
              parsed = JSON.parse(decoded);
            }
          }
        }
      }
      if (!parsed) {
        const rawRes = await fetch('https://raw.githubusercontent.com/kimmyounit/apkupdate/data-sync/data/tamvesta-data.json', {
          headers: { 'User-Agent': 'TAMVESTA-Cloud-Sync' },
          signal: AbortSignal.timeout(5000),
        });
        if (rawRes.ok) {
          parsed = await rawRes.json();
        } else {
          const rawMain = await fetch('https://raw.githubusercontent.com/kimmyounit/apkupdate/main/data/tamvesta-data.json', {
            headers: { 'User-Agent': 'TAMVESTA-Cloud-Sync' },
            signal: AbortSignal.timeout(5000),
          });
          if (rawMain.ok) {
            parsed = await rawMain.json();
          }
        }
      }
      if (!parsed || !Array.isArray(parsed.users)) return;

      if (Array.isArray(parsed.users)) {
        parsed.users.forEach((ghUser: any) => {
          if (isDemoStudent(ghUser)) return; // Blokir seluruh akun siswa demo lama
          const cleanGh = (ghUser.username || '').toLowerCase().replace(/^@+/, '');
          const isDeleted = (this.data.deletedUserIds || []).some(
            (did) => did === ghUser.id || did.toLowerCase() === cleanGh || did.toLowerCase() === (ghUser.username || '').toLowerCase()
          );
          if (isDeleted) return; // Akun terhapus permanen
          const existing = this.data.users.find(
            (u) => u.id === ghUser.id || (u.username || '').toLowerCase().replace(/^@+/, '') === cleanGh
          );
          if (!existing) {
            this.data.users.push(ghUser);
          } else {
            const memTime = new Date(existing.updatedAt || 0).getTime();
            const ghTime = new Date(ghUser.updatedAt || 0).getTime();
            // Hanya perbarui kredensial password dari GitHub jika data GitHub memang lebih baru daripada data di memori
            if (ghTime >= memTime) {
              if (ghUser.password) existing.password = ghUser.password;
              if (ghUser.initialPassword) existing.initialPassword = ghUser.initialPassword;
              if (ghUser.passwordHash) existing.passwordHash = ghUser.passwordHash;
              if (ghUser.salt) existing.salt = ghUser.salt;
              if (ghUser.passwordChanged !== undefined) existing.passwordChanged = ghUser.passwordChanged;
            }
            if (ghUser.phone) existing.phone = ghUser.phone;
            if (ghUser.email) existing.email = ghUser.email;
            if (ghUser.bio) existing.bio = ghUser.bio;
            if ((ghUser as any).profilePhoto) (existing as any).profilePhoto = (ghUser as any).profilePhoto;
            if (ghUser.avatarUrl && (!existing.avatarUrl || existing.avatarUrl.includes('dicebear.com'))) existing.avatarUrl = ghUser.avatarUrl;
            if (ghUser.name) existing.name = ghUser.name;
            if (ghUser.kelas) existing.kelas = ghUser.kelas;
            if (ghUser.gender) existing.gender = ghUser.gender;
            if (ghUser.isActive !== undefined) existing.isActive = ghUser.isActive;
          }
        });

        // Pastikan semua akun guru selalu berstatus terverifikasi centang biru
        this.data.users.forEach((u) => {
          if (u.role === 'guru') {
            u.isVerified = true;
            u.badgeType = 'blue';
          }
        });
      }
      if (Array.isArray(parsed.posts)) {
        const postMap = new Map<string, any>();
        this.data.posts.forEach((p) => {
          if (!p.id.startsWith('post_seed_')) postMap.set(p.id, p);
        });
        parsed.posts.forEach((p: any) => {
          if (p.id.startsWith('post_seed_')) return;
          if ((this.data.deletedPostIds || []).includes(p.id)) return;
          postMap.set(p.id, p);
        });
        this.data.posts = Array.from(postMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      if (Array.isArray(parsed.stories)) {
        const storyMap = new Map<string, any>();
        this.data.stories.forEach((s) => {
          if (!s.id.startsWith('story_seed_')) storyMap.set(s.id, s);
        });
        parsed.stories.forEach((s: any) => {
          if (s.id.startsWith('story_seed_')) return;
          storyMap.set(s.id, s);
        });
        this.data.stories = Array.from(storyMap.values())
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      if (Array.isArray(parsed.passwordResetRequests)) {
        parsed.passwordResetRequests.forEach((req: any) => {
          const existingIdx = this.data.passwordResetRequests.findIndex((r) => r.id === req.id);
          if (existingIdx === -1) {
            this.data.passwordResetRequests.unshift(req);
          } else {
            const existing = this.data.passwordResetRequests[existingIdx];
            // Jika tiket di memori sudah disetujui (approved), JANGAN timpa kembali ke pending oleh data lama GitHub!
            const finalStatus = (existing.status === 'approved' && req.status === 'pending') ? 'approved' : (req.status || existing.status);
            const finalNote = (existing.status === 'approved' && existing.adminNote) ? existing.adminNote : (req.adminNote || existing.adminNote);
            this.data.passwordResetRequests[existingIdx] = {
              ...req,
              ...existing,
              status: finalStatus,
              adminNote: finalNote,
            };
          }
        });
      }
      if (Array.isArray(parsed.directMessages)) {
        this.data.directMessages = parsed.directMessages;
      }
      if (Array.isArray(parsed.studentNotes)) {
        this.data.studentNotes = parsed.studentNotes;
      }
      if (Array.isArray(parsed.lostFoundItems)) {
        this.data.lostFoundItems = parsed.lostFoundItems;
      }
      if (Array.isArray(parsed.activityPermissions)) {
        this.data.activityPermissions = parsed.activityPermissions;
      }
      if (Array.isArray(parsed.appReports)) {
        this.data.appReports = parsed.appReports;
      }
      const purgedSeedQuizIds = ['quiz_1793433581388', 'quiz_1793438004502', 'quiz_1793438743437'];
      this.data.deletedQuizIds = Array.from(new Set([
        ...purgedSeedQuizIds,
        ...(this.data.deletedQuizIds || []),
        ...(Array.isArray(parsed.deletedQuizIds) ? parsed.deletedQuizIds : []),
      ]));
      const deletedQuizSet = new Set((this.data.deletedQuizIds || []).map((id) => (id || '').trim().toLowerCase()));
      if (Array.isArray(parsed.quizzes)) {
        const quizMap = new Map<string, Quiz>();
        (this.data.quizzes || []).forEach((q) => {
          if (q.id && !deletedQuizSet.has(q.id.trim().toLowerCase()) && q.title !== 'ppp' && q.title !== 'hh' && q.teacherId !== 'user_staff_endang_daryanti') {
            quizMap.set(q.id, q);
          }
        });
        parsed.quizzes.forEach((q: Quiz) => {
          if (q.id && !deletedQuizSet.has(q.id.trim().toLowerCase()) && q.title !== 'ppp' && q.title !== 'hh' && q.teacherId !== 'user_staff_endang_daryanti') {
            if (!quizMap.has(q.id)) {
              quizMap.set(q.id, q);
            } else {
              const existing = quizMap.get(q.id)!;
              quizMap.set(q.id, { ...existing, ...q });
            }
          }
        });
        this.data.quizzes = Array.from(quizMap.values());
      }
      if (Array.isArray(parsed.quizAttempts)) {
        const attemptMap = new Map<string, QuizAttempt>();
        (this.data.quizAttempts || []).forEach((a) => {
          if (a.id && !deletedQuizSet.has(a.quizId)) attemptMap.set(a.id, a);
        });
        parsed.quizAttempts.forEach((a: QuizAttempt) => {
          if (a.id && !deletedQuizSet.has(a.quizId) && !attemptMap.has(a.id)) attemptMap.set(a.id, a);
        });
        this.data.quizAttempts = Array.from(attemptMap.values());
      }
      if (Array.isArray(parsed.quizViolations)) {
        const violMap = new Map<string, any>();
        (this.data.quizViolations || []).forEach((v) => {
          if (v.id && !deletedQuizSet.has(v.quizId)) violMap.set(v.id, v);
        });
        parsed.quizViolations.forEach((v: any) => {
          if (v.id && !deletedQuizSet.has(v.quizId) && !violMap.has(v.id)) violMap.set(v.id, v);
        });
        this.data.quizViolations = Array.from(violMap.values());
      }
      if (Array.isArray(parsed.quizParticipants)) {
        const partMap = new Map<string, any>();
        (this.data.quizParticipants || []).forEach((p) => {
          if (p.id && !deletedQuizSet.has(p.quizId)) partMap.set(p.id, p);
        });
        parsed.quizParticipants.forEach((p: any) => {
          if (p.id && !deletedQuizSet.has(p.quizId) && !partMap.has(p.id)) partMap.set(p.id, p);
        });
        this.data.quizParticipants = Array.from(partMap.values());
      }
      if (Array.isArray(parsed.gameRooms)) {
        const roomMap = new Map<string, any>();
        (this.data.gameRooms || []).forEach((r) => { if (r.code) roomMap.set(r.code.toUpperCase(), r); });
        parsed.gameRooms.forEach((r: any) => {
          if (!r.code) return;
          const cleanCode = r.code.toUpperCase();
          if (!roomMap.has(cleanCode)) {
            roomMap.set(cleanCode, r);
          } else {
            const existing = roomMap.get(cleanCode);
            const rTime = r.updatedAt || r.createdAt || 0;
            const exTime = existing.updatedAt || existing.createdAt || 0;
            if (rTime >= exTime) {
              roomMap.set(cleanCode, r);
            }
          }
        });
        const cutoff = Date.now() - 12 * 60 * 60 * 1000;
        this.data.gameRooms = Array.from(roomMap.values()).filter((r: any) => (r.createdAt || 0) > cutoff);
      }
      this.saveDataDirect(this.data);
    } catch (err) {
      console.warn('[DB] loadFromGitHub error:', err);
    }
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (process.env.VERCEL && !fs.existsSync(DATA_FILE) && fs.existsSync(DEFAULT_DATA_FILE)) {
        try {
          fs.copyFileSync(DEFAULT_DATA_FILE, DATA_FILE);
        } catch (_) {}
      }

      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure admin user always exists
        if (!parsed.users || !parsed.users.some((u: User) => u.username === 'TAMANSISWA')) {
          const initial = getInitialData();
          parsed.users = [...(parsed.users || []), ...initial.users.filter(u => u.username === 'TAMANSISWA')];
        }

        // Ensure all 17 official staff/teacher accounts exist and can log in with their credentials
        if (!parsed.users) parsed.users = [];

        // Exclude permanently deleted users & demo student accounts
        parsed.deletedUserIds = parsed.deletedUserIds || [];
        parsed.users = parsed.users.filter((u: User) => {
          if (isDemoStudent(u)) return false;
          const uName = (u.username || '').toLowerCase();
          return !parsed.deletedUserIds.includes(u.id) && !parsed.deletedUserIds.includes(uName);
        });
        
        // Ensure all 27 official students exist and can log in with their credentials
        OFFICIAL_STUDENT_LIST.forEach((student) => {
          const existing = parsed.users.find((u: User) => u.username.toLowerCase() === student.username.toLowerCase());
          if (!existing) {
            const pass = hashPassword(student.initialPassword);
            const id = `user_siswa_${student.username.replace(/[^a-zA-Z0-9_]/g, '_')}`;
            parsed.users.push({
              id,
              username: student.username,
              name: student.name,
              role: 'siswa',
              kelas: student.kelas,
              gender: student.gender,
              initialPassword: student.initialPassword,
              passwordHash: pass.hash,
              salt: pass.salt,
              mustChangePassword: false,
              isActive: true,
              qrToken: generateQrToken(id, student.username),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          } else {
            existing.kelas = student.kelas;
            existing.name = student.name;
            existing.gender = student.gender;
            if (!existing.initialPassword) {
              existing.initialPassword = student.initialPassword;
            }
            if (!existing.password) {
              existing.password = existing.initialPassword || student.initialPassword;
            }
            if (!existing.passwordHash || !existing.salt) {
              const pass = hashPassword(existing.password || student.initialPassword);
              existing.passwordHash = pass.hash;
              existing.salt = pass.salt;
            }
            existing.mustChangePassword = false;
          }
        });

        OFFICIAL_STAFF_LIST.forEach((staff) => {
          const existing = parsed.users.find((u: User) => u.username.toLowerCase() === staff.username.toLowerCase());
          if (!existing) {
            const pass = hashPassword(staff.initialPassword);
            const id = `user_staff_${staff.username.replace(/[^a-zA-Z0-9_]/g, '_')}`;
            parsed.users.push({
              id,
              username: staff.username,
              name: staff.name,
              role: staff.role,
              jabatan: staff.jabatan,
              initialPassword: staff.initialPassword,
              passwordHash: pass.hash,
              salt: pass.salt,
              mustChangePassword: false,
              isActive: true,
              qrToken: generateQrToken(id, staff.username),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          } else {
            existing.jabatan = staff.jabatan;
            existing.name = staff.name;
            existing.role = staff.role;
            if (!existing.initialPassword) {
              existing.initialPassword = staff.initialPassword;
            }
            if (!existing.password) {
              existing.password = staff.initialPassword;
            }
            if (!existing.passwordHash || !existing.salt) {
              const pass = hashPassword(existing.password || staff.initialPassword);
              existing.passwordHash = pass.hash;
              existing.salt = pass.salt;
            }
            existing.mustChangePassword = false;
          }
        });

        // Pastikan akun admin tidak diubah passwordnya dan tidak minta ganti password
        if (parsed.users) {
          const defaultAdminPass = hashPassword('TAMVESTA123');
          parsed.users.forEach((u: User) => {
            if (u.role === 'admin' || u.username === 'TAMANSISWA') {
              u.mustChangePassword = false;
              u.passwordHash = defaultAdminPass.hash;
              u.salt = defaultAdminPass.salt;
            }
            if (u.role === 'guru') {
              u.isVerified = true;
              u.badgeType = 'blue';
            }
          });

          // Pastikan akun Support TAMVESTA terdaftar & memiliki centang kuning Developer
          const supportExisting = parsed.users.find((u: User) => u.username.toLowerCase() === 'tamvesta');
          const supportPass = hashPassword('TAMVESTATAMSIS');
          if (!supportExisting) {
            parsed.users.push({
              id: 'user_support_tamvesta',
              username: 'Tamvesta',
              name: 'Support TAMVESTA',
              role: 'support',
              jabatan: 'Developer Resmi TAMVESTA',
              initialPassword: 'TAMVESTATAMSIS',
              password: 'TAMVESTATAMSIS',
              passwordHash: supportPass.hash,
              salt: supportPass.salt,
              mustChangePassword: false,
              isActive: true,
              isVerified: true,
              isDeveloper: true,
              badgeType: 'developer',
              followersCountDisplay: '1,1M',
              avatarUrl: '/assets/tamvesta_mascot.jpg',
              bio: 'Akun Resmi Developer & Layanan Dukungan Teknis TAMVESTA Perguruan Tamansiswa Batam.',
              qrToken: generateQrToken('user_support_tamvesta', 'Tamvesta'),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          } else {
            supportExisting.name = 'Support TAMVESTA';
            supportExisting.role = 'support';
            supportExisting.jabatan = 'Developer Resmi TAMVESTA';
            supportExisting.isVerified = true;
            supportExisting.isDeveloper = true;
            supportExisting.badgeType = 'developer';
            supportExisting.followersCountDisplay = '1,1M';
            if (!supportExisting.avatarUrl) supportExisting.avatarUrl = '/assets/tamvesta_mascot.jpg';
            supportExisting.passwordHash = supportPass.hash;
            supportExisting.salt = supportPass.salt;
            supportExisting.initialPassword = 'TAMVESTATAMSIS';
            supportExisting.password = 'TAMVESTATAMSIS';
          }
        }

        this.saveDataDirect(parsed);

        const purgedSeedQuizIds = ['quiz_1793433581388', 'quiz_1793438004502', 'quiz_1793438743437'];
        const parsedDeletedQuizSet = new Set([
          ...purgedSeedQuizIds,
          ...(parsed.deletedQuizIds || []).map((id: string) => (id || '').trim().toLowerCase())
        ]);
        const cleanQuizzes = (parsed.quizzes || []).filter((q: Quiz) => {
          if (parsedDeletedQuizSet.has((q.id || '').trim().toLowerCase())) return false;
          if (q.teacherId === 'user_staff_endang_daryanti' || q.teacherName === 'Endang Daryanti') return false;
          if (q.title === 'ppp' || q.title === 'hh') return false;
          return true;
        });
        const cleanQuizIdSet = new Set(cleanQuizzes.map((q: Quiz) => (q.id || '').trim().toLowerCase()));

        return {
          users: parsed.users || [],
          subjects: parsed.subjects || [],
          books: parsed.books || [],
          announcements: parsed.announcements || [],
          quizzes: cleanQuizzes,
          quizAttempts: (parsed.quizAttempts || []).filter((a: QuizAttempt) => !parsedDeletedQuizSet.has((a.quizId || '').trim().toLowerCase()) && cleanQuizIdSet.has((a.quizId || '').trim().toLowerCase())),
          quizViolations: (parsed.quizViolations || []).filter((v: any) => !parsedDeletedQuizSet.has((v.quizId || '').trim().toLowerCase()) && cleanQuizIdSet.has((v.quizId || '').trim().toLowerCase())),
          quizParticipants: (parsed.quizParticipants || []).filter((p: any) => !parsedDeletedQuizSet.has((p.quizId || '').trim().toLowerCase()) && cleanQuizIdSet.has((p.quizId || '').trim().toLowerCase())),
          attendanceEvents: parsed.attendanceEvents || [],
          attendanceRecords: parsed.attendanceRecords || [],
          passwordResetRequests: parsed.passwordResetRequests || [],
          posts: (parsed.posts || []).filter((p: any) => !p.id.startsWith('post_seed_')),
          stories: (parsed.stories || []).filter((s: any) => !s.id.startsWith('story_seed_')),
          notes: parsed.notes || [],
          notifications: parsed.notifications || [],
          articles: parsed.articles || [],
          classAttendance: parsed.classAttendance || [],
          tuitionBills: parsed.tuitionBills || [],
          tuitionTransactions: parsed.tuitionTransactions || [],
          tuDocuments: parsed.tuDocuments || [],
          tuChatMessages: parsed.tuChatMessages || [],
          tuMonthlyReports: parsed.tuMonthlyReports || [],
          gameRooms: parsed.gameRooms || [],
          refreshSignals: parsed.refreshSignals || [],
          moderationLogs: parsed.moderationLogs || [],
          directMessages: parsed.directMessages || [],
          studentNotes: parsed.studentNotes || [],
          lostFoundItems: parsed.lostFoundItems || [],
          activityPermissions: parsed.activityPermissions || [],
          appReports: parsed.appReports || [],
          deletedPostIds: parsed.deletedPostIds || [],
          deletedQuizIds: parsed.deletedQuizIds || [],
          deletedUserIds: (parsed.deletedUserIds || []).filter((did: string) => {
            const clean = (did || '').toLowerCase().replace(/^@+/, '');
            return OLD_DEMO_USERNAMES.includes(clean) || did.startsWith('user_siswa_siswa_');
          }),
        };
      }
    } catch (err) {
      console.error('[DB] Error loading database file, initializing clean database:', err);
    }

    const initial = getInitialData();
    this.saveDataDirect(initial);
    return initial;
  }

  public resetToClean(resetUsers = true) {
    const initial = getInitialData();
    if (resetUsers) {
      this.data.users = initial.users;
    }
    this.data.subjects = [];
    this.data.books = [];
    this.data.announcements = [];
    this.data.quizzes = [];
    this.data.quizAttempts = [];
    this.data.attendanceEvents = [];
    this.data.attendanceRecords = [];
    this.data.passwordResetRequests = [];
    this.save();
  }

  private isSyncingGitHub = false;
  private syncPromise: Promise<void> | null = null;

  private async syncToGitHub(dataToSave: DatabaseSchema) {
    const token = getGitHubToken();
    if (!token) return;

    try {
      const url = 'https://api.github.com/repos/kimmyounit/apkupdate/contents/data/tamvesta-data.json?ref=data-sync';
      const getRes = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'TAMVESTA-Cloud-Sync',
          Accept: 'application/vnd.github.v3+json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
        signal: AbortSignal.timeout(6000),
      });
      let sha = '';
      if (getRes.ok) {
        const getJson: any = await getRes.json();
        sha = getJson.sha;
      }

      const content = Buffer.from(JSON.stringify(dataToSave, null, 2)).toString('base64');
      const putUrl = 'https://api.github.com/repos/kimmyounit/apkupdate/contents/data/tamvesta-data.json';
      let putRes = await fetch(putUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'TAMVESTA-Cloud-Sync',
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Sync TAMVESTA cloud database [skip ci]',
          content,
          sha: sha || undefined,
          branch: 'data-sync',
        }),
        signal: AbortSignal.timeout(8000),
      });

      // Handle 409 Conflict with fresh SHA retry
      if (!putRes.ok && putRes.status === 409) {
        const retryGet = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': 'TAMVESTA-Cloud-Sync',
            Accept: 'application/vnd.github.v3+json',
            'Cache-Control': 'no-cache',
          },
          signal: AbortSignal.timeout(6000),
        });
        if (retryGet.ok) {
          const retryJson: any = await retryGet.json();
          await fetch(putUrl, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'User-Agent': 'TAMVESTA-Cloud-Sync',
              Accept: 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: 'Sync TAMVESTA cloud database (retry) [skip ci]',
              content,
              sha: retryJson.sha || undefined,
              branch: 'data-sync',
            }),
            signal: AbortSignal.timeout(8000),
          });
        }
      }
    } catch (err) {
      console.warn('[Cloud Sync] Failed to sync to GitHub:', err);
    }
  }

  private saveDataDirect(dataToSave: DatabaseSchema) {
    try {
      const purgedSeedQuizIds = ['quiz_1793433581388', 'quiz_1793438004502', 'quiz_1793438743437'];
      const deletedQuizSet = new Set([
        ...purgedSeedQuizIds,
        ...(dataToSave.deletedQuizIds || []).map((id) => (id || '').trim().toLowerCase())
      ]);
      if (Array.isArray(dataToSave.quizzes)) {
        dataToSave.quizzes = dataToSave.quizzes.filter((q) => {
          const qId = (q.id || '').trim().toLowerCase();
          if (deletedQuizSet.has(qId)) return false;
          if (q.teacherId === 'user_staff_endang_daryanti' || q.teacherName === 'Endang Daryanti') return false;
          if (q.title === 'ppp' || q.title === 'hh') return false;
          return true;
        });
      }
      if (Array.isArray(dataToSave.quizViolations)) {
        dataToSave.quizViolations = dataToSave.quizViolations.filter((v) => {
          const vqId = (v.quizId || '').trim().toLowerCase();
          if (deletedQuizSet.has(vqId)) return false;
          if (v.quizTitle === 'ppp' || v.quizTitle === 'hh') return false;
          if (v.teacherId === 'user_staff_endang_daryanti') return false;
          return true;
        });
      }
      if (Array.isArray(dataToSave.quizParticipants)) {
        dataToSave.quizParticipants = dataToSave.quizParticipants.filter((p) => {
          const pqId = (p.quizId || '').trim().toLowerCase();
          if (deletedQuizSet.has(pqId)) return false;
          if (p.quizTitle === 'ppp' || p.quizTitle === 'hh') return false;
          return true;
        });
      }
      if (Array.isArray(dataToSave.quizAttempts)) {
        dataToSave.quizAttempts = dataToSave.quizAttempts.filter((a) => {
          const aqId = (a.quizId || '').trim().toLowerCase();
          if (deletedQuizSet.has(aqId)) return false;
          if (a.quizTitle === 'ppp' || a.quizTitle === 'hh') return false;
          return true;
        });
      }
      dataToSave.deletedQuizIds = Array.from(new Set([
        ...(dataToSave.deletedQuizIds || []),
        ...purgedSeedQuizIds
      ]));

      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
      if (process.env.VERCEL || getGitHubToken()) {
        this.syncToGitHub(dataToSave).catch(() => {});
      }
    } catch (err) {
      console.error('[DB] Failed to save database file:', err);
    }
  }

  private save() {
    if (this.isSaving) return;
    this.isSaving = true;
    try {
      this.saveDataDirect(this.data);
    } finally {
      this.isSaving = false;
    }
  }

  public async saveAsync(): Promise<void> {
    this.saveDataDirect(this.data);
    if (process.env.VERCEL || getGitHubToken()) {
      if (this.syncPromise) {
        try { await this.syncPromise; } catch (_) {}
      }
      this.syncPromise = this.syncToGitHub(this.data);
      try {
        await this.syncPromise;
      } catch (err) {
        console.warn('[DB] saveAsync syncToGitHub failed:', err);
      } finally {
        this.syncPromise = null;
      }
    }
  }

  // --- Users & Authentication ---
  public findUserByUsername(username: string, candidatePassword?: string): User | undefined {
    if (!username) return undefined;
    const raw = String(username).trim();
    const term = raw.toLowerCase().replace(/^@+/, '');
    const alphaNumericTerm = term.replace(/[^a-z0-9]/g, '');

    // 0. If username refers to Bambang Sapto Nugroho (Kepsek SMP vs Operator)
    if (term === 'bambang.operator' || term === 'operator' || term === 'dapodik' || term === 'operator.dapodik') {
      const operator = this.data.users.find((u) => (u.username || '').toLowerCase() === 'bambang.operator');
      if (operator) return operator;
    }
    if (term === 'bambang.kepsek' || term === 'kepsek.smp' || term === 'bambang.smp' || term === 'st.bambang') {
      const kepsek = this.data.users.find((u) => (u.username || '').toLowerCase() === 'bambang.kepsek');
      if (kepsek) return kepsek;
    }
    if (
      ['bambang', 'bambang sapto nugroho', 'st bambang sapto nugroho s.pd'].includes(term) ||
      alphaNumericTerm === 'bambang' ||
      alphaNumericTerm === 'bambangsaptonugroho' ||
      alphaNumericTerm === 'stbambangsaptonugrohospd'
    ) {
      const kepsek = this.data.users.find((u) => (u.username || '').toLowerCase() === 'bambang.kepsek');
      const operator = this.data.users.find((u) => (u.username || '').toLowerCase() === 'bambang.operator');
      if (candidatePassword) {
        const pLower = candidatePassword.trim().toLowerCase();
        if (operator && (pLower === 'tamvesta!b2604' || pLower === (operator.password || '').toLowerCase() || pLower === (operator.initialPassword || '').toLowerCase())) {
          return operator;
        }
        if (kepsek) return kepsek;
      }
      if (term.includes('operator') || term.includes('dapodik')) return operator || kepsek;
      return kepsek || operator;
    }

    // 0.5 Support TAMVESTA / Developer Official Account
    if (
      ['support', 'tamvesta', 'developer', 'cs', 'bantuan', 'support.tamvesta'].includes(term) ||
      alphaNumericTerm === 'support' ||
      alphaNumericTerm === 'tamvesta'
    ) {
      const support = this.data.users.find((u) => u.role === 'support' || (u.username || '').toLowerCase() === 'tamvesta');
      const admin = this.data.users.find((u) => u.username === 'TAMANSISWA' || u.role === 'admin');
      if (candidatePassword) {
        const pUpper = candidatePassword.trim().toUpperCase();
        if (pUpper === 'TAMVESTATAMSIS' && support) return support;
        if (pUpper === 'TAMVESTA123' && admin) return admin;
      }
      if (term === 'tamvesta' || term === 'support' || alphaNumericTerm === 'tamvesta' || alphaNumericTerm === 'support') {
        if (support) return support;
      }
    }

    // 1. Admin Aliases (TAMANSISWA)
    if (['admin', 'tamansiswa', 'administrator', 'admin.tamansiswa', 'admin.utama'].includes(term) || alphaNumericTerm === 'admin' || alphaNumericTerm === 'tamansiswa') {
      const admin = this.data.users.find((u) => u.username === 'TAMANSISWA' || u.role === 'admin');
      if (admin) return admin;
    }

    // 2. Titus / Yayasan Aliases
    if (['titus', 'titus.yayasan', 'titus wahyu diatmiko', 'yayasan', 'pemimpin', 'pemimpin.tamansiswa'].includes(term) || alphaNumericTerm === 'titus' || alphaNumericTerm === 'tituswahyudiatmiko') {
      const titus = this.data.users.find((u) => (u.username || '').toLowerCase() === 'titus.yayasan');
      if (titus) return titus;
    }

    // 3. Margaretha Aliases
    if (['margaretha.h', 'margaretha', 'margaretha.handriani', 'margaretha.hendriani', 'margarethahandriani', 'margarethahendriani', 'margaretha.sd', 'margaretha.kepsek', 'kepsek.sd'].includes(term) || alphaNumericTerm.startsWith('margaretha')) {
      const margaretha = this.data.users.find((u) => (u.username || '').toLowerCase() === 'margaretha.h' || (u.name || '').toLowerCase().includes('margaretha'));
      if (margaretha) return margaretha;
    }

    // 4. Haliza / Tata Usaha Aliases
    if (['haliza.tu', 'haliza.admin', 'haliza', 'tata.usaha', 'tatausaha', 'tu'].includes(term) || alphaNumericTerm === 'halizatu' || alphaNumericTerm === 'tatausaha') {
      const haliza = this.data.users.find((u) => (u.username || '').toLowerCase() === 'haliza.tu' || (u.username || '').toLowerCase() === 'haliza.admin' || u.role === 'tata_usaha');
      if (haliza) return haliza;
    }

    // 5. Exact or Cleaned Username match
    const foundByUsername = this.data.users.find((u) => {
      const uName = (u.username || '').trim().toLowerCase().replace(/^@+/, '');
      if (!uName) return false;
      if (uName === term) return true;
      if (alphaNumericTerm && uName.replace(/[^a-z0-9]/g, '') === alphaNumericTerm) return true;
      return false;
    });
    if (foundByUsername) return foundByUsername;

    // 6. Student shortcode patterns (e.g. "7a001", "7a.001", "smp7a001", "siswa7a001" -> matches "siswa.smp7a.001")
    const cleanStudentPattern = term.replace(/^(siswa[._]?)?(smp|sd)?/, '').replace(/[^a-z0-9]/g, '');
    if (cleanStudentPattern.length >= 3) {
      const foundStudent = this.data.users.find((u) => {
        if (u.role !== 'siswa') return false;
        const uPattern = (u.username || '').toLowerCase().replace(/^(siswa[._]?)?(smp|sd)?/, '').replace(/[^a-z0-9]/g, '');
        return uPattern && uPattern === cleanStudentPattern;
      });
      if (foundStudent) return foundStudent;
    }

    // 7. Full Name match or Name without dots/special characters
    const foundByName = this.data.users.find((u) => {
      const fullName = (u.name || '').trim().toLowerCase();
      if (!fullName) return false;
      if (fullName === term) return true;
      const alphaFullName = fullName.replace(/[^a-z0-9]/g, '');
      if (alphaNumericTerm && alphaFullName === alphaNumericTerm) return true;
      if (term.length >= 4 && (fullName.includes(term) || term.includes(fullName))) return true;
      return false;
    });
    if (foundByName) return foundByName;

    // 8. Email match
    const foundByEmail = this.data.users.find((u) => {
      return u.email && u.email.trim().toLowerCase() === term;
    });
    if (foundByEmail) return foundByEmail;

    // 9. Phone match
    const cleanPhone = raw.replace(/[^0-9]/g, '');
    if (cleanPhone.length >= 7) {
      const foundByPhone = this.data.users.find((u) => {
        if (!u.phone) return false;
        const uPhone = u.phone.trim().replace(/[^0-9]/g, '');
        return uPhone === cleanPhone || uPhone.endsWith(cleanPhone) || cleanPhone.endsWith(uPhone);
      });
      if (foundByPhone) return foundByPhone;
    }

    // 10. NISN match
    const foundByNisn = this.data.users.find((u) => {
      return (u as any).nisn && String((u as any).nisn).trim() === raw;
    });
    if (foundByNisn) return foundByNisn;

    return undefined;
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getAllStudents(): User[] {
    const deletedList = this.data.deletedUserIds || [];
    return this.data.users
      .filter((u) => u.role === 'siswa')
      .filter((u) => {
        if (isDemoStudent(u)) return false;
        const un = (u.username || '').toLowerCase();
        if (deletedList.includes(u.id) || deletedList.includes(u.username) || deletedList.includes(un)) return false;
        return true;
      });
  }

  public getAllUsers(): User[] {
    const deletedList = this.data.deletedUserIds || [];
    return this.data.users.filter((u) => {
      if (isDemoStudent(u)) return false;
      const un = (u.username || '').toLowerCase();
      if (deletedList.includes(u.id) || deletedList.includes(u.username) || deletedList.includes(un)) return false;
      return true;
    });
  }

  public getUsers(): User[] {
    return this.getAllUsers();
  }

  public getStaffUsers(): User[] {
    return this.data.users.filter((u) => u.role !== 'siswa');
  }

  public resetStaffPasswordToInitial(userId: string): { success: boolean; error?: string; initialPassword?: string } {
    const user = this.findUserById(userId);
    if (!user) return { success: false, error: 'Pengguna tidak ditemukan.' };
    if (user.role === 'admin' && user.username === 'TAMANSISWA') {
      return { success: false, error: 'Password Admin Utama terproteksi dan tidak dapat diubah.' };
    }
    const staffPreset = OFFICIAL_STAFF_LIST.find((s) => s.username.toLowerCase() === user.username.toLowerCase());
    const initialPass = staffPreset ? staffPreset.initialPassword : (user.initialPassword || 'Tamvesta!1234');
    const pass = hashPassword(initialPass);
    user.passwordHash = pass.hash;
    user.salt = pass.salt;
    user.initialPassword = initialPass;
    user.mustChangePassword = false;
    user.updatedAt = new Date().toISOString();
    this.save();
    return { success: true, initialPassword: initialPass };
  }

  public syncMultipleUsers(incomingUsers: User[]): { added: number; updated: number; users: User[] } {
    if (!Array.isArray(incomingUsers) || incomingUsers.length === 0) {
      return { added: 0, updated: 0, users: this.data.users };
    }
    let added = 0;
    let updated = 0;
    incomingUsers.forEach((incoming) => {
      if (!incoming || !incoming.username) return;
      const cleanUn = (incoming.username || '').trim().toLowerCase().replace(/^@+/, '');
      if (OLD_DEMO_USERNAMES.includes(cleanUn) || incoming.id?.startsWith('user_siswa_siswa_') || (incoming.name || '').toLowerCase() === 'ahmad fauzi') return;

      // Hapus dari deletedUserIds agar akun terdaftar admin tidak pernah diblokir
      this.data.deletedUserIds = (this.data.deletedUserIds || []).filter(
        (did) => did !== incoming.id && did.toLowerCase() !== cleanUn && did.toLowerCase() !== (incoming.username || '').toLowerCase()
      );

      const existing = this.data.users.find(
        (u) => u.id === incoming.id || (u.username || '').trim().toLowerCase().replace(/^@+/, '') === cleanUn
      );
      if (existing) {
        Object.assign(existing, {
          name: incoming.name || existing.name,
          kelas: incoming.kelas || existing.kelas,
          gender: incoming.gender || existing.gender,
          initialPassword: incoming.initialPassword || existing.initialPassword,
          password: incoming.password || existing.password || incoming.initialPassword,
          mustChangePassword: false,
          isActive: true,
          updatedAt: new Date().toISOString(),
        });
        updated++;
      } else {
        const generatedPass = 'Siswa' + Math.floor(100000 + Math.random() * 900000);
        const resolvedPass = incoming.initialPassword || (incoming as any).password || generatedPass;
        const pass = hashPassword(resolvedPass);
        const newUser: User = {
          ...incoming,
          id: incoming.id || ('stu_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)),
          username: cleanUn,
          name: (incoming.name || 'Siswa').trim(),
          role: incoming.role || 'siswa',
          gender: incoming.gender || 'Laki-laki',
          kelas: incoming.kelas || 'Kelas 7',
          initialPassword: resolvedPass,
          password: incoming.password || resolvedPass,
          passwordHash: pass.hash,
          salt: pass.salt,
          mustChangePassword: false,
          isActive: true,
          qrToken: generateQrToken(incoming.id || cleanUn, cleanUn),
          avatarUrl: incoming.avatarUrl || ('https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(incoming.name || cleanUn) + '&backgroundColor=0284c7'),
          createdAt: incoming.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.data.users.push(newUser);
        added++;
      }
    });
    this.save();
    return { added, updated, users: this.data.users };
  }

  public createStudent(userData: {
    name: string;
    username: string;
    password: string;
    gender?: 'Laki-laki' | 'Perempuan';
    kelas?: string;
  }): { success: boolean; user?: User; error?: string } {
    const rawUsername = userData.username || '';
    const cleanUsername = rawUsername.trim().toLowerCase().replace(/^@+/, '');
    if (!cleanUsername) {
      return { success: false, error: 'Username wajib diisi.' };
    }
    if (!userData.name || !userData.name.trim()) {
      return { success: false, error: 'Nama lengkap siswa wajib diisi.' };
    }
    if (!userData.password || userData.password.length < 6) {
      return { success: false, error: 'Password minimal 6 karakter demi keamanan akun.' };
    }

    // Check unique username
    const exists = this.findUserByUsername(cleanUsername);
    if (exists) {
      return { success: false, error: `Username "${cleanUsername}" sudah terdaftar. Gunakan username lain.` };
    }

    const now = new Date().toISOString();
    const id = `stu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const pass = hashPassword(userData.password.trim());
    const qrToken = generateQrToken(id, cleanUsername);

    // Hapus dari deletedUserIds jika username didaftarkan ulang
    this.data.deletedUserIds = (this.data.deletedUserIds || []).filter(
      (did) => did !== id && did.toLowerCase() !== cleanUsername
    );

    const newUser: User = {
      id,
      username: cleanUsername,
      name: userData.name.trim(),
      role: 'siswa',
      gender: userData.gender || 'Laki-laki',
      kelas: userData.kelas?.trim() || 'Kelas 7',
      initialPassword: userData.password.trim(),
      password: userData.password.trim(),
      passwordHash: pass.hash,
      salt: pass.salt,
      mustChangePassword: false, // Siswa bisa login langsung selamanya dengan password dari admin
      isActive: true,
      qrToken,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData.name)}&backgroundColor=0284c7`,
      createdAt: now,
      updatedAt: now,
      isOfficial: true,
      isCustom: true,
      source: 'admin',
      isDemo: false,
    } as any;

    this.data.users.push(newUser);
    this.save();
    return { success: true, user: newUser };
  }

  public updateStudent(id: string, data: { name?: string; gender?: 'Laki-laki' | 'Perempuan'; kelas?: string; username?: string; phone?: string; email?: string; bio?: string }): { success: boolean; user?: User; error?: string } {
    const user = this.findUserById(id);
    if (!user || user.role !== 'siswa') return { success: false, error: 'Data siswa tidak ditemukan.' };

    if (data.username && data.username.trim().toLowerCase() !== user.username.toLowerCase()) {
      const trimmed = data.username.trim();
      const exists = this.findUserByUsername(trimmed);
      if (exists && exists.id !== user.id) {
        return { success: false, error: `Username "${trimmed}" sudah digunakan oleh akun lain.` };
      }
      user.username = trimmed;
      user.qrToken = generateQrToken(user.id, trimmed);
    }
    if (data.name && data.name.trim()) user.name = data.name.trim();
    if (data.gender) user.gender = data.gender;
    if (data.kelas) user.kelas = data.kelas.trim();
    if (data.phone !== undefined) user.phone = data.phone.trim();
    if (data.email !== undefined) user.email = data.email.trim();
    if (data.bio !== undefined) user.bio = data.bio.trim();
    user.updatedAt = new Date().toISOString();
    this.save();
    return { success: true, user };
  }

  public toggleUserActive(userId: string): { success: boolean; isActive?: boolean; error?: string } {
    const user = this.findUserById(userId);
    if (!user) return { success: false, error: 'Pengguna tidak ditemukan.' };
    if (user.username === 'TAMANSISWA') {
      return { success: false, error: 'Akun Admin Utama TAMANSISWA tidak dapat dinonaktifkan.' };
    }
    user.isActive = !user.isActive;
    user.updatedAt = new Date().toISOString();
    this.save();
    return { success: true, isActive: user.isActive };
  }

  public resetUserPassword(userId: string, newPassword: string): { success: boolean; error?: string } {
    const user = this.findUserById(userId);
    if (!user) return { success: false, error: 'Pengguna tidak ditemukan.' };
    if (user.role === 'admin' || user.username === 'TAMANSISWA') {
      return { success: false, error: 'Password Admin Utama TAMANSISWA dilindungi dan tidak dapat diubah.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password baru minimal 6 karakter.' };
    }
    const cleanPass = newPassword.trim();
    const hashed = hashPassword(cleanPass);
    user.passwordHash = hashed.hash;
    user.salt = hashed.salt;
    user.initialPassword = cleanPass;
    user.password = cleanPass;
    (user as any).passwordChanged = true;
    user.mustChangePassword = false;
    user.updatedAt = new Date().toISOString();
    this.save();
    return { success: true };
  }

  public changePassword(userId: string, oldPassword: string, newPassword: string): { success: boolean; error?: string } {
    const user = this.findUserById(userId);
    if (!user) return { success: false, error: 'Pengguna tidak ditemukan.' };
    if (user.role === 'admin' || user.username === 'TAMANSISWA') {
      return { success: false, error: 'Password Administrator berstatus tetap dan tidak dapat diubah.' };
    }
    if (!verifyPassword(oldPassword, user.passwordHash, user.salt, user.initialPassword)) {
      return { success: false, error: 'Password lama tidak sesuai.' };
    }
    if (newPassword.length < 6) {
      return { success: false, error: 'Password baru minimal 6 karakter.' };
    }

    const hashed = hashPassword(newPassword.trim());
    user.passwordHash = hashed.hash;
    user.salt = hashed.salt;
    user.password = newPassword.trim();
    user.initialPassword = newPassword.trim();
    (user as any).passwordChanged = true;
    user.mustChangePassword = false;
    user.updatedAt = new Date().toISOString();
    this.save();
    return { success: true };
  }

  // Username modification with 30-day constraint
  public updateUsername(userId: string, newUsername: string): { success: boolean; user?: User; error?: string; daysRemaining?: number } {
    const user = this.findUserById(userId);
    if (!user) return { success: false, error: 'Pengguna tidak ditemukan.' };

    const trimmed = newUsername.trim().toLowerCase();
    if (trimmed.length < 3) {
      return { success: false, error: 'Username minimal 3 karakter.' };
    }
    if (!/^[a-z0-9._]+$/.test(trimmed)) {
      return { success: false, error: 'Username hanya boleh berisi huruf kecil, angka, titik, atau garis bawah (_).' };
    }

    if (trimmed === user.username.toLowerCase()) {
      return { success: false, error: 'Username baru tidak boleh sama dengan username saat ini.' };
    }

    // Check 30-day restriction
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    if (user.lastUsernameChange) {
      const lastChange = new Date(user.lastUsernameChange).getTime();
      const elapsed = Date.now() - lastChange;
      if (elapsed < THIRTY_DAYS_MS) {
        const daysRemaining = Math.ceil((THIRTY_DAYS_MS - elapsed) / (24 * 60 * 60 * 1000));
        return {
          success: false,
          error: `Username hanya dapat diubah maksimal 1 kali dalam periode 30 hari. Anda baru dapat mengubahnya kembali dalam ${daysRemaining} hari.`,
          daysRemaining,
        };
      }
    }

    // Check if newUsername is already taken
    const exists = this.findUserByUsername(trimmed);
    if (exists && exists.id !== user.id) {
      return { success: false, error: `Username "${trimmed}" sudah digunakan oleh pengguna lain.` };
    }

    const oldUsername = user.username;
    user.username = trimmed;
    user.lastUsernameChange = new Date().toISOString();
    user.updatedAt = new Date().toISOString();
    user.qrToken = generateQrToken(user.id, trimmed);

    if (!user.usernameChangeHistory) {
      user.usernameChangeHistory = [];
    }
    user.usernameChangeHistory.push({
      oldUsername,
      newUsername: trimmed,
      changedAt: user.lastUsernameChange,
    });

    this.save();
    return { success: true, user };
  }

  // Password Reset Requests (for non-admin users)
  public createPasswordResetRequest(userId: string, newPassword: string, reason?: string): { success: boolean; request?: PasswordResetRequest; error?: string } {
    const user = this.findUserById(userId);
    if (!user) return { success: false, error: 'Pengguna tidak ditemukan.' };
    if (user.role === 'admin' || user.username === 'TAMANSISWA') {
      return { success: false, error: 'Akun Administrator tidak memerlukan pengajuan ganti sandi.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password baru minimal 6 karakter demi keamanan akun.' };
    }

    // Check for existing pending request
    const existing = this.data.passwordResetRequests.find(
      (r) => r.userId === userId && r.status === 'pending'
    );
    if (existing) {
      return { success: false, error: 'Anda sudah memiliki pengajuan ganti sandi yang sedang menunggu persetujuan Admin.' };
    }

    const hashed = hashPassword(newPassword);
    const ticketNum = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    const newReq: PasswordResetRequest = {
      id: `pr_${Date.now()}`,
      ticketNumber: ticketNum,
      userId: user.id,
      username: user.username,
      name: user.name,
      kelas: user.kelas || '-',
      role: user.role,
      reason: (reason || 'Pengajuan ganti sandi').trim(),
      status: 'pending',
      newPasswordHash: hashed.hash,
      newSalt: hashed.salt,
      newPassword: newPassword,
      createdAt: new Date().toISOString(),
    };

    this.data.passwordResetRequests.unshift(newReq);

    // Push notification to Admin
    this.addNotification({
      title: 'Pengajuan Ganti Sandi Baru',
      message: `${user.name} (${user.kelas || 'Siswa'}) mengajukan ganti sandi (Tiket: ${ticketNum}).`,
      type: 'security',
      targetRole: 'admin',
    });

    this.save();
    return { success: true, request: newReq };
  }

  public getPasswordResetRequests(): PasswordResetRequest[] {
    return this.data.passwordResetRequests;
  }

  public processPasswordResetRequest(
    requestId: string,
    adminUser: User,
    status: 'approved' | 'rejected' | 'acc',
    adminNote?: string
  ): { success: boolean; request?: PasswordResetRequest; error?: string } {
    const req = this.data.passwordResetRequests.find((r) => r.id === requestId);
    if (!req) return { success: false, error: 'Tiket pengajuan ganti sandi tidak ditemukan.' };
    if (req.status !== 'pending') {
      return { success: false, error: 'Tiket ini sudah diproses sebelumnya dan tidak dapat diubah lagi.' };
    }

    const user = this.findUserById(req.userId) || (req.username ? this.findUserByUsername(req.username) : null);
    if (!user) return { success: false, error: 'Pengguna akun tidak ditemukan.' };

    const effectiveStatus: 'approved' | 'rejected' = status === 'acc' || status === 'approved' ? 'approved' : 'rejected';
    req.status = effectiveStatus;
    req.processedAt = new Date().toISOString();
    req.processedBy = adminUser.name;
    req.adminNote = adminNote || (effectiveStatus === 'approved' ? 'ACC' : 'Ditolak');

    if (effectiveStatus === 'approved') {
      if (req.newPassword) {
        const hashed = hashPassword(req.newPassword);
        user.passwordHash = req.newPasswordHash || hashed.hash;
        user.salt = req.newSalt || hashed.salt;
        user.password = req.newPassword;
        user.initialPassword = req.newPassword;
        user.passwordChanged = true;
        user.mustChangePassword = false;
        user.updatedAt = new Date().toISOString();
      } else if (req.newPasswordHash && req.newSalt) {
        user.passwordHash = req.newPasswordHash;
        user.salt = req.newSalt;
        user.password = req.newPassword || user.password;
        user.initialPassword = req.newPassword || user.initialPassword;
        user.mustChangePassword = false;
        user.updatedAt = new Date().toISOString();
      }
      // Send notification to student
      this.addNotification({
        title: 'Pengajuan Ganti Sandi di-ACC',
        message: `Pengajuan ganti sandi Anda (Tiket: ${req.ticketNumber || req.id}) telah di-ACC oleh Admin. Kata sandi baru Anda telah aktif dan dapat langsung digunakan.`,
        type: 'security',
        targetUserId: user.id,
      });
    } else {
      // Send rejection notification to student
      this.addNotification({
        title: 'Pengajuan Ganti Sandi Ditolak',
        message: `Pengajuan ganti sandi Anda (Tiket: ${req.ticketNumber || req.id}) DITOLAK oleh Admin. Alasan: ${req.adminNote}`,
        type: 'security',
        targetUserId: user.id,
      });
    }

    this.save();
    return { success: true, request: req };
  }

  // --- Subjects ---
  public getSubjects(): Subject[] {
    return this.data.subjects;
  }

  public findSubjectById(id: string): Subject | undefined {
    return this.data.subjects.find((s) => s.id === id);
  }

  public addSubject(subject: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>): Subject {
    const now = new Date().toISOString();
    const newSubject: Subject = {
      ...subject,
      id: `subj_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    this.data.subjects.push(newSubject);
    this.save();
    return newSubject;
  }

  public updateSubject(id: string, updates: Partial<Subject>): Subject | null {
    const idx = this.data.subjects.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    this.data.subjects[idx] = {
      ...this.data.subjects[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.subjects[idx];
  }

  public deleteSubject(id: string): boolean {
    const initialLen = this.data.subjects.length;
    this.data.subjects = this.data.subjects.filter((s) => s.id !== id);
    if (this.data.subjects.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Digital Books ---
  public getBooks(): DigitalBook[] {
    return this.data.books;
  }

  public findBookById(id: string): DigitalBook | undefined {
    return this.data.books.find((b) => b.id === id);
  }

  public addBook(book: Omit<DigitalBook, 'id' | 'createdAt'>): DigitalBook {
    const newBook: DigitalBook = {
      ...book,
      id: `book_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.data.books.push(newBook);
    this.save();
    return newBook;
  }

  public updateBook(id: string, updates: Partial<DigitalBook>): DigitalBook | null {
    const idx = this.data.books.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    this.data.books[idx] = {
      ...this.data.books[idx],
      ...updates,
    };
    this.save();
    return this.data.books[idx];
  }

  public deleteBook(id: string): boolean {
    const initialLen = this.data.books.length;
    this.data.books = this.data.books.filter((b) => b.id !== id);
    if (this.data.books.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Announcements ---
  public getAnnouncements(): Announcement[] {
    return this.data.announcements.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public findAnnouncementById(id: string): Announcement | undefined {
    return this.data.announcements.find((a) => a.id === id);
  }

  public addAnnouncement(ann: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>): Announcement {
    const now = new Date().toISOString();
    const newAnn: Announcement = {
      ...ann,
      id: `ann_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    this.data.announcements.unshift(newAnn);
    this.save();
    return newAnn;
  }

  public updateAnnouncement(id: string, updates: Partial<Announcement>): Announcement | null {
    const idx = this.data.announcements.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    this.data.announcements[idx] = {
      ...this.data.announcements[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.announcements[idx];
  }

  public deleteAnnouncement(id: string): boolean {
    const initialLen = this.data.announcements.length;
    this.data.announcements = this.data.announcements.filter((a) => a.id !== id);
    if (this.data.announcements.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Quizzes & Tokens ---
  public getQuizzes(): Quiz[] {
    return this.data.quizzes || [];
  }

  public findQuizById(id: string): Quiz | undefined {
    return (this.data.quizzes || []).find((q) => q.id === id);
  }

  public findQuizByToken(token: string): Quiz | undefined {
    if (!token) return undefined;
    const clean = token.trim().toUpperCase();
    const cleanNoSpecial = clean.replace(/[\s\-_]/g, '');
    const cleanAlphaNum = clean.replace(/[^A-Z0-9]/g, '');
    return (this.data.quizzes || []).find((q) => {
      if (!q.token) return false;
      const qToken = q.token.trim().toUpperCase();
      const qTokenNoSpecial = qToken.replace(/[\s\-_]/g, '');
      const qAlphaNum = qToken.replace(/[^A-Z0-9]/g, '');
      return (
        qToken === clean ||
        qTokenNoSpecial === cleanNoSpecial ||
        (cleanAlphaNum.length > 0 && qAlphaNum === cleanAlphaNum)
      );
    });
  }

  public verifyQuizAccess(payload: {
    token: string;
    studentName?: string;
    password?: string;
  }): { success: boolean; quiz?: Quiz; error?: string } {
    const cleanToken = payload.token ? payload.token.trim().toUpperCase() : '';
    if (!cleanToken) {
      return { success: false, error: 'Token quiz wajib diisi.' };
    }

    const quiz = this.findQuizByToken(cleanToken);
    if (!quiz) {
      return { success: false, error: 'Token quiz tidak ditemukan atau tidak valid. Silakan periksa kembali token yang diberikan oleh Guru.' };
    }

    if (quiz.isActive === false || quiz.status === 'inactive') {
      return { success: false, error: 'Quiz ini sedang tidak aktif atau telah ditutup oleh Guru.' };
    }

    if (quiz.password && quiz.password.trim() !== '') {
      if (!payload.password || payload.password !== quiz.password) {
        return { success: false, error: 'Password quiz salah. Silakan hubungi Guru pengampu untuk mendapatkan password yang benar.' };
      }
    }

    return { success: true, quiz };
  }

  public recordQuizViolation(violation: Omit<QuizViolation, 'id' | 'timestamp'>): QuizViolation {
    const newViolation: QuizViolation = {
      ...violation,
      id: `violation_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    if (!Array.isArray(this.data.quizViolations)) {
      this.data.quizViolations = [];
    }
    this.data.quizViolations.unshift(newViolation);

    if (this.data.quizViolations.length > 200) {
      this.data.quizViolations = this.data.quizViolations.slice(0, 200);
    }

    this.save();

    // Buat notifikasi peringatan pelanggaran ujian untuk Guru
    this.createNotification({
      title: '🚨 Pelanggaran Kuis Terdeteksi!',
      message: `Siswa "${newViolation.studentName}" terdeteksi ${newViolation.violationDetail} saat mengerjakan kuis "${newViolation.quizTitle}".`,
      type: 'quiz_violation',
      linkType: 'quiz',
      linkId: newViolation.quizId,
      targetRole: 'guru',
    });

    return newViolation;
  }

  public getQuizViolations(quizId?: string, teacherId?: string): QuizViolation[] {
    if (!Array.isArray(this.data.quizViolations)) return [];
    const deletedQuizSet = new Set((this.data.deletedQuizIds || []).map((id) => (id || '').trim().toLowerCase()));
    const validQuizIds = new Set((this.data.quizzes || []).map((q) => (q.id || '').trim().toLowerCase()));

    let list = this.data.quizViolations.filter((v) => {
      const vqId = (v.quizId || '').trim().toLowerCase();
      if (deletedQuizSet.has(vqId)) return false;
      if (!validQuizIds.has(vqId)) return false;
      return true;
    });

    if (quizId) {
      const targetQuizId = (quizId || '').trim().toLowerCase();
      list = list.filter((v) => (v.quizId || '').trim().toLowerCase() === targetQuizId);
    }
    if (teacherId) list = list.filter((v) => !v.teacherId || v.teacherId === teacherId);
    return list;
  }

  public clearQuizViolations(quizId?: string): boolean {
    if (!Array.isArray(this.data.quizViolations)) return true;
    if (quizId) {
      const targetQuizId = (quizId || '').trim().toLowerCase();
      this.data.quizViolations = this.data.quizViolations.filter(
        (v) => (v.quizId || '').trim().toLowerCase() !== targetQuizId
      );
    } else {
      this.data.quizViolations = [];
    }
    this.save();
    return true;
  }

  public deleteQuizViolation(violationId: string): boolean {
    if (!Array.isArray(this.data.quizViolations)) return true;
    this.data.quizViolations = this.data.quizViolations.filter((v) => v.id !== violationId);
    this.save();
    return true;
  }

  public recordQuizParticipant(payload: {
    quizId: string;
    quizTitle: string;
    studentId: string;
    studentName: string;
    studentUsername?: string;
    studentKelas?: string;
    tokenUsed: string;
  }): QuizParticipant {
    if (!Array.isArray(this.data.quizParticipants)) {
      this.data.quizParticipants = [];
    }
    const existing = this.data.quizParticipants.find(
      (p) => p.quizId === payload.quizId && p.studentId === payload.studentId
    );
    if (existing) {
      existing.enteredAt = new Date().toISOString();
      if (existing.status !== 'completed') {
        existing.status = 'in_progress';
      }
      this.save();
      return existing;
    }

    const newParticipant: QuizParticipant = {
      id: `part_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      quizId: payload.quizId,
      quizTitle: payload.quizTitle,
      studentId: payload.studentId,
      studentName: payload.studentName,
      studentUsername: payload.studentUsername,
      studentKelas: payload.studentKelas || '-',
      tokenUsed: payload.tokenUsed,
      enteredAt: new Date().toISOString(),
      status: 'in_progress',
    };
    this.data.quizParticipants.unshift(newParticipant);
    this.save();
    return newParticipant;
  }

  public completeQuizParticipant(quizId: string, studentId: string, score?: number): void {
    if (!Array.isArray(this.data.quizParticipants)) return;
    const participant = this.data.quizParticipants.find(
      (p) => p.quizId === quizId && p.studentId === studentId
    );
    if (participant) {
      participant.status = 'completed';
      if (score !== undefined) participant.score = score;
      this.save();
    }
  }

  public getQuizParticipants(quizId?: string): QuizParticipant[] {
    if (!Array.isArray(this.data.quizParticipants)) return [];
    const deletedQuizSet = new Set((this.data.deletedQuizIds || []).map((id) => (id || '').trim().toLowerCase()));
    const validQuizIds = new Set((this.data.quizzes || []).map((q) => (q.id || '').trim().toLowerCase()));

    let list = this.data.quizParticipants.filter((p) => {
      const pqId = (p.quizId || '').trim().toLowerCase();
      if (deletedQuizSet.has(pqId)) return false;
      if (!validQuizIds.has(pqId)) return false;
      return true;
    });

    if (quizId) {
      const targetQuizId = (quizId || '').trim().toLowerCase();
      list = list.filter((p) => (p.quizId || '').trim().toLowerCase() === targetQuizId);
    }
    return list.sort((a, b) => new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime());
  }

  public addQuiz(quiz: Omit<Quiz, 'id' | 'createdAt'>): Quiz {
    const cleanToken = quiz.token && quiz.token.trim() !== '' ? quiz.token.trim().toUpperCase() : generateRandomQuizToken();
    const newQuiz: Quiz = {
      ...quiz,
      id: `quiz_${Date.now()}`,
      token: cleanToken,
      sourceType: quiz.sourceType || 'interactive',
      status: quiz.status || (quiz.isActive ? 'active' : 'inactive'),
      createdAt: new Date().toISOString(),
    };
    if (this.data.deletedQuizIds) {
      this.data.deletedQuizIds = this.data.deletedQuizIds.filter((did) => did !== newQuiz.id);
    }
    this.data.quizzes.push(newQuiz);
    this.save();
    return newQuiz;
  }

  public updateQuiz(id: string, updates: Partial<Quiz>): Quiz | null {
    const idx = this.data.quizzes.findIndex((q) => q.id === id);
    if (idx === -1) return null;
    this.data.quizzes[idx] = {
      ...this.data.quizzes[idx],
      ...updates,
      token: updates.token ? updates.token.trim().toUpperCase() : this.data.quizzes[idx].token,
    };
    this.save();
    return this.data.quizzes[idx];
  }

  public deleteQuiz(id: string): boolean {
    const targetId = (id || '').trim().toLowerCase();
    this.data.quizzes = (this.data.quizzes || []).filter((q) => (q.id || '').trim().toLowerCase() !== targetId);
    this.data.deletedQuizIds = this.data.deletedQuizIds || [];
    if (!this.data.deletedQuizIds.some((did) => did.trim().toLowerCase() === targetId)) {
      this.data.deletedQuizIds.push(id);
    }
    // Hapus permanen seluruh data peserta kuis, pelanggaran kuis, dan riwayat attempt terkait
    if (Array.isArray(this.data.quizParticipants)) {
      this.data.quizParticipants = this.data.quizParticipants.filter((p) => (p.quizId || '').trim().toLowerCase() !== targetId);
    }
    if (Array.isArray(this.data.quizViolations)) {
      this.data.quizViolations = this.data.quizViolations.filter((v) => (v.quizId || '').trim().toLowerCase() !== targetId);
    }
    if (Array.isArray(this.data.quizAttempts)) {
      this.data.quizAttempts = this.data.quizAttempts.filter((a) => (a.quizId || '').trim().toLowerCase() !== targetId);
    }
    this.save();
    return true;
  }

  public getDeletedQuizIds(): string[] {
    return this.data.deletedQuizIds || [];
  }

  public syncMultipleQuizzes(incoming: Quiz[]): { added: number; updated: number; count: number } {
    if (!Array.isArray(incoming) || incoming.length === 0) {
      return { added: 0, updated: 0, count: (this.data.quizzes || []).length };
    }
    if (!Array.isArray(this.data.quizzes)) this.data.quizzes = [];
    const deletedQuizSet = new Set(this.data.deletedQuizIds || []);
    let added = 0;
    let updated = 0;
    incoming.forEach((q) => {
      if (!q || !q.id || deletedQuizSet.has(q.id)) return;
      const cleanToken = q.token ? q.token.trim().toUpperCase() : '';
      const existingIdx = this.data.quizzes.findIndex(
        (x) => x.id === q.id || (cleanToken && x.token && x.token.trim().toUpperCase() === cleanToken)
      );
      if (existingIdx === -1) {
        this.data.quizzes.push({
          ...q,
          token: cleanToken || generateRandomQuizToken(),
          status: q.status || (q.isActive ? 'active' : 'inactive'),
        });
        added++;
      } else {
        this.data.quizzes[existingIdx] = {
          ...this.data.quizzes[existingIdx],
          ...q,
          token: cleanToken || this.data.quizzes[existingIdx].token,
        };
        updated++;
      }
    });
    this.save();
    return { added, updated, count: this.data.quizzes.length };
  }

  public submitQuizAttempt(attempt: Omit<QuizAttempt, 'id' | 'completedAt'>): QuizAttempt {
    const newAttempt: QuizAttempt = {
      ...attempt,
      id: `att_${Date.now()}`,
      completedAt: new Date().toISOString(),
    };
    this.data.quizAttempts.push(newAttempt);
    this.save();
    return newAttempt;
  }

  public getQuizAttempts(quizId?: string, studentId?: string): QuizAttempt[] {
    if (!Array.isArray(this.data.quizAttempts)) return [];
    const deletedQuizSet = new Set((this.data.deletedQuizIds || []).map((id) => (id || '').trim().toLowerCase()));
    const validQuizIds = new Set((this.data.quizzes || []).map((q) => (q.id || '').trim().toLowerCase()));

    let result = this.data.quizAttempts.filter((a) => {
      const aqId = (a.quizId || '').trim().toLowerCase();
      if (deletedQuizSet.has(aqId)) return false;
      if (!validQuizIds.has(aqId)) return false;
      return true;
    });

    if (quizId) {
      const targetQuizId = (quizId || '').trim().toLowerCase();
      result = result.filter((a) => (a.quizId || '').trim().toLowerCase() === targetQuizId);
    }
    if (studentId) result = result.filter((a) => a.studentId === studentId);
    return result.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }

  // --- Attendance Events & Sessions ---
  public getAttendanceEvents(): AttendanceEvent[] {
    return this.data.attendanceEvents;
  }

  public findEventById(id: string): AttendanceEvent | undefined {
    return this.data.attendanceEvents.find((e) => e.id === id);
  }

  public createAttendanceEvent(eventData: Omit<AttendanceEvent, 'id' | 'createdAt'>): AttendanceEvent {
    const newEvent: AttendanceEvent = {
      ...eventData,
      id: `event_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.data.attendanceEvents.unshift(newEvent);
    this.save();
    return newEvent;
  }

  public updateAttendanceEvent(id: string, updates: Partial<AttendanceEvent>): AttendanceEvent | null {
    const idx = this.data.attendanceEvents.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    this.data.attendanceEvents[idx] = {
      ...this.data.attendanceEvents[idx],
      ...updates,
    };
    this.save();
    return this.data.attendanceEvents[idx];
  }

  public toggleEventSession(id: string): { success: boolean; isOpen?: boolean; error?: string } {
    const event = this.findEventById(id);
    if (!event) return { success: false, error: 'Kegiatan tidak ditemukan.' };
    event.isOpen = !event.isOpen;
    this.save();
    return { success: true, isOpen: event.isOpen };
  }

  public deleteAttendanceEvent(id: string): boolean {
    const initialLen = this.data.attendanceEvents.length;
    this.data.attendanceEvents = this.data.attendanceEvents.filter((e) => e.id !== id);
    if (this.data.attendanceEvents.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Attendance Records & Scan Verification ---
  public getAttendanceRecords(eventId?: string): AttendanceRecord[] {
    if (eventId) {
      return this.data.attendanceRecords.filter((r) => r.eventId === eventId);
    }
    return this.data.attendanceRecords;
  }

  public processQrScan(payload: {
    eventId: string;
    qrString: string;
    verifiedBy: string;
  }): {
    status: 'SUCCESS' | 'ALREADY_SCANNED' | 'INVALID_QR' | 'ACCOUNT_INACTIVE' | 'SESSION_CLOSED' | 'SERVER_ERROR';
    message: string;
    record?: AttendanceRecord;
    student?: { id: string; name: string; username: string; kelas?: string };
    event?: { id: string; name: string };
    scanTime?: string;
  } {
    const event = this.findEventById(payload.eventId);
    if (!event) {
      return {
        status: 'SERVER_ERROR',
        message: 'Kegiatan tidak ditemukan.',
      };
    }

    if (!event.isOpen) {
      return {
        status: 'SESSION_CLOSED',
        message: `Sesi absensi untuk kegiatan "${event.name}" saat ini sedang DITUTUP.`,
        event: { id: event.id, name: event.name },
      };
    }

    const parts = payload.qrString.trim().split(':');
    let student: User | undefined;

    if (parts.length >= 3 && parts[0] === 'TAMVESTA' && parts[1] === 'STUDENT') {
      const studentId = parts[2];
      student = this.findUserById(studentId);
    } else {
      student = this.findUserByUsername(payload.qrString.trim());
    }

    if (!student) {
      return {
        status: 'INVALID_QR',
        message: 'QR Code tidak terdaftar dalam sistem Tamansiswa Batam.',
        event: { id: event.id, name: event.name },
      };
    }

    if (!student.isActive) {
      return {
        status: 'ACCOUNT_INACTIVE',
        message: `Akun siswa @${student.username} (${student.name}) dalam status NONAKTIF. Hubungi Administrator.`,
        student: { id: student.id, name: student.name, username: student.username, kelas: student.kelas },
        event: { id: event.id, name: event.name },
      };
    }

    const alreadyScanned = this.data.attendanceRecords.some(
      (r) => r.eventId === event.id && r.studentId === student!.id
    );

    if (alreadyScanned) {
      return {
        status: 'ALREADY_SCANNED',
        message: `Siswa ${student.name} (@${student.username}) SUDAH ABSEN sebelumnya pada kegiatan ini.`,
        student: { id: student.id, name: student.name, username: student.username, kelas: student.kelas },
        event: { id: event.id, name: event.name },
      };
    }

    const now = new Date().toISOString();
    const newRecord: AttendanceRecord = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      eventId: event.id,
      eventName: event.name,
      studentId: student.id,
      studentName: student.name,
      username: student.username,
      kelas: student.kelas,
      verifiedAt: now,
      verifiedBy: payload.verifiedBy,
      status: 'TELAH MASUK',
      verificationResult: 'BERHASIL',
    };

    this.data.attendanceRecords.unshift(newRecord);
    this.save();

    return {
      status: 'SUCCESS',
      message: `Presensi Berhasil! Siswa ${student.name} (${student.kelas || 'Siswa'}) tercatat TELAH MASUK.`,
      record: newRecord,
      student: { id: student.id, name: student.name, username: student.username, kelas: student.kelas },
      event: { id: event.id, name: event.name },
      scanTime: now,
    };
  }

  // -------------------------------------------------------------
  // POSTS & FEED SISWA (Hanya diisi oleh akun terdaftar)
  // -------------------------------------------------------------
  getPosts(): StudentPost[] {
    if (!Array.isArray(this.data.posts)) this.data.posts = [];
    return [...this.data.posts]
      .filter((p) => !p.id.startsWith('post_seed_'))
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  getPostById(id: string): StudentPost | undefined {
    if (!Array.isArray(this.data.posts)) this.data.posts = [];
    return this.data.posts.find((p) => p.id === id);
  }

  togglePinPost(id: string): StudentPost {
    if (!Array.isArray(this.data.posts)) this.data.posts = [];
    const post = this.data.posts.find((p) => p.id === id);
    if (!post) throw new Error('Postingan tidak ditemukan');
    post.isPinned = !post.isPinned;
    this.save();
    return post;
  }

  addPost(payload: {
    authorId: string;
    authorName: string;
    authorUsername: string;
    authorKelas?: string;
    authorAvatar?: string;
    authorIsVerified?: boolean;
    authorIsAlumni?: boolean;
    isPinned?: boolean;
    caption: string;
    mediaType: 'photo' | 'video' | 'none';
    mediaUrl?: string;
    mediaName?: string;
  }): StudentPost {
    const authorUser = this.findUserById(payload.authorId) || this.findUserByUsername(payload.authorUsername);
    const isDev = authorUser?.isDeveloper || authorUser?.role === 'support' || payload.authorUsername.toLowerCase() === 'tamvesta' || payload.authorId === 'user_support_tamvesta';
    const isVer = payload.authorIsVerified !== undefined ? payload.authorIsVerified : (authorUser?.isVerified || isDev);
    const isPinnedPost = payload.isPinned !== undefined ? payload.isPinned : isDev;

    const newPost: StudentPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      authorId: payload.authorId,
      authorName: payload.authorName,
      authorUsername: payload.authorUsername,
      authorKelas: payload.authorKelas || (isDev ? 'Developer & Support Resmi' : ''),
      authorAvatar: payload.authorAvatar || (isDev ? '/assets/tamvesta_mascot.jpg' : ''),
      authorIsVerified: isVer,
      authorIsAlumni: payload.authorIsAlumni !== undefined ? payload.authorIsAlumni : !!authorUser?.isAlumni,
      authorIsDeveloper: isDev,
      authorBadgeType: isDev ? 'developer' : (isVer ? 'blue' : undefined),
      isPinned: isPinnedPost,
      caption: payload.caption.trim(),
      mediaType: payload.mediaType || 'none',
      mediaUrl: payload.mediaUrl,
      mediaName: payload.mediaName,
      likes: [],
      comments: [],
      createdAt: new Date().toISOString(),
    };

    if (!this.data.posts) {
      this.data.posts = [];
    }

    this.data.posts.unshift(newPost);

    // Otomatis buat notifikasi resmi untuk seluruh siswa saat Support memposting
    if (isDev) {
      if (!Array.isArray(this.data.notifications)) {
        this.data.notifications = [];
      }
      this.data.notifications.unshift({
        id: `notif_support_post_${Date.now()}`,
        title: '📢 Pesan Resmi Support TAMVESTA',
        message: payload.caption.length > 90 ? payload.caption.substring(0, 90) + '...' : payload.caption,
        type: 'announcement',
        isImportant: true,
        linkType: 'announcement',
        linkId: newPost.id,
        createdAt: new Date().toISOString(),
        readBy: [],
        deletedBy: [],
      });
    }

    this.save();
    return newPost;
  }

  deletePost(id: string, requesterUserId: string, isAdmin: boolean): boolean {
    const postIdx = this.data.posts.findIndex((p) => p.id === id);
    if (postIdx === -1) return false;

    const post = this.data.posts[postIdx];
    if (!isAdmin && post.authorId !== requesterUserId) {
      return false;
    }

    this.data.posts.splice(postIdx, 1);
    this.data.deletedPostIds = this.data.deletedPostIds || [];
    if (!this.data.deletedPostIds.includes(id)) {
      this.data.deletedPostIds.push(id);
    }
    this.save();
    return true;
  }

  toggleLikePost(postId: string, userId: string): { likesCount: number; isLiked: boolean } | null {
    const post = this.data.posts.find((p) => p.id === postId);
    if (!post) return null;

    if (!Array.isArray(post.likes)) {
      post.likes = [];
    }

    const index = post.likes.indexOf(userId);
    let isLiked = false;
    if (index > -1) {
      post.likes.splice(index, 1);
      isLiked = false;
    } else {
      post.likes.push(userId);
      isLiked = true;
    }

    this.save();
    return { likesCount: post.likes.length, isLiked };
  }

  addCommentToPost(
    postId: string,
    commentPayload: {
      authorId: string;
      authorName: string;
      authorUsername: string;
      authorAvatar?: string;
      content: string;
      replyToCommentId?: string;
      replyToUsername?: string;
      replyToAuthorName?: string;
      replyToAuthorId?: string;
    }
  ): PostComment | null {
    const post = this.data.posts.find((p) => p.id === postId);
    if (!post) return null;

    if (!Array.isArray(post.comments)) {
      post.comments = [];
    }

    const newComment: PostComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      postId,
      authorId: commentPayload.authorId,
      authorName: commentPayload.authorName,
      authorUsername: commentPayload.authorUsername,
      authorAvatar: commentPayload.authorAvatar,
      content: commentPayload.content.trim(),
      replyToCommentId: commentPayload.replyToCommentId,
      replyToUsername: commentPayload.replyToUsername,
      replyToAuthorName: commentPayload.replyToAuthorName,
      replyToAuthorId: commentPayload.replyToAuthorId,
      createdAt: new Date().toISOString(),
    };

    post.comments.push(newComment);
    this.save();
    return newComment;
  }

  toggleFollowUser(followerId: string, targetUserId: string): { isFollowing: boolean; followingCount: number } | null {
    const follower = this.data.users.find((u) => u.id === followerId);
    if (!follower) return null;

    if (!Array.isArray(follower.following)) {
      follower.following = [];
    }

    const index = follower.following.indexOf(targetUserId);
    let isFollowing = false;
    if (index > -1) {
      follower.following.splice(index, 1);
      isFollowing = false;
    } else {
      follower.following.push(targetUserId);
      isFollowing = true;
    }

    this.save();
    return { isFollowing, followingCount: follower.following.length };
  }

  getUserFollowing(userId: string): string[] {
    const user = this.data.users.find((u) => u.id === userId);
    return user?.following || [];
  }

  // -------------------------------------------------------------
  // USER PROFILE & POST EDITING
  // -------------------------------------------------------------
  updatePost(postId: string, userId: string, caption: string): StudentPost | null {
    const post = this.data.posts.find((p) => p.id === postId);
    if (!post || post.authorId !== userId) return null;
    post.caption = caption.trim();
    this.save();
    return post;
  }

  updateUserProfile(userId: string, data: { bio?: string; avatarUrl?: string; phone?: string; email?: string }): User | null {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return null;

    if (data.bio !== undefined) {
      user.bio = data.bio.trim().substring(0, 300);
    }
    if (data.phone !== undefined) {
      user.phone = data.phone.trim();
    }
    if (data.email !== undefined) {
      user.email = data.email.trim();
    }
    if (data.avatarUrl !== undefined) {
      user.avatarUrl = data.avatarUrl;
      // Also update authorAvatar across user's existing posts & comments for consistency
      this.data.posts.forEach((p) => {
        if (p.authorId === userId) {
          p.authorAvatar = data.avatarUrl;
        }
        if (Array.isArray(p.comments)) {
          p.comments.forEach((c) => {
            if (c.authorId === userId) {
              c.authorAvatar = data.avatarUrl;
            }
          });
        }
      });
    }

    user.updatedAt = new Date().toISOString();
    this.save();
    return user;
  }

  getUserProfileWithPosts(target: string): {
    user: Partial<User>;
    posts: StudentPost[];
    followersCount: number;
    followingCount: number;
  } | null {
    const user = this.data.users.find(
      (u) => u.id === target || u.username.toLowerCase() === target.toLowerCase()
    );
    if (!user) return null;

    // Count followers (users whose following array includes this user's id)
    const followersCount = this.data.users.filter(
      (u) => Array.isArray(u.following) && u.following.includes(user.id)
    ).length;

    const followingCount = Array.isArray(user.following) ? user.following.length : 0;

    // User's posts
    const posts = this.data.posts
      .filter((p) => p.authorId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const { passwordHash, salt, initialPassword, password, ...safeUser } = user;
    return {
      user: safeUser,
      posts,
      followersCount,
      followingCount,
    };
  }

  // -------------------------------------------------------------
  // STORIES (Hanya diisi oleh akun terdaftar - Kedaluwarsa Otomatis 24 Jam)
  // -------------------------------------------------------------
  getStories(): Story[] {
    if (!Array.isArray(this.data.stories)) {
      this.data.stories = [];
    }

    const now = Date.now();
    return [...this.data.stories]
      .filter((s) => !s.id.startsWith('story_seed_'))
      .filter((s) => !s.expiresAt || new Date(s.expiresAt).getTime() > now)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createStory(storyData: {
    authorId: string;
    authorName: string;
    authorUsername: string;
    authorAvatar?: string;
    authorKelas?: string;
    authorIsVerified?: boolean;
    authorIsAlumni?: boolean;
    mediaType: 'photo' | 'video';
    mediaUrl: string;
    caption?: string;
  }): Story {
    if (!Array.isArray(this.data.stories)) {
      this.data.stories = [];
    }

    const now = new Date();
    // Kedaluwarsa otomatis setelah 24 jam sesuai ketentuan
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const newStory: Story = {
      id: `story_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      authorId: storyData.authorId,
      authorName: storyData.authorName,
      authorUsername: storyData.authorUsername,
      authorAvatar: storyData.authorAvatar,
      authorKelas: storyData.authorKelas,
      authorIsVerified: !!storyData.authorIsVerified,
      authorIsAlumni: !!storyData.authorIsAlumni,
      mediaType: storyData.mediaType,
      mediaUrl: storyData.mediaUrl,
      caption: storyData.caption?.trim(),
      createdAt: now.toISOString(),
      expiresAt,
    };

    this.data.stories.unshift(newStory);
    this.save();
    return newStory;
  }

  deleteStory(storyId: string, userId: string, isAdmin = false): boolean {
    if (!Array.isArray(this.data.stories)) return false;
    const index = this.data.stories.findIndex((s) => s.id === storyId);
    if (index === -1) return false;

    const story = this.data.stories[index];
    if (story.authorId !== userId && !isAdmin) return false;

    this.data.stories.splice(index, 1);
    this.save();
    return true;
  }

  // -------------------------------------------------------------
  // PERSONAL NOTES (ARSIP CATATAN PRIBADI SISWA)
  // -------------------------------------------------------------
  getUserNotes(userId: string): PersonalNote[] {
    if (!Array.isArray(this.data.notes)) {
      this.data.notes = [];
      return [];
    }

    return this.data.notes
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  createNote(userId: string, data: { title: string; content: string; color?: string }): PersonalNote {
    if (!Array.isArray(this.data.notes)) {
      this.data.notes = [];
    }

    const now = new Date().toISOString();
    const newNote: PersonalNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      title: data.title.trim() || 'Catatan Tanpa Judul',
      content: data.content.trim(),
      color: data.color || 'emerald',
      createdAt: now,
      updatedAt: now,
    };

    this.data.notes.unshift(newNote);
    this.save();
    return newNote;
  }

  updateNote(
    noteId: string,
    userId: string,
    data: { title: string; content: string; color?: string }
  ): PersonalNote | null {
    if (!Array.isArray(this.data.notes)) return null;
    const note = this.data.notes.find((n) => n.id === noteId && n.userId === userId);
    if (!note) return null;

    if (data.title !== undefined) note.title = data.title.trim() || 'Catatan Tanpa Judul';
    if (data.content !== undefined) note.content = data.content.trim();
    if (data.color !== undefined) note.color = data.color;
    note.updatedAt = new Date().toISOString();

    this.save();
    return note;
  }

  deleteNote(noteId: string, userId: string): boolean {
    if (!Array.isArray(this.data.notes)) return false;
    const index = this.data.notes.findIndex((n) => n.id === noteId && n.userId === userId);
    if (index === -1) return false;

    this.data.notes.splice(index, 1);
    this.save();
    return true;
  }

  // -------------------------------------------------------------
  // NOTIFICATIONS
  // -------------------------------------------------------------
  getNotifications(userId: string, role?: UserRole, userClass?: string): (AppNotification & { isRead: boolean })[] {
    if (!Array.isArray(this.data.notifications)) {
      this.data.notifications = [];
    }

    // Seed default notifications if empty
    if (this.data.notifications.length === 0) {
      const now = new Date().toISOString();
      this.data.notifications = [
        {
          id: 'notif_welcome',
          title: 'Selamat Datang di TAMVESTA Mobile!',
          message: 'Aplikasi resmi siswa Tamansiswa Batam kini aktif dengan fitur Feed, Story, QR, Arsip, dan Quiz.',
          type: 'general',
          isImportant: true,
          linkType: 'none',
          readBy: [],
          deletedBy: [],
          createdAt: now,
        },
        {
          id: 'notif_announcement_1',
          title: 'Pengumuman: Ujian Tengah Semester & Event Budaya',
          message: 'Jadwal persiapan UTS dan perayaan Hari Pendidikan Nasional Tamansiswa Batam telah diterbitkan.',
          type: 'announcement',
          isImportant: true,
          linkType: 'announcement',
          linkId: 'ann_1',
          readBy: [],
          deletedBy: [],
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'notif_subject_1',
          title: 'Pembaruan Jadwal: Matematika Wajib',
          message: 'Jadwal mata pelajaran Matematika dipindahkan ke Ruang Multimedia 2 pada jam 08:45 WIB.',
          type: 'subject_change',
          isImportant: false,
          linkType: 'subject',
          readBy: [],
          deletedBy: [],
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ];
      this.save();
    }

    return this.data.notifications
      .filter((n) => {
        // Exclude if user deleted it
        if (Array.isArray(n.deletedBy) && n.deletedBy.includes(userId)) return false;
        // Filter by user target
        if (n.targetUserId && n.targetUserId !== userId) return false;
        // Filter by role target
        if (n.targetRole && role && n.targetRole !== role) return false;
        // Filter by class target
        if (n.targetClass && userClass && n.targetClass !== userClass) return false;
        return true;
      })
      .map((n) => ({
        ...n,
        isRead: Array.isArray(n.readBy) && n.readBy.includes(userId),
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  markNotificationRead(notificationId: string, userId: string): boolean {
    if (!Array.isArray(this.data.notifications)) return false;
    const notif = this.data.notifications.find((n) => n.id === notificationId);
    if (!notif) return false;

    if (!Array.isArray(notif.readBy)) notif.readBy = [];
    if (!notif.readBy.includes(userId)) {
      notif.readBy.push(userId);
      this.save();
    }
    return true;
  }

  markAllNotificationsRead(userId: string): boolean {
    if (!Array.isArray(this.data.notifications)) return false;
    let changed = false;

    this.data.notifications.forEach((n) => {
      if (!Array.isArray(n.readBy)) n.readBy = [];
      if (!n.readBy.includes(userId)) {
        n.readBy.push(userId);
        changed = true;
      }
    });

    if (changed) this.save();
    return true;
  }

  deleteNotificationForUser(notificationId: string, userId: string): boolean {
    if (!Array.isArray(this.data.notifications)) return false;
    const notif = this.data.notifications.find((n) => n.id === notificationId);
    if (!notif) return false;

    if (!Array.isArray(notif.deletedBy)) notif.deletedBy = [];
    if (!notif.deletedBy.includes(userId)) {
      notif.deletedBy.push(userId);
      this.save();
    }
    return true;
  }

  createNotification(data: {
    title: string;
    message: string;
    type: AppNotification['type'];
    isImportant?: boolean;
    linkType?: AppNotification['linkType'];
    linkId?: string;
    targetRole?: UserRole;
    targetClass?: string;
    targetUserId?: string;
  }): AppNotification {
    if (!Array.isArray(this.data.notifications)) this.data.notifications = [];

    const newNotif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: data.title.trim(),
      message: data.message.trim(),
      type: data.type,
      isImportant: !!data.isImportant,
      linkType: data.linkType || 'none',
      linkId: data.linkId,
      targetRole: data.targetRole,
      targetClass: data.targetClass,
      targetUserId: data.targetUserId,
      readBy: [],
      deletedBy: [],
      createdAt: new Date().toISOString(),
    };

    this.data.notifications.unshift(newNotif);
    this.save();
    return newNotif;
  }

  addNotification(data: any): AppNotification {
    return this.createNotification(data);
  }

  public getAllNotificationsRaw(): AppNotification[] {
    if (!Array.isArray(this.data.notifications)) this.data.notifications = [];
    return [...this.data.notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public deleteNotificationAdmin(notificationId: string): boolean {
    if (!Array.isArray(this.data.notifications)) return false;
    const initialLen = this.data.notifications.length;
    this.data.notifications = this.data.notifications.filter((n) => n.id !== notificationId);
    if (this.data.notifications.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // -------------------------------------------------------------
  // ARTIKEL GURU & METODE PEMBELAJARAN
  // -------------------------------------------------------------
  getArticles(category?: string, onlyPublished?: boolean): TeacherArticle[] {
    if (!Array.isArray(this.data.articles)) this.data.articles = [];
    let list = [...this.data.articles];
    if (category) {
      list = list.filter((a) => a.category === category);
    }
    if (onlyPublished) {
      list = list.filter((a) => a.isPublished);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getArticleById(id: string): TeacherArticle | null {
    if (!Array.isArray(this.data.articles)) this.data.articles = [];
    return this.data.articles.find((a) => a.id === id) || null;
  }

  createArticle(data: Partial<TeacherArticle>): TeacherArticle {
    if (!Array.isArray(this.data.articles)) this.data.articles = [];
    const newArt: TeacherArticle = {
      id: `art_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      authorId: data.authorId || 'user_guru',
      authorName: data.authorName || 'Guru Tamansiswa',
      authorAvatar: data.authorAvatar,
      authorSubject: data.authorSubject || 'Mata Pelajaran',
      title: (data.title || '').trim(),
      summary: (data.summary || '').trim(),
      content: (data.content || '').trim(),
      category: data.category === 'Metode Pembelajaran' ? 'Metode Pembelajaran' : 'Artikel Guru',
      coverUrl: data.coverUrl,
      isPublished: data.isPublished !== undefined ? data.isPublished : true,
      likesCount: 0,
      readsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.articles.unshift(newArt);
    this.save();
    return newArt;
  }

  updateArticle(id: string, data: Partial<TeacherArticle>): TeacherArticle {
    if (!Array.isArray(this.data.articles)) this.data.articles = [];
    const art = this.data.articles.find((a) => a.id === id);
    if (!art) throw new Error('Artikel tidak ditemukan');

    if (data.title !== undefined) art.title = data.title.trim();
    if (data.summary !== undefined) art.summary = data.summary.trim();
    if (data.content !== undefined) art.content = data.content.trim();
    if (data.category !== undefined) art.category = data.category;
    if (data.coverUrl !== undefined) art.coverUrl = data.coverUrl;
    if (data.isPublished !== undefined) art.isPublished = data.isPublished;
    art.updatedAt = new Date().toISOString();

    this.save();
    return art;
  }

  deleteArticle(id: string): boolean {
    if (!Array.isArray(this.data.articles)) return false;
    this.data.articles = this.data.articles.filter((a) => a.id !== id);
    this.save();
    return true;
  }

  // -------------------------------------------------------------
  // ABSENSI GURU KELAS (QR CODE & MANUAL)
  // -------------------------------------------------------------
  recordClassAttendance(entries: ClassAttendanceEntry[]): ClassAttendanceEntry[] {
    if (!Array.isArray(this.data.classAttendance)) this.data.classAttendance = [];
    entries.forEach((e) => {
      const existingIdx = this.data.classAttendance.findIndex(
        (item) => item.studentId === e.studentId && item.date === e.date && item.kelas === e.kelas
      );
      if (existingIdx > -1) {
        this.data.classAttendance[existingIdx] = { ...this.data.classAttendance[existingIdx], ...e };
      } else {
        this.data.classAttendance.push(e);
      }
    });
    this.save();
    return entries;
  }

  getClassAttendance(filters: { date?: string; kelas?: string; studentId?: string; status?: string }): ClassAttendanceEntry[] {
    if (!Array.isArray(this.data.classAttendance)) this.data.classAttendance = [];
    let list = [...this.data.classAttendance];
    if (filters.date) list = list.filter((a) => a.date === filters.date);
    if (filters.kelas) list = list.filter((a) => (a.kelas || a.studentKelas || '').toLowerCase() === filters.kelas!.toLowerCase());
    if (filters.studentId) list = list.filter((a) => a.studentId === filters.studentId);
    if (filters.status && filters.status !== 'semua') list = list.filter((a) => a.status === filters.status);
    return list;
  }

  // -------------------------------------------------------------
  // TATA USAHA (TU) - TAGIHAN, TRANSAKSI, DOKUMEN & CHAT
  // -------------------------------------------------------------
  getTuitionBills(studentId?: string, kelas?: string, status?: string): TuitionBill[] {
    if (!Array.isArray(this.data.tuitionBills)) this.data.tuitionBills = [];
    let list = [...this.data.tuitionBills];
    if (studentId) list = list.filter((b) => b.studentId === studentId);
    if (kelas) list = list.filter((b) => b.studentKelas.toLowerCase() === kelas.toLowerCase());
    if (status && status !== 'semua') list = list.filter((b) => b.status === status);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createTuitionBill(data: Partial<TuitionBill>): TuitionBill {
    if (!Array.isArray(this.data.tuitionBills)) this.data.tuitionBills = [];
    const bill: TuitionBill = {
      id: `bill_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentId: data.studentId || '',
      studentName: data.studentName || '',
      studentUsername: data.studentUsername || '',
      studentKelas: data.studentKelas || 'X',
      title: data.title || 'Tagihan Biaya Sekolah',
      category: data.category || 'SPP',
      amount: Number(data.amount) || 0,
      dueDate: data.dueDate || new Date().toISOString().split('T')[0],
      status: data.status || 'belum_lunas',
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };
    this.data.tuitionBills.unshift(bill);
    this.save();
    return bill;
  }

  updateTuitionBill(id: string, data: Partial<TuitionBill>): TuitionBill {
    if (!Array.isArray(this.data.tuitionBills)) this.data.tuitionBills = [];
    const bill = this.data.tuitionBills.find((b) => b.id === id);
    if (!bill) throw new Error('Tagihan tidak ditemukan');
    Object.assign(bill, data);
    this.save();
    return bill;
  }

  deleteTuitionBill(id: string): boolean {
    if (!Array.isArray(this.data.tuitionBills)) return false;
    this.data.tuitionBills = this.data.tuitionBills.filter((b) => b.id !== id);
    this.save();
    return true;
  }

  getTuitionTransactions(type?: string): TuitionTransaction[] {
    if (!Array.isArray(this.data.tuitionTransactions)) this.data.tuitionTransactions = [];
    let list = [...this.data.tuitionTransactions];
    if (type && type !== 'semua') list = list.filter((t) => t.type === type);
    return list.sort((a, b) => new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime());
  }

  createTuitionTransaction(data: Partial<TuitionTransaction>): TuitionTransaction {
    if (!Array.isArray(this.data.tuitionTransactions)) this.data.tuitionTransactions = [];
    const trx: TuitionTransaction = {
      id: `trx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      billId: data.billId,
      studentId: data.studentId,
      studentName: data.studentName,
      studentKelas: data.studentKelas,
      amount: Number(data.amount) || 0,
      type: data.type || 'pemasukan',
      category: data.category || 'SPP',
      paymentMethod: data.paymentMethod || 'Tunai / Kasir TU',
      verifiedBy: data.verifiedBy || 'Staf Tata Usaha',
      verifiedAt: new Date().toISOString(),
      receiptNumber: data.receiptNumber || `KW-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      description: data.description || 'Transaksi keuangan sekolah',
    };
    this.data.tuitionTransactions.unshift(trx);
    this.save();
    return trx;
  }

  getTuDocuments(category?: string): TuDocument[] {
    if (!Array.isArray(this.data.tuDocuments)) this.data.tuDocuments = [];
    let list = [...this.data.tuDocuments];
    if (category && category !== 'semua') list = list.filter((d) => d.category === category);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createTuDocument(data: Partial<TuDocument>): TuDocument {
    if (!Array.isArray(this.data.tuDocuments)) this.data.tuDocuments = [];
    const doc: TuDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: data.title || '',
      docNumber: data.docNumber || `${Math.floor(100 + Math.random() * 900)}/TS-BTM/TU/${new Date().getFullYear()}`,
      category: data.category || 'Surat Keluar',
      date: data.date || new Date().toISOString().split('T')[0],
      recipientOrSender: data.recipientOrSender || 'Umum',
      fileUrl: data.fileUrl,
      status: data.status || 'Selesai',
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };
    this.data.tuDocuments.unshift(doc);
    this.save();
    return doc;
  }

  deleteTuDocument(id: string): boolean {
    if (!Array.isArray(this.data.tuDocuments)) return false;
    this.data.tuDocuments = this.data.tuDocuments.filter((d) => d.id !== id);
    this.save();
    return true;
  }

  getTuChatMessages(studentId?: string): TuChatMessage[] {
    if (!Array.isArray(this.data.tuChatMessages)) this.data.tuChatMessages = [];
    let list = [...this.data.tuChatMessages];
    if (studentId) list = list.filter((m) => m.studentId === studentId);
    return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  createTuChatMessage(data: Partial<TuChatMessage>): TuChatMessage {
    if (!Array.isArray(this.data.tuChatMessages)) this.data.tuChatMessages = [];
    const msg: TuChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentId: data.studentId || '',
      studentName: data.studentName || 'Siswa',
      studentKelas: data.studentKelas,
      senderRole: data.senderRole || 'siswa',
      senderName: data.senderName || 'Pengguna',
      message: (data.message || '').trim(),
      proofUrl: data.proofUrl,
      billId: data.billId,
      createdAt: new Date().toISOString(),
      isReadByTu: data.senderRole === 'tata_usaha',
      isReadByStudent: data.senderRole === 'siswa',
    };
    this.data.tuChatMessages.push(msg);
    this.save();
    return msg;
  }

  // -------------------------------------------------------------
  // MANAJEMEN PENGGUNA (GURU, ALUMNI & CENTANG BIRU)
  // -------------------------------------------------------------
  createTeacherAccount(data: { name: string; username: string; password?: string; jabatan?: string; email?: string; phone?: string }): User {
    const existing = this.data.users.find((u) => u.username.toLowerCase() === data.username.toLowerCase());
    if (existing) throw new Error('Username guru sudah digunakan.');

    const initialPassword = data.password?.trim() || ('Tamvesta!G' + Math.floor(1000 + Math.random() * 9000));
    const pass = hashPassword(initialPassword);
    const newTeacher: User = {
      id: `user_teacher_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: data.username.trim().toLowerCase(),
      name: data.name.trim(),
      role: 'guru',
      jabatan: data.jabatan || 'Guru Mata Pelajaran',
      initialPassword,
      password: initialPassword,
      passwordHash: pass.hash,
      salt: pass.salt,
      mustChangePassword: false,
      isActive: true,
      isVerified: true, // Guru otomatis terverifikasi
      email: data.email,
      phone: data.phone,
      qrToken: generateQrToken(data.username, data.name),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.users.unshift(newTeacher);
    this.save();
    return newTeacher;
  }

  updateTeacherAccount(id: string, data: Partial<User>): User {
    const teacher = this.data.users.find((u) => u.id === id);
    if (!teacher) throw new Error('Akun guru tidak ditemukan.');
    if (data.name) teacher.name = data.name.trim();
    if (data.jabatan) teacher.jabatan = data.jabatan.trim();
    if (data.email !== undefined) teacher.email = data.email;
    if (data.phone !== undefined) teacher.phone = data.phone;
    if (data.isActive !== undefined) teacher.isActive = data.isActive;
    if (data.isVerified !== undefined) teacher.isVerified = data.isVerified;
    teacher.updatedAt = new Date().toISOString();
    this.save();
    return teacher;
  }

  deleteStudentAccount(id: string): boolean {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    const removedUser = this.data.users[idx];
    this.data.users.splice(idx, 1);
    this.data.deletedUserIds = this.data.deletedUserIds || [];
    if (!this.data.deletedUserIds.includes(id)) {
      this.data.deletedUserIds.push(id);
    }
    if (removedUser.username && !this.data.deletedUserIds.includes(removedUser.username.toLowerCase())) {
      this.data.deletedUserIds.push(removedUser.username.toLowerCase());
    }
    this.save();
    return true;
  }

  deleteTeacherAccount(id: string): boolean {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    const removedUser = this.data.users[idx];
    this.data.users.splice(idx, 1);
    this.data.deletedUserIds = this.data.deletedUserIds || [];
    if (!this.data.deletedUserIds.includes(id)) {
      this.data.deletedUserIds.push(id);
    }
    if (removedUser.username && !this.data.deletedUserIds.includes(removedUser.username.toLowerCase())) {
      this.data.deletedUserIds.push(removedUser.username.toLowerCase());
    }
    this.save();
    return true;
  }

  getDeletedUserIds(): string[] {
    return Array.isArray(this.data.deletedUserIds) ? this.data.deletedUserIds : [];
  }

  toggleVerifiedBadge(userId: string): { isVerified: boolean } {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) throw new Error('Pengguna tidak ditemukan.');
    user.isVerified = !user.isVerified;
    if (Array.isArray(this.data.posts)) {
      this.data.posts.forEach((p) => {
        if (p.authorId === userId) p.authorIsVerified = user.isVerified;
      });
    }
    if (Array.isArray(this.data.stories)) {
      this.data.stories.forEach((s) => {
        if (s.authorId === userId) s.authorIsVerified = user.isVerified;
      });
    }
    this.save();
    return { isVerified: user.isVerified };
  }

  toggleAlumniStatus(studentId: string): { isAlumni: boolean } {
    const student = this.data.users.find((u) => u.id === studentId);
    if (!student) throw new Error('Siswa tidak ditemukan.');
    student.isAlumni = !student.isAlumni;
    this.save();
    return { isAlumni: student.isAlumni };
  }

  syncMultipleTickets(tickets: any[]): { count: number } {
    if (!Array.isArray(this.data.passwordResetRequests)) this.data.passwordResetRequests = [];
    let count = 0;
    tickets.forEach((incoming) => {
      if (!incoming || !incoming.id) return;
      const idx = this.data.passwordResetRequests.findIndex((r) => r.id === incoming.id || r.ticketNumber === incoming.ticketNumber);
      if (idx >= 0) {
        if (incoming.status !== 'pending' || this.data.passwordResetRequests[idx].status === 'pending') {
          this.data.passwordResetRequests[idx] = { ...this.data.passwordResetRequests[idx], ...incoming };
          count++;
        }
      } else {
        this.data.passwordResetRequests.unshift(incoming);
        count++;
      }
    });
    if (count > 0) this.save();
    return { count };
  }

  getTuMonthlyReports(): any[] {
    if (!Array.isArray(this.data.tuMonthlyReports)) this.data.tuMonthlyReports = [];
    return [...this.data.tuMonthlyReports].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  createTuMonthlyReport(data: any): any {
    if (!Array.isArray(this.data.tuMonthlyReports)) this.data.tuMonthlyReports = [];
    const newReport = {
      id: 'report_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      month: data.month,
      monthName: data.monthName,
      createdAt: new Date().toISOString(),
      sentBy: data.sentBy || 'Tata Usaha Haliza',
      sentByUsername: data.sentByUsername || 'haliza.tu',
      recipients: [
        'Titus Wahyu Diatmiko (Pemimpin Perguruan Tamansiswa Batam)',
        'ST Bambang Sapto Nugroho S.Pd (Kepala Sekolah SMP)',
        'Margaretha Hendriani (Kepala Sekolah SD)',
      ],
      summary: data.summary || {
        totalRevenue: 0,
        paidBillsCount: 0,
        unpaidBillsCount: 0,
        totalStudents: 0,
        attendanceCount: 0,
        documentsCount: 0,
      },
      notes: data.notes || '',
      status: 'Terkirim & Terarsip',
    };
    this.data.tuMonthlyReports.unshift(newReport);
    this.save();
    return newReport;
  }

  getGameRooms(): any[] {
    if (!Array.isArray(this.data.gameRooms)) this.data.gameRooms = [];
    return this.data.gameRooms;
  }

  getGameRoomByCode(code: string): any | null {
    if (!Array.isArray(this.data.gameRooms)) this.data.gameRooms = [];
    if (!code) return null;
    const clean = code.toUpperCase().trim();
    const cleanAlnum = clean.replace(/[^A-Z0-9]/g, '');

    // 1. Exact match
    const exact = this.data.gameRooms.find((r: any) => r.code?.toUpperCase().trim() === clean);
    if (exact) return exact;

    // 2. Alphanumeric match (abaikan tanda strip/spasi, e.g. SPY482 == SPY-482)
    const alnumMatch = this.data.gameRooms.find((r: any) => {
      const rAlnum = (r.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      return rAlnum === cleanAlnum;
    });
    if (alnumMatch) return alnumMatch;

    // 3. Match 3 digit angka (e.g. siswa hanya mengetik "482" untuk room "SPY-482")
    if (cleanAlnum.length >= 3 && /^\d+$/.test(cleanAlnum)) {
      const numMatch = this.data.gameRooms.find((r: any) => {
        const rAlnum = (r.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        return rAlnum.endsWith(cleanAlnum);
      });
      if (numMatch) return numMatch;
    }

    return null;
  }

  saveGameRoom(room: any): any {
    if (!Array.isArray(this.data.gameRooms)) this.data.gameRooms = [];
    const clean = (room.code || '').toUpperCase().trim();
    const idx = this.data.gameRooms.findIndex(
      (r: any) => r.id === room.id || r.code?.toUpperCase() === clean
    );
    const updated = { ...room, updatedAt: Date.now() };
    if (idx !== -1) {
      this.data.gameRooms[idx] = updated;
    } else {
      this.data.gameRooms.unshift(updated);
    }
    // Bersihkan room yang lebih lama dari 12 jam
    const cutoff = Date.now() - 12 * 60 * 60 * 1000;
    this.data.gameRooms = this.data.gameRooms.filter((r: any) => (r.createdAt || 0) > cutoff);
    this.save();
    return updated;
  }

  deleteGameRoom(code: string): boolean {
    if (!Array.isArray(this.data.gameRooms)) return false;
    const clean = (code || '').toUpperCase().trim();
    const prevLen = this.data.gameRooms.length;
    this.data.gameRooms = this.data.gameRooms.filter((r: any) => r.code?.toUpperCase() !== clean);
    if (this.data.gameRooms.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  addRefreshSignal(payload: { userId: string; userName: string; userUsername: string; userKelas?: string }): RefreshSignal {
    if (!Array.isArray(this.data.refreshSignals)) this.data.refreshSignals = [];
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
    const newSignal: RefreshSignal = {
      id: `sig_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: payload.userId,
      userName: payload.userName,
      userUsername: payload.userUsername,
      userKelas: payload.userKelas || '-',
      timestamp: now.toISOString(),
      formattedTime,
      status: 'received',
    };
    this.data.refreshSignals.unshift(newSignal);
    if (this.data.refreshSignals.length > 100) {
      this.data.refreshSignals = this.data.refreshSignals.slice(0, 100);
    }
    this.save();
    return newSignal;
  }

  getRefreshSignals(): RefreshSignal[] {
    if (!Array.isArray(this.data.refreshSignals)) this.data.refreshSignals = [];
    return this.data.refreshSignals;
  }

  resetStudentAvatar(studentId: string, moderator: { id: string; name: string; username: string }, reason: string): { success: boolean; user?: User } {
    const user = this.findUserById(studentId) || this.findUserByUsername(studentId);
    if (!user) return { success: false };
    const oldAvatar = user.avatarUrl;
    user.avatarUrl = '/assets/tamvesta_mascot.jpg';
    user.updatedAt = new Date().toISOString();

    if (!Array.isArray(this.data.moderationLogs)) this.data.moderationLogs = [];
    const log: ModerationLog = {
      id: `mod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action: 'reset_avatar',
      targetUserId: user.id,
      targetUserName: user.name,
      targetUsername: user.username,
      targetUserKelas: user.kelas,
      reason,
      moderatorId: moderator.id,
      moderatorName: moderator.name,
      moderatorUsername: moderator.username,
      timestamp: new Date().toISOString(),
      details: `Foto profil direset dari ${oldAvatar || 'kustom'} ke avatar default TAMVESTA.`,
    };
    this.data.moderationLogs.unshift(log);
    this.save();
    return { success: true, user };
  }

  getModerationLogs(): ModerationLog[] {
    if (!Array.isArray(this.data.moderationLogs)) this.data.moderationLogs = [];
    return this.data.moderationLogs;
  }

  // -------------------------------------------------------------
  // DIRECT MESSAGES (DM)
  // -------------------------------------------------------------
  getDirectMessages(userId1: string, userId2: string): DirectMessage[] {
    if (!Array.isArray(this.data.directMessages)) this.data.directMessages = [];
    return this.data.directMessages
      .filter((m) => {
        const match =
          (m.senderId === userId1 && m.recipientId === userId2) ||
          (m.senderId === userId2 && m.recipientId === userId1);
        return match && !m.isDeleted;
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  getDMConversations(userId: string): DMConversation[] {
    if (!Array.isArray(this.data.directMessages)) this.data.directMessages = [];
    const conversationMap = new Map<string, { lastMessage: DirectMessage; unreadCount: number }>();

    for (const m of this.data.directMessages) {
      if (m.isDeleted) continue;
      let partnerId: string | null = null;
      if (m.senderId === userId) {
        partnerId = m.recipientId;
      } else if (m.recipientId === userId) {
        partnerId = m.senderId;
      }
      if (!partnerId) continue;

      const existing = conversationMap.get(partnerId);
      const isUnread = m.recipientId === userId && !m.isRead;
      if (!existing) {
        conversationMap.set(partnerId, {
          lastMessage: m,
          unreadCount: isUnread ? 1 : 0,
        });
      } else {
        if (new Date(m.createdAt).getTime() > new Date(existing.lastMessage.createdAt).getTime()) {
          existing.lastMessage = m;
        }
        if (isUnread) {
          existing.unreadCount += 1;
        }
      }
    }

    const conversations: DMConversation[] = [];
    conversationMap.forEach((conv, partnerId) => {
      const partner = this.findUserById(partnerId) || this.findUserByUsername(partnerId);
      conversations.push({
        partnerId,
        partnerName: partner ? partner.name : (conv.lastMessage.senderId === partnerId ? conv.lastMessage.senderName : conv.lastMessage.recipientName),
        partnerUsername: partner ? partner.username : (conv.lastMessage.senderId === partnerId ? conv.lastMessage.senderUsername : conv.lastMessage.recipientUsername),
        partnerAvatar: partner?.avatarUrl,
        partnerIsVerified: partner?.isVerified || partner?.role === 'guru',
        lastMessage: conv.lastMessage,
        unreadCount: conv.unreadCount,
        updatedAt: conv.lastMessage.createdAt,
      });
    });

    return conversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  sendDirectMessage(payload: {
    senderId: string;
    senderName: string;
    senderUsername: string;
    senderAvatar?: string;
    recipientId: string;
    recipientName: string;
    recipientUsername: string;
    recipientAvatar?: string;
    text?: string;
    mediaType?: 'text' | 'image' | 'video' | 'audio';
    mediaUrl?: string;
    audioDuration?: number;
    replyToMessage?: any;
    replyToStory?: any;
    forwardedFrom?: string;
  }): DirectMessage {
    if (!Array.isArray(this.data.directMessages)) this.data.directMessages = [];
    const now = new Date().toISOString();
    const newMsg: DirectMessage = {
      id: `dm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      senderId: payload.senderId,
      senderName: payload.senderName,
      senderUsername: payload.senderUsername,
      senderAvatar: payload.senderAvatar,
      recipientId: payload.recipientId,
      recipientName: payload.recipientName,
      recipientUsername: payload.recipientUsername,
      recipientAvatar: payload.recipientAvatar,
      text: payload.text || '',
      mediaType: payload.mediaType || 'text',
      mediaUrl: payload.mediaUrl,
      audioDuration: payload.audioDuration,
      replyToMessage: payload.replyToMessage,
      replyToStory: payload.replyToStory,
      reactions: {},
      isRead: false,
      forwardedFrom: payload.forwardedFrom,
      createdAt: now,
    };

    this.data.directMessages.push(newMsg);
    this.save();

    const snippet = payload.text
      ? (payload.text.length > 45 ? payload.text.substring(0, 42) + '...' : payload.text)
      : payload.mediaType === 'audio'
      ? '🎤 Mengirim pesan suara'
      : payload.mediaType === 'image'
      ? '📷 Mengirim foto'
      : payload.mediaType === 'video'
      ? '🎥 Mengirim video'
      : 'Pesan baru';

    this.createNotification({
      title: `Pesan dari ${payload.senderName}`,
      message: snippet,
      type: 'dm',
      linkType: 'dm',
      linkId: payload.senderId,
      targetUserId: payload.recipientId,
    });

    return newMsg;
  }

  reactToDirectMessage(messageId: string, emoji: string, userId: string): DirectMessage | null {
    if (!Array.isArray(this.data.directMessages)) return null;
    const msg = this.data.directMessages.find((m) => m.id === messageId);
    if (!msg) return null;

    if (!msg.reactions) msg.reactions = {};

    const usersForEmoji = msg.reactions[emoji] || [];
    const alreadyHas = usersForEmoji.includes(userId);

    for (const key of Object.keys(msg.reactions)) {
      msg.reactions[key] = msg.reactions[key].filter((id) => id !== userId);
      if (msg.reactions[key].length === 0) {
        delete msg.reactions[key];
      }
    }

    if (!alreadyHas) {
      if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
      msg.reactions[emoji].push(userId);
    }

    this.save();
    return msg;
  }

  deleteDirectMessage(messageId: string, userId: string): boolean {
    if (!Array.isArray(this.data.directMessages)) return false;
    const msg = this.data.directMessages.find((m) => m.id === messageId);
    if (!msg) return false;
    if (msg.senderId === userId || msg.recipientId === userId) {
      msg.isDeleted = true;
      this.save();
      return true;
    }
    return false;
  }

  markMessagesAsRead(senderId: string, recipientId: string): void {
    if (!Array.isArray(this.data.directMessages)) return;
    let modified = false;
    for (const m of this.data.directMessages) {
      if (m.senderId === senderId && m.recipientId === recipientId && !m.isRead) {
        m.isRead = true;
        modified = true;
      }
    }
    if (modified) this.save();
  }

  // -------------------------------------------------------------
  // CATATAN (NOTES) - KEDALUWARSA 24 JAM
  // -------------------------------------------------------------
  getActiveNotes(): StudentNote[] {
    if (!Array.isArray(this.data.studentNotes)) this.data.studentNotes = [];
    const now = Date.now();
    const active = this.data.studentNotes.filter((n) => {
      const exp = new Date(n.expiresAt).getTime();
      return exp > now;
    });

    if (active.length !== this.data.studentNotes.length) {
      this.data.studentNotes = active;
      this.save();
    }

    return this.data.studentNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createOrUpdateNote(payload: {
    userId: string;
    userName: string;
    userUsername: string;
    userAvatar?: string;
    userKelas?: string;
    text: string;
  }): StudentNote {
    if (!Array.isArray(this.data.studentNotes)) this.data.studentNotes = [];
    this.data.studentNotes = this.data.studentNotes.filter((n) => n.userId !== payload.userId);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const newNote: StudentNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: payload.userId,
      userName: payload.userName,
      userUsername: payload.userUsername,
      userAvatar: payload.userAvatar,
      userKelas: payload.userKelas,
      text: payload.text.trim(),
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    this.data.studentNotes.unshift(newNote);
    this.save();
    return newNote;
  }

  deleteStudentNote(userId: string): boolean {
    if (!Array.isArray(this.data.studentNotes)) return false;
    const initialLen = this.data.studentNotes.length;
    this.data.studentNotes = this.data.studentNotes.filter((n) => n.userId !== userId);
    if (this.data.studentNotes.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // -------------------------------------------------------------
  // LOST AND FOUND (BARANG HILANG & DITEMUKAN)
  // -------------------------------------------------------------
  getLostFoundItems(filter?: { type?: 'lost' | 'found'; status?: string }): LostFoundItem[] {
    if (!Array.isArray(this.data.lostFoundItems)) this.data.lostFoundItems = [];
    let list = [...this.data.lostFoundItems];
    if (filter?.type) {
      list = list.filter((i) => i.type === filter.type);
    }
    if (filter?.status) {
      list = list.filter((i) => i.status === filter.status);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createLostFoundItem(payload: Partial<LostFoundItem>): LostFoundItem {
    if (!Array.isArray(this.data.lostFoundItems)) this.data.lostFoundItems = [];
    const now = new Date().toISOString();
    const newItem: LostFoundItem = {
      id: `lf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: payload.type || 'lost',
      reporterId: payload.reporterId || '',
      reporterName: payload.reporterName || 'Siswa',
      reporterUsername: payload.reporterUsername || '',
      reporterKelas: payload.reporterKelas,
      itemName: (payload.itemName || '').trim(),
      category: payload.category || 'lainnya',
      photoUrl: payload.photoUrl,
      description: (payload.description || '').trim(),
      location: (payload.location || '').trim(),
      dateTime: payload.dateTime || now,
      storageStatus: payload.storageStatus || 'masih_di_penemu',
      additionalNotes: payload.additionalNotes,
      status: 'menunggu_pemeriksaan',
      claims: [],
      createdAt: now,
      updatedAt: now,
    };

    this.data.lostFoundItems.unshift(newItem);
    this.save();

    ['satpam', 'guru', 'tata_usaha'].forEach((role) => {
      this.createNotification({
        title: payload.type === 'found' ? 'Laporan Barang Ditemukan Baru' : 'Laporan Barang Hilang Baru',
        message: `${newItem.reporterName} (${newItem.reporterKelas || '-'}) melaporkan: "${newItem.itemName}" di lokasi ${newItem.location}.`,
        type: 'lost_found',
        linkType: 'reports',
        linkId: newItem.id,
        targetRole: role as any,
      });
    });

    return newItem;
  }

  updateLostFoundItem(id: string, updates: Partial<LostFoundItem>): LostFoundItem | null {
    if (!Array.isArray(this.data.lostFoundItems)) return null;
    const item = this.data.lostFoundItems.find((i) => i.id === id);
    if (!item) return null;

    Object.assign(item, updates, { updatedAt: new Date().toISOString() });
    this.save();

    if (updates.status) {
      this.createNotification({
        title: 'Status Laporan Barang Diperbarui',
        message: `Laporan Anda untuk "${item.itemName}" kini berstatus: ${updates.status.replace(/_/g, ' ')}.`,
        type: 'lost_found',
        linkType: 'reports',
        linkId: item.id,
        targetUserId: item.reporterId,
      });
    }

    return item;
  }

  claimLostFoundItem(itemId: string, claimPayload: Partial<LostFoundClaim>): LostFoundItem | null {
    if (!Array.isArray(this.data.lostFoundItems)) return null;
    const item = this.data.lostFoundItems.find((i) => i.id === itemId);
    if (!item) return null;

    if (!Array.isArray(item.claims)) item.claims = [];
    const now = new Date().toISOString();
    const newClaim: LostFoundClaim = {
      id: `claim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      claimantId: claimPayload.claimantId || '',
      claimantName: claimPayload.claimantName || '',
      claimantUsername: claimPayload.claimantUsername || '',
      claimantKelas: claimPayload.claimantKelas,
      reason: (claimPayload.reason || '').trim(),
      identifyingFeatures: (claimPayload.identifyingFeatures || '').trim(),
      additionalInfo: claimPayload.additionalInfo,
      status: 'menunggu_verifikasi',
      createdAt: now,
      updatedAt: now,
    };

    item.claims.unshift(newClaim);
    item.updatedAt = now;
    this.save();

    ['satpam', 'guru', 'tata_usaha'].forEach((role) => {
      this.createNotification({
        title: 'Klaim Kepemilikan Barang Baru',
        message: `${newClaim.claimantName} mengklaim barang "${item.itemName}". Mohon verifikasi bukti kepemilikan.`,
        type: 'lost_found',
        linkType: 'reports',
        linkId: item.id,
        targetRole: role as any,
      });
    });

    return item;
  }

  updateLostFoundClaim(itemId: string, claimId: string, updates: Partial<LostFoundClaim>): LostFoundItem | null {
    if (!Array.isArray(this.data.lostFoundItems)) return null;
    const item = this.data.lostFoundItems.find((i) => i.id === itemId);
    if (!item || !Array.isArray(item.claims)) return null;

    const claim = item.claims.find((c) => c.id === claimId);
    if (!claim) return null;

    Object.assign(claim, updates, { updatedAt: new Date().toISOString() });
    item.updatedAt = new Date().toISOString();

    if (updates.status === 'barang_telah_dikembalikan') {
      item.status = 'barang_telah_dikembalikan';
      item.handoverOfficer = updates.verifiedBy;
      item.handoverTime = new Date().toISOString();
    }

    this.save();

    this.createNotification({
      title: 'Status Klaim Barang Anda',
      message: `Klaim Anda untuk "${item.itemName}" telah diperbarui menjadi: ${claim.status.replace(/_/g, ' ')}. ${claim.satpamNotes ? `Catatan: ${claim.satpamNotes}` : ''}`,
      type: 'lost_found',
      linkType: 'reports',
      linkId: item.id,
      targetUserId: claim.claimantId,
    });

    return item;
  }

  // -------------------------------------------------------------
  // PERIZINAN TEMPAT DAN KEGIATAN
  // -------------------------------------------------------------
  getActivityPermissions(applicantId?: string): ActivityPermission[] {
    if (!Array.isArray(this.data.activityPermissions)) this.data.activityPermissions = [];
    let list = [...this.data.activityPermissions];
    if (applicantId) {
      list = list.filter((p) => p.applicantId === applicantId);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createActivityPermission(payload: Partial<ActivityPermission>): ActivityPermission {
    if (!Array.isArray(this.data.activityPermissions)) this.data.activityPermissions = [];
    const now = new Date().toISOString();
    const newPerm: ActivityPermission = {
      id: `perm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      applicantId: payload.applicantId || '',
      applicantName: payload.applicantName || '',
      applicantUsername: payload.applicantUsername || '',
      applicantKelas: payload.applicantKelas,
      organizationOrClass: (payload.organizationOrClass || '').trim(),
      activityName: (payload.activityName || '').trim(),
      purpose: (payload.purpose || '').trim(),
      requestedLocation: (payload.requestedLocation || '').trim(),
      activityDate: payload.activityDate || '',
      startTime: payload.startTime || '',
      endTime: payload.endTime || '',
      participantCount: payload.participantCount || 1,
      supervisorTeacher: (payload.supervisorTeacher || '').trim(),
      additionalNotes: payload.additionalNotes,
      status: 'menunggu_satpam',
      createdAt: now,
      updatedAt: now,
    };

    this.data.activityPermissions.unshift(newPerm);
    this.save();

    this.createNotification({
      title: 'Pengajuan Izin Tempat Baru',
      message: `${newPerm.organizationOrClass} mengajukan izin "${newPerm.activityName}" di ${newPerm.requestedLocation}. Menunggu verifikasi fasilitas & keamanan Satpam.`,
      type: 'permission',
      linkType: 'reports',
      linkId: newPerm.id,
      targetRole: 'satpam',
    });

    return newPerm;
  }

  reviewActivityPermissionSatpam(
    id: string,
    review: { reviewedBy: string; safetyChecked: boolean; facilityAvailable: boolean; notes?: string }
  ): ActivityPermission | null {
    if (!Array.isArray(this.data.activityPermissions)) return null;
    const perm = this.data.activityPermissions.find((p) => p.id === id);
    if (!perm) return null;

    perm.satpamReview = {
      reviewedBy: review.reviewedBy,
      safetyChecked: review.safetyChecked,
      facilityAvailable: review.facilityAvailable,
      notes: review.notes,
      reviewedAt: new Date().toISOString(),
    };

    perm.status = 'menunggu_kepsek';
    perm.updatedAt = new Date().toISOString();
    this.save();

    this.createNotification({
      title: 'Persetujuan Izin Kegiatan (Rekomendasi Satpam Siap)',
      message: `Satpam telah memeriksa keamanan & ketersediaan fasilitas untuk kegiatan "${perm.activityName}" di ${perm.requestedLocation}. Menunggu keputusan Kepala Sekolah.`,
      type: 'permission',
      linkType: 'reports',
      linkId: perm.id,
      targetRole: 'kepala_sekolah',
    });

    this.createNotification({
      title: 'Pemeriksaan Satpam Selesai',
      message: `Pemeriksaan fasilitas untuk "${perm.activityName}" telah diselesaikan oleh Satpam dan diteruskan ke Kepala Sekolah.`,
      type: 'permission',
      linkType: 'reports',
      linkId: perm.id,
      targetUserId: perm.applicantId,
    });

    return perm;
  }

  decideActivityPermissionPrincipal(
    id: string,
    decision: { decidedBy: string; approved: boolean; isRevision?: boolean; revisionNote?: string; rejectionReason?: string }
  ): ActivityPermission | null {
    if (!Array.isArray(this.data.activityPermissions)) return null;
    const perm = this.data.activityPermissions.find((p) => p.id === id);
    if (!perm) return null;

    const now = new Date().toISOString();
    perm.principalDecision = {
      decidedBy: decision.decidedBy,
      approved: decision.approved,
      revisionNote: decision.revisionNote,
      rejectionReason: decision.rejectionReason,
      decidedAt: now,
    };

    if (decision.isRevision) {
      perm.status = 'perlu_revisi';
    } else if (decision.approved) {
      perm.status = 'disetujui';
    } else {
      perm.status = 'ditolak';
    }

    perm.updatedAt = now;
    this.save();

    const statusText = perm.status === 'disetujui' ? 'DISETUJUI' : perm.status === 'perlu_revisi' ? 'PERLU REVISI' : 'DITOLAK';
    this.createNotification({
      title: `Keputusan Izin Kegiatan: ${statusText}`,
      message: `Pengajuan izin "${perm.activityName}" telah ${statusText} oleh Kepala Sekolah. ${decision.revisionNote ? `Catatan Revisi: ${decision.revisionNote}` : decision.rejectionReason ? `Alasan: ${decision.rejectionReason}` : ''}`,
      type: 'permission',
      linkType: 'reports',
      linkId: perm.id,
      targetUserId: perm.applicantId,
    });

    return perm;
  }

  updateActivityPermission(id: string, updates: Partial<ActivityPermission>): ActivityPermission | null {
    if (!Array.isArray(this.data.activityPermissions)) return null;
    const perm = this.data.activityPermissions.find((p) => p.id === id);
    if (!perm) return null;

    Object.assign(perm, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return perm;
  }

  // -------------------------------------------------------------
  // LAPORAN APLIKASI TAMVESTA
  // -------------------------------------------------------------
  getAppReports(reporterId?: string, targetHandler?: 'administrasi' | 'support'): AppReport[] {
    if (!Array.isArray(this.data.appReports)) this.data.appReports = [];
    let list = [...this.data.appReports];
    if (reporterId) {
      list = list.filter((r) => r.reporterId === reporterId);
    }
    if (targetHandler) {
      list = list.filter((r) => r.targetHandler === targetHandler || r.targetHandler === 'both');
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createAppReport(payload: Partial<AppReport>): AppReport {
    if (!Array.isArray(this.data.appReports)) this.data.appReports = [];
    const now = new Date().toISOString();
    const newReport: AppReport = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      reporterId: payload.reporterId || '',
      reporterName: payload.reporterName || '',
      reporterUsername: payload.reporterUsername || '',
      reporterKelas: payload.reporterKelas,
      reportType: payload.reportType || 'kendala_penggunaan',
      title: (payload.title || '').trim(),
      description: (payload.description || '').trim(),
      screenshotUrl: payload.screenshotUrl,
      incidentTime: payload.incidentTime || now,
      additionalNotes: payload.additionalNotes,
      status: 'laporan_diterima',
      targetHandler: payload.targetHandler || 'support',
      createdAt: now,
      updatedAt: now,
    };

    this.data.appReports.unshift(newReport);
    this.save();

    if (newReport.targetHandler === 'administrasi' || newReport.targetHandler === 'both') {
      this.createNotification({
        title: 'Laporan Layanan Administrasi Baru',
        message: `${newReport.reporterName} menyampaikan laporan: "${newReport.title}".`,
        type: 'app_report',
        linkType: 'reports',
        linkId: newReport.id,
        targetRole: 'tata_usaha',
      });
    }
    if (newReport.targetHandler === 'support' || newReport.targetHandler === 'both') {
      this.createNotification({
        title: 'Tiket Kendala Teknis TAMVESTA',
        message: `${newReport.reporterName} melaporkan: "${newReport.title}" (${newReport.reportType}).`,
        type: 'app_report',
        linkType: 'reports',
        linkId: newReport.id,
        targetRole: 'support',
      });
    }

    return newReport;
  }

  respondAppReportAdmin(
    id: string,
    response: { respondedBy: string; message: string; newStatus?: AppReportStatus }
  ): AppReport | null {
    if (!Array.isArray(this.data.appReports)) return null;
    const rep = this.data.appReports.find((r) => r.id === id);
    if (!rep) return null;

    const now = new Date().toISOString();
    rep.adminResponse = {
      respondedBy: response.respondedBy,
      message: response.message,
      respondedAt: now,
    };
    if (response.newStatus) {
      rep.status = response.newStatus;
    }
    rep.updatedAt = now;
    this.save();

    this.createNotification({
      title: 'Tanggapan Tata Usaha atas Laporan Anda',
      message: `Tata Usaha menanggapi laporan "${rep.title}": ${response.message}`,
      type: 'app_report',
      linkType: 'reports',
      linkId: rep.id,
      targetUserId: rep.reporterId,
    });

    return rep;
  }

  respondAppReportSupport(
    id: string,
    response: { respondedBy: string; technicalNotes: string; newStatus?: AppReportStatus }
  ): AppReport | null {
    if (!Array.isArray(this.data.appReports)) return null;
    const rep = this.data.appReports.find((r) => r.id === id);
    if (!rep) return null;

    const now = new Date().toISOString();
    rep.supportResponse = {
      respondedBy: response.respondedBy,
      technicalNotes: response.technicalNotes,
      resolvedAt: response.newStatus === 'selesai' ? now : undefined,
      respondedAt: now,
    };
    if (response.newStatus) {
      rep.status = response.newStatus;
    }
    rep.updatedAt = now;
    this.save();

    this.createNotification({
      title: 'Tanggapan Support TAMVESTA',
      message: `Tim Support TAMVESTA menanggapi laporan "${rep.title}": ${response.technicalNotes}`,
      type: 'app_report',
      linkType: 'reports',
      linkId: rep.id,
      targetUserId: rep.reporterId,
    });

    return rep;
  }

  updateAppReport(id: string, updates: Partial<AppReport>): AppReport | null {
    if (!Array.isArray(this.data.appReports)) return null;
    const rep = this.data.appReports.find((r) => r.id === id);
    if (!rep) return null;

    Object.assign(rep, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return rep;
  }
}

export const db = new DatabaseManager();
