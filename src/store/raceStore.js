import { create } from "zustand";
import toast from "react-hot-toast";
import { getTime, formatDuration, getLocalBackup, saveToLocalBackup } from "../utils/utils.js";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signInAnonymously,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { db, auth } from "../modules/firebase";

const DEFAULT_TRACK_COUNT = 6;

// Helper to generate consistent session IDs
const formatSessionId = (event, track) => 
  `${event.replace(/\s+/g, '-')}_${track.replace(/\s+/g, '-')}`.toUpperCase();

export const useRaceStore = create((set, get) => ({
  // --- STATE ---
  eventName: localStorage.getItem('eventName') || "",
  trackName: "NO TRACK",
  tracks: [],
  riders: [],
  activeRaceId: "",
  
  // Auth State
  user: null,
  authLoading: true,
  
  // UI State
  loading: false,
  activeTab: "import",
  isOnline: navigator.onLine,
  now: getTime(),
  
  // Starter/Finisher State
  riderNumber: "",
  soloMode: false,
  soloNumber: "",
  finishing: null,
  finishLogs: getLocalBackup("finishes"),

  // --- ACTIONS: UI & Auth ---
  setLoading: (val) => set({ loading: val }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsOnline: (status) => set({ isOnline: status }),
  tick: () => set({ now: getTime() }),
  
  initAuth: async () => {
    await setPersistence(auth, browserLocalPersistence);
    if (!auth.currentUser) {
      await signInAnonymously(auth).catch((e) => console.error("Auth failed", e));
    }
    return onAuthStateChanged(auth, (u) => {
      set({ user: u, authLoading: false });
    });
  },

  logout: async () => {
    set({ eventName: "", riders: [], activeRaceId: "" });
    localStorage.removeItem('eventName');
    await signOut(auth);
  },

  // --- ACTIONS: Session Management ---
  createEventWithTracks: async (eventName) => {
    localStorage.setItem('eventName', eventName);
    set({ eventName, riders: [], trackName: "NO TRACK", tracks: [], activeRaceId: "" });

    const tracksRef = collection(db, "tracks");
    const q = query(tracksRef, where("eventName", "==", eventName));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      const batch = writeBatch(db);
      const newTracks = [];
      for (let i = 1; i <= DEFAULT_TRACK_COUNT; i++) {
        const tName = `TRACK${i}`;
        const trackDocRef = doc(tracksRef);
        batch.set(trackDocRef, { eventName, trackName: tName, createdAt: serverTimestamp() });
        newTracks.push(tName);
      }
      await batch.commit();
      set({ tracks: newTracks });
      get().setSession(eventName, newTracks[0]);
      toast.success(`${DEFAULT_TRACK_COUNT} tracks created for ${eventName}`);
    } else {
      const existingTracks = snapshot.docs.map(doc => doc.data().trackName).sort();
      set({ tracks: existingTracks });
      get().setSession(eventName, existingTracks[0]);
    }
  },

  setSession: async (event, track) => {
    const newId = formatSessionId(event, track);
    set({ 
      eventName: event, 
      trackName: track,
      activeRaceId: newId,
      riders: [] 
    });
    localStorage.setItem('eventName', event);
    await get().fetchRidersForSession(); 
  },

  // --- ACTIONS: Rider Management ---
  setRiders: (riders) => set({ riders, loading: false }),
  setRiderNumber: (num) => set({ riderNumber: num || "" }),
  setSoloMode: (val) => set({ soloMode: val }),
  setSoloNumber: (num) => set({ soloNumber: num || "" }),

  addRider: async (riderData) => {
    const { activeRaceId, eventName, trackName } = get();
    const customDocId = `${activeRaceId}_${riderData.riderNumber}`;
    
    const newRider = {
      ...riderData,
      raceId: activeRaceId,
      eventName,
      trackName,
      status: "WAITING",
      createdAt: serverTimestamp(),
      startTime: null, startTimeMs: null,
      finishTime: null, finishTimeMs: null,
      durationMs: null, raceTime: null,
    };

    try {
      await setDoc(doc(db, "riders", customDocId), newRider);
      set((state) => ({ riders: [...state.riders, { ...newRider, id: customDocId }] }));
      return { success: true, id: customDocId };
    } catch (error) {
      console.error("Error adding rider:", error);
      return { success: false, error };
    }
  },

  handleStart: async (riderNumber) => {
    if (!riderNumber?.trim()) return;
    const { riders, eventName, trackName, activeRaceId } = get();
    const existingRider = riders.find((r) => r.riderNumber === riderNumber);
    const docId = existingRider?.id || `${activeRaceId}_${riderNumber}`;
    
    const startData = {
      startTime: getTime(),
      startTimeMs: Date.now(),
      status: "ON_TRACK",
      riderNumber,
      raceId: activeRaceId,
      eventName,
      trackName,
    };

    try {
      await setDoc(doc(db, "riders", docId), startData, { merge: true });
      set((state) => ({
        riders: existingRider 
          ? state.riders.map((r) => r.id === docId ? { ...r, ...startData } : r)
          : [...state.riders, { id: docId, ...startData }],
        riderNumber: ""
      }));
      toast.success(`Rider #${riderNumber} Started!`);
    } catch (err) {
      console.error("Start failed:", err);
      toast.error("Could not start rider.");
    }
  },

  handleSoloStart: () => {
    const { soloNumber } = get();
    get().handleStart(soloNumber);
    set({ soloNumber: "" });
  },

  handleFinish: async (rider) => {
    if (!rider) return;
    set({ finishing: rider.id });

    const start = rider.startTimeMs || new Date(rider.startTime).getTime();
    const end = Date.now();
    
    if (!start || isNaN(start)) {
      toast.error("Invalid start time");
      set({ finishing: null });
      return;
    }

    const durationMs = Math.max(0, end - start);
    const finishData = {
      status: "FINISHED",
      finishTime: getTime(),
      finishTimeMs: end,
      durationMs,
      raceTime: formatDuration(durationMs),
    };

    try {
      await updateDoc(doc(db, "riders", rider.id), finishData);
      set((state) => ({
        riders: state.riders.map((r) => r.id === rider.id ? { ...r, ...finishData } : r),
        finishLogs: [{ ...rider, ...finishData }, ...state.finishLogs].slice(0, 50),
        finishing: null
      }));
      saveToLocalBackup("finishes", { ...rider, ...finishData });
    } catch (error) {
      console.error("Error saving finish:", error);
      set({ finishing: null });
      toast.error("Failed to save result");
    }
  },

  updateRiderStatus: async (riderInput, newStatus) => {
    const { riders, activeRaceId } = get();
    const foundRider = riders.find(r => r.id === riderInput || (r.riderNumber === riderInput && r.raceId === activeRaceId));
    
    if (!foundRider) return toast.error("Rider not found");

    const updates = { 
      status: newStatus,
      durationMs: null, 
      raceTime: newStatus,
      ...(newStatus === "DNS" && { startTime: null, startTimeMs: null, finishTime: null, finishTimeMs: null })
    };

    try {
      await updateDoc(doc(db, "riders", foundRider.id), updates);
      set((state) => ({
        riders: state.riders.map((r) => r.id === foundRider.id ? { ...r, ...updates } : r),
        riderNumber: ""
      }));
      toast.success(`Rider marked as ${newStatus}`);
    } catch (error) {
      toast.error("Update failed");
    }
  },

  resetRider: async (riderId) => {
    const resetData = {
      status: "WAITING",
      startTime: null, startTimeMs: null,
      finishTime: null, finishTimeMs: null,
      durationMs: null, raceTime: null
    };
    try {
      await updateDoc(doc(db, "riders", riderId), resetData);
      set((state) => ({
        riders: state.riders.map((r) => r.id === riderId ? { ...r, ...resetData } : r),
      }));
    } catch (error) {
      console.error("Reset failed", error);
    }
  },

  deleteRider: async (riderId) => {
    try {
      await deleteDoc(doc(db, "riders", riderId));
      set((state) => ({ riders: state.riders.filter((r) => r.id !== riderId) }));
      toast.success("Rider deleted");
    } catch (error) {
      toast.error("Delete failed");
    }
  },

  deleteAllRiders: async () => {
    const { activeRaceId } = get();
    if (!activeRaceId) return;
    try {
      const q = query(collection(db, "riders"), where("raceId", "==", activeRaceId));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      set({ riders: [] });
      toast.success("Session cleared");
    } catch (error) {
      toast.error("Clear failed");
    }
  },

  // --- ACTIONS: Cloud Sync ---
  fetchRidersForSession: async () => {
    const { activeRaceId } = get();
    if (!activeRaceId) return;
    try {
      const q = query(collection(db, "riders"), where("raceId", "==", activeRaceId));
      const snapshot = await getDocs(q);
      set({ riders: snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) });
    } catch (error) {
      console.error("Fetch failed", error);
    }
  },

  subscribeToRiders: (raceId) => {
    if (!raceId) return null;
    const q = query(collection(db, "riders"), where("raceId", "==", raceId));
    return onSnapshot(q, (snapshot) => {
      set({ riders: snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) });
    });
  },

  importRidersToDb: async (importRiders) => {
    const { tracks, eventName, trackName } = get();
    if (!trackName || trackName === "NO TRACK") return toast.error("Select a track first");
    
    const ridersArray = Array.isArray(importRiders) ? importRiders : [importRiders];
    const validRiders = ridersArray.filter(r => r.riderNumber);

    for (const t of tracks) {
      const batch = writeBatch(db);
      const raceId = formatSessionId(eventName, t);
      validRiders.forEach(r => {
        const docId = `${raceId}_${r.riderNumber}`;
        batch.set(doc(db, "riders", docId), {
          ...r, raceId, eventName, trackName: t, status: "WAITING",
          startTime: null, startTimeMs: null, finishTime: null, finishTimeMs: null,
          raceTime: null, durationMs: null, timestamp: serverTimestamp()
        }, { merge: true });
      });
      await batch.commit();
    }
    toast.success(`Imported ${validRiders.length} riders to all tracks`);
  },

  renameTrack: async (newTrackName) => {
    const { eventName, trackName, activeRaceId, riders } = get();
    if (!trackName || trackName === "NO TRACK") return;

    const newId = formatSessionId(eventName, newTrackName);
    const currentRiders = riders.filter(r => r.raceId === activeRaceId);
    
    try {
      const batch = writeBatch(db);
      currentRiders.forEach(r => {
        const newDocId = `${newId}_${r.riderNumber}`;
        const { id, ...data } = r;
        batch.set(doc(db, "riders", newDocId), { ...data, trackName: newTrackName, raceId: newId });
        batch.delete(doc(db, "riders", r.id));
      });
      await batch.commit();
      set({ trackName: newTrackName, activeRaceId: newId });
      toast.success("Track renamed");
    } catch (error) {
      toast.error("Rename failed");
    }
  }
}));
