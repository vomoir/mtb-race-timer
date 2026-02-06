import React, {useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { Clock, LogIn, Trophy, MapPin } from "lucide-react";
import { useRaceStore } from "../store/raceStore";
import { InstallButton } from "./InstallButton";

const LoginScreen = () => {
  const { eventName, setEvent } = useRaceStore();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (eventName.trim()) {
       // 1. Save the event name to the store
      setEvent(eventName.trim());
      
      // 2. Navigate to the next page
      navigate('/starter'); 
    }
  };
  useEffect(() => {
    if (eventName) {
      navigate('/registration');
    }
  }, [eventName, navigate]);
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <Trophy className="text-orange-500 mx-auto mb-4" size={48} />
          <h1 className="text-2xl font-bold text-slate-900">Race Coordinator</h1>
          <p className="text-slate-500 mt-2">Create or Join an Event</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Event Name</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEvent(e.target.value)}
              placeholder="e.g. RIDE DUNGOG 2026"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none uppercase font-mono"
              required
            />
          </div>
          <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
            <LogIn size={20} /> Enter Event
          </button>
        </form>
      </div>
    </div>
  );
};
export default LoginScreen;
