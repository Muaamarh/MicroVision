
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Modality } from "@google/genai";

// --- Types ---
interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  type?: 'text' | 'image' | 'analysis' | 'video';
  mediaUrl?: string;
}

interface UserInfo {
  university: string;
  institute: string;
  department: string;
  student: string;
  professor: string;
}

enum AppMode { Chat = 'chat', Live = 'live' }

// --- AI Service ---
const getAI = () => new GoogleGenAI({ apiKey: (window as any).process?.env?.API_KEY || "" });

const medicalChat = async (message: string, history: any[] = []) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [
      { role: 'user', parts: [{ text: "أنت نظام MicroVision AI المساعد المختبري الذكي. أجب بدقة علمية وباللغة العربية." }] },
      ...history,
      { role: 'user', parts: [{ text: message }] }
    ],
    config: { temperature: 0.7 }
  });
  return response.text || "لم يتم الحصول على رد.";
};

const analyzeMedia = async (file: File, prompt: string) => {
  const ai = getAI();
  const reader = new FileReader();
  const base64Promise = new Promise<string>((resolve) => {
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  const base64 = await base64Promise;
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType: file.type } },
        { text: prompt || "قم بتحليل هذه العينة المختبرية." }
      ]
    }
  });
  return response.text;
};

// --- Components ---

const Login: React.FC<{ onLogin: (info: UserInfo) => void }> = ({ onLogin }) => {
  const [info] = useState<UserInfo>({
    university: 'الجامعة التقنية الوسطى',
    institute: 'المعهد الطبي التقني المنصور',
    department: 'قسم المختبرات الطبية',
    student: 'تبارك حميد محمد',
    professor: 'م.م زينب حسن ثابت'
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-white relative">
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cyan-500 to-purple-800"></div>
      </div>
      <div className="w-full max-w-4xl glass-effect rounded-[3rem] p-12 text-center relative z-10 border border-white/10">
        <h1 className="text-5xl font-black mb-8">MicroVision <span className="text-cyan-400">AI</span></h1>
        <div className="space-y-4 mb-12">
          <h2 className="text-2xl font-bold text-slate-300">{info.university}</h2>
          <h3 className="text-3xl font-black text-cyan-200">{info.institute}</h3>
          <p className="text-xl text-slate-400">{info.department}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
            <p className="text-xs text-slate-500 mb-1">إعداد الطالبة:</p>
            <p className="text-xl font-bold">{info.student}</p>
          </div>
          <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
            <p className="text-xs text-slate-500 mb-1">إشراف الأستاذة:</p>
            <p className="text-xl font-bold">{info.professor}</p>
          </div>
        </div>
        <button 
          onClick={() => onLogin(info)}
          className="px-12 py-5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-2xl transition-all transform hover:scale-105"
        >
          الدخول للنظام المختبري
        </button>
      </div>
    </div>
  );
};

const Dashboard: React.FC<{ userInfo: UserInfo; onLogout: () => void }> = ({ userInfo, onLogout }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: inputText, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    try {
      const response = await medicalChat(inputText, messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] })));
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', text: response, timestamp: Date.now() }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', text: "خطأ في الاتصال بالسيرفر.", timestamp: Date.now() }]);
    }
    setIsLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const mediaUrl = URL.createObjectURL(file);
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: "تحليل عينة مجهرية", mediaUrl, timestamp: Date.now() }]);
    setIsLoading(true);
    try {
      const analysis = await analyzeMedia(file, "قم بتحليل هذه العينة المختبرية بالتفصيل.");
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', text: analysis || "لم يتم التحليل.", timestamp: Date.now() }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', text: "فشل التحليل.", timestamp: Date.now() }]);
    }
    setIsLoading(false);
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-72 border-l border-slate-800 p-6 flex flex-col glass-effect">
        <h1 className="text-2xl font-black mb-8 text-center">MicroVision <span className="text-cyan-400">AI</span></h1>
        <div className="flex-1 space-y-4">
          <div className="bg-slate-900/50 p-4 rounded-xl text-xs space-y-2 text-slate-400 border border-white/5">
            <p><strong className="text-cyan-400">الجامعة:</strong> {userInfo.university}</p>
            <p><strong className="text-cyan-400">المعهد:</strong> {userInfo.institute}</p>
            <p><strong className="text-cyan-400">الطالبة:</strong> {userInfo.student}</p>
          </div>
        </div>
        <button onClick={onLogout} className="mt-8 py-3 text-red-400 font-bold hover:bg-red-500/10 rounded-xl transition-colors">تسجيل الخروج</button>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full bg-slate-950/50 relative">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
              <span className="text-8xl mb-4">🔬</span>
              <h2 className="text-2xl font-bold">جاهز لتحليل العينات الطبية</h2>
            </div>
          )}
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl shadow-lg ${m.role === 'user' ? 'bg-slate-800 text-slate-100' : 'bg-cyan-900/30 border border-cyan-500/20 text-white'}`}>
                <p className="text-sm md:text-base leading-relaxed">{m.text}</p>
                {m.mediaUrl && <img src={m.mediaUrl} className="mt-4 rounded-lg max-h-64 object-contain" alt="Lab Sample" />}
              </div>
            </div>
          ))}
          {isLoading && <div className="text-cyan-500 animate-pulse text-sm">جاري المعالجة...</div>}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-900/80 border-t border-slate-800">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*" />
            <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-cyan-400 transition-colors">📎</button>
            <input 
              type="text" value={inputText} onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="اكتب استفسارك الطبي هنا..."
              className="flex-1 bg-slate-800 border-none rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
            />
            <button onClick={handleSend} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold transition-all">إرسال</button>
          </div>
        </div>
      </main>
    </div>
  );
};

// --- App Root ---
const App = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  return user ? <Dashboard userInfo={user} onLogout={() => setUser(null)} /> : <Login onLogin={setUser} />;
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
