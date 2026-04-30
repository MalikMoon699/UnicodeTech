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
import { handleSendNotification } from "../utils/extensions/Notification.extensions";
import { plainTextContent } from "../components/Custom.RichTextArea";

export const createChat = async (
  members,
  membersWithAuth,
  type = "private",
  name = "",
  createdBy = "",
) => {
  const customId = await generateCustomId("chats");
  const chatRef = doc(db, "chats", customId);

  await setDoc(chatRef, {
    type,
    members,
    name,
    createdBy: type === "group" ? createdBy : null,
    createdAt: serverTimestamp(),
    lastMessage: null,
    membersWithAuth,
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

export const getAuthIdByUserId = async (userId) => {
  try {
    const q = query(collection(db, "UserIndex"), where("docId", "==", userId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return snapshot.docs[0].id;
  } catch (error) {
    console.error("Error fetching authId:", error);
    return null;
  }
};

export const UpdateGroup = async (
  chatId,
  { name, members, membersWithAuth },
) => {
  try {
    const chatRef = doc(db, "chats", chatId);

    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) throw new Error("Chat not found");
    const prevMembers = chatSnap.data().membersWithAuth || [];

    const added = membersWithAuth.filter((m) => !prevMembers.includes(m));
    const removed = prevMembers.filter((m) => !membersWithAuth.includes(m));
    const batch = writeBatch(db);

    batch.update(chatRef, {
      name,
      members,
      membersWithAuth,
    });

    for (const authId of added) {
      if (added.includes(authId)) {
        const userChatRef = doc(db, "UserIndex", authId, "chats", chatId);
        batch.set(userChatRef, {
          chatId,
          members,
          lastSeen: null,
          unreadCount: 0,
        });
      }
    }

    for (const authId of removed) {
      const userChatRef = doc(db, "UserIndex", authId, "chats", chatId);
      batch.delete(userChatRef);
    }

    await batch.commit();
  } catch (err) {
    throw err;
  }
};

export const DeleteGroup = async (chatId) => {
  const messagesRef = collection(db, "chats", chatId, "messages");
  const snapshot = await getDocs(messagesRef);
  const batch = writeBatch(db);
  snapshot.forEach((docItem) => {
    batch.delete(docItem.ref);
  });
  await batch.commit();
  await deleteDoc(doc(db, "chats", chatId));
};

export const LeaveGroup = async (chatId, userId, userAuthId) => {
  const chatRef = doc(db, "chats", chatId);

  const chatSnap = await getDoc(chatRef);
  if (!chatSnap.exists()) return;

  const data = chatSnap.data();

  const members = data.members || [];
  const membersWithAuth = data.membersWithAuth || [];

  const updatedMembers = members.filter((m) => m !== userId);
  const updatedMembersWithAuth = membersWithAuth.filter(
    (m) => m !== userAuthId,
  );

  const batch = writeBatch(db);
  batch.update(chatRef, {
    members: updatedMembers,
    membersWithAuth: updatedMembersWithAuth,
  });

  const userChatRef = doc(db, "UserIndex", userAuthId, "chats", chatId);
  batch.delete(userChatRef);

  await batch.commit();
};

export const getGroupUsersDetails = async (memberIds) => {
  const users = [];

  for (const id of memberIds) {
    const userRef = doc(db, "UserIndex", id);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      users.push({ id, ...userSnap.data() });
    }
  }

  return users;
};

export const sendMessage = async (
  chatId,
  message,
  senderId,
  senderAuthId,
  activeChatMemberAuthIds,
  customMsgId,
) => {
  try {
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
    const recipientIds = activeChatMemberAuthIds.filter(
      (id) => id !== senderAuthId,
    );

    const PlainText = plainTextContent(message);
    handleSendNotification({
      title: "Chat",
      body: PlainText,
      link: `/chats?chatId=${chatId}`,
      userIds: recipientIds,
      isByAuth: true,
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

  return onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
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
  });
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

  const userChatsRef = collection(db, "UserIndex", authId, "chats");

  let chatUnsubs = [];

  const unsubscribe = onSnapshot(userChatsRef, (snap) => {
    chatUnsubs.forEach((u) => u());
    chatUnsubs = [];

    const chatsMap = new Map();

    if (snap.empty) {
      callback([]);
      return;
    }

    snap.docs.forEach((userChatDoc) => {
      const userChatData = userChatDoc.data();
      const chatId = userChatData.chatId;

      const unsub = onSnapshot(doc(db, "chats", chatId), (chatSnap) => {
        if (!chatSnap.exists()) {
          chatsMap.delete(chatId);
        } else {
          chatsMap.set(chatId, {
            id: userChatDoc.id,
            ...userChatData,
            ...chatSnap.data(),
          });
        }

        callback(Array.from(chatsMap.values()));
      });

      chatUnsubs.push(unsub);
    });
  });

  return () => {
    unsubscribe();
    chatUnsubs.forEach((u) => u());
  };
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
