import React, { useState } from "react";
import { RichTextarea } from "../../components/Custom.RichTextArea";

const DayEndStatus = () => {
  const [text, setText] = useState("");

  const handleSend = () => {
    console.log("text----->", text);
  };

  const handleEdit = () => {
    console.log("edit text----->", text);
  };

  return (
    <div className="page-container">
      <div>DayEndStatus.jsx</div>
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
