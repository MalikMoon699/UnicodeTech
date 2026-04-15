import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { auth, db } from "../utils/FirebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

const AuthCtx = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentUser, setCurrentUser] = useState(null);
  const [authAllow, setAuthAllow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDetail, setIsDetail] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);

      try {
        if (!user) {
          setCurrentUser(null);
          setAuthAllow(false);
          setIsDetail(false);
          return;
        }

        const collectionsToCheck = ["Users", "Managers", "Admins"];

        let foundUser = null;
        let docId = null;
        let roleCollection = null;

        for (const col of collectionsToCheck) {
          const q = query(collection(db, col), where("authId", "==", user.uid));

          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0];

            foundUser = docSnap.data();
            docId = docSnap.id;
            roleCollection = col;

            break;
          }
        }

        if (!foundUser) {
          setCurrentUser(null);
          setAuthAllow(false);
          return;
        }

        if (foundUser.status !== "active") {
          await signOut(auth);

          toast.error(
            foundUser.status === "pending"
              ? "Your account is pending approval"
              : "Your account has been banned",
          );

          setCurrentUser(null);
          setAuthAllow(false);
          return;
        }

        const finalUser = {
          ...foundUser,
          docId,
          roleCollection,
        };

        setCurrentUser(finalUser);
        setAuthAllow(true);
      } catch (err) {
        console.error("Auth error:", err);

        setCurrentUser(null);
        setAuthAllow(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const refresh = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const collectionsToCheck = ["Users", "Managers", "Admins"];

    for (const col of collectionsToCheck) {
      const q = query(collection(db, col), where("authId", "==", user.uid));

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];

        setCurrentUser({
          ...docSnap.data(),
          docId: docSnap.id,
          roleCollection: col,
        });

        return;
      }
    }
  };

  const logout = async (redirect = true) => {
    await signOut(auth);
    setCurrentUser(null);
    setAuthAllow(false);
    setIsDetail(false);

    if (redirect) navigate("/auth");
  };

  return (
    <AuthCtx.Provider
      value={{
        currentUser,
        setCurrentUser,
        authAllow,
        loading,
        refresh,
        isDetail,
        setIsDetail,
        logout,
        isOnline,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => useContext(AuthCtx);
