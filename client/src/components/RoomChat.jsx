import React, { useState, useEffect, useRef } from 'react';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { Send, Smile, Info } from 'lucide-react';

export default function RoomChat() {
  const { chatMessages, sendMessage } = useRoom();
  const { user } = useAuth();
  
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const chatBottomRef = useRef(null);

  const popularEmojis = ['😂', '🔥', '❤️', '👍', '😮', '🎤', '🎉', '🎵', '🚀', '👑'];

  useEffect(() => {
    // Scroll chat to bottom on new messages
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    sendMessage(inputText);
    setInputText('');
    setShowEmojiPicker(false);
  };

  const handleEmojiSelect = (emoji) => {
    setInputText(prev => prev + emoji);
  };

  const formatMessageTime = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="glass-panel rounded-2xl flex flex-col h-[380px] md:h-[450px] overflow-hidden">
      {/* Sidebar Header */}
      <div className="px-5 py-3.5 flex items-center space-x-2 flex-shrink-0">
        <span className="w-2.5 h-2.5 rounded-full bg-brandCyan animate-ping"></span>
        <h3 className="font-bold text-main text-sm">Room Chat</h3>
      </div>

      {/* Message history */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <Info className="w-5 h-5 text-muted mb-1.5" />
            <p className="text-xs text-muted max-w-[150px]">
              Chat is empty. Type a message to say hello!
            </p>
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isMe = msg.sender?.userId === user?.id;
            const isSystem = msg.sender?.userId === 'system';

            if (isSystem) {
              return (
                <div key={msg._id} className="text-center py-1">
                  <span className="px-3 py-1.5 neumorph-btn rounded-full text-[10px] text-muted font-semibold italic">
                    {msg.text}
                  </span>
                </div>
              );
            }

            return (
              <div 
                key={msg._id} 
                className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                {/* Sender Tag */}
                <span className="text-[10px] text-muted font-semibold mb-1 px-1">
                  {msg.sender?.username} • {formatMessageTime(msg.timestamp)}
                </span>
                
                {/* Message bubble */}
                <div 
                  className={`px-4 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                    isMe 
                      ? 'glass-panel text-brandCyan rounded-tr-none' 
                      : 'glass-input text-main rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Emoji fast picker overlay */}
      {showEmojiPicker && (
        <div className="px-4 py-2.5 neumorph-btn flex items-center justify-around flex-shrink-0 animate-fadeIn m-2 rounded-xl">
          {popularEmojis.map((emoji, i) => (
            <button 
              key={i} 
              onClick={() => handleEmojiSelect(emoji)} 
              className="text-base hover:scale-125 transition-transform cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Message input */}
      <form onSubmit={handleSend} className="p-3 flex items-center space-x-2 bg-transparent flex-shrink-0">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`p-2.5 rounded-xl transition-all cursor-pointer ${
            showEmojiPicker 
              ? 'neumorph-btn text-brandCyan' 
              : 'text-muted hover:text-brandCyan'
          }`}
        >
          <Smile className="w-4 h-4" />
        </button>

        <input
          type="text"
          placeholder="Send a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 px-3 py-2 text-xs rounded-xl glass-input text-main"
        />

        <button
          type="submit"
          className="p-2.5 neumorph-btn text-brandCyan hover:scale-105 active:scale-95 rounded-xl transition-all cursor-pointer"
        >
          <Send className="w-4 h-4 text-brandCyan" />
        </button>
      </form>
    </div>
  );
}
