import { db } from "../utils/FirebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export const generateCustomId = async (collectionName) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  const docRef = doc(db, collectionName, result);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return generateCustomId(collectionName);
  }
  return result;
};

export const handleUploadImage = async (avatarFile) => {
  try {
    let avatarUrl = "";
    if (avatarFile) {
      const formData = new FormData();
      formData.append("image", avatarFile);
      const res = await fetch(
        "https://image-upload-backend-three.vercel.app/api/Images/addImage",
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to upload avatar");

      avatarUrl = data.url;
    }
    return avatarUrl;
  } catch (err) {
    console.error("Failed to Upload Image:", err);
  }
};

export const generateSearchTokens = (text) => {
  const clean = text.toLowerCase().replace(/\s+/g, "");
  const tokens = [];

  for (let i = 1; i <= clean.length; i++) {
    tokens.push(clean.slice(0, i));
  }

  return tokens;
};

export const parseDate = (date) => {
  if (!date) return null;
  if (date?.seconds) {
    return new Date(date.seconds * 1000);
  }
  return new Date(date);
};

export const formateDate = (date) => {
  if (!date) return "-";

  const d = parseDate(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

export const timeAgo = (dateString) => {
  if (!dateString) return "";

  const now = new Date();
  const past = parseDate(dateString);
  const diff = Math.floor((now - past) / 1000);

  if (diff < 60) return `${diff}s ago`;

  const minutes = Math.floor(diff / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
};

export const formateDateTime = (date) => {
  if (!date) return "";

  const d = parseDate(date);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours === 0 ? 12 : hours;

  const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  return `${year}-${month}-${day} ${formattedTime}`;
};