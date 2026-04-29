import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  orderBy,
  limit,
  startAfter,
  getDocs,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../../utils/FirebaseConfig";

export const listenReportsStates = (callback) => {
  let usersMap = new Map();

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );

  const usersQuery = query(
    collection(db, "UserIndex"),
    where("status", "==", "active"),
    where("role", "!=", "admin"),
  );

  const unsubUsers = onSnapshot(usersQuery, (userSnap) => {
    usersMap = new Map();

    userSnap.docs.forEach((docSnap) => {
      const data = docSnap.data();

      usersMap.set(data.docId, {
        userId: data.docId,
        reported: false,
      });
    });
  });

  const unsubReports = onSnapshot(collection(db, "Reports"), (reportSnap) => {
    let reported = 0;

    reportSnap.docs.forEach((docSnap) => {
      const userId = docSnap.id;
      const data = docSnap.data();

      const user = usersMap.get(userId);
      if (!user) return;

      const createdAt = data?.lastReport?.createdAt?.toDate?.();
      if (!createdAt) return;

      if (createdAt >= startOfDay && createdAt < endOfDay) {
        user.reported = true;
        reported++;
      }
    });

    const totalUsers = usersMap.size;
    const pending = totalUsers - reported;

    const submissionRate =
      totalUsers === 0 ? 0 : Math.round((reported / totalUsers) * 100);

    callback({
      totalUsers,
      reported,
      pending,
      submissionRate,
    });
  });

  return () => {
    unsubUsers();
    unsubReports();
  };
};

export const listenAllUsersWithReports = (adminId, callback) => {
  const usersRef = collection(db, "UserIndex");

  let unsubReports = [];

  const unsubUsers = onSnapshot(
    query(
      usersRef,
      where("role", "!=", "admin"),
      where("status", "==", "active"),
    ),
    (snap) => {
      unsubReports.forEach((u) => u());
      unsubReports = [];

      const results = [];

      snap.docs.forEach((docSnap) => {
        const user = docSnap.data();
        if (user.docId === adminId) return;
        const q = query(
          collection(db, "Reports", user.docId, "reports"),
          orderBy("createdAt", "desc"),
          limit(10),
        );

        const unsub = onSnapshot(q, (reportSnap) => {
          let unseenCount = 0;

          reportSnap.docs.forEach((r) => {
            const data = r.data();

            if (!data.seenBy?.includes(adminId)) {
              unseenCount++;
            }
          });

          const existingIndex = results.findIndex(
            (x) => x.userId === user.docId,
          );

          const userObj = {
            userId: user.docId,
            fullName: user.fullName || "N/A",
            email: user.email || "N/A",
            placeId: user.placeId || "N/A",
            profileImage: user.profileImage || "",
            unseenCount,
          };

          if (existingIndex > -1) {
            results[existingIndex] = userObj;
          } else {
            results.push(userObj);
          }

          callback([...results]);
        });

        unsubReports.push(unsub);
      });
    },
  );

  return () => {
    unsubUsers();
    unsubReports.forEach((u) => u());
  };
};

export const listenSelectedUserReports = (userId, callback, pageLimit = 10) => {
  const q = query(
    collection(db, "Reports", userId, "reports"),
    orderBy("createdAt", "desc"),
    limit(pageLimit),
  );

  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    callback({
      reports,
      lastDoc,
    });
  });
};

export const loadMoreReports = async (userId, lastDoc, pageLimit = 10) => {
  const q = query(
    collection(db, "Reports", userId, "reports"),
    orderBy("createdAt", "desc"),
    startAfter(lastDoc),
    limit(pageLimit),
  );

  const snap = await getDocs(q);

  return {
    reports: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    lastDoc: snap.docs[snap.docs.length - 1] || null,
  };
};

export const markReportSeen = async (userId, reportId, adminId) => {
  try {
    const ref = doc(db, "Reports", userId, "reports", reportId);

    await updateDoc(ref, {
      seenBy: arrayUnion(adminId),
    });
  } catch (err) {
    console.error("markReportSeen failed:", err);
  }
};
