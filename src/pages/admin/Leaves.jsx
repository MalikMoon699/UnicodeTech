import React, { useEffect, useState } from "react";
import { AdminLeaveCreateModal } from "../../components/Attendance.components";
import { LeaveList } from "../../components/Leave.components";
import "../../assets/style/Leave.css";
import Loader from "../../components/Loader";
import { limit } from "../../utils/constants";
import { useAuth } from "../../context/AuthContext";
import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  CalendarPlus2,
  CalendarX,
  Users,
} from "lucide-react";
import {
  Header,
  LoadMore,
  StatesCard,
  Tabs,
} from "../../components/CustomComponents";
import {
  getLeaveStatsByUserId,
  listenRequestsFirstPage,
  loadMoreRequests,
  submitLeaveRequest,
} from "../../services/manager/leave.services";
import {
  listenAdminRequestsFirstPage,
  loadMoreAdminRequests,
  getAdminLeaveStats,
} from "../../services/admin/leaves.services";

const getLeaveServices = (tab) => {
  if (tab === "my-created") {
    return {
      listenFirstPage: listenRequestsFirstPage,
      loadMore: loadMoreRequests,
      getStats: getLeaveStatsByUserId,
      isAdmin: false,
    };
  }

  return {
    listenFirstPage: listenAdminRequestsFirstPage,
    loadMore: loadMoreAdminRequests,
    getStats: getAdminLeaveStats,
    isAdmin: true,
  };
};

const Leaves = () => {
  const { currentUser } = useAuth();
  const [isCreateLeave, setIsCreateLeave] = useState(false);
  const [tab, setTab] = useState("my-created");
  const [leaveStats, setLeaveStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    setLoadingStates(true);
    setLoading(true);
    setLoadingMore(false);
    setLeaveStats(null);
    setRequests([]);
    setLastDoc(null);
    setHasMore(false);
  }, [tab]);

  useEffect(() => {
    if (!currentUser?.userId) return;
    const { listenFirstPage, getStats } = getLeaveServices(tab);
    setLoading(true);
    setLoadingStates(true);
    const unsubscribeList = listenFirstPage({
      userId: currentUser.userId,
      currentUserId: currentUser.userId,
      pageLimit: limit,
      callback: ({ data, lastDoc, hasMore }) => {
        setRequests(data);
        setLastDoc(lastDoc);
        setHasMore(hasMore);
        setLoading(false);
      },
    });

    const unsubscribeStats = getStats({
      userId: currentUser.userId,
      currentUserId: currentUser.userId,
      callback: (stats) => {
        setLeaveStats(stats);
        setLoadingStates(false);
      },
    });

    return () => {
      unsubscribeList?.();
      unsubscribeStats?.();
    };
  }, [tab, currentUser]);

  const loadMoreRecords = async () => {
    if (!lastDoc) return;

    const { loadMore } = getLeaveServices(tab);

    setLoadingMore(true);

    const res = await loadMore({
      userId: currentUser.userId,
      currentUserId: currentUser.userId,
      lastDoc,
      pageLimit: 10,
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
        desc="Apply and track leave requests"
        context={
          <button
            className="leave-submit-btn"
            onClick={() => setIsCreateLeave(true)}
          >
            <span className="icon">
              <CalendarPlus size={18} />
            </span>
            Create Leave
          </button>
        }
      />

      <Tabs
        disabled={loading}
        tab={tab}
        setTab={setTab}
        options={[
          { label: "My created", value: "my-created", icon: CalendarPlus2 },
          { label: "By Users", value: "by-users", icon: Users },
        ]}
        outerWidth="100%"
        innerWidth="fit-content"
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
          <LeaveList leaves={requests} type={tab === "my-created" ? "user" : "admin"} />
          <LoadMore
            loading={loadingMore}
            disabled={loadingMore || loading}
            show={hasMore || loadingMore}
            onLoad={loadMoreRecords}
          />
        </>
      )}

      {isCreateLeave && (
        <AdminLeaveCreateModal
          onClose={() => setIsCreateLeave(false)}
          onSendRequest={submitLeaveRequest}
        />
      )}
    </div>
  );
};

export default Leaves;
