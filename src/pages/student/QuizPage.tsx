import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Key,
  User as UserIcon,
  Clock,
  Award,
  AlertTriangle,
  Volume2,
  VolumeX,
  Volume1,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowRight,
  LogOut,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import type { Quiz, QuizAttempt } from '../../types/index.ts';
import {
  getAppVolume,
  setAppVolume,
  isMuted,
  toggleMute,
  playQuizStartSound,
  playQuizTimerWarningSound,
  playQuizSelectOptionSound,
  playQuizSubmitSuccessSound,
  playQuizExitAlertSound,
  ensureAudioContext,
} from '../../lib/audio.ts';

interface Props {
  onBackToDashboard?: () => void;
  onQuizActiveChange?: (isActive: boolean) => void;
}

export const QuizPage: React.FC<Props> = ({ onBackToDashboard, onQuizActiveChange }) => {
  const { user } = useAuth();

  // Form open toggle (Landing vs Entrance Form)
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Entrance Form states
  const [studentName, setStudentName] = useState(user?.name || '');
  const [quizToken, setQuizToken] = useState('');
  const [quizPassword, setQuizPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Active Quiz State
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Sound Control State
  const [appVolume, setAppVolumeState] = useState<number>(getAppVolume() || 0.85);
  const [isMute, setIsMute] = useState<boolean>(isMuted());
  const [timerWarningNotice, setTimerWarningNotice] = useState<string | null>(null);

  // Exit warning modal state
  const [showExitWarning, setShowExitWarning] = useState(false);

  // Result state
  const [quizResult, setQuizResult] = useState<QuizAttempt | null>(null);

  // Inform parent when component unmounts or quiz ends
  useEffect(() => {
    return () => {
      if (onQuizActiveChange) onQuizActiveChange(false);
    };
  }, [onQuizActiveChange]);

  // Sync quiz active state to parent
  useEffect(() => {
    const isExamRunning = Boolean(activeQuiz && !quizResult);
    if (onQuizActiveChange) {
      onQuizActiveChange(isExamRunning);
    }
  }, [activeQuiz, quizResult, onQuizActiveChange]);

  // Anti-cheat navigation lock: intercept hardware back button, browser back, window blur & tab switch
  useEffect(() => {
    if (!activeQuiz || quizResult) return;

    // Push state into history so popping it doesn't navigate away from page
    window.history.pushState({ quizActive: true }, '');

    const handlePopState = (e: PopStateEvent) => {
      // Re-push history to trap navigation and stay on exam page
      window.history.pushState({ quizActive: true }, '');
      playQuizExitAlertSound();
      setShowExitWarning(true);
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      playQuizExitAlertSound();
      e.preventDefault();
      e.returnValue = 'PERINGATAN UJIAN: Kuis sedang berlangsung! Dilarang keluar sebelum selesai.';
      return e.returnValue;
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab switch or app minimized
        playQuizExitAlertSound();
        setShowExitWarning(true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeQuiz, quizResult]);

  // Timer countdown
  useEffect(() => {
    if (!activeQuiz || timeLeft <= 0 || quizResult) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === 60) {
          // Bunyikan peringatan waktu tersisa 1 menit
          playQuizTimerWarningSound();
          setTimerWarningNotice('Peringatan: Waktu pengerjaan kuis tersisa 1 menit lagi!');
          setTimeout(() => setTimerWarningNotice(null), 5000);
        }
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeQuiz, timeLeft, quizResult]);

  // Handle Token Verification
  const handleVerifyAndStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError(null);
    if (!studentName.trim()) {
      setVerifyError('Nama lengkap siswa wajib diisi.');
      return;
    }
    if (!quizToken.trim()) {
      setVerifyError('Token quiz wajib diisi.');
      return;
    }

    setVerifying(true);
    try {
      const res = await api.verifyQuizToken({
        token: quizToken.trim(),
        studentName: studentName.trim(),
        password: quizPassword.trim() || undefined,
      });

      ensureAudioContext();
      setActiveQuiz(res.quiz);
      setTimeLeft((res.quiz.durationMinutes || 15) * 60);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setQuizResult(null);
      setTimerWarningNotice(null);
      playQuizStartSound(); // Nada penanda kuis dimulai
      if (onQuizActiveChange) onQuizActiveChange(true);
    } catch (err: any) {
      setVerifyError(err.message || 'Token quiz tidak valid atau kuis tidak ditemukan.');
    } finally {
      setVerifying(false);
    }
  };

  // Handle Volume Change (Pengaturan suara aplikasi fleksibel tanpa lock)
  const handleVolumeSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    const updated = setAppVolume(newVol);
    setAppVolumeState(updated);
    setIsMute(updated <= 0);
  };

  const handleToggleMute = () => {
    const muted = toggleMute();
    setIsMute(muted);
    setAppVolumeState(getAppVolume());
  };

  // Trigger Exit Warning & Play Alarm Sound
  const handleAttemptExit = () => {
    // Bunyikan beep peringatan ketika tombol keluar ditekan saat ujian berjalan
    playQuizExitAlertSound();
    setShowExitWarning(true);
  };

  // Submit Quiz Answers
  const handleSubmitQuiz = async () => {
    if (!activeQuiz || submitting) return;
    setSubmitting(true);

    try {
      const formattedAnswers = (activeQuiz.questions || []).map((q) => ({
        questionId: q.id,
        selectedOption: answers[q.id] !== undefined ? answers[q.id] : -1,
      }));

      const res = await api.submitQuiz(activeQuiz.id, {
        answers: formattedAnswers,
        tokenUsed: activeQuiz.token,
      });

      playQuizSubmitSuccessSound(); // Nada penanda quiz berhasil dikumpulkan
      setQuizResult(res.attempt);
      setActiveQuiz(null);
      if (onQuizActiveChange) onQuizActiveChange(false);

      if (res.attempt.passed) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengirimkan jawaban kuis.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // -------------------------------------------------------------
  // VIEW 1: RESULT PAGE AFTER QUIZ FINISH
  // -------------------------------------------------------------
  if (quizResult) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-8 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 mx-auto shadow-inner border border-emerald-100">
            {quizResult.passed ? (
              <Award className="w-10 h-10 text-emerald-600" />
            ) : (
              <HelpCircle className="w-10 h-10 text-amber-600" />
            )}
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Hasil Pengerjaan Kuis
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              {quizResult.quizTitle}
            </h2>
            <p className="text-xs text-slate-500">
              Siswa: <strong>{quizResult.studentName}</strong> (@{quizResult.username}) • Token: <code className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">{quizResult.tokenUsed}</code>
            </p>
          </div>

          {/* Score Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Nilai Skor</span>
              <strong className="text-2xl sm:text-3xl font-black text-slate-900">
                {quizResult.score}
              </strong>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Status</span>
              <strong
                className={`text-sm sm:text-base font-black ${
                  quizResult.passed ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {quizResult.passed ? 'LULUS (TUNTAS)' : 'REMIDIAL'}
              </strong>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Benar</span>
              <strong className="text-2xl sm:text-3xl font-black text-emerald-600">
                {quizResult.correctAnswersCount} / {quizResult.totalQuestions}
              </strong>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Waktu Selesai</span>
              <strong className="text-xs font-bold text-slate-700 block mt-2">
                {new Date(quizResult.completedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
              </strong>
            </div>
          </div>

          {/* Action to Exit After Quiz Finish */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                setQuizResult(null);
                setQuizToken('');
                setQuizPassword('');
                if (onQuizActiveChange) onQuizActiveChange(false);
              }}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Menu Kuis</span>
            </button>

            <button
              onClick={() => {
                setQuizResult(null);
                if (onQuizActiveChange) onQuizActiveChange(false);
                if (onBackToDashboard) onBackToDashboard();
              }}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs sm:text-sm font-black shadow-xl shadow-emerald-600/30 transition flex items-center justify-center gap-2 transform active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar dari Quiz (Selesai)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: ACTIVE QUIZ EXAM MODE
  // -------------------------------------------------------------
  if (activeQuiz) {
    const isGoogleForms = activeQuiz.sourceType === 'google_forms';
    const questions = activeQuiz.questions || [];
    const currentQ = questions[currentQuestionIndex];

    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Top Exam Bar */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                SESI UJIAN AKTIF
              </span>
              <span className="text-xs text-slate-400">Token: <strong className="text-white font-mono">{activeQuiz.token}</strong></span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">{activeQuiz.title}</h2>
            <p className="text-xs text-slate-400">
              Siswa: <strong className="text-slate-200">{studentName}</strong> • {activeQuiz.subjectName}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Timer */}
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-2xl border border-slate-700">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="font-mono font-black text-sm text-amber-300">
                {formatTimer(timeLeft)}
              </span>
            </div>

            {/* In-app Volume & Sound Control */}
            <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 rounded-2xl border border-slate-700">
              <button
                type="button"
                onClick={handleToggleMute}
                className="p-1 hover:bg-slate-700 rounded-lg text-emerald-400 transition"
                title={isMute ? 'Aktifkan suara aplikasi' : 'Bisukan suara aplikasi'}
              >
                {isMute || appVolume <= 0 ? (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                ) : appVolume < 0.5 ? (
                  <Volume1 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                )}
              </button>
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-300 font-bold leading-none">
                  Suara: {isMute ? 'Bisu' : `${Math.round(appVolume * 100)}%`}
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMute ? 0 : appVolume}
                  onChange={handleVolumeSliderChange}
                  className="w-20 sm:w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  title="Pengaturan volume suara aplikasi TAMVESTA"
                />
              </div>
            </div>

            {/* Tombol Keluar dengan Peringatan & Bunyi Suara */}
            <button
              onClick={handleAttemptExit}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-2xl text-xs font-bold transition active:scale-95"
              title="Keluar dari sesi quiz"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* Timer Warning Notice */}
        {timerWarningNotice && (
          <div className="p-3 bg-amber-500/20 border border-amber-500/40 text-amber-200 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{timerWarningNotice}</span>
          </div>
        )}

        {/* GOOGLE FORMS QUIZ SOURCE */}
        {isGoogleForms ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 text-center">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl max-w-xl mx-auto space-y-2">
              <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Sumber Quiz Google Forms
              </span>
              <h3 className="font-bold text-slate-800 text-sm">
                Quiz ini diselenggarakan menggunakan tautan resmi Google Forms
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Silakan buka tautan soal di bawah ini untuk mengerjakan. Setelah Anda selesai mengirimkan respon formulir, klik tombol <strong>"Konfirmasi Selesai Mengerjakan"</strong>.
              </p>
            </div>

            <div className="py-4">
              <a
                href={activeQuiz.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-600/30 transition active:scale-95"
              >
                <span>Buka Google Forms Soal Ujian</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-center">
              <button
                onClick={handleSubmitQuiz}
                disabled={submitting}
                className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black shadow-md transition"
              >
                {submitting ? 'Memproses...' : 'Konfirmasi Selesai Mengerjakan Quiz'}
              </button>
            </div>
          </div>
        ) : (
          /* INTERACTIVE MULTIPLE CHOICE EXAM */
          <div className="space-y-6">
            {/* Question Navigator Numbers */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-700">
                <span>Daftar Nomor Soal ({questions.length} Butir)</span>
                <span className="text-slate-400 font-normal">
                  Terjawab: {Object.keys(answers).length} / {questions.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {questions.map((q, idx) => {
                  const isAnswered = answers[q.id] !== undefined;
                  const isCurrent = idx === currentQuestionIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                        isCurrent
                          ? 'bg-blue-600 text-white ring-2 ring-blue-600/30 shadow-md scale-105'
                          : isAnswered
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-black'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Question Card */}
            {currentQ && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold">
                    Soal Nomor {currentQuestionIndex + 1} dari {questions.length}
                  </span>
                  <span className="text-xs text-slate-400">Pilihan Ganda</span>
                </div>

                <div className="text-slate-900 font-semibold text-base sm:text-lg leading-relaxed">
                  {currentQ.question}
                </div>

                {/* Options */}
                <div className="space-y-3 pt-2">
                  {currentQ.options.map((opt, optIdx) => {
                    const isSelected = answers[currentQ.id] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => {
                          playQuizSelectOptionSound();
                          setAnswers((prev) => ({
                            ...prev,
                            [currentQ.id]: optIdx,
                          }));
                        }}
                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-3.5 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/60 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="text-xs sm:text-sm font-medium text-slate-800">
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Bottom Navigation: Prev, Next, Selesai */}
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30 transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Sebelumnya</span>
                  </button>

                  {currentQuestionIndex < questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md"
                    >
                      <span>Selanjutnya</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={submitting}
                      className="flex items-center gap-2 px-7 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow-lg shadow-emerald-600/20 active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{submitting ? 'Mengirimkan...' : 'Selesai & Kumpulkan'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODAL PERINGATAN KELUAR & ALARM BEEP GEDE */}
        {showExitWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border-4 border-rose-600 space-y-5 text-center">
              <div className="w-20 h-20 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner animate-bounce border-2 border-rose-200">
                <ShieldAlert className="w-10 h-10 text-rose-600" />
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest border border-rose-200">
                  KEAMANAN UJIAN KETAT
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  PERINGATAN! UJIAN SEDANG BERJALAN
                </h3>
                <p className="text-xs text-rose-600 font-bold leading-relaxed">
                  Anda sedang dalam sesi pengerjaan kuis. Selesaikan seluruh soal sebelum keluar agar jawaban Anda tersimpan dan ternilai secara resmi.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 text-left space-y-2">
                <p className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Alarm beep peringatan berbunyi saat tombol keluar ditekan sebelum selesai.</span>
                </p>
                <p className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pengaturan volume suara aplikasi dapat diatur leluasa di panel bagian atas.</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Tombol Keluar resmi</strong> akan otomatis tersedia setelah Anda selesai mengerjakan kuis.</span>
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowExitWarning(false)}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/30 transition transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>Lanjutkan Mengerjakan Kuis</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: LANDING PAGE ("YUK QUIZ!") vs ENTRANCE FORM ("Masuk Quiz")
  // -------------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 pb-24">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-bold text-blue-200 border border-white/10">
              <HelpCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>PORTAL EVALUASI & QUIZ TERVERIFIKASI</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">Halaman Quiz Siswa</h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
              Ikuti evaluasi pembelajaran dan uji pemahaman materi menggunakan token resmi yang dibagikan guru.
            </p>
          </div>
        </div>
      </div>

      {!isFormOpen ? (
        /* LANDING VIEW: MAIN PROMINENT BUTTON "YUK QUIZ!" */
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm max-w-xl mx-auto text-center space-y-8 animate-in fade-in duration-200">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/25 animate-pulse">
            <Sparkles className="w-12 h-12 stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-extrabold tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase">
              SIAP UJI KEMAMPUANMU?
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Ruang Quiz & Evaluasi Belajar
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Tekan tombol di bawah untuk memasukkan token kuis yang Anda peroleh dari guru mata pelajaran.
            </p>
          </div>

          {/* MAIN PROMINENT BUTTON "YUK QUIZ!" */}
          <div className="pt-2">
            <button
              onClick={() => {
                setVerifyError(null);
                setIsFormOpen(true);
              }}
              className="w-full py-4 sm:py-5 px-8 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-2xl font-black text-xl sm:text-2xl shadow-xl shadow-amber-500/30 transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 tracking-wider group"
            >
              <Sparkles className="w-6 h-6 text-slate-950 group-hover:rotate-12 transition-transform" />
              <span>YUK QUIZ!</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-left text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <strong className="block text-slate-900 font-bold mb-0.5">1. Siapkan Token</strong>
              <span className="text-[11px] text-slate-500">Minta token dari guru pengampu.</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <strong className="block text-slate-900 font-bold mb-0.5">2. Masuk Quiz</strong>
              <span className="text-[11px] text-slate-500">Validasi nama dan kode akses.</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <strong className="block text-slate-900 font-bold mb-0.5">3. Kerjakan Soal</strong>
              <span className="text-[11px] text-slate-500">Jawab sebelum waktu habis.</span>
            </div>
          </div>
        </div>
      ) : (
        /* ENTRANCE FORM: NAMA, TOKEN, KATA SANDI & TOMBOL "MASUK QUIZ" */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm max-w-lg mx-auto space-y-6 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
            <span className="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              Verifikasi Akses
            </span>
          </div>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-sm">
              <Key className="w-7 h-7 text-blue-600" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              Masuk ke Sesi Quiz
            </h2>
            <p className="text-xs text-slate-500">
              Masukkan nama peserta, token quiz, dan kata sandi jika diwajibkan oleh guru.
            </p>
          </div>

          {verifyError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-start gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{verifyError}</span>
            </div>
          )}

          <form onSubmit={handleVerifyAndStart} className="space-y-4">
            {/* Nama Peserta Quiz */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Peserta Quiz *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  required
                  placeholder="Nama lengkap peserta kuis"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-800"
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Token Quiz */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Token Quiz *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={quizToken}
                  onChange={(e) => setQuizToken(e.target.value.toUpperCase())}
                  required
                  placeholder="Contoh: TVQ-8291"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-black font-mono tracking-widest text-blue-800 uppercase"
                />
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                *Kode token diberikan oleh guru mata pelajaran.
              </p>
            </div>

            {/* Kata Sandi Quiz */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kata Sandi (Jika Diwajibkan Pengelola)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={quizPassword}
                  onChange={(e) => setQuizPassword(e.target.value)}
                  placeholder="Masukkan kata sandi jika ada"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-800"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Tombol Masuk Quiz */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={verifying}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/20 transition active:scale-98"
              >
                {verifying ? (
                  <span>Memvalidasi Data Masuk...</span>
                ) : (
                  <>
                    <span>Masuk Quiz</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-500 space-y-1.5">
            <p className="font-bold text-slate-700">Peraturan Sesi Quiz & Keamanan Anti-Curang:</p>
            <p>• Navigasi soal tersedia untuk berpindah antarsoal secara bebas.</p>
            <p>• Suara penanda beep berbunyi saat kuis dimulai, saat peringatan waktu 1 menit terakhir, dan saat memilih jawaban.</p>
            <p>• Volume suara aplikasi dapat disesuaikan secara bebas melalui panel pengaturan suara.</p>
            <p>• Setelah kuis selesai dikerjakan, tombol Keluar resmi akan otomatis tersedia bersama hasil nilai pengerjaan.</p>
          </div>
        </div>
      )}
    </div>
  );
};
