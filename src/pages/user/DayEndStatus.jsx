import React, { useEffect, useState } from "react";
import { FileText, Minus, Plus } from "lucide-react";
import "../../assets/style/DayEndStatus.css";
import { RichTextarea } from "../../components/Custom.RichTextArea";
import { useAuth } from "../../context/AuthContext";
import {
  CreateReport,
  EditReport,
  getReportsHelper,
  subscribeReports,
} from "../../services/user/dayEndStatus.services";
import { toast } from "sonner";
import Loader from "../../components/Loader";
import { ReportCard } from "../../components/Report.component";
import { useTheme } from "../../context/ThemeContext";

const DayEndStatus = () => {
  const { currentUser } = useAuth();
  const { limit } = useTheme();
  const [isReporting, setIsReporting] = useState(false);
  const [text, setText] = useState("");
  const [editingReport, setEditingReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);

  useEffect(() => {
    if (!currentUser?.userId) return;
    setLoading(true);
    const unsub = subscribeReports(currentUser.userId, (data) => {
      setReports(data);
      setLoading(false);
    });
    return () => unsub();
  }, [currentUser]);

  const handleSend = async () => {
    try {
      await CreateReport({
        content: text,
        user: currentUser,
      });
      setText("");
      setIsReporting(false);
      fetchReports(true);
      toast.success("Report added");
    } catch (error) {
      console.error("Failed to add report:", error);
      toast.error("Failed to add report");
    }
  };

  const handleEdit = async () => {
    try {
      const res = await EditReport({});
    } catch (err) {
      console.error("Failed to edit report:", err);
      toast.error("Failed to edit report");
    }
  };

  const handleCancelEdit = () => {
    setEditingReport(null);
    setText("");
  };

  const fetchReports = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setReports([]);
        setLastDoc(null);
        setHasMore(true);
      } else {
        setLoadMoreLoading(true);
      }

      const res = await getReportsHelper({
        limit,
        lastDoc: reset ? null : lastDoc,
      });

      const newReports = res?.users || [];
      const newLastDoc = res?.meta?.lastDoc || null;

      setReports((prev) => (reset ? newReports : [...prev, ...newReports]));

      setLastDoc(newLastDoc);
      if (newReports.length < limit || !newLastDoc) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadMoreLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!hasMore || loadMoreLoading) return;
    fetchReports(false);
  };

  return (
    <div className="page-container">
      <div
        style={{ borderRadius: isReporting ? "10px 10px 0px 0px" : "" }}
        className="attendance-top-card"
      >
        <div className="attendance-top-card-content">
          <h4>Today — {new Date().toDateString()}</h4>
          <p>Today's Report</p>
        </div>
        {isReporting ? (
          <button
            // disabled={loading}
            onClick={() => setIsReporting(false)}
            className="day-end-btn"
          >
            <span className="icon">
              <Minus size={16} />
            </span>
            Close Report
          </button>
        ) : (
          <button
            // disabled={loading}
            onClick={() => setIsReporting(true)}
            className="day-end-btn"
          >
            <span className="icon">
              <Plus size={16} />
            </span>
            Add Report
          </button>
        )}
      </div>
      <div className={`attendance-late-apper ${isReporting ? "show" : ""}`}>
        <RichTextarea
          value={text}
          setValue={setText}
          placeholder="Type a message..."
          onSubmit={handleSend}
          isEdit={!!editingReport}
          onEdit={handleEdit}
          onCancelEdit={handleCancelEdit}
          style={{ borderRadius: "0px 0px 10px 10px", borderTop: "none" }}
        />
      </div>

      <div className="day-end-list">
        <div className="day-end-list-header">
          <span className="icon">
            <FileText />
          </span>
          My Reports
        </div>
        {loading ? (
          <Loader style={{ height: "50vh" }} />
        ) : reports?.length > 0 ? (
          reports?.map((rep, index) => <ReportCard key={index} report={rep} />)
        ) : (
          <p className="empty-data">No reports found.</p>
        )}
      </div>
    </div>
  );
};

export default DayEndStatus;
