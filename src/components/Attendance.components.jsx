import React, { useRef, useState } from "react";
import "../assets/style/Attendance.css";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";


export const AttenDanceCalender = ({
  loading,
  calendarData,
  selectedDate,
  setSelectedDate,
}) => {
  const [isChange, setIsChange] = useState(false);
  const selectedDateYear = selectedDate.getFullYear();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const [showYear, setShowYear] = useState(selectedDateYear);

  const formatKey = (d) => {
    if (!d) return null;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getDayStatusClass = (date) => {
    if (!date) return "";

    const key = formatKey(date);
    const record = calendarData[key];

    const today = new Date();
    const isFuture = date > today;

    if (isFuture) return "attendance-future";

    if (!record) return "attendance-absent";

    if (record.type === "leave") return "attendance-leave";
    if (record.late) return "attendance-late";

    return "attendance-present";
  };

  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  };

  const isMonthDisabled = (monthIndex) => {
    if (showYear < currentYear) return false;

    if (showYear > currentYear) return true;
    return monthIndex > currentMonth;
  };

  const handlePrevYear = () => {
    setShowYear((prev) => prev - 1);
  };

  const handleNextYear = () => {
    setShowYear((prev) => prev + 1);
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handleMonthSelect = (monthIndex) => {
    const newDate = new Date(showYear, monthIndex, 1);
    setSelectedDate(newDate);
    setIsChange(false);
  };

  return (
    <div className="attendance-calendar">
      <div className="attendance-calendar-header">
        <h3>
          {selectedDate.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </h3>
        <button
          className="attendance-calendar-header-action-btn"
          onClick={() => setIsChange(!isChange)}
        >
          {isChange ? <ChevronUp size={28} /> : <ChevronDown size={28} />}
        </button>
      </div>
      <div className="calender-values-wraper">
        <div className={`calender-years ${isChange ? "show" : ""}`}>
          <div className="year-header">
            <button
              disabled={showYear === 2020}
              onClick={handlePrevYear}
              className="year-nav-btn left"
            >
              <span className="icon">
                <ChevronLeft />
              </span>
            </button>

            <h3>{showYear}</h3>

            <button
              disabled={currentYear === showYear}
              onClick={handleNextYear}
              className="year-nav-btn right"
            >
              <span className="icon">
                <ChevronRight />
              </span>
            </button>
          </div>

          <div className="months-grid">
            {months.map((m, i) => {
              const disabled = isMonthDisabled(i);

              return (
                <div
                  key={m}
                  className={`month-item ${disabled ? "disabled" : ""}`}
                  onClick={() => {
                    if (disabled) return;
                    handleMonthSelect(i);
                  }}
                >
                  {m}
                </div>
              );
            })}
          </div>
        </div>

        <div className="attendance-grid">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="attendance-day-header">
              {d}
            </div>
          ))}
          {loading ? (
            <CalendarSkeleton />
          ) : (
            generateCalendarDays().map((date, i) => {
              const key = formatKey(date);
              const record = key ? calendarData[key] : null;

              return (
                <AttendanceHover key={i} data={record} delay={800}>
                  <div className={`attendance-day ${getDayStatusClass(date)}`}>
                    {date ? date.getDate() : ""}
                  </div>
                </AttendanceHover>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export const AttendanceHover = ({ data, children, delay = 300 }) => {
  const [show, setShow] = useState(false);

  const timerRef = useRef(null);
  const hoverRef = useRef(false);

  const handleEnter = () => {
    hoverRef.current = true;

    timerRef.current = setTimeout(() => {
      if (hoverRef.current) {
        setShow(true);
      }
    }, delay);
  };

  const handleLeave = () => {
    hoverRef.current = false;

    clearTimeout(timerRef.current);

    setTimeout(() => {
      if (!hoverRef.current) {
        setShow(false);
      }
    }, 100);
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toDateString();
  };

  return (
    <div
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}

      {show && (
        <div className="custom-attendanceHover-tooltip">
          {data ? (
            <div className="tooltip-content">
              <h4>{formatDate(data.date)}</h4>

              <div
                className={`attendanceHover-status attendanceHover-status-${data?.type}`}
              >
                {data?.type?.toUpperCase()}
              </div>

              <div className="attendanceHover-tooltip-row">
                <span>Check In:</span>
                <span>
                  {data.checkIn
                    ? new Date(data.checkIn).toLocaleTimeString()
                    : "-"}
                </span>
              </div>

              <div className="attendanceHover-tooltip-row">
                <span>Check Out:</span>
                <span>
                  {data.checkOut
                    ? new Date(data.checkOut).toLocaleTimeString()
                    : "-"}
                </span>
              </div>

              <div className="attendanceHover-tooltip-row">
                <span>Hours:</span>
                <span>{data.hours || "-"}</span>
              </div>

              {data.late && (
                <div className="attendanceHover-tooltip-late">
                  <span>Late Reason:</span>
                  <p>{data?.lateReason || "N/A"}</p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>No data for this day.</div>
          )}
        </div>
      )}
    </div>
  );
};

export const CalendarSkeleton = () => {
  const days = Array.from({ length: 35 });

  return (
    <>
      {days.map((_, i) => (
        <div key={i} className="attendance-day-skeleton" />
      ))}
    </>
  );
};
