import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../utils/FirebaseConfig";

export const createLeave = async (payload) => {
  try {
    const ref = await addDoc(collection(db, "Leaves"), {
      ...payload,
      overallStatus: "pending",
      isAutoApproved: payload.type !== "user",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return ref.id;
  } catch (err) {
    console.error("createLeave error:", err);
  }
};

export const listenUserLeaves = (userId, callback) => {
  const q = collection(db, "Leaves");

  return onSnapshot(q, (snap) => {
    const data = [];

    snap.docs.forEach((docSnap) => {
      const d = docSnap.data();

      if (d.userId === userId) {
        data.push({ id: docSnap.id, ...d });
      }
    });

    data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);

    callback(data);
  });
};

export const updateLeaveStatus = async (leaveId, status, adminId) => {
  const ref = doc(db, "Leaves", leaveId);

  await updateDoc(ref, {
    overallStatus: status,
    reviewedBy: adminId,
    updatedAt: serverTimestamp(),
  });
};
