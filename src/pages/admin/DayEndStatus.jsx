import React, { useEffect, useState } from "react";
import {
  Header,
  LoadMore,
  ProfileImage,
  StatesCard,
} from "../../components/CustomComponents";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import {
  listenAllUsersWithReports,
  listenReportsStates,
  listenSelectedUserReports,
  loadMoreReports,
  markReportSeen,
} from "../../services/admin/dayEndStatus.services";
import Loader from "../../components/Loader";
import { IMAGES } from "../../utils/constants";
import { ReportCard } from "../../components/Report.component";

const DayEndStatus = ({ isManager = false, tab = "my", setTab }) => {
  const { currentUser } = useAuth();
  const { limit } = useTheme();
  const [loadingStates, setLoadingStates] = useState(true);
  const [states, setStates] = useState(null);
  const [isShowusers, setIsShowUsers] = useState(true);
  const [loadingUsers, setLoadingusers] = useState(true);
  const [users, setUsers] = useState([]);
  const [loadingSelectedData, setLoadingSelectedData] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserData, setSelectedUserData] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const userId = currentUser?.userId;

  useEffect(() => {
    setLoadingStates(true);
    const unsub = listenReportsStates((data) => {
      setStates(data);
      setLoadingStates(false);
    });
    return () => unsub && unsub();
  }, []);

  useEffect(() => {
    if (!userId) return;
    setLoadingusers(true);
    const unsub = listenAllUsersWithReports(userId, (data) => {
      setUsers(data);
      setLoadingusers(false);
    });

    return () => unsub && unsub();
  }, [currentUser]);

  useEffect(() => {
    if (!selectedUser) return;
    setLoadingSelectedData(true);
    const unsub = listenSelectedUserReports(
      selectedUser?.userId,
      (data) => {
        setSelectedUserData(data.reports);
        setLastDoc(data.lastDoc);
        setLoadingSelectedData(false);
      },
      limit,
    );

    return () => unsub && unsub();
  }, [selectedUser]);

  useEffect(() => {
    if (!selectedUser?.userId || !userId || !selectedUserData?.length) return;
    selectedUserData.forEach((rep) => {
      markReportSeen(selectedUser.userId, rep.id, userId);
    });
  }, [selectedUserData, selectedUser, userId]);

  const fetchReports = async (reset = false) => {
    try {
      if (reset) {
        setSelectedUserData([]);
        setLoadingSelectedData(true);
        setLastDoc(null);
        setHasMore(true);
      } else {
        setLoadMoreLoading(true);
      }

      const res = await loadMoreReports(
        selectedUser?.userId,
        reset ? null : lastDoc,
        limit,
      );
      const newReports = res?.reports || [];
      const newLastDoc = res?.lastDoc || null;

      setSelectedUserData((prev) =>
        reset ? newReports : [...prev, ...newReports],
      );

      setLastDoc(newLastDoc);
      if (newReports.length < limit || !newLastDoc) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSelectedData(false);
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
        style={{ margin: "30px 0px" }}
        className="custom-dashboard-stats-container"
      >
        <StatesCard
          icon={Users}
          iColor="var(--card-foreground)"
          title="Total Users"
          value={states?.totalUsers || 0}
          loading={loadingStates}
        />
        <StatesCard
          icon={CircleCheck}
          iColor="var(--card-foreground)"
          title="Submitted Today"
          value={states?.reported || 0}
          loading={loadingStates}
        />
        <StatesCard
          icon={CircleAlert}
          iColor="var(--card-foreground)"
          title="Pending"
          value={states?.pending || 0}
          loading={loadingStates}
        />
        <StatesCard
          icon={TrendingUp}
          iColor="var(--card-foreground)"
          title="Submission Rate"
          value={`${states?.submissionRate || 0}%`}
          loading={loadingStates}
        />
      </div>
      <div
        style={{ position: "relative", width: "100%", minHeight: "80vh" }}
        className="admin-attendance-main"
      >
        <div
          className={`admin-attendance-users-panel admin-report-users-panel ${isShowusers ? "show" : ""}`}
        >
          <button
            onClick={() => setIsShowUsers(!isShowusers)}
            className="admin-report-users-panel-controller"
          >
            {isShowusers ? <ChevronLeft /> : <ChevronRight />}
          </button>
          <h3>Users</h3>

          <div
            style={{ overflow: "auto", flex: 1 }}
            className="attendance-users-list"
          >
            {loadingUsers ? (
              <Loader style={{ minHeight: "300px" }} />
            ) : users?.length > 0 ? (
              users.map((u) => (
                <div
                  key={u.userId}
                  className={`attendance-user-item ${
                    selectedUser?.userId === u.userId ? "active" : ""
                  }`}
                  onClick={() => {
                    setSelectedUser(u);
                    setIsShowUsers(false);
                  }}
                >
                  <ProfileImage
                    Image={
                      u?.profileImage ||
                      IMAGES[u?.placeId] ||
                      IMAGES.PlaceHolder
                    }
                    bg="var(--primary-hover)"
                    borderC="var(--primary)"
                    className="attendance-user-item-profile"
                  />
                  <div className="attendance-user-item-content">
                    <strong className="elepsis">{u?.fullName || "N/A"}</strong>
                    <p className="elepsis">{u?.email || "N/A"}</p>
                  </div>

                  {u.unseenCount > 0 && (
                    <span className="attendance-badge">{u.unseenCount}</span>
                  )}
                </div>
              ))
            ) : (
              <div className="empty-data">No users found.</div>
            )}
          </div>
        </div>
        {!selectedUser ? (
          <div className="attendance-selection">
            <Users size={40} />
            <h3>Select a member</h3>
            <p>Choose a member from the list to view their reports details</p>
          </div>
        ) : (
          <div className="day-end-list">
            <div className="day-end-list-header">
              <ProfileImage
                Image={
                  selectedUser?.profileImage ||
                  IMAGES[selectedUser?.placeId] ||
                  IMAGES.PlaceHolder
                }
                bg="var(--primary-hover)"
                borderC="var(--primary)"
                className="day-end-list-header-user-profile"
              />
              <div className="day-end-list-header-user-content">
                <strong className="elepsis">
                  {selectedUser?.fullName || "N/A"}
                </strong>
                <p className="elepsis">{selectedUser?.email || "N/A"}</p>
              </div>
            </div>
            {loadingSelectedData ? (
              <Loader style={{ height: "50vh" }} />
            ) : selectedUserData?.length > 0 ? (
              selectedUserData?.map((rep, index) => {
                return <ReportCard key={index} report={rep} />;
              })
            ) : (
              <p className="empty-data">No reports found.</p>
            )}
            <LoadMore
              loading={loadMoreLoading}
              disabled={loadMoreLoading}
              show={
                (hasMore || loadMoreLoading) &&
                !loadingSelectedData &&
                selectedUser &&
                selectedUserData?.length >= limit
              }
              onLoad={handleLoadMore}
              style={{ marginBottom: "10px", marginTop: "10px" }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DayEndStatus;
