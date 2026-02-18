
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Modality } from "@google/genai";

// --- Types ---
interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  mediaUrl?: string;
  groundingUrls?: Array<{ title: string; uri: string }>;
}

// --- AI Engine ---
const callMedicalAI = async (message: string, history: any[] = []) => {
  // إنشاء نسخة جديدة عند كل طلب لتجنب مشاكل الجلسة في المتصفح
  const ai = new GoogleGenAI({ apiKey: (window as any).process?.env?.API_KEY || "" });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        { role: 'user', parts: [{ text: "أنت نظام MicroVision AI المساعد المختبري الذكي. أجب بدقة علمية وباللغة العربية الفصحى." }] },
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: { temperature: 0.7, tools: [{ googleSearch: {} }] }
    });
    
    const text = response.text || "عذراً، لم أتمكن من الحصول على رد مفيد.";
    const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const groundingUrls = grounding?.map((g: any) => ({ title: g.web?.title, uri: g.web?.uri })).filter((g: any) => g.uri);
    
    return { text, groundingUrls };
  } catch (error: any) {
    console.error("AI Call Failed:", error);
    throw new Error(error?.message || "Connection Error");
  }
};

const analyzeImageAI = async (file: File, prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: (window as any).process?.env?.API_KEY || "" });
  try {
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType: file.type } },
          { text: prompt || "قم بتحليل هذه العينة المختبرية بالتفصيل." }
        ]
      }
    });
    return response.text;
  } catch (error) {
    throw new Error("Analysis Failed");
  }
};

// --- Components ---

const Login: React.FC<{ onLogin: (info: any) => void }> = ({ onLogin }) => {
  const [info] = useState({
    university: 'الجامعة التقنية الوسطى',
    institute: 'المعهد الطبي التقني المنصور',
    department: 'قسم المختبرات الطبية',
    student: 'تبارك حميد محمد',
    professor: 'م.م زينب حسن ثابت'
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-slate-950 text-white relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
      </div>
      
      <div className="w-full max-w-5xl glass-effect rounded-[2rem] md:rounded-[4rem] p-6 md:p-16 text-center relative z-10 border border-white/10 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10 md:mb-16">
           <div className="text-center md:text-right order-2 md:order-1">
              <p className="text-cyan-400 font-bold text-xs md:text-sm mb-1">وزارة التعليم العالي</p>
              <h2 className="text-base md:text-xl font-bold text-slate-300">{info.university}</h2>
           </div>
           <h1 className="text-4xl md:text-7xl font-black order-1 md:order-2 tracking-tighter">MicroVision <span className="text-cyan-400">AI</span></h1>
        </div>

        <div className="space-y-4 md:space-y-6 mb-10 md:mb-16">
          <h3 className="text-2xl md:text-5xl font-black text-white leading-tight drop-shadow-xl">{info.institute}</h3>
          <p className="text-lg md:text-2xl text-slate-400 font-light tracking-wide">{info.department}</p>
          <div className="h-1.5 w-20 md:w-32 bg-gradient-to-r from-cyan-500 to-purple-500 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-10 md:mb-16">
          <div className="bg-white/5 p-6 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 hover:border-cyan-500/30 transition-all group">
            <p className="text-[10px] md:text-xs text-slate-500 mb-2 uppercase font-bold tracking-widest">إشراف الأستاذة</p>
            <p className="text-xl md:text-3xl font-bold group-hover:text-cyan-400 transition-colors">{info.professor}</p>
          </div>
          <div className="bg-white/5 p-6 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 hover:border-cyan-500/30 transition-all group">
            <p className="text-[10px] md:text-xs text-slate-500 mb-2 uppercase font-bold tracking-widest">إعداد الطالبة</p>
            <p className="text-xl md:text-3xl font-bold group-hover:text-cyan-400 transition-colors">{info.student}</p>
          </div>
        </div>

        <button 
          onClick={() => onLogin(info)}
          className="w-full md:w-auto px-12 md:px-20 py-5 md:py-7 bg-white text-slate-950 font-black rounded-[1.5rem] md:rounded-[2rem] transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-white/10 text-lg md:text-2xl flex items-center justify-center gap-4 mx-auto"
        >
          <span>دخول النظام الذكي</span>
          <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
        </button>
      </div>
    </div>
  );
};

const Dashboard: React.FC<{ userInfo: any; onLogout: () => void }> = ({ userInfo, onLogout }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const userMsg: Message = { id: Date.now(), role: 'user', text: inputText, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    
    try {
      const result = await callMedicalAI(inputText, messages.slice(-6).map(m => ({ 
        role: m.role === 'user' ? 'user' : 'model', 
        parts: [{ text: m.text }] 
      })));
      
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'assistant', 
        text: result.text,
        timestamp: Date.now(),
        groundingUrls: result.groundingUrls
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'assistant', 
        text: "حدث خطأ في الاتصال بالسيرفر. يرجى التأكد من مفتاح الـ API أو جودة الإنترنت.",
        timestamp: Date.now()
      }]);
    }
    setIsLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: "تحليل عينة مخبرية", mediaUrl: url, timestamp: Date.now() }]);
    setIsLoading(true);
    try {
      const analysis = await analyzeImageAI(file, "قم بتحليل هذه العينة المختبرية الطبية بدقة.");
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: analysis, timestamp: Date.now() }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: "فشل التحليل المختبري.", timestamp: Date.now() }]);
    }
    setIsLoading(false);
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-slate-950 overflow-hidden safe-pb">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 safe-pt">
        <h1 className="text-xl font-black">MicroVision <span className="text-cyan-400">AI</span></h1>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-cyan-400 bg-cyan-400/10 rounded-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
        </button>
      </div>

      {/* Sidebar - Drawer on Mobile, Fixed on Desktop */}
      <aside className={`
        fixed md:relative inset-y-0 right-0 z-[100] w-72 md:w-80 glass-effect border-l border-slate-800 transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full p-8 safe-pt">
          <div className="flex justify-between items-center mb-10 md:hidden">
             <h2 className="text-lg font-bold">القائمة</h2>
             <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400">إغلاق ✕</button>
          </div>
          
          <h1 className="hidden md:block text-2xl font-black mb-12 text-center">MicroVision <span className="text-cyan-400">AI</span></h1>
          
          <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar">
            <div className="bg-cyan-500/10 p-6 rounded-2xl border border-cyan-500/20 text-xs space-y-4">
               <h4 className="font-bold text-cyan-400 uppercase tracking-widest border-b border-cyan-500/10 pb-2 mb-2">بيانات الباحث</h4>
               <p><span className="opacity-50">المعهد:</span> <br/>{userInfo.institute}</p>
               <p><span className="opacity-50">القسم:</span> <br/>{userInfo.department}</p>
               <p><span className="opacity-50">الباحث:</span> <br/>{userInfo.student}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 text-[10px] text-slate-500 leading-relaxed italic border border-white/5">
              نظام استشاري مختبري يدعم الأغراض التعليمية والبحثية باستخدام تقنيات رؤية الحاسوب والذكاء الاصطناعي التوليدي.
            </div>
          </div>

          <button onClick={onLogout} className="mt-8 py-4 bg-red-500/10 text-red-400 font-bold rounded-xl hover:bg-red-500/20 transition-all border border-red-500/10">تسجيل الخروج</button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-[90] md:hidden backdrop-blur-sm"></div>}

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full bg-slate-900/20 relative">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-12 space-y-6 md:space-y-8 custom-scrollbar">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-4">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-cyan-500/10 rounded-full flex items-center justify-center text-5xl md:text-6xl border border-cyan-500/20 shadow-2xl">🔬</div>
              <h2 className="text-2xl md:text-3xl font-bold">مختبر MicroVision الذكي</h2>
              <p className="max-w-xs md:max-w-md text-sm md:text-base leading-relaxed">أهلاً بكِ في الجيل القادم من الأنظمة المختبرية. ابدئي برفع عينة أو اسألي عن أي تشخيص طبي.</p>
            </div>
          )}
          
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end animate-in fade-in slide-in-from-left-4'}`}>
              <div className={`
                max-w-[90%] md:max-w-[75%] p-4 md:p-7 rounded-2xl md:rounded-[2.5rem] shadow-2xl transition-all
                ${m.role === 'user' 
                  ? 'bg-slate-800 text-slate-100 rounded-br-none' 
                  : 'bg-gradient-to-br from-cyan-900/30 via-slate-900 to-slate-900 text-cyan-50 border border-cyan-500/10 rounded-bl-none'}
              `}>
                <p className="text-sm md:text-lg leading-relaxed whitespace-pre-wrap">{m.text}</p>
                {m.mediaUrl && <img src={m.mediaUrl} className="mt-4 rounded-xl md:rounded-3xl max-h-64 md:max-h-96 w-full object-cover border border-white/5" alt="Sample" />}
                
                {m.groundingUrls && m.groundingUrls.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-cyan-500/10 space-y-2">
                    <p className="text-[10px] font-bold text-cyan-500 tracking-widest uppercase">المراجع البحثية:</p>
                    {m.groundingUrls.map((g, i) => (
                      <a key={i} href={g.uri} target="_blank" rel="noreferrer" className="block text-[11px] text-slate-400 hover:text-cyan-400 underline truncate transition-colors italic">
                        • {g.title || g.uri}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-end">
              <div className="bg-slate-900/80 px-6 py-4 rounded-full border border-cyan-500/20 flex gap-2 items-center shadow-xl">
                 <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                 <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                 <span className="text-[10px] text-cyan-400 font-bold mr-2 tracking-widest uppercase">Analyzing</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar - Responsive & Sticky */}
        <div className="p-4 md:p-10 bg-slate-950/80 border-t border-white/5 backdrop-blur-2xl">
          <div className="max-w-5xl mx-auto flex items-center gap-3 md:gap-4">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-4 md:p-5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-xl md:rounded-2xl transition-all border border-white/5 bg-slate-900/50"
              title="إرفاق عينة"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
            </button>
            <input 
              type="text" 
              value={inputText} 
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="اطلبي تحليلاً أو اطرحي سؤالاً..."
              className="flex-1 bg-slate-800/40 border border-white/5 rounded-xl md:rounded-2xl px-4 md:px-7 py-4 md:py-5 text-sm md:text-lg text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-600 shadow-inner"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !inputText.trim()}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-20 text-white p-4 md:px-10 md:py-5 rounded-xl md:rounded-2xl font-black transition-all shadow-xl shadow-cyan-600/20 flex items-center justify-center"
            >
              <span className="hidden md:block">إرسال</span>
              <svg className="w-5 h-5 md:hidden transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

// --- App Root ---
const App = () => {
  const [user, setUser] = useState<any>(null);
  useEffect(() => { (window as any).hideLoader?.(); }, []);
  return user ? <Dashboard userInfo={user} onLogout={() => setUser(null)} /> : <Login onLogin={setUser} />;
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
