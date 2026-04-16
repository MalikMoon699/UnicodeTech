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
    const updates = {};
    if (updatedName && updatedName !== currentUser.fullName) {
      updates.fullName = updatedName;
      updates.searchText = [
        ...generateSearchTokens(updatedName),
        ...generateSearchTokens(email),
      ];
    }
    if (
      updatedProfileImage &&
      updatedProfileImage !== currentUser.profileImage
    ) {
      updates.profileImage = updatedProfileImage;
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = serverTimestamp();
      await updateDoc(userRef, updates);
    }

    return true;
  } catch (err) {
    console.error("UpdateProfileHelper Error:", err);
    throw err;
  }
};
