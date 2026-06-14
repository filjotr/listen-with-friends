import React, { useState, useEffect, useRef } from 'react';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { Send, Smile, Info, Image, Lock, X } from 'lucide-react';

export default function RoomChat() {
  const { room, chatMessages, sendMessage } = useRoom();
  const { user } = useAuth();
  
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const chatBottomRef = useRef(null);
  const fileInputRef = useRef(null);

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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file!');
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) { // Limit size to 1.5MB to avoid socket payload overflow
      alert('Image size should be less than 1.5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      // Send base64 representation directly as the message text
      sendMessage(reader.result);
    };
    reader.onerror = (err) => {
      console.error('Error reading image:', err);
    };
    reader.readAsDataURL(file);
    // Reset file input value
    e.target.value = null;
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
    <div className={`glass-panel rounded-2xl flex flex-col overflow-hidden ${
      room?.isChatOnly ? 'flex-1 h-full min-h-[450px]' : 'h-[380px] md:h-[450px]'
    }`}>
      {/* Sidebar Header */}
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-black/5 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brandCyan animate-ping"></span>
          <h3 className="font-bold text-main text-sm">Room Chat</h3>
        </div>
        {room?.isEphemeralChat && (
          <div 
            className="flex items-center space-x-1 px-2.5 py-1 rounded-full neumorph-btn text-brandPink text-[9.5px] font-bold uppercase cursor-help"
            title="Private Ephemeral Chat: Messages are NOT stored anywhere and disappear when you leave the room."
          >
            <Lock className="w-3 h-3 text-brandPink" />
            <span>Private</span>
          </div>
        )}
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

            const isImage = msg.text && msg.text.startsWith('data:image/');

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
                  {isImage ? (
                    <img 
                      src={msg.text} 
                      alt="Shared payload" 
                      className="max-w-[180px] max-h-[180px] rounded-lg object-contain cursor-zoom-in hover:scale-[1.03] transition-transform" 
                      onClick={() => {
                        const newTab = window.open();
                        if (newTab) {
                          newTab.document.write(`<img src="${msg.text}" style="max-width:100%; max-height:100%; display:block; margin:auto;" />`);
                        }
                      }}
                    />
                  ) : (
                    msg.text
                  )}
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
      <form onSubmit={handleSend} className="p-3 flex items-center space-x-2 bg-transparent flex-shrink-0 border-t border-black/5">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`p-2.5 rounded-xl transition-all cursor-pointer ${
            showEmojiPicker 
              ? 'neumorph-btn text-brandCyan' 
              : 'text-muted hover:text-brandCyan'
          }`}
          title="Add Emoji"
        >
          <Smile className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 rounded-xl text-muted hover:text-brandCyan transition-all cursor-pointer"
          title="Send Image"
        >
          <Image className="w-4 h-4" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />

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
