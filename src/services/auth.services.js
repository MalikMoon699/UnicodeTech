import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../utils/FirebaseConfig";
import { generateCustomId, generateSearchTokens } from "../utils/helper";

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
      userId,
      fullName: name,
      searchText: [
        ...generateSearchTokens(name),
        ...generateSearchTokens(email),
      ],
      email,
      role: "user",
      profileImage: "",
      status: "active",
      createdAt: serverTimestamp(),
      isOnline: true,
      lastSeen: serverTimestamp(),
      lastActive: serverTimestamp(),
    };

    await setDoc(doc(db, "Users", userId), userData);

    await setDoc(doc(db, "UserIndex", authUser.uid), {
      role: "user",
      collection: "Users",
      docId: userId,
    });

    console.log("res---> by helper");
    return {
      ...userData,
      docId: userId,
      roleCollection: "Users",
    };
  } catch (err) {
    throw err;
  }
};

export const signInHelper = async ({ email, password }) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return true;
  } catch (err) {
    throw err;
  }
};
