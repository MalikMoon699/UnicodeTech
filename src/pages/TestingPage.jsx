import React, { useState } from "react";
import { collection, getDocs, doc, writeBatch } from "firebase/firestore";
import { db } from "../utils/FirebaseConfig";

const TestingPage = () => {
  const [loading, setLoading] = useState("");

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
    </div>
  );
};

export default TestingPage;
