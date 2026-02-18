
import React, { useRef, useEffect, useState } from 'react';
import { Message, LiveSubMode } from '../types.ts';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onSendMedia: (file: File) => void;
  onCameraOptionClick: (mode: LiveSubMode) => void;
  isLoading: boolean;
  onSpeak: (text: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, 
  onSendMessage, 
  onSendMedia,
  onCameraOptionClick,
  isLoading, 
  onSpeak 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputText, setInputText] = useState('');
  const [showCameraMenu, setShowCameraMenu] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSendMedia(file);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950/50 overflow-hidden relative">
      <div className="flex items-center justify-between p-4 bg-slate-900/40 backdrop-blur-sm border-b border-slate-800 z-20">
        <div className="text-right">
          <h3 className="text-sm font-bold text-slate-300">مساعد MicroVision الذكي</h3>
          <p className="text-[10px] text-cyan-500/80">متصل الآن</p>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowCameraMenu(!showCameraMenu)}
            className={`p-2 rounded-full transition-all group ${showCameraMenu ? 'bg-cyan-500 text-white' : 'hover:bg-slate-800 text-cyan-400'}`}
          >
            <CameraIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>

          {showCameraMenu && (
            <div className="absolute left-0 mt-2 w-56 glass-effect border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              <button 
                onClick={() => { onCameraOptionClick('video'); setShowCameraMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-right transition-colors"
              >
                <span className="text-xl">📹</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">اتصال فيديو مباشر</p>
                  <p className="text-[10px] text-slate-400">تحليل فوري عبر الكاميرا</p>
                </div>
              </button>
              <div className="h-[1px] bg-slate-800 mx-4"></div>
              <button 
                onClick={() => { onCameraOptionClick('voice'); setShowCameraMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-right transition-colors"
              >
                <span className="text-xl">🎙️</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">تسجيل صوتي ذكي</p>
                  <p className="text-[10px] text-slate-400">تحدث واستلم الرد مكتوباً وصوتياً</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
            <div className="w-24 h-24 rounded-full bg-cyan-500/20 flex items-center justify-center text-5xl mb-4">🔬</div>
            <h3 className="text-xl font-bold text-white mb-2">مرحباً بك في المختبر الذكي</h3>
            <p className="text-slate-400 max-w-sm">اضغط على زر الكاميرا للبدء في الاتصال المباشر أو التسجيل الصوتي.</p>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`
              max-w-[85%] md:max-w-[70%] p-5 rounded-3xl shadow-xl relative group transition-all
              ${msg.role === 'user' 
                ? 'bg-slate-800 text-slate-100 rounded-br-none' 
                : 'bg-gradient-to-br from-cyan-900/40 to-slate-900 text-white border border-cyan-500/30 rounded-bl-none'}
            `}>
              <div className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{msg.text}</div>
              {msg.mediaUrl && (
                <div className="mt-4 rounded-xl overflow-hidden border border-slate-700">
                  {msg.type === 'video' ? <video src={msg.mediaUrl} controls className="w-full max-h-96" /> : <img src={msg.mediaUrl} alt="Sample" className="w-full max-h-96 object-contain" />}
                </div>
              )}
              {msg.role === 'assistant' && (
                <button onClick={() => onSpeak(msg.text)} className="absolute -bottom-2 -left-2 bg-slate-800 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-slate-700 shadow-lg">🔊</button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-end">
            <div className="bg-slate-900/50 px-6 py-4 rounded-3xl border border-cyan-500/20 animate-pulse flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 md:p-6 bg-slate-900/80 backdrop-blur-md border-t border-slate-800">
        <div className="max-w-4xl mx-auto flex items-center gap-3 bg-slate-800 rounded-2xl p-2 px-4 shadow-inner ring-1 ring-slate-700 focus-within:ring-cyan-500 transition-all relative">
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-cyan-400 transition-colors shrink-0">
            <PinIcon className="w-6 h-6" />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,video/*" />
          <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="اسأل النظام المختبري أو ارفق صورة..." className="flex-1 bg-transparent border-none py-3 text-white focus:outline-none" disabled={isLoading} />
          <button type="submit" disabled={isLoading || !inputText.trim()} className={`p-3 rounded-xl transition-all disabled:opacity-30 flex items-center justify-center shrink-0 ${inputText.trim() ? 'bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-500'}`}>
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

const CameraIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);
const PinIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>
);
const SendIcon = ({ className }: { className?: string }) => (
  <svg className={`${className} transform rotate-180`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
  </svg>
);
export default ChatWindow;
