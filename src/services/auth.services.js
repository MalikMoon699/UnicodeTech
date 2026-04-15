import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../utils/FirebaseConfig";
import { generateCustomId } from "../utils/helper";
import { toast } from "sonner";

export const signUpHelper = async ({ name, email, password }) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    const authUser = userCredential.user;
    const userId = await generateCustomId("Users");
    const userData = {
      authId: authUser.uid,
      userId: userId,
      fullName: name,
      lowerCaseFullName: name.toLowerCase(),
      email: email,
      role: "user",
      profileImage: "",
      status: "active",
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, "Users", userId), userData);
  } catch (err) {
    throw err;
  }
};

export const signInHelper = async ({ email, password }) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password,
    );

    const authUser = userCredential.user;
    const collectionsToCheck = ["Users", "Managers", "Admins"];

    let foundUser = null;
    let foundCollection = null;
    let docId = null;

    for (const col of collectionsToCheck) {
      const q = query(collection(db, col), where("authId", "==", authUser.uid));

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];

        foundUser = docSnap.data();
        foundCollection = col;
        docId = docSnap.id;
        break;
      }
    }

    if (!foundUser) {
      await signOut(auth);
      toast.error("User record not found. Contact support.");
      return null;
    }

    if (foundUser.status !== "active") {
      await signOut(auth);
      toast.error(
        foundUser.status === "pending"
          ? "Your account is pending approval"
          : "Your account has been banned",
      );

      return null;
    }
    return foundUser;
  } catch (err) {
    throw err;
  }
};
