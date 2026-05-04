import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
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
  const q = query(collection(db, "Leaves"), where("userId", "==", userId));

  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

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