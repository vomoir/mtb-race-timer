import { create } from "zustand";

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
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

import { db, appId, auth } from "../modules/firebase";

import { getLocalBackup, saveToLocalBackup } from "./utils.js";
import { calculateRaceTime } from "./utils.js"; // adjust imports

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
  login: async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // user will be set automatically by onAuthStateChanged
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  // Starter state
  raceNumber: "",
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
  unsubscribeRiders: null,
  setRiders: (riders) => set({ riders }),
  clearRiders: () => {
    const prevUnsub = get().unsubscribeRiders;
    if (prevUnsub) prevUnsub();
    set({ riders: [], unsubscribeRiders: null });
  },

  setRaceNumber: (num) => set({ raceNumber: num }),
  setLoading: (val) => set({ loading: val }),

  handleStart: async (user, raceId) => {
    const { raceNumber, riders } = get();
    if (!raceNumber.trim()) return;

    set({ loading: true });
    const num = raceNumber.trim();
    const now = new Date();
    set({
      riders: riders.map((r) =>
        r.riderNumber === num ? { ...r, status: "ON_TRACK", startTime: now } : r
      ),
    });

    const raceData = {
      raceId,
      raceNumber: num,
      startTime: now.toISOString(),
      status: "ON_TRACK",
      // startedBy: user.uid,
      finishTime: null,
      raceTime: null,
      timestamp: serverTimestamp(),
    };

    try {
      saveToLocalBackup("starts", raceData);
      set({ localLogs: getLocalBackup("starts") });

      await addDoc(
        collection(db, "artifacts", appId, "public", "data", "mtb_riders"),
        raceData
      );

      set({
        lastStarted: { riderNumber: num, time: now },
        raceNumber: "",
      });
    } catch (error) {
      console.error("Error starting rider:", error);
      alert("Error saving data. Checked local storage.");
    } finally {
      set({ loading: false });
    }
  },

  subscribeToRiders: (raceId) => {
    // 1. Create the query
    // If you need to filter by raceId, use 'where' (requires index) or client-side filter
    // const q = query(
    //   collection(db, "artifacts", appId, "public", "data", "mtb_riders"),
    //   where("raceId", "==", raceId),
    //   orderBy("startTime", "asc")
    // );
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

    console.log(`Subscribing to riders...`);

    // 2. Set up the listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const liveRiders = [];

        snapshot.forEach((doc) => {
          const data = doc.data();

          // OPTIONAL: If you need to support multiple races, uncomment this check:
          // if (raceId && data.raceId !== raceId) return;

          liveRiders.push({
            id: doc.id, // CRITICAL: The Firestore ID needed for updates
            ...data,

            // CRITICAL: Handle the field name mismatch
            number: data.raceNumber || data.riderNumber || data.number,

            // CRITICAL: Convert Strings/Timestamps to Date objects
            startTime: data.startTime ? new Date(data.startTime) : null,
            finishTime: data.finishTime ? new Date(data.finishTime) : null,
          });
        });

        // 3. Update the store
        set({ riders: liveRiders });
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
      raceNumber: num,
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
    const rider = ridersOnTrack.find((r) => r.raceNumber === num);
    if (rider) {
      get().handleFinish(user, raceId, rider);
    } else {
      alert(`Rider #${num} not found on track for Race ID: ${raceId}!`);
    }
  },
}));
