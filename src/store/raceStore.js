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
  subscribeRiders: (user, raceId) => {
    if (!user || !raceId) return;

    // Clean up any previous listener
    const prevUnsub = get().unsubscribeRiders;
    if (prevUnsub) prevUnsub();

    const q = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "mtb_riders"
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((doc) => doc.raceId === raceId); // client-side filter
        set({ riders: data });
      },
      (error) => {
        console.error("Firestore sync error:", error);
      }
    );

    set({ unsubscribeRiders: unsubscribe });
  },

  clearRiders: () => {
    const prevUnsub = get().unsubscribeRiders;
    if (prevUnsub) prevUnsub();
    set({ riders: [], unsubscribeRiders: null });
  },

  setRaceNumber: (num) => set({ raceNumber: num }),
  setLoading: (val) => set({ loading: val }),

  handleStart: async (user, raceId) => {
    const { raceNumber } = get();
    if (!raceNumber.trim()) return;

    set({ loading: true });
    const num = raceNumber.trim();
    const now = new Date();

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
        lastStarted: { number: num, time: now },
        raceNumber: "",
      });
    } catch (error) {
      console.error("Error starting rider:", error);
      alert("Error saving data. Checked local storage.");
    } finally {
      set({ loading: false });
    }
  },
  subscribeToRiders: () => {
    // 1. Reference the collection
    const q = query(
      collection(db, "artifacts", appId, "public", "data", "mtb_riders"),
      orderBy("startTime", "asc") // Optional: sort by start time
    );

    // 2. Set up the listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const liveRiders = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          liveRiders.push({
            id: doc.id,
            ...data,
            // 3. CRITICAL: Handle Field Mapping
            // Your handleStart saves "raceNumber", but your UI might expect "number"
            number: data.raceNumber || data.number,
            // Ensure dates are actual Date objects for math in your hook
            startTime: data.startTime ? new Date(data.startTime) : null,
            finishTime: data.finishTime ? new Date(data.finishTime) : null,
          });
        });

        // 4. Update the store with the fresh list from the DB
        set({ riders: liveRiders });
      },
      (error) => {
        console.error("Firestore listener error:", error);
      }
    );

    // Return the unsubscribe function so we can clean up
    return unsubscribe;
  },

  // Finish state
  finishing: null,
  manualNumber: "",
  finishLogs: getLocalBackup("finishes"),
  showSoloStart: false,
  soloNumber: "",

  setManualNumber: (num) => set({ manualNumber: num }),
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

  handleFinish: async (user, raceId, rider) => {
    if (!user) return;
    set({ finishing: rider.id });
    const now = new Date();
    const nowIso = now.toISOString();
    const calculatedRaceTime = calculateRaceTime(rider.startTime, nowIso);

    const finishData = {
      status: "FINISHED",
      finishTime: nowIso,
      finishedBy: user.uid,
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
