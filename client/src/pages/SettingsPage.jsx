import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Sliders, Volume2, Mic, Wifi } from 'lucide-react';
import { API_BASE_URL, SOCKET_URL } from '../utils/config';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [defaultVolume, setDefaultVolume] = useState(localStorage.getItem('setting_volume') || '50');
  const [micSensitivity, setMicSensitivity] = useState(localStorage.getItem('setting_sensitivity') || '60');
  const [latencyOffset, setLatencyOffset] = useState(localStorage.getItem('setting_latency') || '0');
  const [apiUrl, setApiUrl] = useState(API_BASE_URL);
  
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('setting_volume', defaultVolume);
    localStorage.setItem('setting_sensitivity', micSensitivity);
    localStorage.setItem('setting_latency', latencyOffset);
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen px-4 md:px-12 pt-24 pb-12 max-w-3xl mx-auto flex flex-col space-y-8 relative bg-[var(--base-bg)] text-main">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2.5 neumorph-btn rounded-xl text-muted hover:text-brandCyan transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-3xl font-extrabold text-main">Application Settings</h2>
          <p className="text-muted text-sm mt-1">Configure audio, voice chat thresholds, and endpoint connection variables</p>
        </div>
      </div>

      {saved && (
        <div className="flex items-center space-x-2 text-sm text-green-500 bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
          <span>Settings saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="glass-panel p-6 md:p-8 rounded-3xl flex flex-col space-y-6">
        
        {/* Audio Defaults */}
        <div className="flex flex-col space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-brandCyan flex items-center space-x-2">
            <Volume2 className="w-4 h-4" />
            <span>Audio & Playback</span>
          </h3>

          <div className="flex flex-col space-y-2">
            <div className="flex justify-between text-xs text-muted font-semibold">
              <span>Default Song Volume</span>
              <span>{defaultVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={defaultVolume}
              onChange={(e) => setDefaultVolume(e.target.value)}
              className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-brandCyan"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <div className="flex justify-between text-xs text-muted font-semibold">
              <span>Buffer Latency Adjustment (ms)</span>
              <span>{latencyOffset}ms</span>
            </div>
            <input
              type="range"
              min="-1000"
              max="1000"
              step="50"
              value={latencyOffset}
              onChange={(e) => setLatencyOffset(e.target.value)}
              className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-brandCyan"
            />
            <p className="text-[10px] text-muted leading-relaxed">
              If your video is consistently out of sync, adjust this offset to shift audio frames.
            </p>
          </div>
        </div>

        <hr className="border-black/5 dark:border-white/5" />

        {/* Microphone Settings */}
        <div className="flex flex-col space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-brandPink flex items-center space-x-2">
            <Mic className="w-4 h-4" />
            <span>Voice Chat (WebRTC)</span>
          </h3>

          <div className="flex flex-col space-y-2">
            <div className="flex justify-between text-xs text-muted font-semibold">
              <span>Speaking Activation Sensitivity</span>
              <span>{micSensitivity}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={micSensitivity}
              onChange={(e) => setMicSensitivity(e.target.value)}
              className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-brandPink"
            />
            <p className="text-[10px] text-muted leading-relaxed">
              Sets the decibel threshold required to light up the speaking indicator card.
            </p>
          </div>
        </div>

        <hr className="border-black/5 dark:border-white/5" />

        {/* Network & Endpoints */}
        <div className="flex flex-col space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center space-x-2">
            <Wifi className="w-4 h-4" />
            <span>Server Connections</span>
          </h3>

          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] text-muted font-semibold uppercase tracking-wider">REST API Address</label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              disabled
              className="px-4 py-2.5 rounded-xl glass-input text-xs text-muted cursor-not-allowed opacity-60 bg-transparent"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] text-muted font-semibold uppercase tracking-wider">Socket Server URL</label>
            <input
              type="text"
              value={SOCKET_URL}
              disabled
              className="px-4 py-2.5 rounded-xl glass-input text-xs text-muted cursor-not-allowed opacity-60 bg-transparent"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 neumorph-btn text-main font-extrabold rounded-xl active:scale-95 transition-all duration-200 flex items-center justify-center space-x-2 text-sm cursor-pointer"
        >
          <Save className="w-4.5 h-4.5 text-brandCyan" />
          <span>Save Settings Preferences</span>
        </button>
      </form>
    </div>
  );
}
