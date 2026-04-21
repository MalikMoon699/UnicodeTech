import { db } from "../../utils/FirebaseConfig";
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,getDocs
} from "firebase/firestore";
import { generateCustomId } from "../../utils/helper";

export const submitLeaveRequest = async ({ requestData, type = "user" }) => {
  try {
    let status = "pending";
    if (type === "boss") status = "approved";
    if (type === "weekend") status = "approved";
    const dates = requestData.duration.map((item) => ({
      date: new Date(item.date).toISOString(),
      status,
    }));
    const isAutoApproved = type === "boss" || type === "weekend";
    const customId = await generateCustomId("leaveRequests");
    const payload = {
      id: customId,
      createdBy: type === "weekend" ? null : requestData.createdBy,
      users: type === "weekend" ? null : requestData.userIds,
      type,
      dates,
      reason: requestData.reason || "",
      reviewedBy: null,
      isAutoApproved,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, "leaveRequests", customId), payload);
    return { success: true, id: customId };
  } catch (error) {
    console.error("Error submitting leave request:", error);
    throw error;
  }
};

export const listenRequestsFirstPage = ({
  userId,
  pageLimit = 10,
  status = "",
  callback,
}) => {
  try {
    const constraints = [
      where("createdBy", "==", userId),
      orderBy("createdAt", "desc"),
      limit(pageLimit + 1),
    ];

    if (status) {
      constraints.splice(1, 0, where("status", "==", status));
    }

    const q = query(collection(db, "leaveRequests"), ...constraints);

    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs;

      const hasMore = docs.length > pageLimit;
      const data = hasMore ? docs.slice(0, pageLimit) : docs;

      const lastDoc = data[data.length - 1] || null;

      callback({
        data: data.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })),
        lastDoc,
        hasMore,
      });
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    throw error;
  }
};

export const loadMoreRequests = async ({
  userId,
  pageLimit = 10,
  lastDoc,
  status = "",
}) => {
  const constraints = [
    where("createdBy", "==", userId),
    orderBy("createdAt", "desc"),
    startAfter(lastDoc),
    limit(pageLimit + 1),
  ];

  if (status) {
    constraints.splice(1, 0, where("status", "==", status));
  }

  const q = query(collection(db, "leaveRequests"), ...constraints);

  const snapshot = await getDocs(q);

  const docs = snapshot.docs;

  const hasMore = docs.length > pageLimit;
  const data = hasMore ? docs.slice(0, pageLimit) : docs;

  const newLastDoc = data[data.length - 1] || null;

  return {
    data: data.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })),
    lastDoc: newLastDoc,
    hasMore,
  };
};

export const getLeaveStatsByUserId = ({ userId, callback }) => {
  try {
    const q = query(
      collection(db, "leaveRequests"),
      where("createdBy", "==", userId),
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
    console.error("Error fetching leave stats:", error);
    throw error;
  }
};