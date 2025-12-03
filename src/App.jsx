import React, { useState, useEffect } from "react";
import { useRaceStore } from "./store/raceStore";
// import { getAnalytics } from "firebase/analytics";
// import { auth } from "../modules/firebase";

// const analytics = getAnalytics(app);

// --- Helpers ---
export default function App() {
  const {
    activeTab,
    raceId,
    setRaceId,
    setIsOnline,
    subscribeRiders,
    clearRiders,
    tick,
  } = useRaceStore();
  const [user] = useState(null);
  const initAuthListener = useRaceStore((s) => s.initAuthListener);
  const initAuth = useRaceStore((s) => s.initAuth);

  useEffect(() => {
    initAuthListener();
  }, [initAuthListener]);

  const [loadingAuth] = useState(true);

  // Monitor Connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setIsOnline]);

  // 1. Authenticate
  useEffect(() => {
    const unsubPromise = initAuth();
    return () => {
      unsubPromise.then((unsub) => unsub && unsub());
    };
  }, [initAuth]);

  // 2. Real-time Listener filtered by RACE ID
  useEffect(() => {
    subscribeRiders(user, raceId);
    return () => clearRiders();
  }, [user, raceId, subscribeRiders, clearRiders]);

  // start ticking every 5s
  useEffect(() => {
    const interval = setInterval(() => tick(), 5000);
    return () => clearInterval(interval);
  }, [tick]);

  if (loadingAuth) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white">
        Loading Timing System...
      </div>
    );
  }

  // SHOW LOGIN SCREEN IF NO RACE ID
  if (!raceId) {
    return <LoginScreen onJoin={setRaceId} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-20">
      <Header />

      <main className="animate-in fade-in duration-300">
        {activeTab === "starter" ? (
          <StarterComponent user={user} raceId={raceId} />
        ) : activeTab === "finish" ? (
          <FinishLineComponent user={user} raceId={raceId} />
        ) : (
          <ResultsComponent user={user} raceId={raceId} />
        )}
      </main>
    </div>
  );
}
