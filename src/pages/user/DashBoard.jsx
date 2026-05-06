import React, { useEffect, useState } from "react";
import {
  Header,
  QuickActionCard,
  StatesCard,
} from "../../components/CustomComponents";
import { ChartCard } from "../../components/ChartsComponents";
import {
  getUserDashboard,fallBacks
} from "../../services/user/dashboard.services";
import {
  CalendarCheck,
  CalendarDays,
  CalendarMinus2,
  Clock,
  FileText,
  Percent,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const DashBoard = () => {
  const { currentUser } = useAuth();
  const userId = currentUser?.userId;
  const [loading, setoading] = useState(false);
  const [states, setStates] = useState(null);
  const [weeklyHour, setWeeklyHour] = useState([]);
  const [leaveDistribution, setLeaveDistribution] = useState([]);
  const [attendanceTrend, setatAtendanceTrend] = useState([]);

  useEffect(() => {
    getData(userId);
  }, [userId]);

  const getData = async (userId) => {
    try {
      setoading(true);
      const res = await getUserDashboard(userId);
      setStates(res?.States);
      setWeeklyHour(res?.weeklyWorkHours);
      setLeaveDistribution(res?.leaveTypeDistribution);
      setatAtendanceTrend(res?.monthlyAttendanceTrend);
    } catch (err) {
      console.error("Failed to load Dashboard:", err);
    } finally {
      setoading(false);
    }
  };

  return (
    <div className="page-container">
      <Header
        title="Welcome back 👋"
        desc="Here's how your month is shaping up."
      />
      <div
        style={{ margin: "30px 0px" }}
        className="custom-dashboard-stats-container"
      >
        <StatesCard
          icon={CalendarCheck}
          iColor="var(--card-foreground)"
          title="Days Present"
          value={states?.daysPresent || 0}
          loading={loading}
        />
        <StatesCard
          icon={CalendarDays}
          iColor="var(--card-foreground)"
          title="Leaves Taken"
          value={states?.leavesTaken || 0}
          loading={loading}
        />
        <StatesCard
          icon={CalendarMinus2}
          iColor="var(--card-foreground)"
          title="Absent Days"
          value={states?.absentDays || 0}
          loading={loading}
        />
        <StatesCard
          icon={Percent}
          iColor="var(--card-foreground)"
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
