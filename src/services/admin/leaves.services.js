import { db } from "../../utils/FirebaseConfig";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

const getUsersMapByIds = async (userIds = []) => {
  if (!userIds.length) return {};

  const q = query(
    collection(db, "UserIndex"),
    where("docId", "in", userIds.slice(0, 10)),
  );

  const snapshot = await getDocs(q);

  const map = {};
  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    map[data.docId] = data;
  });

  return map;
};

export const listenAdminRequestsFirstPage = ({
  currentUserId,
  pageLimit = 10,
  status = "",
  callback,
}) => {
  try {
    const constraints = [
      where("createdBy", "!=", currentUserId),
      orderBy("createdAt", "desc"),
      limit(pageLimit + 1),
    ];

    if (status) {
      constraints.splice(2, 0, where("status", "==", status));
    }

    const q = query(collection(db, "leaveRequests"), ...constraints);

    return onSnapshot(q, async (snapshot) => {
      const docs = snapshot.docs;

      const hasMore = docs.length > pageLimit;
      const sliced = hasMore ? docs.slice(0, pageLimit) : docs;

      const rawData = sliced.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const userIds = [
        ...new Set(rawData.map((item) => item.createdBy).filter(Boolean)),
      ];

      const usersMap = await getUsersMapByIds(userIds);

      const data = rawData.map((item) => ({
        ...item,
        user: usersMap[item.createdBy] || null,
      }));

      const lastDoc = sliced[sliced.length - 1] || null;

      callback({
        data,
        lastDoc,
        hasMore,
      });
    });
  } catch (error) {
    console.error("Admin first page error:", error);
    throw error;
  }
};

export const loadMoreAdminRequests = async ({
  currentUserId,
  pageLimit = 10,
  lastDoc,
  status = "",
}) => {
  const constraints = [
    where("createdBy", "!=", currentUserId),
    orderBy("createdAt", "desc"),
    startAfter(lastDoc),
    limit(pageLimit + 1),
  ];

  if (status) {
    constraints.splice(2, 0, where("status", "==", status));
  }

  const q = query(collection(db, "leaveRequests"), ...constraints);

  const snapshot = await getDocs(q);

  const docs = snapshot.docs;

  const hasMore = docs.length > pageLimit;
  const sliced = hasMore ? docs.slice(0, pageLimit) : docs;

  const rawData = sliced.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const userIds = [
    ...new Set(rawData.map((item) => item.createdBy).filter(Boolean)),
  ];

  const usersMap = await getUsersMapByIds(userIds);

  const data = rawData.map((item) => ({
    ...item,
    user: usersMap[item.createdBy] || null,
  }));

  const newLastDoc = sliced[sliced.length - 1] || null;

  return {
    data,
    lastDoc: newLastDoc,
    hasMore,
  };
};

export const getAdminLeaveStats = ({ currentUserId, callback }) => {
  try {
    const q = query(
      collection(db, "leaveRequests"),
      where("createdBy", "!=", currentUserId),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalRequests = 0;
      let approved = 0;
      let pending = 0;
      let rejected = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();

        if (!data?.dates) return;

        data.dates.forEach((d) => {
          totalRequests++;

          if (d.status === "approved") approved++;
          else if (d.status === "pending") pending++;
          else if (d.status === "rejected") rejected++;
        });
      });

      callback({
        totalRequests,
        approved,
        pending,
        rejected,
      });
    });

    return unsubscribe;
  } catch (error) {
    console.error("Admin stats error:", error);
    throw error;
  }
};

export const updateLeaveStatus = async ({ leaveId, reviewerId, dates }) => {
  if (!leaveId || !dates?.length) return;
  try {
    const leaveRef = doc(db, "leaveRequests", leaveId);
    const leaveSnap = await getDoc(leaveRef);

    if (!leaveSnap.exists()) {
      throw new Error("Leave not found");
    }

    const leaveData = leaveSnap.data();
    const existingDates = leaveData?.dates || [];

    const updatedDates = existingDates.map((d) => {
      const updated = dates.find((u) => u.date === d.date);
      return updated ? { ...d, status: updated.status } : d;
    });

    const allReviewed = updatedDates.every(
      (d) => d.status === "approved" || d.status === "rejected",
    );

    await updateDoc(leaveRef, {
      dates: updatedDates,
      reviewedBy: reviewerId,
      updatedAt: serverTimestamp(),
      isFullyReviewed: allReviewed,
    });
  } catch (error) {
    console.error("Error updating leave:", error);
    throw error;
  }
};

export const getUserByIdFromUserIndex = async (userId) => {
  if (!userId) return null;
  try {
    const q = query(collection(db, "UserIndex"), where("docId", "==", userId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0].data();
      return docData;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching user by userId:", error);
    throw error;
  }
};