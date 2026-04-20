import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Clock, LogIn, Trophy, MapPin, ArrowRight, PlusCircle, History, Trash2, Share2, Radio, AlertTriangle } from "lucide-react";
import { useRaceStore } from "../store/raceStore";
import { InstallButton } from "./InstallButton";
import ConfirmDialog from "./ConfirmDialog";
import toast from "react-hot-toast";

const LoginScreen = () => {
  const [input, setInput] = useState('');
  const [pin, setPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [pendingEvent, setPendingEvent] = useState(null);
  
  const { 
    createEventWithTracks, 
    setTrack, 
    fetchEventResults,
    liveEvents,
    fetchLiveEvents,
    deleteAllEvents,
    verifyPin,
    isAdmin
  } = useRaceStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const confirmDialog = useRef(null);

  useEffect(() => {
    fetchLiveEvents();
  }, [fetchLiveEvents]);

  useEffect(() => {
    const eventNameFromUrl = searchParams.get('event');
    const trackNameFromUrl = searchParams.get('track');

    if (eventNameFromUrl) {
      const initDeepLink = async () => {
        const upperEventName = eventNameFromUrl.toUpperCase();
        
        // Check if event is private
        const eventData = liveEvents.find(e => e.name === upperEventName);
        if (eventData?.isPrivate && !isAdmin) {
          setPendingEvent({ name: upperEventName, track: trackNameFromUrl });
          setShowPinInput(true);
          return;
        }

        await createEventWithTracks(upperEventName);

        if (trackNameFromUrl) {
          setTrack(trackNameFromUrl);
        } else {
          // If no track specified, try to auto-detect the most recent one
          const results = await fetchEventResults(upperEventName);
          if (results.length > 0) {
            const latestRider = results.reduce((latest, current) => {
              const getT = (r) => r.timestamp || r.createdAt || r.startTime || 0;
              return getT(current) > getT(latest) ? current : latest;
            }, results[0]);
            
            if (latestRider?.trackName && latestRider.trackName !== "NO TRACK") {
              setTrack(latestRider.trackName);
            }
          }
        }
        navigate('/registration');
      };
      initDeepLink();
    }
  }, [searchParams, navigate, createEventWithTracks, setTrack, fetchEventResults, liveEvents, isAdmin]);

  const handleStart = async (name, eventPin = "") => {
    if (!name) return;
    if (name.length < 3) {
      toast.error("Event name must be at least 3 characters long");
      return;
    }
    let eventName = name.toUpperCase();
    
    // Check if this is an existing private event
    const eventData = liveEvents.find(e => e.name === eventName);
    if (eventData?.isPrivate && eventPin === "" && !isAdmin) {
      setPendingEvent({ name: eventName });
      setShowPinInput(true);
      return;
    }

    const dateRegex = /\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(eventName)) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const dateStamp = `${year}-${month}-${day}`;
        eventName = `${eventName} ${dateStamp}`;
    }
    
    await createEventWithTracks(eventName, eventPin); 
    navigate('/registration');
  };

  const handlePinSubmit = async () => {
    if (!pendingEvent) return;
    
    const isCorrect = await verifyPin(pendingEvent.name, pin);
    if (isCorrect || pin === "") { // Allow empty pin for guest access
      await createEventWithTracks(pendingEvent.name, pin);
      if (pendingEvent.track) setTrack(pendingEvent.track);
      
      setShowPinInput(false);
      setPendingEvent(null);
      setPin('');
      navigate('/registration');
    } else {
      toast.error("Incorrect PIN");
    }
  };

  const handleDeleteAllEvents = () => {
    confirmDialog.current.open({
      title: "⚠️ DELETE ALL CLOUD DATA",
      message: "This will permanently delete ALL events, riders, and results from the cloud database. This cannot be undone.",
      onConfirm: async () => {
        await deleteAllEvents();
        fetchLiveEvents(); // Refresh list
      }
    });
  };

return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl">
        <h1 className="text-2xl font-black text-slate-900 mb-2">Race Timer Pro</h1>
        <p className="text-slate-500 mb-8 italic">"Ready for the next stage?"</p>

        {showPinInput ? (
          <div className="space-y-4 animate-in fade-in zoom-in duration-300">
            <h2 className="text-lg font-bold text-slate-800">Enter PIN for {pendingEvent?.name}</h2>
            <p className="text-sm text-slate-500">This event is private. Enter the 4-digit PIN to gain timing access, or leave blank for read-only results.</p>
            <input 
              type="password"
              className="w-full bg-slate-100 border-none rounded-xl p-4 font-mono text-2xl text-center tracking-widest focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="****"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <button 
                onClick={() => { setShowPinInput(false); setPin(''); }}
                className="flex-1 bg-slate-200 text-slate-700 p-4 rounded-xl font-bold hover:bg-slate-300 transition-colors"
              >
                BACK
              </button>
              <button 
                onClick={handlePinSubmit}
                className="flex-2 bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition-colors px-8"
              >
                JOIN EVENT
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Live Now Section */}
            {liveEvents.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Radio size={14} className="text-red-500 animate-pulse" /> Live Now
                </h2>
                <div className="space-y-2">
                  {liveEvents.map(event => (
                    <button
                      key={event.name}
                      onClick={() => handleStart(event.name)}
                      className="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl transition-all text-left group"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700">{event.name}</span>
                        {event.isPrivate && <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase tracking-tighter mt-0.5">PRIVATE EVENT</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-tighter">Join Live</span>
                        <ArrowRight size={18} className="text-red-300 group-hover:text-red-500" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Create New Section */}
            <div className="mb-8 p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <PlusCircle size={14} /> Start New Event
              </h2>
              <div className="space-y-3">
                <input 
                  className="w-full bg-white border border-blue-100 rounded-xl p-4 font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Event Name (e.g. Gravity Cup)"
                  value={input}
                  onChange={(e) => setInput(e.target.value.toUpperCase())}
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <input 
                    className="flex-1 bg-white border border-blue-100 rounded-xl p-4 font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Set PIN (Optional)"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                  />
                  <button 
                    onClick={() => handleStart(input, pin)}
                    className="bg-blue-600 text-white p-4 sm:px-8 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                  >
                    CREATE
                  </button>
                </div>
                <p className="text-[10px] text-blue-400 font-bold text-center px-4 uppercase tracking-tighter">
                  Setting a PIN prevents unauthorized timing and changes.
                </p>
              </div>
            </div>

            {/* Archives Link */}
            <div className="mb-8">
              <button 
                onClick={() => navigate('/archives')}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-slate-200 p-2 rounded-lg text-slate-600 group-hover:bg-slate-800 group-hover:text-white transition-all">
                    <History size={18} />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-slate-700">Event Archives</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">View past race results</span>
                  </div>
                </div>
                <ArrowRight size={18} className="text-slate-300 group-hover:text-slate-600" />
              </button>
            </div>

            {/* Global Admin Section */}
            <div className="pt-6 border-t border-slate-100">
               <button 
                onClick={handleDeleteAllEvents}
                className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all border border-red-100"
              >
                <AlertTriangle size={14} /> Delete ALL Events from Cloud
              </button>
            </div>
          </>
        )}

        <div className="mt-8 flex justify-center">
          <InstallButton />
        </div>
      </div>
      <ConfirmDialog ref={confirmDialog} />
    </div>
  );
};

export default LoginScreen;
