import React, { useState, useEffect, useRef } from 'react';
import { useRoom } from '../context/RoomContext';
import { getLyricsForSong } from '../utils/popularSongs';
import { Mic, Maximize2, Minimize2, Sparkles } from 'lucide-react';

export default function KaraokeLyrics() {
  const { currentSong } = useRoom();
  const [lyrics, setLyrics] = useState([]);
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const containerRef = useRef(null);
  const lineRefs = useRef([]);

  // Load lyrics on song change
  useEffect(() => {
    if (currentSong?.videoId) {
      const parsedLyrics = getLyricsForSong(currentSong.videoId, currentSong.title);
      setLyrics(parsedLyrics);
      setActiveLineIndex(-1);
      setElapsedTime(currentSong.playbackTime || 0);
    } else {
      setLyrics([]);
    }
  }, [currentSong?.videoId, currentSong?.title]);

  // Keep local clock in sync with isPlaying state
  useEffect(() => {
    setElapsedTime(currentSong?.playbackTime || 0);

    if (!currentSong?.isPlaying || !currentSong?.videoId) return;

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 0.25); // increment by 250ms for ultra-smooth scrolling
    }, 250);

    return () => clearInterval(interval);
  }, [currentSong?.isPlaying, currentSong?.playbackTime, currentSong?.videoId]);

  // Determine active lyric line
  useEffect(() => {
    if (lyrics.length === 0) return;

    let index = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (elapsedTime >= lyrics[i].time) {
        index = i;
      } else {
        break;
      }
    }

    if (index !== activeLineIndex && index !== -1) {
      setActiveLineIndex(index);

      // Smooth scroll into focus
      if (lineRefs.current[index]) {
        lineRefs.current[index].scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [elapsedTime, lyrics, activeLineIndex]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const renderLyricsList = (isLargeText = false) => {
    if (lyrics.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm">
          <span>No lyrics loaded for this track</span>
        </div>
      );
    }

    return (
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-8 space-y-6 scroll-smooth select-none max-h-[300px] md:max-h-[400px]"
      >
        {lyrics.map((line, idx) => {
          const isActive = idx === activeLineIndex;
          return (
            <div
              key={idx}
              ref={el => lineRefs.current[idx] = el}
              className={`transition-all duration-300 origin-left ${
                isActive 
                  ? `${isLargeText ? 'text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brandCyan to-white scale-105' : 'text-lg font-bold text-brandCyan scale-102'} opacity-100` 
                  : `${isLargeText ? 'text-2xl md:text-3xl font-bold text-slate-600' : 'text-sm font-medium text-slate-400'} hover:text-slate-200 cursor-pointer opacity-50`
              }`}
              onClick={() => {
                // Clicking a lyric does nothing or syncs seek (keep simple)
              }}
            >
              {line.text}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Standard Lyrics Card */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col border-white/5 h-[380px] md:h-[450px]">
        {/* Title */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
          <div className="flex items-center space-x-2">
            <Mic className="w-4 h-4 text-brandPink" />
            <h3 className="font-bold text-slate-200 text-sm">Karaoke Mode</h3>
          </div>
          {currentSong?.videoId && (
            <button
              onClick={toggleFullscreen}
              className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
              title="Fullscreen Lyrics"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Lyrics Scroll body */}
        {renderLyricsList(false)}
      </div>

      {/* Immersive Apple-music Fullscreen View */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-[#080a10]/95 backdrop-blur-3xl z-[100] flex flex-col animate-fadeIn">
          {/* Ambient Blurred colors */}
          <div className="absolute top-1/4 left-1/4 w-[35vw] h-[35vw] bg-brandCyan/10 rounded-full blur-[120px] -z-10 animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[35vw] h-[35vw] bg-brandPink/10 rounded-full blur-[120px] -z-10 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

          {/* Fullscreen Header */}
          <div className="flex justify-between items-center px-8 md:px-16 py-6 border-b border-white/5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 overflow-hidden border border-white/5">
                <img src={currentSong.thumbnail} alt={currentSong.title} className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-100 text-sm md:text-base">{currentSong.title}</h4>
                <p className="text-xs text-slate-400">{currentSong.channelTitle}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-1.5 text-xs text-brandPink font-bold uppercase tracking-wider bg-brandPink/10 px-3 py-1.5 rounded-full border border-brandPink/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Live Singing Session</span>
              </div>
              <button
                onClick={toggleFullscreen}
                className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 transition-all border border-white/5"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Fullscreen Lyrics body */}
          <div className="flex-1 flex flex-col justify-center max-w-5xl mx-auto w-full px-8 md:px-16 overflow-hidden">
            {lyrics.length === 0 ? (
              <div className="text-center text-slate-500">No lyrics available</div>
            ) : (
              <div 
                ref={containerRef}
                className="h-[70vh] overflow-y-auto space-y-12 py-[35vh] scroll-smooth select-none pr-4"
                style={{ scrollbarWidth: 'none' }}
              >
                {lyrics.map((line, idx) => {
                  const isActive = idx === activeLineIndex;
                  return (
                    <div
                      key={idx}
                      ref={el => lineRefs.current[idx] = el}
                      className={`transition-all duration-500 origin-left text-3xl sm:text-4xl md:text-5xl lg:text-6xl ${
                        isActive 
                          ? 'font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brandCyan via-white to-brandPink scale-102 opacity-100 filter drop-shadow-[0_0_20px_rgba(0,240,255,0.15)]' 
                          : 'font-semibold text-slate-500/40 hover:text-slate-300 cursor-pointer'
                      }`}
                    >
                      {line.text}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
