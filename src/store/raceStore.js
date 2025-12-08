import { create } from "zustand";
// import { normalizeRiders } from "../utils/normalizeRiders.js";

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
import { calculateRaceTime } from "../utils/utils.js"; // adjust imports

export const useRaceStore = create((set, get) => ({
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
  loading: false,
  lastStarted: null,
  localLogs: getLocalBackup("starts"),

  activeTab: "starter",
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

  setLoading: (val) => set({ loading: val }),

  handleStart: async (raceId, riderNumber) => {
    if (!riderNumber.trim()) return;
    const { riders } = get();
    console.log(`Rider Number ${riderNumber}`);
    // THE GUARD CLAUSE: Check if this rider is already active or finished
    // We check against 'riderNumber'
    const nowIso = new Date().toISOString();
    const existingRider = riders.find((r) => r.riderNumber === riderNumber);

    console.log("Path check:", appId, existingRider?.id);
    const id = existingRider.id;
    console.log(`existing rider id ${id}`);

    if (existingRider) {
      if (existingRider.status === "ON_TRACK") {
        alert(`⚠️ Rider #${riderNumber} is ALREADY on track!`);
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
    } else {
      // SCENARIO: NEW "AD-HOC" RIDER (Was not in the system)
      const newRiderData = {
        raceId,
        riderNumber: riderNumber,
        startTime: nowIso,
        status: "ON_TRACK",
        finishTime: null,
        raceTime: null,
        timestamp: serverTimestamp(),
      };

      await addDoc(
        collection(db, "artifacts", appId, "public", "data", "mtb_riders"),
        newRiderData
      );
      saveToLocalBackup("starts", newRiderData);
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

        // snapshot.forEach((doc) => {
        //   const data = doc.data();
        //   liveRiders.push({
        //     ...data,
        //     id: doc.id,
        //     riderNumber: data.riderNumber,
        //     startTime: data.startTime ? data.startTime : null,
        //     finishTime: data.finishTime ? data.finishTime : null,
        //   });
        // });
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

        // 3. Update the store
        // set({ riders: normalizeRiders(liveRiders) });
      },
      (error) => {
        console.error("Firestore listener error:", error);
      }
    );

    // 4. Return unsubscribe so useEffect can clean up
    return unsubscribe;
  },
  // Finish state
  finishing: null,
  finishLogs: getLocalBackup("finishes"),
  showSoloStart: false,
  soloNumber: "",
  setSoloNumber: (num) => set({ soloNumber: num }),
  toggleSoloStart: (val) => set({ showSoloStart: val }),

  handleSoloStart: async (user, raceId) => {
    const { soloNumber } = get();
    if (!soloNumber.trim() || !user) return;

    const num = soloNumber.trim();
    const now = new Date();

    const raceData = {
      raceId,
      riderNumber: num,
      startTime: now.toISOString(),
      status: "ON_TRACK",
      startedBy: user.uid,
      finishTime: null,
      raceTime: null,
      timestamp: serverTimestamp(),
    };

    try {
      saveToLocalBackup("starts", raceData);
      await addDoc(
        collection(db, "artifacts", appId, "public", "data", "mtb_riders"),
        raceData
      );
      set({ soloNumber: "", showSoloStart: false });
    } catch (error) {
      console.error("Error starting rider:", error);
    }
  },

  handleFinish: async (rider) => {
    if (!rider) return;
    set({ finishing: rider.id });
    const now = new Date();
    const nowIso = now.toISOString();
    const calculatedRaceTime = calculateRaceTime(rider.startTime, nowIso);

    const finishData = {
      status: "FINISHED",
      finishTime: nowIso,
      // finishedBy: user.uid,
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

  handleManualFinish: (user, raceId, ridersOnTrack) => {
    const { manualNumber } = get();
    const num = manualNumber.trim();
    if (!num) return;
    const rider = ridersOnTrack.find((r) => r.riderNumber === num);
    if (rider) {
      get().handleFinish(user, raceId, rider);
    } else {
      alert(`Rider #${num} not found on track for Race ID: ${raceId}!`);
    }
  },

  importDemoRiders: async (ridersArray) => {
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

    // Create an array of Promises for concurrent writes
    const promises = ridersArray.map((rider) => {
      // 1. Prepare new document data
      const newDoc = {
        raceId: raceId,
        riderNumber: String(rider.riderNumber), // Ensure consistent string format
        name: rider.name,
        category: rider.category,
        status: "WAITING",
        startTime: null,
        finishTime: null,
        raceTime: null,
        timestamp: serverTimestamp(),
        // Include any other necessary fields from your demo structure
      };

      // 2. Add document to Firestore
      return addDoc(collectionRef, newDoc);
    });

    try {
      await Promise.all(promises);
      console.log(`Successfully added ${ridersArray.length} demo riders.`);
      // The onSnapshot listener handles the state update from here!
    } catch (error) {
      console.error("Error importing demo riders:", error);
    }
  },
}));
