// utils/normalizeRiders.js
export function normalizeRiders(input) {
  // Always work with an array
  const ridersArray = Array.isArray(input) ? input : input ? [input] : [];

  return ridersArray.map((r) => {
    // Defensive type coercion
    const riderNumber = r.riderNumber ?? r.number;
    const normalizedNumber = riderNumber != null ? String(riderNumber) : "";

    return {
      id: r.id ?? null,
      riderNumber: normalizedNumber,
      status: r.status ?? "WAITING",
      raceId: r.raceId ?? null,

      // Normalize timestamps
      startTime: r.startTime
        ? r.startTime.toDate
          ? r.startTime.toDate()
          : new Date(r.startTime)
        : null,
      finishTime: r.finishTime
        ? r.finishTime.toDate
          ? r.finishTime.toDate()
          : new Date(r.finishTime)
        : null,
      raceTime: r.raceTime ?? null,
      timestamp: r.timestamp?.toDate
        ? r.timestamp.toDate()
        : r.timestamp ?? null,

      // Spread any other fields safely
      ...r,
    };
  });
}

export function normalizeDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") {
    return value.toDate(); // Firestore Timestamp
  }
  return new Date(value); // ISO string or JS Date
}
