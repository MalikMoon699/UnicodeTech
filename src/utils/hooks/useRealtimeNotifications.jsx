import { useEffect, useRef } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../FirebaseConfig";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { SOUNDS } from "../constants";

export const useRealtimeNotifications = (currentUser) => {
  const navigate = useNavigate();
  const audioRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;

    audioRef.current = new Audio(SOUNDS.NotificationSound);
    audioRef.current.volume = 0.8;

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

          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {
            });
          }

          const { title, body, link } = data;

          toast.custom(
            () => (
              <div
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  background: "var(--card)",
                  color: "var(--card-foreground)",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  minWidth: "320px",
                  maxWidth: "98vw",
                  boxShadow: "0px 0px 8px var(--shadow)",
                }}
                onClick={() => {
                  toast.dismiss();
                  if (link) navigate(link);
                }}
              >
                <div style={{ fontWeight: "600" }}>{title}</div>
                <div style={{ fontSize: "14px", opacity: 0.8 }}>{body}</div>
              </div>
            ),
            {
              duration: 6000,
              position: "top-right",
            },
          );

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