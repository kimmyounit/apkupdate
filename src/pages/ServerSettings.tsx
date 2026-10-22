import React, { useState, useEffect } from 'react';
import { getServerUrl, setServerUrl, clearServerUrl, pingServer } from '../lib/api.ts';
import { Wifi, WifiOff, Server, X, Check, Loader2, Info } from 'lucide-react';

interface ServerSettingsProps {
  onClose: () => void;
}

export function ServerSettings({ onClose }: ServerSettingsProps) {
  const [inputUrl, setInputUrl] = useState(getServerUrl());
  const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'fail'>('idle');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Auto-ping jika sudah ada URL
    const existing = getServerUrl();
    if (existing) {
      handlePing(existing);
    }
  }, []);

  async function handlePing(url?: string) {
    const target = url ?? inputUrl;
    if (!target.trim()) { setStatus('idle'); return; }
    setStatus('checking');
    // Simpan sementara untuk ping
    const prev = getServerUrl();
    setServerUrl(target.trim());
    const ok = await pingServer();
    if (!ok) setServerUrl(prev); // kembalikan jika gagal
    setStatus(ok ? 'ok' : 'fail');
  }

  function handleSave() {
    const trimmed = inputUrl.trim();
    if (trimmed) {
      setServerUrl(trimmed);
    } else {
      clearServerUrl();
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleClear() {
    setInputUrl('');
    clearServerUrl();
    setStatus('idle');
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">Server Laptop</h2>
              <p className="text-xs text-slate-400">Hubungkan HP ke server laptop</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Info box */}
          <div className="bg-blue-900/30 border border-blue-700/40 rounded-xl p-3 flex gap-2 text-xs text-blue-300">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Masukkan URL server laptop (contoh: <code className="font-mono bg-blue-900/40 px-1 rounded">http://192.168.1.2:3000</code>).
              HP dan laptop harus terhubung ke WiFi yang sama.
            </span>
          </div>

          {/* Input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">URL Server</label>
            <input
              type="url"
              value={inputUrl}
              onChange={e => { setInputUrl(e.target.value); setStatus('idle'); }}
              placeholder="http://192.168.1.2:3000"
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white
                         placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Status indicator */}
          {status !== 'idle' && (
            <div className={`flex items-center gap-2 text-xs rounded-xl px-3 py-2 
              ${status === 'checking' ? 'bg-slate-700 text-slate-300' :
                status === 'ok' ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/40' :
                'bg-rose-900/40 text-rose-400 border border-rose-700/40'}`}>
              {status === 'checking' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {status === 'ok' && <Wifi className="w-3.5 h-3.5" />}
              {status === 'fail' && <WifiOff className="w-3.5 h-3.5" />}
              <span>
                {status === 'checking' && 'Mengecek koneksi...'}
                {status === 'ok' && 'Server terdeteksi! Login akan sinkron otomatis.'}
                {status === 'fail' && 'Server tidak terdeteksi. Cek IP dan koneksi WiFi.'}
              </span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handlePing()}
              disabled={!inputUrl.trim() || status === 'checking'}
              className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-xs font-semibold
                         hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {status === 'checking' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />}
              Cek Koneksi
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold
                         flex items-center justify-center gap-1.5"
            >
              {saved ? <Check className="w-3.5 h-3.5" /> : <Server className="w-3.5 h-3.5" />}
              {saved ? 'Tersimpan!' : 'Simpan'}
            </button>
          </div>

          {inputUrl && (
            <button
              onClick={handleClear}
              className="w-full py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-900/20 rounded-xl"
            >
              Hapus — Kembali ke Mode Offline
            </button>
          )}
        </div>

        {/* Current status footer */}
        <div className="px-5 pb-5">
          <div className="bg-slate-800/50 rounded-xl p-3 text-xs text-slate-400">
            <span className="font-medium text-slate-300">Mode saat ini: </span>
            {getServerUrl() ? (
              <span className="text-blue-400">Online → {getServerUrl()}</span>
            ) : (
              <span className="text-amber-400">Offline (data lokal HP)</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
