import React, { useState, useMemo } from "react";

const FinishLine = ({ user, riders, raceId, isOnline }) => {
  const [finishing, setFinishing] = useState(null);
  const [manualNumber, setManualNumber] = useState("");
  const [localLogs, setLocalLogs] = useState(getLocalBackup("finishes"));
  const [showSoloStart, setShowSoloStart] = useState(false); // Toggle for Solo/Offline mode
  const [soloNumber, setSoloNumber] = useState("");

  const ridersOnTrack = useMemo(() => {
    return riders
      .filter((r) => r.status === "ON_TRACK")
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [riders]);

  const finishedRiders = useMemo(() => {
    return riders
      .filter((r) => r.status === "FINISHED")
      .sort((a, b) => new Date(b.finishTime) - new Date(a.finishTime));
  }, [riders]);

  // Handle Solo Start (Manual Start)
  const handleSoloStart = async (e) => {
    e.preventDefault();
    if (!soloNumber.trim() || !user) return;

    const num = soloNumber.trim();
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
      await addDoc(
        collection(db, "artifacts", appId, "public", "data", "mtb_riders"),
        raceData
      );
      setSoloNumber("");
      setShowSoloStart(false);
    } catch (error) {
      console.error("Error starting rider:", error);
    }
  };

  const handleFinish = async (rider) => {
    if (!user) return;
    setFinishing(rider.id);
    const now = new Date();
    const nowIso = now.toISOString();
    const calculatedRaceTime = calculateRaceTime(rider.startTime, nowIso);

    const finishData = {
      status: "FINISHED",
      finishTime: nowIso,
      finishedBy: user.uid,
      raceTime: calculatedRaceTime,
    };

    try {
      saveToLocalBackup("finishes", { ...rider, ...finishData });
      setLocalLogs(getLocalBackup("finishes"));
      const docRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "mtb_riders",
        rider.id
      );
      await updateDoc(docRef, finishData);
    } catch (error) {
      console.error("Error finishing rider:", error);
    } finally {
      setFinishing(null);
      setManualNumber("");
    }
  };

  const handleManualFinish = (e) => {
    e.preventDefault();
    const num = manualNumber.trim();
    if (!num) return;
    const rider = ridersOnTrack.find((r) => r.raceNumber === num);
    if (rider) {
      handleFinish(rider);
    } else {
      alert(`Rider #${num} not found on track for Race ID: ${raceId}!`);
    }
  };

  const getElapsedTime = (startTime) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now - start;
    const minutes = Math.floor(diffMs / 60000);
    return `${minutes}m`;
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      {/* SOLO START TOGGLE */}
      <div className="bg-slate-200 rounded-xl p-2 flex justify-between items-center">
        <span className="text-xs font-bold text-slate-600 uppercase ml-2">
          Single User Mode
        </span>
        <button
          onClick={() => setShowSoloStart(!showSoloStart)}
          className={`text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
            showSoloStart
              ? "bg-slate-300 text-slate-700"
              : "bg-white text-blue-600 shadow-sm"
          }`}
        >
          {showSoloStart ? (
            "Hide Start Panel"
          ) : (
            <>
              <Zap size={16} /> Solo Start
            </>
          )}
        </button>
      </div>

      {/* SOLO START PANEL */}
      {showSoloStart && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
          <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
            <Zap size={16} /> Start Rider (Solo Mode)
          </h3>
          <form onSubmit={handleSoloStart} className="flex gap-3">
            <input
              type="number"
              pattern="[0-9]*"
              inputMode="numeric"
              value={soloNumber}
              onChange={(e) => setSoloNumber(e.target.value)}
              className="flex-1 text-xl font-bold p-3 text-center border-2 border-blue-200 rounded-lg focus:border-blue-500 outline-none"
              placeholder="#"
              autoFocus
            />
            <button
              type="submit"
              disabled={!soloNumber}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 rounded-lg shadow-md active:scale-95 transition-all"
            >
              START
            </button>
          </form>
          <p className="text-xs text-blue-600 mt-2">
            Use this when you are managing both start/finish lines. Rider will
            appear "On Track" immediately.
          </p>
        </div>
      )}

      {/* MANUAL FINISH SECTION */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Flag className="text-red-600" size={20} />
          Manual Finish
        </h2>

        <form onSubmit={handleManualFinish} className="flex gap-3">
          <input
            type="number"
            pattern="[0-9]*"
            inputMode="numeric"
            value={manualNumber}
            onChange={(e) => setManualNumber(e.target.value)}
            className="flex-1 text-2xl font-bold p-3 text-center border-2 border-slate-300 rounded-lg focus:border-red-500 focus:ring-4 focus:ring-red-100 outline-none transition-all placeholder:text-slate-200"
            placeholder="#"
          />
          <button
            type="submit"
            disabled={!manualNumber || finishing}
            className="bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold px-6 rounded-lg shadow-md active:scale-95 transition-all flex items-center gap-2"
          >
            {finishing ? <RefreshCw className="animate-spin" /> : "FINISH"}
          </button>
        </form>
      </div>

      {/* ON TRACK LIST */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <List className="text-blue-600" size={20} />
            On Track ({ridersOnTrack.length})
          </span>
          {ridersOnTrack.length > 0 && (
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">
              Tap to Finish
            </span>
          )}
        </h2>

        {ridersOnTrack.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-400">No riders currently on track</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ridersOnTrack.map((rider) => (
              <div
                key={rider.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex justify-between items-center hover:border-blue-300 transition-colors"
              >
                <div>
                  <div className="text-3xl font-black text-slate-800">
                    #{rider.raceNumber}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={12} /> Started: {formatTime(rider.startTime)}
                    <span className="text-blue-600 font-medium ml-1">
                      ({getElapsedTime(rider.startTime)})
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleFinish(rider)}
                  disabled={finishing === rider.id}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-4 rounded-lg shadow-md active:scale-95 transition-all"
                >
                  {finishing === rider.id ? (
                    <RefreshCw className="animate-spin" />
                  ) : (
                    "FINISH"
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RECENTLY FINISHED */}
      {finishedRiders.length > 0 && (
        <div className="opacity-75">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
            Recently Finished
          </h3>
          <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
            {finishedRiders.slice(0, 5).map((rider) => (
              <div
                key={rider.id}
                className="p-3 border-b border-slate-200 last:border-0 flex justify-between items-center bg-white"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-700 w-12">
                    #{rider.raceNumber}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({formatTime(rider.finishTime)})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-green-700">
                  <Timer size={16} />
                  <span className="font-mono text-lg font-bold tracking-tight">
                    {rider.raceTime ||
                      calculateRaceTime(rider.startTime, rider.finishTime)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LOCAL LOGS */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 mt-8">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Local Backup Log (Finishes)
        </h3>
        <div className="space-y-2">
          {localLogs.slice(0, 5).map((log, i) => (
            <div
              key={i}
              className="flex justify-between items-center text-sm text-slate-600 border-b border-slate-200 pb-1 last:border-0"
            >
              <span>#{log.raceNumber}</span>
              <span className="font-mono text-xs font-bold text-green-600">
                {log.raceTime || "--:--"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default FinishLine;
