
import React, { useEffect, useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';

const SplashScreen: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="fixed inset-0 bg-indigo-950 flex flex-col items-center justify-center z-[200] overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-800 rounded-full blur-[100px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-900 rounded-full blur-[120px] opacity-10 animate-pulse delay-700"></div>

      <div className={`transition-all duration-1000 transform ${isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-4'} flex flex-col items-center`}>
        <div className="relative mb-8">
          {/* Outer ring animation */}
          <div className="absolute inset-0 bg-indigo-600/30 rounded-[2.5rem] blur-xl animate-ping opacity-50"></div>
          
          <div className="relative w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-500/40">
            <ShieldCheck size={56} className="text-indigo-600" strokeWidth={2.5} />
          </div>
        </div>

        <div className="text-center space-y-3">
          <h1 className="text-5xl font-black text-white tracking-tighter">
            Aparajita
          </h1>
          <div className="flex items-center gap-2 justify-center">
            <div className="h-[1px] w-4 bg-indigo-400/50"></div>
            <p className="text-indigo-200 text-xs font-bold uppercase tracking-[0.3em]">
              Invincible & Safe
            </p>
            <div className="h-[1px] w-4 bg-indigo-400/50"></div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-16 flex flex-col items-center gap-4">
        <Loader2 size={24} className="text-white/40 animate-spin" />
        <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">
          Securing your world
        </p>
      </div>
      
      <div className="absolute bottom-8 text-[9px] text-white/20 font-medium">
        Version 2.0 • Empowerment Initiative
      </div>
    </div>
  );
};

export default SplashScreen;
