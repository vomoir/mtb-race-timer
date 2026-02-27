import React, { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useRaceStore } from "./store/raceStore";
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from "./components/LoginScreen";
import Header from "./components/Header";
import StarterComponent from "./components/Starter";
import FinishLineComponent from "./components/FinishLine";
import ResultsComponent from "./components/Results";
import {RiderRegistration } from './components/RiderRegistration';

// import { getAnalytics } from "firebase/analytics";
// import { auth } from "../modules/firebase";

// const analytics = getAnalytics(app);

// --- Helpers ---
export default function App() {
  const { 
    activeRaceId, // Using the ID we generate in the store
    eventName, 
    subscribeToRiders, 
    tick, 
    initAuth, 
    initAuthListener, 
    setIsOnline,
    fetchTracks,
    tracks 
  } = useRaceStore();

  // 1. Auth & Connectivity Listeners (Stay the same)
  useEffect(() => { initAuthListener(); }, [initAuthListener]);
  useEffect(() => {
    const unsubPromise = initAuth();
    return () => { unsubPromise.then((unsub) => unsub && unsub()); };
  }, [initAuth]);

  // 1b. Data Persistence: Fetch tracks if event is selected but tracks are empty
  useEffect(() => {
    if (eventName && tracks.length === 0) {
      fetchTracks(eventName);
    }
  }, [eventName, tracks.length, fetchTracks]);

  // 2. Single, Clean Firestore Subscription
  useEffect(() => {
    if (!activeRaceId) return;
    const unsubscribe = subscribeToRiders(activeRaceId);
    return () => { if (unsubscribe) unsubscribe(); };
  }, [subscribeToRiders, activeRaceId]);

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
  // Only show the app if eventName is an actual string with length
  if (!eventName || eventName.trim().length === 0) {
    return <LoginScreen />;
  }

  // --- RENDER SECTION ---
  // No more early returns!
  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-20">
      {/* Header only shows if we have an event selected */}
      <Header />

      <Routes>
        {/* Home Path */}
        <Route path="/" element={<RiderRegistration />} />
        
        {/* Protected Routes: Redirect to "/" if no event name exists */}
        <Route 
          path="/registration" 
          element={eventName ? <RiderRegistration /> : <Navigate to="/" />} 
        />
        <Route 
          path="/starter" 
          element={eventName ? <StarterComponent /> : <Navigate to="/" />} 
        />
        <Route 
          path="/finish" 
          element={eventName ? <FinishLineComponent /> : <Navigate to="/" />} 
        />
        <Route 
          path="/results" 
          element={eventName ? <ResultsComponent /> : <Navigate to="/" />} 
        />
      </Routes>

      <Toaster />
    </div>
  );
}