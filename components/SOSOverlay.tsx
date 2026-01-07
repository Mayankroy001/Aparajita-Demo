
import React, { useEffect, useState } from 'react';
import { AlertTriangle, X, ShieldAlert, MapPin, Radio, Phone, Users, CheckCircle2 } from 'lucide-react';
import { LocationData, EmergencyContact } from '../types';

interface Props {
  location: LocationData;
  contacts: EmergencyContact[];
  onClose: () => void;
}

const SOSOverlay: React.FC<Props> = ({ location, contacts, onClose }) => {
  const [countdown, setCountdown] = useState(5);
  const [isSent, setIsSent] = useState(false);
  const [status, setStatus] = useState({
    broadcasting: false,
    familyCalled: false,
    policeCalled: false
  });

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsSent(true);
      // Trigger sequential simulated actions
      const timeline = async () => {
        setStatus(s => ({ ...s, broadcasting: true }));
        await new Promise(r => setTimeout(r, 1200));
        setStatus(s => ({ ...s, familyCalled: true }));
        await new Promise(r => setTimeout(r, 1500));
        setStatus(s => ({ ...s, policeCalled: true }));
      };
      timeline();
    }
  }, [countdown]);

  return (
    <div className="fixed inset-0 bg-rose-600 z-[100] flex flex-col text-white animate-in fade-in duration-300">
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-8 relative">
          <div className="absolute inset-0 bg-white/10 rounded-full animate-ping"></div>
          <AlertTriangle size={64} className="animate-pulse" />
        </div>

        {!isSent ? (
          <>
            <h1 className="text-4xl font-black mb-4">SOS TRIGGERED</h1>
            <p className="text-rose-100 text-lg mb-12">
              Alerting nearby users and emergency services in...
            </p>
            <div className="text-8xl font-black tabular-nums mb-12">{countdown}</div>
            <button 
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 border-2 border-white/50 px-12 py-4 rounded-full font-bold text-lg transition-all"
            >
              Cancel Alert
            </button>
          </>
        ) : (
          <div className="space-y-6 w-full max-w-sm animate-in slide-in-from-bottom-8 duration-500">
            <div className="space-y-2">
              <h2 className="text-3xl font-black uppercase tracking-tight">Active Response</h2>
              <p className="text-rose-100 text-sm">Coordinates: {location.latitude?.toFixed(5)}, {location.longitude?.toFixed(5)}</p>
            </div>

            <div className="space-y-3">
              {/* Broadcasting to Females */}
              <div className={`p-4 rounded-2xl border transition-all flex items-center gap-4 ${status.broadcasting ? 'bg-white/20 border-white/40 shadow-lg' : 'bg-black/10 border-white/5'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${status.broadcasting ? 'bg-indigo-500 text-white' : 'text-rose-200'}`}>
                  {status.broadcasting ? <Radio className="animate-pulse" /> : <Users />}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-sm">Aparajita Network</p>
                  <p className="text-[10px] text-rose-100 uppercase tracking-widest font-bold">
                    {status.broadcasting ? 'Broadcast active (8 nearby users notified)' : 'Pending...'}
                  </p>
                </div>
                {status.broadcasting && <CheckCircle2 size={20} className="text-emerald-300" />}
              </div>

              {/* Calling Family */}
              <div className={`p-4 rounded-2xl border transition-all flex items-center gap-4 ${status.familyCalled ? 'bg-white/20 border-white/40 shadow-lg' : 'bg-black/10 border-white/5'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${status.familyCalled ? 'bg-amber-500 text-white' : 'text-rose-200'}`}>
                  {status.familyCalled ? <Phone className="animate-pulse" /> : <Phone />}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-sm">Family & Friends</p>
                  <p className="text-[10px] text-rose-100 uppercase tracking-widest font-bold">
                    {status.familyCalled ? `Calling: ${contacts[0]?.name || 'Home'}` : 'Connecting...'}
                  </p>
                </div>
                {status.familyCalled && <CheckCircle2 size={20} className="text-emerald-300" />}
              </div>

              {/* Calling Police */}
              <div className={`p-4 rounded-2xl border transition-all flex items-center gap-4 ${status.policeCalled ? 'bg-white/20 border-white/40 shadow-lg' : 'bg-black/10 border-white/5'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${status.policeCalled ? 'bg-indigo-900 text-white' : 'text-rose-200'}`}>
                  <ShieldAlert />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-sm">Local Police Station</p>
                  <p className="text-[10px] text-rose-100 uppercase tracking-widest font-bold">
                    {status.policeCalled ? 'Control Room Alerted' : 'Searching Station...'}
                  </p>
                </div>
                {status.policeCalled && <CheckCircle2 size={20} className="text-emerald-300" />}
              </div>
            </div>

            <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
               <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">How Tracking Works</p>
               <p className="text-[11px] text-rose-100 text-left italic">
                 "Your location is now visible on the Live Radar of every Aparajita user within 5km. They can navigate directly to you to provide assistance while help arrives."
               </p>
            </div>

            <button 
              onClick={onClose}
              className="w-full bg-white text-rose-600 py-4 rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-3 mt-4"
            >
              <X size={24} />
              I am Safe Now
            </button>
          </div>
        )}
      </div>

      <div className="p-8 text-[10px] text-rose-200 text-center uppercase tracking-[0.2em] font-bold">
        Aparajita Emergency Protocol Active
      </div>
    </div>
  );
};

export default SOSOverlay;
