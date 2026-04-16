import { db } from "../../utils/FirebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

export const checkIn = async ({ userId, lateReason = "" }) => {
  const today = new Date().toISOString().split("T")[0];

  const ref = doc(db, "Attendance", `${userId}_${today}`);
  const snap = await getDoc(ref);

  if (snap.exists() && snap.data().checkIn) {
    throw new Error("Already checked in");
  }

  const isLate = new Date().getHours() >= 12;

  await setDoc(ref, {
    userId,
    date: today,
    checkIn: new Date().toLocaleTimeString(),
    checkOut: null,
    hours: null,
    status: isLate ? "late" : "present",
    late: isLate,
    lateReason: isLate ? lateReason : "",
    createdAt: serverTimestamp(),
  });
};

export const checkOut = async (userId) => {
  const today = new Date().toISOString().split("T")[0];

  const ref = doc(db, "Attendance", `${userId}_${today}`);
  const snap = await getDoc(ref);

  if (!snap.exists() || !snap.data().checkIn) {
    throw new Error("Check-in required first");
  }

  if (snap.data().checkOut) {
    throw new Error("Already checked out");
  }

  const checkInTime = new Date(`${today} ${snap.data().checkIn}`);
  const now = new Date();

  const diff = Math.floor((now - checkInTime) / 1000 / 60);
  const hours = `${Math.floor(diff / 60)}h ${diff % 60}m`;

  await updateDoc(ref, {
    checkOut: now.toLocaleTimeString(),
    hours,
  });
};

// export const getMonthlyAttendance = async ({ userId, date }) => {
//   if (!userId || !date) return;
//   const start = new Date(date.getFullYear(), date.getMonth(), 1);
//   const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

//   const q = query(
//     collection(db, "Attendance"),
//     where("userId", "==", userId),
//     where("date", ">=", start.toISOString().split("T")[0]),
//     where("date", "<=", end.toISOString().split("T")[0]),
//   );

//   const snap = await getDocs(q);

//   const map = {};

//   snap.docs.forEach((doc) => {
//     const data = doc.data();

//     map[data.date] = {
//       type: data.type || "present",
//       late: data.late || false,
//     };
//   });

//   return map;
// };

export const getMonthlyAttendance = async ({ userId, date }) => {
  if (!userId || !date) return {};

  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const q = query(
    collection(db, "Attendance"),
    where("userId", "==", userId),
    where("date", ">=", start.toISOString().split("T")[0]),
    where("date", "<=", end.toISOString().split("T")[0]),
  );

  const snap = await getDocs(q);

  const map = {};

  snap.docs.forEach((doc) => {
    const data = doc.data();

    const dateObj = new Date(data.date);

    map[data.date] = {
      userId: data.userId || userId,
      date: data.date,

      createdAt: data.createdAt || null,

      hours: data.hours ?? null,
      checkIn: data.checkIn ?? null,
      checkOut: data.checkOut ?? null,

      late: data.late ?? false,
      lateReason: data.lateReason ?? "",

      type: data.type || "present",
      status: data.status || "absent",
    };
  });

  return map;
};


export const getDummyAttendance = (inputDate) => {
  const date = new Date(inputDate);
  const year = date.getFullYear();
  const month = date.getMonth();
  const map = {};
  const totalDays = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, month, d);
    const key = dateObj.toISOString().split("T")[0];

    const base = {
      userId: "y0cABjV4M9",
      date: key,
      createdAt: new Date(dateObj.setHours(9, 0, 0)),
      hours: null,
      checkIn: null,
      checkOut: null,
      late: false,
      lateReason: "",
      type: "present",
      status: "absent",
    };

    if (d % 7 === 0) {
      map[key] = {
        ...base,
        type: "leave",
        status: "leave",
      };
      continue;
    }

    if (d % 5 === 0) {
      map[key] = {
        ...base,
        checkIn: "11:45:00",
        checkOut: "19:00:00",
        late: true,
        lateReason: "Delayed due to unexpected traffic",
        hours: 7.25,
        status: "late",
      };
      continue;
    }

    if (d % 2 === 0) {
      map[key] = {
        ...base,
        checkIn: "09:05:00",
        checkOut: "17:30:00",
        hours: 8.25,
        status: "present",
      };
      continue;
    }

    map[key] = {
      ...base,
      status: "absent",
    };
  }

  return map;
};
