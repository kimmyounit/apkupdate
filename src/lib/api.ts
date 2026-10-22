import { offlineStore } from './offlineStore.ts';
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
} from '../types/index.ts';

const TOKEN_KEY = 'tamvesta_auth_token';
const SERVER_URL_KEY = 'tamvesta_server_url';
export const DEFAULT_SERVER_URL = 'http://192.168.1.2:3000';

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

/** Ambil base URL server yang tersimpan, default ke server laptop http://192.168.1.2:3000 */
export function getServerUrl(): string {
  const stored = localStorage.getItem(SERVER_URL_KEY);
  if (stored !== null && stored !== undefined) {
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
  const timeoutId = setTimeout(() => controller.abort(), 4000);

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
  // Auth
  login: async (credentials: { username: string; password: string }) => {
    try {
      const res = await tryServerRequest<{ token: string; user: User; mustChangePassword: boolean }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      setStoredToken(res.token);
      offlineStore.setCurrentUserId(res.user.id);
      offlineStore.syncUserFromServer(res.user);
      return res;
    } catch (err: any) {
      // Jika server aktif dan menolak secara spesifik (kredensial salah / dinonaktifkan)
      if (err.status && err.status >= 400 && err.status < 500) {
        throw err;
      }
      // Jika server laptop mati/unreachable, coba offline store
      const res = offlineStore.login(credentials);
      setStoredToken(res.token);
      return res;
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
      return await tryServerRequest<{ message: string; user: User }>('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (_) {
      return offlineStore.updateProfile(data);
    }
  },

  requestPasswordReset: async (data: { username: string; reason?: string }) => {
    try {
      return await tryServerRequest<{ message: string; request: PasswordResetRequest }>('/api/auth/password-reset-request', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (_) {
      return {
        message: 'Permintaan reset kata sandi telah dikirim ke administrator.',
        request: {
          id: 'req_' + Date.now(),
          userId: 'user_unknown',
          username: data.username,
          status: 'pending',
          reason: data.reason,
          createdAt: new Date().toISOString(),
        },
      };
    }
  },

  // Admin
  getPasswordResetRequests: async () => {
    try {
      return await tryServerRequest<PasswordResetRequest[]>('/api/admin/password-reset-requests');
    } catch (_) {
      return [];
    }
  },

  processPasswordResetRequest: async (id: string, action: 'approve' | 'reject') => {
    try {
      return await tryServerRequest<{ message: string; newPassword?: string }>(
        `/api/admin/password-reset-requests/${id}/process`,
        {
          method: 'POST',
          body: JSON.stringify({ action }),
        }
      );
    } catch (_) {
      return { message: `Permintaan reset kata sandi berhasil di-${action === 'approve' ? 'setujui' : 'tolak'}.` };
    }
  },

  getStudents: async () => {
    try {
      return await tryServerRequest<User[]>('/api/admin/students');
    } catch (_) {
      return offlineStore.getStudents();
    }
  },

  createStudent: async (studentData: Partial<User> & { password?: string }) => {
    try {
      return await tryServerRequest<{ message: string; student: User }>('/api/admin/students', {
        method: 'POST',
        body: JSON.stringify(studentData),
      });
    } catch (_) {
      const user: User = {
        id: 'user_student_' + Date.now(),
        username: studentData.username || 'siswa_' + Date.now(),
        name: studentData.name || 'Siswa Baru',
        role: 'siswa',
        classGrade: studentData.classGrade,
        classMajor: studentData.classMajor,
        isActive: true,
        passwordHash: '',
        salt: '',
        qrToken: 'qr_' + Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return { message: 'Siswa berhasil ditambahkan', student: user };
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
    try {
      return await tryServerRequest<{ message: string }>(`/api/admin/students/${studentId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      });
    } catch (_) {
      if (newPassword) {
        offlineStore.resetStudentPassword(studentId, newPassword);
      }
      return { message: 'Kata sandi siswa berhasil direset.' };
    }
  },

  getStaff: async () => {
    try {
      return await tryServerRequest<User[]>('/api/admin/staff');
    } catch (_) {
      return offlineStore.getStaff();
    }
  },

  resetStaffInitialPassword: async (staffId: string) => {
    try {
      return await tryServerRequest<{ message: string; initialPassword?: string }>(`/api/admin/staff/${staffId}/reset-initial`, {
        method: 'POST',
      });
    } catch (_) {
      return { message: 'Kata sandi awal berhasil disetel ulang.', initialPassword: 'GuruTamvesta123' };
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

  // Student Feed Posts
  getPosts: async () => {
    try {
      return await tryServerRequest<StudentPost[]>('/api/posts');
    } catch (_) {
      return offlineStore.getPosts();
    }
  },

  createPost: async (data: { caption: string; mediaUrl?: string; mediaType?: 'photo' | 'video'; mediaName?: string }) => {
    try {
      return await tryServerRequest<StudentPost>('/api/posts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
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

  addComment: async (postId: string, text: string) => {
    try {
      return await tryServerRequest<PostComment>(`/api/posts/${postId}/comment`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
    } catch (_) {
      return offlineStore.addComment(postId, text);
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
    try {
      return await tryServerRequest<{ message: string }>(`/api/posts/${postId}`, {
        method: 'DELETE',
      });
    } catch (_) {
      return offlineStore.deletePost(postId);
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

  // Stories (24h)
  getStories: async () => {
    try {
      return await tryServerRequest<Story[]>('/api/stories');
    } catch (_) {
      return offlineStore.getStories();
    }
  },

  createStory: async (data: { mediaUrl: string; mediaType: 'photo' | 'video'; caption?: string }) => {
    try {
      return await tryServerRequest<Story>('/api/stories', {
        method: 'POST',
        body: JSON.stringify(data),
      });
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
    try {
      return await tryServerRequest<{ message: string; teacher: any }>('/api/admin/teachers', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (_) {
      const t = offlineStore.createTeacherAccount(data);
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
      return await tryServerRequest<any>(`/api/users/${userId}/public-profile`);
    } catch (_) {
      const all = offlineStore.getStudents();
      const target = all.find((u) => u.id === userId || u.username === userId);
      return target || null;
    }
  },
};
