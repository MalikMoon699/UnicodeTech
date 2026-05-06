import React, { useState } from "react";
import { Header, QuickActionCard, StatesCard } from "../../components/CustomComponents";
import { ChartCard } from "../../components/ChartsComponents";
import {
  weeklyWorkHours,
  States,
  leaveTypeDistribution,
  monthlyAttendanceTrend,
} from "../../services/user/dashboard.services";
import {
  CalendarCheck,
  CalendarDays,
  CalendarMinus2,
  Clock,
  FileText,
  Percent,
} from "lucide-react";

const DashBoard = () => {
  const [loading, setoading] = useState(false);
  const [states, setStates] = useState(States);
  const [weeklyHour, setWeeklyHour] = useState(weeklyWorkHours);
  const [leaveDistribution, setLeaveDistribution] = useState(
    leaveTypeDistribution,
  );
  const [attendanceTrend, setatAtendanceTrend] = useState(
    monthlyAttendanceTrend,
  );

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
          ChartData={weeklyHour}
          loading={loading}
        />
        <ChartCard
          title="Monthly Leave Distribution"
          chartType="pie"
          ChartData={leaveDistribution}
          loading={loading}
        />
      </div>
      <ChartCard
        title="Attendance Trend"
        chartType="area"
        ChartData={attendanceTrend}
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
