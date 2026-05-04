import React, { useEffect, useState } from "react";
import {
  Header,
  LoadMore,
  StatesCard,
  Tabs,
} from "../../components/CustomComponents";
import { LeaveRequestModal } from "../../components/Attendance.components";
import {
  Building,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  CalendarX,
  User,
} from "lucide-react";
import {
  getLeaveStatsByUserId,
  listenOfficeLeavesFirstPage,
  listenRequestsFirstPage,
  loadMoreOfficeLeavesRequests,
  loadMoreRequests,
  submitLeaveRequest,
} from "../../services/manager/leave.services";
import { useAuth } from "../../context/AuthContext";
import { LeaveList } from "../../components/Leave.components";
import Loader from "../../components/Loader";
import { useTheme } from "../../context/ThemeContext";

const Leaves = () => {
  const { currentUser } = useAuth();
  const { limit } = useTheme();
  const [tab, setTab] = useState("my");
  const [leaveStats, setLeaveStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [isApply, setIsApply] = useState(false);

  const handleTabChange = (value) => {
    setTab(value);
    setRequests([]);
    setLastDoc(null);
    setHasMore(false);
    setLoading(true);
  };

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
    if (tab === "my") {
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
    } else {
      const unsubscribe = listenOfficeLeavesFirstPage({
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
    }
  }, [tab]);

  const loadMoreRecords = async () => {
    if (!lastDoc) return;

    setLoadingMore(true);
    if (tab === "my") {
      const res = await loadMoreRequests({
        userId: currentUser.userId,
        pageLimit: limit,
        lastDoc,
      });
      setRequests((prev) => [...prev, ...res.data]);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } else {
      const res = await loadMoreOfficeLeavesRequests({
        userId: currentUser.userId,
        pageLimit: limit,
        lastDoc,
      });
      setRequests((prev) => [...prev, ...res.data]);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    }
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
      <Tabs
        disabled={loading}
        tab={tab}
        setTab={handleTabChange}
        style={{ padding: "0px 5px 10px" }}
        options={[
          { label: "My leaves", value: "my", icon: User },
          { label: "By office", value: "office", icon: Building },
        ]}
      />
      {loading ? (
        <Loader style={{ marginTop: "30px", height: "70vh" }} />
      ) : (
        <>
          <LeaveList leaves={requests} type={tab === "my" ? "user" : "admin"} />
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
