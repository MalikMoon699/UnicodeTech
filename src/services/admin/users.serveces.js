import { db } from "../../utils/FirebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit as fbLimit,
  startAfter,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

export const getUsersHelper = async ({
  limit: pageLimit = 10,
  search = "",
  status = "",
  collection: colName = "Users",
  lastDoc = null,
}) => {
  try {
    const baseRef = collection(db, colName);
    const searchValue = search.toLowerCase().replace(/\s+/g, "");

    let constraints = [];

    if (status) {
      constraints.push(where("status", "==", status));
    }

    if (searchValue) {
      constraints.push(where("searchText", "array-contains", searchValue));
      constraints.push(orderBy("createdAt", "desc"));
    } else {
      constraints.push(orderBy("createdAt", "desc"));
    }
    
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    constraints.push(fbLimit(pageLimit));

    const q = query(baseRef, ...constraints);
    const snap = await getDocs(q);

    const users = snap.docs.map((doc) => ({
      _id: doc.id,
      ...doc.data(),
    }));

    const lastVisible =
      snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;

    return {
      users,
      meta: {
        lastDoc: lastVisible,
        hasMore: snap.docs.length === pageLimit,
      },
    };
  } catch (err) {
    console.error("getUsersHelper error:", err);
    throw err;
  }
};

export const updateUserStatus = async ({ user, status }) => {
  try {
    const collection = user?.role === "user" ? "Users" : "Managers";
    const ref = doc(db, collection, user?.userId);

    await updateDoc(ref, {
      status,
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (err) {
    console.error("updateUserStatus error:", err);
    throw err;
  }
};

export const updateUserRole = async ({ authId, newRole }) => {
  try {
    const roleMap = {
      user: "Users",
      manager: "Managers",
    };

    if (!roleMap[newRole]) {
      throw new Error("Invalid role");
    }

    const indexRef = doc(db, "UserIndex", authId);
    const indexSnap = await getDoc(indexRef);

    if (!indexSnap.exists()) {
      throw new Error("UserIndex record not found");
    }

    const indexData = indexSnap.data();
    if (indexData.role === "admin") {
      throw new Error("Admin role cannot be modified");
    }

    const currentRole = indexData.role;
    const currentCollection = indexData.collection;
    const currentDocId = indexData.docId;
    if (currentRole === newRole) {
      throw new Error(`User already has role ${newRole}`);
    }

    const oldRef = doc(db, currentCollection, currentDocId);
    const oldSnap = await getDoc(oldRef);

    if (!oldSnap.exists()) {
      throw new Error("User document not found");
    }

    const userData = oldSnap.data();
    const newCollection = roleMap[newRole];
    const newDocRef = doc(db, newCollection, currentDocId);
    await setDoc(newDocRef, {
      ...userData,
      role: newRole,
      updatedAt: serverTimestamp(),
    });
    await deleteDoc(oldRef);
    await setDoc(indexRef, {
      role: newRole,
      collection: newCollection,
      docId: currentDocId,
    });
    return true;
  } catch (err) {
    console.error("updateUserRole error:", err);
    throw err;
  }
};