
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- AI Setup ---
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const medicalChat = async (message: string, history: any[] = []) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        { role: 'user', parts: [{ text: "أنت نظام MicroVision AI، مساعد مختبري ذكي جداً. أجب بأسلوب علمي رصين وباللغة العربية." }] },
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: { 
        temperature: 0.8, 
        tools: [{ googleSearch: {} }] 
      }
    });
    return {
      text: response.text,
      grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
  } catch (error) {
    console.error("Chat Error:", error);
    throw error;
  }
};

const analyzeImage = async (file: File) => {
  const ai = getAI();
  try {
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType: file.type } },
          { text: "حلل هذه العينة المجهرية واشرح النتائج بالتفصيل العلمي." }
        ]
      }
    });
    return response.text;
  } catch (error) {
    console.error("Vision Error:", error);
    throw error;
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
    <div className="h-full w-full flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-600/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-4xl glass-effect rounded-[2.5rem] p-8 md:p-16 text-center relative z-10 border border-white/10 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
           <div className="text-center md:text-right">
              <p className="text-cyan-400 font-bold text-xs mb-1">وزارة التعليم العالي</p>
              <h2 className="text-sm md:text-lg font-bold text-slate-300">{info.university}</h2>
           </div>
           <h1 className="text-4xl md:text-6xl font-black">MicroVision <span className="text-cyan-400">AI</span></h1>
        </div>

        <div className="space-y-4 mb-12">
          <h3 className="text-2xl md:text-4xl font-black text-white leading-tight">{info.institute}</h3>
          <p className="text-base md:text-xl text-slate-400 font-light tracking-wide">{info.department}</p>
          <div className="h-1 w-20 bg-cyan-500 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-12">
          <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
            <p className="text-[10px] text-slate-500 mb-2 uppercase font-bold tracking-widest">إشراف</p>
            <p className="text-xl font-bold">{info.professor}</p>
          </div>
          <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
            <p className="text-[10px] text-slate-500 mb-2 uppercase font-bold tracking-widest">إعداد</p>
            <p className="text-xl font-bold">{info.student}</p>
          </div>
        </div>

        <button 
          onClick={() => onLogin(info)}
          className="group px-12 py-5 bg-white text-slate-950 font-black rounded-2xl transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-white/5"
        >
          <span className="flex items-center gap-3 text-lg">
             دخول المختبر الذكي
             <svg className="w-5 h-5 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
          </span>
        </button>
      </div>
    </div>
  );
};

const Dashboard: React.FC<{ userInfo: any; onLogout: () => void }> = ({ userInfo, onLogout }) => {
  const [messages, setMessages] = useState<any[]>([]);
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
    const userMsg = { id: Date.now(), role: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    
    try {
      const result = await medicalChat(inputText, messages.slice(-5).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      })));
      
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'assistant', 
        text: result.text,
        grounding: result.grounding?.map((g: any) => ({ title: g.web?.title, uri: g.web?.uri })).filter((g: any) => g.uri)
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'assistant', 
        text: "عذراً، حدث خطأ في الاتصال. يرجى التحقق من جودة الإنترنت وحالة السيرفر."
      }]);
    }
    setIsLoading(false);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: "تحليل عينة جديدة", image: url }]);
    setIsLoading(true);
    try {
      const result = await analyzeImage(file);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: result }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: "فشل تحليل الصورة المختبرية." }]);
    }
    setIsLoading(false);
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-slate-950 overflow-hidden">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-white/5 z-50">
         <h1 className="text-lg font-black">MicroVision <span className="text-cyan-400">AI</span></h1>
         <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-cyan-400 bg-cyan-400/10 rounded-lg">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
         </button>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed md:relative inset-y-0 right-0 z-[100] w-72 md:w-80 glass-effect border-l border-white/5 transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full p-8">
          <div className="md:hidden flex justify-between items-center mb-8">
             <span className="font-bold">القائمة</span>
             <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400">إغلاق</button>
          </div>
          <h1 className="hidden md:block text-2xl font-black mb-12 text-center">MicroVision <span className="text-cyan-400">AI</span></h1>
          
          <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar">
            <div className="bg-cyan-500/5 p-5 rounded-2xl border border-cyan-500/10 text-[11px] space-y-3">
               <h4 className="font-bold text-cyan-400 uppercase tracking-widest border-b border-cyan-500/10 pb-2">تفاصيل الباحث</h4>
               <p><span className="opacity-50">المعهد:</span> <br/>{userInfo.institute}</p>
               <p><span className="opacity-50">القسم:</span> <br/>{userInfo.department}</p>
               <p><span className="opacity-50">الطالبة:</span> <br/>{userInfo.student}</p>
            </div>
            <div className="p-4 bg-slate-900/50 rounded-xl text-[10px] text-slate-500 leading-relaxed italic">
              هذا النظام مخصص للأغراض التعليمية والبحثية المتقدمة في مجال المختبرات الطبية.
            </div>
          </div>

          <button onClick={onLogout} className="mt-8 py-3 bg-red-500/10 text-red-400 font-bold rounded-xl hover:bg-red-500/20 transition-all text-sm border border-red-500/10">تسجيل الخروج</button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col h-full bg-slate-900/10 relative">
        {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-[90] md:hidden backdrop-blur-sm"></div>}
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-12 space-y-6 custom-scrollbar">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-4">
              <div className="w-20 h-20 md:w-32 md:h-32 bg-cyan-500/10 rounded-full flex items-center justify-center text-4xl md:text-6xl border border-cyan-500/20">🔬</div>
              <h2 className="text-xl md:text-2xl font-bold">جاهز لتحليل العينات</h2>
              <p className="max-w-xs md:max-w-md text-sm">يمكنكِ البدء برفع صورة للسلايد المجهري أو الاستفسار عن أي موضوع طبي مختبري.</p>
            </div>
          )}
          
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`
                max-w-[90%] md:max-w-[75%] p-4 md:p-6 rounded-2xl md:rounded-[2rem] shadow-xl transition-all
                ${m.role === 'user' 
                  ? 'bg-slate-800 text-white rounded-br-none' 
                  : 'bg-gradient-to-br from-cyan-900/30 to-slate-900 text-cyan-50 border border-cyan-500/20 rounded-bl-none'}
              `}>
                <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{m.text}</p>
                {m.image && <img src={m.image} className="mt-4 rounded-xl md:rounded-2xl max-h-64 md:max-h-96 w-full object-cover border border-white/5" alt="Lab Sample" />}
                
                {m.grounding && m.grounding.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-cyan-500/10 space-y-2">
                    <p className="text-[9px] font-bold text-cyan-400 uppercase tracking-tighter">المصادر الموثوقة:</p>
                    {m.grounding.map((g: any, i: number) => (
                      <a key={i} href={g.uri} target="_blank" rel="noreferrer" className="block text-[10px] text-slate-400 hover:text-cyan-400 underline truncate italic">
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
              <div className="bg-slate-900/80 px-4 py-3 rounded-full border border-cyan-500/20 flex gap-2 items-center">
                 <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"></div>
                 <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                 <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                 <span className="text-[9px] text-cyan-400 font-bold mr-1 uppercase">Analyzing</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 md:p-8 bg-slate-950/80 border-t border-white/5 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto flex items-center gap-2 md:gap-4">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFile} accept="image/*" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 md:p-4 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-all border border-white/5 bg-slate-900/50"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
            </button>
            <input 
              type="text" 
              value={inputText} 
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="اكتبي سؤالاً أو ارفقي عينة..."
              className="flex-1 bg-slate-800/50 border border-white/5 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 text-sm md:text-base text-white focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-600"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !inputText.trim()}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-20 text-white p-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-bold transition-all shadow-lg shadow-cyan-600/10"
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

const App = () => {
  const [user, setUser] = useState<any>(null);
  useEffect(() => { (window as any).hideLoader?.(); }, []);
  return user ? <Dashboard userInfo={user} onLogout={() => setUser(null)} /> : <Login onLogin={setUser} />;
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
