import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../utils/FirebaseConfig";
import { generateSearchTokens } from "../utils/helper";

export const UpdateProfileHelper = async ({
  currentUser,
  updatedName,
  email,
  updatedProfileImage,
}) => {
  try {
    const userRef = doc(db, currentUser.roleCollection, currentUser.docId);
    const indexRef = doc(db, "UserIndex", currentUser.authId);

    const updates = {};
    const indexUpdates = {};

    if (updatedName && updatedName !== currentUser.fullName) {
      updates.fullName = updatedName;

      const newSearchTokens = [
        ...generateSearchTokens(updatedName),
        ...generateSearchTokens(email),
      ];

      updates.searchText = newSearchTokens;

      indexUpdates.fullName = updatedName;
      indexUpdates.searchText = newSearchTokens;
    }

    if (
      updatedProfileImage &&
      updatedProfileImage !== currentUser.profileImage
    ) {
      updates.profileImage = updatedProfileImage;
      indexUpdates.profileImage = updatedProfileImage;
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = serverTimestamp();

      await updateDoc(userRef, updates);
      await updateDoc(indexRef, {
        ...indexUpdates,
        updatedAt: serverTimestamp(),
      });
    }

    return true;
  } catch (err) {
    console.error("UpdateProfileHelper Error:", err);
    throw err;
  }
};
