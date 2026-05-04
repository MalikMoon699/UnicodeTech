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
  getDocs,
  collection,
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
  handleSendNotification,
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

        const data = indexSnap.data();

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
          authId: user.uid,
          ...data,
          userId: data?.docId,
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
    if (!currentUser?.authId) return;

    const syncToken = async () => {
      const indexRef = doc(db, "UserIndex", currentUser.authId);
      const token = await handleGetToken();

      if (token) {
        await addFcmToken(indexRef, token);
      }
    };

    syncToken();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.authId) return;

    const userRef = doc(db, "UserIndex", currentUser.authId);

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
        } else {
          toast.error("Account disabled.");
        }

        navigate("/auth", { replace: true });
      }
    });

    return () => unsubscribe();
  }, [currentUser?.authId]);

  const signUp = async ({ name, email, password }) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const authUser = res.user;

    const userId = await generateCustomId("Users");
    const placeId = generatePlaceId();

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
      placeId,
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
      placeId,
      docId: userId,
      status: "pending",
      searchText: userData.searchText,
      createdAt: serverTimestamp(),
    });

    const adminSnap = await getDocs(collection(db, "Admins"));
    const adminIds = adminSnap.docs.map((doc) => doc.id);

    handleSendNotification({
      title: "New User Signup",
      body: `${name} just created an account`,
      link: "/admin/users",
      userIds: adminIds,
    });
    skipSyncRef.current = true;

    setCurrentUser(null);
    setAuthAllow(false);

    return userData;
  };

  const signIn = async ({ email, password }) => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    const user = res.user;

    const indexRef = doc(db, "UserIndex", user.uid);
    const indexSnap = await getDoc(indexRef);

    if (!indexSnap.exists()) throw new Error("User not found");

    const userData = indexSnap.data();

    if (userData.status !== "active") {
      await signOut(auth);
      throw new Error("No show");
    }

    const token = await handleGetToken();
    if (token) {
      await addFcmToken(indexRef, token);
    }

    skipSyncRef.current = true;

    const finalUser = {
      authId: user.uid,
      ...userData,
      fcmToken: token,
      userId: userData?.docId,
    };

    setCurrentUser(finalUser);
    setAuthAllow(true);

    return finalUser;
  };

  const refresh = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const snap = await getDoc(doc(db, "UserIndex", user.uid));
    if (!snap.exists()) return;
    const userData = snap.data();

    setCurrentUser({
      authId: user.uid,
      ...userData,
      userId: userData?.docId,
    });
  };

  const logout = async () => {
    try {
      const user = auth.currentUser;

      if (user) {
        const ref = doc(db, "UserIndex", user.uid);
        const token = await handleGetToken();

        if (token) {
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();
            const updated = (data.fcmTokens || []).filter((t) => t !== token);

            await updateDoc(ref, {
              fcmTokens: updated,
              fcmUpdatedAt: new Date(),
            });
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
