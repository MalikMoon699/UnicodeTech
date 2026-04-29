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
  getDoc,
} from "firebase/firestore";
import { db } from "../../utils/FirebaseConfig";
import { generateCustomId } from "../../utils/helper";
import { handleSendNotification } from "../../utils/extensions/Notification.extensions";
import { plainTextContent } from "../../components/Custom.RichTextArea";

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
    seenBy: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const adminSnap = await getDocs(collection(db, "Admins"));
  const Admins = adminSnap.docs.map((doc) => doc.id);
  const PlainText = plainTextContent(content);
  handleSendNotification({
    title: "Day End Status",
    body: PlainText,
    link: "/day-end-status",
    userIds: Admins,
  });
  return customId;
};

export const EditReport = async ({ userId, id, content }) => {
  const ref = doc(db, "Reports", userId, "reports", id);

  await updateDoc(ref, {
    content,
    updatedAt: serverTimestamp(),
  });

  const userRef = doc(db, "Reports", userId);
  const userSnap = await getDoc(userRef);

  const lastReport = userSnap.data()?.lastReport;

  if (lastReport?.id === id) {
    await updateDoc(userRef, {
      "lastReport.content": content,
      "lastReport.updatedAt": serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
};

export const DeleteReport = async ({ userId, id }) => {
  const ref = doc(db, "Reports", userId, "reports", id);
  await deleteDoc(ref);

  const userRef = doc(db, "Reports", userId);
  const userSnap = await getDoc(userRef);

  const lastReport = userSnap.data()?.lastReport;

  if (lastReport?.id === id) {
    await updateDoc(userRef, {
      lastReport: null,
      updatedAt: serverTimestamp(),
    });
  }
};

export const subscribeReports = (userId, callback, pageLimit = 10) => {
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

export const subscribeLastReports = (userId, callback) => {
  const userRef = doc(db, "Reports", userId);

  return onSnapshot(userRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    const data = snapshot.data();

    callback(data?.lastReport || null);
  });
};
