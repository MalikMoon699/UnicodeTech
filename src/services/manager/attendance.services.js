// import {
//   collection,
//   query,
//   where,
//   onSnapshot,
//   doc,
//   updateDoc,
//   arrayUnion,
// } from "firebase/firestore";
// import { db } from "../../utils/FirebaseConfig";

// export const listenAttendanceStats = (callback) => {
//   const today = new Date().toISOString().split("T")[0];

//   const q = query(collection(db, "Attendance"), where("date", "==", today));

//   return onSnapshot(q, (snapshot) => {
//     let present = 0;
//     let late = 0;
//     let leave = 0;

//     const uniqueUsers = new Set();

//     snapshot.docs.forEach((docSnap) => {
//       const data = docSnap.data();
//       if (data.userId) uniqueUsers.add(data.userId);
//       if (data.type === "leave") leave++;
//       if (data.type === "present") present++;
//       if (data.late === true) late++;
//     });

//     callback({
//       totalUsers: uniqueUsers.size,
//       present,
//       late,
//       leave,
//     });
//   });
// };

// export const listenAllUsersWithAttendance = (managerId, callback) => {
//   const attendanceRef = collection(db, "Attendance");

//   let usersMap = new Map();
//   let usersSnapCache = new Map();

//   const buildUserObject = (data) => ({
//     ...data,
//     attendance: [],
//     unseenCount: 0,
//   });

//   const unsubUsers = onSnapshot(collection(db, "Users"), (snap) => {
//     usersSnapCache = new Map();

//     snap.docs.forEach((docSnap) => {
//       const data = docSnap.data();
//   if (data.status !== "active") return;

//       usersSnapCache.set(data.userId, buildUserObject(data));
//     });

//     usersMap = new Map(usersSnapCache);
//   });

//   const unsubAttendance = onSnapshot(attendanceRef, (attSnap) => {
//     const updatedMap = new Map();

//     usersMap.forEach((user, key) => {
//       updatedMap.set(key, {
//         ...user,
//         attendance: [],
//         unseenCount: 0,
//       });
//     });

//     attSnap.docs.forEach((docSnap) => {
//       const data = docSnap.data();
//       const user = updatedMap.get(data.userId);

//       if (!user) return;

//       const seenBy = data.seenBy || {};

//       const isCheckInUnseen =
//         data.checkIn && !seenBy?.checkIn?.includes(managerId);

//       const isCheckOutUnseen =
//         data.checkOut && !seenBy?.checkOut?.includes(managerId);

//       if (isCheckInUnseen) user.unseenCount++;
//       if (isCheckOutUnseen) user.unseenCount++;

//       user.attendance.push({
//         ...data,
//         id: docSnap.id,
//       });
//     });

//     const result = Array.from(updatedMap.values()).sort((a, b) => {
//       if (b.unseenCount !== a.unseenCount) {
//         return b.unseenCount - a.unseenCount;
//       }
//       return (a.fullName || "").localeCompare(b.fullName || "");
//     });

//     callback(result);
//   });

//   return () => {
//     unsubUsers();
//     unsubAttendance();
//   };
// };

// export const listenSelectedUserMonthly = (
//   userId,
//   date,
//   managerId,
//   callback,
// ) => {
//   if (!userId || !date) return;

//   const start = new Date(date.getFullYear(), date.getMonth(), 1);
//   const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

//   const q = query(
//     collection(db, "Attendance"),
//     where("userId", "==", userId),
//     where("date", ">=", start.toISOString().split("T")[0]),
//     where("date", "<=", end.toISOString().split("T")[0]),
//   );

//   return onSnapshot(q, (snapshot) => {
//     const map = {};

//     snapshot.docs.forEach((docSnap) => {
//       const data = docSnap.data();

//       map[data.date] = {
//         ...data,
//         id: docSnap.id,
//       };

//       if (data.checkIn && !data.seenBy?.checkIn?.includes(managerId)) {
//         updateDoc(doc(db, "Attendance", docSnap.id), {
//           "seenBy.checkIn": arrayUnion(managerId),
//         });
//       }

//       if (data.checkOut && !data.seenBy?.checkOut?.includes(managerId)) {
//         updateDoc(doc(db, "Attendance", docSnap.id), {
//           "seenBy.checkOut": arrayUnion(managerId),
//         });
//       }
//     });

//     callback(map);
//   });
// };

import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../../utils/FirebaseConfig";

export const listenAttendanceStats = (callback) => {
  const today = new Date().toISOString().split("T")[0];

  const q = query(collection(db, "Attendance"), where("date", "==", today));

  let isFirstLoad = true;

  return onSnapshot(q, (snapshot) => {
    let present = 0;
    let late = 0;
    let leave = 0;

    const uniqueUsers = new Set();

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();

      if (data.userId) uniqueUsers.add(data.userId);
      if (data.type === "leave") leave++;
      if (data.type === "present") present++;
      if (data.late === true) late++;
    });

    callback({
      totalUsers: uniqueUsers.size,
      present,
      late,
      leave,
      isFirstLoad,
    });

    isFirstLoad = false;
  });
};

export const listenAllUsersWithAttendance = (managerId, callback) => {
  const attendanceRef = collection(db, "Attendance");

  let usersMap = new Map();
  let usersSnapCache = new Map();

  let usersLoaded = false;
  let attendanceLoaded = false;

  const buildUserObject = (data) => ({
    ...data,
    attendance: [],
    unseenCount: 0,
  });

  const tryEmit = () => {
    if (usersLoaded && attendanceLoaded) {
      const result = Array.from(usersMap.values()).sort((a, b) => {
        if (b.unseenCount !== a.unseenCount) {
          return b.unseenCount - a.unseenCount;
        }
        return (a.fullName || "").localeCompare(b.fullName || "");
      });

      callback(result, true); // ✅ ready
    }
  };

  const unsubUsers = onSnapshot(collection(db, "Users"), (snap) => {
    usersSnapCache = new Map();

    snap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.status !== "active") return;

      usersSnapCache.set(data.userId, buildUserObject(data));
    });

    usersMap = new Map(usersSnapCache);
    usersLoaded = true;
    tryEmit();
  });

  const unsubAttendance = onSnapshot(attendanceRef, (attSnap) => {
    const updatedMap = new Map();

    usersMap.forEach((user, key) => {
      updatedMap.set(key, {
        ...user,
        attendance: [],
        unseenCount: 0,
      });
    });

    attSnap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const user = updatedMap.get(data.userId);

      if (!user) return;

      const seenBy = data.seenBy || {};

      if (data.checkIn && !seenBy?.checkIn?.includes(managerId)) {
        user.unseenCount++;
      }

      if (data.checkOut && !seenBy?.checkOut?.includes(managerId)) {
        user.unseenCount++;
      }

      user.attendance.push({
        ...data,
        id: docSnap.id,
      });
    });

    usersMap = updatedMap;
    attendanceLoaded = true;
    tryEmit();
  });

  return () => {
    unsubUsers();
    unsubAttendance();
  };
};

export const listenSelectedUserMonthly = (
  userId,
  date,
  managerId,
  callback,
) => {
  if (!userId || !date) return;

  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const q = query(
    collection(db, "Attendance"),
    where("userId", "==", userId),
    where("date", ">=", start.toISOString().split("T")[0]),
    where("date", "<=", end.toISOString().split("T")[0]),
  );

  let isFirstLoad = true;

  return onSnapshot(q, (snapshot) => {
    const map = {};

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();

      map[data.date] = {
        ...data,
        id: docSnap.id,
      };

      if (data.checkIn && !data.seenBy?.checkIn?.includes(managerId)) {
        updateDoc(doc(db, "Attendance", docSnap.id), {
          "seenBy.checkIn": arrayUnion(managerId),
        });
      }

      if (data.checkOut && !data.seenBy?.checkOut?.includes(managerId)) {
        updateDoc(doc(db, "Attendance", docSnap.id), {
          "seenBy.checkOut": arrayUnion(managerId),
        });
      }
    });

    callback(map, isFirstLoad);
    isFirstLoad = false;
  });
};