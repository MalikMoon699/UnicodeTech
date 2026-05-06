import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../utils/FirebaseConfig";

const formatLocalDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getLast7Days = () => {
  const today = new Date();
  const days = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    days.push(formatLocalDate(d));
  }

  return days.reverse();
};

const getMonthRange = () => {
  const now = new Date();

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const formatDay = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-US", { weekday: "short" });

const chunkIntoWeeks = (daysArray) => {
  const weeks = [];
  for (let i = 0; i < daysArray.length; i += 7) {
    weeks.push(daysArray.slice(i, i + 7));
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

export const getUserDashboard = async (userId) => {
  try {
    const { start, end } = getMonthRange();
    const last7Days = getLast7Days();
    const todayStr = formatLocalDate(new Date());
    const attendanceSnap = await getDocs(
      query(
        collection(db, "Attendance"),
        where("userId", "==", userId),
        where("createdAt", ">=", start),
        where("createdAt", "<=", end),
      ),
    );

    let daysPresent = 0;
    let leavesTaken = 0;
    let absentDays = 0;

    const attendanceMap = {};

    attendanceSnap.forEach((doc) => {
      const data = doc.data();
      const date = formatLocalDate(data.createdAt.toDate());

      attendanceMap[date] = data;

      if (data.type === "present") daysPresent++;
      if (data.type === "leave") leavesTaken++;
      if (data.type === "absent") absentDays++;
    });

    const totalDays = daysPresent + leavesTaken + absentDays;

    const attendanceRate =
      totalDays > 0 ? ((daysPresent / totalDays) * 100).toFixed(1) : 0;

    const weeklyWorkHours = last7Days.map((day) => {
      const record = attendanceMap[day];

      return {
        Day: formatDay(day),
        Hour: parseHoursToDecimal(record?.hours),
      };
    });

    const leaveSnap = await getDocs(
      query(collection(db, "leaveRequests"), where("createdBy", "==", userId)),
    );

    const leaveType = {
      Pending: 0,
      Approved: 0,
      Rejected: 0,
    };

    leaveSnap.forEach((doc) => {
      const data = doc.data();

      data.dates.forEach((d) => {
        const date = formatLocalDate(new Date(d.date));

        if (date >= formatLocalDate(start) && date <= formatLocalDate(end)) {
          if (d.status === "pending") leaveType.Pending++;
          if (d.status === "approved") leaveType.Approved++;
          if (d.status === "rejected") leaveType.Rejected++;
        }
      });
    });

    const leaveTypeDistribution = Object.entries(leaveType).map(
      ([key, value]) => ({
        key,
        value,
      }),
    );

    const allMonthDays = [];

    let temp = new Date(start);
    while (temp <= end) {
      allMonthDays.push(formatLocalDate(temp));
      temp.setDate(temp.getDate() + 1);
    }

    const weeks = chunkIntoWeeks(allMonthDays);

    const monthlyAttendanceTrend = weeks.map((week, index) => {
      let Count = 0;

      week.forEach((day) => {
        if (attendanceMap[day]?.type === "present") {
          Count++;
        }
      });

      return {
        key: `W${index + 1}`,
        Count,
      };
    });

    return {
      States: {
        daysPresent,
        leavesTaken,
        absentDays,
        attendanceRate: Number(attendanceRate),
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
};
