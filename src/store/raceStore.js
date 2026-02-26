import { create } from "zustand";
import toast from "react-hot-toast";
import { getTime, formatDuration } from "../utils/utils.js";

import {
  addDoc,
  setDoc,
  getDocs,
  collection,
  doc,
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

import { db, appId,  auth } from "../modules/firebase";

import { getLocalBackup, saveToLocalBackup } from "../utils/utils.js";

const DEFAULT_TRACK_COUNT = 6;

export const useRaceStore = create((set, get) => ({
  eventName:  "",
  trackName: "NO TRACK",
  tracks: [],
  setTracks: (tracks) => set({ tracks }),
  
  createEventWithTracks: async (eventName) => {
    localStorage.setItem('eventName', eventName);
    set({ eventName, riders: [], trackName: "NO TRACK", tracks: [] });

    const tracksCollectionRef = collection(db, "tracks");
    const q = query(tracksCollectionRef, where("eventName", "==", eventName));
    const existingTracksSnapshot = await getDocs(q);

    if (existingTracksSnapshot.empty) {
      const batch = writeBatch(db);
      const newTracks = [];
      for (let i = 1; i <= DEFAULT_TRACK_COUNT; i++) {
        const trackName = `TRACK${i}`;
        const trackDocRef = doc(tracksCollectionRef);
        batch.set(trackDocRef, { eventName, trackName, createdAt: serverTimestamp() });
        newTracks.push(trackName);
      }
      await batch.commit();
      set({ tracks: newTracks, trackName: newTracks[0] });
      toast.success(`${DEFAULT_TRACK_COUNT} tracks created for event ${eventName}`);
    } else {
      const existingTracks = existingTracksSnapshot.docs.map(doc => doc.data().trackName).sort();
      set({ tracks: existingTracks, trackName: existingTracks[0] });
    }
  },
  // setTrackName: (name) => set({ trackName: name }), 
  setTrack: (track) => {
    const { eventName } = get();
    const formattedEvent = eventName.replace(/\s+/g, '-').toUpperCase();
    const formattedTrack = track.replace(/\s+/g, '-').toUpperCase();
    
    set({ 
      trackName: track,
      activeRaceId: `${formattedEvent}_${formattedTrack}`
    });
  },

  riders: [],
  // activeRaceId: "", // Combined ID: EVENT_TRACK
  setEvent: (name) => {
    localStorage.setItem('eventName', name);
    // We explicitly clear old riders when switching events 
    // to ensure no "ghost" data appears from the previous session
    set({ 
      eventName: name, 
      // riders: [], 
      trackName: "NO TRACK" 
    });
  },
  // Helper to "Log Out" / Switch Event
  logout: async () => {
    set({ eventName: "", riders: [] });
    await signOut(auth);
    set({ user: null });
  },

  // This is the magic string that separates data in Firestore
  getRaceId: () => {
    const { eventName, trackName } = get();
    const {activeRaceId} = get();
    if (activeRaceId) return activeRaceId; // Return existing ID if already set
    return `${eventName}_${trackName}`.replace(/\s+/g, '-').toUpperCase();    
  },    
  
  // Unique ID for DB filtering (combines both to prevent overlaps)  
setSession: async (event, track) => {
  const newActiveRaceId = `${event.replace(/\s+/g, '-')}_${track.replace(/\s+/g, '-')}`.toUpperCase();
  
  // 1. Update the session identifiers
  set({ 
    eventName: event, 
    trackName: track,
    activeRaceId: newActiveRaceId,
    riders: [] // Clear local state immediately for snappy UI
  });

  // 2. Automatically trigger the fetch for the new session
  // Using the 'get' helper ensures we have the latest state
  await get().fetchRidersForSession(); 
},
  queueStart: (riderData) => {
    const existing = JSON.parse(localStorage.getItem("pendingStarts") || "[]");
    existing.push(riderData);
    localStorage.setItem("pendingStarts", JSON.stringify(existing));
  },
  syncPendingStarts: async () => {
    const pending = JSON.parse(localStorage.getItem("pendingStarts") || "[]");
    if (pending.length === 0) return;

    for (const rider of pending) {
      // Use the new 'riders' collection and try to maintain ID consistency
      if (rider.raceId && rider.riderNumber) {
        const customId = `${rider.raceId}_${rider.riderNumber}`;
        const docRef = doc(db, "riders", customId);
        await setDoc(docRef, rider, { merge: true });
      } else {
        // Fallback for data without ID components
        await addDoc(collection(db, "riders"), rider);
      }
    }
    localStorage.removeItem("pendingStarts");
  },

  // Auth state
  user: null,
  authLoading: true,

  setActiveRaceId: (id) => set({ activeRaceId: id }),
  // When adding/loading riders, ensure they get the activeRaceId
// Inside your create((set, get) => ({ ... }))
addRider: async (riderData) => {
  const { activeRaceId, eventName, trackName } = get();
  
  // 1. Create the Predictable ID
  // e.g., "WEDNESDAY-WARRIORS_RIFLERANGE_101"
  const customDocId = `${activeRaceId}_${riderData.riderNumber}`;

  const newRider = {
    ...riderData,
    raceId: activeRaceId,
    eventName: eventName,
    trackName: trackName,
    status: "WAITING",
    createdAt: serverTimestamp(),
    startTime: null,
    startTimeMs: null,
    finishTime: null,
    finishTimeMs: null,
    durationMs: null,
    raceTime: null,
  };

  try {
    // 2. Use setDoc with our custom ID instead of addDoc
    const docRef = doc(db, "riders", customDocId);
    await setDoc(docRef, newRider);
    
    // 3. Update Local State
    set((state) => ({
      riders: [...state.riders, { ...newRider, id: customDocId }]
    }));

    return { success: true, id: customDocId };
  } catch (error) {
    console.error("Error adding rider:", error);
    return { success: false, error };
  }
},
  deleteRider: async (riderId) => {
    try {
      await deleteDoc(doc(db, "riders", riderId));
      set((state) => ({
        riders: state.riders.filter((r) => r.id !== riderId),
      }));
      toast.success("Rider deleted");
    } catch (error) {
      console.error("Error deleting rider:", error);
      toast.error("Failed to delete rider");
    }
  },
  deleteAllRiders: async () => {
    const { activeRaceId } = get();
    if (!activeRaceId) return;

    try {
      const ridersRef = collection(db, "riders");
      const q = query(ridersRef, where("raceId", "==", activeRaceId));
      const snapshot = await getDocs(q);
      
      const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      set({ riders: [] });
      toast.success("All riders deleted for this session");
    } catch (error) {
      console.error("Error deleting all riders:", error);
      toast.error("Failed to delete riders");
    }
  },
  initAuth: async () => {
    await setPersistence(auth, browserLocalPersistence);
    // sign in anonymously if not already signed in
    if (!auth.currentUser) {
      await signInAnonymously(auth).catch((e) =>
        console.error("Auth failed", e)
      );
    }

    // subscribe to auth state
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      set({ user: u, authLoading: false });
    });
    return unsubscribe;
  },

  // subscribe to auth state changes
  initAuthListener: () => {
    onAuthStateChanged(auth, (firebaseUser) => {
      set({ user: firebaseUser, authLoading: false });
    });
  },

  // login action
  login: async () => {
    try {
      await signInAnonymously(auth);
      // user will be set automatically by onAuthStateChanged
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  // Starter state
  riderNumber: "",
  lastStarted: null,
  localLogs: getLocalBackup("starts"),

  activeTab: "import",
  setActiveTab: (tab) => set({ activeTab: tab }),

  raceId: "", 
  setRaceId: (id) => set({ raceId: id, activeRaceId: id }),
  now: getTime(), // reference time
  tick: () => set({ now: new Date() }),
  isOnline: navigator.onLine,
  setIsOnline: (status) => set({ isOnline: status }),
  // riders: [],
  setRiders: (riders) => set({ 
    riders, 
    isLoading: false // Set to false once data arrives
  }),
  unsubscribeRiders: null,
  clearRiders: () => {
    const prevUnsub = get().unsubscribeRiders;
    if (prevUnsub) prevUnsub();
    set({ riders: [], unsubscribeRiders: null });
  },

  setRiderNumber: (num) => {
    console.log("Setting riderNumber to:", num);
    set({ riderNumber: num });
  },

  finishing: null,
  finishLogs: getLocalBackup("finishes"),
  loading: false,
  setLoading: (val) => set({ loading: val }),
  soloMode: false,
  setSoloMode: (val) => set({ soloMode: val }),
  showSoloStart: false,
  soloNumber: "",
  setSoloNumber: (num) => set({ soloNumber: num }),

  handleStart: async (raceId, riderNumber) => {
    if (!riderNumber.trim()) return;
    const { riders, eventName, trackName, activeRaceId } = get();

    // Use passed raceId if available, otherwise fallback to activeRaceId
    const effectiveRaceId = raceId || activeRaceId;

    // 1. Check local state for the rider
    const existingRider = riders.find((r) => r.riderNumber === riderNumber);
    const nowIso = getTime();
    const nowMs = Date.now();

    // 2. CONSISTENCY: Always use the new top-level path and Composite ID
    // If the rider already has an ID, use it. Otherwise, build the composite one.
    const docId = existingRider?.id || `${effectiveRaceId}_${riderNumber}`;
    const docRef = doc(db, "riders", docId); // 🟢 TOP LEVEL COLLECTION

    const startData = {
      startTime: nowIso,
      startTimeMs: nowMs,
      status: "ON_TRACK",
      riderNumber: riderNumber, // Ensure this is stored
      raceId: effectiveRaceId,     // Ensure this is stored for ad-hoc riders
      eventName: eventName, // Add this
      trackName: trackName, // Add this
    };

    try {
      // 3. USE setDoc WITH MERGE instead of updateDoc
      // This fixes the "No document found" error by creating it if missing
      await setDoc(docRef, startData, { merge: true });

      // 4. Update local state
      set((state) => ({
        riders: existingRider 
          ? state.riders.map((r) => r.id === docId ? { ...r, ...startData } : r)
          : [...state.riders, { id: docId, ...startData }], // Add ad-hoc rider if new
        loading: false,
        manualNumber: ""
      }));

      toast.success(`Rider #${riderNumber} Started!`);
    } catch (err) {
      console.error("Start failed:", err);
      toast.error("Could not start rider.");
    }
  },
  subscribeToRiders: (activeRaceId) => {
    if (!activeRaceId) return null;

    // 1. POINT TO THE NEW TOP-LEVEL COLLECTION
    const baseCollection = collection(db, "riders");

    // Build constraints (Removed orderBy startTime if it causes index issues initially)
    const q = query(
      baseCollection, 
      where("raceId", "==", activeRaceId)
    );

    console.log(`📡 Subscribing to NEW riders collection for: ${activeRaceId}`);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveRiders = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id, // This will now be your "EVENT_TRACK_NUMBER" string
          riderNumber: String(data.riderNumber),
          startTime: data.startTime || null,
          finishTime: data.finishTime || null,
        };
      });
      
      set({ riders: liveRiders });
    }, (error) => {
      console.error("Firestore listener error:", error);
    });

    return unsubscribe;
  },
    handleSoloStart: async () => {
    const { soloNumber, raceId, handleStart } = get();
    if (!soloNumber.trim()) return;
    handleStart(raceId, soloNumber);
  },

  updateRiderStatus: async (riderInput, newStatus) => {
    const { riders, activeRaceId } = get();
    
    // 1. Resolve the correct Firestore Document ID
    let riderId = riderInput;
    
    // If input is just a number (e.g. "105"), try to find the rider object
    const foundRider = riders.find(r => r.id === riderInput) || 
                       riders.find(r => r.riderNumber === riderInput && r.raceId === activeRaceId);
    
    if (foundRider) {
      riderId = foundRider.id;
    } else if (activeRaceId && !String(riderInput).includes("_")) {
      // Fallback: Construct composite ID if we can't find it in local state
      riderId = `${activeRaceId}_${riderInput}`;
    }

    try {
      const riderRef = doc(db, "riders", riderId);

      const updates = { 
        status: newStatus,
        durationMs: null, 
        raceTime: newStatus 
      };

      // If DNS, ensure we clear any existing timing data
      if (newStatus === "DNS") {
        updates.startTime = null;
        updates.startTimeMs = null;
        updates.finishTime = null;
        updates.finishTimeMs = null;
      }

      // Update Firestore
      await updateDoc(riderRef, updates);

      // Update Local State
      set((state) => ({
        riders: state.riders.map((r) =>
          r.id === riderId ? { ...r, ...updates } : r
        ),
        riderNumber: "" // Clear the input field
      }));
      
      toast.success(`Rider marked as ${newStatus}`);
    } catch (error) {
      console.error(`Failed to update rider to ${newStatus}:`, error);
      toast.error("Failed to update status. Check rider number.");
    }
  },
 // Finish state
 handleFinish: async (rider) => {
    if (!rider) return;
    set({ finishing: rider.id });

    // Get Start Time in Milliseconds
    const start = rider.startTimeMs || new Date(rider.startTime).getTime();
    // Get Finish Time in Milliseconds
    // (We ensure it's a number, whether it came from handleCapture or Date.now())
    const end = rider.finishTimeMs || new Date(rider.finishTime).getTime();
    // Simple numeric subtraction (No more NaN!)

    // Validate and Calculate Duration
    if (!start || isNaN(start) || isNaN(end)) {
      console.error("Invalid timing data:", { start, end });
      set({ finishing: null });
      return;
    }

    const durationMs = end - start;
    const finalDuration = durationMs < 0 ? 0 : durationMs;

    const raceTimeStr = formatDuration(finalDuration);

    // Normalize Start Time to Milliseconds
    // Handles Firestore Timestamps, Date objects, or ISO strings

    const finishData = {
      status: "FINISHED",
      finishTime: rider.finishTime,
	    finishTimeMs: end, // Store MS for sorting/GC
      durationMs: finalDuration, // CRUCIAL: Used for sorting
      raceTime: raceTimeStr,
    };

    // 5. Save to Firestore
    try {
      // 🟢 Points to the unique record for THIS race session
      const docRef = doc(db, "riders", rider.id); 
      await updateDoc(docRef, finishData);

      // Update Local State immediately (Optimistic UI)
      set((state) => ({
        riders: state.riders.map((r) =>
          r.id === rider.id ? { ...r, ...finishData } : r
        ),
        finishLogs: [ { ...rider, ...finishData }, ...state.finishLogs ].slice(0, 50),
        finishing: null,
        manualNumber: ""
      }));

      // Backup to localStorage
      saveToLocalBackup("finishes", { ...rider, ...finishData });
    
    } catch (error) {
      console.error("Error saving finish:", error);
      set({ finishing: null });
      toast.error("Failed to save result to cloud");
    }
  },
  importRidersToDb: async (importRiders) => {
    const { tracks, eventName, trackName } = get();
  
    if (!db || !trackName || trackName === "NO TRACK") {
      toast.error("Please select a track before importing riders.");
      return;
    }
  
    const ridersArray = Array.isArray(importRiders) ? importRiders : [importRiders];
    const validRiders = ridersArray.filter(
      (r) => r.riderNumber && String(r.riderNumber).trim() !== ""
    );
  
    if (validRiders.length < ridersArray.length) {
      toast.error(`Skipped ${ridersArray.length - validRiders.length} rider(s) with missing numbers`);
    }
  
    // Import to the current track first
    const currentTrackName = trackName;
    await get()._importRidersToTrack(validRiders, eventName, currentTrackName);
  
    // Then, clone to all other tracks
    const otherTracks = tracks.filter(t => t !== currentTrackName);
    for (const otherTrack of otherTracks) {
      await get()._importRidersToTrack(validRiders, eventName, otherTrack, true);
    }
  
    toast.success(`Successfully imported ${validRiders.length} riders to all tracks.`);
  },
  
  _importRidersToTrack: async (riders, eventName, targetTrackName, isClone = false) => {
    const batch = writeBatch(db);
    const formattedEvent = eventName.replace(/\s+/g, '-').toUpperCase();
    const formattedTrack = targetTrackName.replace(/\s+/g, '-').toUpperCase();
    const raceId = `${formattedEvent}_${formattedTrack}`;
  
    riders.forEach((rider) => {
      const rNumber = String(rider.riderNumber).trim();
      const customDocId = `${raceId}_${rNumber}`;
      const docRef = doc(db, "riders", customDocId);
  
      const riderDoc = {
        ...rider,
        raceId: raceId,
        riderNumber: rNumber,
        eventName: eventName,
        trackName: targetTrackName,
        status: "WAITING",
        startTime: null,
        startTimeMs: null,
        finishTime: null,
        finishTimeMs: null,
        raceTime: null,
        durationMs: null,
        timestamp: serverTimestamp(),
      };
      batch.set(docRef, riderDoc, { merge: true });
    });
  
    try {
      await batch.commit();
      if (!isClone) {
        // toast.success(`Imported to ${targetTrackName}`);
      }
    } catch (error) {
      console.error(`Error importing riders to ${targetTrackName}:`, error);
      toast.error(`Import to ${targetTrackName} failed.`);
    }
  },
  resetRider: async (riderId) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const riderRef = doc(db, "riders", riderId);

      const resetData = {
        status: "WAITING",
        startTime: null,
        startTimeMs: null,
        finishTime: null,
        finishTimeMs: null,
        durationMs: null,
        raceTime: null
      };

      await updateDoc(riderRef, resetData);

      set((state) => ({
        riders: state.riders.map((r) =>
          r.id === riderId ? { ...r, ...resetData } : r
        ),
      }));
    } catch (error) {
      console.error("Reset failed:", error);
    }
},
cloneRidersFromTrack: async (sourceTrackName) => {
  const { riders, eventName, trackName, addRider, fetchEventResults } = get();
  
  // 1. Find all riders from the source track in THIS event
  const allRiders = await fetchEventResults(eventName);
  const sourceRiders = allRiders.filter(r => r.trackName === sourceTrackName);

  if (sourceRiders.length === 0) return { success: false, count: 0 };

  // 2. Filter out riders that are ALREADY in the current track (to avoid duplicates)
  const currentRiderNumbers = new Set(
    riders.filter(r => r.trackName === trackName).map(r => r.riderNumber)
  );

  const ridersToClone = sourceRiders.filter(
    (r) => !currentRiderNumbers.has(r.riderNumber)
  );

  // 3. Map to new objects (stripping timing data) and save
  const clonePromises = ridersToClone.map(rider => {
    const { ...cleanData } = rider;
    return addRider({
      ...cleanData,
      trackName: trackName, // Assign to current track
      status: "WAITING",
    });
  });

  await Promise.all(clonePromises);
  return { success: true, count: ridersToClone.length };
},
fetchRidersForSession: async () => {
  const { activeRaceId } = get();

  // Guard: Don't fetch if no session is active
  if (!activeRaceId) {
    console.warn("No activeRaceId found. Aborting fetch.");
    return;
  }

  try {
    const ridersRef = collection(db, "riders");
    
    // 🟢 The Filter: Only get riders for this specific Event + Track combo
    const q = query(ridersRef, where("raceId", "==", activeRaceId));

    const querySnapshot = await getDocs(q);
    
    const loadedRiders = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id, // Ensure we keep the Composite ID for updates
    }));

    // Update local state with the filtered list
    set({ riders: loadedRiders });
    
    console.log(`📡 Loaded ${loadedRiders.length} riders for session: ${activeRaceId}`);
  } catch (error) {
    console.error("Error fetching session riders:", error);
  }
},
syncEventRiders: async (eventName) => {
  set({ riders: [] }); // Clear current riders to avoid ghost data
  const ridersRef = collection(db, "riders");
  const q = query(
    ridersRef, 
    where("eventName", "==", eventName),
    where("status", "in", ["WAITING", "ON_TRACK"])
  );

  try {
    const querySnapshot = await getDocs(q);
    const loadedRiders = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    }));
    
    set({ riders: loadedRiders });
    if (loadedRiders.length > 0) {
      toast.success(`Synced ${loadedRiders.length} riders for ${eventName}`);
    }
  } catch (error) {
    console.error("Error syncing event riders:", error);
    toast.error("Failed to sync riders");
  }
},
fetchEventResults: async (eventName) => {
  const ridersRef = collection(db, "riders");
  const q = query(ridersRef, where("eventName", "==", eventName));
  
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    }));
  } catch (error) {
    console.error("Error fetching event results:", error);
    return [];
  }
},
renameTrack: async (newTrackName) => {
  const { eventName, trackName, activeRaceId, riders } = get();
  if (!trackName || trackName === "NO TRACK") return;

  const formattedEvent = eventName.replace(/\s+/g, '-').toUpperCase();
  const formattedNewTrack = newTrackName.replace(/\s+/g, '-').toUpperCase();
  const newActiveRaceId = `${formattedEvent}_${formattedNewTrack}`;

  // Filter riders for current track (using local state which should be synced)
  const currentRiders = riders.filter(r => r.raceId === activeRaceId);

  if (currentRiders.length === 0) {
      set({ 
          trackName: newTrackName,
          activeRaceId: newActiveRaceId
      });
      toast.success(`Track renamed to ${newTrackName}`);
      return;
  }

  try {
      const promises = currentRiders.map(async (rider) => {
          const oldDocRef = doc(db, "riders", rider.id);
          const newDocId = `${newActiveRaceId}_${rider.riderNumber}`;
          const newDocRef = doc(db, "riders", newDocId);

          const { id, ...riderData } = rider;
          const newData = {
              ...riderData,
              trackName: newTrackName,
              raceId: newActiveRaceId,
          };

          await setDoc(newDocRef, newData);
          await deleteDoc(oldDocRef);
      });

      await Promise.all(promises);

      set({
          trackName: newTrackName,
          activeRaceId: newActiveRaceId,
          riders: [] // Clear riders to force a refresh or let subscription handle it
      });
      
      toast.success(`Track renamed to ${newTrackName}`);
  } catch (error) {
      console.error("Error renaming track:", error);
      toast.error("Failed to rename track");
  }
},

syncSessionRiders: async () => {
  const { activeRaceId } = get();
  if (!activeRaceId) {
    toast.error("No active session to sync!");
    return;
  }

  set({ loading: true }); // Show a spinner
  
  try {
    const ridersRef = collection(db, "riders");
    const q = query(ridersRef, where("raceId", "==", activeRaceId));
    const querySnapshot = await getDocs(q);
    
    const freshRiders = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));

    set({ 
      riders: freshRiders, 
      loading: false 
    });
    
    toast.success(`Synced ${freshRiders.length} riders from cloud`);
  } catch (error) {
    console.error("Sync failed:", error);
    set({ loading: false });
    toast.error("Sync failed. Check internet connection.");
  }
},
categoryFilter: "ALL", 
setCategoryFilter: (category) => set({ categoryFilter: category }),
}));
