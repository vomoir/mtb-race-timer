import React, { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import {
  Play,
  Flag,
  Clock,
  CheckCircle,
  AlertTriangle,
  List,
  RefreshCw,
  Timer,
  LogIn,
  Hash,
  FileText,
  Trophy,
  Download,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";

import { useRaceStore } from "./store/raceStore";
import LoginScreen from "./components/LoginScreen";
import Header from "./components/Header";
import StarterComponent from "./components/Starter";
import FinishLineComponent from "./components/FinishLine";
import ResultsComponent from "./components/Results";
import RiderImporter from "./components/RiderImporter";

// import { getAnalytics } from "firebase/analytics";
// import { auth } from "../modules/firebase";

// const analytics = getAnalytics(app);

// --- Helpers ---
export default function App() {
  const { activeTab, raceId, setRaceId, setIsOnline, subscribeToRiders, tick } =
    useRaceStore();
  const [user] = useState(null);
  const initAuthListener = useRaceStore((s) => s.initAuthListener);
  const initAuth = useRaceStore((s) => s.initAuth);

  useEffect(() => {
    console.log("App mounted. Authenticating...");
    initAuthListener();
  }, [initAuthListener]);

  useEffect(() => {
    if (!raceId) {
      // No raceId yet → don’t subscribe
      return;
    }

    console.log(`App mounted. Starting Listener...${raceId}`);
    const unsubscribe = subscribeToRiders(raceId);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [subscribeToRiders, raceId]);

  useEffect(() => {
    window.addEventListener("online", () =>
      useRaceStore.getState().syncPendingStarts()
    );
  }, []);

  useEffect(() => {
    // Pass raceId here if you have one, or leave empty
    const unsubscribe = subscribeToRiders();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [subscribeToRiders]);
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

  // start ticking every 5s
  useEffect(() => {
    const interval = setInterval(() => tick(), 5000);
    return () => clearInterval(interval);
  }, [tick]);

  // SHOW LOGIN SCREEN IF NO RACE ID
  if (!raceId) {
    return <LoginScreen onJoin={setRaceId} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-20">
      <Header />
      <main className="animate-in fade-in duration-300">
        {activeTab === "import" ? (
          <RiderImporter raceId={raceId} />
        ) : activeTab === "starter" ? (
          <StarterComponent user={user} raceId={raceId} />
        ) : activeTab === "finish" ? (
          <FinishLineComponent user={user} raceId={raceId} />
        ) : (
          <ResultsComponent user={user} raceId={raceId} />
        )}
      </main>
      <Toaster />
    </div>
  );
}
