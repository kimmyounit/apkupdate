import defaultData from './defaultData.json';
import type {
  User,
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

const DB_KEY = 'tamvesta_standalone_db_v2';
const CURRENT_USER_KEY = 'tamvesta_offline_current_user_id';
const PASSWORDS_KEY = 'tamvesta_offline_passwords';

interface StandaloneDB {
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

function loadDB(): StandaloneDB {
  let db: StandaloneDB;
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      db = JSON.parse(raw);
    } else {
      db = defaultData as unknown as StandaloneDB;
    }
  } catch (e) {
    console.warn('[OfflineDB] Error parsing stored DB, falling back to default:', e);
    db = defaultData as unknown as StandaloneDB;
  }

  // Pastikan semua user bawaan dari defaultData.json selalu ada di db
  if (Array.isArray((defaultData as any).users)) {
    if (!Array.isArray(db.users)) db.users = [];
    (defaultData as any).users.forEach((defUser: User) => {
      const idx = db.users.findIndex(
        (u) => u.username.toLowerCase() === defUser.username.toLowerCase()
      );
      if (idx === -1) {
        db.users.push(defUser);
      } else {
        db.users[idx].initialPassword = defUser.initialPassword || db.users[idx].initialPassword;
        db.users[idx].kelas = defUser.kelas || db.users[idx].kelas;
        db.users[idx].isActive = true;
        db.users[idx].role = defUser.role || db.users[idx].role;
        db.users[idx].name = defUser.name || db.users[idx].name;
        db.users[idx].username = defUser.username || db.users[idx].username;
        db.users[idx].jabatan = defUser.jabatan || db.users[idx].jabatan;
      }
    });
  }

  // Pastikan akun contoh lama tidak masuk
  if (Array.isArray(db.users)) {
    const demoUsernames = [
      'guru.matematika',
      'guru.bahasa',
      'kepala.sekolah',
      'panitia.osis',
      'alvaro1234',
      'itskimzz',
      'tamansiswa1',
    ];
    db.users = db.users.filter((u) => {
      const lower = u.username.toLowerCase();
      if (demoUsernames.includes(lower)) return false;
      return true;
    });
  }

  // Pastikan struktur array ada dan tidak di-reset agar postingan & data tidak hilang
  if (!Array.isArray(db.posts)) db.posts = [];
  if (!Array.isArray(db.stories)) db.stories = [];
  if (!Array.isArray(db.users)) db.users = [];
  if (!Array.isArray(db.notifications)) db.notifications = [];
  if (!Array.isArray(db.passwordResetRequests)) db.passwordResetRequests = [];

  return db;
}

function saveDB(data: StandaloneDB) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  } catch (e: any) {
    console.error('[OfflineDB] Failed to save DB to localStorage:', e);
    // Quota fallback: if localStorage quota is exceeded, strip big media from older posts/stories
    try {
      const cloned = { ...data };
      if (Array.isArray(cloned.posts)) {
        cloned.posts = cloned.posts.slice(0, 30).map((p, idx) => {
          if (idx > 5 && p.mediaUrl && p.mediaUrl.length > 30000) {
            return { ...p, mediaUrl: undefined };
          }
          return p;
        });
      }
      if (Array.isArray(cloned.stories)) {
        cloned.stories = cloned.stories.slice(0, 15);
      }
      localStorage.setItem(DB_KEY, JSON.stringify(cloned));
    } catch (err2) {
      console.warn('[OfflineDB] Secondary quota fallback failed:', err2);
    }
  }
}

function getStoredPasswords(): Record<string, string> {
  let map: Record<string, string> = {};
  try {
    const raw = localStorage.getItem(PASSWORDS_KEY);
    if (raw) map = JSON.parse(raw);
  } catch (_) {}

  const defaults: Record<string, string> = {
    'TAMANSISWA': 'TAMVESTA123',
    'haliza.tu': 'Tamvesta!H2605',
    'haliza.admin': 'Tamvesta!H2605',
    'haliza': 'Tamvesta!H2605',
    'tata.usaha': 'Tamvesta!H2605',
  };

  if (Array.isArray((defaultData as any).users)) {
    (defaultData as any).users.forEach((u: any) => {
      if (u.username && u.initialPassword) {
        defaults[u.username] = u.initialPassword;
        defaults[u.username.toLowerCase()] = u.initialPassword;
      }
    });
  }

  return { ...defaults, ...map };
}

function savePassword(username: string, pass: string) {
  const map = getStoredPasswords();
  const clean = username.trim().toLowerCase().replace(/^@+/, '');
  map[username] = pass;
  map[username.toLowerCase()] = pass;
  map[clean] = pass;
  map[`@${clean}`] = pass;
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(map));
}

export const offlineStore = {
  getCurrentUserId(): string | null {
    return localStorage.getItem(CURRENT_USER_KEY) || 'user_siswa_bintang';
  },

  setCurrentUserId(id: string | null) {
    if (id) {
      localStorage.setItem(CURRENT_USER_KEY, id);
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  },

  syncUserFromServer(user: User) {
    if (!user || !user.id) return;
    const db = loadDB();
    if (!Array.isArray(db.users)) db.users = [];
    const cleanUser = (user.username || '').toLowerCase().replace(/^@+/, '');
    const idx = db.users.findIndex(
      (u) => u.id === user.id || (u.username || '').toLowerCase().replace(/^@+/, '') === cleanUser
    );
    if (idx >= 0) {
      db.users[idx] = { ...db.users[idx], ...user };
    } else {
      db.users.push(user);
    }
    saveDB(db);
  },

  saveStudentFromServer(serverStudent: User, password?: string) {
    if (!serverStudent || !serverStudent.id) return;
    const db = loadDB();
    if (!Array.isArray(db.users)) db.users = [];
    const cleanUsername = (serverStudent.username || '').toLowerCase().replace(/^@+/, '');
    const idx = db.users.findIndex(
      (u) => u.id === serverStudent.id || (u.username || '').toLowerCase().replace(/^@+/, '') === cleanUsername
    );
    const initialPass = password || serverStudent.initialPassword || (serverStudent as any).password || 'SiswaTamvesta123';
    const studentToSave: User = {
      ...serverStudent,
      username: cleanUsername,
      initialPassword: initialPass,
      password: initialPass,
      mustChangePassword: serverStudent.mustChangePassword !== undefined ? serverStudent.mustChangePassword : true,
    };
    if (idx >= 0) {
      db.users[idx] = { ...db.users[idx], ...studentToSave };
    } else {
      db.users.unshift(studentToSave);
    }
    if (initialPass) {
      savePassword(cleanUsername, initialPass);
      savePassword(serverStudent.username, initialPass);
    }
    saveDB(db);
  },

  syncStudentEntity(serverStudent: User) {
    if (!serverStudent || !serverStudent.id) return;
    const db = loadDB();
    if (!Array.isArray(db.users)) db.users = [];
    const cleanUsername = (serverStudent.username || '').toLowerCase().replace(/^@+/, '');
    const idx = db.users.findIndex(
      (u) => u.id === serverStudent.id || (u.username || '').toLowerCase().replace(/^@+/, '') === cleanUsername
    );
    if (idx >= 0) {
      db.users[idx] = { ...db.users[idx], ...serverStudent };
    } else {
      db.users.push(serverStudent);
    }
    saveDB(db);
  },

  getCurrentUser(): User | null {
    const db = loadDB();
    const id = this.getCurrentUserId();
    const found = db.users.find((u) => u.id === id);
    return found || db.users[1] || db.users[0] || null;
  },

  login(credentials: { username: string; password: string }) {
    const db = loadDB();
    const inputUser = credentials.username.trim().toLowerCase().replace(/^@+/, '');
    const inputPass = credentials.password.trim();

    const user = db.users.find((u) => {
      if (u.isActive === false) return false;
      const uName = (u.username || '').toLowerCase().replace(/^@+/, '');
      if (uName === inputUser) return true;
      if (['haliza.tu', 'haliza.admin', 'haliza', 'tata.usaha', 'tatausaha'].includes(inputUser)) {
        return uName === 'haliza.tu' || uName === 'haliza.admin' || (u.role === 'tata_usaha' && u.name.toLowerCase().includes('haliza'));
      }
      return false;
    });

    if (!user) {
      throw new Error('Username atau kata sandi tidak valid');
    }

    const passwords = getStoredPasswords();
    const cleanUsername = (user.username || '').toLowerCase().replace(/^@+/, '');
    const candidatePasswords = [
      user.initialPassword,
      (user as any).password,
      passwords[user.username],
      passwords[user.username.toLowerCase()],
      passwords[cleanUsername],
      passwords[`@${cleanUsername}`],
      user.role === 'admin' ? 'TAMVESTA123' : user.role === 'tata_usaha' ? 'Tamvesta!H2605' : user.role === 'guru' ? 'GuruTamvesta123' : 'SiswaTamvesta123',
      'Tamvesta!H2605',
      'TAMVESTA123',
    ].filter(Boolean);

    const isMatch = candidatePasswords.some((p) => p && p.trim() === inputPass);

    if (!isMatch) {
      throw new Error('Username atau kata sandi tidak valid');
    }

    this.setCurrentUserId(user.id);
    const token = 'offline_token_' + user.id;
    const isStillInitial = user.role === 'siswa' && (user.initialPassword ? (passwords[cleanUsername] === user.initialPassword || passwords[user.username] === user.initialPassword || !passwords[cleanUsername]) : true);
    const mustChange = user.role === 'admin' ? false : (user.role === 'siswa' ? (user.mustChangePassword === true || isStillInitial) : !!user.mustChangePassword);
    const cleanUser = { ...user, mustChangePassword: mustChange };
    return { token, user: cleanUser, mustChangePassword: mustChange };
  },

  getMe() {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('Sesi berakhir, silakan login kembali');
    }
    const passwords = getStoredPasswords();
    const isStillInitial = user.role === 'siswa' && (user.initialPassword ? (passwords[user.username] === user.initialPassword || !passwords[user.username]) : true);
    const mustChange = user.role === 'admin' ? false : (user.role === 'siswa' ? (user.mustChangePassword === true || isStillInitial) : !!user.mustChangePassword);
    const cleanUser = { ...user, mustChangePassword: mustChange };
    return { user: cleanUser, mustChangePassword: mustChange };
  },

  updateProfile(data: { avatarUrl?: string; bio?: string; phone?: string; email?: string }) {
    const db = loadDB();
    const user = this.getCurrentUser();
    if (!user) throw new Error('Pengguna tidak ditemukan');

    const target = db.users.find((u) => u.id === user.id);
    if (!target) throw new Error('Pengguna tidak ditemukan');

    if (data.avatarUrl !== undefined) target.avatarUrl = data.avatarUrl;
    if (data.bio !== undefined) target.bio = data.bio;
    if (data.phone !== undefined) target.phone = data.phone;
    if (data.email !== undefined) target.email = data.email;

    // Update author avatar across user's posts & comments
    (db.posts || []).forEach((p) => {
      if (p.authorId === user.id && data.avatarUrl !== undefined) {
        p.authorAvatar = data.avatarUrl;
      }
      (p.comments || []).forEach((c) => {
        if (c.authorId === user.id && data.avatarUrl !== undefined) {
          c.authorAvatar = data.avatarUrl;
        }
      });
    });

    saveDB(db);
    return { message: 'Profil berhasil diperbarui', user: target };
  },

  updateUsername(newUsername: string) {
    const db = loadDB();
    const user = this.getCurrentUser();
    if (!user) throw new Error('Pengguna tidak ditemukan');
    if (user.role === 'admin') throw new Error('Username administrator tidak dapat diubah');

    const trimmed = newUsername.trim().toLowerCase();
    if (trimmed.length < 3) throw new Error('Username minimal 3 karakter');
    if (db.users.some((u) => u.id !== user.id && u.username.toLowerCase() === trimmed)) {
      throw new Error('Username sudah digunakan pengguna lain');
    }

    const target = db.users.find((u) => u.id === user.id);
    if (!target) throw new Error('Pengguna tidak ditemukan');

    const oldUsername = target.username;
    target.username = trimmed;
    target.lastUsernameChange = new Date().toISOString();

    const pmap = getStoredPasswords();
    if (pmap[oldUsername]) {
      pmap[trimmed] = pmap[oldUsername];
      delete pmap[oldUsername];
      localStorage.setItem(PASSWORDS_KEY, JSON.stringify(pmap));
    }

    (db.posts || []).forEach((p) => {
      if (p.authorId === user.id) p.authorUsername = trimmed;
    });

    saveDB(db);
    return { message: 'Username berhasil diperbarui', user: target, token: 'offline_token_' + target.id };
  },

  changePassword(oldPass: string, newPass: string) {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Pengguna tidak ditemukan');

    const passwords = getStoredPasswords();
    const currentPass = passwords[user.username] || passwords[user.username.toLowerCase()] || user.initialPassword || (user as any).password || (user.role === 'admin' ? 'TAMVESTA123' : user.role === 'guru' ? 'GuruTamvesta123' : 'Siswa7A001');

    if (oldPass !== currentPass) {
      throw new Error('Kata sandi saat ini salah');
    }
    if (newPass.length < 6) {
      throw new Error('Kata sandi baru minimal 6 karakter');
    }

    savePassword(user.username, newPass);
    const db = loadDB();
    const target = db.users.find((u) => u.id === user.id);
    if (target) {
      target.mustChangePassword = false;
      saveDB(db);
    }

    return { message: 'Kata sandi berhasil diubah', user: target || user };
  },

  resetStudentPassword(studentId: string, newPass: string) {
    const db = loadDB();
    const target = db.users.find((u) => u.id === studentId);
    if (target) {
      savePassword(target.username, newPass);
      target.mustChangePassword = false;
      saveDB(db);
    }
    return { message: 'Kata sandi berhasil direset' };
  },

  savePostDirect(post: StudentPost) {
    const db = loadDB();
    if (!Array.isArray(db.posts)) db.posts = [];
    const idx = db.posts.findIndex((p) => p.id === post.id);
    if (idx > -1) {
      db.posts[idx] = { ...db.posts[idx], ...post };
    } else {
      db.posts.unshift(post);
    }
    saveDB(db);
  },

  setPostsList(posts: StudentPost[]) {
    const db = loadDB();
    db.posts = posts;
    saveDB(db);
  },

  saveStoryDirect(story: Story) {
    const db = loadDB();
    if (!Array.isArray(db.stories)) db.stories = [];
    const idx = db.stories.findIndex((s) => s.id === story.id);
    if (idx > -1) {
      db.stories[idx] = { ...db.stories[idx], ...story };
    } else {
      db.stories.unshift(story);
    }
    saveDB(db);
  },

  setStoriesList(stories: Story[]) {
    const db = loadDB();
    db.stories = stories;
    saveDB(db);
  },

  // Posts (Feed Siswa)
  getPosts(): StudentPost[] {
    const db = loadDB();
    const users = db.users || [];
    return (db.posts || [])
      .map((p) => {
        const author = users.find((u) => u.id === p.authorId);
        return {
          ...p,
          authorIsVerified: author ? !!author.isVerified : !!p.authorIsVerified,
          authorIsAlumni: author ? !!author.isAlumni : !!(p as any).authorIsAlumni,
        };
      })
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },

  createPost(data: { caption: string; mediaUrl?: string; mediaType?: 'photo' | 'video' }) {
    const db = loadDB();
    const user = this.getCurrentUser();
    if (!user) throw new Error('Login diperlukan');

    const newPost: StudentPost = {
      id: 'post_' + Date.now(),
      authorId: user.id,
      authorName: user.name,
      authorUsername: user.username,
      authorAvatar: user.avatarUrl,
      authorKelas: user.kelas || '',
      authorIsVerified: !!user.isVerified,
      authorIsAlumni: !!user.isAlumni,
      caption: data.caption,
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType ?? 'none',
      likes: [],
      comments: [],
      createdAt: new Date().toISOString(),
    };

    db.posts = [newPost, ...(db.posts || [])];
    saveDB(db);
    return newPost;
  },

  toggleLikePost(postId: string) {
    const db = loadDB();
    const user = this.getCurrentUser();
    if (!user) throw new Error('Login diperlukan');

    const post = (db.posts || []).find((p) => p.id === postId);
    if (!post) throw new Error('Postingan tidak ditemukan');

    if (!Array.isArray(post.likes)) post.likes = [];
    const index = post.likes.indexOf(user.id);
    const isLiked = index > -1;

    if (isLiked) {
      post.likes.splice(index, 1);
    } else {
      post.likes.push(user.id);
    }

    saveDB(db);
    return { isLiked: !isLiked, likesCount: post.likes.length };
  },

  addComment(postId: string, text: string) {
    const db = loadDB();
    const user = this.getCurrentUser();
    if (!user) throw new Error('Login diperlukan');

    const post = (db.posts || []).find((p) => p.id === postId);
    if (!post) throw new Error('Postingan tidak ditemukan');

    if (!Array.isArray(post.comments)) post.comments = [];
    const newComment: PostComment = {
      id: 'comment_' + Date.now(),
      postId,
      authorId: user.id,
      authorName: user.name,
      authorUsername: user.username,
      authorAvatar: user.avatarUrl,
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };

    post.comments.push(newComment);
    saveDB(db);
    return newComment;
  },

  updatePost(postId: string, caption: string) {
    const db = loadDB();
    const user = this.getCurrentUser();
    if (!user) throw new Error('Login diperlukan');

    const post = (db.posts || []).find((p) => p.id === postId);
    if (!post) throw new Error('Postingan tidak ditemukan');
    if (post.authorId !== user.id && user.role !== 'admin') {
      throw new Error('Anda tidak memiliki izin mengedit postingan ini');
    }

    post.caption = caption;
    saveDB(db);
    return post;
  },

  deletePost(postId: string) {
    const db = loadDB();
    db.posts = (db.posts || []).filter((p) => p.id !== postId);
    (db as any).deletedPostIds = (db as any).deletedPostIds || [];
    if (!(db as any).deletedPostIds.includes(postId)) {
      (db as any).deletedPostIds.push(postId);
    }
    saveDB(db);
    return { message: 'Postingan berhasil dihapus' };
  },

  toggleFollow(targetUserId: string) {
    const db = loadDB();
    const user = this.getCurrentUser();
    if (!user) throw new Error('Login diperlukan');
    if (user.id === targetUserId) throw new Error('Tidak dapat mengikuti diri sendiri');

    const currentTarget = db.users.find((u) => u.id === user.id);
    const followedTarget = db.users.find((u) => u.id === targetUserId);
    if (!currentTarget || !followedTarget) throw new Error('Pengguna tidak ditemukan');

    if (!Array.isArray(currentTarget.following)) currentTarget.following = [];
    if (!Array.isArray(followedTarget.followers)) followedTarget.followers = [];

    const isFollowing = currentTarget.following.includes(targetUserId);

    if (isFollowing) {
      currentTarget.following = currentTarget.following.filter((id) => id !== targetUserId);
      followedTarget.followers = followedTarget.followers.filter((id) => id !== user.id);
    } else {
      currentTarget.following.push(targetUserId);
      followedTarget.followers.push(user.id);
    }

    saveDB(db);
    return {
      isFollowing: !isFollowing,
      followersCount: followedTarget.followers.length,
      followingCount: currentTarget.following.length,
    };
  },

  getUserProfile(username: string) {
    const db = loadDB();
    const currentUser = this.getCurrentUser();
    const targetUser = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!targetUser) throw new Error('Pengguna tidak ditemukan');

    const posts = (db.posts || []).filter((p) => p.authorId === targetUser.id);
    const followers = Array.isArray(targetUser.followers) ? targetUser.followers : [];
    const following = Array.isArray(targetUser.following) ? targetUser.following : [];
    const isSelf = currentUser ? currentUser.id === targetUser.id : false;
    const isFollowing = currentUser ? followers.includes(currentUser.id) : false;

    return {
      user: {
        id: targetUser.id,
        name: targetUser.name,
        username: targetUser.username,
        avatarUrl: targetUser.avatarUrl,
        bio: targetUser.bio,
        role: targetUser.role,
        classGrade: targetUser.classGrade,
        classMajor: targetUser.classMajor,
      },
      posts,
      followersCount: followers.length,
      followingCount: following.length,
      isSelf,
      isFollowing,
    };
  },

  // Stories
  getStories(): Story[] {
    const db = loadDB();
    const now = Date.now();
    return (db.stories || []).filter(
      (s) => new Date(s.expiresAt).getTime() > now
    );
  },

  createStory(data: { mediaUrl: string; mediaType: 'photo' | 'video'; caption?: string }): Story {
    const db = loadDB();
    const user = this.getCurrentUser();
    if (!user) throw new Error('Login diperlukan');

    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const newStory: Story = {
      id: 'story_' + Date.now(),
      authorId: user.id,
      authorName: user.name,
      authorUsername: user.username,
      authorAvatar: user.avatarUrl,
      authorKelas: user.kelas || '',
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType ?? 'none',
      caption: data.caption,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    };

    db.stories = [newStory, ...(db.stories || [])];
    saveDB(db);
    return newStory;
  },

  deleteStory(id: string) {
    const db = loadDB();
    const user = this.getCurrentUser();
    db.stories = (db.stories || []).filter(
      (s) => s.id !== id || (user && s.authorId !== user.id && user.role !== 'admin')
    );
    saveDB(db);
    return { message: 'Story berhasil dihapus' };
  },

  // Personal Notes (Arsip Siswa)
  getNotes(): PersonalNote[] {
    const db = loadDB();
    const user = this.getCurrentUser();
    if (!user) return [];
    return (db.notes || []).filter((n) => n.userId === user.id);
  },

  createNote(data: { title: string; content: string; color?: string }): PersonalNote {
    const db = loadDB();
    const user = this.getCurrentUser();
    if (!user) throw new Error('Login diperlukan');

    const newNote: PersonalNote = {
      id: 'note_' + Date.now(),
      userId: user.id,
      title: data.title,
      content: data.content,
      color: data.color || '#F0F9FF',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.notes = [newNote, ...(db.notes || [])];
    saveDB(db);
    return newNote;
  },

  updateNote(id: string, data: { title: string; content: string; color?: string }): PersonalNote {
    const db = loadDB();
    const user = this.getCurrentUser();
    if (!user) throw new Error('Login diperlukan');

    const note = (db.notes || []).find((n) => n.id === id && n.userId === user.id);
    if (!note) throw new Error('Catatan tidak ditemukan');

    note.title = data.title;
    note.content = data.content;
    if (data.color) note.color = data.color;
    note.updatedAt = new Date().toISOString();

    saveDB(db);
    return note;
  },

  deleteNote(id: string) {
    const db = loadDB();
    const user = this.getCurrentUser();
    db.notes = (db.notes || []).filter(
      (n) => n.id !== id || (user && n.userId !== user.id)
    );
    saveDB(db);
    return { message: 'Catatan berhasil dihapus' };
  },

  // Quizzes
  getQuizzes(): Quiz[] {
    const db = loadDB();
    return db.quizzes || [];
  },

  getQuizById(id: string): Quiz {
    const db = loadDB();
    const q = (db.quizzes || []).find((x) => x.id === id);
    if (!q) throw new Error('Kuis tidak ditemukan');
    return q;
  },

  verifyQuizToken(quizId: string, token: string) {
    const q = this.getQuizById(quizId);
    if (!q.token || q.token.toUpperCase() === token.trim().toUpperCase()) {
      return { success: true, quiz: q };
    }
    throw new Error('Token kuis salah');
  },

  submitQuizAttempt(quizId: string, answers: Record<string, string>) {
    const db = loadDB();
    const user = this.getCurrentUser();
    if (!user) throw new Error('Login diperlukan');
    const quiz = (db.quizzes || []).find((q) => q.id === quizId);
    if (!quiz) throw new Error('Kuis tidak ditemukan');

    let correctCount = 0;
    const detailedAnswers: { questionId: string; selectedOption: number; isCorrect: boolean }[] = [];
    quiz.questions.forEach((q) => {
      const selectedStr = answers[q.id];
      const selected = selectedStr !== undefined ? Number(selectedStr) : -1;
      const isCorrect = selected === q.correctOptionIndex;
      if (isCorrect) correctCount++;
      detailedAnswers.push({ questionId: q.id, selectedOption: selected, isCorrect });
    });

    const score = Math.round((correctCount / (quiz.questions.length || 1)) * 100);
    const passed = score >= (quiz.passingScore || 70);
    const attempt: QuizAttempt = {
      id: 'attempt_' + Date.now(),
      quizId,
      quizTitle: quiz.title,
      studentId: user.id,
      studentName: user.name,
      username: user.username,
      tokenUsed: quiz.token,
      answers: detailedAnswers,
      score,
      totalQuestions: quiz.questions.length,
      correctAnswersCount: correctCount,
      passed,
      completedAt: new Date().toISOString(),
    };

    if (!Array.isArray(db.quizAttempts)) db.quizAttempts = [];
    db.quizAttempts.push(attempt);
    saveDB(db);
    return attempt;
  },

  // Subjects & Books & Announcements
  getSubjects(): Subject[] {
    return loadDB().subjects || [];
  },

  getBooks(): DigitalBook[] {
    return loadDB().books || [];
  },

  getAnnouncements(): Announcement[] {
    return loadDB().announcements || [];
  },

  // Attendance
  getAttendanceEvents(): AttendanceEvent[] {
    return loadDB().attendanceEvents || [];
  },

  getActiveAttendanceEvent(): AttendanceEvent | null {
    const events = this.getAttendanceEvents();
    return events.find((e) => (e as any).isActive || e.isOpen) || events[0] || null;
  },

  recordAttendanceScan(payload: { qrToken: string; eventId?: string }) {
    const db = loadDB();
    const user = this.getCurrentUser();
    if (!user) throw new Error('Login diperlukan');

    const event = this.getActiveAttendanceEvent();
    const record: AttendanceRecord = {
      id: 'rec_' + Date.now(),
      eventId: payload.eventId || (event ? event.id : 'event_general'),
      eventName: event ? event.name : 'Kegiatan Sekolah',
      studentId: user.id,
      studentName: user.name,
      username: user.username,
      kelas: user.kelas,
      verifiedAt: new Date().toISOString(),
      verifiedBy: 'Self',
      status: 'TELAH MASUK',
      verificationResult: 'BERHASIL',
    };

    if (!Array.isArray(db.attendanceRecords)) db.attendanceRecords = [];
    db.attendanceRecords.push(record);
    saveDB(db);

    return { success: true, message: 'Absensi berhasil dicatat!', record };
  },

  getStudentAttendance(studentId: string): AttendanceRecord[] {
    const db = loadDB();
    return (db.attendanceRecords || []).filter((r) => r.studentId === studentId);
  },

  getAttendanceStats() {
    return { hadir: 95, sakit: 2, izin: 3, alpha: 0 };
  },

  // Notifications
  getNotifications(): (AppNotification & { isRead: boolean })[] {
    const db = loadDB();
    const user = this.getCurrentUser();
    return (db.notifications || []).map((n) => ({
      ...n,
      isRead: user ? (n.readBy || []).includes(user.id) : false,
    }));
  },

  markNotificationRead(id: string) {
    const db = loadDB();
    const user = this.getCurrentUser();
    const item = (db.notifications || []).find((n) => n.id === id);
    if (item && user) {
      if (!Array.isArray(item.readBy)) item.readBy = [];
      if (!item.readBy.includes(user.id)) item.readBy.push(user.id);
    }
    saveDB(db);
    return { success: true };
  },

  markAllNotificationsRead() {
    const db = loadDB();
    const user = this.getCurrentUser();
    if (user) {
      (db.notifications || []).forEach((n) => {
        if (!Array.isArray(n.readBy)) n.readBy = [];
        if (!n.readBy.includes(user.id)) n.readBy.push(user.id);
      });
    }
    saveDB(db);
    return { success: true };
  },

  deleteNotification(id: string) {
    const db = loadDB();
    db.notifications = (db.notifications || []).filter((n) => n.id !== id);
    saveDB(db);
    return { message: 'Notifikasi berhasil dihapus' };
  },

  // Admin
  getStudents(): User[] {
    return (loadDB().users || []).filter((u) => u.role === 'siswa');
  },

  getStaff(): User[] {
    return (loadDB().users || []).filter((u) => u.role === 'guru' || u.role === 'kepala_sekolah' || u.role === 'tata_usaha');
  },

  // -------------------------------------------------------------
  // ARTIKEL GURU & METODE PEMBELAJARAN
  // -------------------------------------------------------------
  getArticles(category?: string, onlyPublished?: boolean) {
    const db = loadDB();
    if (!Array.isArray((db as any).articles)) { (db as any).articles = []; saveDB(db); }
    let list = [...(db as any).articles];
    if (category) list = list.filter((a: any) => a.category === category);
    if (onlyPublished) list = list.filter((a: any) => a.isPublished);
    return list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createArticle(data: any) {
    const db = loadDB();
    const user = this.getCurrentUser();
    if (!Array.isArray((db as any).articles)) (db as any).articles = [];
    const newArt = {
      id: `art_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      authorId: user ? user.id : 'user_guru',
      authorName: user ? user.name : 'Guru Tamansiswa',
      authorAvatar: user?.avatarUrl,
      authorSubject: user?.jabatan || 'Guru Mata Pelajaran',
      title: data.title,
      summary: data.summary,
      content: data.content,
      category: data.category || 'Artikel Guru',
      coverUrl: data.coverUrl,
      isPublished: data.isPublished !== false,
      likesCount: 0,
      readsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    (db as any).articles.unshift(newArt);
    saveDB(db);
    return newArt;
  },

  updateArticle(id: string, data: any) {
    const db = loadDB();
    if (!Array.isArray((db as any).articles)) (db as any).articles = [];
    const art = (db as any).articles.find((a: any) => a.id === id);
    if (!art) throw new Error('Artikel tidak ditemukan');
    Object.assign(art, data, { updatedAt: new Date().toISOString() });
    saveDB(db);
    return art;
  },

  deleteArticle(id: string) {
    const db = loadDB();
    if (!Array.isArray((db as any).articles)) return { message: 'Artikel berhasil dihapus' };
    (db as any).articles = (db as any).articles.filter((a: any) => a.id !== id);
    saveDB(db);
    return { message: 'Artikel berhasil dihapus' };
  },

  // -------------------------------------------------------------
  // ABSENSI KELAS GURU (QR & MANUAL)
  // -------------------------------------------------------------
  getClassAttendance(filters: { date?: string; kelas?: string; studentId?: string; status?: string }) {
    const db = loadDB();
    if (!Array.isArray((db as any).classAttendance)) (db as any).classAttendance = [];
    let list = [...(db as any).classAttendance];
    if (filters.date) list = list.filter((a: any) => a.date === filters.date);
    if (filters.kelas) list = list.filter((a: any) => a.kelas.toLowerCase() === filters.kelas!.toLowerCase());
    if (filters.studentId) list = list.filter((a: any) => a.studentId === filters.studentId);
    if (filters.status && filters.status !== 'semua') list = list.filter((a: any) => a.status === filters.status);
    return list;
  },

  recordClassAttendance(entries: any[]) {
    const db = loadDB();
    const user = this.getCurrentUser();
    if (!Array.isArray((db as any).classAttendance)) (db as any).classAttendance = [];

    entries.forEach((e) => {
      const entryWithMeta = {
        ...e,
        teacherId: user ? user.id : 'user_guru',
        teacherName: user ? user.name : 'Guru',
        createdAt: new Date().toISOString(),
      };
      const existingIdx = (db as any).classAttendance.findIndex(
        (item: any) => item.studentId === e.studentId && item.date === e.date && item.kelas === e.kelas
      );
      if (existingIdx > -1) {
        (db as any).classAttendance[existingIdx] = { ...(db as any).classAttendance[existingIdx], ...entryWithMeta };
      } else {
        (db as any).classAttendance.push(entryWithMeta);
      }
    });

    saveDB(db);
    return { message: 'Absensi kelas berhasil disimpan', count: entries.length };
  },

  // -------------------------------------------------------------
  // TATA USAHA (TU) - TAGIHAN, TRANSAKSI, DOKUMEN & CHAT
  // -------------------------------------------------------------
  getTuitionBills(studentId?: string, kelas?: string, status?: string) {
    const db = loadDB();
    if (!Array.isArray((db as any).tuitionBills)) { (db as any).tuitionBills = []; saveDB(db); }
    let list = [...(db as any).tuitionBills];
    if (studentId) list = list.filter((b: any) => b.studentId === studentId);
    if (kelas) list = list.filter((b: any) => b.studentKelas.toLowerCase() === kelas.toLowerCase());
    if (status && status !== 'semua') list = list.filter((b: any) => b.status === status);
    return list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createTuitionBill(data: any) {
    const db = loadDB();
    if (!Array.isArray((db as any).tuitionBills)) (db as any).tuitionBills = [];
    const bill = {
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
    (db as any).tuitionBills.unshift(bill);
    saveDB(db);
    return bill;
  },

  updateTuitionBill(id: string, data: any) {
    const db = loadDB();
    if (!Array.isArray((db as any).tuitionBills)) (db as any).tuitionBills = [];
    const bill = (db as any).tuitionBills.find((b: any) => b.id === id);
    if (!bill) throw new Error('Tagihan tidak ditemukan');
    Object.assign(bill, data);
    saveDB(db);
    return bill;
  },

  deleteTuitionBill(id: string) {
    const db = loadDB();
    if (!Array.isArray((db as any).tuitionBills)) return { message: 'Tagihan berhasil dihapus' };
    (db as any).tuitionBills = (db as any).tuitionBills.filter((b: any) => b.id !== id);
    saveDB(db);
    return { message: 'Tagihan berhasil dihapus' };
  },

  getTuitionTransactions(type?: string) {
    const db = loadDB();
    if (!Array.isArray((db as any).tuitionTransactions)) { (db as any).tuitionTransactions = []; saveDB(db); }
    let list = [...(db as any).tuitionTransactions];
    if (type && type !== 'semua') list = list.filter((t: any) => t.type === type);
    return list.sort((a: any, b: any) => new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime());
  },

  createTuitionTransaction(data: any) {
    const db = loadDB();
    const user = this.getCurrentUser();
    if (!Array.isArray((db as any).tuitionTransactions)) (db as any).tuitionTransactions = [];
    const trx = {
      id: `trx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      billId: data.billId,
      studentId: data.studentId,
      studentName: data.studentName,
      studentKelas: data.studentKelas,
      amount: Number(data.amount) || 0,
      type: data.type || 'pemasukan',
      category: data.category || 'SPP',
      paymentMethod: data.paymentMethod || 'Tunai / Kasir TU',
      verifiedBy: user ? user.name : 'Staf Tata Usaha',
      verifiedAt: new Date().toISOString(),
      receiptNumber: `KW-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      description: data.description || 'Transaksi keuangan sekolah',
    };
    (db as any).tuitionTransactions.unshift(trx);
    saveDB(db);
    return trx;
  },

  getTuDocuments(category?: string) {
    const db = loadDB();
    if (!Array.isArray((db as any).tuDocuments)) { (db as any).tuDocuments = []; saveDB(db); }
    let list = [...(db as any).tuDocuments];
    if (category && category !== 'semua') list = list.filter((d: any) => d.category === category);
    return list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createTuDocument(data: any) {
    const db = loadDB();
    if (!Array.isArray((db as any).tuDocuments)) (db as any).tuDocuments = [];
    const doc = {
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
    (db as any).tuDocuments.unshift(doc);
    saveDB(db);
    return doc;
  },

  deleteTuDocument(id: string) {
    const db = loadDB();
    if (!Array.isArray((db as any).tuDocuments)) return { message: 'Dokumen berhasil dihapus' };
    (db as any).tuDocuments = (db as any).tuDocuments.filter((d: any) => d.id !== id);
    saveDB(db);
    return { message: 'Dokumen berhasil dihapus' };
  },

  getTuChatMessages(studentId?: string) {
    const db = loadDB();
    if (!Array.isArray((db as any).tuChatMessages)) { (db as any).tuChatMessages = []; saveDB(db); }
    let list = [...(db as any).tuChatMessages];
    if (studentId) list = list.filter((m: any) => m.studentId === studentId);
    return list.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  createTuChatMessage(data: any) {
    const db = loadDB();
    const user = this.getCurrentUser();
    if (!Array.isArray((db as any).tuChatMessages)) (db as any).tuChatMessages = [];
    const isStudent = user ? user.role === 'siswa' : data.senderRole === 'siswa';

    const msg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentId: isStudent ? (user ? user.id : 'user_siswa_bintang') : (data.studentId || ''),
      studentName: isStudent ? (user ? user.name : 'Siswa') : (data.studentName || 'Siswa'),
      studentKelas: isStudent ? (user?.kelas || user?.classGrade || 'X TKJ 1') : data.studentKelas,
      senderRole: isStudent ? 'siswa' : 'tata_usaha',
      senderName: user ? user.name : 'Pengguna',
      message: (data.message || '').trim(),
      proofUrl: data.proofUrl,
      billId: data.billId,
      createdAt: new Date().toISOString(),
      isReadByTu: isStudent ? false : true,
      isReadByStudent: isStudent ? true : false,
    };
    (db as any).tuChatMessages.push(msg);
    saveDB(db);
    return msg;
  },

  // -------------------------------------------------------------
  // MANAJEMEN GURU, CENTANG BIRU & SISWA/ALUMNI
  // -------------------------------------------------------------
  createStudent(studentData: Partial<User> & { password?: string }) {
    const db = loadDB();
    const rawUsername = studentData.username || `siswa_${Date.now()}`;
    const username = rawUsername.trim().toLowerCase().replace(/^@+/, '');
    const existing = db.users.find((u) => (u.username || '').toLowerCase().replace(/^@+/, '') === username);
    if (existing) throw new Error('Username siswa sudah digunakan.');

    const initialPassword = studentData.password?.trim() || 'SiswaTamvesta123';
    const kelas = studentData.kelas?.trim() || 'Kelas 7';
    const gender = studentData.gender || 'Laki-laki';
    const user: User = {
      id: `stu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username,
      name: (studentData.name || 'Siswa Baru').trim(),
      role: 'siswa',
      gender,
      kelas,
      initialPassword,
      password: initialPassword,
      passwordHash: '',
      salt: '',
      mustChangePassword: true,
      isActive: true,
      qrToken: `TAMVESTA:STUDENT:${username}`,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(studentData.name || 'Siswa')}&backgroundColor=0284c7`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    savePassword(user.username, initialPassword);
    savePassword(username, initialPassword);
    db.users.unshift(user);
    saveDB(db);
    return user;
  },

  deleteStudent(id: string) {
    const db = loadDB();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      const removedUser = db.users[idx];
      db.users.splice(idx, 1);
      (db as any).deletedUserIds = (db as any).deletedUserIds || [];
      if (!(db as any).deletedUserIds.includes(id)) {
        (db as any).deletedUserIds.push(id);
      }
      if (removedUser.username && !(db as any).deletedUserIds.includes(removedUser.username.toLowerCase())) {
        (db as any).deletedUserIds.push(removedUser.username.toLowerCase());
      }
      saveDB(db);
    }
  },

  getDeletedUserIds(): string[] {
    const db = loadDB();
    return (db as any).deletedUserIds || [];
  },

  getDeletedPostIds(): string[] {
    const db = loadDB();
    return (db as any).deletedPostIds || [];
  },

  getPasswordResetRequests(): PasswordResetRequest[] {
    const db = loadDB();
    return (db.passwordResetRequests || []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  saveTicketDirect(req: PasswordResetRequest) {
    if (!req || !req.id) return;
    const db = loadDB();
    if (!Array.isArray(db.passwordResetRequests)) db.passwordResetRequests = [];
    const idx = db.passwordResetRequests.findIndex((r) => r.id === req.id || r.ticketNumber === req.ticketNumber);
    if (idx >= 0) {
      db.passwordResetRequests[idx] = { ...db.passwordResetRequests[idx], ...req };
    } else {
      db.passwordResetRequests.unshift(req);
    }
    saveDB(db);
  },

  updateStudent(id: string, data: Partial<User>) {
    const db = loadDB();
    const u = db.users.find((user) => user.id === id);
    if (u) {
      if (data.name) u.name = data.name.trim();
      if (data.gender) u.gender = data.gender as any;
      if (data.kelas) u.kelas = data.kelas.trim();
      if (data.username && data.username.toLowerCase() !== u.username.toLowerCase()) {
        u.username = data.username.trim().toLowerCase();
        u.qrToken = `TAMVESTA:STUDENT:${u.username}`;
      }
      u.updatedAt = new Date().toISOString();
      saveDB(db);
    }
    return u;
  },

  createPasswordResetRequest(data: { userId: string; newPassword: string; reason?: string }) {
    const db = loadDB();
    const user = db.users.find((u) => u.id === data.userId);
    if (!user) throw new Error('Pengguna tidak ditemukan.');
    if (!Array.isArray(db.passwordResetRequests)) db.passwordResetRequests = [];
    const ticketNumber = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    const req: PasswordResetRequest = {
      id: `pr_${Date.now()}`,
      ticketNumber,
      userId: user.id,
      username: user.username,
      name: user.name,
      kelas: user.kelas || '-',
      role: user.role,
      reason: (data.reason || 'Pengajuan ganti sandi').trim(),
      status: 'pending',
      newPassword: data.newPassword,
      createdAt: new Date().toISOString(),
    };
    db.passwordResetRequests.unshift(req);
    saveDB(db);
    return req;
  },

  processPasswordResetRequest(id: string, status: 'approved' | 'rejected', adminNote?: string) {
    const db = loadDB();
    if (!Array.isArray(db.passwordResetRequests)) db.passwordResetRequests = [];
    const req = db.passwordResetRequests.find((r) => r.id === id);
    if (!req) throw new Error('Tiket tidak ditemukan.');
    if (req.status !== 'pending') throw new Error('Tiket sudah diproses sebelumnya.');
    req.status = status;
    req.processedAt = new Date().toISOString();
    req.processedBy = 'Administrator';
    req.adminNote = adminNote || (status === 'approved' ? 'Disetujui' : 'Ditolak');

    if (status === 'approved' && req.newPassword) {
      const user = db.users.find((u) => u.id === req.userId);
      if (user) {
        user.password = req.newPassword;
        user.initialPassword = req.newPassword;
        user.mustChangePassword = false;
        savePassword(user.username, req.newPassword);
      }
    }
    saveDB(db);
    return req;
  },

  getStudentTickets(userId: string) {
    const db = loadDB();
    if (!Array.isArray(db.passwordResetRequests)) return [];
    return db.passwordResetRequests.filter((r) => r.userId === userId);
  },

  createTeacherAccount(data: any) {
    const db = loadDB();
    const existing = db.users.find((u) => u.username.toLowerCase() === data.username.toLowerCase());
    if (existing) throw new Error('Username guru sudah digunakan.');

    const initialPassword = data.password || 'GuruTamvesta123';
    const newTeacher: User = {
      id: `user_teacher_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: data.username.trim().toLowerCase(),
      name: data.name.trim(),
      role: 'guru',
      jabatan: data.jabatan || 'Guru Mata Pelajaran',
      initialPassword,
      passwordHash: '',
      salt: '',
      mustChangePassword: false,
      isActive: true,
      isVerified: true,
      email: data.email,
      phone: data.phone,
      qrToken: `TAMVESTA:TEACHER:${data.username}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    savePassword(newTeacher.username, initialPassword);
    db.users.unshift(newTeacher);
    saveDB(db);
    return newTeacher;
  },

  updateTeacherAccount(id: string, data: any) {
    const db = loadDB();
    const teacher = db.users.find((u) => u.id === id);
    if (!teacher) throw new Error('Akun guru tidak ditemukan.');
    if (data.name) teacher.name = data.name.trim();
    if (data.jabatan) teacher.jabatan = data.jabatan.trim();
    if (data.email !== undefined) teacher.email = data.email;
    if (data.phone !== undefined) teacher.phone = data.phone;
    if (data.isActive !== undefined) teacher.isActive = data.isActive;
    if (data.isVerified !== undefined) teacher.isVerified = data.isVerified;
    teacher.updatedAt = new Date().toISOString();
    saveDB(db);
    return teacher;
  },

  deleteTeacherAccount(id: string) {
    const db = loadDB();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) return { message: 'Akun tidak ditemukan' };
    db.users.splice(idx, 1);
    saveDB(db);
    return { message: 'Akun guru berhasil dihapus dari sistem' };
  },

  toggleVerifiedBadge(userId: string) {
    const db = loadDB();
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error('Pengguna tidak ditemukan.');
    user.isVerified = !user.isVerified;
    saveDB(db);
    return { isVerified: user.isVerified };
  },

  toggleAlumniStatus(studentId: string) {
    const db = loadDB();
    const student = db.users.find((u) => u.id === studentId);
    if (!student) throw new Error('Siswa tidak ditemukan.');
    student.isAlumni = !student.isAlumni;
    saveDB(db);
    return { isAlumni: student.isAlumni };
  },
};
