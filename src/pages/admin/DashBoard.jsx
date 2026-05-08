import React, { useEffect, useState } from "react";
import {
  Header,
  QuickActionCard,
  Selector,
  StatesCard,
} from "../../components/CustomComponents";
import { ChartCard } from "../../components/ChartsComponents";
import {
  getDashboardData,
  fallBacks,
} from "../../services/admin/dashboard.services";
import {
  Briefcase,
  CalendarCheck,
  CalendarClock,
  Clock,
  FileText,
  RefreshCcw,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import {
  setAdminDashBoardData,
  setAdmin30DayDashBoardData,
} from "../../store/features/AdminDashboard.reducer";

const DashBoard = () => {
  const dispatch = useDispatch();
  const {
    statesLocal,
    leaveDistributionLocal,
    attendanceLocal,
    reportLocal,
    lastFetchedLocal,

    states30DayLocal,
    leave30DayDistributionLocal,
    attendance30DayLocal,
    report30DayLocal,
    lastFetched30DayLocal,
  } = useSelector((state) => state.adminDashboard);
  const [loading, setLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [dayFilter, setDayFilter] = useState(7);
  const [states, setStates] = useState(null);
  const [leaveDistribution, setLeaveDistribution] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [report, setReport] = useState([]);
  const FIVE_HOUR = 5 * 60 * 60 * 1000;
  useEffect(() => {
    const is30 = dayFilter === 30;

    const isCacheValid = is30
      ? lastFetched30DayLocal && Date.now() - lastFetched30DayLocal < FIVE_HOUR
      : lastFetchedLocal && Date.now() - lastFetchedLocal < FIVE_HOUR;

    const hasData = is30 ? states30DayLocal : statesLocal;

    if (isCacheValid && hasData) {
      if (is30) {
        setStates(states30DayLocal);
        setAttendance(attendance30DayLocal);
        setLeaveDistribution(leave30DayDistributionLocal);
        setReport(report30DayLocal);
      } else {
        setStates(statesLocal);
        setAttendance(attendanceLocal);
        setLeaveDistribution(leaveDistributionLocal);
        setReport(reportLocal);
      }
      return;
    }

    getData(dayFilter);
  }, [dayFilter]);

  const getData = async (days, refresh = false) => {
    try {
      if (refresh) setRefreshLoading(true);
      else setLoading(true);

      const res = await getDashboardData(days);

      setStates(res?.States);
      setAttendance(res?.attendanceTrend);
      setLeaveDistribution(res?.leaveTypeDistribution);
      setReport(res?.reportSubmistion);

      if (days === 30) {
        dispatch(
          setAdmin30DayDashBoardData({
            states30DayLocal: res?.States,
            leave30DayDistributionLocal: res?.leaveTypeDistribution,
            attendance30DayLocal: res?.attendanceTrend,
            report30DayLocal: res?.reportSubmistion,
            lastFetched30DayLocal: Date.now(),
          }),
        );
      } else {
        dispatch(
          setAdminDashBoardData({
            statesLocal: res?.States,
            leaveDistributionLocal: res?.leaveTypeDistribution,
            attendanceLocal: res?.attendanceTrend,
            reportLocal: res?.reportSubmistion,
            lastFetchedLocal: Date.now(),
          }),
        );
      }

      if (refresh) toast.success("data refreshed successfully.");
    } catch (err) {
      console.error("Failed to load Dashboard:", err);
    } finally {
      setLoading(false);
      setRefreshLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Header
        title="Admin overview"
        desc="Here’s your system current progress."
        context={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "end",
              gap: "5px",
            }}
          >
            <button
              onClick={() => getData(dayFilter, true)}
              className="leave-submit-btn"
            >
              <span
                className={`icon ${refreshLoading ? "refresh-loading" : ""}`}
              >
                <RefreshCcw size={18} />
              </span>
              Refresh
            </button>
            <Selector
              filter={dayFilter}
              setFilter={setDayFilter}
              disabled={loading}
              options={[
                { filter: 7, label: "Last 7 days" },
                { filter: 30, label: "Last 30 days" },
              ]}
              width="170px"
            />
          </div>
        }
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
          loading={loading}
        />
        <StatesCard
          icon={Briefcase}
          iColor="var(--primary)"
          title="Total Managers"
          value={states?.totalManagers || 0}
          loading={loading}
        />
        <StatesCard
          icon={CalendarCheck}
          iColor="var(--status-approved)"
          title="Active Today"
          value={states?.activeToday || 0}
          loading={loading}
        />
        <StatesCard
          icon={CalendarClock}
          iColor="var(--status-pending)"
          title="Pending Leaves"
          value={states?.pendingLeavesToday || 0}
          loading={loading}
        />
      </div>
      <div className="charts-wrapper">
        <ChartCard
          title="Attendance Trend"
          chartType="area"
          ChartData={
            attendance?.length > 0 ? attendance : fallBacks.attendanceTrend
          }
          loading={loading}
        />
        <ChartCard
          title="Leave Distribution"
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
        title="Day-End Status Submission"
        chartType="v-bar"
        ChartData={report?.length > 0 ? report : fallBacks.reportSubmistion}
        contentStyle={{ marginLeft: "-42px" }}
        height={300}
        loading={loading}
      />
      <div className="dashboard-quick-action-container chart-container">
        <div className="chart-header">
          <h2>Quick Actions</h2>
        </div>
        <div className="dashboard-quick-action-content">
          <QuickActionCard
            icon={Users}
            title="Manage Users"
            link="/admin/users"
          />
          <QuickActionCard
            icon={Clock}
            title="Review Attendance"
            link="/admin/attendance"
          />
          <QuickActionCard
            icon={FileText}
            title="Review Reports"
            link="/admin/day-end-status"
          />
        </div>
      </div>
    </div>
  );
};

export default DashBoard;
