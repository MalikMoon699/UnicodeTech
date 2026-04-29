import {
  collection,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
  getDocs,
  startAfter,
  serverTimestamp,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { db } from "../../utils/FirebaseConfig";
import { generateCustomId } from "../../utils/helper";

export const CreateReport = async ({ content, user }) => {
  const customId = await generateCustomId("Reports");

  const userRef = doc(db, "Reports", user?.userId);
  await setDoc(
    userRef,
    {
      lastReport: {
        id: customId,
        content,
        createdAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  const reportRef = doc(
    collection(db, "Reports", user?.userId, "reports"),
    customId,
  );

  await setDoc(reportRef, {
    id: customId,
    content,
    userId: user?.userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return customId;
};

export const EditReport = async ({ userId, id, content }) => {
  const ref = doc(db, "Reports", userId, "reports", id);

  return await updateDoc(ref, {
    content,
    updatedAt: serverTimestamp(),
  });
};

export const DeleteReport = async ({ userId, id }) => {
  const ref = doc(db, "Reports", userId, "reports", id);
  return await deleteDoc(ref);
};

export const getReportsHelper = async ({
  userId,
  limit: pageLimit = 10,
  lastDoc = null,
}) => {
  try {
    const baseRef = collection(db, "Reports", userId, "reports");

    let q = query(baseRef, orderBy("createdAt", "desc"), limit(pageLimit));

    if (lastDoc) {
      q = query(
        baseRef,
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(pageLimit),
      );
    }

    const snap = await getDocs(q);

    const users = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    const lastVisible = snap.docs[snap.docs.length - 1] || null;

    return {
      users,
      meta: {
        lastDoc: lastVisible,
      },
    };
  } catch (err) {
    console.error("getReportsHelper error:", err);
    return { users: [], meta: { lastDoc: null } };
  }
};

export const subscribeReports = (
  userId,
  callback,
  pageLimit = 10,
) => {
  const q = query(
    collection(db, "Reports", userId, "reports"),
    orderBy("createdAt", "desc"),
    limit(pageLimit),
  );

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    callback(data);
  });
};
