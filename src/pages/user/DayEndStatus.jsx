import React, { useEffect, useMemo, useState } from "react";
import { FileText, Minus, Plus, User, Users } from "lucide-react";
import "../../assets/style/DayEndStatus.css";
import { RichTextarea } from "../../components/Custom.RichTextArea";
import { useAuth } from "../../context/AuthContext";
import {
  CreateReport,
  DeleteReport,
  EditReport,
  subscribeReports,
  loadMoreReports,
  subscribeLastReports,
} from "../../services/user/dayEndStatus.services";
import { toast } from "sonner";
import Loader from "../../components/Loader";
import { ReportCard } from "../../components/Report.component";
import { useTheme } from "../../context/ThemeContext";
import { Header, LoadMore } from "../../components/CustomComponents";

const DayEndStatus = ({ isManager = false, tab = "my",setTab }) => {
  const { currentUser } = useAuth();
  const { limit } = useTheme();
  const userId = currentUser?.userId;
  const [isReporting, setIsReporting] = useState(false);
  const [text, setText] = useState("");
  const [editingReport, setEditingReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingLastReport, setLoadingLastReport] = useState(true);
  const [lastReport, setLastReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);

  const isTodayReport = useMemo(() => {
    if (!loadingLastReport && !lastReport) {
      return false;
    }

    const createdAt = lastReport?.createdAt;

    let isTodayReport = false;

    if (createdAt) {
      const reportDate = createdAt.toDate();
      const now = new Date();

      const isSameDay =
        reportDate.getFullYear() === now.getFullYear() &&
        reportDate.getMonth() === now.getMonth() &&
        reportDate.getDate() === now.getDate();

      if (isSameDay) {
        const currentHour = now.getHours();
        isTodayReport = currentHour >= 11;
      }
    }

    return isTodayReport;
  }, [lastReport]);

  useEffect(() => {
    if (!userId) return;
    setLoadingLastReport(true);
    const unsub = subscribeLastReports(userId, (data) => {
      setLastReport(data);
      setLoadingLastReport(false);
    });
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    const unsub = subscribeReports(
      userId,
      (data) => {
        setReports(data.reports);
        setLastDoc(data.lastDoc);
        setLoading(false);
      },
      limit,
    );

    return () => unsub && unsub();
  }, [userId]);

  const handleSend = async () => {
    try {
      await CreateReport({
        content: text,
        user: currentUser,
      });
      setText("");
      setIsReporting(false);
      toast.success("Report added");
    } catch (error) {
      console.error("Failed to add report:", error);
      toast.error("Failed to add report");
    }
  };

  const handleEdit = async () => {
    try {
      await EditReport({
        userId,
        id: editingReport?.id,
        content: text,
      });
    } catch (err) {
      console.error("Failed to edit report:", err);
      toast.error("Failed to edit report");
    } finally {
      setEditingReport(null);
      setIsReporting(false);
    }
  };

  const handleDelete = async (reportId) => {
    try {
      await DeleteReport({
        userId,
        id: reportId,
      });
    } catch (err) {
      console.error("Failed to edit report:", err);
      toast.error("Failed to edit report");
    }
  };

  const handleStartEdit = (report) => {
    setEditingReport(report);
    setText(report.content);
    setIsReporting(true);
  };

  const handleCancelEdit = () => {
    setEditingReport(null);
    setText("");
  };

  const fetchReports = async (reset = false) => {
    try {
      if (reset) {
        setReports([]);
        setLoading(true);
        setLastDoc(null);
        setHasMore(true);
      } else {
        setLoadMoreLoading(true);
      }

      const res = await loadMoreReports(userId, reset ? null : lastDoc, limit);

      const newReports = res?.reports || [];
      const newLastDoc = res?.lastDoc || null;

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
      <Header
        title="Day End Status"
        desc="Track daily repors"
        isTab={isManager}
        tabState={tab}
        setTabState={setTab}
        tabOptions={[
          { label: "My", value: "my", icon: User },
          { label: "Users", value: "users", icon: Users },
        ]}
        tabOuterWidth="fit-content"
      />
      <div
        style={{
          borderRadius:
            (isReporting && !loadingLastReport && !isTodayReport) ||
            editingReport
              ? "10px 10px 0px 0px"
              : "",
        }}
        className="attendance-top-card"
      >
        <div className="attendance-top-card-content">
          <h4>Today — {new Date().toDateString()}</h4>
          <p>Today's Report</p>
        </div>
        {(isReporting && !loadingLastReport && !isTodayReport) ||
        editingReport ? (
          <button
            disabled={loadingLastReport || isTodayReport}
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
            disabled={loadingLastReport || isTodayReport}
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
      <div
        className={`attendance-late-apper ${(isReporting && !loadingLastReport && !isTodayReport) || editingReport ? "show" : ""}`}
      >
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
          reports?.map((rep, index) => {
            return (
              <ReportCard
                key={index}
                report={rep}
                handleDelete={handleDelete}
                handleStartEdit={handleStartEdit}
              />
            );
          })
        ) : (
          <p className="empty-data">No reports found.</p>
        )}
        <LoadMore
          loading={loadMoreLoading}
          disabled={loadMoreLoading}
          show={(hasMore || loadMoreLoading) && !loading && reports?.length >= limit}
          onLoad={handleLoadMore}
          style={{ marginBottom: "10px", marginTop: "10px" }}
        />
      </div>
    </div>
  );
};

export default DayEndStatus;
