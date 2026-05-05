import React, { useState } from "react";
import { collection, getDocs, doc, writeBatch } from "firebase/firestore";
import { db } from "../utils/FirebaseConfig";
import { handleGetToken, requestPermission } from "../utils/extensions/Notification.extensions";
import { Push_Notification_Api } from "../utils/constants";
import { sendNotification } from "dev-push-notification";
import { toast } from "sonner";

const TestingPage = () => {
  const [loading, setLoading] = useState("");
  const [token, setToken] = useState(null);

  const storeToken = async () => {
    setLoading("getToken");
    try {
      await Notification.requestPermission();
      const tokenRes = await handleGetToken();
      setToken(tokenRes);
      toast.success("Token stored");
    } catch (err) {
      console.error("Failed to get fcm:", err);
      toast.error("Failed to get fcm:", err);
    } finally {
      setLoading("");
    }
  };

  const handleSendPush = async () => {
    setLoading("sendPush");
    try {
      await sendNotification({
        apiKey: Push_Notification_Api,
        title: "Test",
        body: "testing push",
        icon: "https://unicodetech-two.vercel.app/SiteIcon.png",
        fcmTokens: [token],
      });
    } catch (err) {
      console.error("Failed to send push:", err);
      toast.error("Failed to send push:", err);
    } finally {
      setLoading("");
    }
  };

  const RemoveALLTokens = async () => {
    try {
      setLoading("removealltokens");
      const userIndexRef = collection(db, "UserIndex");
      const snap = await getDocs(userIndexRef);
      let batch = writeBatch(db);
      let count = 0;
      for (const userDoc of snap.docs) {
        const user = userDoc.data();

        const { collection: userCollection, docId } = user;

        if (!userCollection || !docId) continue;
        const userIndexDocRef = doc(db, "UserIndex", userDoc.id);
        batch.update(userIndexDocRef, {
          fcmTokens: [],
        });
        count++;
        const mainUserRef = doc(db, userCollection, docId);
        batch.update(mainUserRef, {
          fcmTokens: [],
        });
        count++;
        if (count >= 450) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      if (count > 0) {
        await batch.commit();
      }

      console.log("All FCM tokens removed successfully");
    } catch (err) {
      console.error("Failed to removeAllTokens:", err);
    } finally {
      setLoading("");
    }
  };

  return (
    <div>
      <button onClick={RemoveALLTokens}>
        {loading === "removealltokens"
          ? "All users tokens removing..."
          : "Remove token from all users"}
      </button>
      <button onClick={requestPermission}>requestPermission</button>
      <button disabled={loading} onClick={storeToken}>
        {loading === "getToken" ? "Getting..." : "Get token"}
      </button>
      <p>{token}</p>
      <button disabled={loading} onClick={handleSendPush}>
        {loading === "sendPush" ? "sending..." : "Send Push"}
      </button>
    </div>
  );
};

export default TestingPage;
