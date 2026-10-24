import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Users,
  UserPlus,
  BookOpen,
  Library,
  Bell,
  HelpCircle,
  QrCode,
  ScanLine,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  Key,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  Shield,
  ShieldCheck,
  Clock,
  Award,
  GraduationCap,
  Eye,
  EyeOff,
  Copy,
  Check,
  FileSpreadsheet,
  FileDown,
  FileText,
  Maximize2,
  Filter,
  RefreshCw,
  X,
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import type {
  User,
  Subject,
  DigitalBook,
  Announcement,
  Quiz,
  QuizAttempt,
  AttendanceEvent,
  PasswordResetRequest,
} from '../../types/index.ts';
import { StudentProfileModal } from '../../components/StudentProfileModal.tsx';
import { ImageLightboxModal } from '../../components/ImageLightboxModal.tsx';
import { VerifiedBadge } from '../../components/VerifiedBadge.tsx';

type AdminTab = 'students' | 'staff' | 'subjects' | 'library' | 'announcements' | 'quizzes' | 'events' | 'tickets';

export const AdminDashboard: React.FC<{ onOpenScanner: () => void }> = ({ onOpenScanner }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('students');
  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isSyncingMultiDevice, setIsSyncingMultiDevice] = useState<boolean>(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title?: string } | null>(null);

  // --- Student Management State ---
  const [students, setStudents] = useState<User[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentUsername, setNewStudentUsername] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [newStudentNisn, setNewStudentNisn] = useState('');
  const [newStudentKelas, setNewStudentKelas] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [studentKelasFilter, setStudentKelasFilter] = useState<string>('all');
  const [studentStatusFilter, setStudentStatusFilter] = useState<string>('all');

  // Edit Student Modal state
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [editFormName, setEditFormName] = useState('');
  const [editFormGender, setEditFormGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [editFormKelas, setEditFormKelas] = useState('');
  const [editFormUsername, setEditFormUsername] = useState('');
  const [editStudentLoading, setEditStudentLoading] = useState(false);

  // Delete Student Modal state
  const [deletingStudent, setDeletingStudent] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Ticket processing modals & state
  const [ticketFilterStatus, setTicketFilterStatus] = useState<string>('all');
  const [ticketDetailModal, setTicketDetailModal] = useState<PasswordResetRequest | null>(null);
  const [rejectingTicket, setRejectingTicket] = useState<PasswordResetRequest | null>(null);
  const [rejectReasonText, setRejectReasonText] = useState('');
  const [ticketProcessing, setTicketProcessing] = useState(false);
  const [studentFormSuccess, setStudentFormSuccess] = useState<string | null>(null);
  const [studentFormError, setStudentFormError] = useState<string | null>(null);
  const [studentFormLoading, setStudentFormLoading] = useState(false);

  // Reset password modal for student
  const [resettingStudent, setResettingStudent] = useState<User | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  // Student QR Preview
  const [previewQrStudent, setPreviewQrStudent] = useState<User | null>(null);

  // --- Subjects State ---
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    teacherName: '',
    description: '',
    grade: 'Kelas X',
    schedule: '',
    imageUrl: '',
    room: 'Ruang Kelas',
  });

  // --- Books State ---
  const [books, setBooks] = useState<DigitalBook[]>([]);
  const [showBookModal, setShowBookModal] = useState(false);
  const [editingBook, setEditingBook] = useState<DigitalBook | null>(null);
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    category: 'Sains & Teknologi',
    coverUrl: '',
    description: '',
    totalPages: 120,
    publishedYear: '2024',
    content: ['BAB I: Pengantar Buku Digital Siswa Tamansiswa Batam.'],
  });

  // --- Announcements State ---
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);
  const [annForm, setAnnForm] = useState({
    title: '',
    content: '',
    category: 'Penting' as 'Penting' | 'Akademik' | 'Kegiatan' | 'Umum',
  });

  // --- Quizzes State ---
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizForm, setQuizForm] = useState({
    title: '',
    subjectName: 'Matematika Peminatan',
    description: '',
    durationMinutes: 15,
    passingScore: 75,
    questions: [
      {
        id: 'q_sample_1',
        question: 'Contoh soal pilihan ganda baru?',
        options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
        correctOptionIndex: 0,
        explanation: 'Kunci jawaban dan pembahasan.',
      },
    ],
  });

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      if (uploadEvent.target?.result) {
        callback(uploadEvent.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const addQuizQuestion = () => {
    setQuizForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: `q_${Date.now()}_${prev.questions.length + 1}`,
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

  // --- Attendance Events State ---
  const [events, setEvents] = useState<(AttendanceEvent & { totalAttendees?: number })[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    name: '',
    category: 'Event Sekolah' as const,
    description: '',
    location: 'Auditorium Tamansiswa Batam',
    eventDate: new Date().toISOString().slice(0, 10),
    startTime: '08:00',
    endTime: '14:00',
  });

  // --- Student Category & Verified State ---
  const [studentCategoryFilter, setStudentCategoryFilter] = useState<'all' | 'siswa' | 'alumni'>('all');

  // --- Staff & Teacher Management State ---
  const [staffList, setStaffList] = useState<User[]>([]);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState<string>('all');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedStaffKey, setCopiedStaffKey] = useState<string | null>(null);
  const [staffActionSuccess, setStaffActionSuccess] = useState<string | null>(null);
  const [staffActionError, setStaffActionError] = useState<string | null>(null);

  // Teacher Modals State
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [showEditTeacherModal, setShowEditTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);
  const [newTeacherForm, setNewTeacherForm] = useState({
    name: '',
    jabatan: 'Guru Mata Pelajaran',
    username: '',
    password: '',
    email: '',
    phone: '',
  });
  const [editTeacherForm, setEditTeacherForm] = useState({
    name: '',
    jabatan: '',
    email: '',
    phone: '',
  });

  // --- Excel Backup State ---
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupStartDate, setBackupStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [backupEndDate, setBackupEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [backupKelas, setBackupKelas] = useState('semua');
  const [backupStudentSearch, setBackupStudentSearch] = useState('');
  const [backupStatusFilter, setBackupStatusFilter] = useState('semua');
  const [backupExporting, setBackupExporting] = useState(false);
  const [backupSuccessMessage, setBackupSuccessMessage] = useState<string | null>(null);

  // Generator Helpers for Teachers
  const handleAutoGenerateTeacherCredentials = (name: string, jabatan: string) => {
    const cleanName = (name || jabatan || 'guru')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '.')
      .replace(/\.+/g, '.')
      .replace(/^\.|\.$/g, '');
    const randNum = Math.floor(100 + Math.random() * 900);
    const generatedUsername = `guru.${cleanName || 'baru'}`;
    const generatedPassword = `Tamvesta!${randNum}`;

    setNewTeacherForm((prev) => ({
      ...prev,
      username: generatedUsername,
      password: generatedPassword,
    }));
  };

  const handleToggleAlumni = async (studentId: string) => {
    try {
      const res = await api.toggleAlumniStatus(studentId);
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, isAlumni: res.isAlumni } : s))
      );
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status kategori alumni.');
    }
  };

  const notifyMultiDeviceSync = () => {
    try {
      const channel = new BroadcastChannel('tamvesta_admin_sync');
      channel.postMessage({ type: 'REFRESH_ALL', timestamp: Date.now() });
      channel.close();
    } catch (_) {}
  };

  const handleToggleVerified = async (userId: string) => {
    try {
      const res = await api.toggleVerifiedBadge(userId);
      setStudents((prev) =>
        prev.map((s) => (s.id === userId ? { ...s, isVerified: res.isVerified } : s))
      );
      setStaffList((prev) =>
        prev.map((s) => (s.id === userId ? { ...s, isVerified: res.isVerified } : s))
      );
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status verifikasi centang biru.');
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherForm.name.trim() || !newTeacherForm.username.trim() || !newTeacherForm.password.trim()) {
      alert('Nama, username, dan password guru wajib diisi.');
      return;
    }

    try {
      const res = await api.createTeacherAccount(newTeacherForm);
      const createdTeacher = (res as any)?.teacher;
      if (createdTeacher) {
        setStaffList((prev) => [
          createdTeacher,
          ...prev.filter(
            (s) =>
              s.id !== createdTeacher.id &&
              (s.username || '').toLowerCase() !== (createdTeacher.username || '').toLowerCase()
          ),
        ]);
      }

      // Reset search and role filter so the new teacher is visible immediately!
      setStaffSearch('');
      setStaffRoleFilter('all');

      setStaffActionSuccess(res.message || 'Akun guru baru berhasil ditambahkan.');
      setShowAddTeacherModal(false);
      setNewTeacherForm({
        name: '',
        jabatan: 'Guru Mata Pelajaran',
        username: '',
        password: '',
        email: '',
        phone: '',
      });

      const updatedStaff = await api.getStaff();
      if (Array.isArray(updatedStaff) && updatedStaff.length > 0) {
        if (
          createdTeacher &&
          !updatedStaff.some(
            (s) =>
              s.id === createdTeacher.id ||
              (s.username || '').toLowerCase() === (createdTeacher.username || '').toLowerCase()
          )
        ) {
          setStaffList([createdTeacher, ...updatedStaff]);
        } else {
          setStaffList(updatedStaff);
        }
      }
      notifyMultiDeviceSync();
      setTimeout(() => setStaffActionSuccess(null), 4000);
    } catch (err: any) {
      setStaffActionError(err.message || 'Gagal menambahkan akun guru.');
      setTimeout(() => setStaffActionError(null), 4000);
    }
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    try {
      const res = await api.updateTeacher(editingTeacher.id, editTeacherForm);
      setStaffActionSuccess(res.message || 'Akun guru berhasil diperbarui.');
      setShowEditTeacherModal(false);
      setEditingTeacher(null);
      const updatedStaff = await api.getStaff();
      setStaffList(updatedStaff);
      notifyMultiDeviceSync();
      setTimeout(() => setStaffActionSuccess(null), 4000);
    } catch (err: any) {
      setStaffActionError(err.message || 'Gagal memperbarui data guru.');
      setTimeout(() => setStaffActionError(null), 4000);
    }
  };

  const handleDeleteTeacher = async (id: string, name: string) => {
    if (!confirm(`Hapus akun ${name}? Tindakan ini akan menghapus akses login guru tersebut.`)) return;

    try {
      const res = await api.deleteTeacher(id);
      setStaffActionSuccess(res.message || `Akun ${name} berhasil dihapus.`);
      setStaffList((prev) => prev.filter((s) => s.id !== id));
      notifyMultiDeviceSync();
      setTimeout(() => setStaffActionSuccess(null), 4000);
    } catch (err: any) {
      setStaffActionError(err.message || 'Gagal menghapus akun.');
      setTimeout(() => setStaffActionError(null), 4000);
    }
  };

  // EXPORT EXCEL HANDLER: CRITICAL PRIVACY (NO ID / NO USERNAME)
  const handleExportExcel = async () => {
    setBackupExporting(true);
    setBackupSuccessMessage(null);
    try {
      const records = await api.getClassAttendance({
        date: undefined, // fetch all to filter locally
        kelas: backupKelas === 'semua' ? undefined : backupKelas,
        status: backupStatusFilter === 'semua' ? undefined : backupStatusFilter,
      });

      // Filter by date range and search
      const filtered = records.filter((rec: any) => {
        const d = rec.date || '';
        const inDate = (!backupStartDate || d >= backupStartDate) && (!backupEndDate || d <= backupEndDate);
        const inName = !backupStudentSearch || (rec.studentName || '').toLowerCase().includes(backupStudentSearch.toLowerCase());
        const inKelas = backupKelas === 'semua' || rec.studentKelas === backupKelas;
        const inStatus = backupStatusFilter === 'semua' || (rec.status || '').toLowerCase() === backupStatusFilter.toLowerCase();
        return inDate && inName && inKelas && inStatus;
      });

      if (filtered.length === 0) {
        alert('Tidak ada data absensi yang sesuai dengan filter yang dipilih.');
        setBackupExporting(false);
        return;
      }

      // STRICT PRIVACY: Hilangkan kolom Username atau ID Siswa dari file Excel tanpa menghapus data tersebut dari database
      const rows = filtered.map((rec: any, idx: number) => ({
        'No': idx + 1,
        'Nama Siswa': rec.studentName || '-',
        'Kelas': rec.studentKelas || '-',
        'Tanggal': rec.date || '-',
        'Status Kehadiran': (rec.status || 'HADIR').toUpperCase(),
        'Petugas / Guru Pencatat': rec.recordedBy || 'Guru Pengampu',
        'Keterangan': rec.notes || '-',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [
        { wch: 6 },
        { wch: 28 },
        { wch: 14 },
        { wch: 14 },
        { wch: 18 },
        { wch: 26 },
        { wch: 30 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rekap Absensi Siswa');
      const filename = `Data_Absensi_TAMVESTA_${backupStartDate}_sd_${backupEndDate}.xlsx`;
      XLSX.writeFile(wb, filename);

      setBackupSuccessMessage(`Berhasil mengekspor ${rows.length} data absensi ke file ${filename}. Kolom Username dan ID Siswa dihilangkan sesuai ketentuan privasi.`);
    } catch (err: any) {
      alert(err.message || 'Gagal mengekspor file Excel.');
    } finally {
      setBackupExporting(false);
    }
  };

  const loadAllData = async () => {
    try {
      const [stu, subs, bks, anns, qzs, atts, evs, staff, reqs] = await Promise.all([
        api.getStudents(),
        api.getSubjects(),
        api.getBooks(),
        api.getAnnouncements(),
        api.getQuizzes(),
        api.getQuizAttempts(),
        api.getAttendanceEvents(),
        api.getStaff(),
        api.getPasswordResetRequests(),
      ]);
      setResetRequests(reqs || []);
      setStudents(stu);
      setSubjects(subs);
      setBooks(bks);
      setAnnouncements(anns);
      setQuizzes(qzs);
      setQuizAttempts(atts);
      setEvents(evs);
      setStaffList(staff);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  const handleResetStaffToInitial = async (staffUser: User) => {
    setStaffActionSuccess(null);
    setStaffActionError(null);
    try {
      const res = await api.resetStaffPasswordToInitial(staffUser.id);
      setStaffActionSuccess(res.message);
      const updatedStaff = await api.getStaff();
      setStaffList(updatedStaff);
    } catch (err: any) {
      setStaffActionError(err.message || 'Gagal mereset password.');
    }
  };

  const syncDataSilently = async () => {
    try {
      setIsSyncingMultiDevice(true);
      const [stu, subs, bks, anns, qzs, atts, evs, staff, reqs] = await Promise.all([
        api.getStudents(),
        api.getSubjects(),
        api.getBooks(),
        api.getAnnouncements(),
        api.getQuizzes(),
        api.getQuizAttempts(),
        api.getAttendanceEvents(),
        api.getStaff(),
        api.getPasswordResetRequests(),
      ]);

      if (Array.isArray(stu)) setStudents(stu);
      if (Array.isArray(subs)) setSubjects(subs);
      if (Array.isArray(bks)) setBooks(bks);
      if (Array.isArray(anns)) setAnnouncements(anns);
      if (Array.isArray(qzs)) setQuizzes(qzs);
      if (Array.isArray(atts)) setQuizAttempts(atts);
      if (Array.isArray(evs)) setEvents(evs);
      if (Array.isArray(staff)) setStaffList(staff);
      if (Array.isArray(reqs)) setResetRequests(reqs);

      setLastSyncTime(new Date());
    } catch (err) {
      console.debug('Background multi-device auto-sync skipped:', err);
    } finally {
      setIsSyncingMultiDevice(false);
    }
  };

  const handleDownloadWordStaff = () => {
    const currentDate = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const currentTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const staffRowsHtml = staffList
      .map((staff, idx) => {
        const displayPass =
          staff.initialPassword ||
          (staff.username === 'TAMANSISWA' ? 'TAMVESTA123' : 'Tamvesta!1234');
        const roleName =
          staff.role === 'admin'
            ? 'Administrator Sistem'
            : staff.role === 'kepala_sekolah'
            ? 'Kepala Sekolah / Yayasan'
            : staff.role === 'panitia'
            ? 'Staf / Tenaga Kependidikan'
            : 'Dewan Guru Pengampu';
        const statusText = staff.isVerified
          ? 'Terverifikasi (Centang Biru)'
          : 'Akun Aktif (Siap Login)';

        return `
          <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
            <td style="border: 1px solid #cbd5e1; padding: 10px 8px; text-align: center; font-weight: bold; color: #475569; font-size: 10pt;">${idx + 1}</td>
            <td style="border: 1px solid #cbd5e1; padding: 10px 12px; font-weight: bold; color: #0f172a; font-size: 10.5pt;">${staff.name}</td>
            <td style="border: 1px solid #cbd5e1; padding: 10px 12px; color: #334155; font-size: 10pt;">${staff.jabatan || roleName}</td>
            <td style="border: 1px solid #cbd5e1; padding: 10px 12px; color: #1e293b; font-size: 10pt;">${roleName}</td>
            <td style="border: 1px solid #cbd5e1; padding: 10px 12px; font-family: 'Consolas', 'Courier New', monospace; font-weight: bold; color: #065f46; background-color: #ecfdf5; text-align: center; font-size: 10.5pt;">${staff.username}</td>
            <td style="border: 1px solid #cbd5e1; padding: 10px 12px; font-family: 'Consolas', 'Courier New', monospace; font-weight: bold; color: #1e3a8a; background-color: #eff6ff; text-align: center; font-size: 10.5pt;">${displayPass}</td>
            <td style="border: 1px solid #cbd5e1; padding: 10px 8px; text-align: center; color: #047857; font-weight: bold; font-size: 9.5pt;">${statusText}</td>
          </tr>
        `;
      })
      .join('');

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>DAFTAR KREDENSIAL RESMI AKUN GURU & TENAGA KEPENDIDIKAN TAMVESTA</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: 21.0cm 29.7cm;
            margin: 2.0cm 2.0cm 2.0cm 2.0cm;
            mso-page-orientation: portrait;
          }
          body {
            font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
            color: #1e293b;
            font-size: 11pt;
            line-height: 1.5;
            margin: 0;
            padding: 0;
          }
          .header-kop {
            text-align: center;
            border-bottom: 3px double #0f172a;
            padding-bottom: 14px;
            margin-bottom: 24px;
          }
          .inst-title {
            font-size: 16pt;
            font-weight: 800;
            color: #064e3b;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .inst-sub {
            font-size: 13pt;
            font-weight: 700;
            color: #0f172a;
            margin: 4px 0 0 0;
          }
          .inst-address {
            font-size: 9pt;
            color: #64748b;
            margin: 5px 0 0 0;
          }
          .doc-badge {
            display: inline-block;
            background-color: #047857;
            color: #ffffff;
            padding: 7px 18px;
            font-size: 11pt;
            font-weight: bold;
            border-radius: 4px;
            margin: 16px 0 8px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-bar {
            background-color: #f1f5f9;
            border-left: 4px solid #059669;
            padding: 10px 14px;
            margin-bottom: 20px;
            font-size: 10pt;
            line-height: 1.6;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 14px;
            margin-bottom: 24px;
          }
          th {
            background-color: #064e3b;
            color: #ffffff;
            padding: 11px 8px;
            font-size: 10pt;
            text-transform: uppercase;
            border: 1px solid #047857;
            text-align: center;
            font-weight: bold;
          }
          .footer-notice {
            margin-top: 25px;
            padding: 14px 18px;
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            font-size: 9.5pt;
            color: #991b1b;
            line-height: 1.6;
          }
          .sign-area {
            margin-top: 40px;
            width: 100%;
          }
        </style>
      </head>
      <body>
        <div class="header-kop">
          <h1 class="inst-title">YAYASAN PERSATUAN PERGURUAN TAMANSISWA</h1>
          <h2 class="inst-sub">CABANG BATAM — KOTA BATAM</h2>
          <p class="inst-address">Alamat: Jl. Tamansiswa No. 1, Batam, Kepulauan Riau • Telp: (0778) 462155 • Portal: https://apkupdate-indol.vercel.app</p>
          <div style="margin-top: 10px;">
            <span class="doc-badge">DAFTAR KREDENSIAL RESMI AKUN GURU & TENAGA KEPENDIDIKAN</span>
          </div>
          <p style="font-size: 10pt; color: #475569; margin: 4px 0 0 0;">Dokumen Distribusi Akun Sistem Informasi TAMVESTA</p>
        </div>

        <div class="info-bar">
          <strong>Tanggal Cetak:</strong> ${currentDate} pukul ${currentTime} WIB<br/>
          <strong>Total Akun Terdaftar:</strong> ${staffList.length} Akun Guru & Staf Aktif Siap Login<br/>
          <strong>Klasifikasi Dokumen:</strong> Dokumen Internal Resmi (Distribusi Langsung)
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%;">No</th>
              <th style="width: 25%;">Nama Lengkap</th>
              <th style="width: 18%;">Jabatan / Tugas</th>
              <th style="width: 15%;">Hak Akses (Role)</th>
              <th style="width: 14%;">Username</th>
              <th style="width: 13%;">Password Awal</th>
              <th style="width: 10%;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${staffRowsHtml}
          </tbody>
        </table>

        <div class="footer-notice">
          <strong>PEMBERITAHUAN PENTING & KEBIJAKAN KERAHASIAAN:</strong>
          <ol style="margin: 6px 0 0 0; padding-left: 20px;">
            <li>Dokumen ini bersifat <strong>RAHASIA (CONFIDENTIAL)</strong> dan hanya diperuntukkan bagi internal dewan guru serta tenaga kependidikan Perguruan Tamansiswa Batam.</li>
            <li>Kredensial (Username dan Password) di atas digunakan untuk masuk ke aplikasi TAMVESTA (Web & Android).</li>
            <li>Akun guru dan tenaga kependidikan tidak diwajibkan mengganti kata sandi secara paksa demi kemudahan operasional sekolah.</li>
            <li>Dilarang keras menyebarluaskan dokumen ini kepada pihak luar tanpa persetujuan tertulis dari Pimpinan Perguruan Tamansiswa Batam.</li>
          </ol>
        </div>

        <table class="sign-area" style="border: none; margin-top: 50px;">
          <tr style="border: none; background: transparent;">
            <td style="border: none; width: 60%; text-align: left; vertical-align: top;">
              <p style="font-size: 10pt; color: #64748b; line-height: 1.6;">
                Dicetak secara otomatis melalui:<br/>
                <strong>TAMVESTA Admin Control Panel</strong><br/>
                Perguruan Tamansiswa Batam
              </p>
            </td>
            <td style="border: none; width: 40%; text-align: center; vertical-align: top;">
              <p style="font-size: 10pt; margin: 0;">Batam, ${currentDate}</p>
              <p style="font-size: 10pt; font-weight: bold; margin: 2px 0 0 0;">Mengetahui & Menyetujui,</p>
              <p style="font-size: 10pt; color: #475569; margin: 0 0 65px 0;">Pemimpin Perguruan Tamansiswa Batam</p>
              <p style="font-size: 10pt; font-weight: bold; text-decoration: underline; margin: 0;">( Titus Wahyu Diatmiko )</p>
              <p style="font-size: 9pt; color: #64748b; margin: 2px 0 0 0;">Pemimpin Perguruan Tamansiswa Batam</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + wordHtml], {
      type: 'application/msword;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KREDENSIAL_GURU_DAN_STAF_TAMANSISWA_BATAM_${Date.now()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStaffKey(key);
    setTimeout(() => {
      setCopiedStaffKey(null);
    }, 2000);
  };

  useEffect(() => {
    loadAllData();

    // Multi-Device Auto-Sync: Poll every 5 seconds so any changes made on other devices
    // appear automatically without needing manual page reload
    const intervalId = setInterval(() => {
      syncDataSilently();
    }, 5000);

    // Immediate sync when tab becomes visible or gains window focus
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        syncDataSilently();
      }
    };

    // BroadcastChannel for instant zero-latency multi-window/multi-tab updates on same device
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('tamvesta_admin_sync');
      channel.onmessage = (msg) => {
        if (msg.data?.type === 'REFRESH_ALL') {
          syncDataSilently();
        }
      };
    } catch (_) {}

    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      if (channel) {
        try {
          channel.close();
        } catch (_) {}
      }
    };
  }, []);

  // --- 1. STUDENT REGISTRATION & ACTIONS ---
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentFormSuccess(null);
    setStudentFormError(null);
    setStudentFormLoading(true);

    try {
      const res = await api.createStudent({
        name: newStudentName.trim(),
        username: newStudentUsername.trim().toLowerCase(),
        password: newStudentPassword,
        gender: newStudentGender,
        kelas: newStudentKelas.trim() || 'Kelas 7',
      });

      // Instantly prepend created student to state so it appears immediately!
      const createdStudent = (res as any)?.student || (res as any)?.user;
      if (createdStudent) {
        setStudents((prev) => [
          createdStudent,
          ...prev.filter(
            (s) =>
              s.id !== createdStudent.id &&
              (s.username || '').toLowerCase() !== (createdStudent.username || '').toLowerCase()
          ),
        ]);
      }

      // Reset search and filters so the new account is never hidden!
      setStudentSearch('');
      setStudentCategoryFilter('all');
      setStudentKelasFilter('all');
      setStudentStatusFilter('all');

      setStudentFormSuccess(res.message || 'Akun siswa berhasil didaftarkan ke database.');
      handleResetStudentForm();

      const updated = await api.getStudents();
      if (Array.isArray(updated) && updated.length > 0) {
        if (
          createdStudent &&
          !updated.some(
            (s) =>
              s.id === createdStudent.id ||
              (s.username || '').toLowerCase() === (createdStudent.username || '').toLowerCase()
          )
        ) {
          setStudents([createdStudent, ...updated]);
        } else {
          setStudents(updated);
        }
      }
      notifyMultiDeviceSync();
    } catch (err: any) {
      setStudentFormError(err.message || 'Gagal mendaftarkan akun siswa.');
    } finally {
      setStudentFormLoading(false);
    }
  };

  const handleOpenEditStudent = (stu: User) => {
    setEditingStudent(stu);
    setEditFormName(stu.name);
    setEditFormGender(stu.gender || 'Laki-laki');
    setEditFormKelas(stu.kelas || 'Kelas 7');
    setEditFormUsername(stu.username);
  };

  const handleSaveEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setEditStudentLoading(true);
    try {
      await api.updateStudent(editingStudent.id, {
        name: editFormName.trim(),
        gender: editFormGender,
        kelas: editFormKelas.trim(),
        username: editFormUsername.trim().toLowerCase(),
      });
      alert('Data profil siswa berhasil diperbarui!');
      setEditingStudent(null);
      const updated = await api.getStudents();
      setStudents(updated);
      notifyMultiDeviceSync();
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui data siswa.');
    } finally {
      setEditStudentLoading(false);
    }
  };

  const [isRefreshingTickets, setIsRefreshingTickets] = useState(false);

  const handleRefreshTickets = async () => {
    setIsRefreshingTickets(true);
    try {
      const tickets = await api.getPasswordResetRequests();
      setResetRequests(tickets || []);
      notifyMultiDeviceSync();
    } catch (err: any) {
      console.warn('Gagal memuat tiket:', err);
    } finally {
      setIsRefreshingTickets(false);
    }
  };

  const handleConfirmDeleteStudent = async () => {
    if (!deletingStudent) return;
    const targetId = deletingStudent.id;
    setDeleteLoading(true);
    try {
      await api.deleteStudent(targetId);
      // Kurangi langsung dari state agar berkurang selamanya secara instan
      setStudents((prev) => prev.filter((s) => s.id !== targetId));
      alert(`Akun siswa "${deletingStudent.name}" (@${deletingStudent.username}) berhasil dihapus selamanya dari database.`);
      setDeletingStudent(null);
      const updated = await api.getStudents();
      setStudents(updated);
      notifyMultiDeviceSync();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus akun siswa.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleApproveTicket = async (tkt: PasswordResetRequest) => {
    if (!window.confirm(`Setujui pengajuan ganti sandi untuk ${tkt.name} (@${tkt.username})?\n\nPassword siswa akan diperbarui menjadi kata sandi baru yang diajukan.`)) {
      return;
    }
    setTicketProcessing(true);
    try {
      const res = await api.processPasswordResetRequest(tkt.id, 'approved');
      alert(res.message || 'Pengajuan ganti sandi telah disetujui.');
      const updatedReqs = await api.getPasswordResetRequests();
      setResetRequests(updatedReqs || []);
      const updatedStu = await api.getStudents();
      setStudents(updatedStu);
      notifyMultiDeviceSync();
    } catch (err: any) {
      alert(err.message || 'Gagal memproses tiket.');
    } finally {
      setTicketProcessing(false);
    }
  };

  const handleRejectTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingTicket) return;
    setTicketProcessing(true);
    try {
      const res = await api.processPasswordResetRequest(rejectingTicket.id, 'rejected', rejectReasonText.trim() || 'Alasan administratif');
      alert(res.message || 'Pengajuan ganti sandi telah ditolak.');
      setRejectingTicket(null);
      setRejectReasonText('');
      const updatedReqs = await api.getPasswordResetRequests();
      setResetRequests(updatedReqs || []);
      notifyMultiDeviceSync();
    } catch (err: any) {
      alert(err.message || 'Gagal menolak tiket.');
    } finally {
      setTicketProcessing(false);
    }
  };

  const handleResetStudentForm = () => {
    setNewStudentName('');
    setNewStudentUsername('');
    setNewStudentPassword('');
    setNewStudentNisn('');
    setNewStudentKelas('');
  };

  const handleToggleStudentActive = async (student: User) => {
    try {
      const res = await api.toggleStudentActive(student.id);
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, isActive: res.isActive } : s))
      );
      notifyMultiDeviceSync();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status akun.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingStudent || !resetNewPassword) return;
    setResetSuccess(null);
    setResetError(null);

    try {
      const res = await api.resetStudentPassword(resettingStudent.id, resetNewPassword);
      setResetSuccess(res.message);
      setTimeout(() => {
        setResettingStudent(null);
        setResetNewPassword('');
        setResetSuccess(null);
      }, 1500);
    } catch (err: any) {
      setResetError(err.message || 'Gagal mereset password.');
    }
  };

  // --- 2. SUBJECT ACTIONS ---
  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await api.updateSubject(editingSubject.id, subjectForm);
      } else {
        await api.addSubject(subjectForm);
      }
      setShowSubjectModal(false);
      setEditingSubject(null);
      const updated = await api.getSubjects();
      setSubjects(updated);
      notifyMultiDeviceSync();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan mata pelajaran.');
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus mata pelajaran ini?')) return;
    try {
      await api.deleteSubject(id);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
      notifyMultiDeviceSync();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus mata pelajaran.');
    }
  };

  // --- 3. BOOK ACTIONS ---
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBook) {
        await api.updateBook(editingBook.id, bookForm);
      } else {
        await api.addBook(bookForm);
      }
      setShowBookModal(false);
      setEditingBook(null);
      const updated = await api.getBooks();
      setBooks(updated);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan buku digital.');
    }
  };

  const handleDeleteBook = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus buku ini?')) return;
    try {
      await api.deleteBook(id);
      setBooks((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus buku.');
    }
  };

  // --- 4. ANNOUNCEMENT ACTIONS ---
  const handleSaveAnn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAnn) {
        await api.updateAnnouncement(editingAnn.id, annForm);
      } else {
        await api.addAnnouncement(annForm);
      }
      setShowAnnModal(false);
      setEditingAnn(null);
      const updated = await api.getAnnouncements();
      setAnnouncements(updated);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan pengumuman.');
    }
  };

  const handleDeleteAnn = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) return;
    try {
      await api.deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus pengumuman.');
    }
  };

  // --- 5. QUIZ ACTIONS ---
  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addQuiz({
        title: quizForm.title,
        subjectName: quizForm.subjectName,
        description: quizForm.description,
        durationMinutes: Number(quizForm.durationMinutes),
        passingScore: Number(quizForm.passingScore),
        questions: quizForm.questions,
        isActive: true,
      });
      setShowQuizModal(false);
      const updated = await api.getQuizzes();
      setQuizzes(updated);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan quiz.');
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus quiz ini?')) return;
    try {
      await api.deleteQuiz(id);
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus quiz.');
    }
  };

  // --- 6. ATTENDANCE EVENT ACTIONS ---
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAttendanceEvent(eventForm);
      setShowEventModal(false);
      const updated = await api.getAttendanceEvents();
      setEvents(updated);
    } catch (err: any) {
      alert(err.message || 'Gagal membuat kegiatan absensi.');
    }
  };

  const handleToggleEventSession = async (id: string) => {
    try {
      const res = await api.toggleEventSession(id);
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, isOpen: res.isOpen } : e))
      );
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status sesi.');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kegiatan ini beserta riwayat absensinya?')) return;
    try {
      await api.deleteAttendanceEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus kegiatan.');
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.username.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.nisn && s.nisn.includes(studentSearch)) ||
      (s.kelas && s.kelas.toLowerCase().includes(studentSearch.toLowerCase()));

    const matchesCategory =
      studentCategoryFilter === 'all' ||
      (studentCategoryFilter === 'siswa' && !s.isAlumni) ||
      (studentCategoryFilter === 'alumni' && !!s.isAlumni);

    return matchesSearch && matchesCategory;
  });

  const filteredStaff = staffList.filter((staff) => {
    const q = staffSearch.toLowerCase();
    const matchesQuery =
      staff.name.toLowerCase().includes(q) ||
      staff.username.toLowerCase().includes(q) ||
      (staff.jabatan && staff.jabatan.toLowerCase().includes(q));

    const matchesRole =
      staffRoleFilter === 'all' || staff.role === staffRoleFilter;

    return matchesQuery && matchesRole;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-700/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold tracking-wide">
              ADMINISTRATOR UTAMA
            </span>
            <span className="text-xs text-slate-400">TAMANSISWA BATAM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">Dashboard Kontrol Admin</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            Kelola akun siswa, kurikulum mapel, perpustakaan digital, pengumuman, quiz, dan absensi QR
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-950/70 border border-emerald-500/40 rounded-2xl text-[11px] font-bold text-emerald-200 backdrop-blur-sm shadow-inner">
            <span className={`w-2.5 h-2.5 rounded-full ${isSyncingMultiDevice ? 'bg-amber-400 animate-spin' : 'bg-emerald-400 animate-pulse'}`} />
            <span className="hidden sm:inline">Sinkronisasi Multi-Device:</span>
            <span className="text-emerald-300 font-mono">Aktif ({lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})</span>
          </div>

          <button
            onClick={() => setShowBackupModal(true)}
            className="flex items-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-teal-600/30 transition active:scale-95"
            title="Unduh backup data absensi dalam format file Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-200" />
            <span>Backup Absensi (.xlsx)</span>
          </button>

          <button
            onClick={onOpenScanner}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition active:scale-95 group"
          >
            <ScanLine className="w-5 h-5 text-emerald-200 group-hover:scale-110 transition-transform" />
            <span>Buka Website Scanner Laptop</span>
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'students' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span className="truncate">Akun Siswa</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'staff' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <GraduationCap className="w-4 h-4 shrink-0" />
          <span className="truncate">Akun Guru & Staf</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-100 text-emerald-800">
            {staffList.length || 17}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('subjects')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'subjects' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span className="truncate">Mata Pelajaran</span>
        </button>

        <button
          onClick={() => setActiveTab('library')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'library' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Library className="w-4 h-4 shrink-0" />
          <span className="truncate">Perpustakaan</span>
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'announcements' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Bell className="w-4 h-4 shrink-0" />
          <span className="truncate">Pengumuman</span>
        </button>

        <button
          onClick={() => setActiveTab('quizzes')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'quizzes' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          <span className="truncate">Quiz & Nilai</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'events' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <QrCode className="w-4 h-4 shrink-0" />
          <span className="truncate">Absensi QR</span>
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'tickets' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Shield className="w-4 h-4 shrink-0" />
          <span className="truncate">Tiket Sandi Siswa</span>
          {resetRequests.filter((r) => r.status === 'pending').length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
              {resetRequests.filter((r) => r.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: PENDAFTARAN & MANAJEMEN AKUN SISWA (Section 4 Requirements) */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* Registration Form Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="border-b border-slate-100 pb-4 mb-6">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                MENU KHUSUS PENDAFTARAN
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                Pendaftaran Akun Siswa Baru
              </h2>
              <p className="text-xs text-slate-500">
                Formulir pendaftaran akun Siswa resmi. Data tersimpan permanen di database server dan siap digunakan login langsung.
              </p>
            </div>

            {studentFormSuccess && (
              <div className="mb-5 flex items-center gap-2.5 p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{studentFormSuccess}</span>
              </div>
            )}

            {studentFormError && (
              <div className="mb-5 flex items-center gap-2.5 p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-2xl text-xs font-bold">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{studentFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Nama lengkap */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    1. Nama Lengkap Siswa *
                  </label>
                  <input
                    type="text"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    required
                    placeholder="Contoh: Muhammad Farhan"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                {/* 2. Jenis Kelamin (Dropdown) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    2. Jenis Kelamin *
                  </label>
                  <select
                    value={newStudentGender}
                    onChange={(e) => setNewStudentGender(e.target.value as any)}
                    required
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                {/* 3. Kelas (Dropdown 1-9) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    3. Kelas Siswa (Kelas 1 - 9) *
                  </label>
                  <select
                    value={newStudentKelas}
                    onChange={(e) => setNewStudentKelas(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="">Pilih Kelas</option>
                    <option value="Kelas 1">Kelas 1</option>
                    <option value="Kelas 2">Kelas 2</option>
                    <option value="Kelas 3">Kelas 3</option>
                    <option value="Kelas 4">Kelas 4</option>
                    <option value="Kelas 5">Kelas 5</option>
                    <option value="Kelas 6">Kelas 6</option>
                    <option value="Kelas 7">Kelas 7</option>
                    <option value="Kelas 8">Kelas 8</option>
                    <option value="Kelas 9">Kelas 9</option>
                  </select>
                </div>

                {/* 4. Username */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    4. Username (Unik) *
                  </label>
                  <input
                    type="text"
                    value={newStudentUsername}
                    onChange={(e) => setNewStudentUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                    required
                    placeholder="Contoh: farhan.siswa"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>

                {/* 5. Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    5. Password (Min. 6 Karakter) *
                  </label>
                  <input
                    type="password"
                    value={newStudentPassword}
                    onChange={(e) => setNewStudentPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Masukkan password akun"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetStudentForm}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition"
                >
                  Reset Formulir
                </button>

                <button
                  type="submit"
                  disabled={studentFormLoading}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md transition flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{studentFormLoading ? 'Menyimpan...' : 'Daftarkan Akun Siswa'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Student Accounts Table & Management */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Daftar Akun Siswa Terdaftar ({students.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Kelola aktivasi akun, kategori Siswa/Alumni, centang biru, kartu QR siswa, dan reset password
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search */}
                <div className="relative w-full sm:w-56">
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Cari nama / username..."
                    className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>

                {/* Filter Kategori Siswa / Alumni */}
                <select
                  value={studentCategoryFilter}
                  onChange={(e) => setStudentCategoryFilter(e.target.value as any)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
                >
                  <option value="all">Semua Kategori (Siswa & Alumni)</option>
                  <option value="siswa">Hanya Siswa Aktif</option>
                  <option value="alumni">Hanya Alumni</option>
                </select>

                {/* Filter Kelas */}
                <select
                  value={studentKelasFilter}
                  onChange={(e) => setStudentKelasFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
                >
                  <option value="all">Semua Kelas</option>
                  <option value="Kelas 1">Kelas 1</option>
                  <option value="Kelas 2">Kelas 2</option>
                  <option value="Kelas 3">Kelas 3</option>
                  <option value="Kelas 4">Kelas 4</option>
                  <option value="Kelas 5">Kelas 5</option>
                  <option value="Kelas 6">Kelas 6</option>
                  <option value="Kelas 7">Kelas 7</option>
                  <option value="Kelas 8">Kelas 8</option>
                  <option value="Kelas 9">Kelas 9</option>
                </select>

                {/* Filter Status */}
                <select
                  value={studentStatusFilter}
                  onChange={(e) => setStudentStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
                >
                  <option value="all">Semua Status Akun</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-center w-10">No</th>
                    <th className="p-3">Siswa / Alumni</th>
                    <th className="p-3">Gender</th>
                    <th className="p-3">Kelas</th>
                    <th className="p-3">Username</th>
                    <th className="p-3">Tgl Daftar</th>
                    <th className="p-3 text-center">Status Akun</th>
                    <th className="p-3 text-center">Tindakan (QR • Status • Verif)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                        Belum ada siswa terdaftar yang sesuai.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((stu, sIdx) => (
                      <tr key={stu.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 text-center font-bold text-slate-400">
                          {sIdx + 1}
                        </td>
                        <td className="p-3">
                          <div
                            className="flex items-center gap-2.5 cursor-pointer group"
                            onClick={() => setPreviewQrStudent(stu)}
                            title="Klik untuk melihat profil lengkap & QR siswa"
                          >
                            <div
                              className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0 group-hover:ring-2 ring-emerald-500 transition relative cursor-zoom-in"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLightboxImage({
                                  url: stu.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(stu.name)}&backgroundColor=0284c7`,
                                  title: `Foto Profil • ${stu.name}`,
                                });
                              }}
                              title="Klik foto untuk memperbesar"
                            >
                              <img
                                src={stu.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(stu.name)}&backgroundColor=0284c7`}
                                alt={stu.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-emerald-700 flex items-center gap-1.5 flex-wrap transition">
                                <span>{stu.name}</span>
                                {stu.isAlumni ? (
                                  <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded text-[9px] font-black border border-purple-200">
                                    ALUMNI
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold border border-emerald-200">
                                    SISWA
                                  </span>
                                )}
                                {stu.isVerified && <VerifiedBadge size="xs" />}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">ID: {stu.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-slate-600 font-semibold">
                          {stu.gender || 'Laki-laki'}
                        </td>
                        <td className="p-3 font-bold text-slate-800">
                          {stu.kelas || '-'}
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-800">
                          @{stu.username}
                        </td>
                        <td className="p-3 text-slate-500 text-[11px]">
                          {new Date(stu.createdAt).toLocaleDateString('id-ID')}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleToggleStudentActive(stu)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border transition ${
                              stu.isActive !== false
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                            }`}
                            title="Klik untuk mengubah status aktif/nonaktif"
                          >
                            {stu.isActive !== false ? 'AKTIF' : 'NONAKTIF'}
                          </button>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Detail / QR */}
                            <button
                              onClick={() => setPreviewQrStudent(stu)}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                              title="Lihat Detail Profil & Kartu QR Siswa"
                            >
                              <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                            </button>

                            {/* Status Siswa / Alumni Tepat Di Sebelah QR */}
                            <button
                              onClick={() => handleToggleAlumni(stu.id)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-black border transition inline-flex items-center gap-1 shadow-2xs ${
                                stu.isAlumni
                                  ? 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              }`}
                              title={
                                stu.isAlumni
                                  ? 'Kategori: Alumni (Klik untuk ubah jadi Siswa Aktif)'
                                  : 'Kategori: Siswa (Klik untuk ubah jadi Alumni)'
                              }
                            >
                              <GraduationCap className="w-3 h-3 shrink-0" />
                              <span>{stu.isAlumni ? 'Alumni' : 'Siswa'}</span>
                            </button>

                            {/* Centang Biru (Verifikasi) */}
                            <button
                              onClick={() => handleToggleVerified(stu.id)}
                              className={`px-2 py-1 rounded-lg border transition inline-flex items-center gap-1 text-[10px] font-bold ${
                                stu.isVerified
                                  ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
                                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-600'
                              }`}
                              title={
                                stu.isVerified
                                  ? 'Centang Biru: Terverifikasi (Klik untuk nonaktifkan)'
                                  : 'Centang Biru: Belum Verifikasi (Klik untuk verifikasi)'
                              }
                            >
                              <CheckCircle2
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  stu.isVerified ? 'fill-blue-500 text-white' : 'text-slate-400'
                                }`}
                              />
                              <span className="hidden xl:inline">{stu.isVerified ? 'Verif' : 'Verif'}</span>
                            </button>

                            {/* Edit Data */}
                            <button
                              onClick={() => handleOpenEditStudent(stu)}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                              title="Edit Data Siswa"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                            </button>
                            <button
                              onClick={() => {
                                setResettingStudent(stu);
                                setResetNewPassword('');
                                setResetSuccess(null);
                                setResetError(null);
                              }}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                              title="Reset Password Siswa"
                            >
                              <Key className="w-3.5 h-3.5 text-amber-600" />
                            </button>

                            {/* Hapus Akun */}
                            <button
                              onClick={() => setDeletingStudent(stu)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Hapus Akun Siswa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DAFTAR USERNAME & PASSWORD AWAL GURU DAN STAF */}
      {activeTab === 'staff' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Official Document Banner */}
          <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-bold text-emerald-200 border border-white/15">
                <GraduationCap className="w-4 h-4 text-amber-300" />
                <span>TAMVESTA • DAFTAR USERNAME & PASSWORD AWAL</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Akun Guru & Tenaga Kependidikan
              </h2>
              <p className="text-xs sm:text-sm text-teal-100 max-w-2xl leading-relaxed">
                Dokumen internal — untuk distribusi akun kepada guru, kepala sekolah, dan staf Tamansiswa Batam.
                Seluruh 17 akun di bawah telah terdaftar dan aktif di sistem TAMVESTA sehingga guru dan staf dapat langsung login.
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="px-3 py-1 rounded-xl bg-amber-400/20 border border-amber-300/30 text-amber-200 font-semibold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-300" />
                  Guru & Staf menggunakan akun resmi tanpa kewajiban ganti password paksa
                </span>
              </div>
            </div>
          </div>

          {/* Alert messages */}
          {staffActionSuccess && (
            <div className="flex items-center justify-between gap-2 p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{staffActionSuccess}</span>
              </div>
              <button onClick={() => setStaffActionSuccess(null)} className="text-emerald-600 hover:text-emerald-900">
                ✕
              </button>
            </div>
          )}

          {staffActionError && (
            <div className="flex items-center justify-between gap-2 p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-2xl text-xs font-bold animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{staffActionError}</span>
              </div>
              <button onClick={() => setStaffActionError(null)} className="text-rose-600 hover:text-rose-900">
                ✕
              </button>
            </div>
          )}

          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Akun Staf</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900">{staffList.length}</span>
                <span className="text-xs text-emerald-600 font-bold">Siap Login</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Guru Pengampu</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-indigo-700">
                  {staffList.filter((s) => s.role === 'guru').length}
                </span>
                <span className="text-xs text-slate-400">Pendidik</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pimpinan & Kepala</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-purple-700">
                  {staffList.filter((s) => s.role === 'kepala_sekolah').length}
                </span>
                <span className="text-xs text-slate-400">Kepsek & Yayasan</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Admin & Operasional</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-emerald-700">
                  {staffList.filter((s) => s.role === 'admin' || s.role === 'panitia').length}
                </span>
                <span className="text-xs text-slate-400">Dapodik & Satpam</span>
              </div>
            </div>
          </div>

          {/* Search, Filter, and Table Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>Daftar Kredensial Resmi Guru & Staf</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-bold font-mono">
                    {filteredStaff.length} Akun
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Username dan password awal sesuai surat keputusan distribusi akun internal TAMVESTA
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setNewTeacherForm({
                      name: '',
                      jabatan: 'Guru Mata Pelajaran',
                      username: '',
                      password: '',
                      email: '',
                      phone: '',
                    });
                    setShowAddTeacherModal(true);
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Akun Guru</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadWordStaff}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
                  title="Unduh Kredensial Resmi Guru & Tenaga Kependidikan ke Microsoft Word (.doc)"
                >
                  <FileDown className="w-4 h-4 text-blue-200" />
                  <span>Unduh Dokumen Word</span>
                </button>

                <div className="relative w-full sm:w-60">
                  <input
                    type="text"
                    value={staffSearch}
                    onChange={(e) => setStaffSearch(e.target.value)}
                    placeholder="Cari nama, jabatan, username..."
                    className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>

                <select
                  value={staffRoleFilter}
                  onChange={(e) => setStaffRoleFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-700"
                >
                  <option value="all">Semua Jabatan</option>
                  <option value="guru">Guru Pengampu</option>
                  <option value="kepala_sekolah">Kepala Sekolah / Yayasan</option>
                  <option value="admin">Administrasi & Operator</option>
                  <option value="panitia">Satpam / Staf</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 w-12 text-center">No</th>
                    <th className="p-3.5">Nama</th>
                    <th className="p-3.5">Jabatan</th>
                    <th className="p-3.5">Username</th>
                    <th className="p-3.5">Password Awal</th>
                    <th className="p-3.5 text-center">Centang Biru</th>
                    <th className="p-3.5">Role Akses</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        Tidak ada akun guru/staf yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((staff, idx) => {
                      const isRevealed = !!revealedPasswords[staff.id];
                      const displayPass = staff.initialPassword || (staff.username === 'TAMANSISWA' ? 'TAMVESTA123' : 'Tamvesta!1234');
                      const roleBadgeStyles: Record<string, string> = {
                        admin: 'bg-rose-100 text-rose-800 border-rose-200',
                        guru: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                        kepala_sekolah: 'bg-purple-100 text-purple-800 border-purple-200',
                        panitia: 'bg-amber-100 text-amber-800 border-amber-200',
                        siswa: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                      };

                      return (
                        <tr key={staff.id} className="hover:bg-slate-50/70 transition">
                          <td className="p-3.5 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{staff.name}</span>
                              {staff.isVerified && <VerifiedBadge size="xs" />}
                            </div>
                            {staff.username === 'TAMANSISWA' && (
                              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">
                                Akun Admin Utama
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-700 font-medium">
                            {staff.jabatan || staff.role.toUpperCase()}
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5">
                              <code className="font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                                {staff.username}
                              </code>
                              <button
                                onClick={() => copyToClipboard(staff.username, `user_${staff.id}`)}
                                className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded transition"
                                title="Salin Username"
                              >
                                {copiedStaffKey === `user_${staff.id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {isRevealed ? displayPass : '••••••••••••'}
                              </span>
                              <button
                                onClick={() =>
                                  setRevealedPasswords((prev) => ({
                                    ...prev,
                                    [staff.id]: !prev[staff.id],
                                  }))
                                }
                                className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded transition"
                                title={isRevealed ? 'Sembunyikan Password' : 'Lihat Password'}
                              >
                                {isRevealed ? (
                                  <EyeOff className="w-3.5 h-3.5" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => copyToClipboard(displayPass, `pass_${staff.id}`)}
                                className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded transition"
                                title="Salin Password"
                              >
                                {copiedStaffKey === `pass_${staff.id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => handleToggleVerified(staff.id)}
                              className={`p-1.5 rounded-lg border transition inline-flex items-center gap-1 text-[11px] font-bold ${
                                staff.isVerified
                                  ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                              }`}
                              title={staff.isVerified ? 'Hilangkan centang biru' : 'Berikan centang biru resmi'}
                            >
                              <ShieldCheck className={`w-3.5 h-3.5 ${staff.isVerified ? 'text-blue-600 fill-blue-600' : 'text-slate-400'}`} />
                              <span className="text-[10px]">{staff.isVerified ? 'Verified' : 'Biasa'}</span>
                            </button>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                roleBadgeStyles[staff.role] || 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {staff.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Aktif
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  const text = `Akun TAMVESTA Tamansiswa Batam:\nNama: ${staff.name}\nJabatan: ${staff.jabatan || '-'}\nUsername: ${staff.username}\nPassword: ${displayPass}`;
                                  copyToClipboard(text, `full_${staff.id}`);
                                }}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                                title="Salin Kredensial Lengkap"
                              >
                                {copiedStaffKey === `full_${staff.id}` ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Tersalin</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Salin Akun</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => {
                                  setEditingTeacher(staff);
                                  setEditTeacherForm({
                                    name: staff.name,
                                    jabatan: staff.jabatan || '',
                                    email: staff.email || '',
                                    phone: staff.phone || '',
                                  });
                                  setShowEditTeacherModal(true);
                                }}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg text-[11px] font-bold transition"
                                title="Edit Akun Guru"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {staff.username !== 'TAMANSISWA' && (
                                <>
                                  <button
                                    onClick={() => handleResetStaffToInitial(staff)}
                                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold transition"
                                    title="Kembalikan password akun ini ke password awal resmi"
                                  >
                                    Reset ke Awal
                                  </button>

                                  <button
                                    onClick={() => handleDeleteTeacher(staff.id, staff.name)}
                                    className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-[11px] font-bold transition"
                                    title="Hapus Akun Guru"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Document Footer Recommendation */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3 text-xs text-slate-600">
              <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-bold mb-0.5">
                  Rekomendasi Keamanan Distribusi Akun
                </strong>
                <span>
                  Jangan membagikan dokumen ini secara publik. Distribusikan kredensial secara pribadi kepada guru dan staf yang bersangkutan. Gunakan tombol &quot;Reset ke Awal&quot; jika pengguna lupa password.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MATA PELAJARAN MANAGEMENT */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Manajemen Mata Pelajaran</h2>
              <p className="text-xs text-slate-500">Tambah, edit, dan atur kurikulum mata pelajaran siswa</p>
            </div>
            <button
              onClick={() => {
                setEditingSubject(null);
                setSubjectForm({
                  name: '',
                  code: '',
                  teacherName: '',
                  description: '',
                  grade: 'Kelas XII',
                  schedule: '',
                  imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
                  room: 'Lab Sains',
                });
                setShowSubjectModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Mapel Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div
                    className="h-40 relative bg-slate-100 cursor-zoom-in group overflow-hidden"
                    onClick={() => setLightboxImage({ url: sub.imageUrl, title: `Foto Mapel • ${sub.name}` })}
                    title="Klik foto untuk memperbesar"
                  >
                    <img src={sub.imageUrl} alt={sub.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/80 text-white">
                      {sub.code}
                    </span>
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <span className="px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold rounded-lg flex items-center gap-1 shadow">
                        <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Perbesar Foto</span>
                      </span>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-base text-slate-900">{sub.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{sub.description}</p>
                    <p className="text-[11px] text-slate-600">
                      Guru: <strong>{sub.teacherName}</strong>
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-end gap-2 mt-2">
                  <button
                    onClick={() => {
                      setEditingSubject(sub);
                      setSubjectForm({
                        name: sub.name,
                        code: sub.code,
                        teacherName: sub.teacherName,
                        description: sub.description,
                        grade: sub.grade,
                        schedule: '',
                        imageUrl: sub.imageUrl,
                        room: sub.room || 'Ruang Kelas',
                      });
                      setShowSubjectModal(true);
                    }}
                    className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                    title="Edit Mapel"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSubject(sub.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Hapus Mapel"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PERPUSTAKAAN DIGITAL MANAGEMENT */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Katalog Perpustakaan Digital</h2>
              <p className="text-xs text-slate-500">Kelola buku elektronik, karya tulis, dan literatur Tamansiswa</p>
            </div>
            <button
              onClick={() => {
                setEditingBook(null);
                setBookForm({
                  title: '',
                  author: '',
                  category: 'Sejarah & Budaya',
                  coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
                  description: '',
                  totalPages: 100,
                  publishedYear: '2024',
                  content: ['BAB I: Pengantar buku digital.'],
                });
                setShowBookModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Buku Digital</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {books.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 rounded-xl overflow-hidden bg-slate-100 mb-3">
                    <img src={b.coverUrl} alt={b.title} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {b.category}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 mt-1 line-clamp-2">{b.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Penulis: {b.author}</p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditingBook(b);
                      setBookForm({
                        title: b.title,
                        author: b.author,
                        category: b.category,
                        coverUrl: b.coverUrl,
                        description: b.description,
                        totalPages: b.totalPages,
                        publishedYear: b.publishedYear,
                        content: b.content,
                      });
                      setShowBookModal(true);
                    }}
                    className="p-1.5 text-slate-600 hover:text-emerald-700 rounded-lg hover:bg-slate-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteBook(b.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PENGUMUMAN MANAGEMENT */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Manajemen Pengumuman Sekolah</h2>
              <p className="text-xs text-slate-500">Terbitkan berita dan informasi penting untuk seluruh civitas sekolah</p>
            </div>
            <button
              onClick={() => {
                setEditingAnn(null);
                setAnnForm({
                  title: '',
                  content: '',
                  category: 'Penting',
                });
                setShowAnnModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Pengumuman Baru</span>
            </button>
          </div>

          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {ann.category}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(ann.createdAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900">{ann.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2">{ann.content}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setEditingAnn(ann);
                      setAnnForm({
                        title: ann.title,
                        content: ann.content,
                        category: ann.category,
                      });
                      setShowAnnModal(true);
                    }}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAnn(ann.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: QUIZZES & HASIL */}
      {activeTab === 'quizzes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Manajemen Quiz & Nilai Siswa</h2>
              <p className="text-xs text-slate-500">Kelola bank soal kuis dan pantau hasil evaluasi akademik siswa</p>
            </div>
            <button
              onClick={() => setShowQuizModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Quiz Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizzes.map((q) => (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                    {q.subjectName}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDeleteQuiz(q.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-base text-slate-900">{q.title}</h3>
                <p className="text-xs text-slate-600">{q.description}</p>
                <div className="text-[11px] text-slate-500 font-mono flex items-center gap-3 pt-2 border-t border-slate-100">
                  <span>{q.questions.length} Butir Soal</span>
                  <span>Durasi: {q.durationMinutes} mnt</span>
                  <span>KKM: {q.passingScore}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Student Submissions Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Riwayat Penilaian & Pengerjaan Quiz Seluruh Siswa ({quizAttempts.length})
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Nama Siswa</th>
                    <th className="p-3.5">Judul Quiz</th>
                    <th className="p-3.5 text-center">Jawaban Benar</th>
                    <th className="p-3.5 text-center">Nilai</th>
                    <th className="p-3.5 text-center">Status Kelulusan</th>
                    <th className="p-3.5">Waktu Submit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {quizAttempts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                        Belum ada siswa yang mengerjakan quiz.
                      </td>
                    </tr>
                  ) : (
                    quizAttempts.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50">
                        <td className="p-3.5">
                          <strong>{att.studentName}</strong>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            @{att.username}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-800">{att.quizTitle}</td>
                        <td className="p-3.5 text-center font-mono">
                          {att.correctAnswersCount} / {att.totalQuestions}
                        </td>
                        <td className="p-3.5 text-center font-black text-emerald-700 text-sm">
                          {att.score}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              att.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {att.passed ? 'LULUS' : 'REMEDIAL'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500">
                          {new Date(att.completedAt).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: ABSENSI QR CODE & KEGIATAN */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Pengelolaan Kegiatan & Sesi Absensi QR
              </h2>
              <p className="text-xs text-slate-500">
                Atur event sekolah, kegiatan OSIS, buka/tutup sesi absensi, dan unduh laporan kehadiran
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEventModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Kegiatan Baru</span>
              </button>

              <button
                onClick={onOpenScanner}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                <ScanLine className="w-4 h-4 text-emerald-400" />
                <span>Buka Scanner Laptop</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {ev.category}
                    </span>
                    <button
                      onClick={() => handleToggleEventSession(ev.id)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border transition ${
                        ev.isOpen
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border-rose-200'
                      }`}
                      title="Klik untuk membuka/menutup sesi absensi"
                    >
                      {ev.isOpen ? 'SESI DIBUKA' : 'SESI DITUTUP'}
                    </button>
                  </div>

                  <h3 className="font-black text-base text-slate-900">{ev.name}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{ev.description}</p>

                  <div className="text-[11px] text-slate-500 space-y-1 pt-2 border-t border-slate-100">
                    <p>Lokasi: <strong>{ev.location}</strong></p>
                    <p>Tanggal: <strong>{ev.eventDate}</strong> ({ev.startTime} - {ev.endTime} WIB)</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-slate-400">Total Hadir: </span>
                    <strong className="text-emerald-700 text-sm font-black">
                      {ev.totalAttendees || 0} Siswa
                    </strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={api.getExportUrl(ev.id)}
                      download
                      className="p-2 text-slate-700 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition"
                      title="Unduh Laporan CSV"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Hapus Kegiatan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: TIKET PENGAJUAN GANTI SANDI SISWA */}
      {activeTab === 'tickets' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Tiket Pengajuan Ganti Sandi Siswa</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800">
                  {resetRequests.filter((r) => r.status === 'pending').length} Menunggu Persetujuan
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Persetujuan pergantian kata sandi resmi yang diajukan oleh siswa melalui aplikasi
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefreshTickets}
                disabled={isRefreshingTickets}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl transition shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                title="Muat ulang tiket pengaduan masuk"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isRefreshingTickets ? 'animate-spin' : ''}`} />
                <span>{isRefreshingTickets ? 'Memperbarui...' : 'Segarkan Pengaduan'}</span>
              </button>

              <select
                value={ticketFilterStatus}
                onChange={(e) => setTicketFilterStatus(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-700"
              >
                <option value="all">Semua Status Tiket</option>
                <option value="pending">Menunggu Persetujuan</option>
                <option value="approved">Disetujui</option>
                <option value="rejected">Ditolak</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-center w-12">No</th>
                    <th className="p-3">No. Tiket</th>
                    <th className="p-3">Nama Siswa</th>
                    <th className="p-3">Username</th>
                    <th className="p-3">Kelas</th>
                    <th className="p-3">Waktu Pengajuan</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Aksi / Keputusan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {resetRequests.filter((r) => ticketFilterStatus === 'all' || r.status === ticketFilterStatus).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                        Belum ada tiket pengajuan ganti sandi.
                      </td>
                    </tr>
                  ) : (
                    resetRequests
                      .filter((r) => ticketFilterStatus === 'all' || r.status === ticketFilterStatus)
                      .map((tkt, tIdx) => (
                        <tr key={tkt.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 text-center font-bold text-slate-400">
                            {tIdx + 1}
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-800">
                            {tkt.ticketNumber || tkt.id}
                          </td>
                          <td className="p-3 font-bold text-slate-900">
                            {tkt.name}
                          </td>
                          <td className="p-3 font-mono text-emerald-800">
                            @{tkt.username}
                          </td>
                          <td className="p-3 text-slate-700">
                            {tkt.kelas || '-'}
                          </td>
                          <td className="p-3 text-slate-500 text-[11px]">
                            {new Date(tkt.createdAt).toLocaleString('id-ID')}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                              tkt.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              tkt.status === 'rejected' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                              'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                            }`}>
                              {tkt.status === 'approved' ? 'Disetujui' : tkt.status === 'rejected' ? 'Ditolak' : 'Menunggu Persetujuan'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Detail button */}
                              <button
                                onClick={() => setTicketDetailModal(tkt)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold"
                              >
                                Detail
                              </button>

                              {tkt.status === 'pending' && (
                                <>
                                  {/* ACC button */}
                                  <button
                                    onClick={() => handleApproveTicket(tkt)}
                                    disabled={ticketProcessing}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black shadow-xs transition"
                                  >
                                    ACC / Setujui
                                  </button>

                                  {/* Tolak button */}
                                  <button
                                    onClick={() => {
                                      setRejectingTicket(tkt);
                                      setRejectReasonText('');
                                    }}
                                    disabled={ticketProcessing}
                                    className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black shadow-xs transition"
                                  >
                                    Tolak
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD SISWA */}
      {resettingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              Reset Password: {resettingStudent.name}
            </h3>
            <p className="text-xs text-slate-500">
              Siswa akan diwajibkan mengganti password baru ini saat login kembali.
            </p>

            {resetSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold">
                {resetSuccess}
              </div>
            )}
            {resetError && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold">
                {resetError}
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password Baru Siswa (Min. 6 Karakter)
                </label>
                <input
                  type="password"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Masukkan password reset"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResettingStudent(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  Simpan Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT DATA SISWA */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">Edit Profil Siswa</h3>
              <p className="text-xs text-slate-500">Perbarui identitas akun siswa terdaftar</p>
            </div>

            <form onSubmit={handleSaveEditStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Siswa *</label>
                <input
                  type="text"
                  value={editFormName}
                  onChange={(e) => setEditFormName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={editFormGender}
                    onChange={(e) => setEditFormGender(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kelas Siswa</label>
                  <select
                    value={editFormKelas}
                    onChange={(e) => setEditFormKelas(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="Kelas 1">Kelas 1</option>
                    <option value="Kelas 2">Kelas 2</option>
                    <option value="Kelas 3">Kelas 3</option>
                    <option value="Kelas 4">Kelas 4</option>
                    <option value="Kelas 5">Kelas 5</option>
                    <option value="Kelas 6">Kelas 6</option>
                    <option value="Kelas 7">Kelas 7</option>
                    <option value="Kelas 8">Kelas 8</option>
                    <option value="Kelas 9">Kelas 9</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Username Akun *</label>
                <input
                  type="text"
                  value={editFormUsername}
                  onChange={(e) => setEditFormUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editStudentLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs"
                >
                  {editStudentLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS AKUN SISWA */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-base text-slate-900">Hapus Akun Siswa?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus akun <strong>{deletingStudent.name}</strong> (@{deletingStudent.username})?
              </p>
              <p className="text-[11px] text-rose-600 font-semibold mt-1">
                Akun ini tidak dapat digunakan untuk login lagi setelah dihapus.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStudent}
                disabled={deleteLoading}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md transition disabled:opacity-50"
              >
                {deleteLoading ? 'Menghapus...' : 'Ya, Hapus Akun'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TOLAK TIKET DENGAN ALASAN */}
      {rejectingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-black text-base text-slate-900">Tolak Pengajuan Ganti Sandi</h3>
            <p className="text-xs text-slate-600">
              Siswa: <strong>{rejectingTicket.name}</strong> (@{rejectingTicket.username})
            </p>

            <form onSubmit={handleRejectTicket} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alasan Penolakan Tiket *
                </label>
                <textarea
                  rows={3}
                  value={rejectReasonText}
                  onChange={(e) => setRejectReasonText(e.target.value)}
                  required
                  placeholder="Contoh: Identitas pengajuan tidak sesuai / Silakan hubungi bagian TU sekolah..."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingTicket(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={ticketProcessing || !rejectReasonText.trim()}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {ticketProcessing ? 'Memproses...' : 'Konfirmasi Tolak Tiket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL TIKET */}
      {ticketDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">Rincian Tiket Sandi</h3>
                <p className="text-xs font-mono text-emerald-800">{ticketDetailModal.ticketNumber || ticketDetailModal.id}</p>
              </div>
              <button
                onClick={() => setTicketDetailModal(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <p><strong>Nama Siswa:</strong> {ticketDetailModal.name}</p>
                <p><strong>Username:</strong> @{ticketDetailModal.username}</p>
                <p><strong>Kelas:</strong> {ticketDetailModal.kelas || '-'}</p>
                <p><strong>Waktu Diajukan:</strong> {new Date(ticketDetailModal.createdAt).toLocaleString('id-ID')}</p>
                <p><strong>Alasan Pengajuan:</strong> {ticketDetailModal.reason || '-'}</p>
                <p><strong>Status Tiket:</strong> <span className="font-bold uppercase">{ticketDetailModal.status}</span></p>
                {ticketDetailModal.processedAt && (
                  <p><strong>Diproses Pada:</strong> {new Date(ticketDetailModal.processedAt).toLocaleString('id-ID')} oleh {ticketDetailModal.processedBy}</p>
                )}
                {ticketDetailModal.adminNote && (
                  <p><strong>Catatan Admin:</strong> {ticketDetailModal.adminNote}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setTicketDetailModal(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW STUDENT QR CODE */}
      {previewQrStudent && (
        <StudentProfileModal
          user={previewQrStudent}
          isOpen={true}
          onClose={() => setPreviewQrStudent(null)}
        />
      )}

      {/* MODAL: TAMBAH / EDIT MATA PELAJARAN */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              {editingSubject ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
            </h3>
            <form onSubmit={handleSaveSubject} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Mata Pelajaran</label>
                <input
                  type="text"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  required
                  placeholder="Contoh: Fisika Terapan"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kode Mapel</label>
                  <input
                    type="text"
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                    required
                    placeholder="Contoh: FIS-01"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Guru Pengampu</label>
                  <input
                    type="text"
                    value={subjectForm.teacherName}
                    onChange={(e) => setSubjectForm({ ...subjectForm, teacherName: e.target.value })}
                    placeholder="Nama Guru"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Foto / Gambar Mapel</label>
                <div className="flex flex-col sm:flex-row items-center gap-2 mb-2">
                  <input
                    type="url"
                    value={subjectForm.imageUrl}
                    onChange={(e) => setSubjectForm({ ...subjectForm, imageUrl: e.target.value })}
                    placeholder="URL gambar (https://...)"
                    className="flex-1 w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                  <label className="cursor-pointer px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 whitespace-nowrap transition">
                    <span>Unggah File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageFileUpload(e, (url) => setSubjectForm({ ...subjectForm, imageUrl: url }))}
                    />
                  </label>
                </div>
                {subjectForm.imageUrl && (
                  <div
                    className="h-28 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative mb-1 cursor-zoom-in group"
                    onClick={() =>
                      setLightboxImage({
                        url: subjectForm.imageUrl,
                        title: subjectForm.name || 'Pratinjau Foto Mapel',
                      })
                    }
                    title="Klik untuk memperbesar pratinjau"
                  >
                    <img src={subjectForm.imageUrl} alt="Pratinjau Mapel" className="w-full h-full object-cover group-hover:scale-105 transition" />
                    <span className="absolute bottom-1 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 shadow">
                      <Maximize2 className="w-3 h-3 text-emerald-400" />
                      <span>Klik untuk perbesar</span>
                    </span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Mapel</label>
                <textarea
                  rows={2}
                  value={subjectForm.description}
                  onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  Simpan Mata Pelajaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT DIGITAL BOOK */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              {editingBook ? 'Edit Buku Digital' : 'Tambah Buku Digital Baru'}
            </h3>
            <form onSubmit={handleSaveBook} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Buku</label>
                <input
                  type="text"
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  required
                  placeholder="Judul Buku"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Penulis</label>
                  <input
                    type="text"
                    value={bookForm.author}
                    onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                    required
                    placeholder="Nama Penulis"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                  <input
                    type="text"
                    value={bookForm.category}
                    onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                    placeholder="Sains, Sastra, dsb."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sampul Buku Digital</label>
                <div className="flex flex-col sm:flex-row items-center gap-2 mb-2">
                  <input
                    type="url"
                    value={bookForm.coverUrl}
                    onChange={(e) => setBookForm({ ...bookForm, coverUrl: e.target.value })}
                    placeholder="URL sampul (https://...)"
                    className="flex-1 w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                  <label className="cursor-pointer px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 whitespace-nowrap transition">
                    <span>Unggah Sampul</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageFileUpload(e, (url) => setBookForm({ ...bookForm, coverUrl: url }))}
                    />
                  </label>
                </div>
                {bookForm.coverUrl && (
                  <div className="h-28 w-24 mx-auto rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative mb-1">
                    <img src={bookForm.coverUrl} alt="Pratinjau Sampul" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Buku</label>
                <textarea
                  rows={2}
                  value={bookForm.description}
                  onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  Simpan Buku
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT PENGUMUMAN */}
      {showAnnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              {editingAnn ? 'Edit Pengumuman' : 'Buat Pengumuman Sekolah'}
            </h3>
            <form onSubmit={handleSaveAnn} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Pengumuman</label>
                <input
                  type="text"
                  value={annForm.title}
                  onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                  required
                  placeholder="Judul Pengumuman"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                <select
                  value={annForm.category}
                  onChange={(e) => setAnnForm({ ...annForm, category: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Penting">Penting</option>
                  <option value="Akademik">Akademik</option>
                  <option value="Kegiatan">Kegiatan</option>
                  <option value="Umum">Umum</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Isi Pengumuman</label>
                <textarea
                  rows={4}
                  value={annForm.content}
                  onChange={(e) => setAnnForm({ ...annForm, content: e.target.value })}
                  required
                  placeholder="Tuliskan isi pengumuman secara rinci..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAnnModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  Terbitkan Pengumuman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH EVENT ABSENSI BARU */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              Buat Kegiatan / Sesi Absensi Baru
            </h3>
            <form onSubmit={handleSaveEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kegiatan *</label>
                <input
                  type="text"
                  value={eventForm.name}
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                  required
                  placeholder="Contoh: Rapat OSIS Perdana 2026"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Event Sekolah">Event Sekolah</option>
                    <option value="Kegiatan OSIS">Kegiatan OSIS</option>
                    <option value="Rapat OSIS">Rapat OSIS</option>
                    <option value="Lomba Sekolah">Lomba Sekolah</option>
                    <option value="Kegiatan Khusus Siswa">Kegiatan Khusus Siswa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={eventForm.eventDate}
                    onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={eventForm.startTime}
                    onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={eventForm.endTime}
                    onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi</label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  placeholder="Lokasi kegiatan"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Uraian agenda kegiatan..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  Buat Kegiatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH QUIZ BARU */}
      {showQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Buat Quiz Baru</h3>
            <form onSubmit={handleSaveQuiz} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Quiz</label>
                <input
                  type="text"
                  value={quizForm.title}
                  onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                  required
                  placeholder="Judul Quiz"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                <input
                  type="text"
                  value={quizForm.subjectName}
                  onChange={(e) => setQuizForm({ ...quizForm, subjectName: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Durasi (Menit)</label>
                  <input
                    type="number"
                    value={quizForm.durationMinutes}
                    onChange={(e) => setQuizForm({ ...quizForm, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nilai KKM</label>
                  <input
                    type="number"
                    value={quizForm.passingScore}
                    onChange={(e) => setQuizForm({ ...quizForm, passingScore: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  value={quizForm.description}
                  onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Dynamic Questions Builder */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Daftar Butir Soal Quiz ({quizForm.questions.length})
                  </h4>
                  <button
                    type="button"
                    onClick={addQuizQuestion}
                    className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Soal</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {quizForm.questions.map((q, qIndex) => (
                    <div key={q.id || qIndex} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700">
                          Soal Nomor {qIndex + 1}
                        </span>
                        {quizForm.questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeQuizQuestion(qIndex)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                            title="Hapus butir soal"
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
                          updated[qIndex].question = e.target.value;
                          setQuizForm({ ...quizForm, questions: updated });
                        }}
                        required
                        placeholder={`Ketik pertanyaan nomor ${qIndex + 1}...`}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                      />

                      <div className="space-y-1.5 pt-1">
                        <p className="text-[10px] text-slate-500 font-bold">
                          Opsi Pilihan (Pilih tombol bulat di kiri untuk Kunci Jawaban Benar):
                        </p>
                        {q.options.map((opt, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct_${qIndex}`}
                              checked={q.correctOptionIndex === oIndex}
                              onChange={() => {
                                const updated = [...quizForm.questions];
                                updated[qIndex].correctOptionIndex = oIndex;
                                setQuizForm({ ...quizForm, questions: updated });
                              }}
                              className="text-emerald-600 focus:ring-emerald-500"
                              title="Tandai sebagai kunci jawaban benar"
                            />
                            <span className="font-bold text-slate-600 w-4">
                              {String.fromCharCode(65 + oIndex)}.
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const updated = [...quizForm.questions];
                                updated[qIndex].options[oIndex] = e.target.value;
                                setQuizForm({ ...quizForm, questions: updated });
                              }}
                              required
                              placeholder={`Pilihan ${String.fromCharCode(65 + oIndex)}`}
                              className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                          Pembahasan / Penjelasan Jawaban (Opsional)
                        </label>
                        <input
                          type="text"
                          value={q.explanation || ''}
                          onChange={(e) => {
                            const updated = [...quizForm.questions];
                            updated[qIndex].explanation = e.target.value;
                            setQuizForm({ ...quizForm, questions: updated });
                          }}
                          placeholder="Penjelasan pembahasan materi..."
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuizModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  Simpan Quiz & Soal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ===================== MODAL: TAMBAH AKUN GURU ===================== */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Tambah Akun Guru Baru</h3>
                <p className="text-xs text-slate-500">
                  Buat akun pendidik resmi dengan generator username & sandi otomatis
                </p>
              </div>
              <button
                onClick={() => setShowAddTeacherModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Guru *</label>
                <input
                  type="text"
                  required
                  value={newTeacherForm.name}
                  onChange={(e) => setNewTeacherForm({ ...newTeacherForm, name: e.target.value })}
                  placeholder="Contoh: Budi Santoso, S.Pd."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Jabatan / Guru Mata Pelajaran *</label>
                <input
                  type="text"
                  required
                  value={newTeacherForm.jabatan}
                  onChange={(e) => setNewTeacherForm({ ...newTeacherForm, jabatan: e.target.value })}
                  placeholder="Contoh: Guru Matematika Wajib"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                    Kredensial Login Sistem
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAutoGenerateTeacherCredentials(newTeacherForm.name, newTeacherForm.jabatan)}
                    className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Generate Otomatis</span>
                  </button>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username Guru *</label>
                  <input
                    type="text"
                    required
                    value={newTeacherForm.username}
                    onChange={(e) => setNewTeacherForm({ ...newTeacherForm, username: e.target.value.toLowerCase() })}
                    placeholder="guru.budi"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-emerald-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Password Awal *</label>
                  <input
                    type="text"
                    required
                    value={newTeacherForm.password}
                    onChange={(e) => setNewTeacherForm({ ...newTeacherForm, password: e.target.value })}
                    placeholder="Tamvesta!1234"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email / Gmail (Opsional)</label>
                  <input
                    type="email"
                    value={newTeacherForm.email}
                    onChange={(e) => setNewTeacherForm({ ...newTeacherForm, email: e.target.value })}
                    placeholder="guru@gmail.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp (Opsional)</label>
                  <input
                    type="tel"
                    value={newTeacherForm.phone}
                    onChange={(e) => setNewTeacherForm({ ...newTeacherForm, phone: e.target.value })}
                    placeholder="0812xxxxxxxx"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTeacherModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Simpan & Buat Akun Guru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: EDIT AKUN GURU ===================== */}
      {showEditTeacherModal && editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Edit Akun Guru</h3>
                <p className="text-xs text-slate-500">
                  Perbarui profil dan kontak guru: <strong>@{editingTeacher.username}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowEditTeacherModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTeacher} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Guru *</label>
                <input
                  type="text"
                  required
                  value={editTeacherForm.name}
                  onChange={(e) => setEditTeacherForm({ ...editTeacherForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Jabatan / Guru Mata Pelajaran *</label>
                <input
                  type="text"
                  required
                  value={editTeacherForm.jabatan}
                  onChange={(e) => setEditTeacherForm({ ...editTeacherForm, jabatan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email / Gmail</label>
                  <input
                    type="email"
                    value={editTeacherForm.email}
                    onChange={(e) => setEditTeacherForm({ ...editTeacherForm, email: e.target.value })}
                    placeholder="guru@gmail.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. Telepon / WhatsApp</label>
                  <input
                    type="tel"
                    value={editTeacherForm.phone}
                    onChange={(e) => setEditTeacherForm({ ...editTeacherForm, phone: e.target.value })}
                    placeholder="0812xxxxxxxx"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditTeacherModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: BACKUP ABSENSI EXCEL (.XLSX) ===================== */}
      {showBackupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-teal-600" />
                  <span>Backup Absensi Siswa (.xlsx)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Unduh data kehadiran siswa dalam format resmi spreadsheet Microsoft Excel
                </p>
              </div>
              <button
                onClick={() => setShowBackupModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Privacy Compliance Notice */}
            <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-2xl text-[11px] text-teal-900 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Ketentuan Privasi Ekspor Data</strong>
                <span>
                  Sesuai ketentuan, kolom <strong>Username</strong> dan <strong>ID Siswa</strong> dihilangkan dari file Excel tanpa menghapus data tersebut dari database.
                </span>
              </div>
            </div>

            {backupSuccessMessage && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{backupSuccessMessage}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dari Tanggal</label>
                  <input
                    type="date"
                    value={backupStartDate}
                    onChange={(e) => setBackupStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sampai Tanggal</label>
                  <input
                    type="date"
                    value={backupEndDate}
                    onChange={(e) => setBackupEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Filter Kelas</label>
                  <select
                    value={backupKelas}
                    onChange={(e) => setBackupKelas(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="semua">Semua Kelas</option>
                    <option value="X TKJ 1">X TKJ 1</option>
                    <option value="X TKJ 2">X TKJ 2</option>
                    <option value="X RPL 1">X RPL 1</option>
                    <option value="X RPL 2">X RPL 2</option>
                    <option value="XI TKJ 1">XI TKJ 1</option>
                    <option value="XI TKJ 2">XI TKJ 2</option>
                    <option value="XI RPL 1">XI RPL 1</option>
                    <option value="XI RPL 2">XI RPL 2</option>
                    <option value="XII TKJ 1">XII TKJ 1</option>
                    <option value="XII TKJ 2">XII TKJ 2</option>
                    <option value="XII RPL 1">XII RPL 1</option>
                    <option value="XII RPL 2">XII RPL 2</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Kehadiran</label>
                  <select
                    value={backupStatusFilter}
                    onChange={(e) => setBackupStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="semua">Semua Status</option>
                    <option value="hadir">Hadir Saja</option>
                    <option value="izin">Izin Saja</option>
                    <option value="sakit">Sakit Saja</option>
                    <option value="alpa">Alpa Saja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pencarian Nama Siswa (Opsional)</label>
                <input
                  type="text"
                  value={backupStudentSearch}
                  onChange={(e) => setBackupStudentSearch(e.target.value)}
                  placeholder="Ketik nama siswa tertentu atau kosongkan untuk semua"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBackupModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  disabled={backupExporting}
                  onClick={handleExportExcel}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>{backupExporting ? 'Mengekspor...' : 'Unduh File Excel (.xlsx)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pembesar Foto (Image Lightbox Modal) */}
      <ImageLightboxModal
        imageUrl={lightboxImage ? lightboxImage.url : null}
        title={lightboxImage ? lightboxImage.title : undefined}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
};
