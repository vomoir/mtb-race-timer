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
  orderBy,
  where,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signInAnonymously,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

import { db, appId, auth } from "../modules/firebase";

import { getLocalBackup, saveToLocalBackup } from "../utils/utils.js";

export const useRaceStore = create((set, get) => ({
  eventName:  "",
  trackName: "NO TRACK",
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
    finishTime: null,
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
  setRaceId: (id) => set({ raceId: id }),
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

    // 1. Check local state for the rider
    const existingRider = riders.find((r) => r.riderNumber === riderNumber);
    const nowIso = getTime();
    const nowMs = Date.now();

    // 2. CONSISTENCY: Always use the new top-level path and Composite ID
    // If the rider already has an ID, use it. Otherwise, build the composite one.
    const docId = existingRider?.id || `${activeRaceId}_${riderNumber}`;
    const docRef = doc(db, "riders", docId); // 🟢 TOP LEVEL COLLECTION

    const startData = {
      startTime: nowIso,
      startTimeMs: nowMs,
      status: "ON_TRACK",
      riderNumber: riderNumber, // Ensure this is stored
      raceId: activeRaceId,     // Ensure this is stored for ad-hoc riders
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

updateRiderStatus: async (riderId, newStatus) => {
  try {
    const { doc, updateDoc } = await import("firebase/firestore");
    const riderRef = doc(db, "riders", riderId);

    // Update Firestore
    await updateDoc(riderRef, { 
      status: newStatus,
      // If DNF, we keep the startTimeMs for records but clear potential duration
      durationMs: null, 
      raceTime: newStatus // Set raceTime string to "DNF" or "DNS" for the CSV
    });

    // Update Local State
    set((state) => ({
      riders: state.riders.map((r) =>
        r.id === riderId ? { ...r, status: newStatus, raceTime: newStatus } : r
      ),
    }));
  } catch (error) {
    console.error(`Failed to update rider to ${newStatus}:`, error);
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
  const { activeRaceId, eventName, trackName } = get();

  if (!db || !activeRaceId) {
    console.error("Cannot import data: Missing dependencies (db or activeRaceId).");
    return;
  }

  const ridersArray = Array.isArray(importRiders) ? importRiders : [importRiders];
  
  // 1. Filter out invalid rows immediately
  const validRiders = ridersArray.filter(
    (r) => r.riderNumber && String(r.riderNumber).trim() !== ""
  );

  if (validRiders.length < ridersArray.length) {
    toast.error(`Skipped ${ridersArray.length - validRiders.length} rider(s) with missing numbers`);
  }

  // 2. Create an array of Promises using setDoc and our Composite ID
  const promises = validRiders.map((rider) => {
    const rNumber = String(rider.riderNumber).trim();
    
    // 🟢 CREATE THE COMPOSITE ID: Same as addRider and handleStart
    const customDocId = `${activeRaceId}_${rNumber}`;
    
    // 🟢 POINT TO TOP-LEVEL COLLECTION
    const docRef = doc(db, "riders", customDocId);

    const riderDoc = {
      raceId: activeRaceId,
      riderNumber: rNumber,
      firstName: rider.firstName || "Unknown",
      lastName: rider.lastName || "Rider",
      eventName: eventName,
      trackName: trackName,
      caLicenceNumber: rider.caLicenceNumber || "",
      category: rider.category || "Open",
      status: "WAITING",
      startTime: null,
      startTimeMs: null,
      finishTime: null,
      finishTimeMs: null,
      raceTime: null,
      durationMs: null,
      timestamp: serverTimestamp(),
    };

    // 🟢 Use setDoc with merge to prevent overwriting existing progress if re-imported
    return setDoc(docRef, riderDoc, { merge: true });
  });

  try {
    await Promise.all(promises);
    toast.success(`Successfully imported ${promises.length} riders to ${trackName}`);
    // Your onSnapshot listener in subscribeToRiders will automatically 
    // pick these up and update the UI!
  } catch (error) {
    console.error("Error importing riders:", error);
    toast.error("Import failed. Check console for details.");
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
  const { riders, eventName, trackName, addRider } = get();
  
  // 1. Find all riders from the source track in THIS event
  const sourceRiders = riders.filter(
    (r) => r.eventName === eventName && r.trackName === sourceTrackName
  );

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
    const { id, startTime, finishTime, durationMs, raceTime, ...cleanData } = rider;
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
