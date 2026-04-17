// admin attendance services
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

  return onSnapshot(q, (snapshot) => {
    let present = 0;
    let late = 0;
    let leave = 0;

    const usersSet = new Set();

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();

      usersSet.add(data.userId);

      if (data.type === "leave") {
        leave++;
      } else if (data.type === "present") {
        present++;
      }

      if (data.late) late++;
    });

    callback({
      totalUsers: usersSet.size,
      present,
      late,
      leave,
    });
  });
};

export const listenAllUsersWithAttendance = (adminId, callback) => {
  const attendanceRef = collection(db, "Attendance");

  let usersMap = new Map();

  let usersSnapCache = new Map();
  let managersSnapCache = new Map();

  const buildUserObject = (data) => ({
    ...data,
    attendance: [],
    unseenCount: 0,
  });

  const mergeBaseUsers = () => {
    usersMap = new Map();

    const allUsers = new Map([...usersSnapCache, ...managersSnapCache]);

    allUsers.forEach((user, key) => {
      if (user.status !== "active") return;
      usersMap.set(key, buildUserObject(user));
    });
  };

  const unsubUsers = onSnapshot(collection(db, "Users"), (snap) => {
    usersSnapCache = new Map();

    snap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      usersSnapCache.set(data.userId, data);
    });

    mergeBaseUsers();
  });

  const unsubManagers = onSnapshot(collection(db, "Managers"), (snap) => {
    managersSnapCache = new Map();

    snap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      managersSnapCache.set(data.userId, data);
    });

    mergeBaseUsers();
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

      const isCheckInUnseen =
        data.checkIn && !seenBy?.checkIn?.includes(adminId);

      const isCheckOutUnseen =
        data.checkOut && !seenBy?.checkOut?.includes(adminId);

      if (isCheckInUnseen) user.unseenCount++;
      if (isCheckOutUnseen) user.unseenCount++;

      user.attendance.push({
        ...data,
        id: docSnap.id,
      });
    });

    const result = Array.from(updatedMap.values()).sort((a, b) => {
      if (b.unseenCount !== a.unseenCount) {
        return b.unseenCount - a.unseenCount;
      }
      return (a.fullName || "").localeCompare(b.fullName || "");
    });

    callback(result);
  });

  return () => {
    unsubUsers();
    unsubManagers();
    unsubAttendance();
  };
};

export const listenSelectedUserMonthly = (userId, date, adminId, callback) => {
  if (!userId || !date) return;

  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const q = query(
    collection(db, "Attendance"),
    where("userId", "==", userId),
    where("date", ">=", start.toISOString().split("T")[0]),
    where("date", "<=", end.toISOString().split("T")[0]),
  );

  return onSnapshot(q, (snapshot) => {
    const map = {};

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();

      map[data.date] = {
        ...data,
        id: docSnap.id,
      };

      if (data.checkIn && !data.seenBy?.checkIn?.includes(adminId)) {
        updateDoc(doc(db, "Attendance", docSnap.id), {
          "seenBy.checkIn": arrayUnion(adminId),
        });
      }

      if (data.checkOut && !data.seenBy?.checkOut?.includes(adminId)) {
        updateDoc(doc(db, "Attendance", docSnap.id), {
          "seenBy.checkOut": arrayUnion(adminId),
        });
      }
    });

    callback(map);
  });
};

export const markAttendanceSeen = async (attendanceId, adminId, type) => {
  const ref = doc(db, "Attendance", attendanceId);

  await updateDoc(ref, {
    [`seenBy.${type}`]: arrayUnion(adminId),
  });
};