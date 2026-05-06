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
  Users,
} from "lucide-react";

const DashBoard = () => {
  const [loading, setoading] = useState(false);
  const [dayFilter, setDayFilter] = useState(7);
  const [states, setStates] = useState(null);
  const [leaveDistribution, setLeaveDistribution] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [report, setReport] = useState([]);

  useEffect(() => {
    getData(dayFilter);
  }, [dayFilter]);

  const getData = async (days) => {
    try {
      setoading(true);
      const res = await getDashboardData(days);
      setStates(res?.States);
      setAttendance(res?.attendanceTrend);
      setLeaveDistribution(res?.leaveTypeDistribution);
      setReport(res?.reportSubmistion);
    } catch (err) {
      console.error("Failed to load Dashboard:", err);
    } finally {
      setoading(false);
    }
  };

  return (
    <div className="page-container">
      <Header
        title="Admin overview"
        desc="Here’s your system current progress."
        context={
          <Selector
            filter={dayFilter}
            setFilter={setDayFilter}
            options={[
              { filter: 7, label: "Last 7 days" },
              { filter: 30, label: "Last 30 days" },
            ]}
            width="170px"
          />
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
          iColor="var(--card-foreground)"
          title="Total Managers"
          value={states?.totalManagers || 0}
          loading={loading}
        />
        <StatesCard
          icon={CalendarCheck}
          iColor="var(--card-foreground)"
          title="Active Today"
          value={states?.activeToday || 0}
          loading={loading}
        />
        <StatesCard
          icon={CalendarClock}
          iColor="var(--card-foreground)"
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
