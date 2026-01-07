
import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle2, ShieldAlert, Loader2, Clock } from 'lucide-react';
import { verifyIdentity } from '../services/geminiService';

interface Props {
  onVerified: () => void;
}

const VerificationScreen: React.FC<Props> = ({ onVerified }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const initCamera = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (err) {
        setError("Camera permission denied. Please allow camera access to continue.");
      }
    };
    initCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const handleCapture = async () => {
    if (!canvasRef.current || !videoRef.current) return;

    setLoading(true);
    setError(null);
    setIsQuotaExceeded(false);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    
    // High compression to stay within payload limits
    const dataUrl = canvas.toDataURL('image/jpeg', 0.6); 
    const base64 = dataUrl.split(',')[1];

    try {
      const isVerified = await verifyIdentity(base64);

      if (isVerified) {
        onVerified();
      } else {
        setError("Face detection failed. Please ensure your face is clearly visible, centered, and well-lit. We verify all members to keep Aparajita a safe space for everyone.");
      }
    } catch (err: any) {
      const errorMsg = err?.message || JSON.stringify(err);
      if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
        setIsQuotaExceeded(true);
        setError("Aparajita's AI servers are currently busy (Rate Limit Exceeded). Please wait 60 seconds and try again.");
      } else {
        setError("AI Service is temporarily unreachable. Check your internet connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-900 flex flex-col items-center justify-center p-6 text-white text-center">
      <div className="mb-8">
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
          <CheckCircle2 size={32} className="text-emerald-400" />
        </div>
        <h2 className="text-3xl font-black mb-2 tracking-tight">Identity Check</h2>
        <p className="text-indigo-200 text-xs max-w-xs mx-auto leading-relaxed">
          One-time face verification to ensure Aparajita remains a trusted community for all members.
        </p>
      </div>

      <div className="relative w-full max-w-sm aspect-[3/4] bg-indigo-950 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-indigo-700/50 mb-8">
        {!stream && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-indigo-400" size={32} />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Initializing...</span>
          </div>
        )}
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover scale-x-[-1]"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {loading && (
          <div className="absolute inset-0 bg-indigo-950/80 flex flex-col items-center justify-center backdrop-blur-sm">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
              <Loader2 className="animate-spin text-white mb-6" size={48} />
            </div>
            <p className="font-black text-sm uppercase tracking-[0.2em] text-white">Analyzing Identity</p>
            <p className="text-[10px] text-indigo-300 mt-2">Checking image clarity...</p>
          </div>
        )}

        <div className="absolute inset-0 border-[40px] border-indigo-900/40 pointer-events-none">
          <div className="w-full h-full border border-white/10 rounded-3xl"></div>
        </div>
      </div>

      {error && (
        <div className={`p-4 rounded-2xl mb-6 flex items-start gap-3 text-left max-w-sm border animate-in slide-in-from-top-2 duration-300 ${isQuotaExceeded ? 'bg-amber-500/10 border-amber-500/40' : 'bg-rose-500/10 border-rose-500/40'}`}>
          {isQuotaExceeded ? (
            <Clock size={20} className="shrink-0 text-amber-400" />
          ) : (
            <ShieldAlert size={20} className="shrink-0 text-rose-400" />
          )}
          <p className={`text-xs leading-relaxed font-bold ${isQuotaExceeded ? 'text-amber-100' : 'text-rose-100'}`}>{error}</p>
        </div>
      )}

      <button 
        onClick={handleCapture}
        disabled={loading || !stream}
        className="w-full max-w-sm bg-white text-indigo-900 py-5 rounded-[1.5rem] font-black text-lg shadow-xl hover:bg-indigo-50 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {loading ? <Loader2 className="animate-spin" size={24} /> : <Camera size={24} />}
        {error ? "Retry Verification" : "Verify & Continue"}
      </button>

      <div className="mt-8">
        <div className="flex items-center gap-2 justify-center mb-1">
          <div className="w-1 h-1 rounded-full bg-emerald-400"></div>
          <p className="text-indigo-300 text-[9px] uppercase tracking-[0.3em] font-black">
            Secure Member Verification
          </p>
        </div>
        <p className="text-[9px] text-indigo-400/60 max-w-[220px]">
          Images are used for session verification only and are not stored.
        </p>
      </div>
    </div>
  );
};

export default VerificationScreen;
