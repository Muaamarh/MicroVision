
import React, { useState } from 'react';

interface MediaPanelProps {
  onAnalyze: (file: File, prompt: string) => void;
  isLoading: boolean;
}

const MediaPanel: React.FC<MediaPanelProps> = ({ onAnalyze, isLoading }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleUpload = () => {
    if (file) {
      onAnalyze(file, prompt);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-black text-white">تحليل العينات المجهرية</h2>
          <p className="text-slate-400 mt-2">قم برفع صورة أو فيديو للسلايد لتحليله بواسطة الذكاء الاصطناعي عالي الدقة.</p>
        </div>

        <div className={`
          relative border-2 border-dashed rounded-[2.5rem] p-12 text-center transition-all group overflow-hidden
          ${file ? 'border-cyan-500 bg-cyan-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-900/30'}
        `}>
          {!preview ? (
            <div className="space-y-4">
              <div className="w-20 h-20 bg-slate-800 rounded-3xl mx-auto flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
                🔬
              </div>
              <p className="text-slate-400">اسحب الصور هنا أو انقر للاختيار</p>
              <input 
                type="file" 
                accept="image/*,video/*" 
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {file?.type.startsWith('video/') ? (
                <video src={preview} controls className="max-h-96 mx-auto rounded-2xl shadow-2xl" />
              ) : (
                <img src={preview} alt="Preview" className="max-h-96 mx-auto rounded-2xl shadow-2xl object-contain" />
              )}
              <button 
                onClick={() => { setFile(null); setPreview(null); }}
                className="text-red-400 font-bold hover:text-red-300 transition-colors"
              >
                إلغاء واختيار ملف آخر
              </button>
            </div>
          )}
        </div>

        {file && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <textarea 
              placeholder="هل لديك ملاحظات معينة أو استفسار حول هذه العينة؟ (اختياري)"
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white focus:ring-2 focus:ring-cyan-500 outline-none min-h-[100px]"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button 
              onClick={handleUpload}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {isLoading ? 'جاري التحليل العلمي...' : 'بدأ التحليل 🔬'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaPanel;
