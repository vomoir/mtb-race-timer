import React, { useState } from "react";

const Starter = ({
  user,
  raceId,
  formatTime,
  serverTimestamp,
  getLocalBackup,
  saveToLocalBackup,
  addDoc,
}) => {
  const [raceNumber, setRaceNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastStarted, setLastStarted] = useState(null);
  const [localLogs, setLocalLogs] = useState(getLocalBackup("starts"));

  const handleStart = async (e) => {
    e.preventDefault();
    if (!raceNumber.trim() || !user) return;

    setLoading(true);
    const num = raceNumber.trim();
    const now = new Date();

    const raceData = {
      raceId: raceId,
      raceNumber: num,
      startTime: now.toISOString(),
      status: "ON_TRACK",
      startedBy: user.uid,
      finishTime: null,
      raceTime: null,
      timestamp: serverTimestamp(),
    };

    try {
      saveToLocalBackup("starts", raceData);
      setLocalLogs(getLocalBackup("starts"));

      await addDoc(
        collection(db, "artifacts", appId, "public", "data", "mtb_riders"),
        raceData
      );

      setLastStarted({ number: num, time: now });
      setRaceNumber("");
    } catch (error) {
      console.error("Error starting rider:", error);
      alert("Error saving data. Checked local storage.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Play className="text-green-600" size={20} />
          Start Rider
        </h2>

        <form onSubmit={handleStart} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">
              Race Number
            </label>
            <input
              type="number"
              pattern="[0-9]*"
              inputMode="numeric"
              value={raceNumber}
              onChange={(e) => setRaceNumber(e.target.value)}
              className="w-full text-4xl font-bold p-4 text-center border-2 border-slate-300 rounded-lg focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all placeholder:text-slate-200"
              placeholder="000"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!raceNumber || loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xl font-bold py-6 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {loading ? <RefreshCw className="animate-spin" /> : "START RIDER"}
          </button>
        </form>

        {lastStarted && (
          <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-600" />
              <div>
                <p className="text-sm text-green-800 font-semibold">
                  Rider #{lastStarted.number} Started
                </p>
                <p className="text-xs text-green-600">
                  {formatTime(lastStarted.time)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Local Backup Log (Last 5)
        </h3>
        <div className="space-y-2">
          {localLogs.slice(0, 5).map((log, i) => (
            <div
              key={i}
              className="flex justify-between text-sm text-slate-600 border-b border-slate-200 pb-1 last:border-0"
            >
              <span>#{log.raceNumber}</span>
              <span className="font-mono text-xs">
                {formatTime(log.startTime)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default Starter;
