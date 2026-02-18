
import React, { useState } from 'react';
import { UserInfo, Message, AppMode, LiveSubMode } from '../types';
import { medicalChat, analyzeMedia, textToSpeech, decodeAudio, decodeAudioData } from '../geminiService';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import LiveSession from './LiveSession';

interface DashboardProps {
  userInfo: UserInfo;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ userInfo, onLogout }) => {
  const [mode, setMode] = useState<AppMode>(AppMode.Chat);
  const [liveSubMode, setLiveSubMode] = useState<LiveSubMode>('video');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const addMessage = (msg: Omit<Message, 'id' | 'timestamp'>) => {
    const newMsg: Message = {
      ...msg,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, newMsg]);
    return newMsg;
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    addMessage({ role: 'user', text });
    setIsLoading(true);
    try {
      const { text: responseText, grounding } = await medicalChat(text, messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      })));
      const groundingUrls = (grounding as any[])?.map(g => ({
        title: g.web?.title || 'مصدر خارجي',
        uri: g.web?.uri
      })).filter(g => g.uri);
      addMessage({ role: 'assistant', text: responseText, groundingUrls });
    } catch (error) {
      addMessage({ role: 'assistant', text: "عذراً، حدث خطأ أثناء معالجة طلبك." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMediaAnalysis = async (file: File, prompt: string = "قم بتحليل هذه العينة المختبرية بالتفصيل.") => {
    setIsLoading(true);
    const mediaUrl = URL.createObjectURL(file);
    addMessage({ role: 'user', text: prompt, type: file.type.startsWith('image/') ? 'image' : 'video', mediaUrl });
    try {
      const analysis = await analyzeMedia(file, prompt);
      addMessage({ role: 'assistant', text: analysis || "لم يتم استخراج تحليل.", type: 'analysis' });
    } catch (error) {
      addMessage({ role: 'assistant', text: "فشل تحليل الوسائط." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveLiveTranscript = (transcript: { text: string; role: 'user' | 'assistant' }[]) => {
    transcript.forEach(entry => {
      addMessage({
        role: entry.role,
        text: entry.role === 'user' ? entry.text : entry.text,
        type: 'text'
      });
    });
    setMode(AppMode.Chat);
  };

  const speak = async (text: string) => {
    try {
      const base64 = await textToSpeech(text);
      if (base64) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const decoded = decodeAudio(base64);
        const buffer = await decodeAudioData(decoded, audioCtx, 24000, 1);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start();
      }
    } catch (e) { console.error("TTS failed", e); }
  };

  const handleCameraShortcut = (subMode: LiveSubMode) => {
    setLiveSubMode(subMode);
    setMode(AppMode.Live);
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-slate-950 overflow-hidden">
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed top-4 right-4 z-[100] p-3 bg-cyan-500 rounded-xl text-white shadow-lg"
      >
        <MenuIcon />
      </button>

      <Sidebar 
        isOpen={isSidebarOpen} 
        setOpen={setIsSidebarOpen}
        currentMode={mode} 
        setMode={setMode} 
        userInfo={userInfo}
        onLogout={onLogout}
      />

      <main className="flex-1 relative flex flex-col h-full overflow-hidden">
        {mode === AppMode.Chat && (
          <ChatWindow 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            onSendMedia={(file) => handleMediaAnalysis(file)}
            onCameraOptionClick={handleCameraShortcut}
            isLoading={isLoading}
            onSpeak={speak}
          />
        )}
        
        {mode === AppMode.Live && (
          <LiveSession 
            userInfo={userInfo} 
            mode={liveSubMode} 
            onClose={() => setMode(AppMode.Chat)}
            onSaveTranscript={handleSaveLiveTranscript}
          />
        )}
      </main>
    </div>
  );
};

const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
  </svg>
);

export default Dashboard;
