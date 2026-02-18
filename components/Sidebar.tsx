
import React from 'react';
import { UserInfo, AppMode } from '../types';

interface SidebarProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
  userInfo: UserInfo;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setOpen, currentMode, setMode, userInfo, onLogout }) => {
  const modes = [
    { id: AppMode.Chat, label: 'الدردشة الطبية', icon: '💬' },
  ];

  return (
    <aside className={`
      fixed inset-y-0 right-0 z-[90] w-72 glass-effect transition-transform duration-300 transform border-l border-slate-800
      md:relative md:translate-x-0
      ${isOpen ? 'translate-x-0' : 'translate-x-full'}
    `}>
      <div className="flex flex-col h-full p-6">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-black text-white">MicroVision <span className="text-cyan-400">AI</span></h1>
          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Smart Lab System</p>
        </div>

        <nav className="flex-1 space-y-2">
          {modes.map(mode => (
            <button
              key={mode.id}
              onClick={() => { setMode(mode.id); setOpen(false); }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-semibold
                ${currentMode === mode.id 
                  ? 'bg-gradient-to-l from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/20' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}
              `}
            >
              <span className="text-xl">{mode.icon}</span>
              <span>{mode.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800 space-y-4">
          <div className="bg-slate-900/50 p-4 rounded-2xl text-[11px] space-y-3 text-slate-400">
            <div>
              <p className="font-bold text-cyan-400/80 mb-0.5">الجامعة:</p>
              <p className="text-slate-300">{userInfo.university}</p>
            </div>
            <div>
              <p className="font-bold text-cyan-400/80 mb-0.5">المعهد:</p>
              <p className="text-slate-300">{userInfo.institute}</p>
            </div>
            <div>
              <p className="font-bold text-cyan-400/80 mb-0.5">القسم:</p>
              <p className="text-slate-300">{userInfo.department}</p>
            </div>
            <div className="pt-2 border-t border-white/5">
              <p className="font-bold text-slate-300">إعداد الطالبة:</p>
              <p>{userInfo.student}</p>
            </div>
            <div>
              <p className="font-bold text-slate-300">إشراف الأستاذة:</p>
              <p>{userInfo.professor}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <span>تسجيل الخروج</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
