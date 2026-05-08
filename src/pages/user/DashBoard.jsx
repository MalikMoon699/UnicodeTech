import React, { useEffect, useState } from "react";
import {
  Header,
  QuickActionCard,
  StatesCard,
} from "../../components/CustomComponents";
import { ChartCard } from "../../components/ChartsComponents";
import {
  getUserDashboard,
  fallBacks,
} from "../../services/user/dashboard.services";
import {
  CalendarCheck,
  CalendarDays,
  CalendarMinus2,
  Clock,
  FileText,
  Percent,
  RefreshCcw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useDispatch, useSelector } from "react-redux";
import { setUserDashBoardData } from "../../store/features/UserDashboard.reducer";
import { toast } from "sonner";

const DashBoard = () => {
  const dispatch = useDispatch();
  const {
    statesLocal,
    weeklyHourLocal,
    leaveDistributionLocal,
    attendanceTrendLocal,
    lastFetchedLocal,
  } = useSelector((state) => state.userDashboard);
  const { currentUser } = useAuth();
  const userId = currentUser?.userId;
  const [loading, setLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  
  const hasStatesData = statesLocal !== null;
  const hasWeeklyHourData = weeklyHourLocal?.length > 0;
  const hasLeaveDistributionData = leaveDistributionLocal?.length > 0;
  const hasAttendanceTrendData = attendanceTrendLocal?.length > 0;
  const FIVE_HOUR = 5 * 60 * 60 * 1000;
  const hasData =
    hasStatesData ||
    hasWeeklyHourData ||
    hasLeaveDistributionData ||
    hasAttendanceTrendData;

  useEffect(() => {
    if (!userId) return;
    const isCacheValid =
    lastFetchedLocal && Date.now() - lastFetchedLocal < FIVE_HOUR;
    if (isCacheValid && hasData) {
      return;
    } else {
      getData(userId);
    }
  }, [userId]);

  const getData = async (userId, refresh = false) => {
    if (!userId) return console.err("UserId required.");
    try {
      if (refresh) setRefreshLoading(true);
      else setLoading(true);
      const res = await getUserDashboard(userId);
      const payload = {
        statesLocal: res?.States,
        weeklyHourLocal: res?.weeklyWorkHours,
        leaveDistributionLocal: res?.leaveTypeDistribution,
        attendanceTrendLocal: res?.monthlyAttendanceTrend,
        lastFetchedLocal: Date.now(),
      };
      dispatch(setUserDashBoardData(payload));
      if (refresh) toast.success("data refreshed successfully.");
    } catch (err) {
      console.error("Failed to load Dashboard:", err);
    } finally {
      setLoading(false);
      setRefreshLoading(false);
    }
  };

    const states = statesLocal;
    const weeklyHour = weeklyHourLocal;
    const leaveDistribution = leaveDistributionLocal;
    const attendanceTrend = attendanceTrendLocal;

  return (
    <div className="page-container">
      <Header
        title="Welcome back 👋"
        desc="Here's how your month is shaping up."
        context={
          <button
            onClick={() => getData(userId, true)}
            className="leave-submit-btn"
          >
            <span className={`icon ${refreshLoading ? "refresh-loading" : ""}`}>
              <RefreshCcw size={18} />
            </span>
            Refresh
          </button>
        }
      />
      <div
        style={{ margin: "30px 0px" }}
        className="custom-dashboard-stats-container"
      >
        <StatesCard
          icon={CalendarCheck}
          iColor="var(--status-approved)"
          title="Days Present"
          value={states?.daysPresent || 0}
          loading={loading}
        />
        <StatesCard
          icon={CalendarDays}
          iColor="var(--status-pending)"
          title="Leaves Taken"
          value={states?.leavesTaken || 0}
          loading={loading}
        />
        <StatesCard
          icon={CalendarMinus2}
          iColor="var(--status-rejected)"
          title="Absent Days"
          value={states?.absentDays || 0}
          loading={loading}
        />
        <StatesCard
          icon={Percent}
          iColor="var(--status-approved)"
          title="Attendance Rate"
          value={`${states?.attendanceRate || 0}%`}
          loading={loading}
        />
      </div>
      <div className="charts-wrapper">
        <ChartCard
          title="Weekly Work Hours"
          chartType="bar"
          ChartData={
            weeklyHour?.length > 0 ? weeklyHour : fallBacks.weeklyWorkHours
          }
          loading={loading}
        />
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
