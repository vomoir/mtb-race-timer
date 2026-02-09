import React, {useState} from "react";
// import { useNavigate } from "react-router-dom";
import { Clock, LogIn, Trophy, MapPin, ArrowRight, PlusCircle, History } from "lucide-react";
import { useRaceStore } from "../store/raceStore";
import { InstallButton } from "./InstallButton";

const LoginScreen = () => {
  const [input, setInput] = useState('');
  const [history] = useState(() => {
    const saved = localStorage.getItem('eventHistory');
    return saved ? JSON.parse(saved) : [];
  });
  
  const setEvent = useRaceStore((state) => state.setEvent);
  const handleStart = (name) => {
    if (!name) return;
    
    // Update history list (prevent duplicates)
    const newHistory = [name, ...history.filter(h => h !== name)].slice(0, 5);
    localStorage.setItem('eventHistory', JSON.stringify(newHistory));    
    setEvent(name);    
  };

return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl">
        <h1 className="text-2xl font-black text-slate-900 mb-2">Race Timer Pro</h1>
        <p className="text-slate-500 mb-8 italic">"Ready for the next stage?"</p>

        {/* Existing Events Section */}
        {history.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <History size={14} /> Continue Recent Event
            </h2>
            <div className="space-y-2">
              {history.map(prevEvent => (
                <button
                  key={prevEvent}
                  onClick={() => handleStart(prevEvent)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl transition-all group"
                >
                  <span className="font-bold text-slate-700">{prevEvent}</span>
                  <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-500" />
                </button>
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
      </div>
    </div>
  );
};
export default LoginScreen;
