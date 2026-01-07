
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, EmergencyContact, LocationData, User, SafeExitConfig } from './types';
import AuthScreen from './components/AuthScreen';
import VerificationScreen from './components/VerificationScreen';
import Dashboard from './components/Dashboard';
import CommunityFeed from './components/CommunityFeed';
import ContactList from './components/ContactList';
import Header from './components/Header';
import SOSOverlay from './components/SOSOverlay';
import SplashScreen from './components/SplashScreen';
import { 
  Users, 
  PhoneCall, 
  Home, 
  AlertTriangle 
} from 'lucide-react';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentAppState, setCurrentAppState] = useState<AppState>(AppState.AUTH);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [location, setLocation] = useState<LocationData>({ latitude: null, longitude: null, accuracy: null });
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);
  const [safeExit, setSafeExit] = useState<SafeExitConfig>({ targetTime: '', contactIds: [], isActive: false });
  const lastShakeTime = useRef<number>(0);

  // Handle Splash Screen Timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Load user and safe exit config from local storage
  useEffect(() => {
    const storedUser = localStorage.getItem('aparajita_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      setCurrentAppState(AppState.VERIFICATION);
    }
    
    const storedExit = localStorage.getItem('aparajita_safe_exit');
    if (storedExit) {
      const parsed = JSON.parse(storedExit);
      // Migration: Ensure contactIds is an array
      if (!Array.isArray(parsed.contactIds)) {
        parsed.contactIds = parsed.contactId ? [parsed.contactId] : [];
        delete parsed.contactId;
      }
      setSafeExit(parsed);
    }
  }, []);

  // Load contacts from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem('aparajita_contacts');
    if (stored) setContacts(JSON.parse(stored));
  }, []);

  // Sync contacts to local storage
  useEffect(() => {
    localStorage.setItem('aparajita_contacts', JSON.stringify(contacts));
  }, [contacts]);

  // Sync safe exit to local storage
  useEffect(() => {
    localStorage.setItem('aparajita_safe_exit', JSON.stringify(safeExit));
  }, [safeExit]);

  // MONITOR SAFE EXIT TIMER
  useEffect(() => {
    if (!safeExit.isActive || !safeExit.targetTime) return;

    const timerInterval = setInterval(() => {
      const now = new Date();
      const [hours, minutes] = safeExit.targetTime.split(':').map(Number);
      const target = new Date();
      target.setHours(hours, minutes, 0, 0);

      // Trigger if we are at or past the target time
      if (now >= target) {
        triggerSOS();
        setSafeExit(prev => ({ ...prev, isActive: false }));
      }
    }, 10000); // Check every 10 seconds for battery efficiency

    return () => clearInterval(timerInterval);
  }, [safeExit, isSOSActive]);

  // Handle Location - Optimized for Speed
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => console.warn("Initial coarse location fix failed", err),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 }
      );

      const watcher = navigator.geolocation.watchPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => console.error("High-accuracy location error", err),
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 0 
        }
      );
      
      return () => navigator.geolocation.clearWatch(watcher);
    }
  }, []);

  const handleAuthComplete = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('aparajita_user', JSON.stringify(user));
    setCurrentAppState(AppState.VERIFICATION);
  };

  const triggerSOS = useCallback(() => {
    if (!isSOSActive) {
      setIsSOSActive(true);
      console.log("SOS TRIGGERED!");
    }
  }, [isSOSActive]);

  // Shake detection logic
  useEffect(() => {
    const handleShake = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity;
      if (!acceleration) return;

      const threshold = 15;
      const x = acceleration.x || 0;
      const y = acceleration.y || 0;
      const z = acceleration.z || 0;
      
      const speed = Math.sqrt(x*x + y*y + z*z);
      const now = Date.now();

      if (speed > threshold && now - lastShakeTime.current > 500) {
        lastShakeTime.current = now;
        setShakeCount(prev => {
          if (prev >= 2) {
            triggerSOS();
            return 0;
          }
          return prev + 1;
        });
        
        setTimeout(() => setShakeCount(0), 3000);
      }
    };

    window.addEventListener('devicemotion', handleShake);
    return () => window.removeEventListener('devicemotion', handleShake);
  }, [triggerSOS]);

  const renderContent = () => {
    switch (currentAppState) {
      case AppState.AUTH:
        return <AuthScreen onAuthComplete={handleAuthComplete} />;
      case AppState.VERIFICATION:
        return <VerificationScreen onVerified={() => setCurrentAppState(AppState.DASHBOARD)} />;
      case AppState.DASHBOARD:
        return <Dashboard 
          location={location} 
          onSOS={triggerSOS} 
          safeExit={safeExit} 
          setSafeExit={setSafeExit}
          contacts={contacts}
        />;
      case AppState.COMMUNITY:
        return <CommunityFeed />;
      case AppState.CONTACTS:
        return <ContactList contacts={contacts} setContacts={setContacts} />;
      default:
        return <Dashboard 
          location={location} 
          onSOS={triggerSOS} 
          safeExit={safeExit} 
          setSafeExit={setSafeExit}
          contacts={contacts}
        />;
    }
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  if (currentAppState === AppState.AUTH) {
    return <AuthScreen onAuthComplete={handleAuthComplete} />;
  }

  if (currentAppState === AppState.VERIFICATION) {
    return <VerificationScreen onVerified={() => setCurrentAppState(AppState.DASHBOARD)} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 relative">
      <Header user={currentUser} />
      
      <main className="flex-1 pb-24 overflow-y-auto px-4">
        {renderContent()}
      </main>

      <button 
        onClick={triggerSOS}
        className="fixed bottom-24 right-6 w-16 h-16 bg-rose-600 rounded-full shadow-xl flex items-center justify-center text-white z-40 transition-transform active:scale-95 animate-pulse-red"
      >
        <AlertTriangle size={32} />
      </button>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-between items-center z-50">
        <button onClick={() => setCurrentAppState(AppState.DASHBOARD)} className={`flex flex-col items-center gap-1 ${currentAppState === AppState.DASHBOARD ? 'text-indigo-600' : 'text-slate-400'}`}>
          <Home size={24} />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button onClick={() => setCurrentAppState(AppState.COMMUNITY)} className={`flex flex-col items-center gap-1 ${currentAppState === AppState.COMMUNITY ? 'text-indigo-600' : 'text-slate-400'}`}>
          <Users size={24} />
          <span className="text-[10px] font-medium">Community</span>
        </button>
        <button onClick={() => setCurrentAppState(AppState.CONTACTS)} className={`flex flex-col items-center gap-1 ${currentAppState === AppState.CONTACTS ? 'text-indigo-600' : 'text-slate-400'}`}>
          <PhoneCall size={24} />
          <span className="text-[10px] font-medium">Contacts</span>
        </button>
      </nav>

      {isSOSActive && (
        <SOSOverlay location={location} contacts={contacts} onClose={() => setIsSOSActive(false)} />
      )}
    </div>
  );
};

export default App;
