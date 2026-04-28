import React, { useState } from "react";
import { RichTextarea } from "../../components/Custom.RichTextArea";
import { toast } from "sonner";
import {
  handleGetToken,
  handleSendNotification,
} from "../../utils/extensions/Notification.extensions";
import { useAuth } from "../../context/AuthContext";

const DayEndStatus = () => {
  const { currentUser } = useAuth();
  const [text, setText] = useState("");
  const [token, setToken] = useState(null);

  const GetToken = async () => {
    try {
      const tokenRes = await handleGetToken();
      setToken(tokenRes);
      toast.success("token get");
    } catch (error) {
      console.error("Failed to get token:", error);
      toast.error("Failed to get token");
    }
  };

  const SendNotification = async () => {
    try {
      await handleSendNotification({
        title: "Hello",
        body: "This is a test push notification",
        link: "/leaves",
        userIds: [currentUser?.userId],
      });
    } catch (err) {
      console.error("Failed to send notification:", err);
    }
  };

  const handleSend = () => {
    console.log("text----->", text);
  };

  const handleEdit = () => {
    console.log("edit text----->", text);
  };

  return (
    <div className="page-container">
      <div>DayEndStatus.jsx</div>
      <button onClick={GetToken}>Get Token</button>
      <button onClick={SendNotification}>Send</button>
      <p>{token || "N/A"}</p>
      <div className="chat-input" style={{ marginTop: "50vh" }}>
        <RichTextarea
          value={text}
          setValue={setText}
          placeholder="Type your status..."
          isEdit={false}
          onEdit={handleEdit}
          onSubmit={handleSend}
        />
      </div>
    </div>
  );
};

export default DayEndStatus;
