import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  listenMessages,
  listenUserChats,
  sendMessage,
  markAsSeen,
  createChat,
  listenActiveUsers,
} from "../services/chats.services";
import "../assets/style/Chats.css";
import { Search, Hash, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSearchParams } from "react-router-dom";
import { Input, ProfileImage, UserHover } from "../components/CustomComponents";
import { renderMessage, RichTextarea } from "../components/Custom.RichTextArea";
import { IMAGES } from "../utils/constants";
import { useDebounce } from "../utils/hooks/useDebounce";
import { toast } from "sonner";
import Loader from "../components/Loader";
import { formateDateTime } from "../utils/helper";

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
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const isInitialLoad = useRef(true);
  const debounceSearch = useDebounce(search, 400);

  useEffect(() => {
    if (!messages.length) return;
    if (isInitialLoad.current) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToBottom("auto");
          isInitialLoad.current = false;
        });
      });
    }
  }, [messages]);

  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    handleScroll();
  }, [messages]);

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
    setMessages([]);
    if (!activeChat || !authId) return;
    setActiveChatLoading(true);
    const unsub = listenMessages(activeChat, (data) => {
      setMessages(data);
      setActiveChatLoading(false);
    });
    markAsSeen(authId, activeChat);
    return () => unsub();
  }, [activeChat, authId]);

  useEffect(() => {
    setUsersLoading(true);
    const unsub = listenActiveUsers((data) => {
      setAllUsers(data);
      setUsersLoading(false);
      setShowStart(true);
    });
    return () => unsub();
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

  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setShowScrollBtn(false);
  };

  const handleScroll = () => {
    const el = chatContainerRef.current;
    if (!el) return;

    const threshold = 80;
    const isAtBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;

    setShowScrollBtn(!isAtBottom);
  };

  const isEmpty = (html) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent.trim() === "";
  };

  const handleSend = async () => {
    if (isEmpty(text) || !activeChat) return;
    await sendMessage(activeChat, text, userId);
    setText("");
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
            <div className="chat-messages" ref={chatContainerRef}>
              {messages.map((msg) => {
                const user = userMap[msg.senderId];
                const isMe = msg.senderId === currentUser?.userId;
                return (
                  <div
                    key={msg.id}
                    style={{ flexDirection: isMe ? "row-reverse" : "row" }}
                    className="chat-message-row"
                  >
                    <ProfileImage
                      Image={user?.ProfileImage || IMAGES.PlaceHolder}
                      className="chat-avatar"
                    />
                    <div className="chat-bubble style-import">
                      {!isMe && activeChatData?.type === "group" && (
                        <UserHover userId={user?.docId}>
                          <span className="user-hover-child">
                            {user?.fullName || "N/A"}
                          </span>
                        </UserHover>
                      )}
                      <div>{renderMessage(msg.text)}</div>
                      <p className="chat-bubble-time">
                        {formateDateTime(msg?.createdAt) || "N/A"}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
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
              <RichTextarea
                value={text}
                setValue={setText}
                placeholder="Type a message..."
                onSubmit={handleSend}
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
      toast.success("Group Created Successfuly.");
    } catch (err) {
      console.log("Failed to create group:", err);
      toast.success("Failed to create group,Try again later.");
    } finally {
      setLoading(false);
      onClose();
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
