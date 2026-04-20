import React, { useEffect, useState } from "react";
import { Header, Input } from "../../components/CustomComponents";
import {
  checkIn,
  checkOut,
  subscribeMonthlyAttendance,
  subscribeLastPendingCheckout,
} from "../../services/user/attendance.services";
import "../../assets/style/Attendance.css";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { AttenDanceCalender } from "../../components/Attendance.components";

const Attendance = ({isManager = false}) => {
  const { currentUser } = useAuth();
  const [todayRecord, setTodayRecord] = useState(null);
  const [isLate, setIsLate] = useState(false);
  const [lateReason, setLateReason] = useState("");
  const [lastPending, setLastPending] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");

  useEffect(() => {
    if (!currentUser?.userId) return;
    setLoading(true);
    const unsubscribe = subscribeMonthlyAttendance({
      userId: currentUser.userId,
      date: selectedDate,
      callback: (data) => {
        setCalendarData(data);
        setLoading(false);
      },
    });

    return () => unsubscribe && unsubscribe();
  }, [currentUser, selectedDate]);

  useEffect(() => {
    if (!currentUser?.userId) return;

    const unsubscribe = subscribeLastPendingCheckout(
      currentUser.userId,
      setLastPending,
    );

    return () => unsubscribe && unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const record = calendarData[today];
    setTodayRecord(record || null);
  }, [calendarData]);

  const handleCheckIn = async () => {
    try {
      const now = new Date();
      const todayKey = now.toISOString().split("T")[0];

      if (now.getHours() >= 12 && !lateReason.trim() && !isLate) {
        return setIsLate(true);
      } else if (now.getHours() >= 12 && !lateReason.trim() && isLate) {
        return toast.error("Late reason required");
      }

      setActionLoading("checkIn");

      await checkIn({ userId: currentUser?.userId, lateReason });

      const newRecord = {
        userId: currentUser?.userId,
        date: todayKey,
        checkIn: now.toISOString(),
        checkOut: null,
        hours: null,
        late: now.getHours() >= 12,
        lateReason: now.getHours() >= 12 ? lateReason : "",
        type: "present",
        status: now.getHours() >= 12 ? "late" : "present",
      };
      setLastPending(newRecord);
      setTodayRecord(newRecord);
      setIsLate(false);
      toast.success("Checked in");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading("");
    }
  };

  const handleCheckOut = async () => {
    try {
      if (!lastPending) {
        return toast.error("No pending checkout found");
      }
      setActionLoading("checkOut");
      await checkOut(currentUser?.userId, lastPending.date);
      setLastPending(null);
      toast.success("Checked out");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading("");
    }
  };

  return (
    <div className={isManager ? "" : "page-container"}>
      {!isManager && (
        <Header title="Attendance" desc="Track your daily attendance" />
      )}
      <div className="attendance-top-card">
        <div className="attendance-top-card-content">
          <h4>Today — {new Date().toDateString()}</h4>
          <p>
            {!todayRecord
              ? "You haven't checked in yet"
              : todayRecord.checkOut
                ? "Completed"
                : "Checked in"}
          </p>
        </div>

        <div className="attendance-top-card-actions">
          <button
            disabled={todayRecord || actionLoading || loading}
            onClick={handleCheckIn}
            className="attendance-btn attendance-checkin"
          >
            {actionLoading === "checkIn" ? "Sending..." : "Check In"}
          </button>
          <div className="attendance-action-divide" />
          <button
            disabled={!lastPending || actionLoading || loading}
            onClick={handleCheckOut}
            className="attendance-btn attendance-checkout"
          >
            {actionLoading === "checkOut" ? "Sending..." : "Check Out"}
          </button>
        </div>
      </div>
      <div className={`attendance-late-apper ${isLate ? "show" : ""}`}>
        <Input
          value={lateReason}
          setValue={setLateReason}
          style={{ height: "180px" }}
          InputType="text"
          margin="12px 0px 8px"
          placeholder={`Your check In is late. Please provide a reason for the delay.`}
          type="textArea"
        />
      </div>

      <AttenDanceCalender
        loading={loading}
        calendarData={calendarData}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />
    </div>
  );
};

export default Attendance;