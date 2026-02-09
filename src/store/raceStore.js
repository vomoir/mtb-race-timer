import { create } from "zustand";
import toast from "react-hot-toast";
import { getTime, formatDuration } from "../utils/utils.js";

import {
  addDoc,
  collection,
  doc,
  updateDoc,
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
    return `${eventName}_${trackName}`.replace(/\s+/g, '-').toUpperCase();
  },  
  // Unique ID for DB filtering (combines both to prevent overlaps)  
  setSession: (event, track) => set({ 
    eventName: event, 
    trackName: track,
    activeRaceId: `${event.replace(/\s+/g, '-')}_${track.replace(/\s+/g, '-')}`.toUpperCase()
  }),  
  queueStart: (riderData) => {
    const existing = JSON.parse(localStorage.getItem("pendingStarts") || "[]");
    existing.push(riderData);
    localStorage.setItem("pendingStarts", JSON.stringify(existing));
  },
  syncPendingStarts: async () => {
    const pending = JSON.parse(localStorage.getItem("pendingStarts") || "[]");
    if (pending.length === 0) return;
    const collectionRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "mtb_riders"
    );
    for (const rider of pending) {
      await addDoc(collectionRef, rider);
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
  
  // 1. Prepare the complete rider object
  const newRider = {
    // Spread the incoming data (riderNumber, firstName, lastName, etc.)
    ...riderData,
    
    // Session Tracking
    raceId: activeRaceId,
    eventName: eventName,
    trackName: trackName,
    
    status: "WAITING",
    createdAt: serverTimestamp(), // Good for secondary sorting if needed

    // Initialize Timing Fields as null to prevent calculation errors
    startTime: null,
    startTimeMs: null,
    finishTime: null,
    finishTimeMs: null,
    durationMs: null,
    raceTime: null,
  };

  try {
    // 2. Save to Firestore
    const docRef = await addDoc(collection(db, "riders"), newRider);
    
    // 3. Update Local State (Optimistic UI)
    // We add the ID returned by Firestore so we can update this rider later
    set((state) => ({
      riders: [...state.riders, { ...newRider, id: docRef.id }]
    }));

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding rider to session:", error);
    return { success: false, error };
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
    const { riders } = get();
    const existingRider = riders.find((r) => r.riderNumber === riderNumber);

    // THE GUARD CLAUSE: Check if this rider is already active or finished
    // We check against 'riderNumber'
    const nowIso = getTime();
    const nowMs = Date.now(); // The numeric timestamp

    if (!existingRider) {
      // SCENARIO: NEW "AD-HOC" RIDER (Was not in the system)
      const newRiderData = {
        raceId,
        riderNumber: riderNumber,
        firstName: "Rider",
        lastName: "Not Registered",
        startTime: nowIso,
        startTimeMs: nowMs,
        status: "ON_TRACK",
        finishTime: null,
        finishTimeMs: null,
        raceTime: null,
        durationMs: null,
        timestamp: serverTimestamp(),
      };
      const collectionRef = collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "mtb_riders"
      );
      try {
        await addDoc(collectionRef, newRiderData);
        saveToLocalBackup("starts", newRiderData);
      } catch (err) {
        console.error("Error adding ad-hoc rider:", err);
        saveToLocalBackup("starts", { ...newRiderData, offline: true });
      }
    } else {
      if (existingRider.status === "ON_TRACK") {
        toast.error(`Rider #${riderNumber} is ALREADY on track!`);
        return;
      }

      // SCENARIO: UPDATING AN EXISTING RIDER (e.g. moving from WAITING to ON_TRACK)
      const docRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "mtb_riders",
        existingRider.id
      );

      await updateDoc(docRef, {
        startTime: nowIso,
        startTimeMs: nowMs,
        status: "ON_TRACK",
        riderNumber: riderNumber,
        // We don't change raceId or riderNumber, they are already there
      });

      if (existingRider.status === "FINISHED") {
        const confirmReRun = window.confirm(
          `Rider #${riderNumber} has already finished. Do you want to let them run again?`
        );
        if (!confirmReRun) return;
      }
    }
    set({ loading: false });
  },

  subscribeToRiders: (activeRaceId) => {
    if (!activeRaceId) return null; // no subscription

    const baseCollection = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "mtb_riders"
    );

    // Build constraints dynamically
    const constraints = [orderBy("startTime", "asc")];

    if (activeRaceId) {
      constraints.unshift(where("raceId", "==", activeRaceId));
    }

    const q = query(baseCollection, ...constraints);

    console.log(`Subscribing to riders... ${activeRaceId ? `Filtering by active raceId: ${activeRaceId}` : "No raceId filter"}`);

    // 2. Set up the listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let liveRiders = [];
        liveRiders = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            riderNumber: String(data.riderNumber), // normalize type
            startTime: data.startTime ? data.startTime : null,
            finishTime: data.finishTime ? data.finishTime : null,
          };
        });
        set({ riders: liveRiders });
      },
      (error) => {
        console.error("Firestore listener error:", error);
      }
    );

    // 4. Return unsubscribe so useEffect can clean up
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
      durationMs: finalDuration, // CRUCIAL: Used for sorting
      raceTime: raceTimeStr,
    };

    // 5. Save to Firestore
    try {
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
      console.error("Error saving finish:", error);
      toast.error("Failed to save result");
    } finally {
      set({ finishing: null });
    }

    try {
      saveToLocalBackup("finishes", { ...rider, ...finishData });
      set({ finishLogs: getLocalBackup("finishes") });
      // Optional: Optimistic update (update local state immediately)
      // The subscription will eventually update it, but this makes UI snappy
      set((state) => ({
        riders: state.riders.map((r) =>
          r.id === rider.id ? { ...r, ...finishData } : r
        ),
      }));
    } catch (error) {
      console.error("Error finishing rider:", error);
    } finally {
      set({ finishing: null, manualNumber: "" });
    } 
  },

  importRidersToDb: async (importRiders) => {
    const activeRaceId = get().activeRaceId;

    if (!db || !appId || !activeRaceId) {
      console.error(
        "Cannot import demo data: Missing dependencies (db, appId, activeRaceId)."
      );
      return;
    }

    const collectionRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "mtb_riders"
    );
    // Normalize: always work with an array
    const ridersArray = Array.isArray(importRiders)
      ? importRiders
      : [importRiders];
    // Check for invalid data
    const skipped = ridersArray.filter(
      (r) => !r.riderNumber || String(r.riderNumber).trim() === ""
    );
    if (skipped.length > 0) {
      toast.error(`Skipped ${skipped.length} rider(s) with missing numbers`);
    }
    const validRiders = [];
    ridersArray.forEach((r) => {
      if (!r.riderNumber || String(r.riderNumber).trim() === "") {
        toast.error(
          `Skipped rider: missing rider number (${r.firstName} ${r.lastName})`
        );
      } else {
        r.activeRaceId = activeRaceId; // Ensure they get the current session ID
        r.eventName = get().eventName; // Add event name for better tracking
        r.trackName = get().trackName; // Add track name for better tracking
        validRiders.push(r);
      }
    });

    // Create an array of Promises for concurrent writes
    const promises = validRiders
      .filter((r) => r.riderNumber && String(r.riderNumber).trim() !== "")
      .map((rider) => {
        const newDoc = {
          raceId: activeRaceId,
          riderNumber: String(rider.riderNumber).trim(), // Ensure consistent string format
          firstName: rider.firstName,
          lastName: rider.lastName,
          eventName: rider.eventName || get().eventName,
          trackName: rider.trackName || get().trackName,
          caLicenceNumber: rider.caLicenceNumber,
          category: rider.category,
          status: "WAITING",
          startTime: null,
          finishTime: null,
          raceTime: null,
          timestamp: serverTimestamp(),
        };

        return addDoc(collectionRef, newDoc);
      });

    try {
      await Promise.all(promises);
      console.log(`Successfully added ${promises.length} riders.`);
      // The onSnapshot listener handles the state update from here!
    } catch (error) {
      console.error("Error importing demo riders:", error);
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
}
}));
