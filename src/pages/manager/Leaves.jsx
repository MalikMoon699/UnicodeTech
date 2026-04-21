import React, { useEffect, useState } from "react";
import {
  Header,
  LoadMore,
  StatesCard,
} from "../../components/CustomComponents";
import { LeaveRequestModal } from "../../components/Attendance.components";
import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  CalendarX,
} from "lucide-react";
import {
  getLeaveStatsByUserId,
  listenRequestsFirstPage,
  loadMoreRequests,
  submitLeaveRequest,
} from "../../services/manager/leave.services";
import { useAuth } from "../../context/AuthContext";
import { limit } from "../../utils/constants";
import { LeaveList } from "../../components/Leave.components";
import Loader from "../../components/Loader";

const Leaves = () => {
  const { currentUser } = useAuth();
  const [leaveStats, setLeaveStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [isApply, setIsApply] = useState(false);

  useEffect(() => {
    setLoadingStates(true);

    const unsubscribe = getLeaveStatsByUserId({
      userId: currentUser.userId,
      callback: (stats) => {
        setLeaveStats(stats);
        setLoadingStates(false);
      },
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenRequestsFirstPage({
      userId: currentUser.userId,
      pageLimit: limit,
      callback: ({ data, lastDoc, hasMore }) => {
        setRequests(data);
        setLastDoc(lastDoc);
        setHasMore(hasMore);
        setLoading(false);
      },
    });

    return () => unsubscribe();
  }, []);

  const loadMoreRecords = async () => {
    if (!lastDoc) return;

    setLoadingMore(true);

    const res = await loadMoreRequests({
      userId: currentUser.userId,
      pageLimit: limit,
      lastDoc,
    });

    setRequests((prev) => [...prev, ...res.data]);
    setLastDoc(res.lastDoc);
    setHasMore(res.hasMore);

    setLoadingMore(false);
  };

  return (
    <div className="page-container">
      <Header
        title="Leave Management"
        desc="Apply and track your leave requests"
        context={
          <button className="leave-submit-btn" onClick={() => setIsApply(true)}>
            <span className="icon">
              <CalendarPlus size={18} />
            </span>
            Apply Leave
          </button>
        }
      />
      <div
        style={{ margin: "30px 0px" }}
        className="custom-dashboard-stats-container"
      >
        <StatesCard
          icon={CalendarDays}
          iColor="var(--card-foreground)"
          title="Total Requests"
          value={leaveStats?.totalRequests || 0}
          loading={loadingStates}
        />

        <StatesCard
          icon={CalendarCheck}
          iColor="var(--status-approved)"
          title="Approved"
          value={leaveStats?.approved || 0}
          loading={loadingStates}
        />

        <StatesCard
          icon={CalendarClock}
          iColor="var(--status-pending)"
          title="Pending"
          value={leaveStats?.pending || 0}
          loading={loadingStates}
        />

        <StatesCard
          icon={CalendarX}
          iColor="var(--status-rejected)"
          title="Rejected"
          value={leaveStats?.rejected || 0}
          loading={loadingStates}
        />
      </div>
      {loading ? (
        <Loader style={{ marginTop: "30px", height: "70vh" }} />
      ) : (
        <>
          <LeaveList leaves={requests} />
          <LoadMore
            loading={loadingMore}
            disabled={loadingMore || loading}
            show={hasMore || loadingMore}
            onLoad={loadMoreRecords}
          />
        </>
      )}
      {isApply && (
        <LeaveRequestModal
          onClose={() => setIsApply(false)}
          onSendRequest={submitLeaveRequest}
        />
      )}
    </div>
  );
};

export default Leaves;
