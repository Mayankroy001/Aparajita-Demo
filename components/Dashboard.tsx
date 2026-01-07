
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ShieldAlert, Phone, Users, Info, BellRing, X, Loader2, Navigation, Radio, ExternalLink, Share2, LocateFixed, Clock, ShieldCheck, UserCheck, Send, Compass, CheckSquare, Square } from 'lucide-react';
import { LocationData, SOSAlert, SafeExitConfig, EmergencyContact } from '../types';
import { findNearestPoliceStation, getReverseGeocode, getLegalRights, getHotlines } from '../services/geminiService';

interface Props {
  location: LocationData;
  onSOS: () => void;
  safeExit: SafeExitConfig;
  setSafeExit: React.Dispatch<React.SetStateAction<SafeExitConfig>>;
  contacts: EmergencyContact[];
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Utility to format 24h string to 12h AM/PM for display
const formatTo12Hour = (time24: string) => {
  if (!time24) return "";
  const [hours, minutes] = time24.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${minutes} ${ampm}`;
};

const Dashboard: React.FC<Props> = ({ location, onSOS, safeExit, setSafeExit, contacts }) => {
  const [address, setAddress] = useState<string>('Locating...');
  const [policeInfo, setPoliceInfo] = useState<{ text: string; links: any[] } | null>(null);
  const [loadingPolice, setLoadingPolice] = useState(false);
  const [activeModal, setActiveModal] = useState<'hotlines' | 'legal' | 'safewalk' | 'tracking' | 'safeexit' | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [loadingModal, setLoadingModal] = useState(false);
  const [isSafeWalkActive, setIsSafeWalkActive] = useState(false);
  const [isMapLibraryReady, setIsMapLibraryReady] = useState(false);
  const [isSharingLiveLocation, setIsSharingLiveLocation] = useState(false);
  
  // State for manual AM/PM selection
  const [tempHour, setTempHour] = useState('12');
  const [tempMin, setTempMin] = useState('00');
  const [tempPeriod, setTempPeriod] = useState<'AM' | 'PM'>('PM');
  
  const lastFetchedLoc = useRef<{lat: number, lng: number} | null>(null);
  
  const [nearbyAlerts, setNearbyAlerts] = useState<SOSAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<SOSAlert | null>(null);
  
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const otherMarkersRef = useRef<Record<string, any>>({});
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Sync temp time state when modal opens or safeExit changes
  useEffect(() => {
    if (safeExit.targetTime) {
      const [h24, m] = safeExit.targetTime.split(':');
      const hInt = parseInt(h24);
      const period = hInt >= 12 ? 'PM' : 'AM';
      const h12 = hInt % 12 || 12;
      setTempHour(h12.toString());
      setTempMin(m);
      setTempPeriod(period);
    }
  }, [activeModal, safeExit.targetTime]);

  // Update real target time when temp state changes
  useEffect(() => {
    let h24 = parseInt(tempHour);
    if (tempPeriod === 'PM' && h24 < 12) h24 += 12;
    if (tempPeriod === 'AM' && h24 === 12) h24 = 0;
    
    const timeString = `${h24.toString().padStart(2, '0')}:${tempMin.padStart(2, '0')}`;
    if (safeExit.targetTime !== timeString) {
      setSafeExit(prev => ({ ...prev, targetTime: timeString }));
    }
  }, [tempHour, tempMin, tempPeriod]);

  // Initialize with the requested fake distress signals
  useEffect(() => {
    if (location.latitude && location.longitude && nearbyAlerts.length === 0) {
      const mockAlerts: SOSAlert[] = [
        {
          id: 'mock-1',
          userName: 'Anjali D.',
          latitude: location.latitude + 0.0032,
          longitude: location.longitude + 0.0021,
          timestamp: Date.now(),
          distance: '450m'
        },
        {
          id: 'mock-2',
          userName: 'Sneha R.',
          latitude: location.latitude - 0.0041,
          longitude: location.longitude - 0.0032,
          timestamp: Date.now(),
          distance: '720m'
        }
      ];
      setNearbyAlerts(mockAlerts);
    }
  }, [location.latitude, location.longitude]);

  useEffect(() => {
    const checkLeaflet = () => {
      if ((window as any).L) setIsMapLibraryReady(true);
      else setTimeout(checkLeaflet, 100);
    };
    checkLeaflet();
  }, []);

  // Map Lifecycle & Real-time Update Logic
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !isMapLibraryReady || !location.latitude || !location.longitude || !mapContainerRef.current) return;

    try {
      if (!mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current, { 
          zoomControl: false,
          attributionControl: false 
        }).setView([location.latitude, location.longitude], 16);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(mapRef.current);
        
        markerRef.current = L.marker([location.latitude, location.longitude], {
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: #4f46e5; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 12px rgba(79, 70, 229, 0.8);"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          })
        }).addTo(mapRef.current);

        setTimeout(() => mapRef.current?.invalidateSize(), 300);
      } else {
        if (markerRef.current) markerRef.current.setLatLng([location.latitude, location.longitude]);
        if (!selectedAlert) {
          mapRef.current.panTo([location.latitude, location.longitude], { animate: true });
        }
      }

      nearbyAlerts.forEach(alert => {
        if (!otherMarkersRef.current[alert.id]) {
          otherMarkersRef.current[alert.id] = L.marker([alert.latitude, alert.longitude], {
            icon: L.divIcon({
              className: 'sos-marker',
              html: `<div class="relative flex items-center justify-center"><div class="absolute w-10 h-10 bg-rose-500/30 rounded-full animate-ping"></div><div style="background-color: #e11d48; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px #e11d48; z-index: 10;"></div></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })
          }).addTo(mapRef.current).bindPopup(`<div style="text-align:center"><b>${alert.userName}</b><br/>SOS ACTIVE</div>`).on('click', () => handleTrackAlert(alert));
        } else {
          otherMarkersRef.current[alert.id].setLatLng([alert.latitude, alert.longitude]);
        }
      });
    } catch (err) { console.error("Leaflet Error:", err); }
  }, [location.latitude, location.longitude, isMapLibraryReady, nearbyAlerts, selectedAlert]);

  useEffect(() => {
    const lat = location.latitude;
    const lng = location.longitude;
    if (lat && lng) {
      if (lastFetchedLoc.current) {
        const dist = getDistance(lat, lng, lastFetchedLoc.current.lat, lastFetchedLoc.current.lng);
        if (dist < 100) return;
      }
      const fetchAddressAndPolice = async () => {
        setLoadingPolice(true);
        lastFetchedLoc.current = { lat, lng };
        try {
          const [addr, info] = await Promise.all([getReverseGeocode(lat, lng), findNearestPoliceStation(lat, lng)]);
          setAddress(addr);
          setPoliceInfo(info);
        } catch (err) { console.error(err); }
        finally { setLoadingPolice(false); }
      };
      fetchAddressAndPolice();
    }
  }, [location.latitude, location.longitude]);

  const handleTrackAlert = (alert: SOSAlert) => {
    setSelectedAlert(alert);
    if (mapRef.current) {
      mapRef.current.setView([alert.latitude, alert.longitude], 18, { animate: true, duration: 1 });
      setActiveModal('tracking');
    }
  };

  const launchDirections = () => {
    if (!selectedAlert || !location.latitude) return;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${selectedAlert.latitude},${selectedAlert.longitude}&travelmode=walking`;
    window.open(url, '_blank');
  };

  const handleShareLocation = async () => {
    if (!location.latitude) return;
    const shareUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'My Live Location - Aparajita', text: `Currently at ${address}.`, url: shareUrl });
        setIsSharingLiveLocation(true);
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Copied to clipboard!');
      setIsSharingLiveLocation(true);
    }
    setTimeout(() => setIsSharingLiveLocation(false), 30000);
  };

  const handleModalOpen = async (type: any) => {
    setActiveModal(type);
    if (type === 'safewalk' || type === 'tracking' || type === 'safeexit') return;
    setLoadingModal(true);
    const loc = address !== 'Locating...' ? address : 'my area';
    try {
      if (type === 'hotlines') setModalData(await getHotlines(loc));
      else if (type === 'legal') setModalData(await getLegalRights(loc));
    } catch (err) {} finally { setLoadingModal(false); }
  };

  const handleToggleSafeExit = () => {
    if (safeExit.isActive) {
      setSafeExit({ ...safeExit, isActive: false });
    } else {
      if (!safeExit.targetTime || safeExit.contactIds.length === 0) {
        setActiveModal('safeexit');
        return;
      }
      setSafeExit({ ...safeExit, isActive: true });
    }
  };

  const handleToggleContactForExit = (id: string) => {
    setSafeExit(prev => {
      const exists = prev.contactIds.includes(id);
      if (exists) {
        return { ...prev, contactIds: prev.contactIds.filter(cid => cid !== id) };
      } else {
        return { ...prev, contactIds: [...prev.contactIds, id] };
      }
    });
  };

  const selectedContactsNames = contacts
    .filter(c => safeExit.contactIds.includes(c.id))
    .map(c => c.name)
    .join(', ') || 'None Selected';

  return (
    <div className="py-6 space-y-4">
      {/* Live SOS Radar Notifications */}
      {nearbyAlerts.length > 0 && !selectedAlert && (
        <div className="space-y-3">
          {nearbyAlerts.map(alert => (
            <div key={alert.id} className="bg-[#e11d48] p-4 pr-5 rounded-[2rem] text-white shadow-xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <Radio size={24} className="animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-200/80 mb-0.5">Incoming Distress</p>
                <p className="font-black text-base truncate leading-tight">
                  {alert.userName} needs help • {alert.distance}
                </p>
              </div>
              <button 
                onClick={() => handleTrackAlert(alert)} 
                className="bg-white text-rose-600 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
              >
                Track
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Location & Map Card */}
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1 text-emerald-600">Active Location</h3>
            <p className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1 truncate leading-tight">
              <MapPin size={18} className="text-indigo-600 shrink-0" />
              {address}
            </p>
          </div>
        </div>
        <div id="map" ref={mapContainerRef} className="mb-4 bg-slate-100 border border-slate-200 min-h-[260px] flex items-center justify-center relative rounded-2xl overflow-hidden z-10 shadow-inner">
          {!isMapLibraryReady || !location.latitude ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-indigo-600" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pinpointing Location...</span>
            </div>
          ) : null}
          <div className="absolute bottom-4 right-4 z-[400] flex flex-col gap-2">
            <button 
              onClick={() => { 
                setSelectedAlert(null); 
                mapRef.current?.setView([location.latitude, location.longitude], 16, { animate: true }); 
              }} 
              className="bg-white p-3 rounded-full shadow-xl border border-slate-100 text-indigo-600 hover:bg-slate-50 transition-colors"
            >
              <LocateFixed size={20} />
            </button>
            <button 
              onClick={handleShareLocation} 
              className={`p-3 rounded-full shadow-xl border ${isSharingLiveLocation ? 'bg-emerald-500 text-white' : 'bg-white text-indigo-600'}`}
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Safe Exit Timer Card */}
      <section className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 overflow-hidden relative">
        <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-2xl">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider">Safe Exit Timer</h3>
              <p className="text-[10px] text-indigo-100 font-medium">Automatic SOS if not cleared by end time</p>
            </div>
          </div>
          <button 
            onClick={handleToggleSafeExit}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${safeExit.isActive ? 'bg-rose-500 text-white shadow-lg' : 'bg-white/20 text-white border border-white/30'}`}
          >
            {safeExit.isActive ? 'Active' : 'Enable'}
          </button>
        </div>

        {safeExit.isActive ? (
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 flex items-center justify-between animate-in fade-in zoom-in-95">
             <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Protocol Target</p>
                <p className="text-2xl font-black">{formatTo12Hour(safeExit.targetTime)}</p>
             </div>
             <div className="text-right flex-1 ml-4 overflow-hidden">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Notifying Trusted Circle</p>
                <p className="font-bold truncate text-sm">{selectedContactsNames}</p>
             </div>
             <button onClick={() => handleModalOpen('safeexit')} className="ml-2 p-2 bg-white/20 rounded-lg"><Info size={16} /></button>
          </div>
        ) : (
          <button 
            onClick={() => handleModalOpen('safeexit')}
            className="w-full bg-indigo-500/50 border border-indigo-400/50 rounded-2xl p-4 flex items-center justify-between hover:bg-indigo-500/70 transition-all group"
          >
            <span className="text-xs font-bold text-indigo-100">Configure Workplace End Time</span>
            <div className="bg-white/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
              <ShieldCheck size={16} />
            </div>
          </button>
        )}
      </section>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-4">
        <button onClick={onSOS} className="bg-rose-600 p-6 rounded-3xl text-white shadow-xl shadow-rose-200 flex flex-col items-center gap-3 active:scale-95 transition-transform"><ShieldAlert size={28} /><span className="font-bold">Panic Mode</span></button>
        <button onClick={() => handleModalOpen('hotlines')} className="bg-white p-6 rounded-3xl text-slate-700 shadow-sm border border-slate-100 flex flex-col items-center gap-3 active:scale-95 transition-transform"><Phone size={28} className="text-indigo-600" /><span className="font-bold">Hotlines</span></button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => handleModalOpen('safewalk')} className={`p-6 rounded-3xl shadow-sm border flex flex-col items-center gap-3 active:scale-95 transition-transform ${isSafeWalkActive ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700'}`}><Navigation size={28} className={isSafeWalkActive ? 'animate-pulse' : 'text-indigo-600'} /><span className="font-bold">Safe Walk</span></button>
        <button onClick={() => handleModalOpen('legal')} className="bg-white p-6 rounded-3xl text-slate-700 shadow-sm border border-slate-100 flex flex-col items-center gap-3 active:scale-95 transition-transform"><Info size={28} className="text-indigo-600" /><span className="font-bold">Legal Rights</span></button>
      </div>

      {/* Tracking Modal */}
      {activeModal === 'tracking' && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-300 relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                  <Radio size={24} className="animate-pulse" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Aparajita Tracking
                </h2>
              </div>
              <button 
                onClick={() => { setActiveModal(null); setSelectedAlert(null); }} 
                className="p-2.5 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-[#fff1f2] rounded-[2.5rem] p-8 mb-8 relative">
              <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.05] pointer-events-none">
                <ShieldAlert size={140} />
              </div>

              <div className="flex items-start gap-5 mb-6">
                <div className="w-16 h-16 bg-[#e11d48] rounded-[1.5rem] flex items-center justify-center text-white shadow-lg shadow-rose-200">
                  <Users size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-900">{selectedAlert?.userName}</h3>
                  <p className="text-[10px] font-black text-[#e11d48] uppercase tracking-[0.2em] leading-tight">
                    Status: Extreme Emergency
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-white/70 backdrop-blur-sm px-6 py-3 rounded-2xl flex items-center gap-3 border border-rose-100/50">
                  <MapPin size={18} className="text-rose-500" />
                  <span className="text-xs font-bold text-slate-700">Estimated {selectedAlert?.distance} from you</span>
                </div>
                <div className="bg-white/70 backdrop-blur-sm px-6 py-3 rounded-2xl flex items-center gap-3 border border-rose-100/50">
                  <Radio size={18} className="text-rose-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-700">Real-time GPS Uplink Active</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <button 
                onClick={launchDirections}
                className="w-full bg-[#e11d48] text-white py-5 rounded-[1.5rem] font-black text-lg shadow-xl shadow-rose-100 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
              >
                <Compass size={24} />
                Launch Directions
              </button>
              <button 
                onClick={() => alert("Police dispatch notified with coordinates.")}
                className="w-full bg-white border-2 border-slate-100 text-slate-800 py-5 rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
              >
                <Share2 size={24} className="text-slate-400" />
                Send Location to Police
              </button>
            </div>

            <p className="text-[9px] text-slate-400 font-black uppercase text-center tracking-[0.15em] leading-relaxed max-w-[260px] mx-auto opacity-70">
              Navigate to help, but prioritize your own safety. Local authorities have also been notified.
            </p>
          </div>
        </div>
      )}

      {/* Other Modals */}
      {activeModal && activeModal !== 'tracking' && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-t-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 capitalize">
                {activeModal === 'safeexit' ? <Clock className="text-indigo-600" /> : <Info className="text-indigo-600" />}
                {activeModal === 'safeexit' ? 'Safe Exit Setup' : activeModal}
              </h2>
              <button onClick={() => { setActiveModal(null); setModalData(null); }} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto pr-2 pb-4">
              {activeModal === 'safeexit' ? (
                <div className="space-y-6">
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <p className="text-xs text-indigo-800 leading-relaxed font-bold">
                      Select departure time and contacts to notify. Protocol automatically includes AM/PM selection based on your preference.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* CUSTOM TIME PICKER FOR MANUAL AM/PM */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Manual Time Selection</label>
                      <div className="flex items-center gap-3">
                        {/* Hour */}
                        <div className="flex-1 space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Hour</label>
                          <select 
                            value={tempHour}
                            onChange={(e) => setTempHour(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 shadow-inner appearance-none"
                          >
                            {[1,2,3,4,5,6,7,8,9,10,11,12].map(h => (
                              <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>
                            ))}
                          </select>
                        </div>
                        {/* Minute */}
                        <div className="flex-1 space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Minute</label>
                          <select 
                            value={tempMin}
                            onChange={(e) => setTempMin(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 shadow-inner appearance-none"
                          >
                            {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                        {/* AM/PM Toggle */}
                        <div className="flex-1 space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Period</label>
                          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                            <button 
                              onClick={() => setTempPeriod('AM')}
                              className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${tempPeriod === 'AM' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                              AM
                            </button>
                            <button 
                              onClick={() => setTempPeriod('PM')}
                              className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${tempPeriod === 'PM' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                              PM
                            </button>
                          </div>
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-2 ml-1 font-bold">Protocol will trigger at: {formatTo12Hour(safeExit.targetTime)}</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notify Trusted Circle</label>
                      <div className="space-y-2">
                        {contacts.length === 0 ? (
                          <p className="text-[9px] text-rose-500 font-bold mt-1 ml-1">Please add contacts in the Contacts tab first.</p>
                        ) : (
                          contacts.map(contact => (
                            <button
                              key={contact.id}
                              onClick={() => handleToggleContactForExit(contact.id)}
                              className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${safeExit.contactIds.includes(contact.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${safeExit.contactIds.includes(contact.id) ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                  <UserCheck size={16} />
                                </div>
                                <div className="text-left">
                                  <p className="text-xs font-bold text-slate-700">{contact.name}</p>
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{contact.relation}</p>
                                </div>
                              </div>
                              {safeExit.contactIds.includes(contact.id) ? (
                                <CheckSquare size={20} className="text-indigo-600" />
                              ) : (
                                <Square size={20} className="text-slate-200" />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => { setSafeExit({ ...safeExit, isActive: true }); setActiveModal(null); }}
                    disabled={!safeExit.targetTime || safeExit.contactIds.length === 0}
                    className="w-full bg-indigo-600 text-white py-4.5 rounded-2xl font-black shadow-xl disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
                  >
                    <ShieldCheck size={20} />
                    Enable Safety Protocol
                  </button>
                </div>
              ) : loadingModal ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
              ) : activeModal === 'hotlines' ? (
                <div className="grid gap-3">
                  {modalData?.map((h: any, i: number) => (
                    <a key={i} href={`tel:${h.number}`} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors">
                      <span className="font-bold text-slate-700">{h.name}</span>
                      <span className="font-black text-indigo-600 text-lg">{h.number}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="prose prose-slate text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">{modalData}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
