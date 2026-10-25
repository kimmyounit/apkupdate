import React, { useState } from 'react';
import { X, ShieldAlert, Users, Search, Moon, Sun, Award, HelpCircle, Eye, EyeOff } from 'lucide-react';

interface GameRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'spy' | 'mafia';
}

export const GameRulesModal: React.FC<GameRulesModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'spy',
}) => {
  const [activeTab, setActiveTab] = useState<'spy' | 'mafia'>(defaultTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-emerald-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-tight">Panduan & Cara Bermain</h3>
              <p className="text-xs text-slate-300">Aturan resmi Permainan Siswa TAMVESTA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 p-2 bg-slate-50 gap-2">
          <button
            onClick={() => setActiveTab('spy')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'spy'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Who's the Spy</span>
          </button>
          <button
            onClick={() => setActiveTab('mafia')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'mafia'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Mafia (Moderator Otomatis)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-xs sm:text-sm leading-relaxed">
          {/* School Policy Notice */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Aturan Resmi Penggunaan di Sekolah</strong>
              <span>
                Fitur ini khusus dimainkan bersama teman saat <strong>jam istirahat</strong> atau <strong>jam kosong</strong>. Dilarang keras bermain saat Kegiatan Belajar Mengajar (KBM) sedang berlangsung!
              </span>
            </div>
          </div>

          {activeTab === 'spy' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">1</span>
                  Tujuan Permainan
                </h4>
                <p>
                  <strong>Who's the Spy</strong> adalah permainan deduksi kata di mana mayoritas pemain mendapatkan kata rahasia yang sama (<strong>Pemain Biasa</strong>), sedangkan satu atau dua orang (<strong>Imposter</strong>) mendapatkan kata yang sedikit berbeda namun masih mirip!
                </p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs font-mono">
                  <p>Contoh: Pemain Biasa: <strong>"Pantai"</strong> vs Imposter: <strong>"Kolam Renang"</strong></p>
                  <p>Contoh lain: <strong>"Kucing"</strong> vs <strong>"Harimau"</strong>, <strong>"Nasi Goreng"</strong> vs <strong>"Mi Goreng"</strong></p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">2</span>
                  Alur Permainan
                </h4>
                <ol className="list-decimal pl-5 space-y-1.5">
                  <li><strong>Pembagian Kata:</strong> Sistem membagikan kata rahasia secara otomatis dan privat ke layar perangkat masing-masing pemain.</li>
                  <li><strong>Pemberian Petunjuk:</strong> Pemain bergiliran memberikan satu kalimat petunjuk tentang kata miliknya tanpa menyebutkan kata itu secara langsung.</li>
                  <li><strong>Diskusi:</strong> Semua pemain berdiskusi untuk mencari kejanggalan pada petunjuk teman yang dicurigai sebagai Imposter.</li>
                  <li><strong>Voting Eliminasi:</strong> Setiap pemain memberikan 1 suara untuk mencurigai satu orang. Pemain dengan suara terbanyak akan dieliminasi!</li>
                  <li><strong>Tebak Kata (Opsional):</strong> Jika Imposter tertangkap, Imposter memiliki 1 kesempatan untuk menebak kata pemain biasa untuk membalikkan kemenangan!</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">3</span>
                  Kondisi Kemenangan
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Pemain Biasa Menang:</strong> Jika seluruh Imposter berhasil ditemukan dan dieliminasi melalui voting.</li>
                  <li><strong>Imposter Menang:</strong> Jika berhasil bertahan hingga jumlah Imposter tersisa sama dengan atau melebihi jumlah pemain biasa, atau berhasil menebak kata pemain biasa!</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 text-xs font-black flex items-center justify-center">1</span>
                  Moderator Otomatis TAMVESTA
                </h4>
                <p>
                  Permainan Mafia di TAMVESTA <strong>tidak memerlukan moderator manusia!</strong> Aplikasi akan mengambil alih peran narator/moderator secara otomatis: mengatur pergantian malam dan siang, mengumpulkan aksi rahasia, menghitung timer, dan memvalidasi voting tanpa ada kebocoran rahasia.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 text-xs font-black flex items-center justify-center">2</span>
                  Peran-Peran Rahasia
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                    <strong className="text-rose-900 block font-bold">🔴 Mafia</strong>
                    <span className="text-rose-700">Bekerja sama secara rahasia memilih satu warga untuk dieliminasi setiap malam hari.</span>
                  </div>
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl">
                    <strong className="text-teal-900 block font-bold">💉 Dokter</strong>
                    <span className="text-teal-700">Memilih satu pemain untuk dilindungi setiap malam. Jika orang yang dilindungi diserang Mafia, ia selamat!</span>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <strong className="text-blue-900 block font-bold">🔍 Detektif</strong>
                    <span className="text-blue-700">Memeriksa satu pemain setiap malam untuk mengetahui apakah ia Mafia atau Warga Baik.</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <strong className="text-slate-900 block font-bold">👤 Warga Kota</strong>
                    <span className="text-slate-700">Menganalisis tingkah laku, berdiskusi, dan mencari siapa anggota Mafia pada siang hari.</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 text-xs font-black flex items-center justify-center">3</span>
                  Fase Permainan (Malam & Siang)
                </h4>
                <ol className="list-decimal pl-5 space-y-1.5">
                  <li><strong>Fase Malam:</strong> Layar berubah menjadi suasana malam. Mafia memilih target, Dokter memilih yang dilindungi, dan Detektif memilih yang diperiksa melalui layar privat.</li>
                  <li><strong>Fase Siang:</strong> Sistem mengumumkan hasil malam (korban tewas atau berhasil diselamatkan). Warga kota berdiskusi selama hitungan mundur.</li>
                  <li><strong>Voting Siang:</strong> Seluruh pemain hidup memberikan 1 suara untuk mengeliminasi orang yang paling dicurigai sebagai Mafia.</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 text-xs font-black flex items-center justify-center">4</span>
                  Kondisi Kemenangan
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Warga Kota Menang:</strong> Apabila seluruh anggota Mafia berhasil dieliminasi!</li>
                  <li><strong>Mafia Menang:</strong> Apabila jumlah anggota Mafia yang masih hidup menyamai atau melebihi jumlah warga kota yang masih hidup!</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
          >
            Saya Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};
