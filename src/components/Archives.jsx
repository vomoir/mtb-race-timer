import React, { useEffect } from "react";
import { useRaceStore } from "../store/raceStore";
import { useNavigate } from "react-router-dom";
import { History, ArrowRight, Calendar, Trophy } from "lucide-react";
import { Card } from "./Card";

export const Archives = () => {
  const { archivedEvents, fetchArchivedEvents, setEvent, createEventWithTracks } = useRaceStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchArchivedEvents();
  }, [fetchArchivedEvents]);

  const handleSelectEvent = async (eventName) => {
    // We use createEventWithTracks to load the event and its tracks
    // For archived events, we don't need a PIN usually to VIEW results
    await createEventWithTracks(eventName);
    navigate("/results");
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-slate-800 p-2 rounded-lg text-white">
          <History size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Event Archives</h1>
          <p className="text-slate-500 text-sm">View results from finalized races</p>
        </div>
      </div>

      {archivedEvents.length === 0 ? (
        <Card className="p-8 text-center text-slate-500">
          <Trophy size={48} className="mx-auto mb-4 opacity-20" />
          <p>No finalized events found in the archives.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {archivedEvents.map((event) => (
            <button
              key={event.name}
              onClick={() => handleSelectEvent(event.name)}
              className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all text-left group shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="bg-slate-100 p-2 rounded-lg text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-700">{event.name}</h3>
                  <p className="text-xs text-slate-400">
                    Finalized on {new Date(event.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">View Results</span>
                <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Archives;
