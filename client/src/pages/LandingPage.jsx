import React from 'react';
import { Link } from 'react-router-dom';
import { Music, Tv, MessageSquare, Mic, Users, PlayCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 overflow-hidden pt-24 pb-12">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-brandCyan/10 rounded-full blur-[80px] -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-brandPink/10 rounded-full blur-[100px] -z-10 animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>

      {/* Hero Content */}
      <div className="w-full max-w-5xl text-center z-10 flex flex-col items-center">
        {/* Animated Wave visualizer */}
        <div className="flex items-end justify-center space-x-1.5 h-10 mb-6">
          <div className="w-1.5 bg-brandCyan rounded-full animate-music-wave bar-1"></div>
          <div className="w-1.5 bg-brandPink rounded-full animate-music-wave bar-2"></div>
          <div className="w-1.5 bg-brandCyan rounded-full animate-music-wave bar-3"></div>
          <div className="w-1.5 bg-brandPink rounded-full animate-music-wave bar-4"></div>
          <div className="w-1.5 bg-brandCyan rounded-full animate-music-wave bar-5"></div>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          Listen to Music <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brandCyan via-white to-brandPink">
            Together, in Real-Time
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 font-normal leading-relaxed">
          Create synchronized music rooms, chat, sing along with interactive karaoke lyrics, and talk in live voice chat with friends!
        </p>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
          <Link
            to="/register"
            className="flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-brandCyan to-brandPink text-darkBg font-bold text-lg rounded-full shadow-neon-pink hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <PlayCircle className="w-5 h-5 text-darkBg" />
            <span>Start Listening Free</span>
          </Link>
          
          <Link
            to="/login"
            className="flex items-center justify-center px-8 py-4 glass-panel text-slate-200 font-semibold text-lg rounded-full hover:bg-white/10 active:scale-95 transition-all duration-200"
          >
            Join Existing Room
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl text-left">
          {/* Card 1 */}
          <div className="glass-panel p-8 rounded-3xl glass-panel-hover flex flex-col space-y-4">
            <div className="p-3 w-fit bg-brandCyan/15 text-brandCyan rounded-2xl">
              <Tv className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Synced YouTube</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Every client plays YouTube songs synchronized down to the second. Perfect for shared movie tracks, visualizers, or playlist mixes.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-8 rounded-3xl glass-panel-hover flex flex-col space-y-4">
            <div className="p-3 w-fit bg-brandPink/15 text-brandPink rounded-2xl">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Karaoke Lyrics</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Turn on Karaoke Mode! Timed, scrolling lyrics highlight as the song plays, helping your group sing along in perfect synchronization.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-8 rounded-3xl glass-panel-hover flex flex-col space-y-4">
            <div className="p-3 w-fit bg-purple-500/15 text-purple-400 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">WebRTC Voice Chat</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Ditch external applications. Use our high-fidelity, peer-to-peer live voice rooms. Features talking indicators and microphome toggles.
            </p>
          </div>
        </div>

        {/* Info text */}
        <div className="mt-16 text-xs text-slate-500 flex items-center space-x-2">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Real-time text chat with emojis and admin controls is built-in.</span>
        </div>
      </div>
    </div>
  );
}
