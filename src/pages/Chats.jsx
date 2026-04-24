import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import {
  listenLatestMessages,
  loadOlderMessages,
  listenUserChats,
  sendMessage,
  markAsSeen,
  createChat,
  listenActiveUsers,
  editMessage,
  deleteMessage,
  listenMessageUpdate,
} from "../services/chats.services";
import "../assets/style/Chats.css";
import {
  Search,
  Hash,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  TriangleAlert,
  CircleX,
  Check,
  CheckCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSearchParams } from "react-router-dom";
import {
  Input,
  ProfileImage,
  UserHoverPortable,
} from "../components/CustomComponents";
import { renderMessage, RichTextarea } from "../components/Custom.RichTextArea";
import { IMAGES } from "../utils/constants";
import { useDebounce } from "../utils/hooks/useDebounce";
import { toast } from "sonner";
import Loader from "../components/Loader";
import { formateTime } from "../utils/helper";

const MESSAGES_PAGE_SIZE = 30;

const Chats = () => {
  const { currentUser } = useAuth();
  const userId = currentUser?.userId;
  const authId = currentUser?.authId;
  const [chats, setChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [startChatLoading, setStartChatLoading] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [showDMs, setShowDMs] = useState(false);
  const [showStart, setShowStart] = useState(false);
  const [params, setParams] = useSearchParams();
  const [activeChatLoading, setActiveChatLoading] = useState(false);
  const activeChat = params.get("chatId");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const debounceSearch = useDebounce(search, 400);
  const [contextMenu, setContextMenu] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [oldestMessageRef, setOldestMessageRef] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const prevActiveChatRef = useRef(activeChat);
  const shouldScrollOnChatChange = useRef(false);
  const unsubscribeMessagesRef = useRef(null);
  const messageSubscriptionsRef = useRef(new Map());
  const isFirstSnapshot = useRef(true);

  const mergeMessages = useCallback(
    (existingMessages, newMessages, prepend = false) => {
      const map = new Map();
      existingMessages.forEach((msg) => map.set(msg.id, msg));
      newMessages.forEach((msg) => map.set(msg.id, msg));
      let merged = Array.from(map.values());
      merged.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      return merged;
    },
    [],
  );

  const updateSingleMessage = useCallback((updatedMsg) => {
    if (!updatedMsg) return;
    setMessages((prev) => {
      const exists = prev.some((m) => m.id === updatedMsg.id);
      if (!exists) return [...prev, updatedMsg];
      return prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m));
    });
  }, []);

  const removeMessage = useCallback((messageId) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && activeChat) {
        setParams({});
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [activeChat, setParams]);

  useEffect(() => {
    if (prevActiveChatRef.current !== activeChat) {
      shouldScrollOnChatChange.current = true;
      prevActiveChatRef.current = activeChat;
      setMessages([]);
      setHasMoreMessages(true);
      setOldestMessageRef(null);
      setIsInitialLoad(true);
      isFirstSnapshot.current = true;
    }
  }, [activeChat]);

  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const threshold = 80;
      const isAtBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
      setShowScrollBtn(!isAtBottom);
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (isNearBottom) {
      scrollToBottom("smooth");
    } else {
      setShowScrollBtn(true);
    }
  }, [messages]);

  useEffect(() => {
    if (!messages.length) return;
    const scrollToLatest = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToBottom("auto");
          shouldScrollOnChatChange.current = false;
        });
      });
    };
    if (shouldScrollOnChatChange.current || isInitialLoad) {
      scrollToLatest();
      setIsInitialLoad(false);
    }
  }, [messages, activeChat]);

  useEffect(() => {
    if (!activeChat || !authId) return;

    setActiveChatLoading(true);
    setMessages([]);
    setHasMoreMessages(true);
    setOldestMessageRef(null);
    isFirstSnapshot.current = true;

    if (unsubscribeMessagesRef.current) unsubscribeMessagesRef.current();
    messageSubscriptionsRef.current.forEach((unsub) => unsub());
    messageSubscriptionsRef.current.clear();

    const unsubscribe = listenLatestMessages(
      activeChat,
      MESSAGES_PAGE_SIZE,
      (newMessages, paginationInfo) => {
        if (isFirstSnapshot.current) {
          setMessages(newMessages);
          isFirstSnapshot.current = false;
        } else {
          setMessages((prev) => mergeMessages(prev, newMessages));
        }
        setHasMoreMessages(paginationInfo.hasMore);
        setOldestMessageRef(paginationInfo.firstDoc);
        setActiveChatLoading(false);

        if (newMessages.length > 0) {
          markAsSeen(authId, activeChat, userId);
        }

        newMessages.forEach((msg) => {
          if (!messageSubscriptionsRef.current.has(msg.id)) {
            const unsubMsg = listenMessageUpdate(
              activeChat,
              msg.id,
              (updatedMsg) => {
                if (updatedMsg) {
                  updateSingleMessage(updatedMsg);
                } else {
                  removeMessage(msg.id);
                }
              },
            );
            messageSubscriptionsRef.current.set(msg.id, unsubMsg);
          }
        });
      },
    );

    unsubscribeMessagesRef.current = unsubscribe;

    return () => {
      if (unsubscribeMessagesRef.current) unsubscribeMessagesRef.current();
      messageSubscriptionsRef.current.forEach((unsub) => unsub());
      messageSubscriptionsRef.current.clear();
    };
  }, [
    activeChat,
    authId,
    userId,
    mergeMessages,
    updateSingleMessage,
    removeMessage,
  ]);

  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMoreMessages || !oldestMessageRef || !activeChat)
      return;

    setIsLoadingMore(true);

    try {
      const {
        messages: olderMessages,
        lastDoc,
        hasMore,
      } = await loadOlderMessages(
        activeChat,
        oldestMessageRef,
        MESSAGES_PAGE_SIZE,
      );

      if (olderMessages.length > 0) {
        setMessages((prev) => {
          const combined = [...olderMessages, ...prev];
          const unique = Array.from(
            new Map(combined.map((msg) => [msg.id, msg])).values(),
          );
          unique.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          return unique;
        });
        setHasMoreMessages(hasMore);
        setOldestMessageRef(lastDoc);

        olderMessages.forEach((msg) => {
          if (!messageSubscriptionsRef.current.has(msg.id)) {
            const unsubMsg = listenMessageUpdate(
              activeChat,
              msg.id,
              (updatedMsg) => {
                if (updatedMsg) {
                  updateSingleMessage(updatedMsg);
                } else {
                  removeMessage(msg.id);
                }
              },
            );
            messageSubscriptionsRef.current.set(msg.id, unsubMsg);
          }
        });
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
      toast.error("Failed to load older messages");
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    activeChat,
    isLoadingMore,
    hasMoreMessages,
    oldestMessageRef,
    updateSingleMessage,
    removeMessage,
  ]);

  const handleChatScroll = useCallback(
    (e) => {
      const element = e.target;
      if (element.scrollTop <= 100 && !isLoadingMore && hasMoreMessages) {
        const previousScrollHeight = element.scrollHeight;
        const previousScrollTop = element.scrollTop;

        loadMoreMessages().then(() => {
          setTimeout(() => {
            const newScrollHeight = element.scrollHeight;
            const heightDiff = newScrollHeight - previousScrollHeight;
            element.scrollTop = previousScrollTop + heightDiff;
          }, 100);
        });
      }
    },
    [hasMoreMessages, isLoadingMore, loadMoreMessages],
  );

  useEffect(() => {
    if (!authId) return;
    setChatsLoading(true);
    return listenUserChats(authId, (data) => {
      setChats(data);
      setChatsLoading(false);
      setShowGroups(true);
      setShowDMs(true);
    });
  }, [authId]);

  useEffect(() => {
    setUsersLoading(true);
    const unsub = listenActiveUsers((data) => {
      setAllUsers(data);
      setUsersLoading(false);
      setShowStart(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const userMap = useMemo(() => {
    const map = {};
    allUsers.forEach((u) => (map[u.docId] = u));
    return map;
  }, [allUsers]);

  const { groupChats, directChats, usersWithoutChat } = useMemo(() => {
    const keyword = debounceSearch.toLowerCase();
    const filterFn = (...fields) =>
      !keyword ||
      fields.some((field) => field?.toLowerCase().includes(keyword));
    const group = chats.filter((c) => c.type === "group");
    const direct = chats.filter((c) => c.type === "private");
    const existing = direct.flatMap((c) =>
      (c.members || []).filter((id) => id !== userId),
    );
    const remaining = allUsers.filter(
      (u) => u.docId !== userId && !existing.includes(u.docId),
    );
    return {
      groupChats: group.filter((c) => filterFn(c.name)),
      directChats: direct.filter((c) => {
        const otherId = c.members?.find((id) => id !== userId);
        const otherUser = userMap[otherId];
        return filterFn(
          otherUser?.fullName,
          otherUser?.email,
          otherUser?.name,
          otherId,
        );
      }),
      usersWithoutChat: remaining.filter((u) =>
        filterFn(u.fullName, u.email, u.name, u.docId),
      ),
    };
  }, [chats, allUsers, debounceSearch, userId, userMap]);

  const activeChatData = useMemo(() => {
    if (!activeChat) return null;
    return chats.find((c) => (c.chatId || c.id) === activeChat);
  }, [activeChat, chats]);

  const activeChatUser = useMemo(() => {
    if (!activeChatData || activeChatData.type !== "private") return null;
    const otherId = activeChatData.members?.find((id) => id !== userId);
    return userMap[otherId];
  }, [activeChatData, userMap, userId]);

  const activeChatMemberAuthIds = useMemo(() => {
    if (!activeChatData?.members?.length || !allUsers?.length) return [];
    return activeChatData.members
      .map((memberDocId) => {
        const matchedUser = allUsers.find((user) => user.docId === memberDocId);
        return matchedUser?.id || null;
      })
      .filter(Boolean);
  }, [activeChatData, allUsers]);

  const allMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    );
  }, [messages]);

  const scrollToBottom = (behavior = "smooth") => {
    const el = chatContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    setShowScrollBtn(false);
  };

  const isEmpty = (html) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent.trim() === "";
  };

  const handleSend = async () => {
    if (isEmpty(text) || !activeChat) return;
    const tempText = text;
    setText("");
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMessage = {
      id: optimisticId,
      text: tempText,
      senderId: userId,
      createdAt: Date.now(),
      isOptimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const realId = await sendMessage(
        activeChat,
        tempText,
        userId,
        authId,
        activeChatMemberAuthIds,
      );
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== optimisticId);
        const newMsg = {
          ...optimisticMessage,
          id: realId,
          isOptimistic: false,
        };
        return [...filtered, newMsg];
      });
      const unsubMsg = listenMessageUpdate(activeChat, realId, (updatedMsg) => {
        if (updatedMsg) {
          setMessages((prev) =>
            prev.map((m) => (m.id === realId ? updatedMsg : m)),
          );
        } else {
          setMessages((prev) => prev.filter((m) => m.id !== realId));
        }
      });
      messageSubscriptionsRef.current.set(realId, unsubMsg);
    } catch (err) {
      toast.error("Message failed");
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? { ...m, isFailed: true } : m)),
      );
    }
  };

  const handleStartChat = async (targetUserId, targetauthId) => {
    setStartChatLoading(true);
    const existingChat = directChats.find((c) =>
      c.members?.includes(targetUserId),
    );
    if (existingChat) {
      setParams({ chatId: existingChat.chatId || existingChat.id });
      setStartChatLoading(false);
      return;
    }
    const id = await createChat([userId, targetUserId], [authId, targetauthId]);
    setParams({ chatId: id });
    setStartChatLoading(false);
  };

  const handleStartEdit = (msg) => {
    setEditingMessage(msg);
    setText(msg.text);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setText("");
  };

  const handleEdit = async () => {
    if (!editingMessage) return;
    try {
      await editMessage(activeChat, editingMessage.id, text);
      setEditingMessage(null);
      setText("");
    } catch (err) {
      console.log(err);
      toast.error("Failed to edit message");
    }
  };

  const formatDateLabel = (date) => {
    let msgDate = date?.toDate ? date.toDate() : new Date(date);
    const today = new Date();
    const isToday = msgDate.toDateString() === today.toDateString();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const isYesterday = msgDate.toDateString() === yesterday.toDateString();
    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";
    return msgDate.toLocaleDateString("en-GB");
  };


  const normalizeDate = (t) => {
    if (!t) return new Date();
    if (typeof t === "number") return new Date(t);
    if (t.toDate) return t.toDate();
    return new Date(t);
  };
  
  const groupedMessages = useMemo(() => {
    return allMessages.reduce((groups, msg) => {
      const label = formatDateLabel(normalizeDate(msg.createdAt));
      if (!groups[label]) groups[label] = [];
      groups[label].push(msg);
      return groups;
    }, {});
  }, [allMessages]);

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="chat-search">
          <Search size={16} />
          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="chat-section">
          <div
            className="chat-section-header"
            onClick={() => setShowGroups(!showGroups)}
          >
            {currentUser?.role === "admin" ? (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "2px",
                  }}
                >
                  {showGroups ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                  <span>CHANNELS</span>
                </div>
                <span
                  className="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCreating(true);
                  }}
                >
                  <Plus size={16} />
                </span>
              </>
            ) : (
              <>
                <span>CHANNELS</span>
                {showGroups ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </>
            )}
          </div>

          {showGroups && (
            <div className="chat-list">
              {chatsLoading ? (
                <Loader size="30" style={{ height: "100px" }} />
              ) : groupChats?.length > 0 ? (
                groupChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`chat-item ${
                      activeChat === (chat.chatId || chat.id) ? "active" : ""
                    }`}
                    onClick={() =>
                      setParams({ chatId: chat.chatId || chat.id })
                    }
                    style={{ padding: "7px" }}
                  >
                    <Hash size={16} />
                    <span>{chat.name || "group"}</span>
                    {chat.unreadCount > 0 && (
                      <span className="unread-badge">{chat.unreadCount}</span>
                    )}
                  </div>
                ))
              ) : (
                <p className="empty-data">no channel found.</p>
              )}
            </div>
          )}
        </div>

        <div className="chat-section">
          <div
            className="chat-section-header"
            onClick={() => setShowDMs(!showDMs)}
          >
            <span>DIRECT MESSAGES</span>
            {showDMs ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>

          {showDMs && (
            <div className="chat-list">
              {chatsLoading ? (
                <Loader size="30" style={{ height: "100px" }} />
              ) : directChats?.length > 0 ? (
                directChats.map((chat) => {
                  const otherId = chat.members?.find((id) => id !== userId);
                  const otherUser = userMap[otherId];

                  return (
                    <div
                      key={chat.id}
                      className={`chat-item ${
                        activeChat === (chat.chatId || chat.id) ? "active" : ""
                      }`}
                      onClick={() =>
                        setParams({ chatId: chat.chatId || chat.id })
                      }
                    >
                      <ProfileImage
                        Image={otherUser?.ProfileImage || IMAGES.PlaceHolder}
                        className="chat-item-profile"
                        style={{ border: "none" }}
                      />
                      <span>{otherUser?.fullName || otherUser?.email}</span>
                      {chat.unreadCount > 0 && (
                        <span className="unread-badge">{chat.unreadCount}</span>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="empty-data">No chats found.</p>
              )}
            </div>
          )}
        </div>
        {(usersLoading || usersWithoutChat?.length > 0) && (
          <div className="chat-section">
            <div
              className="chat-section-header"
              onClick={() => setShowStart(!showStart)}
            >
              <span>START CHAT</span>
              {showStart ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </div>

            {showStart && (
              <div className="chat-list">
                {usersLoading ? (
                  <Loader size="30" style={{ height: "100px" }} />
                ) : usersWithoutChat?.length > 0 ? (
                  usersWithoutChat.map((user) => (
                    <div
                      key={user.id}
                      className="chat-item"
                      aria-disabled={startChatLoading || chatsLoading}
                      style={{
                        cursor:
                          startChatLoading || chatsLoading
                            ? "progress"
                            : "pointer",
                      }}
                      onClick={() => {
                        if (startChatLoading) {
                          return;
                        } else {
                          handleStartChat(user.docId, user.id);
                        }
                      }}
                    >
                      <ProfileImage
                        Image={user?.ProfileImage || IMAGES.PlaceHolder}
                        className="chat-item-profile"
                        style={{ border: "none" }}
                      />
                      <span>{user?.fullName || user?.email}</span>
                    </div>
                  ))
                ) : (
                  <p className="empty-data">No user found.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="chat-main">
        {!activeChat ? (
          <div className="chat-empty">
            <img src={IMAGES.SiteLogoRed} alt="logo" />
            <h2>UnicodeTech</h2>
            <p>Select a chat to start messaging</p>
          </div>
        ) : activeChatLoading ? (
          <Loader />
        ) : (
          <>
            <div className="chat-topbar">
              {activeChatData?.type === "group" ? (
                <>
                  <Hash size={18} />
                  <div>
                    <h4>{activeChatData?.name || "Unnamed Group"}</h4>
                  </div>
                </>
              ) : (
                <>
                  <ProfileImage
                    Image={activeChatUser?.ProfileImage || IMAGES.PlaceHolder}
                    className="chat-topbar-avatar"
                    style={{ border: "none" }}
                  />
                  <div>
                    <h4>
                      {activeChatUser?.fullName ||
                        activeChatUser?.email ||
                        "Unknown User"}
                    </h4>
                    <p className="chat-topbar-sub">{activeChatUser?.email}</p>
                  </div>
                </>
              )}
            </div>
            <div
              className="chat-messages"
              ref={chatContainerRef}
              onScroll={handleChatScroll}
            >
              {isLoadingMore && (
                <div className="loading-more-indicator">
                  <Loader size="20" />
                  <span>Loading older messages...</span>
                </div>
              )}
              {Object.entries(groupedMessages).map(([dateLabel, msgs]) => (
                <div className="chat-messages-date-contain" key={dateLabel}>
                  <div className="chat-date-label">
                    <p>{dateLabel}</p>
                  </div>
                  {msgs.map((msg) => {
                    const user = userMap[msg.senderId];
                    const isMe = msg.senderId === currentUser?.userId;
                    const isSeenByOthers =
                      isMe &&
                      Array.isArray(msg?.seenBy) &&
                      msg.seenBy.some((id) => id !== currentUser?.userId);

                    return (
                      <div
                        key={msg.id}
                        className={`chat-message-row ${isMe ? "me" : "other"}`}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          if (!isMe) return;
                          setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            message: msg,
                          });
                        }}
                      >
                        {!isMe && (
                          <ProfileImage
                            Image={user?.ProfileImage || IMAGES.PlaceHolder}
                            className="chat-avatar"
                          />
                        )}

                        <div className="chat-bubble-wrapper">
                          {!isMe && activeChatData?.type === "group" && (
                            <UserHoverPortable userId={user?.docId}>
                              <span className="chat-username elepsis">
                                {user?.fullName || "N/A"}
                              </span>
                            </UserHoverPortable>
                          )}
                          {msg.isOptimistic && (
                            <p className="sending-text">Sending...</p>
                          )}

                          {msg.isFailed && (
                            <p
                              style={{ color: "var(--status-rejected)" }}
                              className="sending-text"
                            >
                              Failed to send
                            </p>
                          )}

                          <div
                            className={
                              !isMe && activeChatData?.type === "group"
                                ? "chat-bubble group"
                                : "chat-bubble"
                            }
                          >
                            <div className="chat-text style-import">
                              {renderMessage(msg.text)}
                            </div>
                            <span
                              style={{ justifyContent: isMe ? "end" : "" }}
                              className={
                                !isMe && activeChatData?.type === "group"
                                  ? "chat-time group"
                                  : "chat-time"
                              }
                            >
                              {formateTime(msg?.createdAt) || "N/A"}
                              {isMe && activeChatData?.type !== "group" && (
                                <span
                                  style={{ marginLeft: "4px" }}
                                  className="icon"
                                >
                                  {isSeenByOthers ? (
                                    <CheckCheck
                                      color="var(--primary)"
                                      size={14}
                                    />
                                  ) : (
                                    <Check size={14} />
                                  )}
                                </span>
                              )}
                              {msg.isEdit && (
                                <span className="edited-label">(edited)</span>
                              )}
                            </span>
                          </div>
                        </div>

                        {isMe && (
                          <ProfileImage
                            Image={user?.ProfileImage || IMAGES.PlaceHolder}
                            className="chat-avatar"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={messagesEndRef} />
              {contextMenu && (
                <div
                  className="message-action-menu"
                  style={{
                    position: "fixed",
                    top: contextMenu.y,
                    left: contextMenu.x,
                    zIndex: 1000,
                  }}
                  onMouseLeave={() => setContextMenu(null)}
                >
                  <button
                    onClick={() => {
                      handleStartEdit(contextMenu.message);
                      setContextMenu(null);
                    }}
                    className="message-action-menu-btn edit"
                  >
                    <span className="icon">
                      <Edit size={14} />
                    </span>
                    Edit
                  </button>

                  <button
                    className="message-action-menu-btn delete"
                    onClick={() => {
                      setDeleteTarget(contextMenu.message);
                      setContextMenu(null);
                    }}
                  >
                    <span className="icon">
                      <Trash2 size={14} />
                    </span>
                    Delete
                  </button>
                </div>
              )}
            </div>
            <div className="chat-input">
              {showScrollBtn && (
                <button
                  className="scroll-bottom-btn"
                  onClick={() => {
                    scrollToBottom("smooth");
                  }}
                >
                  <span className="icon">
                    <ChevronDown size={18} />
                  </span>
                </button>
              )}
              {deleteTarget && (
                <DeletConfirm
                  onClose={() => setDeleteTarget(null)}
                  onDelete={async () => {
                    await deleteMessage(activeChat, deleteTarget.id);
                    setDeleteTarget(null);
                  }}
                />
              )}
              <RichTextarea
                value={text}
                setValue={setText}
                placeholder="Type a message..."
                onSubmit={handleSend}
                isEdit={!!editingMessage}
                onEdit={handleEdit}
                onCancelEdit={handleCancelEdit}
              />
            </div>
          </>
        )}
      </div>
      {isCreating && (
        <CreateGroupModel
          userslist={allUsers}
          onClose={() => setIsCreating(false)}
        />
      )}
    </div>
  );
};

export default Chats;

const CreateGroupModel = ({ userslist = [], onClose }) => {
  const { currentUser } = useAuth();
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateGroup = async () => {
    if (groupName.trim() === "") return toast.error("Channel name is required");
    else if (groupMembers?.length < 2)
      return toast.error("Select at least 2 members to create a Channel");
    const membersDocId = [
      ...new Set(
        [...groupMembers.map((user) => user.docId), currentUser?.userId].filter(
          Boolean,
        ),
      ),
    ];

    const membersAuthId = [
      ...new Set(
        [...groupMembers.map((user) => user.id), currentUser?.authId].filter(
          Boolean,
        ),
      ),
    ];
    try {
      setLoading(true);
      const res = await createChat(
        membersDocId,
        membersAuthId,
        "group",
        groupName,
      );
      toast.success("Group Created Successfully.");
      onClose();
    } catch (err) {
      console.log("Failed to create group:", err);
      toast.error("Failed to create group, try again later.");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = userslist?.filter((user) => {
    if (user?.docId === currentUser?.userId) return false;
    const searchValue = search.toLowerCase();
    const nameMatch = user?.fullName?.toLowerCase().includes(searchValue);
    const emailMatch = user?.email?.toLowerCase().includes(searchValue);
    return nameMatch || emailMatch;
  });

  const handleSelectUser = (user) => {
    setGroupMembers((prev) => {
      const alreadySelected = prev.some((u) => u.id === user.id);
      if (alreadySelected) {
        return prev.filter((u) => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  return (
    <div className="model-overlay">
      <div className="model-content">
        <div className="model-header">
          <h3 className="model-header-title">Create Channel</h3>
          <span
            disabled={loading}
            className="model-header-close-btn"
            onClick={onClose}
          >
            &times;
          </span>
        </div>
        <div className="model-content-container">
          <Input
            label="Channel Name"
            value={groupName}
            setValue={setGroupName}
            placeholder="Enter channel name..."
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              gap: "5px",
            }}
          >
            <label className="custom-input-label">Add members</label>
            <label className="custom-input-label">
              {groupMembers?.length || 0} selected
            </label>
          </div>
          <div className="chat-search group-create-search">
            <Search size={18} />
            <input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="group-create-container">
            {filteredUsers?.length > 0 ? (
              filteredUsers.map((user, index) => {
                const isSelected = groupMembers?.some((u) => u.id === user.id);

                return (
                  <div
                    key={index}
                    className={`group-create-item ${isSelected ? "group-create-item-active" : ""}`}
                    onClick={() => handleSelectUser(user)}
                  >
                    <div className="group-create-left">
                      <ProfileImage
                        Image={user?.ProfileImage || IMAGES.PlaceHolder}
                        className="group-create-avatar"
                      />
                      <div className="group-create-user-info">
                        <h3 className="group-create-name">
                          {user?.fullName || "N/A"}
                        </h3>
                        <p className="group-create-username">
                          {user?.email || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="group-create-right">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectUser(user)}
                        className="group-create-checkbox"
                      />

                      {isSelected && (
                        <div className="group-create-checkmark">✓</div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="empty-data">No user found.</p>
            )}
          </div>
          <div className="submit-modal-container">
            <button
              disabled={loading}
              onClick={handleCreateGroup}
              className="leave-submit-btn"
              style={{ opacity: loading ? "0.8" : "" }}
            >
              {loading ? "Creating..." : "Create Channel"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DeletConfirm = ({ onClose, onDelete }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      await onDelete();
      onClose();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={onClose} className="model-overlay">
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="model-content-container logout-modal"
      >
        <div className="logout-icon">
          <TriangleAlert size={48} />
        </div>

        <h2 className="logout-title">Delete Message?</h2>

        <p className="logout-text">
          Are you sure you want to delete this message?
        </p>

        <div className="logout-actions">
          <button
            className="logout-action-btn logout-action-primary"
            onClick={onClose}
          >
            <span className="icon">
              <CircleX />
            </span>
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="logout-action-btn logout-action-secondary"
          >
            <span className="icon">
              <Trash2 />
            </span>
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};
