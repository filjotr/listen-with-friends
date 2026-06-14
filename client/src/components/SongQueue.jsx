import React, { useState } from 'react';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/config';
import { popularSongs } from '../utils/popularSongs';
import { Search, Plus, Trash2, ListMusic, Link, Compass, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react';

export default function SongQueue() {
  const { queue, addToQueue, removeFromQueue } = useRoom();
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' or 'search'
  
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);

  // Custom link parser helper
  const handleCustomLinkSubmit = (e) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    // Parse YouTube ID
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = customUrl.trim().match(regExp);
    
    if (match && match[2].length === 11) {
      const videoId = match[2];
      
      const songObj = {
        videoId,
        title: `YouTube Track (${videoId})`,
        channelTitle: 'External Stream',
        duration: 180, // Default fallback duration
        thumbnail: `https://img.youtube.com/vi/${videoId}/0.jpg`
      };

      addToQueue(songObj);
      setCustomUrl('');
      setActiveTab('queue');
    } else {
      alert('Invalid YouTube URL! Please insert a valid video URL.');
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/rooms/search-yt?q=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSearchResults(data.results || []);
        setHasSearched(true);
      }
    } catch (err) {
      console.error('YouTube search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleAddPopular = (song) => {
    addToQueue(song);
    setActiveTab('queue');
  };

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Get display songs (searched results or preset fallbacks)
  const displaySongs = hasSearched ? searchResults : popularSongs;

  return (
    <div className="glass-panel rounded-2xl flex flex-col h-[380px] md:h-[450px] overflow-hidden">
      {/* Tabs */}
      <div className="flex flex-shrink-0 p-2 gap-2 bg-black/5">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'queue'
              ? 'glass-input text-brandCyan font-extrabold'
              : 'text-muted hover:text-brandCyan'
          }`}
        >
          <ListMusic className="w-4 h-4" />
          <span>Queue ({queue.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'search'
              ? 'glass-input text-brandPink font-extrabold'
              : 'text-muted hover:text-brandPink'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Find Music</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'queue' ? (
          /* Queue List */
          queue.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted text-xs py-12">
              <span>No songs in queue</span>
              <button 
                onClick={() => setActiveTab('search')} 
                className="mt-3 text-xs text-brandCyan font-semibold hover:underline cursor-pointer"
              >
                Find & Add Songs
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {queue.map((song, idx) => (
                <div 
                  key={song._id || idx} 
                  className="p-3.5 glass-panel rounded-xl flex items-center justify-between transition-all"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="text-xs text-muted font-bold w-4">{idx + 1}</span>
                    <div className="w-9 h-9 rounded overflow-hidden flex-shrink-0 neumorph-btn p-0.5">
                      <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover rounded" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-main truncate">{song.title}</h4>
                      <p className="text-[10px] text-muted truncate mt-0.5">{song.channelTitle}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] text-muted font-semibold">{formatDuration(song.duration)}</span>
                    <button
                      onClick={() => removeFromQueue(song._id)}
                      className="p-2 neumorph-btn text-muted hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Search / Add Panel */
          <div className="space-y-4 flex flex-col h-full">
            {/* Primary YouTube Search */}
            <div className="flex flex-col space-y-2 flex-shrink-0">
              <label className="text-[10px] text-muted font-semibold uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <Search className="w-3.5 h-3.5 text-brandCyan" />
                  <span>Search YouTube</span>
                </span>
                {hasSearched && (
                  <button 
                    onClick={handleClearSearch}
                    className="text-brandPink hover:underline flex items-center space-x-0.5 cursor-pointer font-bold lowercase"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </label>
              
              <form onSubmit={handleSearchSubmit} className="flex space-x-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search songs, artists, channels..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2.5 pr-8 text-xs rounded-xl glass-input text-main"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-brandPink cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 neumorph-btn text-brandCyan font-bold rounded-xl text-xs flex items-center justify-center cursor-pointer active:scale-95"
                >
                  {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                </button>
              </form>
            </div>

            {/* Collapsible Direct URL Input */}
            <div className="flex flex-col flex-shrink-0 border-t border-black/5 pt-3">
              <button
                type="button"
                onClick={() => setShowLinkInput(!showLinkInput)}
                className="text-[10px] text-muted font-bold flex items-center space-x-1 hover:text-brandPink transition-colors focus:outline-none cursor-pointer self-start"
              >
                <Link className="w-3.5 h-3.5 text-brandPink" />
                <span>Or add by direct YouTube URL</span>
                {showLinkInput ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showLinkInput && (
                <form onSubmit={handleCustomLinkSubmit} className="flex space-x-2 mt-2">
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl glass-input text-main"
                  />
                  <button
                    type="submit"
                    className="px-4 neumorph-btn text-brandPink font-bold rounded-xl text-xs active:scale-95 transition-all cursor-pointer"
                  >
                    Add
                  </button>
                </form>
              )}
            </div>

            {/* Songs List */}
            <div className="flex flex-col space-y-2.5 flex-1 overflow-hidden border-t border-black/5 pt-3">
              <label className="text-[10px] text-muted font-semibold uppercase tracking-wider">
                {hasSearched ? 'Search Results' : 'Featured Presets'}
              </label>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {displaySongs.length === 0 ? (
                  <p className="text-center text-muted text-xs py-6">No matching tracks found</p>
                ) : (
                  displaySongs.map((song) => (
                    <div 
                      key={song.videoId} 
                      className="p-3 glass-panel rounded-xl flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-9 h-9 rounded overflow-hidden flex-shrink-0 neumorph-btn p-0.5">
                          <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover rounded" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-main truncate">{song.title}</h4>
                          <p className="text-[10px] text-muted truncate mt-0.5">{song.channelTitle}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddPopular(song)}
                        className="p-2 neumorph-btn text-brandCyan rounded-lg transition-all cursor-pointer active:scale-95 hover:scale-105"
                        title="Add to queue"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
