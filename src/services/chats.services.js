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
  increment,
  getDocs,
  writeBatch,
  limit,
  startAfter,
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

export const sendMessage = async (
  chatId,
  message,
  senderId,
  senderAuthId,
  activeChatMemberAuthIds,
) => {
  try {
    const customMsgId = await generateCustomId("messages");

    const batch = writeBatch(db);

    const msgRef = doc(db, "chats", chatId, "messages", customMsgId);

    batch.set(msgRef, {
      id: customMsgId,
      text: message,
      senderId,
      createdAt: serverTimestamp(),
      type: "text",
      isEdit: false,
      seenBy: [senderId],
    });

    const chatRef = doc(db, "chats", chatId);

    batch.update(chatRef, {
      lastMessage: {
        text: message,
        senderId,
        createdAt: serverTimestamp(),
      },
    });

    activeChatMemberAuthIds.forEach((authId) => {
      const userChatRef = doc(db, "UserIndex", authId, "chats", chatId);

      if (authId === senderAuthId) {
        batch.update(userChatRef, {
          unreadCount: 0,
          lastSeen: serverTimestamp(),
        });
      } else {
        batch.update(userChatRef, {
          unreadCount: increment(1),
        });
      }
    });

    await batch.commit();

    return customMsgId;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const listenLatestMessages = (chatId, limitCount = 30, callback) => {
  if (!chatId) return () => {};
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "desc"),
    limit(limitCount),
  );

  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      const messages = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data(), _ref: doc }))
        .reverse();

      const firstDoc = snapshot.docs[0];
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];

      callback(messages, {
        hasMore: messages.length === limitCount,
        firstDoc: firstDoc || null,
        lastDoc: lastDoc || null,
        fromCache: snapshot.metadata.fromCache,
        docCount: snapshot.docs.length,
      });
    }
  );
};

export const loadOlderMessages = async (
  chatId,
  lastVisibleDoc,
  limitCount = 30,
) => {
  if (!chatId || !lastVisibleDoc)
    return { messages: [], lastDoc: null, hasMore: false };

  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "desc"),
    startAfter(lastVisibleDoc),
    limit(limitCount),
  );

  const snapshot = await getDocs(q);
  const messages = snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
      _ref: doc,
    }))
    .reverse();

  const newLastDoc = snapshot.docs[snapshot.docs.length - 1];

  return {
    messages,
    lastDoc: newLastDoc || null,
    hasMore: snapshot.docs.length === limitCount,
  };
};

export const listenMessageUpdate = (chatId, messageId, callback) => {
  if (!chatId || !messageId) return () => {};

  const msgRef = doc(db, "chats", chatId, "messages", messageId);
  return onSnapshot(msgRef, (doc) => {
    if (doc.exists()) {
      callback({
        id: doc.id,
        ...doc.data(),
      });
    } else {
      callback(null);
    }
  });
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

export const markAsSeen = async (authId, chatId, userId) => {
  try {
    if (!authId || !chatId || !userId) return;
    const userChatRef = doc(db, "UserIndex", authId, "chats", chatId);

    await updateDoc(userChatRef, {
      lastSeen: serverTimestamp(),
      unreadCount: 0,
    });

    const messagesRef = collection(db, "chats", chatId, "messages");
    const messagesSnap = await getDocs(messagesRef);
    const updates = messagesSnap.docs.map(async (messageDoc) => {
      const messageData = messageDoc.data();
      if (messageData.seenBy?.includes(userId)) return;
      await updateDoc(messageDoc.ref, {
        seenBy: [...(messageData.seenBy || []), userId],
      });
    });

    await Promise.all(updates);
  } catch (error) {
    console.error("markAsSeen error:", error.message);
    throw error;
  }
};

export const deleteMessage = async (chatId, messageId) => {
  await deleteDoc(doc(db, "chats", chatId, "messages", messageId));
};

export const editMessage = async (chatId, messageId, newText) => {
  const msgRef = doc(db, "chats", chatId, "messages", messageId);

  await updateDoc(msgRef, {
    text: newText,
    isEdit: true,
    updatedAt: serverTimestamp(),
  });
};