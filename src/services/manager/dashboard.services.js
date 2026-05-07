import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../utils/FirebaseConfig";

const formatLocalDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatDay = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
  });

const getLast7Days = () => {
  const today = new Date();
  const arr = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    arr.push(formatLocalDate(d));
  }

  return arr;
};

const getMonthRange = () => {
  const now = new Date();

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const getMonthDays = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const days = [];

  let temp = new Date(start);
  while (temp <= end) {
    days.push(formatLocalDate(temp));
    temp.setDate(temp.getDate() + 1);
  }

  return { days, start, end };
};

const chunkArray = (arr, size = 30) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const toSet = (arr) => new Set(arr);

const fetchTeamUsers = async () => {
  const snap = await getDocs(
    query(
      collection(db, "UserIndex"),
      where("role", "==", "user"),
      where("status", "==", "active"),
    ),
  );

  const ids = snap.docs.map((d) => d.data().docId);
  return ids;
};

const fetchTeamAttendance = async (teamSet) => {
  const snap = await getDocs(collection(db, "Attendance"));

  return snap.docs.map((d) => d.data()).filter((d) => teamSet.has(d.userId));
};

const buildAttendanceWeekly = (data, last7Days, todayStr, totalUsers) => {
  const map = {};
  last7Days.forEach((d) => (map[d] = { Present: 0, Absent: 0, Leave: 0 }));

  let presentToday = 0;
  let absentToday = 0;

  data.forEach((d) => {
    const date = d.date;

    if (!map[date]) return;

    map[date][d.type.charAt(0).toUpperCase() + d.type.slice(1)]++;

    if (date === todayStr) {
      if (d.type === "present") presentToday++;
      if (d.type === "absent") absentToday++;
    }
  });

  const pendingToday = Math.max(0, totalUsers - (presentToday + absentToday));
  const weekly = last7Days.map((day) => ({
    Day: formatDay(day),
    ...map[day],
  }));

  return { weekly, presentToday, absentToday, pendingToday };
};

const fetchTeamLeaves = async (teamSet) => {
  const { days } = getMonthDays();

  const chunks = chunkArray(days, 30);

  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const snap = await getDocs(
        query(
          collection(db, "leaveRequests"),
          where("leaveDateKeys", "array-contains-any", chunk),
        ),
      );

      return snap.docs.map((d) => d.data());
    }),
  );

  return results.flat().filter((d) => teamSet.has(d.createdBy));
};
const buildLeaveStats = (data, start, end) => {
  const leaveType = {
    Pending: 0,
    Approved: 0,
    Rejected: 0,
  };

  data.forEach((item) => {
    item.dates?.forEach((d) => {
      const date = formatLocalDate(new Date(d.date));

      if (date >= formatLocalDate(start) && date <= formatLocalDate(end)) {
        if (d.status === "pending") leaveType.Pending++;
        else if (d.status === "approved") leaveType.Approved++;
        else if (d.status === "rejected") leaveType.Rejected++;
      }
    });
  });

  return Object.entries(leaveType).map(([key, Count]) => ({
    key,
    Count,
  }));
};

const fetchTeamReports = async (teamIds, start, end) => {
  const results = await Promise.all(
    teamIds.map(async (id) => {
      const snap = await getDocs(
        query(
          collection(db, "Reports", id, "reports"),
          where("createdAt", ">=", start),
          where("createdAt", "<=", end),
        ),
      );

      return snap.docs.map((d) => d.data());
    }),
  );

  return results.flat();
};

const buildReportWeekly = (data, last7Days, todayStr) => {
  const map = {};
  last7Days.forEach((d) => (map[d] = 0));

  let todayCount = 0;

  data.forEach((d) => {
    const date = formatLocalDate(d.createdAt.toDate());

    if (map[date] !== undefined) {
      map[date]++;
    }

    if (date === todayStr) {
      todayCount++;
    }
  });

  const weekly = last7Days.map((day) => ({
    Day: formatDay(day),
    Count: map[day],
  }));

  return { weekly, todayCount };
};

export const getManagerDashboard = async () => {
  try {
    const todayStr = formatLocalDate(new Date());
    const last7Days = getLast7Days();
    const { start, end } = getMonthRange();

    const teamUserIds = await fetchTeamUsers();
    const teamSet = toSet(teamUserIds);

    const [attendanceRaw, leaveRaw, reportRaw] = await Promise.all([
      fetchTeamAttendance(teamSet),
      fetchTeamLeaves(teamSet, last7Days),
      fetchTeamReports(teamUserIds, start, end),
    ]);

    const attendance = buildAttendanceWeekly(
      attendanceRaw,
      last7Days,
      todayStr,
      teamUserIds.length,
    );

    const leaveTypeDistribution = buildLeaveStats(leaveRaw, start, end);

    const report = buildReportWeekly(reportRaw, last7Days, todayStr);

    return {
      teamStates: {
        totalUsers: teamUserIds.length,
        presentToday: attendance.presentToday,
        absentToday: attendance.absentToday,
        pendingToday: attendance.pendingToday,
        statusReports: report.todayCount,
      },

      teamAttendanceWeekly: attendance.weekly,

      teamLeaveTypeDistribution: leaveTypeDistribution,

      teamReportSubmistionWeekly: report.weekly,
    };
  } catch (error) {
    console.error("Manager Dashboard Error:", error);
    throw error;
  }
};

const teamAttendanceWeekly = [
  { Day: "Mon", Present: 0, Absent: 0, Leave: 0 },
  { Day: "Tue", Present: 0, Absent: 0, Leave: 0 },
  { Day: "Wed", Present: 0, Absent: 0, Leave: 0 },
  { Day: "Thr", Present: 0, Absent: 0, Leave: 0 },
  { Day: "Fri", Present: 0, Absent: 0, Leave: 0 },
];

const teamReportSubmistionWeekly = [
  { Day: "Mon", Count: 0 },
  { Day: "Tue", Count: 0 },
  { Day: "Wed", Count: 0 },
  { Day: "Thr", Count: 0 },
  { Day: "Fri", Count: 0 },
];

const weeklyWorkHours = [
  { Day: "Mon", Hour: 0 },
  { Day: "Tue", Hour: 0 },
  { Day: "Wed", Hour: 0 },
  { Day: "Thr", Hour: 0 },
  { Day: "Fri", Hour: 0 },
  { Day: "Sun", Hour: 0 },
];

const leaveTypeDistribution = [
  { key: "Pending", value: 0 },
  { key: "Approved", value: 0 },
  { key: "Rejected", value: 0 },
];

const monthlyAttendanceTrend = [
  { key: "W1", Count: 0 },
  { key: "W2", Count: 0 },
  { key: "W3", Count: 0 },
  { key: "W4", Count: 0 },
];

export const fallBacks = {
  weeklyWorkHours,
  leaveTypeDistribution,
  monthlyAttendanceTrend,
  teamAttendanceWeekly,
  teamReportSubmistionWeekly,
};
