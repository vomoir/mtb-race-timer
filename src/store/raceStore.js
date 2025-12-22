import { create } from "zustand";
import toast from "react-hot-toast";
import { getTime, calculateTimeDifference } from "../utils/utils.js";

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
// import { calculateRaceDuration } from "../utils/utils.js"; // adjust imports

export const useRaceStore = create((set, get) => ({
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

  logout: async () => {
    await signOut(auth);
    set({ user: null });
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
  now: new Date(), // reference time
  tick: () => set({ now: new Date() }),
  isOnline: navigator.onLine,
  setIsOnline: (status) => set({ isOnline: status }),
  riders: [],
  setRiders: (riders) => set({ riders }),
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

    if (!existingRider) {
      // SCENARIO: NEW "AD-HOC" RIDER (Was not in the system)
      const newRiderData = {
        raceId,
        riderNumber: riderNumber,
        firstName: "Rider",
        lastName: "Not Registered",
        startTime: nowIso,
        status: "ON_TRACK",
        finishTime: null,
        raceTime: null,
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

  subscribeToRiders: (raceId) => {
    if (!raceId) return null; // no subscription

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

    if (raceId) {
      constraints.unshift(where("raceId", "==", raceId));
    }

    const q = query(baseCollection, ...constraints);

    console.log(`Subscribing to riders... ${raceId}`);

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

  // Finish state
  handleFinish: async (rider) => {
    if (!rider) return;
    set({ finishing: rider.id });

    const calculatedRaceTime = calculateTimeDifference(
      rider.startTime,
      rider.finishTime
    );

    const finishData = {
      status: "FINISHED",
      finishTime: rider.finishTime,
      raceTime: calculatedRaceTime,
    };

    try {
      saveToLocalBackup("finishes", { ...rider, ...finishData });
      set({ finishLogs: getLocalBackup("finishes") });

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
    const raceId = get().raceId;

    if (!db || !appId || !raceId) {
      console.error(
        "Cannot import demo data: Missing dependencies (db, appId, raceId)."
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
        validRiders.push(r);
      }
    });

    // Create an array of Promises for concurrent writes
    const promises = validRiders
      .filter((r) => r.riderNumber && String(r.riderNumber).trim() !== "")
      .map((rider) => {
        const newDoc = {
          raceId,
          riderNumber: String(rider.riderNumber).trim(), // Ensure consistent string format
          firstName: rider.firstName,
          lastName: rider.lastName,
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
}));
