import { create } from "zustand";

import {
  addDoc,
  collection,
  doc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
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

function formatElapsed(startTime, now) {
  if (!startTime) return null;
  const start = new Date(startTime);
  const diffMs = now - start;
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

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
  setRiders: (riders) =>
    set({
      riders,
      finishedRiders: riders
        .filter((r) => r.status === "FINISHED")
        .sort((a, b) => new Date(b.finishTime) - new Date(a.finishTime)),
    }),
  finishedRiders: [],

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

  ridersOnTrack: () => {
    const { riders, now } = get();
    return riders
      .filter((r) => r.status === "ON_TRACK")
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .map((r) => ({
        ...r,
        elapsedTime: formatElapsed(r.startTime, now),
      }));
  },

  // --- Derived selectors ---
  // getRidersOnTrack: () => {
  //   const { riders, now } = get();
  //   return riders
  //     .filter((r) => r.status === "ON_TRACK")
  //     .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
  //     .map((r) => ({
  //       ...r,
  //       elapsedTime: formatElapsed(r.startTime, now),
  //     }));
  // },

  // getFinishedRiders: () => {
  //   const { riders } = get();
  //   return riders
  //     .filter((r) => r.status === "FINISHED")
  //     .sort((a, b) => new Date(b.finishTime) - new Date(a.finishTime));
  // },

  setRaceNumber: (num) => set({ raceNumber: num }),
  setLoading: (val) => set({ loading: val }),

  handleStart: async (user, raceId) => {
    const { raceNumber } = get();
    if (!raceNumber.trim() || !user) return;

    set({ loading: true });
    const num = raceNumber.trim();
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

// Debug helper: call this in devtools or anywhere
export const debugRaceStore = () => {
  const state = useRaceStore.getState();
  console.log("RaceStore state:", state);
  return state;
};
