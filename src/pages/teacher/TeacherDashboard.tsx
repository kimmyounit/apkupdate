import QRCode from 'qrcode';
import * as XLSX from 'xlsx';
import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Plus,
  Trash2,
  Users,
  Award,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  ScanLine,
  Search,
  Key,
  Copy,
  ExternalLink,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Lock,
  Unlock,
  AlertCircle,
  X,
  Share2,
  Edit2,
  Eye,
  Check,
  Save,
  UserCheck,
  UserX,
  FileText,
  Filter,
  QrCode,
  Download,
  Upload,
  FileSpreadsheet,
  Printer,
  Paperclip,
  FolderDown,
  RefreshCw,
  Package,
  ShieldAlert,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { LostFoundManagementPanel } from '../../components/LostFoundManagementPanel.tsx';
import { api } from '../../lib/api.ts';
import { playQuizExitAlertSound, playNotificationChime } from '../../lib/audio.ts';
import type {
  Quiz,
  QuizAttempt,
  QuizViolation,
  QuizParticipant,
  Subject,
  TeacherArticle,
  ClassAttendanceEntry,
  ClassAttendanceStatus,
  User,
} from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { formatGoogleFormsEmbedUrl } from '../student/QuizPage.tsx';

type TeacherTab = 'articles' | 'attendance' | 'quizzes' | 'lost_found';

// Helper pemetaan tingkat kelas 1 - 9 (SD & SMP) untuk pencarian siswa akurat
const getGradeNumber = (str: string): number | null => {
  if (!str) return null;
  const s = str.toUpperCase();
  // Evaluasi angka romawi terpanjang lebih dahulu
  if (/\bVIII\b|VIII[-_ ]|GRADE[-_ ]?8/.test(s)) return 8;
  if (/\bVII\b|VII[-_ ]|GRADE[-_ ]?7/.test(s)) return 7;
  if (/\bIX\b|IX[-_ ]|GRADE[-_ ]?9/.test(s)) return 9;
  if (/\bVI\b|VI[-_ ]|GRADE[-_ ]?6/.test(s)) return 6;
  if (/\bIV\b|IV[-_ ]|GRADE[-_ ]?4/.test(s)) return 4;
  if (/\bV\b|V[-_ ]|GRADE[-_ ]?5/.test(s)) return 5;
  if (/\bIII\b|III[-_ ]|GRADE[-_ ]?3/.test(s)) return 3;
  if (/\bII\b|II[-_ ]|GRADE[-_ ]?2/.test(s)) return 2;
  if (/\bI\b|I[-_ ]|GRADE[-_ ]?1/.test(s)) return 1;
  const digitMatch = s.match(/(?:KELAS|TINGKAT|GRADE|\b)[ ]?([1-9])\b/);
  if (digitMatch) return parseInt(digitMatch[1], 10);
  return null;
};

const getSectionLetter = (str: string): string | null => {
  if (!str) return null;
  const s = str.toUpperCase();
  const m = s.match(/(?:VIII|VII|IX|VI|IV|III|II|V|I|[1-9])[-_ ]?([A-Z])\b/);
  return m ? m[1] : null;
};

const isStudentInSelectedClass = (stuKelasRaw: string, selKelasRaw: string): boolean => {
  const stu = (stuKelasRaw || '').trim();
  const sel = (selKelasRaw || '').trim();
  if (!stu || !sel) return false;
  if (stu.toLowerCase() === sel.toLowerCase()) return true;

  const stuGrade = getGradeNumber(stu);
  const selGrade = getGradeNumber(sel);
  if (stuGrade === null || selGrade === null || stuGrade !== selGrade) {
    return false;
  }

  // Jika guru memilih rombel spesifik (misal VII-A atau VII-B)
  const selSection = getSectionLetter(sel);
  const stuSection = getSectionLetter(stu);
  if (selSection) {
    return stuSection === selSection;
  }

  // Jika guru memilih tingkat umum (misal Kelas 1 atau Kelas 7), cocokkan semua rombel tingkat tersebut
  return true;
};

export const TeacherDashboard: React.FC<{ onOpenScanner: () => void }> = ({ onOpenScanner }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TeacherTab>('articles');
  const [loading, setLoading] = useState(true);

  // --- Quiz Management State ---
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [participants, setParticipants] = useState<QuizParticipant[]>([]);
  const [isRefreshingQuiz, setIsRefreshingQuiz] = useState(false);
  const [quizSubTab, setQuizSubTab] = useState<'participants' | 'violations' | 'attempts'>('participants');
  const [latestViolationAlert, setLatestViolationAlert] = useState<QuizViolation | null>(null);
  const prevViolationCountRef = React.useRef<number>(0);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchAttempt, setSearchAttempt] = useState('');
  const [selectedQuizFilter, setSelectedQuizFilter] = useState<string>('all');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [violations, setViolations] = useState<QuizViolation[]>([]);

  // Create Quiz Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingLoading, setCreatingLoading] = useState(false);
  const [previewGoogleFormUrl, setPreviewGoogleFormUrl] = useState<string | null>(null);
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
  const [quizForm, setQuizForm] = useState({
    title: '',
    subjectName: 'Matematika Peminatan',
    description: '',
    durationMinutes: 15,
    passingScore: 75,
    token: '',
    sourceType: 'interactive' as 'interactive' | 'google_forms',
    externalUrl: '',
    password: '',
    scheduleStart: '',
    scheduleEnd: '',
    questions: [
      {
        id: 'q_guru_1',
        question: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        explanation: '',
      },
    ],
  });

  // --- Article State ---
  const [articles, setArticles] = useState<TeacherArticle[]>([]);
  const [articleCategoryFilter, setArticleCategoryFilter] = useState<string>('semua');
  const [articleSearch, setArticleSearch] = useState('');
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [articleSaving, setArticleSaving] = useState(false);
  const [previewArticle, setPreviewArticle] = useState<TeacherArticle | null>(null);
  const [articleForm, setArticleForm] = useState({
    title: '',
    category: 'Artikel Guru' as 'Artikel Guru' | 'Metode Pembelajaran',
    summary: '',
    content: '',
    coverImage: '',
    tags: '',
    isPublished: true,
  });

  // --- Attendance State ---
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<string>('Kelas 7');
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, { status: 'hadir' | 'izin' | 'sakit' | 'alpa'; notes: string }>
  >({});
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [attendanceSuccess, setAttendanceSuccess] = useState<string | null>(null);
  const [existingAttendance, setExistingAttendance] = useState<ClassAttendanceEntry[]>([]);

  // Alert message state
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Daftar tingkat kelas resmi Perguruan Tamansiswa Batam (Kelas 1 - 9)
  const defaultClassList = [
    // SD (Kelas 1 - 6)
    'Kelas 1',
    'Kelas 1 SD',
    'I-A SD',
    'Kelas 2',
    'Kelas 2 SD',
    'II-A SD',
    'Kelas 3',
    'Kelas 3 SD',
    'III-A SD',
    'Kelas 4',
    'Kelas 4 SD',
    'IV-A SD',
    'Kelas 5',
    'Kelas 5 SD',
    'V-A SD',
    'Kelas 6',
    'Kelas 6 SD',
    'VI-A SD',
    // SMP (Kelas 7 - 9)
    'Kelas 7',
    'Kelas 7 SMP',
    'VII-A SMP',
    'VII-B SMP',
    'Kelas 8',
    'Kelas 8 SMP',
    'VIII-A SMP',
    'VIII-B SMP',
    'Kelas 9',
    'Kelas 9 SMP',
    'IX-A SMP',
    'IX-B SMP',
  ];

  // Dynamic classList combining presets and actual student data
  const classList = Array.from(
    new Set([
      ...defaultClassList,
      ...(allStudents || []).map((s) => s.kelas).filter(Boolean) as string[],
    ])
  );

  // Custom class input & attendance state
  const [customKelasInput, setCustomKelasInput] = useState('');
  const [showAddCustomClass, setShowAddCustomClass] = useState(false);
  const [selectedStudentForQr, setSelectedStudentForQr] = useState<User | null>(null);
  const [qrModalDataUrl, setQrModalDataUrl] = useState<string>('');
  const [attachedAttendanceFile, setAttachedAttendanceFile] = useState<{
    name: string;
    size: string;
    dataUrl: string;
    uploadedAt: string;
  } | null>(null);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [autoBackupMessage, setAutoBackupMessage] = useState<string | null>(null);
  const [refreshingStudents, setRefreshingStudents] = useState(false);

  const handleRefreshAttendanceStudents = async () => {
    setRefreshingStudents(true);
    try {
      try {
        await api.syncPublicUsers();
      } catch (_) {}
      const stuList = await api.getStudents();
      if (Array.isArray(stuList)) {
        setAllStudents(stuList);
        setAttendanceSuccess(`Data siswa berhasil disegarkan! ${stuList.length} siswa termuat.`);
        setTimeout(() => setAttendanceSuccess(null), 3500);
      }
    } catch (err: any) {
      console.warn('Gagal menyegarkan siswa:', err);
    } finally {
      setRefreshingStudents(false);
    }
  };

  const handleRefreshQuizData = async () => {
    setIsRefreshingQuiz(true);
    try {
      const [qz, att, viols, parts] = await Promise.all([
        api.getQuizzes(),
        api.getQuizAttempts(),
        api.getQuizViolations(),
        api.getQuizParticipants(),
      ]);
      const activeIds = new Set((qz || []).map((q: any) => q.id));
      if (Array.isArray(qz)) setQuizzes(qz);
      if (Array.isArray(att)) setAttempts(att.filter((a: any) => activeIds.has(a.quizId)));
      if (Array.isArray(parts)) setParticipants(parts.filter((p: any) => activeIds.has(p.quizId)));
      if (Array.isArray(viols)) {
        const validViols = viols.filter((v: any) => activeIds.has(v.quizId));
        if (validViols.length > prevViolationCountRef.current && prevViolationCountRef.current > 0) {
          const newest = validViols[0];
          setLatestViolationAlert(newest);
          playQuizExitAlertSound();
        }
        prevViolationCountRef.current = validViols.length;
        setViolations(validViols);
      }
    } catch (err) {
      console.error('Failed to refresh quiz data:', err);
    } finally {
      setTimeout(() => setIsRefreshingQuiz(false), 500);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await api.syncLocalQuizzesToServer().catch(() => {});
      const [qz, att, sb, artList, stuList, viols, parts] = await Promise.all([
        api.getQuizzes(),
        api.getQuizAttempts(),
        api.getSubjects(),
        api.getArticles(),
        api.getStudents(),
        api.getQuizViolations(),
        api.getQuizParticipants(),
      ]);
      const activeIds = new Set((qz || []).map((q: any) => q.id));
      setQuizzes(qz);
      setAttempts((att || []).filter((a: any) => activeIds.has(a.quizId)));
      setSubjects(sb);
      setArticles(artList);
      setAllStudents(stuList);
      if (Array.isArray(parts)) setParticipants(parts.filter((p: any) => activeIds.has(p.quizId)));
      if (Array.isArray(viols)) {
        const validViols = viols.filter((v: any) => activeIds.has(v.quizId));
        setViolations(validViols);
        prevViolationCountRef.current = validViols.length;
      }

      if (sb.length > 0 && !quizForm.subjectName) {
        setQuizForm((prev) => ({ ...prev, subjectName: sb[0].name }));
      }
    } catch (err) {
      console.error('Failed to load teacher dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Real-time polling untuk kuis, peserta masuk & pelanggaran ujian saat guru di tab kuis
  useEffect(() => {
    if (activeTab !== 'quizzes') return;
    const interval = setInterval(async () => {
      try {
        const [viols, qz, parts, att] = await Promise.all([
          api.getQuizViolations(),
          api.getQuizzes(),
          api.getQuizParticipants(),
          api.getQuizAttempts(),
        ]);
        const activeIds = new Set((qz || []).map((q: any) => q.id));
        if (Array.isArray(qz)) setQuizzes(qz);
        if (Array.isArray(parts)) setParticipants(parts.filter((p: any) => activeIds.has(p.quizId)));
        if (Array.isArray(att)) setAttempts(att.filter((a: any) => activeIds.has(a.quizId)));
        if (Array.isArray(viols)) {
          const validViols = viols.filter((v: any) => activeIds.has(v.quizId));
          if (validViols.length > prevViolationCountRef.current && prevViolationCountRef.current > 0) {
            const newest = validViols[0];
            setLatestViolationAlert(newest);
            playQuizExitAlertSound();
          }
          prevViolationCountRef.current = validViols.length;
          setViolations(validViols);
        }
      } catch (_) {}
    }, 4000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // When selected class or date changes, load class attendance
  useEffect(() => {
    const fetchClassAttendance = async () => {
      try {
        const records = await api.getClassAttendance({
          date: attendanceDate,
          kelas: selectedKelas,
        });
        setExistingAttendance(records);

        // Prepopulate attendance map
        const newMap: Record<
          string,
          { status: 'hadir' | 'izin' | 'sakit' | 'alpa'; notes: string }
        > = {};
        records.forEach((rec: ClassAttendanceEntry) => {
          newMap[rec.studentId] = {
            status: rec.status.toLowerCase() as 'hadir' | 'izin' | 'sakit' | 'alpa',
            notes: rec.notes || '',
          };
        });
        setAttendanceMap(newMap);
      } catch (err) {
        console.error('Failed to load class attendance:', err);
      }
    };

    fetchClassAttendance();
  }, [selectedKelas, attendanceDate]);

  // ===================== QUIZ HANDLERS =====================
  const handleGenerateToken = async () => {
    try {
      const res = await api.generateQuizToken('');
      setQuizForm((prev) => ({ ...prev, token: res.token }));
    } catch (err) {
      const randomToken = `TVQ-${Math.floor(1000 + Math.random() * 9000)}`;
      setQuizForm((prev) => ({ ...prev, token: randomToken }));
    }
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const addQuizQuestion = () => {
    setQuizForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: `q_guru_${Date.now()}_${prev.questions.length + 1}`,
          question: '',
          options: ['', '', '', ''],
          correctOptionIndex: 0,
          explanation: '',
        },
      ],
    }));
  };

  const removeQuizQuestion = (index: number) => {
    if (quizForm.questions.length <= 1) return;
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleToggleQuizStatus = async (quiz: Quiz) => {
    try {
      const newStatus = !quiz.isActive;
      await api.updateQuiz(quiz.id, {
        isActive: newStatus,
        status: newStatus ? 'active' : 'inactive',
      });
      setQuizzes((prev) =>
        prev.map((q) =>
          q.id === quiz.id
            ? { ...q, isActive: newStatus, status: newStatus ? 'active' : 'inactive' }
            : q
        )
      );
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status kuis.');
    }
  };

  const handleDeleteQuiz = (quizOrId: Quiz | string) => {
    if (typeof quizOrId === 'object' && quizOrId !== null) {
      setQuizToDelete(quizOrId);
      return;
    }
    const target = quizzes.find((q) => q.id === quizOrId);
    if (target) {
      setQuizToDelete(target);
      return;
    }
    confirmExecuteDelete(quizOrId);
  };

  const confirmExecuteDelete = async (id: string) => {
    setQuizToDelete(null);
    try {
      await api.deleteQuiz(id);
      // Hapus kuis dari daftar
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
      // Hapus seluruh pelanggaran kuis terkait secara instan
      setViolations((prev) => prev.filter((v) => v.quizId !== id));
      // Hapus seluruh peserta dan attempt kuis terkait secara instan
      setParticipants((prev) => prev.filter((p) => p.quizId !== id));
      setAttempts((prev) => prev.filter((a) => a.quizId !== id));
      // Bersihkan alert jika berasal dari kuis ini
      setLatestViolationAlert((prev) => (prev?.quizId === id ? null : prev));
      prevViolationCountRef.current = 0;
      if (selectedQuizForDetails?.id === id) {
        setSelectedQuizForDetails(null);
      }
      setGlobalSuccess('Quiz dan seluruh data pelanggaran berhasil dihapus permanen.');
      setTimeout(() => setGlobalSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus quiz.');
    }
  };

  const handleClearAllViolations = async () => {
    try {
      await api.clearQuizViolations();
      setViolations([]);
      setLatestViolationAlert(null);
      prevViolationCountRef.current = 0;
      setGlobalSuccess('Seluruh riwayat pelanggaran telah dibersihkan.');
      setTimeout(() => setGlobalSuccess(null), 3000);
    } catch (_) {
      setViolations([]);
    }
  };

  const handleDeleteSingleViolation = async (violationId: string) => {
    try {
      await api.deleteQuizViolation(violationId);
      setViolations((prev) => prev.filter((v) => v.id !== violationId));
      setLatestViolationAlert((prev) => (prev?.id === violationId ? null : prev));
      prevViolationCountRef.current = Math.max(0, prevViolationCountRef.current - 1);
    } catch (_) {
      setViolations((prev) => prev.filter((v) => v.id !== violationId));
    }
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizForm.title.trim()) {
      alert('Judul quiz wajib diisi.');
      return;
    }

    if (quizForm.sourceType === 'google_forms' && !quizForm.externalUrl.trim()) {
      alert('Tautan Google Forms wajib diisi.');
      return;
    }

    setCreatingLoading(true);
    try {
      const payload: Partial<Quiz> = {
        title: quizForm.title,
        subjectName: quizForm.subjectName,
        subjectId: subjects.find((s) => s.name === quizForm.subjectName)?.id || 'sub_general',
        description: quizForm.description,
        durationMinutes: Number(quizForm.durationMinutes),
        passingScore: Number(quizForm.passingScore),
        token: quizForm.token || `TVQ-${Math.floor(1000 + Math.random() * 9000)}`,
        sourceType: quizForm.sourceType,
        externalUrl: quizForm.externalUrl,
        password: quizForm.password,
        scheduleStart: quizForm.scheduleStart,
        scheduleEnd: quizForm.scheduleEnd,
        questions: quizForm.sourceType === 'interactive' ? quizForm.questions : [],
        isActive: true,
        status: 'active',
      };

      const created = await api.createQuiz(payload);
      setShowCreateModal(false);
      await loadData();
      alert(`Quiz "${created.title}" berhasil diterbitkan ke Cloud!\n\nTOKEN UJIAN SISWA: ${created.token}\n\nToken ini aktif secara Real-Time dan dapat langsung dimasukkan oleh siswa di Web maupun Aplikasi Android.`);
    } catch (err: any) {
      alert(err.message || 'Gagal membuat quiz baru.');
    } finally {
      setCreatingLoading(false);
    }
  };

  // ===================== ARTICLE HANDLERS =====================
  const openCreateArticle = () => {
    setEditingArticleId(null);
    setArticleForm({
      title: '',
      category: 'Artikel Guru',
      summary: '',
      content: '',
      coverImage: '',
      tags: '',
      isPublished: true,
    });
    setShowArticleModal(true);
  };

  const openEditArticle = (art: TeacherArticle) => {
    setEditingArticleId(art.id);
    setArticleForm({
      title: art.title,
      category: art.category,
      summary: art.summary,
      content: art.content,
      coverImage: art.coverUrl || '',
      tags: '',
      isPublished: art.isPublished,
    });
    setShowArticleModal(true);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleForm.title.trim() || !articleForm.content.trim()) {
      setGlobalError('Judul dan isi artikel wajib diisi.');
      return;
    }

    setArticleSaving(true);
    try {
      const tagArray = articleForm.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      if (editingArticleId) {
        await api.updateArticle(editingArticleId, {
          title: articleForm.title,
          category: articleForm.category,
          summary: articleForm.summary || articleForm.content.slice(0, 140) + '...',
          content: articleForm.content,
          coverImage: articleForm.coverImage,
          tags: tagArray,
          isPublished: articleForm.isPublished,
        });
        setGlobalSuccess('Artikel berhasil diperbarui!');
      } else {
        await api.createArticle({
          title: articleForm.title,
          category: articleForm.category,
          summary: articleForm.summary || articleForm.content.slice(0, 140) + '...',
          content: articleForm.content,
          authorId: user?.id || 'guru_auth',
          authorName: user?.name || 'Guru Pengampu',
          authorRole: 'Guru',
          coverImage: articleForm.coverImage,
          tags: tagArray,
          isPublished: articleForm.isPublished,
        });
        setGlobalSuccess('Artikel berhasil dibuat dan diterbitkan!');
      }

      setShowArticleModal(false);
      const updatedList = await api.getArticles();
      setArticles(updatedList);
      setTimeout(() => setGlobalSuccess(null), 4000);
    } catch (err: any) {
      setGlobalError(err.message || 'Gagal menyimpan artikel.');
      setTimeout(() => setGlobalError(null), 4000);
    } finally {
      setArticleSaving(false);
    }
  };

  const handleTogglePublishArticle = async (art: TeacherArticle) => {
    try {
      const nextPublished = !art.isPublished;
      await api.updateArticle(art.id, { isPublished: nextPublished });
      setArticles((prev) =>
        prev.map((a) => (a.id === art.id ? { ...a, isPublished: nextPublished } : a))
      );
      setGlobalSuccess(
        `Artikel "${art.title}" berhasil diubah menjadi ${nextPublished ? 'Terbit ke Siswa' : 'Draf'}.`
      );
      setTimeout(() => setGlobalSuccess(null), 3000);
    } catch (err: any) {
      setGlobalError(err.message || 'Gagal mengubah status terbit.');
      setTimeout(() => setGlobalError(null), 3000);
    }
  };

  const handleDeleteArticle = async (id: string, title: string) => {
    if (!confirm(`Hapus artikel "${title}"?`)) return;
    try {
      await api.deleteArticle(id);
      setArticles((prev) => prev.filter((a) => a.id !== id));
      setGlobalSuccess(`Artikel "${title}" telah dihapus.`);
      setTimeout(() => setGlobalSuccess(null), 3000);
    } catch (err: any) {
      setGlobalError(err.message || 'Gagal menghapus artikel.');
      setTimeout(() => setGlobalError(null), 3000);
    }
  };

  // ===================== ATTENDANCE HANDLERS =====================
  // Filter students by selected class (mendukung tingkat 1 - 9 serta rombel spesifik)
  const classStudents = allStudents.filter(
    (stu) => {
      if (stu.isAlumni) return false;
      return isStudentInSelectedClass(stu.kelas || '', selectedKelas);
    }
  );

  const handleSetStudentStatus = (studentId: string, status: 'hadir' | 'izin' | 'sakit' | 'alpa') => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        status,
        notes: prev[studentId]?.notes || '',
      },
    }));
  };

  const handleSetStudentNotes = (studentId: string, notes: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status || 'hadir',
        notes,
      },
    }));
  };

  const handleSaveClassAttendance = async () => {
    if (classStudents.length === 0) {
      alert('Tidak ada siswa di kelas ini.');
      return;
    }

    setAttendanceSaving(true);
    try {
      const entries: Partial<ClassAttendanceEntry>[] = classStudents.map((stu) => {
        const state = attendanceMap[stu.id] || { status: 'hadir', notes: '' };
        return {
          studentId: stu.id,
          studentName: stu.name,
          studentKelas: selectedKelas,
          date: attendanceDate,
          status: (state.status.charAt(0).toUpperCase() + state.status.slice(1)) as ClassAttendanceStatus,
          notes: state.notes,
          recordedBy: user?.name || 'Guru Pengampu',
          recordedRole: 'Guru',
        };
      });

      await api.recordClassAttendance(entries);

      // Otomatis ke-backup di aplikasi (Local storage + Cloud)
      try {
        const backupKey = `tamvesta_backup_attendance_${selectedKelas}_${attendanceDate}`;
        localStorage.setItem(backupKey, JSON.stringify({
          kelas: selectedKelas,
          date: attendanceDate,
          entries,
          attachedFile: attachedAttendanceFile,
          savedAt: new Date().toISOString(),
          savedBy: user?.name || 'Guru Pengampu',
        }));
      } catch (_) {}

      const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      setLastBackupTime(timeStr);
      setAttendanceSuccess(`Absensi kelas ${selectedKelas} (${entries.length} siswa) berhasil disimpan!`);
      setAutoBackupMessage(`✓ Otomatis ter-backup di aplikasi TAMVESTA (${timeStr} WIB)`);
      setTimeout(() => setAutoBackupMessage(null), 6000);
      setTimeout(() => setAttendanceSuccess(null), 4000);
    } catch (err: any) {
      setGlobalError(err.message || 'Gagal menyimpan absensi kelas.');
      setTimeout(() => setGlobalError(null), 4000);
    } finally {
      setAttendanceSaving(false);
    }
  };

  // Handle Upload / Lampiran File Absensi Fisik (Foto / Dokumen)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert('Ukuran file maksimal 20MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const fileData = {
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        dataUrl: reader.result as string,
        uploadedAt: new Date().toISOString(),
      };
      setAttachedAttendanceFile(fileData);
      try {
        localStorage.setItem(
          `tamvesta_attendance_file_${selectedKelas}_${attendanceDate}`,
          JSON.stringify(fileData)
        );
      } catch (_) {}
      setAutoBackupMessage(`File absensi "${file.name}" berhasil dilampirkan & otomatis ter-backup di aplikasi.`);
      setTimeout(() => setAutoBackupMessage(null), 6000);
    };
    reader.readAsDataURL(file);
  };

  // Unduh File Absensi Excel (.xlsx)
  const handleExportAttendanceExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const stats = {
        hadir: classStudents.filter((s) => (attendanceMap[s.id]?.status || 'hadir') === 'hadir').length,
        izin: classStudents.filter((s) => attendanceMap[s.id]?.status === 'izin').length,
        sakit: classStudents.filter((s) => attendanceMap[s.id]?.status === 'sakit').length,
        alpa: classStudents.filter((s) => attendanceMap[s.id]?.status === 'alpa').length,
      };

      // Sheet 1: Rincian Siswa
      const rows = classStudents.map((s, idx) => {
        const cur = attendanceMap[s.id] || { status: 'hadir', notes: '' };
        return {
          'No': idx + 1,
          'Nama Siswa': s.name,
          'Username': s.username,
          'NISN': s.nisn || '-',
          'Kelas': s.kelas || selectedKelas,
          'Status Kehadiran': cur.status.toUpperCase(),
          'Keterangan': cur.notes || '-',
          'Tanggal': attendanceDate,
        };
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Daftar Presensi');

      // Sheet 2: Ringkasan
      const summaryRows = [
        { 'Parameter': 'Lembaga', 'Nilai': 'Perguruan Tamansiswa Batam' },
        { 'Parameter': 'Kelas', 'Nilai': selectedKelas },
        { 'Parameter': 'Tanggal Absensi', 'Nilai': attendanceDate },
        { 'Parameter': 'Guru Pengampu', 'Nilai': user?.name || 'Guru' },
        { 'Parameter': 'Total Siswa', 'Nilai': classStudents.length },
        { 'Parameter': 'Jumlah Hadir', 'Nilai': stats.hadir },
        { 'Parameter': 'Jumlah Izin', 'Nilai': stats.izin },
        { 'Parameter': 'Jumlah Sakit', 'Nilai': stats.sakit },
        { 'Parameter': 'Jumlah Alpa', 'Nilai': stats.alpa },
        { 'Parameter': 'Status Backup', 'Nilai': 'Tersimpan & Terarsip Otomatis di TAMVESTA' },
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Kelas');

      XLSX.writeFile(wb, `File_Absen_${selectedKelas.replace(/\s+/g, '_')}_${attendanceDate}.xlsx`);
    } catch (err: any) {
      alert('Gagal mengekspor Excel: ' + err.message);
    }
  };

  // Unduh File Absensi Word (.doc)
  const handleExportAttendanceWord = () => {
    try {
      const stats = {
        hadir: classStudents.filter((s) => (attendanceMap[s.id]?.status || 'hadir') === 'hadir').length,
        izin: classStudents.filter((s) => attendanceMap[s.id]?.status === 'izin').length,
        sakit: classStudents.filter((s) => attendanceMap[s.id]?.status === 'sakit').length,
        alpa: classStudents.filter((s) => attendanceMap[s.id]?.status === 'alpa').length,
      };

      const tableRows = classStudents
        .map((s, idx) => {
          const cur = attendanceMap[s.id] || { status: 'hadir', notes: '' };
          return `<tr>
            <td style="text-align:center;">${idx + 1}</td>
            <td><strong>${s.name}</strong></td>
            <td>${s.nisn || '-'}</td>
            <td>${s.kelas || selectedKelas}</td>
            <td style="text-align:center; font-weight:bold;">${cur.status.toUpperCase()}</td>
            <td>${cur.notes || '-'}</td>
          </tr>`;
        })
        .join('');

      const docHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Daftar Hadir Siswa - ${selectedKelas}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.4; }
          .kop { text-align: center; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 16px; }
          .kop h2 { margin: 0; font-size: 15pt; }
          .kop p { margin: 2px 0; font-size: 9pt; }
          .title { text-align: center; font-size: 13pt; font-weight: bold; text-decoration: underline; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10pt; }
          th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .sign { width: 100%; margin-top: 30px; }
          .sign td { border: none; text-align: center; }
        </style>
      </head>
      <body>
        <div class="kop">
          <h2>YAYASAN PERGURUAN TAMANSISWA BATAM</h2>
          <p>Daftar Presensi & Kehadiran Peserta Didik — TAMVESTA</p>
          <p>Periode Tanggal: ${attendanceDate} | Kelas: ${selectedKelas}</p>
        </div>
        <div class="title">LEMBAR PRESENSI KEHADIRAN KELAS</div>
        <p><strong>Total Siswa:</strong> ${classStudents.length} | <strong>Hadir:</strong> ${stats.hadir} | <strong>Izin:</strong> ${stats.izin} | <strong>Sakit:</strong> ${stats.sakit} | <strong>Alpa:</strong> ${stats.alpa}</p>
        <table>
          <thead>
            <tr>
              <th style="width: 30px; text-align:center;">No</th>
              <th>Nama Siswa</th>
              <th style="width: 90px;">NISN</th>
              <th style="width: 80px;">Kelas</th>
              <th style="width: 80px; text-align:center;">Status</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <table class="sign">
          <tr>
            <td>
              <p>Mengetahui,</p>
              <p><strong>Kepala Sekolah</strong></p>
              <div style="height: 50px;"></div>
              <p><u>( ......................................... )</u></p>
            </td>
            <td>
              <p>Batam, ${attendanceDate}</p>
              <p><strong>Guru Pengampu Mata Pelajaran</strong></p>
              <div style="height: 50px;"></div>
              <p><u>( ${user?.name || 'Guru Pengampu'} )</u></p>
            </td>
          </tr>
        </table>
      </body>
      </html>`;

      const blob = new Blob(['\ufeff' + docHtml], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `File_Absen_${selectedKelas.replace(/\s+/g, '_')}_${attendanceDate}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Gagal mengekspor Word: ' + err.message);
    }
  };

  const handleMarkAllHadir = () => {
    const updated = { ...attendanceMap };
    classStudents.forEach((s) => {
      updated[s.id] = {
        status: 'hadir',
        notes: updated[s.id]?.notes || '',
      };
    });
    setAttendanceMap(updated);
  };

  // Filtered lists
  const filteredArticles = articles.filter((art) => {
    const matchesCat =
      articleCategoryFilter === 'semua' || art.category === articleCategoryFilter;
    const matchesSearch =
      art.title.toLowerCase().includes(articleSearch.toLowerCase()) ||
      art.summary.toLowerCase().includes(articleSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const validQuizIds = React.useMemo(() => new Set(quizzes.map((q) => q.id)), [quizzes]);

  const visibleViolations = React.useMemo(
    () => violations.filter((v) => validQuizIds.has(v.quizId)),
    [violations, validQuizIds]
  );

  const visibleParticipants = React.useMemo(
    () => participants.filter((p) => validQuizIds.has(p.quizId)),
    [participants, validQuizIds]
  );

  const visibleAttempts = React.useMemo(
    () => attempts.filter((a) => validQuizIds.has(a.quizId)),
    [attempts, validQuizIds]
  );

  const filteredAttempts = visibleAttempts.filter((att) => {
    const matchesSearch =
      att.studentName.toLowerCase().includes(searchAttempt.toLowerCase()) ||
      att.username.toLowerCase().includes(searchAttempt.toLowerCase()) ||
      att.quizTitle.toLowerCase().includes(searchAttempt.toLowerCase());
    const matchesQuiz = selectedQuizFilter === 'all' || att.quizId === selectedQuizFilter;
    return matchesSearch && matchesQuiz;
  });

  const filteredParticipants = visibleParticipants.filter((p) => {
    const matchesSearch =
      p.studentName.toLowerCase().includes(searchAttempt.toLowerCase()) ||
      (p.studentUsername && p.studentUsername.toLowerCase().includes(searchAttempt.toLowerCase())) ||
      (p.studentKelas && p.studentKelas.toLowerCase().includes(searchAttempt.toLowerCase())) ||
      p.quizTitle.toLowerCase().includes(searchAttempt.toLowerCase()) ||
      p.tokenUsed.toLowerCase().includes(searchAttempt.toLowerCase());
    const matchesQuiz = selectedQuizFilter === 'all' || p.quizId === selectedQuizFilter;
    return matchesSearch && matchesQuiz;
  });

  const filteredViolations = visibleViolations.filter((v) => {
    const matchesSearch =
      v.studentName.toLowerCase().includes(searchAttempt.toLowerCase()) ||
      (v.studentUsername && v.studentUsername.toLowerCase().includes(searchAttempt.toLowerCase())) ||
      v.quizTitle.toLowerCase().includes(searchAttempt.toLowerCase()) ||
      v.violationDetail.toLowerCase().includes(searchAttempt.toLowerCase());
    const matchesQuiz = selectedQuizFilter === 'all' || v.quizId === selectedQuizFilter;
    return matchesSearch && matchesQuiz;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner Portal Guru */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold tracking-wide">
              PORTAL GURU RESMI
            </span>
            <span className="text-xs text-slate-400">TAMANSISWA BATAM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">Dashboard Terpadu Guru & Pendidik</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Kelola artikel guru & metode pembelajaran untuk siswa, catat absensi kelas dengan QR scan, serta manajemen kuis dan token evaluasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {activeTab === 'articles' && (
            <button
              onClick={openCreateArticle}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tulis Artikel Baru</span>
            </button>
          )}

          {activeTab === 'quizzes' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefreshQuizData}
                disabled={isRefreshingQuiz}
                className="flex items-center gap-2 px-4 py-3 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-400/30 rounded-2xl font-bold text-xs sm:text-sm transition active:scale-95 cursor-pointer"
                title="Segarkan data peserta kuis & pelanggaran"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshingQuiz ? 'animate-spin text-blue-300' : ''}`} />
                <span className="hidden sm:inline">{isRefreshingQuiz ? 'Menyegarkan...' : 'Segarkan Data'}</span>
              </button>
              <button
                onClick={() => {
                  handleGenerateToken();
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Buat Quiz & Token Baru</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setActiveTab('quizzes');
                handleGenerateToken();
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-2xl font-bold text-xs sm:text-sm transition active:scale-95"
            >
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span>+ Buat Quiz</span>
            </button>
          )}

          <button
            onClick={onOpenScanner}
            className="flex items-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl font-bold text-xs shadow-md transition"
          >
            <ScanLine className="w-4 h-4 text-emerald-400" />
            <span>Scan QR Absensi</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 text-xs sm:text-sm font-bold">
        <button
          onClick={() => setActiveTab('articles')}
          className={`py-3 px-4 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'articles'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Artikel Guru & Metode Pembelajaran ({articles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`py-3 px-4 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'attendance'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Absensi & Presensi Kelas</span>
        </button>

        <button
          onClick={() => setActiveTab('quizzes')}
          className={`py-3 px-4 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'quizzes'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Manajemen Quiz & Token ({quizzes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('lost_found')}
          className={`py-3 px-4 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'lost_found'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4 text-amber-600" />
          <span>Barang Hilang & Ditemukan</span>
        </button>
      </div>

      {/* Alert Notifications */}
      {globalSuccess && (
        <div className="flex items-center justify-between gap-2 p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{globalSuccess}</span>
          </div>
          <button onClick={() => setGlobalSuccess(null)} className="text-emerald-600 hover:text-emerald-900">
            ✕
          </button>
        </div>
      )}

      {globalError && (
        <div className="flex items-center justify-between gap-2 p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-2xl text-xs font-bold animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{globalError}</span>
          </div>
          <button onClick={() => setGlobalError(null)} className="text-rose-600 hover:text-rose-900">
            ✕
          </button>
        </div>
      )}

      {/* ===================== TAB 1: ARTIKEL GURU & METODE PEMBELAJARAN ===================== */}
      {activeTab === 'articles' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-700" />
                  <span>Karya Tulis & Metode Pembelajaran Guru</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Buat materi edukasi dan metode ajar yang langsung diterbitkan ke tab Artikel Dashboard Siswa
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-60">
                  <input
                    type="text"
                    value={articleSearch}
                    onChange={(e) => setArticleSearch(e.target.value)}
                    placeholder="Cari judul atau ringkasan..."
                    className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>

                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setArticleCategoryFilter('semua')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      articleCategoryFilter === 'semua'
                        ? 'bg-white text-indigo-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setArticleCategoryFilter('Artikel Guru')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      articleCategoryFilter === 'Artikel Guru'
                        ? 'bg-white text-indigo-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Artikel Guru
                  </button>
                  <button
                    onClick={() => setArticleCategoryFilter('Metode Pembelajaran')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      articleCategoryFilter === 'Metode Pembelajaran'
                        ? 'bg-white text-indigo-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Metode Pembelajaran
                  </button>
                </div>
              </div>
            </div>

            {filteredArticles.length === 0 ? (
              <div className="p-12 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-700 text-sm">Belum Ada Artikel</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Tulis artikel guru atau metode pembelajaran perdana Anda untuk dibagikan ke siswa Tamansiswa Batam.
                </p>
                <button
                  onClick={openCreateArticle}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  + Tulis Artikel Baru
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredArticles.map((art) => (
                  <div
                    key={art.id}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    {art.coverUrl && (
                      <div className="h-36 w-full overflow-hidden bg-slate-100">
                        <img
                          src={art.coverUrl}
                          alt={art.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              art.category === 'Metode Pembelajaran'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {art.category}
                          </span>

                          <button
                            onClick={() => handleTogglePublishArticle(art)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border transition ${
                              art.isPublished
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                            }`}
                            title="Klik untuk menerbitkan atau menarik draf"
                          >
                            {art.isPublished ? '● TERBIT KE SISWA' : '○ DRAF (SEMBUNYI)'}
                          </button>
                        </div>

                        <h3 className="font-black text-slate-900 text-sm leading-snug line-clamp-2">
                          {art.title}
                        </h3>

                        <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                          {art.summary}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {new Date(art.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setPreviewArticle(art)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                            title="Lihat Pratinjau"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditArticle(art)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Edit Artikel"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteArticle(art.id, art.title)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus Artikel"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB 2: ABSENSI & PRESENSI KELAS ===================== */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            {/* Header filter kelas, file absen & tanggal */}
            <div className="space-y-4 border-b border-slate-100 pb-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-indigo-700" />
                    <span>Pencatatan Presensi & Absensi Siswa Per Kelas</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Pilih tingkat / kelas (Kelas 1 s/d 9 SD & SMP), lampirkan file absen, ekspor berkas, dan otomatis ter-backup di aplikasi.
                  </p>
                </div>

                {/* Auto-backup status pill */}
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Otomatis Ter-backup di Aplikasi</span>
                  </span>
                </div>
              </div>

              {/* Class Selector, Date & File Actions Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Pilih Tingkat / Kelas (Kelas 1 - 9)
                    </label>
                    <select
                      value={selectedKelas}
                      onChange={(e) => setSelectedKelas(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                    >
                      <optgroup label="🏫 Tingkat SD (Sekolah Dasar) — Kelas 1 s/d 6">
                        <option value="Kelas 1">Kelas 1 SD (Semua Rombel / I-A)</option>
                        <option value="I-A SD">Kelas 1-A SD (I-A)</option>
                        <option value="Kelas 2">Kelas 2 SD (Semua Rombel / II-A)</option>
                        <option value="II-A SD">Kelas 2-A SD (II-A)</option>
                        <option value="Kelas 3">Kelas 3 SD (Semua Rombel / III-A)</option>
                        <option value="III-A SD">Kelas 3-A SD (III-A)</option>
                        <option value="Kelas 4">Kelas 4 SD (Semua Rombel / IV-A)</option>
                        <option value="IV-A SD">Kelas 4-A SD (IV-A)</option>
                        <option value="Kelas 5">Kelas 5 SD (Semua Rombel / V-A)</option>
                        <option value="V-A SD">Kelas 5-A SD (V-A)</option>
                        <option value="Kelas 6">Kelas 6 SD (Semua Rombel / VI-A)</option>
                        <option value="VI-A SD">Kelas 6-A SD (VI-A)</option>
                      </optgroup>
                      <optgroup label="🏫 Tingkat SMP (Sekolah Menengah Pertama) — Kelas 7 s/d 9">
                        <option value="Kelas 7">Kelas 7 SMP (Semua Rombel VII-A & VII-B)</option>
                        <option value="VII-A SMP">Kelas 7-A SMP (VII-A)</option>
                        <option value="VII-B SMP">Kelas 7-B SMP (VII-B)</option>
                        <option value="Kelas 8">Kelas 8 SMP (Semua Rombel VIII-A & VIII-B)</option>
                        <option value="VIII-A SMP">Kelas 8-A SMP (VIII-A)</option>
                        <option value="VIII-B SMP">Kelas 8-B SMP (VIII-B)</option>
                        <option value="Kelas 9">Kelas 9 SMP (Semua Rombel IX-A & IX-B)</option>
                        <option value="IX-A SMP">Kelas 9-A SMP (IX-A)</option>
                        <option value="IX-B SMP">Kelas 9-B SMP (IX-B)</option>
                      </optgroup>
                      {classList.filter(
                        (k) =>
                          !['kelas 1', 'kelas 2', 'kelas 3', 'kelas 4', 'kelas 5', 'kelas 6', 'kelas 7', 'kelas 8', 'kelas 9',
                            'kelas 1 sd', 'kelas 2 sd', 'kelas 3 sd', 'kelas 4 sd', 'kelas 5 sd', 'kelas 6 sd',
                            'kelas 7 smp', 'kelas 8 smp', 'kelas 9 smp',
                            'i-a sd', 'ii-a sd', 'iii-a sd', 'iv-a sd', 'v-a sd', 'vi-a sd',
                            'vii-a smp', 'vii-b smp', 'viii-a smp', 'viii-b smp', 'ix-a smp', 'ix-b smp'
                          ].includes(k.trim().toLowerCase())
                      ).length > 0 && (
                        <optgroup label="Kelas Lainnya / Tambahan">
                          {classList
                            .filter(
                              (k) =>
                                !['kelas 1', 'kelas 2', 'kelas 3', 'kelas 4', 'kelas 5', 'kelas 6', 'kelas 7', 'kelas 8', 'kelas 9',
                                  'kelas 1 sd', 'kelas 2 sd', 'kelas 3 sd', 'kelas 4 sd', 'kelas 5 sd', 'kelas 6 sd',
                                  'kelas 7 smp', 'kelas 8 smp', 'kelas 9 smp',
                                  'i-a sd', 'ii-a sd', 'iii-a sd', 'iv-a sd', 'v-a sd', 'vi-a sd',
                                  'vii-a smp', 'vii-b smp', 'viii-a smp', 'viii-b smp', 'ix-a smp', 'ix-b smp'
                                ].includes(k.trim().toLowerCase())
                            )
                            .map((kls) => (
                              <option key={kls} value={kls}>{kls}</option>
                            ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Tanggal Presensi
                    </label>
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                    />
                  </div>

                  {/* Tambah Kelas Kustom Modal Trigger */}
                  <div className="pt-4">
                    {showAddCustomClass ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="Nama kelas baru..."
                          value={customKelasInput}
                          onChange={(e) => setCustomKelasInput(e.target.value)}
                          className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-bold w-36"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (customKelasInput.trim()) {
                              setSelectedKelas(customKelasInput.trim());
                              setCustomKelasInput('');
                              setShowAddCustomClass(false);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                        >
                          Pilih
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddCustomClass(false)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAddCustomClass(true)}
                        className="px-2.5 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-[11px] font-bold transition shadow-2xs flex items-center gap-1"
                        title="Ketik nama kelas custom jika tidak ada di daftar"
                      >
                        <Plus className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Kelas Lain</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* File Absen & Quick Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
                  <button
                    type="button"
                    onClick={handleRefreshAttendanceStudents}
                    disabled={refreshingStudents}
                    title="Segarkan data akun siswa dari server / device lain"
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${refreshingStudents ? 'animate-spin' : ''}`} />
                    <span>{refreshingStudents ? 'Menyinkronkan...' : 'Segarkan Data Siswa'}</span>
                  </button>

                  <button
                    onClick={handleMarkAllHadir}
                    className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-2xs"
                  >
                    Set Semua Hadir
                  </button>

                  <button
                    onClick={onOpenScanner}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95"
                  >
                    <ScanLine className="w-4 h-4 text-amber-300" />
                    <span>Scan QR Siswa</span>
                  </button>

                  {/* Unduh Excel (.xlsx) */}
                  <button
                    onClick={handleExportAttendanceExcel}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                    title="Unduh File Absensi Excel (.xlsx)"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>File Excel</span>
                  </button>

                  {/* Unduh Word (.doc) */}
                  <button
                    onClick={handleExportAttendanceWord}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                    title="Unduh Lembar Absensi Word (.doc)"
                  >
                    <FileText className="w-4 h-4" />
                    <span>File Word</span>
                  </button>

                  {/* Upload File Absen Fisik */}
                  <label className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95">
                    <Paperclip className="w-4 h-4" />
                    <span>Lampirkan File</span>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx"
                    />
                  </label>
                </div>
              </div>

              {/* Attached file banner if any */}
              {attachedAttendanceFile && (
                <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-amber-700 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800">File Absen Terlampir: {attachedAttendanceFile.name}</p>
                      <p className="text-[10px] text-slate-500">Ukuran: {attachedAttendanceFile.size} • Otomatis tersimpan di backup aplikasi</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={attachedAttendanceFile.dataUrl}
                      download={attachedAttendanceFile.name}
                      className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 shadow-2xs"
                    >
                      <Download className="w-3 h-3" />
                      <span>Unduh File</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachedAttendanceFile(null);
                        try {
                          localStorage.removeItem(`tamvesta_attendance_file_${selectedKelas}_${attendanceDate}`);
                        } catch (_) {}
                      }}
                      className="p-1 hover:bg-amber-200 text-amber-800 rounded-lg text-[11px]"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Auto Backup Notification */}
              {autoBackupMessage && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{autoBackupMessage}</span>
                </div>
              )}
            </div>

            {/* Attendance Success Notification */}
            {attendanceSuccess && (
              <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{attendanceSuccess}</span>
              </div>
            )}

            {/* Table of students */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 w-12 text-center">No</th>
                    <th className="p-3.5">Nama Lengkap Siswa</th>
                    <th className="p-3.5">NISN / Kelas</th>
                    <th className="p-3.5 text-center">Status Kehadiran</th>
                    <th className="p-3.5">Keterangan / Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        Tidak ada siswa yang terdaftar di kelas <strong>{selectedKelas}</strong>. Silakan pilih kelas lain.
                      </td>
                    </tr>
                  ) : (
                    classStudents.map((stu, idx) => {
                      const cur = attendanceMap[stu.id] || { status: 'hadir', notes: '' };

                      return (
                        <tr key={stu.id} className="hover:bg-slate-50/70 transition">
                          <td className="p-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              {/* QR Code preview trigger button beside student name */}
                              <button
                                type="button"
                                onClick={() => setSelectedStudentForQr(stu)}
                                title={`Tampilkan QR Code Absensi ${stu.name}`}
                                className="p-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition group flex items-center gap-1 shrink-0 active:scale-95 shadow-2xs"
                              >
                                <QrCode className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold hidden sm:inline">QR</span>
                              </button>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate">{stu.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono truncate">@{stu.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 text-slate-700">
                            <div>{stu.kelas || selectedKelas}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{stu.nisn || '-'}</div>
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1">
                              <button
                                onClick={() => handleSetStudentStatus(stu.id, 'hadir')}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition ${
                                  cur.status === 'hadir'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-emerald-700'
                                }`}
                              >
                                Hadir
                              </button>
                              <button
                                onClick={() => handleSetStudentStatus(stu.id, 'izin')}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition ${
                                  cur.status === 'izin'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-blue-700'
                                }`}
                              >
                                Izin
                              </button>
                              <button
                                onClick={() => handleSetStudentStatus(stu.id, 'sakit')}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition ${
                                  cur.status === 'sakit'
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-amber-700'
                                }`}
                              >
                                Sakit
                              </button>
                              <button
                                onClick={() => handleSetStudentStatus(stu.id, 'alpa')}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition ${
                                  cur.status === 'alpa'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-rose-700'
                                }`}
                              >
                                Alpa
                              </button>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <input
                              type="text"
                              value={cur.notes}
                              onChange={(e) => handleSetStudentNotes(stu.id, e.target.value)}
                              placeholder="Surat dokter / keperluan keluarga..."
                              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom action: save */}
            {classStudents.length > 0 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500">
                  Total: <strong>{classStudents.length} Siswa</strong> di kelas {selectedKelas}
                </span>

                <button
                  onClick={handleSaveClassAttendance}
                  disabled={attendanceSaving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{attendanceSaving ? 'Menyimpan...' : 'Simpan Absensi Kelas'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB 3: MANAJEMEN QUIZ & TOKEN ===================== */}
      {activeTab === 'quizzes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: QUIZ LIST & TOKEN MANAGEMENT (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>Daftar Quiz & Token</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black">
                    {quizzes.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Kelola status kuis, salin token untuk dibagikan ke siswa
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefreshQuizData}
                  disabled={isRefreshingQuiz}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-2xl font-black text-xs transition active:scale-95 cursor-pointer"
                  title="Segarkan siapa saja yang sudah masuk & kuis"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshingQuiz ? 'animate-spin text-blue-600' : ''}`} />
                  <span>{isRefreshingQuiz ? 'Menyegarkan...' : 'Segarkan Data'}</span>
                </button>

                <button
                  onClick={() => {
                    handleGenerateToken();
                    setShowCreateModal(true);
                  }}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Buat Quiz & Token Baru</span>
                </button>
              </div>
            </div>

            {/* ALERT NOTIFIKASI PELANGGARAN TERAKHIR */}
            {latestViolationAlert && validQuizIds.has(latestViolationAlert.quizId) && (
              <div className="bg-rose-600 text-white p-4 rounded-3xl shadow-lg border-2 border-rose-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 rounded-2xl shrink-0">
                    <ShieldAlert className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm">🚨 PERINGATAN: PELANGGARAN SISWA TERDETEKSI!</h4>
                    <p className="text-xs text-rose-100">
                      Siswa <strong className="text-white underline">{latestViolationAlert.studentName}</strong> terdeteksi: <strong>{latestViolationAlert.violationDetail}</strong> pada kuis <em>{latestViolationAlert.quizTitle}</em> ({new Date(latestViolationAlert.timestamp).toLocaleTimeString('id-ID')} WIB).
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    onClick={() => {
                      setQuizSubTab('violations');
                      setLatestViolationAlert(null);
                    }}
                    className="px-3.5 py-1.5 bg-white text-rose-700 font-black rounded-xl text-xs hover:bg-rose-50 cursor-pointer shadow-xs"
                  >
                    Buka Kolom Pelanggaran
                  </button>
                  <button
                    onClick={() => setLatestViolationAlert(null)}
                    className="p-1.5 hover:bg-white/20 rounded-xl cursor-pointer"
                    title="Tutup Notifikasi"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            )}

            {/* LIVE PELANGGARAN UJIAN SISWA (REAL-TIME NOTIFIKASI) */}
            {visibleViolations.length > 0 && (
              <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-5 shadow-sm space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-700 font-black text-sm">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                    </span>
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                    <span>Laporan Pelanggaran Ujian Siswa ({visibleViolations.length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleClearAllViolations}
                      className="text-[10px] font-black bg-rose-100 hover:bg-rose-200 text-rose-800 px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center gap-1 border border-rose-300/80"
                      title="Bersihkan riwayat pelanggaran"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Bersihkan</span>
                    </button>
                    <span className="text-[10px] uppercase font-black bg-rose-200/80 text-rose-800 px-2.5 py-0.5 rounded-full">
                      Real-Time Signal
                    </span>
                  </div>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {visibleViolations.map((v) => (
                    <div
                      key={v.id}
                      className="bg-white p-3.5 rounded-2xl border border-rose-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900 text-xs font-black">{v.studentName}</strong>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 font-bold border border-rose-200">
                            {v.violationDetail}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Kuis: <strong className="text-slate-700">{v.quizTitle}</strong> • {new Date(v.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">
                          Terdeteksi Sistem
                        </span>
                        <button
                          onClick={() => handleDeleteSingleViolation(v.id)}
                          className="p-1 hover:bg-rose-100 text-rose-400 hover:text-rose-700 rounded-lg transition cursor-pointer"
                          title="Hapus laporan ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 font-bold text-xs animate-pulse">
                Memuat data kuis guru...
              </div>
            ) : quizzes.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                  <HelpCircle className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-slate-800 text-base">Belum Ada Quiz yang Dibuat</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Buat kuis pilihan ganda, essay, atau tautan Google Forms dengan token akses untuk murid Anda sekarang.
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => {
                      handleGenerateToken();
                      setShowCreateModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-600/25 transition active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Buat Quiz Pertama Sekarang</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-800 border border-blue-200">
                            {quiz.subjectName}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              quiz.isActive
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {quiz.isActive ? 'AKTIF (DIBUKA)' : 'NONAKTIF (DITUTUP)'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {quiz.sourceType === 'google_forms' ? 'Google Forms' : 'Soal Interaktif'}
                          </span>
                        </div>
                        <h3 className="font-black text-slate-900 text-base">{quiz.title}</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleQuizStatus(quiz)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            quiz.isActive
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                          title="Ubah status akses kuis"
                        >
                          {quiz.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          <span>{quiz.isActive ? 'Tutup Kuis' : 'Buka Kuis'}</span>
                        </button>

                        <button
                          onClick={() => setQuizToDelete(quiz)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition active:scale-95"
                          title="Hapus Kuis Permanen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Token & Access Sharing Box */}
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Token Akses Siswa:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-lg text-blue-900 tracking-wider">
                            {quiz.token}
                          </span>
                          {quiz.password && (
                            <span className="text-[10px] text-slate-500 font-semibold bg-white px-2 py-0.5 rounded border border-slate-200">
                              Password: <strong className="text-slate-700">{quiz.password}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyToken(quiz.token)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                            copiedToken === quiz.token
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs'
                          }`}
                        >
                          {copiedToken === quiz.token ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                              <span>Salin Token</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Details metadata */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-500 pt-1">
                      <div>
                        Durasi: <strong>{quiz.durationMinutes} Menit</strong>
                      </div>
                      <div>
                        KKM / Lulus: <strong>{quiz.passingScore} Poin</strong>
                      </div>
                      <div>
                        Jumlah Soal:{' '}
                        <strong>
                          {quiz.sourceType === 'google_forms' ? 'Google Forms Link' : `${quiz.questions?.length || 0} Butir`}
                        </strong>
                      </div>
                    </div>

                    {quiz.sourceType === 'google_forms' && quiz.externalUrl && (
                      <div className="text-xs text-blue-700 bg-blue-50/60 p-2.5 rounded-xl border border-blue-100 flex items-center justify-between">
                        <span className="truncate max-w-sm">{quiz.externalUrl}</span>
                        <button
                          type="button"
                          onClick={() => setPreviewGoogleFormUrl(quiz.externalUrl || '')}
                          className="text-blue-700 font-bold hover:underline shrink-0 flex items-center gap-1 ml-2 active:scale-95 transition"
                        >
                          <span>Buka di Aplikasi</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: REAL-TIME MONITORING (PESERTA MASUK, KOLOM PELANGGARAN & HASIL NILAI) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>Pusat Monitoring Ujian</span>
                  {visibleViolations.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                      {visibleViolations.length} Pelanggaran
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500">
                  Pantau siapa yang masuk, pelanggaran siswa, & hasil nilai
                </p>
              </div>

              <button
                onClick={handleRefreshQuizData}
                disabled={isRefreshingQuiz}
                className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition shadow-2xs cursor-pointer"
                title="Segarkan Siapa yang Masuk & Pelanggaran"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshingQuiz ? 'animate-spin text-blue-600' : 'text-slate-600'}`} />
              </button>
            </div>

            {/* 3-Tab Selector: Peserta Masuk, Kolom Pelanggaran, Hasil Nilai */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl">
              <button
                onClick={() => setQuizSubTab('participants')}
                className={`py-2 px-1 text-center rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  quizSubTab === 'participants'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                <span>Masuk ({filteredParticipants.length})</span>
              </button>

              <button
                onClick={() => setQuizSubTab('violations')}
                className={`py-2 px-1 text-center rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  quizSubTab === 'violations'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Pelanggaran ({visibleViolations.length})</span>
              </button>

              <button
                onClick={() => setQuizSubTab('attempts')}
                className={`py-2 px-1 text-center rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  quizSubTab === 'attempts'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Nilai ({filteredAttempts.length})</span>
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    value={searchAttempt}
                    onChange={(e) => setSearchAttempt(e.target.value)}
                    placeholder="Cari nama siswa, token, atau kuis..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>

                <select
                  value={selectedQuizFilter}
                  onChange={(e) => setSelectedQuizFilter(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
                >
                  <option value="all">Semua Quiz Terdaftar</option>
                  {quizzes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.title} ({q.token})
                    </option>
                  ))}
                </select>
              </div>

              {/* VIEW 1: SIAPA YANG SUDAH MASUK (PESERTA MASUK) */}
              {quizSubTab === 'participants' && (
                <div>
                  {filteredParticipants.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs italic space-y-2">
                      <HelpCircle className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-bold text-slate-600">Belum ada siswa yang masuk ke kuis ini.</p>
                      <p className="text-[11px] text-slate-400">Bagikan token kuis di sebelah kiri agar siswa dapat mulai mengerjakan.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto space-y-2 pr-1">
                      {filteredParticipants.map((p) => (
                        <div key={p.id} className="pt-2 pb-2.5 flex items-center justify-between gap-3 text-xs">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900">{p.studentName}</p>
                              {p.studentKelas && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                                  {p.studentKelas}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500">
                              Kuis: <strong className="text-slate-700">{p.quizTitle}</strong> • Token: <span className="font-mono text-blue-700 font-bold">{p.tokenUsed}</span>
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Masuk: {new Date(p.enteredAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            {p.status === 'in_progress' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                <span>Mengerjakan</span>
                              </span>
                            ) : (
                              <div className="space-y-0.5">
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-300">
                                  Selesai
                                </span>
                                {typeof p.score === 'number' && (
                                  <div className="text-xs font-black text-slate-800">
                                    Skor: {p.score}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 2: KOLOM PELANGGARAN */}
              {quizSubTab === 'violations' && (
                <div>
                  {filteredViolations.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs italic space-y-2">
                      <Shield className="w-8 h-8 mx-auto text-emerald-400" />
                      <p className="font-bold text-slate-700">Tidak Ada Pelanggaran!</p>
                      <p className="text-[11px] text-slate-400">Semua siswa mengerjakan ujian dengan tertib tanpa keluar layar.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                      <div className="flex items-center justify-between pb-1 px-1">
                        <span className="text-[11px] font-bold text-slate-500">
                          Total {filteredViolations.length} catatan pelanggaran
                        </span>
                        <button
                          type="button"
                          onClick={handleClearAllViolations}
                          className="text-[10px] font-black text-rose-700 hover:text-rose-900 bg-rose-100 hover:bg-rose-200 px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center gap-1 border border-rose-300"
                          title="Bersihkan seluruh catatan pelanggaran"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Bersihkan Semua</span>
                        </button>
                      </div>

                      {filteredViolations.map((v) => (
                        <div
                          key={v.id}
                          className="bg-rose-50/70 border border-rose-200 rounded-2xl p-3 space-y-1.5 shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <strong className="text-slate-900 text-xs font-black">{v.studentName}</strong>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-200">
                                {new Date(v.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteSingleViolation(v.id)}
                                className="p-1 hover:bg-rose-200/70 rounded-lg text-rose-500 hover:text-rose-800 transition cursor-pointer"
                                title="Hapus laporan pelanggaran ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="text-xs font-semibold text-rose-800 flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                            <span>{v.violationDetail}</span>
                          </div>
                          <p className="text-[10px] text-slate-500">
                            Kuis: <strong className="text-slate-700">{v.quizTitle}</strong>
                            {v.studentUsername && <> • @{v.studentUsername}</>}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 3: HASIL NILAI SISWA (ATTEMPTS) */}
              {quizSubTab === 'attempts' && (
                <div>
                  {filteredAttempts.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs italic">
                      Belum ada siswa yang mengerjakan quiz ini.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto space-y-1 pr-1">
                      {filteredAttempts.map((att) => (
                        <div key={att.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-900">{att.studentName}</p>
                            <p className="text-[11px] text-slate-500">
                              @{att.username} • <span className="text-blue-700 font-mono font-bold">{att.tokenUsed}</span>
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(att.completedAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                              })}{' '}
                              • {new Date(att.completedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                            </p>
                          </div>

                          <div className="text-right space-y-1 shrink-0">
                            <div className="text-lg font-black text-slate-900">
                              {att.score}
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                att.passed
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {att.passed ? 'LULUS' : 'REMIDI'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB: BARANG HILANG & DITEMUKAN ===================== */}
      {activeTab === 'lost_found' && (
        <LostFoundManagementPanel
          userRole="guru"
          userName={user?.name || 'Bapak/Ibu Guru'}
        />
      )}

      {/* ===================== MODAL: BUAT / EDIT ARTIKEL ===================== */}
      {showArticleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-lg">
                  {editingArticleId ? 'Edit Artikel Guru' : 'Tulis Artikel Guru & Metode Pembelajaran'}
                </h3>
                <p className="text-xs text-slate-500">
                  Artikel akan langsung tampil pada menu Artikel di Dashboard Siswa jika diterbitkan
                </p>
              </div>
              <button
                onClick={() => setShowArticleModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Artikel *</label>
                <input
                  type="text"
                  value={articleForm.title}
                  onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                  required
                  placeholder="Contoh: Strategi Efektif Menguasai Aljabar Linear"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Artikel *</label>
                  <select
                    value={articleForm.category}
                    onChange={(e) =>
                      setArticleForm({
                        ...articleForm,
                        category: e.target.value as 'Artikel Guru' | 'Metode Pembelajaran',
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="Artikel Guru">Artikel Guru</option>
                    <option value="Metode Pembelajaran">Metode Pembelajaran</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">URL Foto Sampul (Opsional)</label>
                  <input
                    type="url"
                    value={articleForm.coverImage}
                    onChange={(e) => setArticleForm({ ...articleForm, coverImage: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ringkasan Singkat (Abstrak)</label>
                <textarea
                  rows={2}
                  value={articleForm.summary}
                  onChange={(e) => setArticleForm({ ...articleForm, summary: e.target.value })}
                  placeholder="Ringkasan 1-2 kalimat pengantar..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Isi Lengkap Artikel *</label>
                <textarea
                  rows={8}
                  value={articleForm.content}
                  onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                  required
                  placeholder="Tuliskan materi pembelajaran, tips belajar, atau panduan detail di sini..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tags / Kata Kunci (Pisahkan dengan koma)</label>
                <input
                  type="text"
                  value={articleForm.tags}
                  onChange={(e) => setArticleForm({ ...articleForm, tags: e.target.value })}
                  placeholder="Matematika, Ujian, Tips Belajar, Kelas X"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Terbitkan Langsung ke Siswa</span>
                  <span className="text-[11px] text-slate-500">
                    Siswa dapat langsung membaca artikel ini di tab Artikel mereka
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={articleForm.isPublished}
                  onChange={(e) => setArticleForm({ ...articleForm, isPublished: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowArticleModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={articleSaving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {articleSaving ? 'Menyimpan...' : 'Simpan Artikel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: PRATINJAU ARTIKEL ===================== */}
      {previewArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                {previewArticle.category}
              </span>
              <button
                onClick={() => setPreviewArticle(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {previewArticle.coverUrl && (
              <img
                src={previewArticle.coverUrl}
                alt={previewArticle.title}
                className="w-full h-48 object-cover rounded-2xl"
              />
            )}

            <div>
              <h2 className="text-xl font-black text-slate-900">{previewArticle.title}</h2>
              <p className="text-xs text-slate-500 mt-1">
                Oleh <strong>{previewArticle.authorName}</strong> •{' '}
                {new Date(previewArticle.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
              {previewArticle.content}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewArticle(null)}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: BUAT QUIZ & TOKEN ===================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Buat Quiz & Atur Token</h3>
                <p className="text-xs text-slate-500">
                  Tentukan mata pelajaran, sumber kuis (Google Forms atau Soal), password, dan token akses
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuiz} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Judul Quiz *</label>
                  <input
                    type="text"
                    value={quizForm.title}
                    onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                    required
                    placeholder="Contoh: Penilaian Harian Bab 2"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran *</label>
                  {subjects.length > 0 ? (
                    <select
                      value={quizForm.subjectName}
                      onChange={(e) => setQuizForm({ ...quizForm, subjectName: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={quizForm.subjectName}
                      onChange={(e) => setQuizForm({ ...quizForm, subjectName: e.target.value })}
                      required
                      placeholder="Nama Mapel"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <label className="block font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                  Sumber Quiz
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuizForm({ ...quizForm, sourceType: 'interactive' })}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs transition border ${
                      quizForm.sourceType === 'interactive'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    📝 Soal Interaktif TAMVESTA
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuizForm({ ...quizForm, sourceType: 'google_forms' })}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs transition border ${
                      quizForm.sourceType === 'google_forms'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🌐 Tautan Google Forms
                  </button>
                </div>

                {quizForm.sourceType === 'google_forms' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tautan Google Forms Soal Ujian *
                    </label>
                    <input
                      type="url"
                      value={quizForm.externalUrl}
                      onChange={(e) => setQuizForm({ ...quizForm, externalUrl: e.target.value })}
                      required
                      placeholder="https://forms.gle/... atau https://docs.google.com/forms/..."
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-mono text-blue-700"
                    />
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <label className="block font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                  Pengaturan Akses & Token Siswa
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Token Akses Quiz *</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={quizForm.token}
                        onChange={(e) => setQuizForm({ ...quizForm, token: e.target.value.toUpperCase() })}
                        required
                        placeholder="TVQ-XXXX"
                        className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-mono font-black text-blue-800 uppercase tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateToken}
                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-[11px] whitespace-nowrap transition"
                      >
                        Acak Token
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Password Quiz (Opsional)
                    </label>
                    <input
                      type="text"
                      value={quizForm.password}
                      onChange={(e) => setQuizForm({ ...quizForm, password: e.target.value })}
                      placeholder="Kosongkan jika bebas sandi"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Durasi (Menit)</label>
                  <input
                    type="number"
                    min="1"
                    value={quizForm.durationMinutes}
                    onChange={(e) => setQuizForm({ ...quizForm, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nilai KKM Kelulusan (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={quizForm.passingScore}
                    onChange={(e) => setQuizForm({ ...quizForm, passingScore: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              {quizForm.sourceType === 'interactive' && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      Daftar Pertanyaan ({quizForm.questions.length} Butir)
                    </span>
                    <button
                      type="button"
                      onClick={addQuizQuestion}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold text-xs transition"
                    >
                      + Tambah Soal
                    </button>
                  </div>

                  <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                    {quizForm.questions.map((q, qIdx) => (
                      <div key={q.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">Nomor {qIdx + 1}</span>
                          {quizForm.questions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeQuizQuestion(qIdx)}
                              className="text-rose-600 hover:text-rose-800"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => {
                            const updated = [...quizForm.questions];
                            updated[qIdx].question = e.target.value;
                            setQuizForm({ ...quizForm, questions: updated });
                          }}
                          required
                          placeholder={`Ketik pertanyaan nomor ${qIdx + 1}...`}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                        />

                        <div className="space-y-1.5">
                          <p className="text-[10px] text-slate-500 font-bold">
                            Opsi Jawaban (Pilih tombol bulat di kiri untuk Kunci Benar):
                          </p>
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct_guru_${qIdx}`}
                                checked={q.correctOptionIndex === oIdx}
                                onChange={() => {
                                  const updated = [...quizForm.questions];
                                  updated[qIdx].correctOptionIndex = oIdx;
                                  setQuizForm({ ...quizForm, questions: updated });
                                }}
                                className="text-blue-600 focus:ring-blue-500"
                              />
                              <span className="font-bold text-slate-600 w-4">
                                {String.fromCharCode(65 + oIdx)}.
                              </span>
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const updated = [...quizForm.questions];
                                  updated[qIdx].options[oIdx] = e.target.value;
                                  setQuizForm({ ...quizForm, questions: updated });
                                }}
                                required
                                placeholder={`Opsi ${String.fromCharCode(65 + oIdx)}`}
                                className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creatingLoading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {creatingLoading ? 'Menyimpan...' : 'Simpan & Rilis Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    
      {/* Modal Pratinjau QR Code Siswa (Muncul saat klik tombol QR di samping nama siswa) */}
      {selectedStudentForQr && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 text-center">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
                QR Presensi Siswa
              </span>
              <button
                type="button"
                onClick={() => setSelectedStudentForQr(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">{selectedStudentForQr.name}</h3>
              <p className="text-xs text-slate-500 font-mono">@{selectedStudentForQr.username}</p>
              <div className="mt-1 flex items-center justify-center gap-2 text-xs">
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                  {selectedStudentForQr.kelas || selectedKelas}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono text-[10px]">
                  NISN: {selectedStudentForQr.nisn || '-'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl inline-block shadow-inner mx-auto">
              {qrModalDataUrl ? (
                <img
                  src={qrModalDataUrl}
                  alt={`QR Code ${selectedStudentForQr.name}`}
                  className="w-48 h-48 object-contain mx-auto"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                  Membuat QR Code...
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400 leading-tight">
              Arahkan webcam / scanner panitia ke QR code ini untuk mencatat kehadiran siswa secara instan.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <a
                href={qrModalDataUrl}
                download={`QR_${selectedStudentForQr.name.replace(/\s+/g, '_')}.png`}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh PNG</span>
              </a>
              <button
                type="button"
                onClick={() => setSelectedStudentForQr(null)}
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL PREVIEW GOOGLE FORMS DI DALAM APLIKASI */}
      {previewGoogleFormUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full h-[88vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase">
                  Google Forms Terintegrasi
                </span>
                <span className="text-xs text-slate-500 font-mono truncate max-w-md hidden sm:inline">
                  {previewGoogleFormUrl}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewGoogleFormUrl(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 bg-slate-100 relative">
              <iframe
                src={formatGoogleFormsEmbedUrl(previewGoogleFormUrl)}
                className="w-full h-full border-0 bg-white"
                title="Preview Google Forms"
                allow="autoplay"
              />
            </div>
          </div>
        </div>
      )}
      {/* MODAL KONFIRMASI HAPUS KUIS PERMANEN */}
      {quizToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-inner">
              <Trash2 className="w-8 h-8 text-rose-600" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-slate-900">
                Hapus Kuis Permanen?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Kuis <strong className="text-slate-800">"{quizToDelete.title}"</strong> (Token: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-blue-700">{quizToDelete.token}</code>) akan dihapus secara permanen dari server dan perangkat. Seluruh riwayat nilai dan peserta akan dibersihkan selamanya.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setQuizToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => confirmExecuteDelete(quizToDelete.id)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md shadow-rose-600/25 transition active:scale-95"
              >
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};