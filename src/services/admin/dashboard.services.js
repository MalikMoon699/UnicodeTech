import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../utils/FirebaseConfig";

const formatLocalDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const getLastDays = (days = 7) => {
  const today = new Date();
  const lastDays = [];

  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    lastDays.push(formatLocalDate(d));
  }

  return lastDays;
};

const formatDay = (dateStr) => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
  });
};

const getDateRange = (lastDays) => {
  const end = new Date();
  const start = new Date(lastDays[lastDays.length - 1]);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const chunkIntoWeeks = (daysArray) => {
  const weeks = [];
  for (let i = 0; i < daysArray.length; i += 7) {
    weeks.push(daysArray.slice(i, i + 7));
  }
  return weeks;
};

export const getDashboardData = async (days = 7) => {
  try {
    const lastDays = getLastDays(days);
    const todayStr = lastDays[0];
    const { start, end } = getDateRange(lastDays);
    const usersQuery = query(
      collection(db, "UserIndex"),
      where("status", "==", "active"),
    );

    const usersSnap = await getDocs(usersQuery);

    let totalUsers = 0;
    let totalManagers = 0;

    const activeUserIds = [];

    usersSnap.forEach((doc) => {
      const data = doc.data();

      if (data.role === "user") totalUsers++;
      if (data.role === "manager") totalManagers++;

      activeUserIds.push(data.docId);
    });

    let attendanceDocs = [];

    if (lastDays.length <= 10) {
      const attendanceQuery = query(
        collection(db, "Attendance"),
        where("date", "in", lastDays),
      );

      const snap = await getDocs(attendanceQuery);
      attendanceDocs = snap.docs.map((d) => d.data());
    } else {
      const chunks = [];
      for (let i = 0; i < lastDays.length; i += 10) {
        chunks.push(lastDays.slice(i, i + 10));
      }

      const results = await Promise.all(
        chunks.map(async (chunk) => {
          const q = query(
            collection(db, "Attendance"),
            where("date", "in", chunk),
          );
          const snap = await getDocs(q);
          return snap.docs.map((d) => d.data());
        }),
      );

      attendanceDocs = results.flat();
    }

    const activeToday = attendanceDocs.filter(
      (a) =>
        a.date === todayStr &&
        a.type === "present" &&
        activeUserIds.includes(a.userId),
    ).length;

    const leaveSnap = await getDocs(collection(db, "leaveRequests"));

    let pendingLeavesToday = 0;

    const leaveTypeDistribution = {
      Pending: 0,
      Approved: 0,
      Rejected: 0,
    };

    leaveSnap.forEach((doc) => {
      const data = doc.data();

      data.dates.forEach((d) => {
        const leaveDate = formatLocalDate(new Date(d.date));
        if (leaveDate === todayStr && d.status === "pending") {
          pendingLeavesToday++;
        }

        if (lastDays.includes(leaveDate)) {
          if (d.status === "pending") {
            leaveTypeDistribution.Pending++;
          } else if (d.status === "approved") {
            leaveTypeDistribution.Approved++;
          } else if (d.status === "rejected") {
            leaveTypeDistribution.Rejected++;
          }
        }
      });
    });

    const attendanceMap = {};

    lastDays.forEach((d) => {
      attendanceMap[d] = {
        Present: 0,
        Absent: 0,
        Leave: 0,
      };
    });

    attendanceDocs.forEach((a) => {
      if (!activeUserIds.includes(a.userId)) return;
      if (!attendanceMap[a.date]) return;
      if (a.type === "present") {
        attendanceMap[a.date].Present++;
      } else if (a.type === "absent") {
        attendanceMap[a.date].Absent++;
      } else if (a.type === "leave") {
        attendanceMap[a.date].Leave++;
      }
    });

    let attendanceTrend = [];

    if (days <= 7) {
      attendanceTrend = lastDays.map((day) => ({
        Day: formatDay(day),
        Present: attendanceMap[day].Present,
        Absent: attendanceMap[day].Absent,
        Leave: attendanceMap[day].Leave,
      }));
    } else {
      const weeks = chunkIntoWeeks([...lastDays].reverse());

      attendanceTrend = weeks.map((week, index) => {
        let Present = 0;
        let Absent = 0;
        let Leave = 0;

        week.forEach((day) => {
          Present += attendanceMap[day].Present;
          Absent += attendanceMap[day].Absent;
          Leave += attendanceMap[day].Leave;
        });

        return {
          Day: `W${index + 1}`,
          Present,
          Absent,
          Leave,
        };
      });
    }
    const reportsRootSnap = await getDocs(collection(db, "Reports"));

    const reportMap = {};
    lastDays.forEach((d) => (reportMap[d] = 0));

    await Promise.all(
      reportsRootSnap.docs.map(async (userDoc) => {
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
        });
      }),
    );

    let reportSubmission = [];

    if (days <= 7) {
      reportSubmission = lastDays.map((day) => ({
        Day: formatDay(day),
        Count: reportMap[day],
      }));
    } else {
  const weeks = chunkIntoWeeks([...lastDays].reverse());

      reportSubmission = weeks.map((week, index) => {
        let Count = 0;

        week.forEach((day) => {
          Count += reportMap[day] || 0;
        });

        return {
          Day: `W${index + 1}`,
          Count,
        };
      });
    }
    return {
      States: {
        totalUsers,
        totalManagers,
        activeToday,
        pendingLeavesToday,
      },

      attendanceTrend,

      leaveTypeDistribution: Object.entries(leaveTypeDistribution).map(
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
