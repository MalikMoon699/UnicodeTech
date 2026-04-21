import React, { useState, useEffect } from "react";
import "../../assets/style/Attendance.css";
import {
  Header,
  ProfileImage,
  StatesCard,
} from "../../components/CustomComponents";
import { Users, UserCheck, UserMinus, AlarmClock } from "lucide-react";
import MyAttendance from "../../pages/user/Attendance";
import { useAuth } from "../../context/AuthContext";
import {
  listenAllUsersWithAttendance,
  listenAttendanceStats,
  listenSelectedUserMonthly,
} from "../../services/manager/attendance.services";
import { IMAGES } from "../../utils/constants";
import Loader from "../../components/Loader";
import { AttenDanceCalender } from "../../components/Attendance.components";

const Attendance = () => {
  const [tab, setTab] = useState("my");
  const { currentUser } = useAuth();
  const [stateloading, setStateLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [calenderLoading, setCalenderLoading] = useState(true);
  const [states, setStates] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedUser, setSelectedUser] = useState(null);
  const [calendarData, setCalendarData] = useState({});
  const userId = currentUser?.userId;

  useEffect(() => {
    if (!userId || tab === "my") return;

    setLoading(true);

    const unsub = listenAllUsersWithAttendance(userId, (data, ready) => {
      setUsers(data);
      if (ready) setLoading(false);
    });

    return () => unsub && unsub();
  }, [userId, tab]);

  useEffect(() => {
    if (!userId || tab === "my") return;
    setLoading(true);
    const unsub = listenAttendanceStats((data) => {
      setStates(data);
      if (data.isFirstLoad) setStateLoading(false);
    });

    return () => unsub && unsub();
  }, [userId, tab]);

  useEffect(() => {
    if (!selectedUser || !userId || tab === "my") return;
    setCalenderLoading(true);

   const unsub = listenSelectedUserMonthly(
     selectedUser.userId,
     selectedDate,
     userId,
     (data, isFirstLoad) => {
       setCalendarData(data);
       if (isFirstLoad) setCalenderLoading(false);
     },
   );
    return () => unsub && unsub();
  }, [selectedUser, selectedDate, userId, tab]);

  return (
    <div className="page-container">
      <Header
        title="Attendance"
        desc="Track your daily attendance"
        isTab={true}
        tabState={tab}
        setTabState={setTab}
        tabOptions={[
          { label: "My", value: "my", icon: Users },
          { label: "Users", value: "users", icon: Users },
        ]}
        tabOuterWidth="fit-content"
      />
      {tab === "my" ? (
        <MyAttendance isManager={true} />
      ) : (
        <div className="page-container">
          <div
            style={{ margin: "30px 0px" }}
            className="custom-dashboard-stats-container"
          >
            <StatesCard
              icon={Users}
              iColor="var(--card-foreground)"
              title="Total Users"
              value={users?.length || 0}
              loading={loading || loading}
            />
            <StatesCard
              icon={UserCheck}
              iColor="var(--card-foreground)"
              title="Present"
              value={states?.present || 0}
              loading={stateloading || loading}
            />
            <StatesCard
              icon={AlarmClock}
              iColor="var(--card-foreground)"
              title="Late"
              value={states?.late || 0}
              loading={stateloading || loading}
            />
            <StatesCard
              icon={UserMinus}
              iColor="var(--card-foreground)"
              title="Leave"
              value={states?.leave || 0}
              loading={stateloading || loading}
            />
          </div>
          <div className="admin-attendance-main">
            <div className="admin-attendance-users-panel">
              <h3>Users</h3>
              <div className="attendance-users-list">
                {loading ? (
                  <Loader style={{ minHeight: "300px" }} />
                ) : users?.length > 0 ? (
                  users.map((u) => (
                    <div
                      key={u.userId}
                      className={`attendance-user-item ${
                        selectedUser?.userId === u.userId ? "active" : ""
                      }`}
                      onClick={() => setSelectedUser(u)}
                    >
                      <ProfileImage
                        Image={u?.profileImage || IMAGES.PlaceHolder}
                        bg="var(--primary-hover)"
                        borderC="var(--primary)"
                        className="attendance-user-item-profile"
                      />
                      <div className="attendance-user-item-content">
                        <strong className="elepsis">
                          {u?.fullName || "N/A"}
                        </strong>
                        <p className="elepsis">{u?.email || "N/A"}</p>
                      </div>

                      {u.unseenCount > 0 && (
                        <span className="attendance-badge">
                          {u.unseenCount}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ minHeight: "300px" }} className="empty-data">
                    No users found.
                  </div>
                )}
              </div>
            </div>
            {selectedUser || loading ? (
              <AttenDanceCalender
                loading={calenderLoading || loading}
                calendarData={calendarData}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
              />
            ) : (
              <div className="attendance-selection">
                <Users size={40} />
                <h3>Select a member</h3>
                <p>
                  Choose a member from the list to view their attendance details
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
