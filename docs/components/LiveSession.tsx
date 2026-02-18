
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { UserInfo, LiveSubMode } from '../types.ts';

interface LiveSessionProps {
  userInfo: UserInfo;
  mode: LiveSubMode;
  onClose: () => void;
  onSaveTranscript: (transcript: { text: string; role: 'user' | 'assistant' }[]) => void;
}

const LiveSession: React.FC<LiveSessionProps> = ({ userInfo, mode, onClose, onSaveTranscript }) => {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcription, setTranscription] = useState<{ text: string; role: 'user' | 'assistant' }[]>([]);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  const sessionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentTurnRef = useRef<{ user: string; ai: string }>({ user: '', ai: '' });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcription]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    if (isActive) {
      stopSession();
      setTimeout(startSession, 500);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const startSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let videoStream: MediaStream | null = null;
      if (mode === 'video') {
        videoStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: facingMode } 
        });
        if (videoRef.current) videoRef.current.srcObject = videoStream;
      }

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      let nextStartTime = 0;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            const audioSource = audioCtx.createMediaStreamSource(audioStream);
            const processor = audioCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              if (!isMuted) {
                const input = e.inputBuffer.getChannelData(0);
                const int16 = new Int16Array(input.length);
                for (let i = 0; i < input.length; i++) int16[i] = input[i] * 32768;
                const base64 = btoa(String.fromCharCode(...new Uint8Array(int16.buffer)));
                sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: { data: base64, mimeType: 'audio/pcm;rate=16000' } });
                });
              }
            };
            audioSource.connect(processor);
            processor.connect(audioCtx.destination);

            if (mode === 'video' && videoRef.current && canvasRef.current) {
              const canvas = canvasRef.current;
              const video = videoRef.current;
              const ctx = canvas.getContext('2d');
              frameIntervalRef.current = window.setInterval(() => {
                if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                  ctx.drawImage(video, 0, 0);
                  const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
                  const base64 = dataUrl.split(',')[1];
                  sessionPromise.then(session => {
                    session.sendRealtimeInput({ media: { data: base64, mimeType: 'image/jpeg' } });
                  });
                }
              }, 1000);
            }
          },
          onmessage: async (msg) => {
            const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              const decoded = atob(audioData);
              const bytes = new Uint8Array(decoded.length);
              for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
              const buffer = await decodeAudioDataLocal(bytes, outCtx);
              const source = outCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outCtx.destination);
              nextStartTime = Math.max(nextStartTime, outCtx.currentTime);
              source.start(nextStartTime);
              nextStartTime += buffer.duration;
            }

            if (msg.serverContent?.outputTranscription) {
              const text = msg.serverContent.outputTranscription.text;
              setTranscription(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...last, text: last.text + text };
                  return updated;
                }
                return [...prev, { role: 'assistant', text }];
              });
            }
            if (msg.serverContent?.inputTranscription) {
              const text = msg.serverContent.inputTranscription.text;
              setTranscription(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'user') {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...last, text: last.text + text };
                  return updated;
                }
                return [...prev, { role: 'user', text }];
              });
            }
          },
          onclose: () => setIsActive(false),
          onerror: () => setIsActive(false)
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          systemInstruction: `أنت MicroVision AI. تجري حواراً ${mode === 'video' ? 'فيديو' : 'صوتياً'} مباشراً مع طالبة الطب المختبري ${userInfo.student} تحت إشراف ${userInfo.professor}. استمع بعناية وأجب مباشرة بوضوح علمي وباللغة العربية. المعهد: ${userInfo.institute}.`
        }
      });
      
      sessionRef.current = await sessionPromise;
    } catch (e) {
      console.error("Live session failed", e);
      setIsActive(false);
    }
  };

  const stopSession = () => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    setIsActive(false);
  };

  const handleSave = () => {
    if (transcription.length > 0) {
      onSaveTranscript(transcription);
    }
  };

  async function decodeAudioDataLocal(data: Uint8Array, ctx: AudioContext) {
    const dataInt16 = new Int16Array(data.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    return buffer;
  }

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-6 space-y-4 h-full bg-slate-950 overflow-hidden">
      <div className="w-full flex justify-between items-center mb-4 z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="bg-slate-800 text-slate-300 px-4 py-2 rounded-xl hover:bg-slate-700 transition-colors text-sm font-bold"
          >
            ← إنهاء والعودة
          </button>
          
          <button 
            onClick={handleSave}
            disabled={transcription.length === 0}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl transition-all font-bold shadow-lg shadow-cyan-500/20"
            title="حفظ المحادثة في الدردشة"
          >
            <TripleArrowsIcon className="w-5 h-5" />
            <span className="text-xs">حفظ السجل</span>
          </button>
        </div>

        <h2 className="text-xl font-bold text-white">
          {mode === 'video' ? 'تحليل فيديو مباشر' : 'استشارة صوتية ذكية'}
        </h2>
      </div>

      <div className="relative w-full max-w-3xl bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden aspect-video flex items-center justify-center group/screen">
        {mode === 'video' ? (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute top-4 left-4 flex gap-2 z-20 opacity-0 group-hover/screen:opacity-100 transition-opacity">
               <button 
                onClick={toggleCamera}
                className="p-3 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/80 transition-all"
                title="قلب الكاميرا"
              >
                🔄
              </button>
            </div>
          </>
        ) : (
          <div className="relative flex flex-col items-center justify-center w-full h-full">
            <div className={`w-32 h-32 rounded-full bg-cyan-500/20 flex items-center justify-center text-5xl shadow-2xl shadow-cyan-500/10 ${isActive && !isMuted ? 'animate-pulse scale-110' : ''}`}>
              🎙️
            </div>
            {isActive && !isMuted && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border border-cyan-500/20 rounded-full animate-ping"></div>
              </div>
            )}
            {isMuted && <span className="mt-4 text-red-500 font-bold animate-pulse">الميكروفون مكتوم</span>}
          </div>
        )}
        
        {isActive && (
          <div className="absolute bottom-6 flex gap-4 z-40">
            <button 
              onClick={toggleMute}
              className={`p-4 rounded-full shadow-xl transition-all transform hover:scale-105 ${isMuted ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-cyan-400'}`}
              title={isMuted ? "إلغاء كتم الميكروفون" : "كتم الميكروفون"}
            >
              {isMuted ? '🔇' : '🎙️'}
            </button>
            <button 
              onClick={stopSession}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-xl transition-all transform hover:scale-105"
            >
              إيقاف مؤقت
            </button>
          </div>
        )}

        {!isActive && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30">
            <button 
              onClick={startSession}
              className="px-10 py-5 bg-cyan-500 hover:bg-cyan-400 text-white font-black rounded-3xl shadow-xl shadow-cyan-500/20 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3"
            >
              <span>بدء {mode === 'video' ? 'البث' : 'التسجيل'} المباشر</span>
              <span className="text-xl">🚀</span>
            </button>
          </div>
        )}
      </div>

      <div className="w-full max-w-3xl flex-1 glass-effect p-6 rounded-[2rem] flex flex-col overflow-hidden border border-white/10">
        <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            {isActive ? 'جاري التحليل والمتابعة...' : 'الجلسة غير نشطة'}
          </p>
          <span className="text-[10px] text-slate-400 font-bold">{userInfo.institute}</span>
        </div>
        <div 
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto custom-scrollbar text-sm"
        >
          {transcription.map((t, i) => (
            <div 
              key={i} 
              className={`p-4 rounded-2xl leading-relaxed transition-all duration-300 ${
                t.role === 'assistant' 
                ? 'bg-cyan-500/10 text-cyan-200 ml-12 border border-cyan-500/20' 
                : 'bg-slate-800/80 text-slate-100 mr-12 text-left border border-slate-700'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-black text-[10px] opacity-60 uppercase tracking-widest">
                  {t.role === 'assistant' ? 'MicroVision AI' : userInfo.student}
                </span>
                <span className="text-[10px] opacity-30">{new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="whitespace-pre-wrap">{t.text}</div>
            </div>
          ))}
          {transcription.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4">
              <div className="text-5xl opacity-20 animate-bounce">💬</div>
              <p className="italic">سيبدأ تسجيل وتحويل صوتك إلى نص هنا مباشرة مع إجابات فورية من النظام...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TripleArrowsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7m8 14l-7-7 7-7" />
  </svg>
);

export default LiveSession;
