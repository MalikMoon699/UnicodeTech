import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  getDoc,
  where,
} from "firebase/firestore";
import { db } from "../utils/FirebaseConfig";
import { generateCustomId } from "../utils/helper";

export const createChat = async (
  members,
  membersWithAuth,
  type = "private",
  name = "",
) => {
  const customId = await generateCustomId("chats");
  const chatRef = doc(db, "chats", customId);

  await setDoc(chatRef, {
    type,
    members,
    name,
    createdAt: serverTimestamp(),
    lastMessage: null,
  });

  for (const authId of membersWithAuth) {
    const userChatRef = doc(db, "UserIndex", authId, "chats", customId);

    await setDoc(userChatRef, {
      chatId: customId,
      lastSeen: null,
      members,
      unreadCount: 0,
    });
  }

  return customId;
};

export const sendMessage = async (chatId, message, senderId) => {
  const customMsgId = await generateCustomId("messages");

  const msgRef = doc(db, "chats", chatId, "messages", customMsgId);

  const msg = {
    id: customMsgId,
    text: message,
    senderId,
    createdAt: serverTimestamp(),
    type: "text",
    isEdit: false,
  };

  await setDoc(msgRef, msg);

  await updateDoc(doc(db, "chats", chatId), {
    lastMessage: {
      text: message,
      senderId,
      createdAt: serverTimestamp(),
    },
  });

  return customMsgId;
};

export const listenMessages = (chatId, callback) => {
  if (!chatId) return () => {};

  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc"),
  );

  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })),
    );
  });
};

export const listenUserChats = (authId, callback) => {
  if (!authId) return () => {};

  const ref = collection(db, "UserIndex", authId, "chats");

  return onSnapshot(ref, async (snap) => {
    const chats = await Promise.all(
      snap.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const chatRef = await getDoc(doc(db, "chats", data.chatId));

        return {
          id: docSnap.id,
          ...data,
          ...chatRef.data(),
        };
      }),
    );

    callback(chats);
  });
};

export const listenActiveUsers = (callback) => {
  const q = query(collection(db, "UserIndex"), where("status", "==", "active"));

  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })),
    );
  });
};

export const markAsSeen = async (authId, chatId) => {
  if (!authId || !chatId) return;

  await updateDoc(doc(db, "UserIndex", authId, "chats", chatId), {
    lastSeen: serverTimestamp(),
    unreadCount: 0,
  });
};

export const deleteMessage = async (chatId, messageId) => {
  await deleteDoc(doc(db, "chats", chatId, "messages", messageId));
};

export const editMessage = async (chatId, messageId, newText) => {
  const msgRef = doc(db, "chats", chatId, "messages", messageId);

  await updateDoc(msgRef, {
    text: newText,
    isEdit: false,
    updatedAt: serverTimestamp(),
  });
};
