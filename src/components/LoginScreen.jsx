import React, {useState} from "react";
// import { useNavigate } from "react-router-dom";
import { Clock, LogIn, Trophy, MapPin, ArrowRight, PlusCircle, History, Trash2 } from "lucide-react";
import { useRaceStore } from "../store/raceStore";
import { InstallButton } from "./InstallButton";

const LoginScreen = () => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('eventHistory');
    return saved ? JSON.parse(saved) : [];
  });
  
  const setEvent = useRaceStore((state) => state.setEvent);
  const syncEventRiders = useRaceStore((state) => state.syncEventRiders);

  const handleStart = (name) => {
    if (!name) return;
    
    // Update history list (prevent duplicates)
    const newHistory = [name, ...history.filter(h => h !== name)].slice(0, 5);
    localStorage.setItem('eventHistory', JSON.stringify(newHistory));    
    setEvent(name); 
    syncEventRiders(name);   
  };

  const clearHistory = () => {
    localStorage.removeItem('eventHistory');
    setHistory([]);
  };

  const removeEvent = (e, name) => {
    e.stopPropagation();
    const newHistory = history.filter(h => h !== name);
    localStorage.setItem('eventHistory', JSON.stringify(newHistory));
    setHistory(newHistory);
  };

return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl">
        <h1 className="text-2xl font-black text-slate-900 mb-2">Race Timer Pro</h1>
        <p className="text-slate-500 mb-8 italic">"Ready for the next stage?"</p>

        {/* Existing Events Section */}
        {history.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <History size={14} /> Continue Recent Event
              </h2>
              <button 
                onClick={clearHistory}
                className="text-xs text-red-400 hover:text-red-600 font-bold hover:underline transition-colors"
              >
                CLEAR ALL
              </button>
            </div>
            <div className="space-y-2">
              {history.map(prevEvent => (
                <div key={prevEvent} className="flex gap-2 group">
                  <button
                    onClick={() => handleStart(prevEvent)}
                    className="flex-1 flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl transition-all text-left"
                  >
                    <span className="font-bold text-slate-700">{prevEvent}</span>
                    <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-500" />
                  </button>
                  <button
                    onClick={(e) => removeEvent(e, prevEvent)}
                    className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl transition-all"
                    title="Remove event"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create New Section */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <PlusCircle size={14} /> Start New Event
          </h2>
          <div className="flex gap-2">
            <input 
              className="flex-1 bg-slate-100 border-none rounded-xl p-4 font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. Dungog Day 2"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button 
              onClick={() => handleStart(input)}
              className="bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
              GO
            </button>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <InstallButton />
        </div>
      </div>
    </div>
  );
};
export default LoginScreen;
