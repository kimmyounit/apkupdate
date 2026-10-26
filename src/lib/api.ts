import {
  offlineStore,
  getPermanentAvatar,
  savePermanentAvatar,
  getPermanentBio,
  savePermanentBio,
} from './offlineStore.ts';
import type {
  User,
  Subject,
  DigitalBook,
  Announcement,
  Quiz,
  QuizAttempt,
  AttendanceEvent,
  AttendanceRecord,
  ScanResultPayload,
  PasswordResetRequest,
  StudentPost,
  PostComment,
  Story,
  PersonalNote,
  AppNotification,
  GameRoom,
  GamePlayer,
  GameType,
  SpySettings,
  MafiaSettings,
} from '../types/index.ts';
import {
  createGameRoom,
  joinOrReconnectRoom,
  startSpyGame,
  startMafiaGame,
  evaluateSpyVoting,
  evaluateMafiaNight,
  evaluateMafiaVoting,
} from './gameEngine.ts';

const TOKEN_KEY = 'tamvesta_auth_token';
const SERVER_URL_KEY = 'tamvesta_server_url';
export const DEFAULT_SERVER_URL = 'https://apkupdate-indol.vercel.app';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
  offlineStore.setCurrentUserId(null);
}

/** Ambil base URL server yang tersimpan, default ke Vercel Cloud https://apkupdate-indol.vercel.app */
export function getServerUrl(): string {
  const stored = localStorage.getItem(SERVER_URL_KEY);
  // Bersihkan IP lokal lama laptop atau domain lama jika tersimpan
  if (
    stored &&
    (stored.includes('192.168.') ||
      stored.includes('localhost') ||
      stored.includes('127.0.0.1') ||
      stored.includes(':3000') ||
      stored.includes('tamvestaa.vercel.app') ||
      stored.includes('apkupdate.vercel.app'))
  ) {
    localStorage.removeItem(SERVER_URL_KEY);
    return DEFAULT_SERVER_URL;
  }
  if (stored) {
    return stored;
  }
  return DEFAULT_SERVER_URL;
}

/** Simpan base URL server agar APK bisa konek ke laptop */
export function setServerUrl(url: string) {
  const trimmed = url.replace(/\/+$/, ''); // hapus trailing slash
  localStorage.setItem(SERVER_URL_KEY, trimmed);
}

export function clearServerUrl() {
  localStorage.removeItem(SERVER_URL_KEY);
}

/**
 * Cek apakah server yang dikonfigurasi bisa dijangkau.
 * Return true jika /api/health merespons OK.
 */
export async function pingServer(customUrl?: string): Promise<boolean> {
  const base = (customUrl !== undefined ? customUrl : getServerUrl()).replace(/\/+$/, '');
  if (!base) return false;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(`${base}/api/health`, { signal: ctrl.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

// Detect if running in native Capacitor standalone APK or without remote backend
const isStandalone = typeof window !== 'undefined' && (
  window.location.protocol === 'capacitor:' ||
  window.location.protocol === 'file:' ||
  (window as any).Capacitor?.isNativePlatform?.() ||
  !window.location.hostname
);

/**
 * Resolves a relative endpoint like '/api/auth/login' to the full URL.
 * Priority: (1) if browser is directly accessing server port, relative path.
 * (2) configured/default server URL (e.g. http://192.168.1.2:3000).
 */
function resolveUrl(endpoint: string): string {
  if (
    typeof window !== 'undefined' &&
    window.location.protocol.startsWith('http') &&
    (window.location.port === '3000' || window.location.hostname === '192.168.1.2')
  ) {
    return endpoint;
  }
  const base = getServerUrl();
  if (base) return `${base}${endpoint}`;
  return endpoint;
}

async function tryServerRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = resolveUrl(endpoint);
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err: any = new Error(data.error || data.message || `Request gagal (${response.status})`);
      err.status = response.status;
      throw err;
    }
    return data as T;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export const api = {
  // Pre-sync all public users from server for multi-device support
  syncPublicUsers: async () => {
    try {
      const syncRes = await tryServerRequest<{ users: User[]; passwordResetRequests?: any[]; deletedUserIds?: string[] }>('/api/users/public-sync');
      if (Array.isArray(syncRes?.deletedUserIds) && syncRes.deletedUserIds.length > 0) {
        offlineStore.recordDeletedUserIds(syncRes.deletedUserIds);
      }
      if (Array.isArray(syncRes?.users) && syncRes.users.length > 0) {
        offlineStore.mergeUsersFromServer(syncRes.users);
        if (Array.isArray(syncRes.passwordResetRequests)) {
          syncRes.passwordResetRequests.forEach((t: any) => offlineStore.saveTicketDirect(t));
        }
        return syncRes.users;
      }
    } catch (_) {}
    return null;
  },

  // Bulk sync local users to cloud server
  syncLocalUsersToServer: async () => {
    try {
      const localUsers = offlineStore.getStudents();
      if (Array.isArray(localUsers) && localUsers.length > 0) {
        return await tryServerRequest<{ success: boolean; added: number; updated: number }>('/api/admin/sync-local-users', {
          method: 'POST',
          body: JSON.stringify({ users: localUsers }),
        });
      }
    } catch (_) {}
    return null;
  },

  // Bulk sync local tickets to cloud server
  syncLocalTicketsToServer: async () => {
    try {
      const localTickets = offlineStore.getPasswordResetRequests();
      if (Array.isArray(localTickets) && localTickets.length > 0) {
        return await tryServerRequest<{ count: number }>('/api/student/tickets/sync-multiple', {
          method: 'POST',
          body: JSON.stringify({ tickets: localTickets }),
        });
      }
    } catch (_) {}
    return null;
  },

  // Auth
  registerStudent: async (data: { name: string; username: string; password: string; confirmPassword?: string; gender: 'Laki-laki' | 'Perempuan'; kelas: string }) => {
    try {
      return await tryServerRequest<{ message: string; user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (_) {
      const local = offlineStore.createStudent(data);
      return { message: 'Pendaftaran akun siswa berhasil! Silakan masuk.', user: local };
    }
  },

  login: async (credentials: { username: string; password: string }) => {
    let serverError: any = null;
    const cleanCredentials = {
      username: credentials.username.trim().toLowerCase().replace(/^@+/, ''),
      password: credentials.password,
    };

    // Coba login via server terlebih dahulu
    try {
      const res = await tryServerRequest<{ token: string; user: User; mustChangePassword: boolean }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(cleanCredentials),
      });
      setStoredToken(res.token);
      offlineStore.setCurrentUserId(res.user.id);
      // Simpan user + password ke localStorage agar bisa login offline selamanya
      offlineStore.saveStudentFromServer(res.user, credentials.password);
      return { ...res, mustChangePassword: false };
    } catch (err: any) {
      serverError = err;
      // Akun dinonaktifkan secara eksplisit
      if (err.status === 403) throw err;
    }

    // Coba login di penyimpanan lokal
    try {
      const res = offlineStore.login(cleanCredentials);
      setStoredToken(res.token);
      return res;
    } catch (_offlineErr) {
      // User tidak ditemukan di lokal dan server — coba ambil semua users dari server
      // lalu merge ke localStorage dan coba login ulang (untuk HP baru / fresh install)
      try {
        const syncRes = await tryServerRequest<{ users: User[]; deletedUserIds?: string[] }>('/api/users/public-sync');
        if (Array.isArray(syncRes?.deletedUserIds) && syncRes.deletedUserIds.length > 0) {
          offlineStore.recordDeletedUserIds(syncRes.deletedUserIds);
        }
        if (Array.isArray(syncRes?.users) && syncRes.users.length > 0) {
          offlineStore.mergeUsersFromServer(syncRes.users);
          if (Array.isArray((syncRes as any).passwordResetRequests)) {
            (syncRes as any).passwordResetRequests.forEach((t: any) => offlineStore.saveTicketDirect(t));
          }
          // Coba login lagi setelah merge
          try {
            const res2 = offlineStore.login(cleanCredentials);
            setStoredToken(res2.token);
            return res2;
          } catch (_) {}
        }
      } catch (_syncErr) {}

      // Lempar error server jika 401 (salah password), atau error lokal
      if (serverError && serverError.status === 401) throw serverError;
      throw new Error('Username atau kata sandi tidak valid. Pastikan akun sudah terdaftar oleh Admin.');
    }
  },

  getMe: async () => {
    try {
      const res = await tryServerRequest<{ user: User; mustChangePassword: boolean }>('/api/auth/me');
      offlineStore.setCurrentUserId(res.user.id);
      offlineStore.syncUserFromServer(res.user);
      return res;
    } catch (_) {
      return offlineStore.getMe();
    }
  },

  changePassword: async (passwords: { oldPassword: string; newPassword: string }) => {
    try {
      return await tryServerRequest<{ message: string; user: User }>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(passwords),
      });
    } catch (_) {
      return offlineStore.changePassword(passwords.oldPassword, passwords.newPassword);
    }
  },

  updateUsername: async (newUsername: string) => {
    try {
      const res = await tryServerRequest<{ message: string; user: User; token: string }>('/api/auth/username', {
        method: 'PUT',
        body: JSON.stringify({ newUsername }),
      });
      if (res.token) setStoredToken(res.token);
      return res;
    } catch (_) {
      const res = offlineStore.updateUsername(newUsername);
      setStoredToken(res.token);
      return res;
    }
  },

  updateProfile: async (data: { avatarUrl?: string; bio?: string; phone?: string; email?: string }) => {
    try {
      offlineStore.updateProfile(data);
    } catch (_) {}

    try {
      const channel = new BroadcastChannel('tamvesta_admin_sync');
      channel.postMessage({ type: 'REFRESH_ALL', timestamp: Date.now() });
      channel.close();
    } catch (_) {}

    try {
      const res = await tryServerRequest<{ message: string; user: User }>('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (res && res.user) {
        offlineStore.syncUserFromServer(res.user);
      }
      return res;
    } catch (_) {
      return { message: 'Profil berhasil diperbarui', user: offlineStore.getCurrentUser()! };
    }
  },

  requestPasswordReset: async (data: { newPassword: string; confirmPassword?: string; reason?: string }) => {
    try {
      const res = await tryServerRequest<{ message: string; request: PasswordResetRequest }>('/api/auth/password-reset-request', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (res && res.request) {
        offlineStore.saveTicketDirect(res.request);
      }
      return res;
    } catch (_) {
      const user = offlineStore.getCurrentUser();
      const req = offlineStore.createPasswordResetRequest({
        userId: user ? user.id : 'unknown',
        newPassword: data.newPassword,
        reason: data.reason,
      });
      return {
        message: 'Pengajuan ganti sandi berhasil dikirim! Menunggu persetujuan Administrator.',
        request: req,
      };
    }
  },

  getStudentTickets: async () => {
    const user = offlineStore.getCurrentUser();
    const local = user ? offlineStore.getStudentTickets(user.id) : [];
    try {
      const serverTickets = await tryServerRequest<PasswordResetRequest[]>('/api/student/tickets');
      if (Array.isArray(serverTickets)) {
        serverTickets.forEach((t) => offlineStore.saveTicketDirect(t));
      }
      const map = new Map<string, PasswordResetRequest>();
      local.forEach((t) => map.set(t.id, t));
      if (Array.isArray(serverTickets)) {
        serverTickets.forEach((t) => map.set(t.id, t));
      }
      // Sync any local tickets (e.g. offline rejections) to server
      try {
        if (local.length > 0) {
          tryServerRequest('/api/admin/sync-local-tickets', {
            method: 'POST',
            body: JSON.stringify({ tickets: local }),
          }).catch(() => {});
        }
      } catch (_) {}

      return Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (_) {
      return local;
    }
  },

  // Admin
  getPasswordResetRequests: async () => {
    const localRequests = offlineStore.getPasswordResetRequests();
    let serverRequests: PasswordResetRequest[] = [];
    try {
      serverRequests = await tryServerRequest<PasswordResetRequest[]>('/api/admin/password-reset-requests');
    } catch (_) {
      serverRequests = [];
    }

    const map = new Map<string, PasswordResetRequest>();
    localRequests.forEach((r) => map.set(r.id, r));
    if (Array.isArray(serverRequests) && serverRequests.length > 0) {
      serverRequests.forEach((r) => {
        map.set(r.id, r);
        offlineStore.saveTicketDirect(r);
      });
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  processPasswordResetRequest: async (id: string, status: 'approved' | 'rejected', adminNote?: string) => {
    try {
      const serverRes = await tryServerRequest<{ message: string; request?: PasswordResetRequest }>(
        `/api/admin/password-reset-requests/${id}/process`,
        {
          method: 'POST',
          body: JSON.stringify({ status, adminNote }),
        }
      );
      try {
        offlineStore.processPasswordResetRequest(id, status, adminNote);
      } catch (_) {}
      return serverRes;
    } catch (_) {
      const req = offlineStore.processPasswordResetRequest(id, status, adminNote);
      return { message: `Pengajuan ganti sandi berhasil di-${status === 'approved' ? 'setujui' : 'tolak'}.`, request: req };
    }
  },

  getStudents: async () => {
    let serverStudents: User[] = [];
    try {
      const resp = await tryServerRequest<any>('/api/admin/students?withDeleted=true');
      if (Array.isArray(resp)) {
        serverStudents = resp;
      } else if (resp && Array.isArray(resp.students)) {
        serverStudents = resp.students;
        if (Array.isArray(resp.deletedUserIds) && resp.deletedUserIds.length > 0) {
          offlineStore.recordDeletedUserIds(resp.deletedUserIds);
        }
      }
    } catch (_) {
      serverStudents = [];
    }

    const localStudents = offlineStore.getStudents();
    const studentMap = new Map<string, User>();
    const deletedIds = offlineStore.getDeletedUserIds();

    // 1. Put all local students first so newly created accounts are ALWAYS included immediately
    localStudents.forEach((ls) => {
      const cleanU = (ls.username || '').toLowerCase().replace(/^@+/, '');
      if (!deletedIds.includes(ls.id) && !deletedIds.includes(cleanU) && !deletedIds.includes((ls.username || '').toLowerCase())) {
        const permAvatar = getPermanentAvatar(ls.id, ls.username);
        const permBio = getPermanentBio(ls.id, ls.username);
        studentMap.set(cleanU, {
          ...ls,
          avatarUrl: permAvatar || ls.avatarUrl,
          bio: permBio !== null && permBio !== undefined ? permBio : ls.bio,
        });
      }
    });

    // 2. Merge server students: ALWAYS update with latest server data (photo, bio, phone, email)!
    if (Array.isArray(serverStudents) && serverStudents.length > 0) {
      serverStudents.forEach((ss) => {
        const cleanU = (ss.username || '').toLowerCase().replace(/^@+/, '');
        if (!deletedIds.includes(ss.id) && !deletedIds.includes(cleanU) && !deletedIds.includes((ss.username || '').toLowerCase())) {
          const existing = studentMap.get(cleanU);
          const permAvatar = getPermanentAvatar(ss.id, ss.username);
          const permBio = getPermanentBio(ss.id, ss.username);
          const finalAvatar = ss.avatarUrl || (existing ? existing.avatarUrl : null) || permAvatar;
          const finalBio = ss.bio || (existing ? existing.bio : null) || permBio;
          const finalPhone = ss.phone || (existing ? existing.phone : undefined);
          const finalEmail = ss.email || (existing ? existing.email : undefined);

          const merged: User = {
            ...(existing || {}),
            ...ss,
            avatarUrl: finalAvatar || ss.avatarUrl,
            bio: finalBio || ss.bio,
            phone: finalPhone,
            email: finalEmail,
          };

          if (finalAvatar) savePermanentAvatar(ss.id, ss.username, finalAvatar);
          if (finalBio !== undefined && finalBio !== null) savePermanentBio(ss.id, ss.username, finalBio);

          studentMap.set(cleanU, merged);
          offlineStore.syncStudentEntity(merged);
        }
      });
    }

    return Array.from(studentMap.values());
  },

  updateStudent: async (id: string, data: Partial<User>) => {
    try {
      return await tryServerRequest<{ message: string; student: User }>(`/api/admin/students/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (_) {
      const updated = offlineStore.updateStudent(id, data);
      return { message: 'Data siswa berhasil diperbarui', student: updated as User };
    }
  },

  deleteStudent: async (id: string) => {
    offlineStore.deleteStudent(id);
    try {
      return await tryServerRequest<{ message: string }>(`/api/admin/students/${id}`, {
        method: 'DELETE',
      });
    } catch (_) {
      return { message: 'Akun siswa berhasil dihapus.' };
    }
  },

  createStudent: async (studentData: Partial<User> & { password?: string }) => {
    const rawPass = (studentData.password || ('Siswa' + Math.floor(100000 + Math.random() * 900000))).trim();
    const studentPayload = {
      ...studentData,
      password: rawPass,
      initialPassword: rawPass,
      mustChangePassword: false,
    };
    // Always persist to local storage first so it is immediately visible & never lost
    const localStudent = offlineStore.createStudent(studentPayload);

    try {
      const res = await tryServerRequest<{ message: string; student: User }>('/api/admin/students', {
        method: 'POST',
        body: JSON.stringify({
          ...studentPayload,
          password: rawPass,
        }),
      });
      if (res && res.student) {
        offlineStore.saveStudentFromServer(res.student, rawPass);
        return { message: res.message || 'Akun siswa berhasil didaftarkan!', student: res.student };
      }
      return { message: 'Akun siswa berhasil didaftarkan!', student: localStudent };
    } catch (_) {
      return { message: 'Akun siswa berhasil didaftarkan!', student: localStudent };
    }
  },

  toggleStudentStatus: async (studentId: string) => {
    try {
      return await tryServerRequest<{ message: string; isActive: boolean }>(`/api/admin/students/${studentId}/toggle-active`, {
        method: 'PATCH',
      });
    } catch (_) {
      return { message: 'Status siswa berhasil diperbarui', isActive: true };
    }
  },

  resetStudentPassword: async (studentId: string, newPassword?: string) => {
    if (newPassword) {
      offlineStore.resetStudentPassword(studentId, newPassword);
    }
    try {
      return await tryServerRequest<{ message: string }>(`/api/admin/students/${studentId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      });
    } catch (_) {
      return { message: 'Kata sandi siswa berhasil direset.' };
    }
  },

  getStaff: async () => {
    let serverStaff: User[] = [];
    try {
      serverStaff = await tryServerRequest<User[]>('/api/admin/staff');
    } catch (_) {
      serverStaff = [];
    }

    const localStaff = offlineStore.getStaff();
    const staffMap = new Map<string, User>();
    const deletedIds = offlineStore.getDeletedUserIds();

    // 1. Put all local staff first so newly created accounts are ALWAYS included immediately
    localStaff.forEach((ls) => {
      const cleanU = (ls.username || '').toLowerCase().replace(/^@+/, '');
      if (!deletedIds.includes(ls.id) && !deletedIds.includes(cleanU)) {
        staffMap.set(cleanU, ls);
      }
    });

    // 2. Merge server staff
    if (Array.isArray(serverStaff) && serverStaff.length > 0) {
      serverStaff.forEach((ss) => {
        const cleanU = (ss.username || '').toLowerCase().replace(/^@+/, '');
        if (!deletedIds.includes(ss.id) && !deletedIds.includes(cleanU)) {
          if (!staffMap.has(cleanU)) {
            staffMap.set(cleanU, ss);
            offlineStore.syncUserFromServer(ss);
          }
        }
      });
    }

    return Array.from(staffMap.values());
  },

  resetStaffInitialPassword: async (staffId: string) => {
    try {
      return await tryServerRequest<{ message: string; initialPassword?: string }>(`/api/admin/staff/${staffId}/reset-initial`, {
        method: 'POST',
      });
    } catch (_) {
      return { message: 'Kata sandi awal berhasil disetel ulang.', initialPassword: '(Sandi awal resmi)' };
    }
  },

  // Subjects
  getSubjects: async () => {
    try {
      return await tryServerRequest<Subject[]>('/api/subjects');
    } catch (_) {
      return offlineStore.getSubjects();
    }
  },

  createSubject: async (data: Partial<Subject>) => {
    try {
      return await tryServerRequest<Subject>('/api/subjects', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (_) {
      return { id: 'subj_' + Date.now(), name: data.name || '', code: data.code || '', grade: data.grade || '10', teacherId: data.teacherId || '', teacherName: data.teacherName || '', description: '', schedule: 'Sesuai Jadwal', imageUrl: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Subject;
    }
  },

  updateSubject: async (id: string, data: Partial<Subject>) => {
    try {
      return await tryServerRequest<Subject>(`/api/subjects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (_) {
      return { id, ...data } as Subject;
    }
  },

  deleteSubject: async (id: string) => {
    try {
      return await tryServerRequest<{ message: string }>(`/api/subjects/${id}`, {
        method: 'DELETE',
      });
    } catch (_) {
      return { message: 'Mata pelajaran berhasil dihapus' };
    }
  },

  // Books
  getBooks: async () => {
    try {
      return await tryServerRequest<DigitalBook[]>('/api/books');
    } catch (_) {
      return offlineStore.getBooks();
    }
  },

  createBook: async (data: Partial<DigitalBook>) => {
    try {
      return await tryServerRequest<DigitalBook>('/api/books', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (_) {
      return { id: 'book_' + Date.now(), title: data.title || '', author: data.author || '', category: data.category || '', coverUrl: data.coverUrl || '', description: '', totalPages: 0, publishedYear: '2024', content: [], createdAt: new Date().toISOString() } as DigitalBook;
    }
  },

  updateBook: async (id: string, data: Partial<DigitalBook>) => {
    try {
      return await tryServerRequest<DigitalBook>(`/api/books/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (_) {
      return { id, ...data } as DigitalBook;
    }
  },

  deleteBook: async (id: string) => {
    try {
      return await tryServerRequest<{ message: string }>(`/api/books/${id}`, {
        method: 'DELETE',
      });
    } catch (_) {
      return { message: 'Buku berhasil dihapus' };
    }
  },

  // Announcements
  getAnnouncements: async () => {
    try {
      return await tryServerRequest<Announcement[]>('/api/announcements');
    } catch (_) {
      return offlineStore.getAnnouncements();
    }
  },

  createAnnouncement: async (data: Partial<Announcement>) => {
    try {
      return await tryServerRequest<Announcement>('/api/announcements', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (_) {
      return { id: 'ann_' + Date.now(), title: data.title || '', content: data.content || '', authorName: data.authorName || 'Admin', category: (data.category as 'Penting' | 'Akademik' | 'Kegiatan' | 'Umum') || 'Penting', authorRole: 'Admin Sekolah', isPublished: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Announcement;
    }
  },

  updateAnnouncement: async (id: string, data: Partial<Announcement>) => {
    try {
      return await tryServerRequest<Announcement>(`/api/announcements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (_) {
      return { id, ...data } as Announcement;
    }
  },

  deleteAnnouncement: async (id: string) => {
    try {
      return await tryServerRequest<{ message: string }>(`/api/announcements/${id}`, {
        method: 'DELETE',
      });
    } catch (_) {
      return { message: 'Pengumuman berhasil dihapus' };
    }
  },

  // Quizzes
  getQuizzes: async () => {
    try {
      return await tryServerRequest<Quiz[]>('/api/quizzes');
    } catch (_) {
      return offlineStore.getQuizzes();
    }
  },

  getQuizById: async (id: string) => {
    try {
      return await tryServerRequest<Quiz>(`/api/quizzes/${id}`);
    } catch (_) {
      return offlineStore.getQuizById(id);
    }
  },

  verifyQuizToken: async (payload: { token: string; studentName?: string; password?: string }) => {
    try {
      return await tryServerRequest<{ success: boolean; quiz: Quiz }>('/api/quizzes/verify-token', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (_) {
      return offlineStore.verifyQuizToken('', payload.token);
    }
  },

  generateQuizToken: async (quizId: string) => {
    try {
      return await tryServerRequest<{ token: string }>('/api/quizzes/generate-token', {
        method: 'POST',
        body: JSON.stringify({ quizId }),
      });
    } catch (_) {
      return { token: Math.random().toString(36).substring(2, 8).toUpperCase() };
    }
  },

  createQuiz: async (data: Partial<Quiz>) => {
    try {
      return await tryServerRequest<Quiz>('/api/quizzes', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (_) {
      return { id: 'quiz_' + Date.now(), title: data.title || '', subjectId: data.subjectId || '', subjectName: data.subjectName || '', durationMinutes: data.durationMinutes || 60, questions: data.questions || [] } as Quiz;
    }
  },

  updateQuiz: async (id: string, data: Partial<Quiz>) => {
    try {
      return await tryServerRequest<Quiz>(`/api/quizzes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (_) {
      return { id, ...data } as Quiz;
    }
  },

  deleteQuiz: async (id: string) => {
    try {
      return await tryServerRequest<{ message: string }>(`/api/quizzes/${id}`, {
        method: 'DELETE',
      });
    } catch (_) {
      return { message: 'Kuis berhasil dihapus' };
    }
  },

  submitQuiz: async (quizId: string, payload: { answers: { questionId: string; selectedOption: number }[] | Record<string, string>; tokenUsed?: string }) => {
    try {
      return await tryServerRequest<{ message: string; attempt: QuizAttempt }>(`/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (_) {
      const answersRecord: Record<string, string> = {};
      if (Array.isArray(payload.answers)) {
        (payload.answers as { questionId: string; selectedOption: number }[]).forEach((a) => {
          answersRecord[a.questionId] = String(a.selectedOption);
        });
      } else {
        Object.assign(answersRecord, payload.answers);
      }
      const attempt = offlineStore.submitQuizAttempt(quizId, answersRecord);
      return { message: 'Quiz berhasil diselesaikan!', attempt };
    }
  },

  getQuizAttempts: async (quizId?: string) => {
    try {
      const query = quizId ? `?quizId=${quizId}` : '';
      return await tryServerRequest<QuizAttempt[]>(`/api/quiz-attempts${query}`);
    } catch (_) {
      return [];
    }
  },

  // Attendance
  getAttendanceEvents: async () => {
    try {
      return await tryServerRequest<AttendanceEvent[]>('/api/attendance/events');
    } catch (_) {
      return offlineStore.getAttendanceEvents();
    }
  },

  getActiveAttendanceEvent: async () => {
    try {
      return await tryServerRequest<AttendanceEvent | null>('/api/attendance/events/active');
    } catch (_) {
      return offlineStore.getActiveAttendanceEvent();
    }
  },

  scanAttendance: async (payload: { qrToken: string; eventId?: string }) => {
    try {
      return await tryServerRequest<{ success: boolean; message: string; record: AttendanceRecord }>('/api/attendance/scan', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (_) {
      return offlineStore.recordAttendanceScan(payload);
    }
  },

  getStudentAttendance: async (studentId: string) => {
    try {
      return await tryServerRequest<AttendanceRecord[]>(`/api/attendance/student/${studentId}`);
    } catch (_) {
      return offlineStore.getStudentAttendance(studentId);
    }
  },

  getAttendanceStats: async () => {
    try {
      return await tryServerRequest<{ hadir: number; sakit: number; izin: number; alpha: number }>('/api/attendance/stats');
    } catch (_) {
      return offlineStore.getAttendanceStats();
    }
  },

  // Student Feed Posts (Hanya diisi oleh akun terdaftar)
  getPosts: async () => {
    const deletedPostIds = offlineStore.getDeletedPostIds();
    const localPosts = offlineStore.getPosts().filter((p) => !p.id.startsWith('post_seed_'));
    let serverPosts: StudentPost[] = [];
    try {
      serverPosts = await tryServerRequest<StudentPost[]>('/api/posts');
      if (Array.isArray(serverPosts)) {
        serverPosts = serverPosts.filter((p) => !p.id.startsWith('post_seed_'));
      }
    } catch (_) {
      serverPosts = [];
    }

    const postMap = new Map<string, StudentPost>();
    localPosts.forEach((p) => {
      if (!deletedPostIds.includes(p.id)) {
        postMap.set(p.id, p);
      }
    });

    if (Array.isArray(serverPosts) && serverPosts.length > 0) {
      serverPosts.forEach((p) => {
        if (!deletedPostIds.includes(p.id)) {
          if (postMap.has(p.id)) {
            postMap.set(p.id, { ...postMap.get(p.id)!, ...p });
          } else {
            postMap.set(p.id, p);
          }
        }
      });
    }

    const merged = Array.from(postMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    offlineStore.setPostsList(merged);
    return merged;
  },

  createPost: async (data: { caption: string; mediaUrl?: string; mediaType?: 'photo' | 'video'; mediaName?: string }) => {
    try {
      const res = await tryServerRequest<StudentPost>('/api/posts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      offlineStore.savePostDirect(res);
      return res;
    } catch (_) {
      return offlineStore.createPost(data);
    }
  },

  toggleLikePost: async (postId: string) => {
    try {
      return await tryServerRequest<{ isLiked: boolean; likesCount: number }>(`/api/posts/${postId}/like`, {
        method: 'POST',
      });
    } catch (_) {
      return offlineStore.toggleLikePost(postId);
    }
  },

  addComment: async (
    postId: string,
    text: string,
    replyData?: {
      replyToCommentId?: string;
      replyToUsername?: string;
      replyToAuthorName?: string;
      replyToAuthorId?: string;
    }
  ) => {
    try {
      return await tryServerRequest<PostComment>(`/api/posts/${postId}/comment`, {
        method: 'POST',
        body: JSON.stringify({
          text,
          content: text,
          ...replyData,
        }),
      });
    } catch (_) {
      return offlineStore.addComment(postId, text, replyData);
    }
  },

  updatePost: async (postId: string, caption: string) => {
    try {
      return await tryServerRequest<StudentPost>(`/api/posts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify({ caption }),
      });
    } catch (_) {
      return offlineStore.updatePost(postId, caption);
    }
  },

  deletePost: async (postId: string) => {
    offlineStore.deletePost(postId);
    try {
      return await tryServerRequest<{ message: string }>(`/api/posts/${postId}`, {
        method: 'DELETE',
      });
    } catch (_) {
      return { message: 'Postingan berhasil dihapus' };
    }
  },

  toggleFollow: async (targetUserId: string) => {
    try {
      return await tryServerRequest<{ isFollowing: boolean; followersCount: number; followingCount: number }>(
        `/api/users/${targetUserId}/follow`,
        { method: 'POST' }
      );
    } catch (_) {
      return offlineStore.toggleFollow(targetUserId);
    }
  },

  getUserProfile: async (username: string) => {
    try {
      return await tryServerRequest<{
        user: Partial<User>;
        posts: StudentPost[];
        followersCount: number;
        followingCount: number;
        isSelf: boolean;
        isFollowing: boolean;
      }>(`/api/users/profile/${username}`);
    } catch (_) {
      return offlineStore.getUserProfile(username);
    }
  },

  // Stories (Hanya diisi oleh akun terdaftar - Permanen)
  getStories: async () => {
    let serverStories: Story[] = [];
    try {
      serverStories = await tryServerRequest<Story[]>('/api/stories');
      if (Array.isArray(serverStories)) {
        serverStories = serverStories.filter((s) => !s.id.startsWith('story_seed_'));
      }
    } catch (_) {
      serverStories = [];
    }
    const localStories = offlineStore.getStories().filter((s) => !s.id.startsWith('story_seed_'));
    const storyMap = new Map<string, Story>();
    localStories.forEach((s) => {
      storyMap.set(s.id, s);
    });
    if (Array.isArray(serverStories) && serverStories.length > 0) {
      serverStories.forEach((s) => {
        if (storyMap.has(s.id)) {
          storyMap.set(s.id, { ...storyMap.get(s.id)!, ...s });
        } else {
          storyMap.set(s.id, s);
        }
      });
    }
    const merged = Array.from(storyMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    offlineStore.setStoriesList(merged);
    return merged;
  },

  createStory: async (data: { mediaUrl: string; mediaType: 'photo' | 'video'; caption?: string }) => {
    try {
      const res = await tryServerRequest<Story>('/api/stories', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      offlineStore.saveStoryDirect(res);
      return res;
    } catch (_) {
      return offlineStore.createStory(data);
    }
  },

  deleteStory: async (id: string) => {
    try {
      return await tryServerRequest<{ message: string }>(`/api/stories/${id}`, {
        method: 'DELETE',
      });
    } catch (_) {
      return offlineStore.deleteStory(id);
    }
  },

  // Personal Notes (Arsip Siswa)
  getNotes: async () => {
    try {
      return await tryServerRequest<PersonalNote[]>('/api/notes');
    } catch (_) {
      return offlineStore.getNotes();
    }
  },

  createNote: async (data: { title: string; content: string; color?: string }) => {
    try {
      return await tryServerRequest<PersonalNote>('/api/notes', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (_) {
      return offlineStore.createNote(data);
    }
  },

  updateNote: async (id: string, data: { title: string; content: string; color?: string }) => {
    try {
      return await tryServerRequest<PersonalNote>(`/api/notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (_) {
      return offlineStore.updateNote(id, data);
    }
  },

  deleteNote: async (id: string) => {
    try {
      return await tryServerRequest<{ message: string }>(`/api/notes/${id}`, {
        method: 'DELETE',
      });
    } catch (_) {
      return offlineStore.deleteNote(id);
    }
  },

  // Notifications
  getNotifications: async () => {
    try {
      return await tryServerRequest<(AppNotification & { isRead: boolean })[]>('/api/notifications');
    } catch (_) {
      return offlineStore.getNotifications();
    }
  },

  markNotificationRead: async (id: string) => {
    try {
      return await tryServerRequest<{ success: boolean }>(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      });
    } catch (_) {
      return offlineStore.markNotificationRead(id);
    }
  },

  markAllNotificationsRead: async () => {
    try {
      return await tryServerRequest<{ success: boolean }>('/api/notifications/read-all', {
        method: 'POST',
      });
    } catch (_) {
      return offlineStore.markAllNotificationsRead();
    }
  },

  deleteNotification: async (id: string) => {
    try {
      return await tryServerRequest<{ message: string }>(`/api/notifications/${id}`, {
        method: 'DELETE',
      });
    } catch (_) {
      return offlineStore.deleteNotification(id);
    }
  },

  // -------------------------------------------------------------
  // ARTIKEL GURU & METODE PEMBELAJARAN
  // -------------------------------------------------------------
  getArticles: async (category?: string, onlyPublished?: boolean) => {
    try {
      const q = new URLSearchParams();
      if (category) q.set('category', category);
      if (onlyPublished) q.set('onlyPublished', 'true');
      return await tryServerRequest<any[]>(`/api/articles?${q.toString()}`);
    } catch (_) {
      return offlineStore.getArticles(category, onlyPublished);
    }
  },

  getArticleById: async (id: string) => {
    try {
      return await tryServerRequest<any>(`/api/articles/${id}`);
    } catch (_) {
      const all = offlineStore.getArticles();
      return all.find((a: any) => a.id === id) || null;
    }
  },

  createArticle: async (data: any) => {
    try {
      return await tryServerRequest<any>('/api/articles', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (_) {
      return offlineStore.createArticle(data);
    }
  },

  updateArticle: async (id: string, data: any) => {
    try {
      return await tryServerRequest<any>(`/api/articles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (_) {
      return offlineStore.updateArticle(id, data);
    }
  },

  deleteArticle: async (id: string) => {
    try {
      return await tryServerRequest<{ message: string }>(`/api/articles/${id}`, {
        method: 'DELETE',
      });
    } catch (_) {
      return offlineStore.deleteArticle(id);
    }
  },

  // -------------------------------------------------------------
  // ABSENSI KELAS GURU (QR & MANUAL)
  // -------------------------------------------------------------
  getClassAttendance: async (filters: { date?: string; kelas?: string; studentId?: string; status?: string }) => {
    try {
      const q = new URLSearchParams();
      if (filters.date) q.set('date', filters.date);
      if (filters.kelas) q.set('kelas', filters.kelas);
      if (filters.studentId) q.set('studentId', filters.studentId);
      if (filters.status) q.set('status', filters.status);
      return await tryServerRequest<any[]>(`/api/class-attendance?${q.toString()}`);
    } catch (_) {
      return offlineStore.getClassAttendance(filters);
    }
  },

  recordClassAttendance: async (entries: any[]) => {
    try {
      return await tryServerRequest<{ message: string; count: number }>('/api/class-attendance', {
        method: 'POST',
        body: JSON.stringify({ entries }),
      });
    } catch (_) {
      return offlineStore.recordClassAttendance(entries);
    }
  },

  // -------------------------------------------------------------
  // TATA USAHA (TU) - TAGIHAN, TRANSAKSI, DOKUMEN & CHAT RESMI
  // -------------------------------------------------------------
  getTuitionBills: async (studentId?: string, kelas?: string, status?: string) => {
    try {
      const q = new URLSearchParams();
      if (studentId) q.set('studentId', studentId);
      if (kelas) q.set('kelas', kelas);
      if (status) q.set('status', status);
      return await tryServerRequest<any[]>(`/api/tu/bills?${q.toString()}`);
    } catch (_) {
      return offlineStore.getTuitionBills(studentId, kelas, status);
    }
  },

  createTuitionBill: async (data: any) => {
    try {
      return await tryServerRequest<any>('/api/tu/bills', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (_) {
      return offlineStore.createTuitionBill(data);
    }
  },

  updateTuitionBill: async (id: string, data: any) => {
    try {
      return await tryServerRequest<any>(`/api/tu/bills/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (_) {
      return offlineStore.updateTuitionBill(id, data);
    }
  },

  deleteTuitionBill: async (id: string) => {
    try {
      return await tryServerRequest<{ message: string }>(`/api/tu/bills/${id}`, {
        method: 'DELETE',
      });
    } catch (_) {
      return offlineStore.deleteTuitionBill(id);
    }
  },

  getTuitionTransactions: async (type?: string) => {
    try {
      const q = type ? `?type=${type}` : '';
      return await tryServerRequest<any[]>(`/api/tu/transactions${q}`);
    } catch (_) {
      return offlineStore.getTuitionTransactions(type);
    }
  },

  createTuitionTransaction: async (data: any) => {
    try {
      return await tryServerRequest<any>('/api/tu/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (_) {
      return offlineStore.createTuitionTransaction(data);
    }
  },

  getTuDocuments: async (category?: string) => {
    try {
      const q = category ? `?category=${category}` : '';
      return await tryServerRequest<any[]>(`/api/tu/documents${q}`);
    } catch (_) {
      return offlineStore.getTuDocuments(category);
    }
  },

  createTuDocument: async (data: any) => {
    try {
      return await tryServerRequest<any>('/api/tu/documents', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (_) {
      return offlineStore.createTuDocument(data);
    }
  },

  deleteTuDocument: async (id: string) => {
    try {
      return await tryServerRequest<{ message: string }>(`/api/tu/documents/${id}`, {
        method: 'DELETE',
      });
    } catch (_) {
      return offlineStore.deleteTuDocument(id);
    }
  },

  getTuChatMessages: async (studentId?: string) => {
    try {
      const q = studentId ? `?studentId=${studentId}` : '';
      return await tryServerRequest<any[]>(`/api/tu/chat${q}`);
    } catch (_) {
      return offlineStore.getTuChatMessages(studentId);
    }
  },

  createTuChatMessage: async (data: any) => {
    try {
      return await tryServerRequest<any>('/api/tu/chat', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (_) {
      return offlineStore.createTuChatMessage(data);
    }
  },

  // -------------------------------------------------------------
  // MANAJEMEN GURU, CENTANG BIRU & ALUMNI
  // -------------------------------------------------------------
  createTeacher: async (data: any) => {
    // Always persist to local storage first so it is immediately visible & never lost
    const t = offlineStore.createTeacherAccount(data);
    try {
      const res = await tryServerRequest<{ message: string; teacher: any }>('/api/admin/teachers', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (res && res.teacher) {
        offlineStore.syncUserFromServer(res.teacher);
        return { message: res.message || 'Akun guru berhasil dibuat', teacher: res.teacher };
      }
      return { message: 'Akun guru berhasil dibuat', teacher: t };
    } catch (_) {
      return { message: 'Akun guru berhasil dibuat', teacher: t };
    }
  },

  updateTeacher: async (id: string, data: any) => {
    try {
      return await tryServerRequest<{ message: string; teacher: any }>(`/api/admin/teachers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (_) {
      const t = offlineStore.updateTeacherAccount(id, data);
      return { message: 'Akun guru berhasil diperbarui', teacher: t };
    }
  },

  deleteTeacher: async (id: string) => {
    try {
      return await tryServerRequest<{ message: string }>(`/api/admin/teachers/${id}`, {
        method: 'DELETE',
      });
    } catch (_) {
      return offlineStore.deleteTeacherAccount(id);
    }
  },

  toggleVerifiedBadge: async (userId: string) => {
    try {
      return await tryServerRequest<{ message: string; isVerified: boolean }>(`/api/admin/users/${userId}/verified`, {
        method: 'PATCH',
      });
    } catch (_) {
      return offlineStore.toggleVerifiedBadge(userId);
    }
  },

  toggleAlumniStatus: async (studentId: string) => {
    try {
      return await tryServerRequest<{ message: string; isAlumni: boolean }>(`/api/admin/students/${studentId}/alumni`, {
        method: 'PATCH',
      });
    } catch (_) {
      return offlineStore.toggleAlumniStatus(studentId);
    }
  },

  createTeacherAccount: async (data: any) => {
    return api.createTeacher(data);
  },

  resetStaffPasswordToInitial: async (staffId: string) => {
    return api.resetStaffInitialPassword(staffId);
  },

  resetStaffToInitialPassword: async (staffId: string) => {
    return api.resetStaffInitialPassword(staffId);
  },

  toggleStudentActive: async (studentId: string) => {
    return api.toggleStudentStatus(studentId);
  },

  addSubject: async (data: any) => {
    return api.createSubject(data);
  },

  addBook: async (data: any) => {
    return api.createBook(data);
  },

  addAnnouncement: async (data: any) => {
    return api.createAnnouncement(data);
  },

  addQuiz: async (data: any) => {
    return api.createQuiz(data);
  },

  createAttendanceEvent: async (data: any) => {
    try {
      return await tryServerRequest<any>('/api/attendance/events', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (_) {
      return {
        id: 'event_' + Date.now(),
        ...data,
        isOpen: true,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
    }
  },

  toggleEventSession: async (eventId: string) => {
    try {
      return await tryServerRequest<any>(`/api/attendance/events/${eventId}/toggle`, {
        method: 'PATCH',
      });
    } catch (_) {
      return { success: true, message: 'Status sesi absensi berhasil diubah' };
    }
  },

  deleteAttendanceEvent: async (eventId: string) => {
    try {
      return await tryServerRequest<any>(`/api/attendance/events/${eventId}`, {
        method: 'DELETE',
      });
    } catch (_) {
      return { success: true, message: 'Kegiatan berhasil dihapus' };
    }
  },

  getAttendanceRecords: async (eventId?: string) => {
    try {
      const q = eventId ? `?eventId=${eventId}` : '';
      return await tryServerRequest<any[]>(`/api/attendance/records${q}`);
    } catch (_) {
      return [];
    }
  },

  scanQr: async (payload: { qrData?: string; qrToken?: string; eventId?: string } | string, eventId?: string) => {
    const token = typeof payload === 'string' ? payload : (payload.qrData || payload.qrToken || '');
    const evId = typeof payload === 'string' ? eventId : (payload.eventId || eventId);
    try {
      const res = await api.scanAttendance({ qrToken: token, eventId: evId });
      return {
        status: (res.success ? 'SUCCESS' : 'INVALID_QR') as any,
        message: res.message,
        record: res.record,
      };
    } catch (err: any) {
      return {
        status: 'SERVER_ERROR' as any,
        message: err.message || 'Gagal memproses QR',
      };
    }
  },

  toggleVerified: async (userId: string) => {
    return api.toggleVerifiedBadge(userId);
  },

  getExportUrl: (eventId?: string) => {
    return eventId ? `/api/attendance/export?eventId=${eventId}` : '/api/attendance/export';
  },

  getPublicProfile: async (userId: string) => {
    try {
      return await tryServerRequest<any>(`/api/users/profile/${userId}`);
    } catch (_) {
      try {
        return await tryServerRequest<any>(`/api/users/${userId}/public-profile`);
      } catch (__) {
        const all = offlineStore.getStudents();
        const target = all.find((u) => u.id === userId || u.username === userId);
        return target
          ? { user: target, posts: [], followersCount: 0, followingCount: 0 }
          : null;
      }
    }
  },

  getTuMonthlyReports: async () => {
    try {
      return await tryServerRequest<any[]>('/api/tu/monthly-reports');
    } catch (_) {
      return offlineStore.getTuMonthlyReports();
    }
  },

  createTuMonthlyReport: async (data: any) => {
    try {
      const res = await tryServerRequest<{ message: string; report: any }>('/api/tu/monthly-reports', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      offlineStore.createTuMonthlyReport(data);
      return res;
    } catch (_) {
      const report = offlineStore.createTuMonthlyReport(data);
      return { message: 'Laporan bulanan berhasil dikirimkan ke Pemimpin & Kepala Sekolah.', report };
    }
  },

  // =============================================================
  // MULTIPLAYER GAMES API: WHO'S THE SPY & MAFIA
  // =============================================================

  getGameRooms: async () => {
    try {
      const res = await tryServerRequest<{ rooms: GameRoom[] }>('/api/games/rooms');
      if (res?.rooms && Array.isArray(res.rooms)) {
        res.rooms.forEach((r) => offlineStore.saveGameRoom(r));
        return res.rooms;
      }
      return offlineStore.getGameRooms();
    } catch (_) {
      return offlineStore.getGameRooms();
    }
  },

  createGameRoom: async (gameType: GameType, spySettings?: Partial<SpySettings>, mafiaSettings?: Partial<MafiaSettings>) => {
    try {
      const res = await tryServerRequest<{ room: GameRoom }>('/api/games/rooms', {
        method: 'POST',
        body: JSON.stringify({ gameType, spySettings, mafiaSettings }),
      });
      if (res?.room) {
        offlineStore.saveGameRoom(res.room);
      }
      return res.room;
    } catch (_) {
      const me = offlineStore.getCurrentUser();
      if (!me) throw new Error('Pengguna belum login.');
      const room = createGameRoom(me, gameType, spySettings, mafiaSettings);
      offlineStore.saveGameRoom(room);
      return room;
    }
  },

  getGameRoom: async (code: string) => {
    try {
      const res = await tryServerRequest<{ room: GameRoom }>(`/api/games/rooms/${encodeURIComponent(code)}`);
      if (res?.room) {
        offlineStore.saveGameRoom(res.room);
      }
      return res.room;
    } catch (_) {
      const local = offlineStore.getGameRoom(code);
      if (!local) throw new Error('Room tidak ditemukan.');
      return local;
    }
  },

  joinGameRoom: async (code: string) => {
    try {
      const res = await tryServerRequest<{ room: GameRoom; player: GamePlayer }>(`/api/games/rooms/${encodeURIComponent(code)}/join`, {
        method: 'POST',
      });
      if (res?.room) {
        offlineStore.saveGameRoom(res.room);
      }
      return res;
    } catch (_) {
      const local = offlineStore.getGameRoom(code);
      if (!local) throw new Error('Room tidak ditemukan.');
      const me = offlineStore.getCurrentUser();
      if (!me) throw new Error('Pengguna belum login.');
      const result = joinOrReconnectRoom(local, me);
      offlineStore.saveGameRoom(result.room);
      return result;
    }
  },

  toggleGameReady: async (code: string) => {
    try {
      const res = await tryServerRequest<{ room: GameRoom }>(`/api/games/rooms/${encodeURIComponent(code)}/ready`, {
        method: 'POST',
      });
      if (res?.room) {
        offlineStore.saveGameRoom(res.room);
      }
      return res.room;
    } catch (_) {
      const local = offlineStore.getGameRoom(code);
      if (!local) throw new Error('Room tidak ditemukan.');
      const me = offlineStore.getCurrentUser();
      if (!me) throw new Error('Pengguna belum login.');
      const cleanU = me.username.toLowerCase();
      const p = local.players.find((pl) => pl.userId === me.id || pl.username.toLowerCase() === cleanU);
      if (p) p.isReady = !p.isReady;
      offlineStore.saveGameRoom(local);
      return local;
    }
  },

  updateGameSettings: async (code: string, settings: { spySettings?: Partial<SpySettings>; mafiaSettings?: Partial<MafiaSettings> }) => {
    try {
      const res = await tryServerRequest<{ room: GameRoom }>(`/api/games/rooms/${encodeURIComponent(code)}/settings`, {
        method: 'POST',
        body: JSON.stringify(settings),
      });
      if (res?.room) {
        offlineStore.saveGameRoom(res.room);
      }
      return res.room;
    } catch (_) {
      const local = offlineStore.getGameRoom(code);
      if (!local) throw new Error('Room tidak ditemukan.');
      if (settings.spySettings) local.spySettings = { ...local.spySettings, ...settings.spySettings };
      if (settings.mafiaSettings) local.mafiaSettings = { ...local.mafiaSettings, ...settings.mafiaSettings };
      offlineStore.saveGameRoom(local);
      return local;
    }
  },

  startGame: async (code: string) => {
    try {
      const res = await tryServerRequest<{ room: GameRoom }>(`/api/games/rooms/${encodeURIComponent(code)}/start`, {
        method: 'POST',
      });
      if (res?.room) {
        offlineStore.saveGameRoom(res.room);
      }
      return res.room;
    } catch (_) {
      const local = offlineStore.getGameRoom(code);
      if (!local) throw new Error('Room tidak ditemukan.');
      const started = local.gameType === 'spy' ? startSpyGame(local) : startMafiaGame(local);
      offlineStore.saveGameRoom(started);
      return started;
    }
  },

  advanceGamePhase: async (code: string, targetPhase: string) => {
    try {
      const res = await tryServerRequest<{ room: GameRoom }>(`/api/games/rooms/${encodeURIComponent(code)}/next-phase`, {
        method: 'POST',
        body: JSON.stringify({ targetPhase }),
      });
      if (res?.room) {
        offlineStore.saveGameRoom(res.room);
      }
      return res.room;
    } catch (_) {
      const local = offlineStore.getGameRoom(code);
      if (!local) throw new Error('Room tidak ditemukan.');
      const now = Date.now();
      if (local.gameType === 'spy') {
        if (targetPhase === 'clues') {
          local.phase = 'clues';
          local.activeCluePlayerIndex = 0;
          local.phaseDurationSeconds = local.spySettings.clueDuration || 30;
          local.phaseEndTime = now + local.phaseDurationSeconds * 1000;
        } else if (targetPhase === 'next_clue') {
          const alive = local.players.filter((p) => p.isAlive && !p.isSpectator);
          const nextIdx = (local.activeCluePlayerIndex || 0) + 1;
          if (nextIdx < alive.length) {
            local.activeCluePlayerIndex = nextIdx;
            local.phaseDurationSeconds = local.spySettings.clueDuration || 30;
            local.phaseEndTime = now + local.phaseDurationSeconds * 1000;
          } else {
            local.phase = 'discussion';
            local.phaseDurationSeconds = local.spySettings.discussionDuration || 60;
            local.phaseEndTime = now + local.phaseDurationSeconds * 1000;
          }
        } else if (targetPhase === 'discussion') {
          local.phase = 'discussion';
          local.phaseDurationSeconds = local.spySettings.discussionDuration || 60;
          local.phaseEndTime = now + local.phaseDurationSeconds * 1000;
        } else if (targetPhase === 'voting') {
          local.phase = 'voting';
          local.votes = {};
          local.phaseDurationSeconds = local.spySettings.votingDuration || 30;
          local.phaseEndTime = now + local.phaseDurationSeconds * 1000;
        } else if (targetPhase === 'evaluate_vote') {
          const ev = evaluateSpyVoting(local);
          offlineStore.saveGameRoom(ev);
          return ev;
        } else if (targetPhase === 'next_round') {
          local.round = (local.round || 1) + 1;
          local.phase = 'clues';
          local.activeCluePlayerIndex = 0;
          local.votes = {};
          local.phaseDurationSeconds = local.spySettings.clueDuration || 30;
          local.phaseEndTime = now + local.phaseDurationSeconds * 1000;
        }
      } else if (local.gameType === 'mafia') {
        if (targetPhase === 'night') {
          local.phase = 'night';
          local.nightActions = { mafiaVotes: {}, doctorTargetId: null, detectiveTargetId: null, detectiveResult: null };
          local.nightVictimId = null;
          local.savedByDoctor = false;
          local.phaseDurationSeconds = local.mafiaSettings.nightDuration || 30;
          local.phaseEndTime = now + local.phaseDurationSeconds * 1000;
        } else if (targetPhase === 'evaluate_night') {
          const ev = evaluateMafiaNight(local);
          offlineStore.saveGameRoom(ev);
          return ev;
        } else if (targetPhase === 'discussion') {
          local.phase = 'discussion';
          local.phaseDurationSeconds = local.mafiaSettings.discussionDuration || 60;
          local.phaseEndTime = now + local.phaseDurationSeconds * 1000;
        } else if (targetPhase === 'voting') {
          local.phase = 'voting';
          local.votes = {};
          local.phaseDurationSeconds = local.mafiaSettings.votingDuration || 30;
          local.phaseEndTime = now + local.phaseDurationSeconds * 1000;
        } else if (targetPhase === 'evaluate_vote') {
          const ev = evaluateMafiaVoting(local);
          offlineStore.saveGameRoom(ev);
          return ev;
        } else if (targetPhase === 'next_round') {
          local.round = (local.round || 1) + 1;
          local.phase = 'night';
          local.nightActions = { mafiaVotes: {}, doctorTargetId: null, detectiveTargetId: null, detectiveResult: null };
          local.nightVictimId = null;
          local.savedByDoctor = false;
          local.phaseDurationSeconds = local.mafiaSettings.nightDuration || 30;
          local.phaseEndTime = now + local.phaseDurationSeconds * 1000;
        }
      }
      offlineStore.saveGameRoom(local);
      return local;
    }
  },

  castGameVote: async (code: string, targetPlayerId: string) => {
    try {
      const res = await tryServerRequest<{ room: GameRoom }>(`/api/games/rooms/${encodeURIComponent(code)}/vote`, {
        method: 'POST',
        body: JSON.stringify({ targetPlayerId }),
      });
      if (res?.room) {
        offlineStore.saveGameRoom(res.room);
      }
      return res.room;
    } catch (_) {
      const local = offlineStore.getGameRoom(code);
      if (!local) throw new Error('Room tidak ditemukan.');
      const me = offlineStore.getCurrentUser();
      if (!me) throw new Error('Pengguna belum login.');
      const cleanU = me.username.toLowerCase();
      const voter = local.players.find((p) => p.userId === me.id || p.username.toLowerCase() === cleanU);
      if (!voter || !voter.isAlive || voter.isSpectator) throw new Error('Tidak dapat memberikan suara.');
      if (!local.votes) local.votes = {};
      local.votes[voter.id] = targetPlayerId;
      voter.voteTargetId = targetPlayerId;

      const alive = local.players.filter((p) => p.isAlive && !p.isSpectator);
      const allVoted = alive.length > 0 && alive.every((p) => Boolean(local.votes?.[p.id]));
      if (allVoted) {
        const ev = local.gameType === 'spy' ? evaluateSpyVoting(local) : evaluateMafiaVoting(local);
        offlineStore.saveGameRoom(ev);
        return ev;
      }
      offlineStore.saveGameRoom(local);
      return local;
    }
  },

  submitSpyGuess: async (code: string, guess: string) => {
    try {
      const res = await tryServerRequest<{ room: GameRoom }>(`/api/games/rooms/${encodeURIComponent(code)}/spy-guess`, {
        method: 'POST',
        body: JSON.stringify({ guess }),
      });
      if (res?.room) {
        offlineStore.saveGameRoom(res.room);
      }
      return res.room;
    } catch (_) {
      const local = offlineStore.getGameRoom(code);
      if (!local) throw new Error('Room tidak ditemukan.');
      const me = offlineStore.getCurrentUser();
      const cleanGuess = (guess || '').trim().toLowerCase();
      const actual = (local.civilianWord || '').trim().toLowerCase();
      const isCorrect = cleanGuess === actual || (cleanGuess.length >= 4 && actual.includes(cleanGuess));
      local.spyGuessResult = { guess, isCorrect, spyName: me?.name || 'Imposter' };
      local.status = 'ended';
      local.phase = 'ended';
      if (isCorrect) {
        local.winner = 'spies';
        local.winReason = `Tebakan Imposter Benar! Imposter berhasil menebak kata: "${local.civilianWord}"!`;
      } else {
        local.winner = 'civilians';
        local.winReason = `Tebakan Imposter Salah ("${guess}"). Kata sebenarnya: "${local.civilianWord}".`;
      }
      offlineStore.saveGameRoom(local);
      return local;
    }
  },

  submitMafiaNightAction: async (code: string, actionType: 'mafia_kill' | 'doctor_heal' | 'detective_inspect', targetPlayerId: string) => {
    try {
      const res = await tryServerRequest<{ room: GameRoom }>(`/api/games/rooms/${encodeURIComponent(code)}/night-action`, {
        method: 'POST',
        body: JSON.stringify({ actionType, targetPlayerId }),
      });
      if (res?.room) {
        offlineStore.saveGameRoom(res.room);
      }
      return res.room;
    } catch (_) {
      const local = offlineStore.getGameRoom(code);
      if (!local) throw new Error('Room tidak ditemukan.');
      const me = offlineStore.getCurrentUser();
      const cleanU = me?.username.toLowerCase() || '';
      const player = local.players.find((p) => p.userId === me?.id || p.username.toLowerCase() === cleanU);
      if (!player) throw new Error('Pemain tidak ditemukan.');
      if (!local.nightActions) local.nightActions = {};

      if (actionType === 'mafia_kill') {
        if (!local.nightActions.mafiaVotes) local.nightActions.mafiaVotes = {};
        local.nightActions.mafiaVotes[player.id] = targetPlayerId;
        player.nightTargetId = targetPlayerId;
      } else if (actionType === 'doctor_heal') {
        local.nightActions.doctorTargetId = targetPlayerId;
        player.nightTargetId = targetPlayerId;
      } else if (actionType === 'detective_inspect') {
        local.nightActions.detectiveTargetId = targetPlayerId;
        player.nightTargetId = targetPlayerId;
        const targetP = local.players.find((p) => p.id === targetPlayerId);
        if (targetP) {
          local.nightActions.detectiveResult = {
            targetId: targetP.id,
            targetName: targetP.name,
            isMafia: targetP.role === 'mafia',
          };
        }
      }

      const aliveMafia = local.players.filter((p) => p.isAlive && p.role === 'mafia');
      const aliveDoc = local.players.filter((p) => p.isAlive && p.role === 'doctor');
      const aliveDet = local.players.filter((p) => p.isAlive && p.role === 'detective');

      const mafiaDone = aliveMafia.length === 0 || aliveMafia.every((m) => Boolean(local.nightActions?.mafiaVotes?.[m.id]));
      const docDone = aliveDoc.length === 0 || Boolean(local.nightActions?.doctorTargetId);
      const detDone = aliveDet.length === 0 || Boolean(local.nightActions?.detectiveTargetId);

      if (mafiaDone && docDone && detDone) {
        const ev = evaluateMafiaNight(local);
        offlineStore.saveGameRoom(ev);
        return ev;
      }
      offlineStore.saveGameRoom(local);
      return local;
    }
  },

  sendGameChat: async (code: string, text: string) => {
    try {
      const res = await tryServerRequest<{ room: GameRoom; message: any }>(`/api/games/rooms/${encodeURIComponent(code)}/chat`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      if (res?.room) {
        offlineStore.saveGameRoom(res.room);
      }
      return res;
    } catch (_) {
      const local = offlineStore.getGameRoom(code);
      if (!local) throw new Error('Room tidak ditemukan.');
      const me = offlineStore.getCurrentUser();
      const now = Date.now();
      const msg = {
        id: `msg_${now}_${Math.random().toString(36).substring(2, 6)}`,
        senderId: me?.id || 'unknown',
        senderName: me?.name || 'Siswa',
        senderUsername: me?.username || 'user',
        text: text.trim(),
        timestamp: now,
        isSystem: false,
      };
      if (!local.chatMessages) local.chatMessages = [];
      local.chatMessages.push(msg);
      offlineStore.saveGameRoom(local);
      return { room: local, message: msg };
    }
  },

  restartGame: async (code: string) => {
    try {
      const res = await tryServerRequest<{ room: GameRoom }>(`/api/games/rooms/${encodeURIComponent(code)}/restart`, {
        method: 'POST',
      });
      if (res?.room) {
        offlineStore.saveGameRoom(res.room);
      }
      return res.room;
    } catch (_) {
      const local = offlineStore.getGameRoom(code);
      if (!local) throw new Error('Room tidak ditemukan.');
      local.status = 'waiting';
      local.phase = 'lobby';
      local.round = 1;
      local.winner = null;
      local.winReason = undefined;
      local.civilianWord = undefined;
      local.spyWord = undefined;
      local.spyGuessResult = null;
      local.nightActions = undefined;
      local.nightVictimId = null;
      local.savedByDoctor = false;
      local.lastEliminatedPlayerId = null;
      local.votes = {};
      local.voteTally = {};
      local.players = local.players.map((p) => ({
        ...p,
        isReady: false,
        isAlive: true,
        isSpectator: false,
        role: undefined,
        secretWord: undefined,
        voteTargetId: null,
        nightTargetId: null,
      }));
      offlineStore.saveGameRoom(local);
      return local;
    }
  },

  leaveGameRoom: async (code: string) => {
    try {
      await tryServerRequest(`/api/games/rooms/${encodeURIComponent(code)}/leave`, {
        method: 'POST',
      });
    } catch (_) {
      const local = offlineStore.getGameRoom(code);
      if (local) {
        const me = offlineStore.getCurrentUser();
        const cleanU = me?.username.toLowerCase() || '';
        local.players = local.players.filter((p) => p.userId !== me?.id && p.username.toLowerCase() !== cleanU);
        if (local.players.length === 0) {
          offlineStore.deleteGameRoom(code);
        } else {
          if (local.hostId === me?.id || local.hostUsername.toLowerCase() === cleanU) {
            local.players[0].isHost = true;
            local.hostId = local.players[0].userId;
            local.hostUsername = local.players[0].username;
          }
          offlineStore.saveGameRoom(local);
        }
      }
    }
  },
};

export const gameApi = {
  createGameRoom: api.createGameRoom,
  getGameRooms: api.getGameRooms,
  getGameRoom: api.getGameRoom,
  joinGameRoom: api.joinGameRoom,
  toggleGameReady: api.toggleGameReady,
  updateGameSettings: api.updateGameSettings,
  startGame: api.startGame,
  advanceGamePhase: api.advanceGamePhase,
  castGameVote: api.castGameVote,
  submitSpyGuess: api.submitSpyGuess,
  submitMafiaNightAction: api.submitMafiaNightAction,
  sendGameChat: api.sendGameChat,
  restartGame: api.restartGame,
  leaveGameRoom: api.leaveGameRoom,
};

export { offlineStore };
