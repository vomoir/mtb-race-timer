import React, { useState, useRef } from "react";
import toast from "react-hot-toast";
import { List, Clock, RefreshCw, Timer, Zap, Flag, Save, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "./Card";
import { useRaceStore } from "../store/raceStore";
import { useRiderLists } from "../hooks/useRiderLists";
import { getTime, getTimeMs, getRiderOnTrack } from "../utils/utils.js";
import ConfirmDialog from "./ConfirmDialog";
import TrackDialog from "./TrackDialog";
import { TabButton } from "./starter/TabButton";

const FinishLine = () => {
  const {
    finishing, finishLogs, soloMode, soloNumber, setSoloNumber,
    setSoloMode, handleSoloStart, handleFinish, updateRiderStatus,
  } = useRaceStore();
  
  const [activeTab, setActiveTab] = useState("capture");
  const [pendingFinishes, setPendingFinishes] = useState([]);
  const { ridersOnTrack, finishedRiders } = useRiderLists();
  const confirmDialog = useRef(null);
  const dialogRef = useRef(null);
  const [activeId, setActiveId] = useState(null);

  const handleCapture = () => {
    setPendingFinishes((prev) => [
      {
        id: crypto.randomUUID(),
        finishTime: getTime(),
        finishTimeMs: getTimeMs(),
        riderNumber: "",
      },
      ...prev,
    ]);
  };

  const handlePendingSave = (pendingItem) => {
    if (!pendingItem.riderNumber) return;
    const riderOnTrack = getRiderOnTrack(ridersOnTrack, pendingItem.riderNumber);

    if (riderOnTrack) {
      // Use the captured time from the pending item
      const finishedRider = { 
        ...riderOnTrack, 
        finishTime: pendingItem.finishTime,
        finishTimeMs: pendingItem.finishTimeMs,
      };
      handleFinish(finishedRider);
      setPendingFinishes((prev) => prev.filter((p) => p.id !== pendingItem.id));
    } else {
      toast.error(`Rider #${pendingItem.riderNumber} is not on track or already finished!`);
    }
  };

  const handleDirectFinish = (rider) => {
    handleFinish({ ...rider, finishTime: getTime(), finishTimeMs: getTimeMs() });
  };
  
  const onDialogSubmit = (val) => {
    if (activeId) {
      const item = pendingFinishes.find((p) => p.id === activeId);
      if (item) {
        const updatedItem = { ...item, riderNumber: val };
        setPendingFinishes((prev) => prev.map((p) => (p.id === activeId ? updatedItem : p)));
        handlePendingSave(updatedItem); // Attempt to save immediately
      }
    }
    setActiveId(null);
  };

  return (
    <div className="max-w-md mx-auto p-2 sm:p-4">
      <Card className="overflow-hidden">
        {/* --- Tabs --- */}
        <div className="flex bg-slate-50 border-b border-slate-200">
          <TabButton tabName="capture" label="Capture" icon={Flag} count={pendingFinishes.length > 0 ? pendingFinishes.length : undefined} activeTab={activeTab} setActiveTab={setActiveTab} />
          <TabButton tabName="onTrack" label="On Track" icon={List} count={ridersOnTrack.length} activeTab={activeTab} setActiveTab={setActiveTab} />
          <TabButton tabName="log" label="Log" icon={Clock} activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* --- Tab Content --- */}
        <div className="p-4 sm:p-6">
          {activeTab === 'capture' && (
            <div className="space-y-4 animate-in fade-in">
              <button
                onClick={handleCapture}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-5 rounded-xl shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-transform"
              >
                <Timer size={24} />
                <span className="text-lg font-black uppercase tracking-wider">Capture Finish</span>
              </button>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {pendingFinishes.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-100">
                    <div className="bg-slate-800 text-white font-mono rounded px-2 py-1 text-sm font-bold">{item.finishTime}</div>
                    <button
                      onClick={() => { setActiveId(item.id); dialogRef.current.open(); }}
                      className="flex-1 h-10 font-bold text-lg text-center border border-slate-300 rounded bg-white hover:bg-slate-50"
                    >
                      {item.riderNumber || <span className="text-slate-300">Bib #</span>}
                    </button>
                    <button onClick={() => handlePendingSave(item)} className="p-2 rounded text-white bg-green-500 hover:bg-green-600 disabled:bg-slate-300" disabled={!item.riderNumber}><Save size={16} /></button>
                    <button onClick={() => setPendingFinishes(prev => prev.filter(p => p.id !== item.id))} className="p-2 rounded bg-slate-200 text-slate-500 hover:bg-slate-300"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'onTrack' && (
             <div className="space-y-3 animate-in fade-in">
               <div className="bg-slate-100 rounded-lg p-2 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600 ml-2">SOLO MODE</span>
                  <button onClick={() => setSoloMode(!soloMode)} className={`font-bold px-3 py-1 rounded-md transition-colors ${soloMode ? 'bg-blue-600 text-white' : 'bg-white'}`}>
                    {soloMode ? 'ON' : 'OFF'}
                  </button>
               </div>

              {soloMode && (
                <form onSubmit={(e) => { e.preventDefault(); handleSoloStart(); setSoloNumber(""); }} className="flex gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <input type="text" pattern="[0-9]*" inputMode="numeric" value={soloNumber} onChange={(e) => setSoloNumber(e.target.value)} className="flex-1 text-lg font-bold p-2 text-center border border-slate-300 rounded-lg" placeholder="Start Bib #" autoFocus />
                  <button type="submit" disabled={!soloNumber} className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 rounded-lg disabled:bg-slate-300">START</button>
                </form>
              )}
               
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {ridersOnTrack.length === 0 && <p className="text-center py-8 text-slate-400">No riders on track.</p>}
                {ridersOnTrack.map((rider) => (
                   <div key={rider.id} className="bg-white rounded-lg border border-slate-200 p-3 flex justify-between items-center">
                     <div>
                       <div className="font-bold text-slate-800">#{rider.riderNumber} <span className="text-sm font-normal text-slate-500">{rider.firstName}</span></div>
                       <div className="text-xs text-slate-500">Elapsed: <span className="font-semibold text-blue-600">{rider.elapsedTime}</span></div>
                     </div>
                     <div className="flex gap-2">
                       <button onClick={() => handleDirectFinish(rider)} disabled={finishing === rider.riderNumber} className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2 rounded-lg text-sm w-24 text-center">
                         {finishing === rider.riderNumber ? <RefreshCw className="animate-spin mx-auto" /> : "FINISH"}
                       </button>
                        <button onClick={() => confirmDialog.current.open({ title: "Confirm DNF", message: `Mark rider #${rider.riderNumber} as DNF?`, onConfirm: () => updateRiderStatus(rider.id, 'DNF') })} className="bg-slate-400 hover:bg-slate-500 text-white font-bold px-3 py-2 rounded-lg text-xs">DNF</button>
                     </div>
                   </div>
                ))}
              </div>
             </div>
          )}

          {activeTab === 'log' && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Recently Finished</h3>
                <div className="bg-slate-50 rounded-lg border border-slate-200">
                  {finishedRiders.slice(0, 5).map((rider) => (
                    <div key={rider.id} className="p-2 border-b border-slate-200 last:border-0 flex justify-between items-center">
                      <span className="font-bold text-slate-700">#{rider.riderNumber}</span>
                      <span className="font-mono text-green-700 font-bold text-sm">{rider.raceTime}</span>
                    </div>
                  ))}
                   {finishedRiders.length === 0 && <p className="text-center text-xs text-slate-400 p-4">No riders have finished.</p>}
                </div>
              </div>
               <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Local Backup Log</h3>
                <div className="bg-slate-50 rounded-lg border border-slate-200">
                  {finishLogs.slice(0, 10).map((log, i) => (
                    <div key={i} className="p-2 border-b border-slate-200 last:border-0 flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-600">#{log.riderNumber}</span>
                      <span className="font-mono text-slate-500">{log.raceTime || "--:--"}</span>
                    </div>
                  ))}
                  {finishLogs.length === 0 && <p className="text-center text-xs text-slate-400 p-4">No finishes logged yet.</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
      <ConfirmDialog ref={confirmDialog} />
      <TrackDialog ref={dialogRef} title="Enter Rider Number" placeholder="Bib #" onSubmit={onDialogSubmit} />
    </div>
  );
};
export default FinishLine;
