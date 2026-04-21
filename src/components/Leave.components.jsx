import React, { useEffect, useState } from "react";
import {
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  ScanEye,
  Check,
  X,
} from "lucide-react";
import { formateDateTime } from "../utils/helper";
import { ProfileImage, UserHover } from "./CustomComponents";
import { IMAGES } from "../utils/constants";
import {
  getUserByIdFromUserIndex,
  updateLeaveStatus,
} from "../services/admin/leaves.services";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

export const LeaveList = ({ leaves, type = "user" }) => {
  const [selectedLeave, setSelectedLeave] = useState(null);

  const getStatus = (dates) => {
    const counts = dates.reduce(
      (acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + 1;
        return acc;
      },
      { approved: 0, rejected: 0, pending: 0 },
    );

    if (
      counts.rejected >= counts.pending &&
      counts.rejected >= counts.approved
    ) {
      return "rejected";
    }

    if (counts.pending >= counts.approved) {
      return "pending";
    }

    return "approved";
  };
  const getStatusIcon = (status) => {
    if (status === "approved") return <CheckCircle size={14} />;
    if (status === "rejected") return <XCircle size={14} />;
    return <Clock size={14} />;
  };

  const formatDateRange = (dates) => {
    if (!dates || dates.length === 0) return "";

    const sorted = [...dates].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );

    const start = new Date(sorted[0].date);
    const end = new Date(sorted[sorted.length - 1].date);

    if (sorted.length === 1 || start.toDateString() === end.toDateString()) {
      return start.toDateString().slice(4, 10);
    }

    return `${start.toDateString().slice(4, 10)} - ${end
      .toDateString()
      .slice(4, 10)}`;
  };

  const statusCounts = (dates) => {
    const counts = { approved: 0, pending: 0, rejected: 0 };
    dates.forEach((d) => {
      if (d.status === "approved") counts.approved++;
      else if (d.status === "pending") counts.pending++;
      else if (d.status === "rejected") counts.rejected++;
    });
    return counts;
  };

  const isAdmin = type === "admin";

  return (
    <div className="leave-container">
      {leaves?.length > 0 ? (
        leaves.map((leave) => {
          const status = getStatus(leave.dates);
          const counts = statusCounts(leave.dates);

          return (
            <div key={leave.id} className={`leave-card leave-${status}`}>
              {isAdmin && (
                <ProfileImage
                  className="leave-card-profileImg"
                  Image={leave?.user?.profileImage || IMAGES.PlaceHolder}
                />
              )}
              <div className="leave-content">
                {isAdmin && (
                  <div className="leave-meta">
                    <User size={14} />
                    <UserHover userId={leave?.createdBy}>
                      <span className="user-hover-child">
                        {leave?.user?.fullName || "N/A"} •{" "}
                        {leave?.user?.email || "N/A"}
                      </span>
                    </UserHover>
                  </div>
                )}
                <div className="leave-meta">
                  <Calendar size={14} />
                  <span>
                    {formatDateRange(leave.dates)} • {leave.dates.length}d ||
                    CreatedAt: {formateDateTime(leave.createdAt)}
                  </span>
                </div>
                {!isAdmin && (
                  <div className="leave-meta">
                    {counts.approved} approved, {counts.pending} pending,{" "}
                    {counts.rejected} rejected
                  </div>
                )}
                <p className="leave-reason">{leave.reason}</p>
              </div>
              <div className="leave-card-right">
                {isAdmin && (
                  <div className="leave-meta">
                    {counts.approved} approved, {counts.pending} pending,{" "}
                    {counts.rejected} rejected
                  </div>
                )}

                <div className="leave-actions">
                  <span className={`leave-status leave-status-${status}`}>
                    {getStatusIcon(status)}
                    {status}
                  </span>

                  <Eye
                    onClick={() => setSelectedLeave(leave)}
                    className="leave-view-icon"
                    size={18}
                  />
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <p className="empty-data">No leave requests found.</p>
      )}
      {selectedLeave && (
        <LeaveDetailsModal
          leave={selectedLeave}
          isAdmin={isAdmin}
          onClose={() => setSelectedLeave(null)}
        />
      )}
    </div>
  );
};

export const LeaveDetailsModal = ({ leave, isAdmin, onClose }) => {
  if (!leave) return null;
  const { currentUser } = useAuth();
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingReviewer, setLoadingReviewer] = useState(false);
  const [reviewerUser, setReviewerUser] = useState(null);

  useEffect(() => {
    if (leave?.reviewedBy) {
      getReviewerInfo(leave.reviewedBy);
    }
  }, [leave]);

  useEffect(() => {
    if (isReviewing) {
      const pendingDates = leave.dates
        .filter((d) => d.status === "pending")
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      setReviewResult(pendingDates);
    }
  }, [isReviewing, leave]);

  const getReviewerInfo = async (reviewedBy) => {
    if (!reviewedBy) return;
    setLoadingReviewer(true);
    try {
      const user = await getUserByIdFromUserIndex(reviewedBy);
      setReviewerUser(user);
    } catch (error) {
      console.error("Error fetching reviewer info:", error);
    } finally {
      setLoadingReviewer(false);
    }
  };

  const handleReviewChange = (date, newStatus) => {
    setReviewResult((prev) =>
      prev.map((d) => (d.date === date ? { ...d, status: newStatus } : d)),
    );
  };

  const counts = leave.dates.reduce(
    (acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    },
    { approved: 0, rejected: 0, pending: 0 },
  );

  const status =
    counts.rejected >= counts.pending && counts.rejected >= counts.approved
      ? "rejected"
      : counts.pending >= counts.approved
        ? "pending"
        : "approved";
  const isPendingLeave = leave.dates.some((d) => d.status === "pending");

  const handleCancelReview = () => {
    setReviewResult([]);
    setIsReviewing(false);
  };

  const handleSubmitReview = async () => {
    setLoading(true);
    try {
      await updateLeaveStatus({
        leaveId: leave.id,
        reviewerId: currentUser?.userId,
        dates: reviewResult,
      });
      toast.success("Leave review submitted successfully");
    } catch (error) {
      console.error("Error submitting leave review:", error);
      toast.error("Failed to submit leave review");
    } finally {
      handleCancelReview();
      onClose();
      setLoading(false);
    }
  };

  return (
    <div className="model-overlay" onClick={onClose}>
      <div className="model-content" onClick={(e) => e.stopPropagation()}>
        <div className="model-header">
          <h3 className="model-header-title">
            {isReviewing ? "Review Leave Request" : "Leave Request Details"}
          </h3>
          <span className="model-header-close-btn" onClick={onClose}>
            &times;
          </span>
        </div>
        <div className="model-content-container">
          {isAdmin && (
            <div className="leave-detail-user">
              <ProfileImage
                Image={leave?.user?.profileImage || IMAGES.PlaceHolder}
                className="leave-detail-avatar"
              />
              <div className="leave-detail-user-info">
                <h3 className="leave-detail-name">
                  {leave?.user?.fullName || "N/A"}
                </h3>
                <p className="leave-detail-email">
                  {leave?.user?.email || "N/A"}
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "end",
                  justifyContent: "end",
                  gap: "5px",
                }}
              >
                {isAdmin && isPendingLeave && (
                  <button
                    onClick={() => setIsReviewing(true)}
                    className="leave-detail-review-btn"
                  >
                    <span className="icon">
                      <ScanEye size={18} />
                    </span>
                    Review
                  </button>
                )}
                <div className={`leave-detail-status ${status}`}>{status}</div>
              </div>
            </div>
          )}
          <div className="leave-detail-badges">
            <span className="leave-detail-type">Personal Leave</span>
            <span className="leave-detail-days">
              {leave?.dates?.length} days
            </span>
          </div>
          <div className="leave-detail-section">
            <h4 className="leave-detail-heading">Requested Dates</h4>

            {leave?.dates
              ?.slice()
              .filter((d) => (isReviewing ? d.status === "pending" : true))
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map((d, i) => (
                <div key={i} className="leave-detail-date-row">
                  <div className="leave-detail-date">
                    {new Date(d.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  {isReviewing ? (
                    <div className="leave-detail-actions">
                      <button
                        className="leave-detail-action-btn reject"
                        onClick={() => handleReviewChange(d.date, "rejected")}
                      >
                        <X size={16} />
                      </button>

                      <button
                        className="leave-detail-action-btn approve"
                        onClick={() => handleReviewChange(d.date, "approved")}
                      >
                        <Check size={16} />
                      </button>
                    </div>
                  ) : (
                    <span className={`leave-detail-badge ${d.status}`}>
                      {d.status}
                    </span>
                  )}
                </div>
              ))}
          </div>
          {isReviewing ? (
            <div className="leave-detail-section">
              <h4 className="leave-detail-heading">Review Summary</h4>
              <div className="leave-detail-review-row-list">
                {reviewResult.map((d, i) => (
                  <div
                    key={i}
                    className={`leave-detail-date leave-detail-review-row review-${d.status}`}
                  >
                    <span>
                      {new Date(d.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    {d.status !== "pending" && (
                      <span
                        onClick={() => handleReviewChange(d.date, "pending")}
                        className="icon"
                      >
                        <XCircle size={16} />
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="leave-detail-review-actions">
                <button
                  className="leave-detail-review-action cancel"
                  onClick={handleCancelReview}
                >
                  Cancel
                </button>
                <button
                  className="leave-detail-review-action submit"
                  onClick={handleSubmitReview}
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="leave-detail-section">
                <h4 className="leave-detail-heading">Reason</h4>
                <div className="leave-detail-reason">
                  {leave?.reason || "No reason provided"}
                </div>
              </div>

              <div className="leave-detail-footer">
                <div>
                  <p className="leave-detail-label">Submitted</p>
                  <p className="leave-detail-value">
                    {leave?.createdAt?.seconds
                      ? new Date(leave.createdAt.seconds * 1000).toDateString()
                      : "-"}
                  </p>
                </div>

                <div>
                  <p className="leave-detail-label">Last Update</p>
                  <p className="leave-detail-value">
                    {leave?.updatedAt?.seconds
                      ? new Date(leave.updatedAt.seconds * 1000).toDateString()
                      : "-"}
                  </p>
                </div>
              </div>
              <div className="leave-detail-reviewed">
                <p className="leave-detail-label">Reviewed By</p>
                <p className="leave-detail-value">
                  {leave?.isAutoApproved
                    ? "System"
                    : loadingReviewer
                      ? "Loading..."
                      : reviewerUser?.fullName || "—"}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
