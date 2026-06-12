import React, { useEffect, useRef, useState } from 'react';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { Play, Pause, SkipForward, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';

export default function YouTubePlayer() {
  const { room, currentSong, syncMusic, skipSong } = useRoom();
  const { user } = useAuth();
  
  const hostId = room?.host?._id || room?.host;
  const userId = user?._id || user?.id;
  const isHost = hostId && userId && hostId.toString() === userId.toString();

  const playerRef = useRef(null);
  const containerId = 'youtube-iframe-player';
  const syncIntervalRef = useRef(null);
  const preventLoopRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  // Initialize YT Player API
  useEffect(() => {
    // Check if script already exists
    let tag = document.getElementById('youtube-iframe-script');
    if (!tag) {
      tag = document.createElement('script');
      tag.id = 'youtube-iframe-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (playerRef.current) return;

      playerRef.current = new window.YT.Player(containerId, {
        height: '100%',
        width: '100%',
        videoId: currentSong?.videoId || '',
        playerVars: {
          autoplay: 0,
          controls: 0, // Hide standard YT controls for premium look
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3
        },
        events: {
          onReady: (event) => {
            setReady(true);
            event.target.setVolume(volume);
            if (currentSong?.videoId) {
              syncToRoomState(currentSong, event.target);
            }
          },
          onStateChange: (event) => {
            handlePlayerStateChange(event);
          }
        }
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  // Sync to Room state updates from Socket
  useEffect(() => {
    if (!ready || !playerRef.current || !currentSong?.videoId) return;

    // To prevent feedback loops, we skip if we are already in the process of applying a state update
    if (preventLoopRef.current) {
      preventLoopRef.current = false;
      return;
    }

    syncToRoomState(currentSong, playerRef.current);
  }, [currentSong, ready]);

  // Synchronize Player object with currentSong state
  const syncToRoomState = (songState, player) => {
    if (!player || typeof player.getPlayerState !== 'function') return;

    const playerState = player.getPlayerState();
    
    // 1. Load song if videoId changed
    const currentVideoId = player.getVideoUrl() ? parseVideoIdFromUrl(player.getVideoUrl()) : null;
    if (currentVideoId !== songState.videoId) {
      player.cueVideoById({
        videoId: songState.videoId,
        startSeconds: songState.playbackTime || 0
      });
    }

    // 2. Play / Pause
    if (songState.isPlaying && playerState !== window.YT.PlayerState.PLAYING) {
      player.playVideo();
    } else if (!songState.isPlaying && playerState === window.YT.PlayerState.PLAYING) {
      player.pauseVideo();
    }

    // 3. Time Seek (if difference is > 3 seconds)
    const playerTime = player.getCurrentTime() || 0;
    const diff = Math.abs(playerTime - songState.playbackTime);
    if (diff > 3) {
      player.seekTo(songState.playbackTime, true);
    }
  };

  const parseVideoIdFromUrl = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Handle player state changes
  const handlePlayerStateChange = (event) => {
    const state = event.data;
    
    if (state === window.YT.PlayerState.PLAYING) {
      // Start progress tracking interval
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = setInterval(() => {
        if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;
        const currentTime = playerRef.current.getCurrentTime() || 0;
        const duration = playerRef.current.getDuration() || 1;
        setProgress((currentTime / duration) * 100);

        // Host periodically pushes sync updates to backend
        if (isHost && !preventLoopRef.current) {
          syncMusic({
            isPlaying: true,
            playbackTime: currentTime
          });
        }
      }, 1000);
    } else {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    }
  };

  // Host Action wrappers
  const handlePlayPause = () => {
    if (!ready || !playerRef.current) return;
    
    // If not host, ignore clicks
    if (!isHost) return;

    const playerState = playerRef.current.getPlayerState();
    const isPlaying = playerState === window.YT.PlayerState.PLAYING;
    const currentTime = playerRef.current.getCurrentTime() || 0;

    preventLoopRef.current = true;
    if (isPlaying) {
      playerRef.current.pauseVideo();
      syncMusic({ isPlaying: false, playbackTime: currentTime });
    } else {
      playerRef.current.playVideo();
      syncMusic({ isPlaying: true, playbackTime: currentTime });
    }
  };

  const handleProgressBarChange = (e) => {
    if (!ready || !playerRef.current || !isHost) return;
    
    const percentage = parseFloat(e.target.value);
    const duration = playerRef.current.getDuration() || 0;
    const newTime = (percentage / 100) * duration;

    preventLoopRef.current = true;
    playerRef.current.seekTo(newTime, true);
    setProgress(percentage);
    
    const isPlaying = playerRef.current.getPlayerState() === window.YT.PlayerState.PLAYING;
    syncMusic({
      isPlaying,
      playbackTime: newTime
    });
  };

  const handleVolumeChange = (e) => {
    if (!ready || !playerRef.current) return;
    const val = parseInt(e.target.value);
    setVolume(val);
    playerRef.current.setVolume(val);
    if (val > 0) setIsMuted(false);
  };

  const toggleLocalMute = () => {
    if (!ready || !playerRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    playerRef.current.setVolume(nextMuted ? 0 : volume);
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const activeDuration = playerRef.current && typeof playerRef.current.getDuration === 'function' 
    ? playerRef.current.getDuration() 
    : currentSong.duration || 0;

  const activeCurrentTime = playerRef.current && typeof playerRef.current.getCurrentTime === 'function' 
    ? playerRef.current.getCurrentTime() 
    : currentSong.playbackTime || 0;

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Visualizer Frame */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden glass-panel border-white/5 shadow-glass-glow flex items-center justify-center bg-black/60">
        
        {/* Main Video Iframe */}
        <div 
          id={containerId} 
          className={`w-full h-full pointer-events-none transition-opacity duration-500 ${currentSong?.videoId ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Empty state overlay */}
        {!currentSong?.videoId && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 p-6 text-center">
            <div className="p-4 bg-brandCyan/10 text-brandCyan rounded-full animate-bounce">
              <Play className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-300">Queue is empty</h4>
            <p className="text-xs text-slate-500 max-w-xs">
              Search a song in the right panel or input a YouTube link to sync music!
            </p>
          </div>
        )}
      </div>

      {/* Spotify Custom controls */}
      {currentSong?.videoId && (
        <div className="glass-panel p-5 rounded-2xl flex flex-col space-y-4 border-white/5">
          {/* Metadata Display */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-white/5 overflow-hidden flex-shrink-0">
                <img 
                  src={currentSong.thumbnail || `https://img.youtube.com/vi/${currentSong.videoId}/0.jpg`} 
                  alt={currentSong.title} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-slate-100 text-sm truncate">{currentSong.title}</h4>
                <p className="text-xs text-slate-400 truncate mt-0.5">{currentSong.channelTitle}</p>
              </div>
            </div>
            
            <div className="text-[10px] text-slate-500 bg-white/5 px-2 py-1 rounded-md font-semibold">
              Added by {currentSong.addedBy || 'Host'}
            </div>
          </div>

          {/* Timeline Bar */}
          <div className="flex items-center space-x-3 text-xs text-slate-400">
            <span>{formatTime(activeCurrentTime)}</span>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleProgressBarChange}
              disabled={!isHost}
              className={`flex-1 h-1.5 rounded-full appearance-none outline-none bg-slate-700 cursor-pointer accent-brandCyan ${!isHost && 'opacity-60 pointer-events-none'}`}
              style={{
                background: `linear-gradient(to right, #00F0FF 0%, #00F0FF ${progress}%, #334155 ${progress}%, #334155 100%)`
              }}
            />
            <span>{formatTime(activeDuration)}</span>
          </div>

          {/* Control Actions */}
          <div className="flex items-center justify-between">
            {/* Host Controls */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handlePlayPause}
                disabled={!isHost}
                className={`w-11 h-11 rounded-full flex items-center justify-center text-darkBg bg-gradient-to-tr from-brandCyan to-brandPink shadow-neon-pink hover:scale-105 active:scale-95 transition-transform ${!isHost && 'opacity-50 cursor-not-allowed'}`}
                title={isHost ? (currentSong.isPlaying ? 'Pause' : 'Play') : 'Host is playing'}
              >
                {currentSong.isPlaying ? (
                  <Pause className="w-5 h-5 text-darkBg fill-darkBg" />
                ) : (
                  <Play className="w-5 h-5 text-darkBg fill-darkBg pl-0.5" />
                )}
              </button>

              <button
                onClick={skipSong}
                disabled={!isHost}
                className={`p-2.5 rounded-xl border border-white/5 hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors ${!isHost && 'opacity-50 cursor-not-allowed'}`}
                title="Skip Track"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Volume controls */}
            <div className="flex items-center space-x-3">
              <button 
                onClick={toggleLocalMute} 
                className="p-2 text-slate-400 hover:text-slate-200 transition-colors hover:bg-white/5 rounded-full"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 sm:w-28 h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-slate-300"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
