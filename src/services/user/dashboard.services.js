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

const getCurrentWeek = () => {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + diffToMonday);
  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    week.push(formatLocalDate(d));
  }
  return week;
};

const chunkIntoWeeks = (arr) => {
  const weeks = [];

  for (let i = 0; i < arr.length; i += 7) {
    weeks.push(arr.slice(i, i + 7));
  }

  return weeks;
};

const parseHoursToDecimal = (timeStr) => {
  if (!timeStr) return 0;

  const hourMatch = timeStr.match(/(\d+)h/);
  const minMatch = timeStr.match(/(\d+)m/);

  const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
  const minutes = minMatch ? parseInt(minMatch[1], 10) : 0;

  if (minutes === 0) return hours;

  return parseFloat(`${hours}.${minutes}`);
};

const fetchUserAttendance = async (userId, start, end) => {
  const snap = await getDocs(
    query(
      collection(db, "Attendance"),
      where("userId", "==", userId),
      where("createdAt", ">=", start),
      where("createdAt", "<=", end),
    ),
  );

  return snap.docs.map((d) => d.data());
};

const fetchUserLeaves = async (userId, lastDays) => {
  const snap = await getDocs(
    query(
      collection(db, "leaveRequests"),
      where("leaveDateKeys", "array-contains-any", lastDays),
    ),
  );

  return snap.docs.map((d) => d.data()).filter((d) => d.createdBy === userId);
};

const processLeaves = (data, start, end, lastDays) => {
  const leaveType = {
    Pending: 0,
    Approved: 0,
    Rejected: 0,
  };

  const lastDaysSet = new Set(lastDays);

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

  return Object.entries(leaveType).map(([key, value]) => ({
    key,
    value,
  }));
};

const buildMonthlyTrend = (attendanceMap, start, end) => {
  const allDays = [];

  let temp = new Date(start);
  while (temp <= end) {
    allDays.push(formatLocalDate(temp));
    temp.setDate(temp.getDate() + 1);
  }

  const weeks = chunkIntoWeeks(allDays);

  return weeks.map((week, i) => {
    let Count = 0;

    week.forEach((day) => {
      if (attendanceMap[day]?.type === "present") {
        Count++;
      }
    });

    return {
      key: `W${i + 1}`,
      Count,
    };
  });
};

const buildMonthStates = (data) => {
  let daysPresent = 0;
  let leavesTaken = 0;
  let absentDays = 0;

  data.forEach((item) => {
    if (item.type === "present") daysPresent++;
    if (item.type === "leave" && item.status === "leave") leavesTaken++;
    if (item.type === "absent") absentDays++;
  });

  const total = daysPresent + leavesTaken + absentDays;

  return {
    daysPresent,
    leavesTaken,
    absentDays,
    attendanceRate: total
      ? Number(((daysPresent / total) * 100).toFixed(1))
      : 0,
  };
};

const buildWeeklyWorkHours = (data) => {
  const weekDays = getCurrentWeek();

  const map = {};

  weekDays.forEach((d) => {
    map[d] = 0;
  });

  data.forEach((item) => {
    const date = formatLocalDate(item.createdAt.toDate());

    if (map[date] !== undefined) {
      map[date] += parseHoursToDecimal(item.hours);
    }
  });

  return weekDays.map((day) => ({
    Day: formatDay(day),
    Hour: map[day] || 0,
  }));
};

export const getUserDashboard = async (userId) => {
  try {
    const { start, end } = getMonthRange();
    const last7Days = getLast7Days();
    const [attendanceRaw, leaveRaw] = await Promise.all([
      fetchUserAttendance(userId, start, end),
      fetchUserLeaves(userId, last7Days),
    ]);

    const attendance = buildMonthStates(attendanceRaw);
    const weeklyWorkHours = buildWeeklyWorkHours(attendanceRaw);
    const leaveTypeDistribution = processLeaves(
      leaveRaw,
      start,
      end,
      last7Days,
    );

    const attendanceMap = {};
    attendanceRaw.forEach((item) => {
      const date = formatLocalDate(item.createdAt.toDate());
      attendanceMap[date] = item;
    });
    const monthlyAttendanceTrend = buildMonthlyTrend(attendanceMap, start, end);

    return {
      States: {
        daysPresent: attendance.daysPresent,
        leavesTaken: attendance.leavesTaken,
        absentDays: attendance.absentDays,
        attendanceRate: attendance.attendanceRate,
      },
      weeklyWorkHours,
      leaveTypeDistribution,
      monthlyAttendanceTrend,
    };
  } catch (error) {
    console.error("User Dashboard Error:", error);
    throw error;
  }
};

const weeklyWorkHours = [
  { Day: "Mon", Hour: 0 },
  { Day: "Tue", Hour: 0 },
  { Day: "Wed", Hour: 0 },
  { Day: "Thu", Hour: 0 },
  { Day: "Fri", Hour: 0 },
  { Day: "Sat", Hour: 0 },
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
};
