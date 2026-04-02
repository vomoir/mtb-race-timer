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
    setIsOnline 
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
        {/* Home Path: If no event, show Login. If event exists, redirect to registration */}
        <Route 
          path="/" 
          element={!eventName ? <LoginScreen /> : <Navigate to="/registration" />} 
        />
        
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