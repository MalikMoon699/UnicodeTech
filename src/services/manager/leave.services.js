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
  onSnapshot,
  getDocs,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { generateCustomId } from "../../utils/helper";
import { handleSendNotification } from "../../utils/extensions/Notification.extensions";

export const submitLeaveRequest = async ({ requestData, type = "user" }) => {
  try {
    let status = "pending";
    if (type === "boss") status = "approved";
    if (type === "weekend") status = "approved";

    const leaveDateKeys = requestData.duration.map((item) => {
      const date = new Date(item.date);
      date.setDate(date.getDate() + 1);
      return date.toISOString().split("T")[0];
    });

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
      leaveDateKeys,
      reason: requestData.reason || "",
      reviewedBy: null,
      isAutoApproved,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, "leaveRequests", customId), payload);

    if (type === "boss") {
      handleSendNotification({
        title: "New leave request",
        body: requestData.reason,
        link: `/leaves?leaveId=${customId}`,
        userIds: requestData.userIds,
      });
    } else {
      const adminSnap = await getDocs(collection(db, "Admins"));
      const adminIds = adminSnap.docs.map((doc) => doc.id);

      handleSendNotification({
        title: "New leave request",
        body: requestData.reason,
        link: `/leaves?leaveId=${customId}`,
        userIds: adminIds,
      });
    }
    return { success: true, id: customId };
  } catch (error) {
    console.error("Error submitting leave request:", error);
    throw error;
  }
};

export const updateLeave = async ({ leaveId, updates, type = "user" }) => {
  try {
    const leaveRef = doc(db, "leaveRequests", leaveId);
    const leaveSnap = await getDoc(leaveRef);

    if (!leaveSnap.exists()) {
      throw new Error("Leave request not found");
    }

    const leaveData = leaveSnap.data();

    if (type !== "boss") {
      const allPending = leaveData?.dates?.every(
        (item) => item.status === "pending",
      );

      if (!allPending) {
        throw new Error(
          "Leave already reviewed (partially or fully). You cannot update it.",
        );
      }
    }

    let updatedPayload = {
      updatedAt: serverTimestamp(),
    };

    if (updates.duration) {
      const leaveDateKeys = updates.duration.map((item) => {
        const date = new Date(item.date);
        date.setDate(date.getDate() + 1);
        return date.toISOString().split("T")[0];
      });

      const dates = updates.duration.map((item) => ({
        date: new Date(item.date).toISOString(),
        status: type === "boss" ? item.status || "approved" : "pending",
      }));

      updatedPayload.dates = dates;
      updatedPayload.leaveDateKeys = leaveDateKeys;
    }

    if (updates.reason !== undefined) {
      updatedPayload.reason = updates.reason;
    }

    await setDoc(leaveRef, updatedPayload, { merge: true });

    return { success: true };
  } catch (error) {
    console.error("Error updating leave:", error);
    throw error;
  }
};

export const deleteLeave = async ({ leaveId, type = "user" }) => {
  try {
    const leaveRef = doc(db, "leaveRequests", leaveId);
    const leaveSnap = await getDoc(leaveRef);

    if (!leaveSnap.exists()) {
      throw new Error("Leave request not found");
    }

    const leaveData = leaveSnap.data();

    if (type !== "boss") {
      const allPending = leaveData?.dates?.every(
        (item) => item.status === "pending",
      );

      if (!allPending) {
        throw new Error(
          "Leave already reviewed (partially or fully). You cannot delete it.",
        );
      }
    }

    await deleteDoc(leaveRef);

    return { success: true };
  } catch (error) {
    console.error("Error deleting leave:", error);
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

export const getLeaveById = async (id) => {
  try {
    const ref = doc(db, "leaveRequests", id);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    } else {
      throw new Error("Leave not found");
    }
  } catch (err) {
    console.error("getLeaveById error:", err);
    throw err;
  }
};
