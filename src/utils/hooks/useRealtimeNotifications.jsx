import { useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../FirebaseConfig";
import { toast } from "sonner";

export const useRealtimeNotifications = (currentUser) => {
  useEffect(() => {
    if (!currentUser) return;

    const notificationsRef = collection(
      db,
      "UserIndex",
      currentUser.authId,
      "notifications",
    );

    const q = query(notificationsRef);

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          if (data.seen) return;

          const { title, body, link } = data;

          toast.custom(() => (
            <div
              style={{
                padding: "12px",
                borderRadius: "8px",
                background: "#1f2937",
                color: "white",
                cursor: "pointer",
                minWidth:"300px",
                maxWidth:"98vw"
              }}
              onClick={() => link && window.open(link, "_blank")}
            >
              <div style={{ fontWeight: "600" }}>{title}</div>
              <div style={{ fontSize: "14px", opacity: 0.8 }}>{body}</div>
            </div>
          ));

          const docRef = doc(
            db,
            "UserIndex",
            currentUser.authId,
            "notifications",
            change.doc.id,
          );

          await updateDoc(docRef, {
            seen: true,
          });
        }
      });
    });

    return () => unsubscribe();
  }, [currentUser]);
};
