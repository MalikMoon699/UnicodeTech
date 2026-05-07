import {
  collection,
  getDocs,
  query,
  where,
  collectionGroup,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "../../utils/FirebaseConfig";

const formatLocalDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatDay = (dateStr) => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
  });
};

const getLastDays = (days = 7) => {
  const today = new Date();
  const arr = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    arr.push(formatLocalDate(d));
  }

  return arr;
};

const getDateRange = (lastDays) => {
  const end = new Date(lastDays[lastDays.length - 1]);
  const start = new Date(lastDays[0]);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const chunkIntoWeeks = (arr) => {
  const weeks = [];
  for (let i = 0; i < arr.length; i += 7) {
    weeks.push(arr.slice(i, i + 7));
  }
  return weeks;
};

export const getUsersStats = async () => {
  const usersQuery = query(
    collection(db, "UserIndex"),
    where("status", "==", "active"),
    where("role", "==", "user"),
  );

  const managersQuery = query(
    collection(db, "UserIndex"),
    where("status", "==", "active"),
    where("role", "==", "manager"),
  );

  const activeUsersQuery = query(
    collection(db, "UserIndex"),
    where("status", "==", "active"),
  );

  const [userCountSnap, managerCountSnap, activeUsersSnap] = await Promise.all([
    getCountFromServer(usersQuery),
    getCountFromServer(managersQuery),
    getDocs(activeUsersQuery),
  ]);

  return {
    totalUsers: userCountSnap.data().count,
    totalManagers: managerCountSnap.data().count,
    activeUserIds: activeUsersSnap.docs.map((doc) => doc.data().docId),
  };
};

export const getAttendanceStats = async (days = 7, activeUserIds = []) => {
  const lastDays = getLastDays(days);
  const todayStr = lastDays[lastDays.length - 1];

  const chunks =
    lastDays.length <= 10
      ? [lastDays]
      : Array.from({ length: Math.ceil(lastDays.length / 10) }, (_, i) =>
          lastDays.slice(i * 10, i * 10 + 10),
        );

  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const q = query(collection(db, "Attendance"), where("date", "in", chunk));
      const snap = await getDocs(q);
      return snap.docs.map((doc) => doc.data());
    }),
  );
  const attendanceDocs = results.flat();

  const attendanceMap = {};
  lastDays.forEach((d) => {
    attendanceMap[d] = { Present: 0, Absent: 0, Leave: 0 };
  });

  const activeSet = new Set(activeUserIds);
  attendanceDocs.forEach((record) => {
    if (!activeSet.has(record.userId)) return;
    if (!attendanceMap[record.date]) return;
    const typeKey = record.type.charAt(0).toUpperCase() + record.type.slice(1);
    attendanceMap[record.date][typeKey]++;
  });

  let attendanceTrend = [];
  if (days <= 7) {
    attendanceTrend = lastDays.map((day) => ({
      Day: formatDay(day),
      ...attendanceMap[day],
    }));
  } else {
    const weeks = chunkIntoWeeks(lastDays);
    attendanceTrend = weeks.map((week, i) => {
      let Present = 0,
        Absent = 0,
        Leave = 0;
      week.forEach((day) => {
        Present += attendanceMap[day].Present;
        Absent += attendanceMap[day].Absent;
        Leave += attendanceMap[day].Leave;
      });
      return { Day: `W${i + 1}`, Present, Absent, Leave };
    });
  }

  const activeToday = attendanceDocs.filter(
    (a) =>
      a.date === todayStr && a.type === "present" && activeSet.has(a.userId),
  ).length;

  return { attendanceTrend, activeToday };
};

export const getLeaveStats = async (lastDays = []) => {
  if (!lastDays.length) {
    return {
      pendingLeavesToday: 0,
      distribution: {
        Pending: 0,
        Approved: 0,
        Rejected: 0,
      },
    };
  }

  const todayStr = lastDays[lastDays.length - 1];
  const lastDaysSet = new Set(lastDays);

  const q = query(
    collection(db, "leaveRequests"),
    where("leaveDateKeys", "array-contains-any", lastDays),
  );

  const snap = await getDocs(q);

  let pendingLeavesToday = 0;

  const distribution = {
    Pending: 0,
    Approved: 0,
    Rejected: 0,
  };

  snap.forEach((doc) => {
    const data = doc.data();

    data.dates?.forEach((leaveEntry) => {
      const leaveDate = formatLocalDate(new Date(leaveEntry.date));
      if (!lastDaysSet.has(leaveDate)) return;
      const status = leaveEntry.status;
      if (leaveDate === todayStr && status === "pending") {
        pendingLeavesToday++;
      }
      if (status === "pending") {
        distribution.Pending++;
      } else if (status === "approved") {
        distribution.Approved++;
      } else if (status === "rejected") {
        distribution.Rejected++;
      }
    });
  });

  return {
    pendingLeavesToday,
    distribution,
  };
};

export const getReportStats = async (days = 7) => {
  const lastDays = getLastDays(days);
  const { start, end } = getDateRange(lastDays);

  const reportsQuery = query(
    collectionGroup(db, "reports"),
    where("createdAt", ">=", start),
    where("createdAt", "<=", end),
  );
  const reportsSnap = await getDocs(reportsQuery);

  const reportMap = {};
  lastDays.forEach((d) => (reportMap[d] = 0));

  reportsSnap.forEach((doc) => {
    const data = doc.data();
    const date = formatLocalDate(data.createdAt.toDate());
    if (reportMap[date] !== undefined) reportMap[date]++;
  });

  let reportSubmission = [];
  if (days <= 7) {
    reportSubmission = lastDays.map((day) => ({
      Day: formatDay(day),
      Count: reportMap[day],
    }));
  } else {
    const weeks = chunkIntoWeeks(lastDays);
    reportSubmission = weeks.map((week, i) => {
      let Count = 0;
      week.forEach((day) => {
        Count += reportMap[day] || 0;
      });
      return { Day: `W${i + 1}`, Count };
    });
  }

  return reportSubmission;
};

export const getDashboardData = async (days = 7) => {
  try {
    const lastDays = getLastDays(days);

    const usersData = await getUsersStats();

    const [attendanceData, leaveData, reportSubmission] = await Promise.all([
      getAttendanceStats(days, usersData.activeUserIds),
      getLeaveStats(lastDays),
      getReportStats(days),
    ]);

    return {
      States: {
        totalUsers: usersData.totalUsers,
        totalManagers: usersData.totalManagers,
        activeToday: attendanceData.activeToday,
        pendingLeavesToday: leaveData.pendingLeavesToday,
      },

      attendanceTrend: attendanceData.attendanceTrend,

      leaveTypeDistribution: Object.entries(leaveData.distribution).map(
        ([key, Count]) => ({
          key,
          Count,
        }),
      ),

      reportSubmistion: reportSubmission,
    };
  } catch (error) {
    console.error("Dashboard Error:", error);
    throw error;
  }
};

const attendanceTrend = [
  { Day: "Mon", Present: 0, Absent: 0, Leave: 0 },
  { Day: "Tue", Present: 0, Absent: 0, Leave: 0 },
  { Day: "Wed", Present: 0, Absent: 0, Leave: 0 },
  { Day: "Thu", Present: 0, Absent: 0, Leave: 0 },
  { Day: "Fri", Present: 0, Absent: 0, Leave: 0 },
  { Day: "Sat", Present: 0, Absent: 0, Leave: 0 },
  { Day: "Sun", Present: 0, Absent: 0, Leave: 0 },
];

const leaveTypeDistribution = [
  { key: "Pending", Count: 0 },
  { key: "Approved", Count: 0 },
  { key: "Rejected", Count: 0 },
];

const reportSubmistion = [
  { Day: "Wed", Count: 0 },
  { Day: "Tue", Count: 0 },
  { Day: "Mon", Count: 0 },
  { Day: "Sun", Count: 0 },
  { Day: "Sat", Count: 0 },
  { Day: "Fri", Count: 0 },
  { Day: "Thu", Count: 0 },
];

export const fallBacks = {
  attendanceTrend,
  leaveTypeDistribution,
  reportSubmistion,
};


// export const getDashboardData = async (days = 7) => {
//   try {
//     const lastDays = getLastDays(days);
//     const usersData = await getUsersStats();
//     const [attendanceData, leaveData, reportSubmission] = await Promise.all([
//       getAttendanceStats(days, usersData.activeUserIds),
//       getLeaveStats(lastDays),
//       getReportStats(days),
//     ]);

//     return {
//       States: {
//         totalUsers: usersData.totalUsers,
//         totalManagers: usersData.totalManagers,
//         activeToday: attendanceData.activeToday,
//         pendingLeavesToday: leaveData.pendingLeavesToday,
//       },
//       attendanceTrend: attendanceData.attendanceTrend,
//       leaveTypeDistribution: Object.entries(leaveData.distribution).map(
//         ([key, Count]) => ({ key, Count }),
//       ),
//       reportSubmistion: reportSubmission,
//     };
//   } catch (error) {
//     console.error("Dashboard Error:", error);
//     throw error;
//   }
// };
