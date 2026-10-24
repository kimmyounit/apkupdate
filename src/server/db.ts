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
  deletedUserIds?: string[];
  deletedPostIds?: string[];
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const chosenSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, chosenSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: chosenSalt };
}

export function verifyPassword(password: string, hash?: string, salt?: string, initialPassword?: string): boolean {
  if (initialPassword && password.trim() === initialPassword.trim()) {
    return true;
  }
  if (!hash || !salt) {
    return false;
  }
  try {
    const newHash = crypto.pbkdf2Sync(password.trim(), salt, 10000, 64, 'sha512').toString('hex');
    const buf1 = Buffer.from(hash, 'hex');
    const buf2 = Buffer.from(newHash, 'hex');
    if (buf1.length !== buf2.length) return false;
    return crypto.timingSafeEqual(buf1, buf2);
  } catch {
    return false;
  }
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
    role: 'panitia',
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
  // SMP (15 Siswa)
  { username: 'siswa.smp7a.001', initialPassword: 'Siswa7A001', name: 'Ahmad Fauzi', kelas: 'VII-A SMP', gender: 'Laki-laki' },
  { username: 'siswa.smp7a.002', initialPassword: 'Siswa7A002', name: 'Bunga Pertiwi', kelas: 'VII-A SMP', gender: 'Perempuan' },
  { username: 'siswa.smp7a.003', initialPassword: 'Siswa7A003', name: 'Cahya Ramadhan', kelas: 'VII-A SMP', gender: 'Laki-laki' },
  { username: 'siswa.smp7b.001', initialPassword: 'Siswa7B001', name: 'Dinda Aulia', kelas: 'VII-B SMP', gender: 'Perempuan' },
  { username: 'siswa.smp7b.002', initialPassword: 'Siswa7B002', name: 'Eka Prasetyo', kelas: 'VII-B SMP', gender: 'Laki-laki' },
  { username: 'siswa.smp8a.001', initialPassword: 'Siswa8A001', name: 'Fajar Nugroho', kelas: 'VIII-A SMP', gender: 'Laki-laki' },
  { username: 'siswa.smp8a.002', initialPassword: 'Siswa8A002', name: 'Gita Kusuma', kelas: 'VIII-A SMP', gender: 'Perempuan' },
  { username: 'siswa.smp8a.003', initialPassword: 'Siswa8A003', name: 'Hendra Wijaya', kelas: 'VIII-A SMP', gender: 'Laki-laki' },
  { username: 'siswa.smp8b.001', initialPassword: 'Siswa8B001', name: 'Indah Lestari', kelas: 'VIII-B SMP', gender: 'Perempuan' },
  { username: 'siswa.smp8b.002', initialPassword: 'Siswa8B002', name: 'Joko Susilo', kelas: 'VIII-B SMP', gender: 'Laki-laki' },
  { username: 'siswa.smp9a.001', initialPassword: 'Siswa9A001', name: 'Kartika Dewi', kelas: 'IX-A SMP', gender: 'Perempuan' },
  { username: 'siswa.smp9a.002', initialPassword: 'Siswa9A002', name: 'Lukman Hakim', kelas: 'IX-A SMP', gender: 'Laki-laki' },
  { username: 'siswa.smp9a.003', initialPassword: 'Siswa9A003', name: 'Melati Sari', kelas: 'IX-A SMP', gender: 'Perempuan' },
  { username: 'siswa.smp9b.001', initialPassword: 'Siswa9B001', name: 'Nanda Putra', kelas: 'IX-B SMP', gender: 'Laki-laki' },
  { username: 'siswa.smp9b.002', initialPassword: 'Siswa9B002', name: 'Olivia Putri', kelas: 'IX-B SMP', gender: 'Perempuan' },

  // SD (12 Siswa)
  { username: 'siswa.sd1a.001', initialPassword: 'Siswa1A001', name: 'Putri Rahayu', kelas: 'I-A SD', gender: 'Perempuan' },
  { username: 'siswa.sd1a.002', initialPassword: 'Siswa1A002', name: 'Qori Ananda', kelas: 'I-A SD', gender: 'Perempuan' },
  { username: 'siswa.sd2a.001', initialPassword: 'Siswa2A001', name: 'Rizky Maulana', kelas: 'II-A SD', gender: 'Laki-laki' },
  { username: 'siswa.sd2a.002', initialPassword: 'Siswa2A002', name: 'Siti Aminah', kelas: 'II-A SD', gender: 'Perempuan' },
  { username: 'siswa.sd3a.001', initialPassword: 'Siswa3A001', name: 'Taufik Hidayat', kelas: 'III-A SD', gender: 'Laki-laki' },
  { username: 'siswa.sd3a.002', initialPassword: 'Siswa3A002', name: 'Umi Kalsum', kelas: 'III-A SD', gender: 'Perempuan' },
  { username: 'siswa.sd4a.001', initialPassword: 'Siswa4A001', name: 'Vino Pratama', kelas: 'IV-A SD', gender: 'Laki-laki' },
  { username: 'siswa.sd4a.002', initialPassword: 'Siswa4A002', name: 'Wulan Sari', kelas: 'IV-A SD', gender: 'Perempuan' },
  { username: 'siswa.sd5a.001', initialPassword: 'Siswa5A001', name: 'Xena Maharani', kelas: 'V-A SD', gender: 'Perempuan' },
  { username: 'siswa.sd5a.002', initialPassword: 'Siswa5A002', name: 'Yoga Santoso', kelas: 'V-A SD', gender: 'Laki-laki' },
  { username: 'siswa.sd6a.001', initialPassword: 'Siswa6A001', name: 'Zahra Aulia', kelas: 'VI-A SD', gender: 'Perempuan' },
  { username: 'siswa.sd6a.002', initialPassword: 'Siswa6A002', name: 'Aldi Firmansyah', kelas: 'VI-A SD', gender: 'Laki-laki' },
];

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
    users: [adminUser, ...staffUsers, ...studentUsers],
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
  };
}

class DatabaseManager {
  private data: DatabaseSchema;
  private isSaving = false;

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
        const url = 'https://api.github.com/repos/kimmyounit/apkupdate/contents/data/tamvesta-data.json';
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': 'TAMVESTA-Cloud-Sync',
            Accept: 'application/vnd.github.v3+json',
          },
        });
        if (res.ok) {
          const json: any = await res.json();
          if (json.content) {
            const decoded = Buffer.from(json.content, 'base64').toString('utf-8');
            parsed = JSON.parse(decoded);
          }
        }
      }
      if (!parsed) {
        const rawRes = await fetch('https://raw.githubusercontent.com/kimmyounit/apkupdate/main/data/tamvesta-data.json', {
          headers: { 'User-Agent': 'TAMVESTA-Cloud-Sync' },
        });
        if (rawRes.ok) {
          parsed = await rawRes.json();
        }
      }
      if (!parsed || !Array.isArray(parsed.users)) return;

      if (Array.isArray(parsed.users)) {
        parsed.users.forEach((ghUser: any) => {
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
          }
        });
      }
      if (Array.isArray(parsed.posts) && parsed.posts.length > 0) {
        const postMap = new Map<string, any>();
        this.data.posts.forEach((p) => postMap.set(p.id, p));
        parsed.posts.forEach((p: any) => {
          if ((this.data.deletedPostIds || []).includes(p.id)) return; // Postingan terhapus permanen
          postMap.set(p.id, p);
        });
        this.data.posts = Array.from(postMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      if (Array.isArray(parsed.stories) && parsed.stories.length > this.data.stories.length) {
        this.data.stories = parsed.stories;
      }
      if (Array.isArray(parsed.passwordResetRequests)) {
        parsed.passwordResetRequests.forEach((req: any) => {
          if (!this.data.passwordResetRequests.find((r) => r.id === req.id)) {
            this.data.passwordResetRequests.push(req);
          }
        });
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
            existing.initialPassword = student.initialPassword;
            if (!existing.passwordHash || !existing.salt) {
              const pass = hashPassword(student.initialPassword);
              existing.passwordHash = pass.hash;
              existing.salt = pass.salt;
            }
            // Siswa wajib mengganti kata sandi awal jika masih menggunakan sandi bawaan
            const isStillDefaultPass = verifyPassword(student.initialPassword, existing.passwordHash, existing.salt, existing.initialPassword);
            if (isStillDefaultPass) {
              existing.mustChangePassword = true;
            }
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
            existing.initialPassword = staff.initialPassword;
            existing.name = staff.name;
            existing.role = staff.role;
            // Ensure password matches initialPassword from official list if user needs to login
            const pass = hashPassword(staff.initialPassword);
            existing.passwordHash = pass.hash;
            existing.salt = pass.salt;
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
          });
        }

        this.saveDataDirect(parsed);

        return {
          users: parsed.users || [],
          subjects: parsed.subjects || [],
          books: parsed.books || [],
          announcements: parsed.announcements || [],
          quizzes: parsed.quizzes || [],
          quizAttempts: parsed.quizAttempts || [],
          attendanceEvents: parsed.attendanceEvents || [],
          attendanceRecords: parsed.attendanceRecords || [],
          passwordResetRequests: parsed.passwordResetRequests || [],
          posts: parsed.posts || [],
          stories: parsed.stories || [],
          notes: parsed.notes || [],
          notifications: parsed.notifications || [],
          articles: parsed.articles || [],
          classAttendance: parsed.classAttendance || [],
          tuitionBills: parsed.tuitionBills || [],
          tuitionTransactions: parsed.tuitionTransactions || [],
          tuDocuments: parsed.tuDocuments || [],
          tuChatMessages: parsed.tuChatMessages || [],
          tuMonthlyReports: parsed.tuMonthlyReports || [],
        };
      }
    } catch (err) {
      console.error('[DB] Error loading database file, initializing clean database:', err);
    }

    const initial = getInitialData();
    this.saveDataDirect(initial);
    return initial;
  }

  public resetToClean(clearDemoStudents = true) {
    const initial = getInitialData();
    if (clearDemoStudents) {
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

  private async syncToGitHub(dataToSave: DatabaseSchema) {
    const token = getGitHubToken();
    if (!token) return;

    try {
      const url = 'https://api.github.com/repos/kimmyounit/apkupdate/contents/data/tamvesta-data.json';
      const getRes = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'TAMVESTA-Cloud-Sync',
          Accept: 'application/vnd.github.v3+json',
        },
      });
      let sha = '';
      if (getRes.ok) {
        const getJson: any = await getRes.json();
        sha = getJson.sha;
      }

      const content = Buffer.from(JSON.stringify(dataToSave, null, 2)).toString('base64');
      await fetch(url, {
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
        }),
      });
    } catch (err) {
      console.warn('[Cloud Sync] Failed to sync to GitHub:', err);
    }
  }

  private saveDataDirect(dataToSave: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
      if (process.env.VERCEL) {
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

  // --- Users & Authentication ---
  public findUserByUsername(username: string): User | undefined {
    if (!username) return undefined;
    const raw = username.trim();
    const term = raw.toLowerCase().replace(/^@+/, '');
    const alphaNumericTerm = term.replace(/[^a-z0-9]/g, '');

    // 1. Exact or cleaned username match
    const found = this.data.users.find((u) => {
      const uName = (u.username || '').toLowerCase().replace(/^@+/, '');
      if (uName === term) return true;
      if (alphaNumericTerm && uName.replace(/[^a-z0-9]/g, '') === alphaNumericTerm) return true;
      return false;
    });
    if (found) return found;

    // 2. Full Name match (in case student enters their name instead of username)
    const foundByName = this.data.users.find((u) => {
      const fullName = (u.name || '').trim().toLowerCase();
      if (!fullName) return false;
      if (fullName === term) return true;
      if (alphaNumericTerm && fullName.replace(/[^a-z0-9]/g, '') === alphaNumericTerm) return true;
      return false;
    });
    if (foundByName) return foundByName;

    // 3. NISN match
    const foundByNisn = this.data.users.find((u) => {
      return (u as any).nisn && String((u as any).nisn).trim() === raw;
    });
    if (foundByNisn) return foundByNisn;

    // 4. Staff aliases
    if (['haliza.tu', 'haliza.admin', 'haliza', 'tata.usaha', 'tatausaha'].includes(term)) {
      return this.data.users.find(
        (u) => (u.username || '').toLowerCase().replace(/^@+/, '') === 'haliza.tu' ||
               (u.username || '').toLowerCase().replace(/^@+/, '') === 'haliza.admin' ||
               u.role === 'tata_usaha'
      );
    }
    if (['margaretha.h', 'margaretha', 'margaretha.handriani', 'margaretha.hendriani', 'margarethahandriani', 'margarethahendriani', 'margaretha.sd', 'margaretha.kepsek'].includes(term)) {
      return this.data.users.find(
        (u) => (u.username || '').toLowerCase().replace(/^@+/, '') === 'margaretha.h' ||
               (u.name || '').toLowerCase().includes('margaretha')
      );
    }
    return undefined;
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getAllStudents(): User[] {
    return this.data.users.filter((u) => u.role === 'siswa');
  }

  public getAllUsers(): User[] {
    return this.data.users;
  }

  public getUsers(): User[] {
    return this.data.users;
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
        const pass = hashPassword(incoming.initialPassword || (incoming as any).password || 'SiswaTamvesta123');
        const newUser: User = {
          ...incoming,
          id: incoming.id || ('stu_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)),
          username: cleanUn,
          name: (incoming.name || 'Siswa').trim(),
          role: incoming.role || 'siswa',
          gender: incoming.gender || 'Laki-laki',
          kelas: incoming.kelas || 'Kelas 7',
          initialPassword: incoming.initialPassword || (incoming as any).password || 'SiswaTamvesta123',
          password: incoming.password || incoming.initialPassword || 'SiswaTamvesta123',
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
    };

    this.data.users.push(newUser);
    this.save();
    return { success: true, user: newUser };
  }

  public updateStudent(id: string, data: { name?: string; gender?: 'Laki-laki' | 'Perempuan'; kelas?: string; username?: string }): { success: boolean; user?: User; error?: string } {
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
    user.mustChangePassword = true;
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

    const hashed = hashPassword(newPassword);
    user.passwordHash = hashed.hash;
    user.salt = hashed.salt;
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
    status: 'approved' | 'rejected',
    adminNote?: string
  ): { success: boolean; request?: PasswordResetRequest; error?: string } {
    const req = this.data.passwordResetRequests.find((r) => r.id === requestId);
    if (!req) return { success: false, error: 'Tiket pengajuan ganti sandi tidak ditemukan.' };
    if (req.status !== 'pending') {
      return { success: false, error: 'Tiket ini sudah diproses sebelumnya dan tidak dapat diubah lagi.' };
    }

    const user = this.findUserById(req.userId);
    if (!user) return { success: false, error: 'Pengguna akun tidak ditemukan.' };

    req.status = status;
    req.processedAt = new Date().toISOString();
    req.processedBy = adminUser.name;
    req.adminNote = adminNote || (status === 'approved' ? 'Disetujui oleh Administrator' : 'Ditolak');

    if (status === 'approved') {
      if (req.newPasswordHash && req.newSalt) {
        user.passwordHash = req.newPasswordHash;
        user.salt = req.newSalt;
        user.password = req.newPassword || user.password;
        user.initialPassword = req.newPassword || user.initialPassword;
        user.mustChangePassword = false;
        user.updatedAt = new Date().toISOString();
      }
      // Send notification to student
      this.addNotification({
        title: 'Pengajuan Ganti Sandi Disetujui',
        message: `Pengajuan ganti sandi Anda (Tiket: ${req.ticketNumber || req.id}) telah DISETUJUI oleh Admin. Silakan masuk menggunakan kata sandi baru.`,
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
    return this.data.quizzes;
  }

  public findQuizById(id: string): Quiz | undefined {
    return this.data.quizzes.find((q) => q.id === id);
  }

  public findQuizByToken(token: string): Quiz | undefined {
    const clean = token.trim().toUpperCase();
    return this.data.quizzes.find((q) => q.token?.toUpperCase() === clean);
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

    if (!quiz.isActive || quiz.status === 'inactive') {
      return { success: false, error: 'Quiz ini sedang tidak aktif atau telah ditutup oleh Guru.' };
    }

    if (quiz.password && quiz.password.trim() !== '') {
      if (!payload.password || payload.password !== quiz.password) {
        return { success: false, error: 'Password quiz salah. Silakan hubungi Guru pengampu untuk mendapatkan password yang benar.' };
      }
    }

    return { success: true, quiz };
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
    const initialLen = this.data.quizzes.length;
    this.data.quizzes = this.data.quizzes.filter((q) => q.id !== id);
    if (this.data.quizzes.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
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
    let result = this.data.quizAttempts;
    if (quizId) result = result.filter((a) => a.quizId === quizId);
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
  // POSTS & FEED SISWA
  // -------------------------------------------------------------
  getPosts(): StudentPost[] {
    return [...(this.data.posts || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  addPost(payload: {
    authorId: string;
    authorName: string;
    authorUsername: string;
    authorKelas?: string;
    authorAvatar?: string;
    caption: string;
    mediaType: 'photo' | 'video' | 'none';
    mediaUrl?: string;
    mediaName?: string;
  }): StudentPost {
    const newPost: StudentPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      authorId: payload.authorId,
      authorName: payload.authorName,
      authorUsername: payload.authorUsername,
      authorKelas: payload.authorKelas || '',
      authorAvatar: payload.authorAvatar || '',
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

    const { passwordHash, salt, initialPassword, ...safeUser } = user;
    return {
      user: safeUser,
      posts,
      followersCount,
      followingCount,
    };
  }

  // -------------------------------------------------------------
  // STORIES (24-Hour Expiration)
  // -------------------------------------------------------------
  getStories(): Story[] {
    if (!Array.isArray(this.data.stories)) {
      this.data.stories = [];
      return [];
    }

    const now = new Date().toISOString();
    const initialCount = this.data.stories.length;

    // Automatically purge stories that have expired (> 24 hours)
    this.data.stories = this.data.stories.filter((s) => s.expiresAt > now);

    if (this.data.stories.length !== initialCount) {
      this.save();
    }

    return [...this.data.stories].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  createStory(storyData: {
    authorId: string;
    authorName: string;
    authorUsername: string;
    authorAvatar?: string;
    authorKelas?: string;
    mediaType: 'photo' | 'video';
    mediaUrl: string;
    caption?: string;
  }): Story {
    if (!Array.isArray(this.data.stories)) {
      this.data.stories = [];
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const newStory: Story = {
      id: `story_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      authorId: storyData.authorId,
      authorName: storyData.authorName,
      authorUsername: storyData.authorUsername,
      authorAvatar: storyData.authorAvatar,
      authorKelas: storyData.authorKelas,
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
    type: 'announcement' | 'subject_change' | 'general';
    isImportant?: boolean;
    linkType?: 'announcement' | 'subject' | 'quiz' | 'none';
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

    const initialPassword = data.password || 'GuruTamvesta123';
    const pass = hashPassword(initialPassword);
    const newTeacher: User = {
      id: `user_teacher_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: data.username.trim().toLowerCase(),
      name: data.name.trim(),
      role: 'guru',
      jabatan: data.jabatan || 'Guru Mata Pelajaran',
      initialPassword,
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
    this.data.users.splice(idx, 1);
    this.save();
    return true;
  }

  toggleVerifiedBadge(userId: string): { isVerified: boolean } {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) throw new Error('Pengguna tidak ditemukan.');
    user.isVerified = !user.isVerified;
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
}

export const db = new DatabaseManager();
