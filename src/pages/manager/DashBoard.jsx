import React, { useEffect, useState } from "react";
import {
  Header,
  QuickActionCard,
  StatesCard,
} from "../../components/CustomComponents";
import { ChartCard } from "../../components/ChartsComponents";
import {
  myStates,
  myWeeklyWorkHours,
  myLeaveTypeDistribution,
  myMonthlyAttendanceTrend,
  teamStates,
  teamAttendanceWeekly,
  teamLeaveTypeDistribution,
  teamReportSubmistionWeekly,
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

const DashBoard = () => {
  const [loading, setoading] = useState(false);
  const [isMy, setIsMy] = useState(true);
  const [states, setStates] = useState(myStates);
  const [weeklyHour, setWeeklyHour] = useState(myWeeklyWorkHours);
  const [leaveDistribution, setLeaveDistribution] = useState(
    myLeaveTypeDistribution,
  );
  const [attendanceTrend, setatAtendanceTrend] = useState(
    myMonthlyAttendanceTrend,
  );
  const [teamAttendance, setTeamAttendance] = useState(teamAttendanceWeekly);
  const [teamReport, setTeamReport] = useState(teamReportSubmistionWeekly);

  useEffect(() => {
    setStates(isMy ? myStates : teamStates);
    setLeaveDistribution(
      isMy ? myLeaveTypeDistribution : teamLeaveTypeDistribution,
    );
  }, [isMy]);

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
            ChartData={weeklyHour}
            loading={loading}
          />
        ) : (
          <ChartCard
            title="Team Attendance"
            chartType="area"
            ChartData={teamAttendance}
            loading={loading}
          />
        )}
        <ChartCard
          title="Monthly Leave Distribution"
          chartType="pie"
          ChartData={leaveDistribution}
          loading={loading}
        />
      </div>
      {isMy ? (
        <ChartCard
          title="Attendance Trend"
          chartType="area"
          ChartData={attendanceTrend}
          loading={loading}
        />
      ) : (
        <ChartCard
          title="Day-End Status Submission"
          chartType="v-bar"
          ChartData={teamReport}
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
