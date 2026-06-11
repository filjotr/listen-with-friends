import React, { useState } from 'react';
import { useRoom } from '../context/RoomContext';
import { popularSongs } from '../utils/popularSongs';
import { Search, Plus, Trash2, ListMusic, Link, Compass } from 'lucide-react';

export default function SongQueue() {
  const { queue, addToQueue, removeFromQueue, room } = useRoom();
  const [searchQuery, setSearchQuery] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' or 'search'

  // Curated search results filtering
  const filteredPopularSongs = popularSongs.filter(song => 
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.channelTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Custom link parser helper
  const handleCustomLinkSubmit = (e) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    // Parse YouTube ID
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = customUrl.trim().match(regExp);
    
    if (match && match[2].length === 11) {
      const videoId = match[2];
      
      // Parse a nice custom title from URL if possible, or give a default
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

  const handleAddPopular = (song) => {
    addToQueue(song);
    setActiveTab('queue');
  };

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="glass-panel rounded-2xl border-white/5 flex flex-col h-[380px] md:h-[450px] overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-white/5 flex-shrink-0">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 border-b-2 transition-all ${
            activeTab === 'queue'
              ? 'border-brandCyan text-brandCyan bg-white/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ListMusic className="w-4 h-4" />
          <span>Queue ({queue.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 border-b-2 transition-all ${
            activeTab === 'search'
              ? 'border-brandPink text-brandPink bg-white/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
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
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-12">
              <span>No songs in queue</span>
              <button 
                onClick={() => setActiveTab('search')} 
                className="mt-3 text-xs text-brandCyan font-semibold hover:underline"
              >
                Find & Add Songs
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {queue.map((song, idx) => (
                <div 
                  key={song._id || idx} 
                  className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between group hover:border-brandCyan/20 transition-all"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="text-xs text-slate-500 font-bold w-4">{idx + 1}</span>
                    <div className="w-9 h-9 rounded bg-slate-800 overflow-hidden flex-shrink-0">
                      <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-200 truncate">{song.title}</h4>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{song.channelTitle}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] text-slate-500 font-semibold">{formatDuration(song.duration)}</span>
                    <button
                      onClick={() => removeFromQueue(song._id)}
                      className="p-1 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded transition-colors"
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
          <div className="space-y-5 flex flex-col h-full">
            {/* Custom URL Input */}
            <form onSubmit={handleCustomLinkSubmit} className="flex flex-col space-y-1.5 flex-shrink-0">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center space-x-1">
                <Link className="w-3 h-3 text-brandPink" />
                <span>Paste YouTube Link</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl glass-input"
                />
                <button
                  type="submit"
                  className="px-3 bg-brandPink text-slate-100 font-bold rounded-xl text-xs hover:scale-105 active:scale-95 transition-transform"
                >
                  Add
                </button>
              </div>
            </form>

            {/* Popular Songs Directory Search */}
            <div className="flex flex-col space-y-3 flex-1 overflow-hidden">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center space-x-1">
                <Search className="w-3 h-3 text-brandCyan" />
                <span>Search Popular Tracks</span>
              </label>
              
              <input
                type="text"
                placeholder="Search songs or artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl glass-input mb-2 flex-shrink-0"
              />

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredPopularSongs.length === 0 ? (
                  <p className="text-center text-slate-500 text-xs py-4">No matching popular tracks found</p>
                ) : (
                  filteredPopularSongs.map((song) => (
                    <div 
                      key={song.videoId} 
                      className="p-2.5 bg-white/5 border border-white/5 hover:border-brandCyan/20 rounded-xl flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-9 h-9 rounded bg-slate-800 overflow-hidden flex-shrink-0">
                          <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-200 truncate">{song.title}</h4>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{song.channelTitle}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddPopular(song)}
                        className="p-1.5 bg-brandCyan/10 hover:bg-brandCyan text-brandCyan hover:text-darkBg rounded-lg transition-all"
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
