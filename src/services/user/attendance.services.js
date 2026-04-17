import { db } from "../../utils/FirebaseConfig";
import {
  collection,
  query,
  where,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  serverTimestamp,
  orderBy,
  limit as fblimit,
  onSnapshot,
} from "firebase/firestore";


export const checkIn = async ({ userId, lateReason = "" }) => {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  const ref = doc(db, "Attendance", `${userId}_${today}`);
  const snap = await getDoc(ref);

  if (snap.exists() && snap.data().checkIn) {
    throw new Error("Already checked in");
  }

  const isLate = now.getHours() >= 12;

  await setDoc(ref, {
    userId,
    date: today,
    checkIn: now.toISOString(),
    checkOut: null,
    hours: null,
    late: isLate,
    lateReason: isLate ? lateReason : "",
    type: "present",
    status: isLate ? "late" : "present",
    seenBy: {
      checkIn: [],
      checkOut: [],
    },
    createdAt: serverTimestamp(),
  });
};

export const checkOut = async (userId, date) => {
  if (!userId || !date) {
    throw new Error("Invalid checkout request");
  }

  const ref = doc(db, "Attendance", `${userId}_${date}`);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("Attendance record not found");
  }

  const data = snap.data();

  if (!data.checkIn) {
    throw new Error("Check-in required first");
  }

  if (data.checkOut) {
    throw new Error("Already checked out");
  }

  const checkInTime = new Date(data.checkIn);
  const now = new Date();

  const diff = Math.floor((now - checkInTime) / 1000 / 60);
  const hours = `${Math.floor(diff / 60)}h ${diff % 60}m`;

  await updateDoc(ref, {
    checkOut: now.toISOString(),
    hours,
    "seenBy.checkOut": [],
  });
};

export const subscribeLastPendingCheckout = (userId, callback) => {
  if (!userId) return;

  const q = query(
    collection(db, "Attendance"),
    where("userId", "==", userId),
    orderBy("date", "desc"),
    fblimit(10),
  );

  const unsubscribe = onSnapshot(q, (snap) => {
    let pending = null;

    for (let docSnap of snap.docs) {
      const data = docSnap.data();

      if (!data || data.type === "leave" || !data.checkIn) continue;

      if (!data.checkOut) {
        pending = data;
        break;
      }
    }

    callback(pending);
  });

  return unsubscribe;
};

export const subscribeMonthlyAttendance = ({ userId, date, callback }) => {
  if (!userId || !date) return;

  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const q = query(
    collection(db, "Attendance"),
    where("userId", "==", userId),
    where("date", ">=", start.toISOString().split("T")[0]),
    where("date", "<=", end.toISOString().split("T")[0]),
  );

  const unsubscribe = onSnapshot(q, (snap) => {
    const map = {};

    snap.docs.forEach((doc) => {
      const data = doc.data();

      map[data.date] = {
        userId: data.userId,
        date: data.date,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        hours: data.hours ?? null,
        late: data.late ?? false,
        lateReason: data.lateReason ?? "",
        type: data.type || "present",
        status: data.status || "absent",
      };
    });

    callback(map);
  });

  return unsubscribe;
};
