import React, { useEffect, useState } from "react";
import {
  Header,
  QuickActionCard,
  StatesCard,
} from "../../components/CustomComponents";
import { ChartCard } from "../../components/ChartsComponents";
import {
  fallBacks,
  getManagerDashboard,
} from "../../services/manager/dashboard.services";
import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarMinus2,
  Clock,
  FileText,
  Percent,
  User,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getUserDashboard } from "../../services/user/dashboard.services";

const DashBoard = () => {
  const { currentUser } = useAuth();
  const userId = currentUser?.userId;
  const [loading, setLoading] = useState(false);
  const [isMy, setIsMy] = useState(true);
  const [states, setStates] = useState(null);
  const [weeklyHour, setWeeklyHour] = useState([]);
  const [leaveDistribution, setLeaveDistribution] = useState([]);
  const [attendanceTrend, setAttendanceTrend] = useState([]);
  const [teamAttendance, setTeamAttendance] = useState([]);
  const [teamReport, setTeamReport] = useState([]);

  useEffect(() => {
    if (userId) {
      getData(userId);
    }
  }, [userId, isMy]);

  const getData = async (userId) => {
    try {
      setLoading(true);

      if (isMy) {
        const res = await getUserDashboard(userId);
        setStates(res?.States);
        setWeeklyHour(res?.weeklyWorkHours);
        setLeaveDistribution(res?.leaveTypeDistribution);
        setAttendanceTrend(res?.monthlyAttendanceTrend);
      } else {
        const res = await getManagerDashboard(userId);
        setStates(res?.teamStates);
        setTeamAttendance(res?.teamAttendanceWeekly);
        setLeaveDistribution(res?.teamLeaveTypeDistribution);
        setTeamReport(res?.teamReportSubmistionWeekly);
      }
    } catch (err) {
      console.error("Failed to load Dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Header
        title={isMy ? "Welcome back 👋" : "Team overview"}
        desc={
          isMy
            ? "Here's how your month is shaping up."
            : "Here’s your team's current progress."
        }
        isTab={true}
        tabDisabled={loading}
        tabState={isMy}
        setTabState={setIsMy}
        tabOptions={[
          { label: "My", value: true, icon: User },
          { label: "Team", value: false, icon: Users },
        ]}
        tabOuterWidth="fit-content"
      />
      <div
        style={{ margin: "30px 0px" }}
        className="custom-dashboard-stats-container"
      >
        <StatesCard
          icon={CalendarCheck}
          iColor="var(--card-foreground)"
          title={isMy ? "Days Present" : "Present Today"}
          value={
            isMy
              ? states?.daysPresent
              : `${states?.presentToday || 0}/${states?.totalUsers || 0}` || 0
          }
          loading={loading}
        />
        <StatesCard
          icon={isMy ? CalendarDays : CalendarClock}
          iColor="var(--card-foreground)"
          title={isMy ? "Leaves Taken" : "Pending Today"}
          value={
            isMy
              ? states?.leavesTaken
              : `${states?.pendingToday || 0}/${states?.totalUsers || 0}` || 0
          }
          loading={loading}
        />
        <StatesCard
          icon={CalendarMinus2}
          iColor="var(--card-foreground)"
          title={isMy ? "Absent Days" : "Absent Today"}
          value={
            isMy
              ? states?.absentDays
              : `${states?.absentToday || 0}/${states?.totalUsers || 0}` || 0
          }
          loading={loading}
        />
        <StatesCard
          icon={isMy ? Percent : FileText}
          iColor="var(--card-foreground)"
          title={isMy ? "Attendance Rate" : "Status Reports"}
          value={
            isMy
              ? `${states?.attendanceRate || 0}%`
              : `${states?.statusReports || 0}/${states?.totalUsers || 0}`
          }
          loading={loading}
        />
      </div>
      <div className="charts-wrapper">
        {isMy ? (
          <ChartCard
            title="Weekly Work Hours"
            chartType="bar"
            ChartData={
              weeklyHour?.length > 0 ? weeklyHour : fallBacks.weeklyWorkHours
            }
            loading={loading}
          />
        ) : (
          <ChartCard
            title="Team Attendance"
            chartType="area"
            ChartData={
              teamAttendance?.length > 0
                ? teamAttendance
                : fallBacks.teamAttendanceWeekly
            }
            loading={loading}
          />
        )}
        <ChartCard
          title="Monthly Leave Distribution"
          chartType="pie"
          ChartData={
            leaveDistribution?.length > 0
              ? leaveDistribution
              : fallBacks.leaveTypeDistribution
          }
          loading={loading}
        />
      </div>
      {isMy ? (
        <ChartCard
          title="Attendance Trend"
          chartType="area"
          ChartData={
            attendanceTrend?.length > 0
              ? attendanceTrend
              : fallBacks.monthlyAttendanceTrend
          }
          loading={loading}
        />
      ) : (
        <ChartCard
          title="Day-End Status Submission"
          chartType="v-bar"
          ChartData={
            teamReport?.length > 0
              ? teamReport
              : fallBacks.teamReportSubmistionWeekly
          }
          contentStyle={{ marginLeft: "-42px" }}
          height={300}
          loading={loading}
        />
      )}
      <div className="dashboard-quick-action-container chart-container">
        <div className="chart-header">
          <h2>Quick Actions</h2>
        </div>
        <div className="dashboard-quick-action-content">
          <QuickActionCard
            icon={CalendarDays}
            title="Apply Leave"
            link="/leaves"
          />
          <QuickActionCard
            icon={Clock}
            title="Mark Attendance"
            link="/attendance"
          />
          <QuickActionCard
            icon={FileText}
            title="Submit Status"
            link="/day-end-status"
          />
        </div>
      </div>
    </div>
  );
};

export default DashBoard;
