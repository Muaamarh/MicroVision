
import React, { useState } from 'react';
import { UserInfo } from '../types.ts';

interface LoginProps {
  onLogin: (info: UserInfo) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [formData] = useState<UserInfo>({
    university: 'الجامعة التقنية الوسطى',
    institute: 'المعهد الطبي التقني المنصور',
    department: 'قسم المختبرات الطبية',
    student: 'تبارك حميد محمد',
    professor: 'م.م زينب حسن ثابت'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-5xl glass-effect rounded-[3rem] p-8 md:p-16 shadow-2xl border border-white/10 relative z-10">
        <form onSubmit={handleSubmit} className="flex flex-col space-y-12">
          
          <div className="flex flex-row justify-between items-center gap-6">
            <div className="text-right">
              <h2 className="text-xl md:text-2xl font-bold text-slate-300">{formData.university}</h2>
              <p className="text-sm text-cyan-500 font-semibold mt-1">وزارة التعليم العالي والبحث العلمي</p>
            </div>
            <div className="text-left">
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter">
                MicroVision <span className="text-cyan-400">AI</span>
              </h1>
            </div>
          </div>

          <div className="py-12 border-y border-white/5 text-center space-y-4">
            <h3 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-slate-400">
              {formData.institute}
            </h3>
            <p className="text-lg md:text-xl text-slate-400 font-medium">
              {formData.department}
            </p>
            <div className="pt-4">
              <span className="inline-block px-4 py-1 bg-cyan-500/10 text-cyan-400 rounded-full text-xs font-bold uppercase tracking-widest border border-cyan-500/20">
                مشروع تخرج ذكي
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 md:gap-12 pt-8">
            <div className="text-right bg-white/5 p-6 rounded-3xl border border-white/5 hover:border-cyan-500/30 transition-colors">
              <p className="text-slate-500 text-[10px] md:text-xs font-bold mb-2">بإشراف الأستاذة:</p>
              <h4 className="text-lg md:text-2xl font-bold text-white">{formData.professor}</h4>
            </div>
            <div className="text-left bg-white/5 p-6 rounded-3xl border border-white/5 hover:border-purple-500/30 transition-colors">
              <p className="text-slate-500 text-[10px] md:text-xs font-bold mb-2">إعداد الطالبة:</p>
              <h4 className="text-lg md:text-2xl font-bold text-white">{formData.student}</h4>
            </div>
          </div>

          <div className="flex justify-center pt-8">
            <button 
              type="submit"
              className="group relative px-12 py-5 bg-white text-slate-950 font-black rounded-2xl overflow-hidden transition-all hover:scale-105 active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative z-10 flex items-center gap-3">
                الدخول للنظام المختبري
                <svg className="w-5 h-5 group-hover:translate-x-[-4px] transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </span>
            </button>
          </div>
        </form>
      </div>

      <div className="fixed bottom-4 text-slate-600 text-[10px] font-bold uppercase tracking-widest">
        {formData.institute} • MicroVision AI v2.1
      </div>
    </div>
  );
};

export default Login;
