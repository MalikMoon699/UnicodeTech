import { useEffect } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../FirebaseConfig";

export const usePresence = (currentUser) => {
  useEffect(() => {
    if (!currentUser) return;

    const userRef = doc(db, currentUser.roleCollection, currentUser.docId);

    const goOnline = async () => {
      await updateDoc(userRef, {
        isOnline: true,
        lastActive: serverTimestamp(),
      });
    };

    const goOffline = async () => {
      await updateDoc(userRef, {
        isOnline: false,
        lastSeen: serverTimestamp(),
      });
    };

    goOnline();

    window.addEventListener("beforeunload", goOffline);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        goOffline();
      } else {
        goOnline();
      }
    });

    return () => {
      goOffline();
      window.removeEventListener("beforeunload", goOffline);
    };
  }, [currentUser]);
};
