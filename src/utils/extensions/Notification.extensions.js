import { getToken, sendNotification } from "dev-push-notification";
import { Push_Notification_Api } from "../constants";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
  serverTimestamp,
  setDoc,
  doc,
} from "firebase/firestore";
import { db } from "../FirebaseConfig";

export const handleGetToken = async () => {
  try {
    const tokenRes = await getToken(Push_Notification_Api);
    return tokenRes?.token || null;
  } catch (error) {
    console.error("Failed to get token:", error);
  }
};

export const addFcmToken = async (ref, token) => {
  const snap = await getDoc(ref);
  const data = snap.data();

  const existing = data?.fcmTokens || [];

  if (!existing.includes(token)) {
    await updateDoc(ref, {
      fcmTokens: [...existing, token],
      fcmUpdatedAt: new Date(),
    });
  }
};

export const handleSendNotification = async ({
  title = "",
  body = "",
  link = "",
  userIds = [],
  isByAuth = false,
}) => {
  try {
    if (!userIds || userIds.length === 0) return;

    const offlineTokens = [];

    const usersData = await Promise.all(
      userIds.map(async (userId) => {
        let data = null;
        let authId = null;

        if (isByAuth) {
          const ref = doc(db, "UserIndex", userId);
          const snap = await getDoc(ref);

          if (!snap.exists()) return null;

          data = snap.data();
          authId = snap.id;
        } else {
          const q = query(
            collection(db, "UserIndex"),
            where("docId", "==", userId),
          );

          const snap = await getDocs(q);
          if (snap.empty) return null;

          const docSnap = snap.docs[0];
          data = docSnap.data();
          authId = docSnap.id;
        }

        return {
          isOnline: data.isOnline,
          fcmTokens: data.fcmTokens,
          pushEnabled: data?.pushEnabled,
          userId,
          authId,
        };
      }),
    );

    usersData.forEach((user) => {
      if (!user) return;
      if (user.pushEnabled === false) return;

      if (user.isOnline) {
        showToast({ title, body, link, authId: user.authId });
      } else if (user.fcmTokens) {
        offlineTokens.push(...user.fcmTokens);
      }
    });

    if (offlineTokens.length > 0) {
      await sendNotification({
        apiKey: Push_Notification_Api,
        title,
        body,
        icon: "https://unicodetech-two.vercel.app/SiteIcon.png",
        link,
        fcmTokens: offlineTokens,
      });
    }
  } catch (err) {
    console.error("Failed to send notification:", err);
  }
};

const showToast = async ({ title, body, link, authId }) => {
  try {
    await setDoc(
      doc(db, "UserIndex", authId, "notifications", Date.now().toString()),
      {
        title,
        body,
        link,
        seen: false,
        type: "added",
        createdAt: serverTimestamp(),
      },
    );
  } catch (error) {
    console.error("Failed to add notification:", error);
  }
};

export const requestPermission = async () => {
  try {
    if (Notification.permission === "denied") {
      console.log("Notifications are blocked by user.");
      return {
        permission: "denied",
      };
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const tokenRes = await handleGetToken();
      return { tokenRes, permission };
    }
    return { permission };
  } catch (error) {
    console.error("Permission request failed:", error);
    return null;
  }
};
