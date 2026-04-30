import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../utils/FirebaseConfig";
import {
  generateCustomId,
  generatePlaceId,
  generateSearchTokens,
} from "../utils/helper";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  addFcmToken,
  handleGetToken,
} from "../utils/extensions/Notification.extensions";

const AuthCtx = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentUser, setCurrentUser] = useState(null);
  const [authAllow, setAuthAllow] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const skipSyncRef = useRef(false);

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
      try {
        if (skipSyncRef.current) {
          skipSyncRef.current = false;
          setAuthLoading(false);
          return;
        }

        if (!user) {
          setCurrentUser(null);
          setAuthAllow(false);
          setAuthLoading(false);
          return;
        }

        const indexRef = doc(db, "UserIndex", user.uid);
        const indexSnap = await getDoc(indexRef);

        if (!indexSnap.exists()) {
          setCurrentUser(null);
          setAuthAllow(false);
          setAuthLoading(false);
          return;
        }

        const { collection: col, docId } = indexSnap.data();

        const userSnap = await getDoc(doc(db, col, docId));

        if (!userSnap.exists()) {
          setCurrentUser(null);
          setAuthAllow(false);
          setAuthLoading(false);
          return;
        }

        const data = userSnap.data();

        if (data.status !== "active") {
          await signOut(auth);
          toast.error(
            data.status === "pending"
              ? "Account pending approval"
              : "Account banned",
          );

          setCurrentUser(null);
          setAuthAllow(false);
          setAuthLoading(false);
          return;
        }

        setCurrentUser({
          ...data,
          docId,
          roleCollection: col,
        });

        setAuthAllow(true);
      } catch (err) {
        console.error("Auth error:", err);
        setCurrentUser(null);
        setAuthAllow(false);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      reCheckToken();
    }
  }, [currentUser]);

  const reCheckToken = async () => {
    const indexRef = doc(db, "UserIndex", currentUser?.authId);
    const userRef = doc(db, currentUser?.roleCollection, currentUser?.docId);
    const token = await handleGetToken();
    if (token) {
      await Promise.all([
        addFcmToken(userRef, token),
        addFcmToken(indexRef, token),
      ]);
    }
  };

  useEffect(() => {
    if (!currentUser?.roleCollection || !currentUser?.docId) return;

    const userRef = doc(db, currentUser.roleCollection, currentUser.docId);

    const unsubscribe = onSnapshot(userRef, async (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();

      if (data.status !== "active") {
        await signOut(auth);
        setCurrentUser(null);
        setAuthAllow(false);
        if (data.status === "banned") {
          toast.error("You are banned");
        } else if (data.status === "pending") {
          toast.info("Account pending approval.");
        }

        navigate("/auth", { replace: true });
      }
    });

    return () => unsubscribe();
  }, [currentUser?.docId, currentUser?.roleCollection]);

  const signUp = async ({ name, email, password }) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);

    const authUser = res.user;
    const userId = await generateCustomId("Users");
    const PlaceId = generatePlaceId();

    const userData = {
      authId: authUser.uid,
      userId,
      fullName: name,
      searchText: [
        ...generateSearchTokens(name),
        ...generateSearchTokens(email),
      ],
      email,
      role: "user",
      profileImage: "",
      placeId: PlaceId,
      status: "pending",
      createdAt: serverTimestamp(),
      isOnline: true,
      lastSeen: serverTimestamp(),
      lastActive: serverTimestamp(),
    };

    await setDoc(doc(db, "Users", userId), userData);

    await setDoc(doc(db, "UserIndex", authUser.uid), {
      role: "user",
      collection: "Users",
      fullName: name,
      email,
      profileImage: "",
      placeId: PlaceId,
      docId: userId,
      status: "pending",
      searchText: [
        ...generateSearchTokens(name),
        ...generateSearchTokens(email),
      ],
      createdAt: serverTimestamp(),
    });
    skipSyncRef.current = true;

    const finalUser = {
      ...userData,
      docId: userId,
      roleCollection: "Users",
    };

    setCurrentUser(finalUser);
    setAuthAllow(true);

    return finalUser;
  };

  const signIn = async ({ email, password }) => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    const user = res?.user;
    const indexRef = doc(db, "UserIndex", user.uid);
    const indexSnap = await getDoc(indexRef);
    if (!indexSnap.exists()) throw new Error("User not found");
    const { collection: col, docId } = indexSnap.data();
    const userRef = doc(db, col, docId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) throw new Error("User not found");
    const data = userSnap.data();
    if (data.status !== "active") {
      await signOut(auth);
      throw new Error("No show");
    }
    if ("serviceWorker" in navigator) {
      await navigator.serviceWorker.ready;
    }

    const token = await handleGetToken();
    if (token) {
      await Promise.all([
        addFcmToken(userRef, token),
        addFcmToken(indexRef, token),
      ]);
    }

    skipSyncRef.current = true;

    const finalUser = {
      ...data,
      docId,
      roleCollection: col,
      fcmToken: token,
    };

    setCurrentUser(finalUser);
    setAuthAllow(true);

    return finalUser;
  };

  const refresh = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const indexSnap = await getDoc(doc(db, "UserIndex", user.uid));
    if (!indexSnap.exists()) return;

    const { collection: col, docId } = indexSnap.data();

    const userSnap = await getDoc(doc(db, col, docId));

    if (userSnap.exists()) {
      setCurrentUser({
        ...userSnap.data(),
        docId,
        roleCollection: col,
      });
    }
  };

  const logout = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const indexRef = doc(db, "UserIndex", user.uid);
        const indexSnap = await getDoc(indexRef);

        const token = await handleGetToken();
        if (indexSnap.exists()) {
          const { collection: col, docId } = indexSnap.data();
          const userRef = doc(db, col, docId);
          const removeToken = async (ref) => {
            const snap = await getDoc(ref);
            const data = snap.data();
            const existing = data?.fcmTokens || [];
            const updated = existing.filter((t) => t !== token);
            await updateDoc(ref, {
              fcmTokens: updated,
              fcmUpdatedAt: new Date(),
            });
          };

          if (token) {
            await Promise.all([removeToken(indexRef), removeToken(userRef)]);
          }
        }
      }

      await signOut(auth);
      setCurrentUser(null);
      setAuthAllow(false);
      navigate("/auth");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <AuthCtx.Provider
      value={{
        currentUser,
        authAllow,
        authLoading,
        isOnline,
        signUp,
        signIn,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => useContext(AuthCtx);
