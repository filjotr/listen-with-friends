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
        <div className="flex-1 flex flex-col items-center justify-center text-muted text-sm">
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
                  ? `${isLargeText ? 'text-4xl md:text-5xl font-extrabold text-brandCyan scale-105' : 'text-lg font-bold text-brandCyan scale-102'} opacity-100` 
                  : `${isLargeText ? 'text-2xl md:text-3xl font-bold text-muted/40' : 'text-sm font-medium text-muted'} hover:text-main cursor-pointer`
              }`}
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
      <div className="glass-panel p-5 rounded-2xl flex flex-col h-[380px] md:h-[450px]">
        {/* Title */}
        <div className="flex items-center justify-between pb-2 mb-3">
          <div className="flex items-center space-x-2">
            <Mic className="w-4 h-4 text-brandPink" />
            <h3 className="font-bold text-main text-sm">Karaoke Mode</h3>
          </div>
          {currentSong?.videoId && (
            <button
              onClick={toggleFullscreen}
              className="p-2 neumorph-btn text-muted hover:text-brandPink rounded-lg transition-colors cursor-pointer"
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
        <div className="fixed inset-0 bg-[var(--base-bg)] z-[100] flex flex-col animate-fadeIn text-main">
          {/* Fullscreen Header */}
          <div className="flex justify-between items-center px-8 md:px-16 py-6 border-b border-black/5 dark:border-white/5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden neumorph-btn p-0.5">
                <img src={currentSong.thumbnail} alt={currentSong.title} className="w-full h-full object-cover rounded" />
              </div>
              <div>
                <h4 className="font-extrabold text-main text-sm md:text-base">{currentSong.title}</h4>
                <p className="text-xs text-muted">{currentSong.channelTitle}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-1.5 text-xs text-brandPink font-bold uppercase tracking-wider neumorph-btn px-3 py-1.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Live Singing Session</span>
              </div>
              <button
                onClick={toggleFullscreen}
                className="p-2.5 neumorph-btn text-muted transition-all cursor-pointer"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Fullscreen Lyrics body */}
          <div className="flex-1 flex flex-col justify-center max-w-5xl mx-auto w-full px-8 md:px-16 overflow-hidden">
            {lyrics.length === 0 ? (
              <div className="text-center text-muted">No lyrics available</div>
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
                          ? 'font-extrabold text-brandCyan scale-102 opacity-100' 
                          : 'font-semibold text-muted/40 hover:text-main cursor-pointer'
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
