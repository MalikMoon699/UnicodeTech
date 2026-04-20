import React, { useRef, useState, useMemo, useEffect } from "react";
import "../assets/style/Attendance.css";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  MoveLeft,
  MoveRight,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";


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

export const LeaveRequestModal = ({ onClose, editData }) => {
  const { currentUser } = useAuth();
  const [requestType, setRequestType] = useState("halfDay");
  const [selectedMonth,setSelectedMonth]=("");
  const [duration, setDuration] = useState([{date: new Date()}]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);


  // Prefill when editing
  useEffect(() => {
    if (editData) {
      setRequestType(editData.type || "halfDay");
      setReason(editData.reason || "");
      if (editData.type === "halfDay") {
        setStartDate(editData.date?.toDate?.() || new Date());
        setSelectedDate(editData.date?.toDate?.() || new Date());
        setStartTime(editData.startTime ? convertTo24(editData.startTime) : "");
        setEndTime(editData.endTime ? convertTo24(editData.endTime) : "");
      } else if (editData.type === "fullDay") {
        setStartDate(editData.date?.toDate?.() || new Date());
        setSelectedDate(editData.date?.toDate?.() || new Date());
      } else if (editData.type === "longLeave") {
        setStartDate(editData.startDate?.toDate?.() || new Date());
        setEndDate(editData.endDate?.toDate?.() || null);
      }
    }
  }, [editData]);

  const convertTo24 = (time12) => {
    if (!time12) return "";
    const [time, modifier] = time12.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, "0")}:${minutes}`;
  };

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startingDayOfWeek = firstDayOfMonth.getDay();

    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    const daysArray = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      daysArray.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      daysArray.push(new Date(year, month, i));
    }

    return daysArray;
  }, [currentMonth]);



  return (
    <div className="modal-overlay">
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-content"
        style={{ padding: "25px 30px", width: "580px" }}
      >
        <div
          style={{
            width: "520px",
            position: "sticky",
            top: "-26px",
            left: "0px",
            padding: "18px 0px 15px 0px",
            background: "white",
          }}
          className="leave-modal-header-container"
        >
          <h2 className="leave-modal-title">
            {isEditMode ? "Edit Request" : "Add Request"}
          </h2>
          <button
            disabled={loading}
            onClick={onClose}
            className="close-modal-btn"
          >
            <X size={20} />
          </button>
        </div>

        <div className="input-modal-container">
          <label className="input-modal-label">Request Type</label>
          <select
            className="request-modal-select"
            value={requestType}
            onChange={handleRequestTypeChange}
          >
            <option value="halfDay">Half Day</option>
            <option value="fullDay">Full Day</option>
            <option value="longLeave">Long Leave</option>
          </select>
        </div>

        {requestType === "halfDay" && (
          <div className="tab-modal-container">
            <button
              className={`tab-modal-btn ${
                activeTab === "days" ? "active" : ""
              }`}
              onClick={() => setActiveTab("days")}
            >
              Days
            </button>
            <button
              className={`tab-modal-btn ${
                activeTab === "hours" ? "active" : ""
              }`}
              onClick={() => setActiveTab("hours")}
            >
              Hours
            </button>
          </div>
        )}

        {activeTab === "days" && (
          <div
            className="calendar-modal-container"
            style={{
              border: errors.startDate || errors.endDate ? "1px solid red" : "",
              marginTop: requestType === "halfDay" ? "20px" : "40px",
            }}
          >
            <div className="calendar-modal-header">
              <span onClick={goToPrevMonth} style={{ cursor: "pointer" }}>
                <MoveLeft />
              </span>
              <h3>
                {currentMonth.toLocaleString("default", { month: "long" })},{" "}
                {currentMonth.getFullYear()}
              </h3>
              <span onClick={goToNextMonth} style={{ cursor: "pointer" }}>
                <MoveRight />
              </span>
            </div>

            {/* Weekdays */}
            <div className="calendar-modal-days">
              {days.map((d, idx) => {
                const active =
                  requestType === "longLeave"
                    ? calendarDays.some(
                        (date) =>
                          date && isInRange(date) && date.getDay() === idx,
                      )
                    : selectedDate && selectedDate.getDay() === idx;

                return (
                  <span
                    key={d}
                    className={`day-modal-name ${active ? "active" : ""}`}
                  >
                    {d}
                  </span>
                );
              })}
            </div>

            <div className="calendar-modal-grid">
              {calendarDays.map((date, i) =>
                date ? (
                  <button
                    key={i}
                    className="calendar-modal-date"
                    onClick={() => handleDateClick(date)}
                  >
                    <span
                      className={
                        requestType === "longLeave"
                          ? isInRange(date)
                            ? "selected"
                            : startDate &&
                                !endDate &&
                                startDate.toDateString() === date.toDateString()
                              ? "selected"
                              : ""
                          : selectedDate &&
                              selectedDate.toDateString() ===
                                date.toDateString()
                            ? "selected"
                            : ""
                      }
                    >
                      {date.getDate()}
                    </span>
                  </button>
                ) : (
                  <span key={i} className="calendar-empty-slot" />
                ),
              )}
            </div>
          </div>
        )}

        {activeTab === "hours" && (
          <div className="time-modal-container">
            <div className="modal-time-input-container">
              <div className="modal-time-input-wrapper">
                <span className="modal-time-label">From</span>
                <input
                  type="time"
                  value={startTime}
                  min={
                    selectedDate &&
                    selectedDate.toDateString() === new Date().toDateString()
                      ? new Date().toISOString().slice(11, 16)
                      : "00:00"
                  }
                  onChange={(e) => setStartTime(e.target.value)}
                  className="modal-time-input"
                  style={{
                    border: errors.startTime ? "1px solid red" : "",
                  }}
                />
              </div>
              <div className="modal-time-input-wrapper">
                <span className="modal-time-label">To</span>
                <input
                  type="time"
                  value={endTime}
                  min={startTime || "00:00"}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="modal-time-input"
                  style={{
                    border: errors.endTime ? "1px solid red" : "",
                  }}
                />
              </div>
            </div>

            <div className="modal-selected-time-section">
              <span className="modal-time-label">Selected Time</span>
              <div className="modal-selected-time-box">
                <p className="modal-leave-description">Time for Leave</p>
                <h2 className="modal-leave-duration">
                  {timeDifference || "0h 0m"}
                </h2>
              </div>
            </div>
          </div>
        )}

        <div className="input-modal-container">
          <label className="modal-time-label">Reason</label>
          <textarea
            placeholder="Leave reason..."
            className="request-modal-textarea"
            value={reason}
            style={{
              border: errors.reason ? "2px solid red" : "",
            }}
            onChange={(e) => {
              setReason(e.target.value);
            }}
          />
        </div>
        <div className="submit-modal-container">
          <button
            onClick={handleSendRequest}
            className="add-leave-modal-request-button"
            style={{ cursor: loading ? "not-allowed" : "pointer" }}
            disabled={loading}
          >
            {loading ? (
              <Loader
                loading={true}
                style={{ height: "23px", width: "100px" }}
                color="white"
                size="30"
              />
            ) : isEditMode ? (
              "Update Request"
            ) : (
              "Send Request"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
