import React, { useEffect, useRef, useState } from "react";
import * as LucideIcons from "lucide-react/dist/esm/icons";
import {
  AtSign,
  CaseSensitive,
  Check,
  Paperclip,
  SendHorizonal,
  Smile,
} from "lucide-react";
import Loader from "./Loader";
import { useTheme } from "../context/ThemeContext";
import { useEditor, EditorContent, NodeViewWrapper } from "@tiptap/react";
import { splitListItem } from "prosemirror-schema-list";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight } from "lowlight";
import Placeholder from "@tiptap/extension-placeholder";
import EmojiPicker from "emoji-picker-react";
import { Input, ProfileImage, UserHover } from "./CustomComponents";
import parse, { domToReact } from "html-react-parser";
import MentionNode from "../utils/extensions/MentionNode.extensions";
import { listenActiveUsers } from "../services/chats.services";
import { IMAGES } from "../utils/constants";
import { useAuth } from "../context/AuthContext";

const lowlight = createLowlight();

export const RichTextarea = ({
  value = "",
  setValue = () => {},
  placeholder = "",
  isEdit = false,
  onSubmit = () => {},
  onEdit = () => {},
}) => {
  const { isEnterSubmit } = useTheme();
  const [loading, setLoading] = useState(false);
  const [isAddLink, setIsAddLink] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [isStyle, setIsStyle] = useState(true);
  const [, setUpdate] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: true,
        hardBreak: true,
      }),
      MentionNode,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Underline,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: value || null,

    onSelectionUpdate: () => {
      setUpdate((v) => v + 1);
    },

    editorProps: {
      attributes: {
        class: "editor-input style-import",
      },

      handleKeyDown: (view, event) => {
        const isCodeBlock = editor.isActive("codeBlock");

        if (isCodeBlock) {
          if (
            (event.key === "Enter" && event.shiftKey) ||
            (event.key === "Enter" && !isEnterSubmit)
          ) {
            event.preventDefault();
            editor.chain().focus().insertContent("\n").run();
            return true;
          } else if (event.key === "Enter" && isEnterSubmit) {
            event.preventDefault();

            if (isEmpty(editor.getHTML()) || loading) return true;

            if (isEdit) {
              handleEdit();
            } else {
              handleSend();
            }

            return true;
          }
          return false;
        }

        if (
          (event.key === "Enter" && event.shiftKey) ||
          (event.key === "Enter" && !isEnterSubmit)
        ) {
          const { state, dispatch } = view;
          const isInList =
            editor.isActive("orderedList") || editor.isActive("bulletList");

          if (isInList) {
            event.preventDefault();
            return splitListItem(state.schema.nodes.listItem)(state, dispatch);
          }

          event.preventDefault();
          editor.chain().focus().setHardBreak().run();
          return true;
        }
        if (isEnterSubmit && event.key === "Enter") {
          event.preventDefault();

          if (isEmpty(editor.getHTML()) || loading) return true;

          if (isEdit) {
            handleEdit();
          } else {
            handleSend();
          }

          return true;
        }

        return false;
      },
    },

    onUpdate: ({ editor }) => {
      setValue(editor.getHTML());
      setUpdate((v) => v + 1);
    },
  });

  useEffect(() => {
    if (!editor) return;

    const html = editor.getHTML();

    if (value && value !== html) {
      editor.commands.setContent(value);
    }

    if (!value && html !== "<p></p>") {
      editor.commands.clearContent();
    }
  }, [value]);

  if (!editor) return null;

  const isEmpty = (html) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent.trim() === "";
  };

  const Btn = ({ active, onClick, children }) => (
    <button
      className={`text-area-action-btn ${active ? "active" : ""}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );

  const handleSend = async () => {
    try {
      setLoading(true);
      await onSubmit();
    } catch (error) {
    } finally {
      setValue("");
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    try {
      setLoading(true);
      await onEdit();
    } catch (error) {
    } finally {
      setValue("");
      setLoading(false);
    }
  };

  return (
    <div className="editor-container">
      <div className={`editor-toolbar ${isStyle ? "show" : "close"}`}>
        <Btn
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <LucideIcons.Bold strokeWidth={4} size={14} />
        </Btn>

        <Btn
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <LucideIcons.Italic size={14} />
        </Btn>

        <Btn
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <LucideIcons.Underline size={14} />
        </Btn>

        <Btn
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <LucideIcons.Strikethrough size={14} />
        </Btn>

        <span className="divider" />

        <Btn
          active={editor.isActive("link")}
          onClick={() => {
            const { from, to } = editor.state.selection;
            const text = editor.state.doc.textBetween(from, to, " ");
            setSelectedText(text);
            setIsAddLink(true);
          }}
        >
          <LucideIcons.Link size={14} />
        </Btn>
        <Btn
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <LucideIcons.List size={14} />
        </Btn>

        <Btn
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <LucideIcons.ListOrdered size={14} />
        </Btn>

        <span className="divider" />

        <Btn
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <LucideIcons.TextQuote size={14} />
        </Btn>
        <Btn
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <LucideIcons.CodeXml size={14} />
        </Btn>

        {/* <Btn
          active={editor.isActive("codeBlock")}
          onClick={() => {
            const { state } = editor;
            const { from, to, empty } = state.selection;
            if (empty || (from === 0 && to === state.doc.content.size)) {
              const node = state.selection.$from.parent;

              if (node.type.name !== "paragraph") return;

              editor.chain().focus().toggleCodeBlock().run();
              return;
            }

            editor.chain().focus().toggleCodeBlock().run();
          }}
        >
          <LucideIcons.FileCodeCorner size={14} />
        </Btn> */}
      </div>
      <EditorContent editor={editor} />
      <div
        style={{ borderTop: "1px solid var(--border)" }}
        className="editor-toolbar"
      >
        <button disabled className={`text-area-action-btn`}>
          <Paperclip size={16} />
        </button>
        <button
          style={{ marginLeft: "10px" }}
          className={`text-area-action-btn ${isStyle ? "active" : ""}`}
          onClick={() => setIsStyle(!isStyle)}
        >
          <CaseSensitive size={18} />
        </button>
        <EmojiPickerComponent
          editor={editor}
          onEmojiSelect={(emoji) => {
            editor.chain().focus().insertContent(emoji).run();
          }}
        />
        <MentionComponent editor={editor} />
        {isEdit ? (
          <button
            className="rich-submit-btn"
            disabled={isEmpty(value) || loading}
            onClick={handleEdit}
          >
            {loading ? <Loader color="#fff" size="12" /> : <Check size={18} />}
          </button>
        ) : (
          <button
            className="rich-submit-btn"
            disabled={isEmpty(value) || loading}
            onClick={handleSend}
          >
            {loading ? (
              <Loader color="#fff" size="12" />
            ) : (
              <SendHorizonal size={18} />
            )}
          </button>
        )}
      </div>
      {isAddLink && (
        <AddLink
          initialText={selectedText}
          onClose={() => setIsAddLink(false)}
          onSave={({ text, link }) => {
            if (!editor) return;

            const label = text || selectedText || link;

            editor.chain().focus().run();

            if (selectedText) {
              editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href: link })
                .insertContent(label)
                .run();
            } else {
              editor
                .chain()
                .focus()
                .insertContent({
                  type: "text",
                  text: label,
                  marks: [
                    {
                      type: "link",
                      attrs: { href: link },
                    },
                  ],
                })
                .run();
            }

            setIsAddLink(false);
          }}
        />
      )}
    </div>
  );
};

const MentionComponent = ({ editor }) => {
  const { currentUser } = useAuth();
  const [isMention, setIsMention] = useState(false);
  const [users, setUsers] = useState([]);

  const wrapperRef = useRef(null);

  useEffect(() => {
    const unsubscribe = listenActiveUsers((data) => {
      setUsers(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsMention(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <button
        style={{ marginLeft: "10px" }}
        className={`text-area-action-btn ${isMention ? "active" : ""}`}
        onClick={() => setIsMention(!isMention)}
      >
        <AtSign size={16} />
      </button>

      {isMention && (
        <div className="mention-container">
          {users?.length > 0 ? (
            users.map((user, index) => {
              const isMe = currentUser?.userId === user?.docId;

              return (
                <div
                  className="mention-item"
                  key={index}
                  onClick={() => {
                    if (!editor) return;
                    editor
                      .chain()
                      .focus()
                      .insertContent({
                        type: "mention",
                        attrs: {
                          id: user.docId,
                          label: user.fullName,
                        },
                      })
                      .run();
                    setIsMention(false);
                  }}
                >
                  <ProfileImage
                    Image={user?.ProfileImage || IMAGES.PlaceHolder}
                    className="mention-item-profile"
                    style={{ border: "1px solid var(--border)" }}
                  />
                  <h3 className="mention-item-content elepsis">
                    {user.fullName || user.email} {isMe && "(you)"}
                  </h3>
                </div>
              );
            })
          ) : (
            <div className="empty-data">No user found.</div>
          )}
        </div>
      )}
    </div>
  );
};

const EmojiPickerComponent = ({ onEmojiSelect, editor }) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;

    if (editor) {
      editor.chain().focus().insertContent(emoji).run();
    } else {
      onEmojiSelect?.(emoji);
    }

    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={{ position: "relative", display: "inline-block" }}
    >
      <button
        style={{ marginLeft: "10px" }}
        className={`text-area-action-btn ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <Smile size={16} />
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            left: 0,
            zIndex: 9999,
          }}
        >
          <EmojiPicker onEmojiClick={handleEmojiClick} theme={theme} />
        </div>
      )}
    </div>
  );
};

const AddLink = ({ onClose, onSave, initialText = "" }) => {
  const [text, setText] = useState(initialText);
  const [link, setLink] = useState("");

  const handleAdd = () => {
    if (!link) return;

    onSave?.({ text, link });
  };

  return (
    <div onClick={onClose} className="model-overlay">
      <div onClick={(e) => e.stopPropagation()} className="model-content">
        <div className="model-header">
          <h3 className="model-header-title">Add link</h3>
          <button onClick={onClose} className="model-header-close-btn">
            &times;
          </button>
        </div>

        <div className="model-content-container">
          <Input
            value={text}
            setValue={setText}
            label="Text"
            placeholder="Enter link text..."
          />

          <Input
            value={link}
            setValue={setLink}
            label="Link"
            placeholder="https://example.com"
          />

          <div className="submit-modal-container">
            <button
              onClick={handleAdd}
              className="leave-submit-btn"
              disabled={!link || !text}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const renderMessage = (html) => {
  return parse(html, {
    replace: (node) => {
      if (
        node.name === "span" &&
        node.attribs?.class === "style-import-mention"
      ) {
        const userId = node.attribs["data-user-id"];
        const children = domToReact(node.children);

        return (
          <UserHover userId={userId}>
            <span className="user-hover-child style-import-mention">
              {children}
            </span>
          </UserHover>
        );
      }
    },
  });
};
