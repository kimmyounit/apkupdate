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
} from '../types/index.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'tamvesta-data.json');

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
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const chosenSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, chosenSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: chosenSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const newHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(newHash, 'hex'));
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
    jabatan: 'Kepala Sekolah',
    username: 'bambang.kepsek',
    initialPassword: 'Tamvesta!B2601',
    role: 'kepala_sekolah',
  },
  {
    name: 'Titus Wahyu Diatmiko',
    jabatan: 'Ketua Yayasan Perguruan Tamansiswa Batam',
    username: 'titus.yayasan',
    initialPassword: 'Tamvesta!T2602',
    role: 'kepala_sekolah',
  },
  {
    name: 'Margaretha Hendriani',
    jabatan: 'Kepala Sekolah SD & Guru',
    username: 'margaretha.h',
    initialPassword: 'Tamvesta!M2603',
    role: 'guru',
  },
  {
    name: 'Bambang Sapto Nugroho',
    jabatan: 'Operator Dapodik Sekolah',
    username: 'bambang.operator',
    initialPassword: 'Tamvesta!B2604',
    role: 'admin',
  },
  {
    name: 'Haliza',
    jabatan: 'Administrasi',
    username: 'haliza.admin',
    initialPassword: 'Tamvesta!H2605',
    role: 'admin',
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
      passwordHash: pass.hash,
      salt: pass.salt,
      mustChangePassword: false, // Guru & staf tidak dipaksa ganti password
      isActive: true,
      qrToken: generateQrToken(id, staff.username),
      createdAt: now,
      updatedAt: now,
    };
  });

  // 3. Akun Guru Demo Tambahan
  const guru1Pass = hashPassword('GuruTamvesta123');
  const guru1: User = {
    id: 'user_guru_budi',
    username: 'guru.matematika',
    name: 'Budi Santoso, S.Pd.',
    role: 'guru',
    jabatan: 'Guru Matematika',
    initialPassword: 'GuruTamvesta123',
    passwordHash: guru1Pass.hash,
    salt: guru1Pass.salt,
    mustChangePassword: false,
    isActive: true,
    qrToken: generateQrToken('user_guru_budi', 'guru.matematika'),
    createdAt: now,
    updatedAt: now,
  };

  const guru2Pass = hashPassword('GuruTamvesta123');
  const guru2: User = {
    id: 'user_guru_siti',
    username: 'guru.bahasa',
    name: 'Dra. Siti Rahmawati, M.Pd.',
    role: 'guru',
    jabatan: 'Guru Bahasa Indonesia',
    initialPassword: 'GuruTamvesta123',
    passwordHash: guru2Pass.hash,
    salt: guru2Pass.salt,
    mustChangePassword: false,
    isActive: true,
    qrToken: generateQrToken('user_guru_siti', 'guru.bahasa'),
    createdAt: now,
    updatedAt: now,
  };

  // 4. Akun Siswa Demo — SMP Tamansiswa Batam
  interface SiswaPreset {
    id: string; username: string; name: string; nisn: string; kelas: string; password: string;
  }
  const smpStudents: SiswaPreset[] = [
    { id: 'siswa_smp_7a_001', username: 'siswa.smp7a.001', name: 'Ahmad Fauzi',          nisn: '1234567801', kelas: 'VII-A SMP', password: 'Siswa7A001' },
    { id: 'siswa_smp_7a_002', username: 'siswa.smp7a.002', name: 'Bunga Pertiwi',        nisn: '1234567802', kelas: 'VII-A SMP', password: 'Siswa7A002' },
    { id: 'siswa_smp_7a_003', username: 'siswa.smp7a.003', name: 'Cahya Ramadhan',       nisn: '1234567803', kelas: 'VII-A SMP', password: 'Siswa7A003' },
    { id: 'siswa_smp_7b_001', username: 'siswa.smp7b.001', name: 'Dinda Aulia',          nisn: '1234567804', kelas: 'VII-B SMP', password: 'Siswa7B001' },
    { id: 'siswa_smp_7b_002', username: 'siswa.smp7b.002', name: 'Eka Prasetyo',         nisn: '1234567805', kelas: 'VII-B SMP', password: 'Siswa7B002' },
    { id: 'siswa_smp_8a_001', username: 'siswa.smp8a.001', name: 'Fajar Nugroho',        nisn: '1234567806', kelas: 'VIII-A SMP', password: 'Siswa8A001' },
    { id: 'siswa_smp_8a_002', username: 'siswa.smp8a.002', name: 'Gita Kusuma',          nisn: '1234567807', kelas: 'VIII-A SMP', password: 'Siswa8A002' },
    { id: 'siswa_smp_8a_003', username: 'siswa.smp8a.003', name: 'Hendra Wijaya',        nisn: '1234567808', kelas: 'VIII-A SMP', password: 'Siswa8A003' },
    { id: 'siswa_smp_8b_001', username: 'siswa.smp8b.001', name: 'Indah Lestari',        nisn: '1234567809', kelas: 'VIII-B SMP', password: 'Siswa8B001' },
    { id: 'siswa_smp_8b_002', username: 'siswa.smp8b.002', name: 'Joko Susilo',          nisn: '1234567810', kelas: 'VIII-B SMP', password: 'Siswa8B002' },
    { id: 'siswa_smp_9a_001', username: 'siswa.smp9a.001', name: 'Kartika Dewi',         nisn: '1234567811', kelas: 'IX-A SMP', password: 'Siswa9A001' },
    { id: 'siswa_smp_9a_002', username: 'siswa.smp9a.002', name: 'Lukman Hakim',         nisn: '1234567812', kelas: 'IX-A SMP', password: 'Siswa9A002' },
    { id: 'siswa_smp_9a_003', username: 'siswa.smp9a.003', name: 'Melati Sari',          nisn: '1234567813', kelas: 'IX-A SMP', password: 'Siswa9A003' },
    { id: 'siswa_smp_9b_001', username: 'siswa.smp9b.001', name: 'Nanda Putra',          nisn: '1234567814', kelas: 'IX-B SMP', password: 'Siswa9B001' },
    { id: 'siswa_smp_9b_002', username: 'siswa.smp9b.002', name: 'Olivia Putri',         nisn: '1234567815', kelas: 'IX-B SMP', password: 'Siswa9B002' },
  ];

  // 5. Akun Siswa Demo — SD Tamansiswa Batam
  const sdStudents: SiswaPreset[] = [
    { id: 'siswa_sd_1a_001',  username: 'siswa.sd1a.001',  name: 'Putri Rahayu',         nisn: '2234567801', kelas: 'I-A SD',   password: 'Siswa1A001' },
    { id: 'siswa_sd_1a_002',  username: 'siswa.sd1a.002',  name: 'Qori Ananda',           nisn: '2234567802', kelas: 'I-A SD',   password: 'Siswa1A002' },
    { id: 'siswa_sd_2a_001',  username: 'siswa.sd2a.001',  name: 'Rizky Maulana',         nisn: '2234567803', kelas: 'II-A SD',  password: 'Siswa2A001' },
    { id: 'siswa_sd_2a_002',  username: 'siswa.sd2a.002',  name: 'Siti Aminah',           nisn: '2234567804', kelas: 'II-A SD',  password: 'Siswa2A002' },
    { id: 'siswa_sd_3a_001',  username: 'siswa.sd3a.001',  name: 'Taufik Hidayat',        nisn: '2234567805', kelas: 'III-A SD', password: 'Siswa3A001' },
    { id: 'siswa_sd_3a_002',  username: 'siswa.sd3a.002',  name: 'Umi Kalsum',            nisn: '2234567806', kelas: 'III-A SD', password: 'Siswa3A002' },
    { id: 'siswa_sd_4a_001',  username: 'siswa.sd4a.001',  name: 'Vino Pratama',          nisn: '2234567807', kelas: 'IV-A SD',  password: 'Siswa4A001' },
    { id: 'siswa_sd_4a_002',  username: 'siswa.sd4a.002',  name: 'Wulan Sari',            nisn: '2234567808', kelas: 'IV-A SD',  password: 'Siswa4A002' },
    { id: 'siswa_sd_5a_001',  username: 'siswa.sd5a.001',  name: 'Xena Maharani',         nisn: '2234567809', kelas: 'V-A SD',   password: 'Siswa5A001' },
    { id: 'siswa_sd_5a_002',  username: 'siswa.sd5a.002',  name: 'Yoga Santoso',          nisn: '2234567810', kelas: 'V-A SD',   password: 'Siswa5A002' },
    { id: 'siswa_sd_6a_001',  username: 'siswa.sd6a.001',  name: 'Zahra Aulia',           nisn: '2234567811', kelas: 'VI-A SD',  password: 'Siswa6A001' },
    { id: 'siswa_sd_6a_002',  username: 'siswa.sd6a.002',  name: 'Aldi Firmansyah',       nisn: '2234567812', kelas: 'VI-A SD',  password: 'Siswa6A002' },
  ];

  const allStudents: User[] = [...smpStudents, ...sdStudents].map((s) => {
    const pass = hashPassword(s.password);
    return {
      id: s.id,
      username: s.username,
      name: s.name,
      role: 'siswa' as UserRole,
      nisn: s.nisn,
      kelas: s.kelas,
      initialPassword: s.password,
      passwordHash: pass.hash,
      salt: pass.salt,
      mustChangePassword: false, // Siswa TIDAK dipaksa ganti password
      isActive: true,
      qrToken: generateQrToken(s.id, s.username),
      createdAt: now,
      updatedAt: now,
    };
  });

  return {
    users: [adminUser, ...staffUsers, guru1, guru2, ...allStudents],
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
  };
}

class DatabaseManager {
  private data: DatabaseSchema;
  private isSaving = false;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
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

        // Pastikan semua akun siswa demo SMP & SD ada di database
        const initial = getInitialData();
        const demoStudents = initial.users.filter(u => u.role === 'siswa');
        demoStudents.forEach((student) => {
          const existing = parsed.users.find((u: User) => u.username === student.username);
          if (!existing) {
            parsed.users.push(student);
          } else {
            // Refresh password & data jika akun sudah ada
            existing.passwordHash = student.passwordHash;
            existing.salt = student.salt;
            existing.initialPassword = student.initialPassword;
            existing.kelas = student.kelas;
            existing.nisn = student.nisn;
            existing.mustChangePassword = false;
            existing.isActive = true;
          }
        });

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

  private saveDataDirect(dataToSave: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
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
    return this.data.users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );
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

  public createStudent(userData: {
    name: string;
    username: string;
    password: string;
    nisn?: string;
    kelas?: string;
  }): { success: boolean; user?: User; error?: string } {
    const trimmedUsername = userData.username.trim();
    if (!trimmedUsername) {
      return { success: false, error: 'Username wajib diisi.' };
    }
    if (!userData.name.trim()) {
      return { success: false, error: 'Nama lengkap siswa wajib diisi.' };
    }
    if (!userData.password || userData.password.length < 6) {
      return { success: false, error: 'Password minimal 6 karakter demi keamanan akun.' };
    }

    // Check unique username
    const exists = this.findUserByUsername(trimmedUsername);
    if (exists) {
      return { success: false, error: `Username "${trimmedUsername}" sudah terdaftar. Gunakan username lain.` };
    }

    const now = new Date().toISOString();
    const id = `stu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const pass = hashPassword(userData.password);
    const qrToken = generateQrToken(id, trimmedUsername);

    const newUser: User = {
      id,
      username: trimmedUsername,
      name: userData.name.trim(),
      role: 'siswa',
      nisn: userData.nisn?.trim() || `006${Math.floor(1000000 + Math.random() * 9000000)}`,
      kelas: userData.kelas?.trim() || 'X Tamansiswa',
      passwordHash: pass.hash,
      salt: pass.salt,
      mustChangePassword: true, // Wajib ganti password pada login pertama
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
    const hashed = hashPassword(newPassword);
    user.passwordHash = hashed.hash;
    user.salt = hashed.salt;
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
    if (!verifyPassword(oldPassword, user.passwordHash, user.salt)) {
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
  public createPasswordResetRequest(userId: string, reason: string): { success: boolean; request?: PasswordResetRequest; error?: string } {
    const user = this.findUserById(userId);
    if (!user) return { success: false, error: 'Pengguna tidak ditemukan.' };
    if (user.role === 'admin' || user.username === 'TAMANSISWA') {
      return { success: false, error: 'Akun Administrator tidak memerlukan pengajuan reset password.' };
    }

    if (!reason || reason.trim().length < 5) {
      return { success: false, error: 'Mohon tuliskan alasan atau keterangan permintaan reset password (minimal 5 karakter).' };
    }

    // Check for existing pending request
    const existing = this.data.passwordResetRequests.find(
      (r) => r.userId === userId && r.status === 'pending'
    );
    if (existing) {
      return { success: false, error: 'Anda sudah memiliki permintaan reset password yang sedang menunggu verifikasi Administrator.' };
    }

    const newReq: PasswordResetRequest = {
      id: `pr_${Date.now()}`,
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      reason: reason.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.data.passwordResetRequests.unshift(newReq);
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
    tempPassword?: string,
    adminNote?: string
  ): { success: boolean; request?: PasswordResetRequest; tempPassword?: string; error?: string } {
    const req = this.data.passwordResetRequests.find((r) => r.id === requestId);
    if (!req) return { success: false, error: 'Permintaan reset password tidak ditemukan.' };

    const user = this.findUserById(req.userId);
    if (!user) return { success: false, error: 'Pengguna akun tidak ditemukan.' };

    req.status = status;
    req.processedAt = new Date().toISOString();
    req.processedBy = adminUser.name;
    req.adminNote = adminNote || (status === 'approved' ? 'Disetujui oleh Administrator' : 'Ditolak');

    let assignedPassword = tempPassword;
    if (status === 'approved') {
      if (!assignedPassword) {
        assignedPassword = `TAMVESTA${Math.floor(1000 + Math.random() * 9000)}`;
      }
      const hashed = hashPassword(assignedPassword);
      user.passwordHash = hashed.hash;
      user.salt = hashed.salt;
      user.mustChangePassword = true;
      user.updatedAt = new Date().toISOString();
    }

    this.save();
    return { success: true, request: req, tempPassword: assignedPassword };
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

  updateUserProfile(userId: string, data: { bio?: string; avatarUrl?: string }): User | null {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return null;

    if (data.bio !== undefined) {
      user.bio = data.bio.trim().substring(0, 300);
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
}

export const db = new DatabaseManager();
