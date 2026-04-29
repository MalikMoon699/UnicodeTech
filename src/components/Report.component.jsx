import { CircleX, Edit, Trash2, TriangleAlert } from "lucide-react";
import { foramteDateTimeDay } from "../utils/helper";
import { renderMessage } from "./Custom.RichTextArea";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export const ReportCard = ({ report, handleDelete, handleStartEdit }) => {
  const { currentUser } = useAuth();
  const userId = currentUser?.userId;
  const [contextMenu, setContextMenu] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const isMe = userId === report?.userId;
  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        if (!isMe) return;
        setContextMenu({
          x: e.clientX,
          y: e.clientY,
          report: report,
        });
      }}
      className="day-end-card"
    >
      <h3 className="day-end-card-date">
        {foramteDateTimeDay(report?.createdAt)}
      </h3>
      <div className="day-end-card-text style-import">
        {renderMessage(report.content)}
      </div>
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
              handleStartEdit(contextMenu.report);
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
              setDeleteTarget(contextMenu.report);
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
      {deleteTarget && (
        <DeletConfirm
          onClose={() => setDeleteTarget(null)}
          onDelete={async () => {
            await handleDelete(deleteTarget.id);
            setDeleteTarget(null);
          }}
        />
      )}
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

        <h2 className="logout-title">Delete Report?</h2>

        <p className="logout-text">
          Are you sure you want to delete this report?
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
