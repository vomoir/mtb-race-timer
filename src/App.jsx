import React, { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useRaceStore } from "./store/raceStore";
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from "./components/LoginScreen";
import Header from "./components/Header";
import StarterComponent from "./components/Starter";
import FinishLineComponent from "./components/FinishLine";
import ResultsComponent from "./components/Results";
import { RiderRegistration } from './components/RiderRegistration';
import Archives from "./components/Archives";

// import { getAnalytics } from "firebase/analytics";
// import { auth } from "../modules/firebase";

// const analytics = getAnalytics(app);

// --- Helpers ---
export default function App() {
  const { 
    eventName, 
    subscribeToRiders, 
    tick, 
    initAuth, 
    initAuthListener, 
    setIsOnline,
    isAdmin
  } = useRaceStore();

  // 1. Auth & Connectivity Listeners (Stay the same)
  useEffect(() => { initAuthListener(); }, [initAuthListener]);
  useEffect(() => {
    const unsubPromise = initAuth();
    return () => { unsubPromise.then((unsub) => unsub && unsub()); };
  }, [initAuth]);

  // 2. Single, Clean Firestore Subscription
  useEffect(() => {
    if (!eventName) return;
    const unsubscribe = subscribeToRiders(eventName);
    return () => { if (unsubscribe) unsubscribe(); };
  }, [subscribeToRiders, eventName]);

  // 3. Race Clock Tick
  useEffect(() => {
    const interval = setInterval(() => tick(), 1000);
    return () => clearInterval(interval);
  }, [tick]);

  // 4. Connectivity Monitoring
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
  // --- RENDER SECTION ---
  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-20">
      {/* Header only shows if we have an event selected */}
      {eventName && <Header />}

      <Routes>
        {/* Home Path: If no event, show Login. If event exists, redirect based on admin status */}
        <Route 
          path="/" 
          element={!eventName ? <LoginScreen /> : (isAdmin ? <Navigate to="/registration" /> : <Navigate to="/results" />)} 
        />
        
        {/* Protected Routes: Redirect to "/" if no event name exists, or to results if not admin */}
        <Route 
          path="/registration" 
          element={eventName ? (isAdmin ? <RiderRegistration /> : <Navigate to="/results" />) : <Navigate to="/" />} 
        />
        <Route 
          path="/starter" 
          element={eventName ? (isAdmin ? <StarterComponent /> : <Navigate to="/results" />) : <Navigate to="/" />} 
        />
        <Route 
          path="/finish" 
          element={eventName ? (isAdmin ? <FinishLineComponent /> : <Navigate to="/results" />) : <Navigate to="/" />} 
        />
        <Route 
          path="/results" 
          element={eventName ? <ResultsComponent /> : <Navigate to="/" />} 
        />
        <Route 
          path="/archives" 
          element={<Archives />} 
        />
      </Routes>

      <Toaster />
    </div>
  );
}