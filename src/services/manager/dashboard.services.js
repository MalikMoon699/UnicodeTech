import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../utils/FirebaseConfig";

const formatLocalDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatDay = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-US", { weekday: "short" });

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

export const getManagerDashboard = async () => {
  try {
    const todayStr = formatLocalDate(new Date());
    const last7Days = getLast7Days();
    const { start, end } = getMonthRange();

    const usersSnap = await getDocs(
      query(
        collection(db, "UserIndex"),
        where("role", "==", "user"),
        where("status", "==", "active"),
      ),
    );

    const teamUserIds = [];
    usersSnap.forEach((doc) => {
      teamUserIds.push(doc.data().docId);
    });

    const totalUsers = teamUserIds.length;

    const attendanceSnap = await getDocs(
      query(collection(db, "Attendance"), where("userId", "in", teamUserIds)),
    );

    const attendanceMap = {};
    last7Days.forEach((d) => {
      attendanceMap[d] = { Present: 0, Absent: 0, Leave: 0 };
    });

    let presentToday = 0;
    let absentToday = 0;

    attendanceSnap.forEach((doc) => {
      const data = doc.data();
      const date = data.date;

      if (!attendanceMap[date]) return;

      if (data.type === "present") {
        attendanceMap[date].Present++;
      } else if (data.type === "absent") {
        attendanceMap[date].Absent++;
      } else if (data.type === "leave") {
        attendanceMap[date].Leave++;
      }

      if (date === todayStr) {
        if (data.type === "present") presentToday++;
        if (data.type === "absent") absentToday++;
      }
    });

    const pendingToday = totalUsers - (presentToday + absentToday);

    const teamAttendanceWeekly = last7Days.map((day) => ({
      Day: formatDay(day),
      Present: attendanceMap[day].Present,
      Absent: attendanceMap[day].Absent,
      Leave: attendanceMap[day].Leave,
    }));

    const leaveSnap = await getDocs(collection(db, "leaveRequests"));

    const leaveType = {
      Pending: 0,
      Approved: 0,
      Rejected: 0,
    };

    leaveSnap.forEach((doc) => {
      const data = doc.data();

      if (!teamUserIds.includes(data.userId)) return;

      data.dates.forEach((d) => {
        const date = formatLocalDate(new Date(d.date));

        if (date >= formatLocalDate(start) && date <= formatLocalDate(end)) {
          if (d.status === "pending") leaveType.Pending++;
          if (d.status === "approved") leaveType.Approved++;
          if (d.status === "rejected") leaveType.Rejected++;
        }
      });
    });

    const teamLeaveTypeDistribution = Object.entries(leaveType).map(
      ([key, Count]) => ({
        key,
        Count,
      }),
    );

    const reportsRootSnap = await getDocs(collection(db, "Reports"));

    const reportMap = {};
    last7Days.forEach((d) => (reportMap[d] = 0));

    let statusReports = 0;

    await Promise.all(
      reportsRootSnap.docs.map(async (userDoc) => {
        if (!teamUserIds.includes(userDoc.id)) return;

        const reportsQuery = query(
          collection(db, "Reports", userDoc.id, "reports"),
          where("createdAt", ">=", start),
          where("createdAt", "<=", end),
        );

        const snap = await getDocs(reportsQuery);

        snap.forEach((doc) => {
          const data = doc.data();
          const date = formatLocalDate(data.createdAt.toDate());

          if (reportMap[date] !== undefined) {
            reportMap[date]++;
          }

          if (date === todayStr) {
            statusReports++;
          }
        });
      }),
    );

    const teamReportSubmistionWeekly = last7Days.map((day) => ({
      Day: formatDay(day),
      Count: reportMap[day],
    }));

    return {
      teamStates: {
        totalUsers,
        presentToday,
        pendingToday,
        absentToday,
        statusReports,
      },

      teamAttendanceWeekly,

      teamLeaveTypeDistribution,

      teamReportSubmistionWeekly,
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