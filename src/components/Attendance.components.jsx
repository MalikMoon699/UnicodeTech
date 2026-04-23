import React, { useRef, useState, useMemo, useEffect } from "react";
import "../assets/style/Attendance.css";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Search,
} from "lucide-react";
import Loader from "../components/Loader";
import { Input, ProfileImage, Selector } from "./CustomComponents";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useDebounce } from "../utils/hooks/useDebounce";
import { getUsersWithoutPaginationHelper } from "../services/admin/users.serveces";
import { IMAGES } from "../utils/constants";

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

export const LeaveRequestModal = ({ onClose, onSendRequest }) => {
  const { currentUser } = useAuth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [requestType, setRequestType] = useState("oneDay");
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [duration, setDuration] = useState([{ date: today }]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  useEffect(() => {
    setDuration([{ date: today }]);
  }, [requestType]);

  const calendarDays = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();

    const lastDay = new Date(year, month + 1, 0).getDate();

    const arr = [];

    for (let i = 0; i < startDay; i++) {
      arr.push(null);
    }

    for (let i = 1; i <= lastDay; i++) {
      arr.push(new Date(year, month, i));
    }

    return arr;
  }, [selectedMonth]);

  const normalize = (d) => new Date(d).toDateString();

  const isSelected = (date) =>
    duration.some((d) => normalize(d.date) === normalize(date));

  const isPastDate = (date) => {
    return date < today;
  };

  const handleDateClick = (date) => {
    if (isPastDate(date)) return;

    const exists = isSelected(date);

    if (requestType === "oneDay") {
      setDuration([{ date }]);
    } else {
      if (exists) {
        setDuration((prev) =>
          prev.filter((d) => normalize(d.date) !== normalize(date)),
        );
      } else {
        setDuration((prev) => [...prev, { date }]);
      }
    }
  };

  const goToPrevMonth = () => {
    const prev = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth() - 1,
      1,
    );

    const currentMonthStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      1,
    );

    if (prev >= currentMonthStart) {
      setSelectedMonth(prev);
    }
  };

  const goToNextMonth = () => {
    setSelectedMonth(
      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1),
    );
  };

  const handleSendRequest = async () => {
    if (duration.length === 0)
      return toast.error("Please select at least one date.");
    else if (reason.trim() === "")
      return toast.error("Please provide a reason for your leave request.");

    try {
      setLoading(true);
      await onSendRequest({
        requestData: {
          userIds: [currentUser.userId],
          createdBy: currentUser.userId,
          duration,
          reason,
        },
      });
      toast.success("Leave request submitted successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit leave request. Please try again.");
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <div className="model-overlay">
      <div onClick={(e) => e.stopPropagation()} className="model-content">
        <div className="model-header">
          <h3 className="model-header-title">Add Request</h3>
          <button
            className="model-header-close-btn"
            disabled={loading}
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="model-content-container">
          <Selector
            filter={requestType}
            setFilter={setRequestType}
            options={[
              { filter: "oneDay", label: "One Day" },
              { filter: "longLeave", label: "Long Leave" },
            ]}
            width="100%"
          />
          <div className="calendar-modal-container">
            <div className="year-header">
              <button className="year-nav-btn left" onClick={goToPrevMonth}>
                <span className="icon">
                  <ChevronLeft />
                </span>
              </button>

              <h3>
                {selectedMonth.toLocaleString("en-US", { month: "long" })},{" "}
                {selectedMonth.getFullYear()}
              </h3>

              <button className="year-nav-btn right" onClick={goToNextMonth}>
                <span className="icon">
                  <ChevronRight />
                </span>
              </button>
            </div>

            <div className="calendar-modal-days">
              {days.map((d, idx) => {
                const active = duration.some(
                  (item) => new Date(item.date).getDay() === idx,
                );

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
                    disabled={isPastDate(date)}
                    className={`calendar-modal-date ${
                      isPastDate(date) ? "disabled" : ""
                    }`}
                    onClick={() => handleDateClick(date)}
                  >
                    <span className={isSelected(date) ? "selected" : ""}>
                      {date.getDate()}
                    </span>
                  </button>
                ) : (
                  <span key={i} className="calendar-empty-slot" />
                ),
              )}
            </div>
          </div>

          <Input
            value={reason}
            setValue={setReason}
            placeholder="Leave reason..."
            type="textArea"
            margin="15px 0px 8px 0px"
            style={{ height: "150px" }}
          />

          <div className="submit-modal-container">
            <button
              className="leave-submit-btn"
              disabled={loading}
              onClick={handleSendRequest}
            >
              {loading ? (
                <Loader style={{ width: "88px" }} size={16} color="#fff" />
              ) : (
                "Send Request"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AdminLeaveCreateModal = ({ onClose, onSendRequest }) => {
  const { currentUser } = useAuth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [duration, setDuration] = useState([{ date: today }]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isVisible, setIsVisible] = useState({
    calender: false,
    textArea: false,
    userSelector: false,
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    loadUsers(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const calendarDays = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();

    const lastDay = new Date(year, month + 1, 0).getDate();

    const arr = [];

    for (let i = 0; i < startDay; i++) {
      arr.push(null);
    }

    for (let i = 1; i <= lastDay; i++) {
      arr.push(new Date(year, month, i));
    }

    return arr;
  }, [selectedMonth]);

  const normalize = (d) => new Date(d).toDateString();

  const isSelected = (date) =>
    duration.some((d) => normalize(d.date) === normalize(date));

  const isPastDate = (date) => {
    return date < today;
  };

  const handleDateClick = (date) => {
    if (isPastDate(date)) return;

    const exists = isSelected(date);

    if (exists) {
      setDuration((prev) =>
        prev.filter((d) => normalize(d.date) !== normalize(date)),
      );
    } else {
      setDuration((prev) => [...prev, { date }]);
    }
  };

  const goToPrevMonth = () => {
    const prev = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth() - 1,
      1,
    );

    const currentMonthStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      1,
    );

    if (prev >= currentMonthStart) {
      setSelectedMonth(prev);
    }
  };

  const goToNextMonth = () => {
    setSelectedMonth(
      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1),
    );
  };

  const handleSendRequest = async () => {
    if (duration.length === 0)
      return toast.error("Please select at least one date.");
    else if (reason.trim() === "")
      return toast.error("Please provide a reason for your leave request.");
    else if (selectedUsers.length === 0)
      return toast.error(
        "Please select at least one user for this leave request.",
      );

    try {
      setLoading(true);
      await onSendRequest({
        requestData: {
          createdBy: currentUser.userId,
          userIds: selectedUsers,
          duration,
          reason,
        },
        type: "boss",
      });
      toast.success("Leave request submitted successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit leave request. Please try again.");
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const toggleVisibility = (key) => {
    setIsVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const loadUsers = async (search = "") => {
    try {
      setLoadingUsers(true);
      const res = await getUsersWithoutPaginationHelper({ search });
      setUsers(res);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load users. Please try again.");
    } finally {
      setLoadingUsers(false);
    }
  };

  return (
    <div className="model-overlay">
      <div onClick={(e) => e.stopPropagation()} className="model-content">
        <div className="model-header">
          <h3 className="model-header-title">Add Request</h3>
          <button
            className="model-header-close-btn"
            disabled={loading}
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="model-content-container">
          <HidenSelector
            title="Choose Days"
            value={isVisible.calender}
            onClick={() => toggleVisibility("calender")}
            margin="15px 0px 0px"
            style={{
              borderRadius: isVisible.calender ? "8px 8px 0px 0px" : "8px",
            }}
          />

          <div
            className={`calendar-modal-container admin-add-leave-hidden-item ${
              isVisible.calender ? "open" : "closed"
            }`}
            style={{
              maxHeight: isVisible.calender ? "500px" : "0px",
              borderRadius: "0px 0px 8px 8px",
              marginTop: "0px",
            }}
          >
            <div className="year-header">
              <button className="year-nav-btn left" onClick={goToPrevMonth}>
                <span className="icon">
                  <ChevronLeft />
                </span>
              </button>

              <h3>
                {selectedMonth.toLocaleString("en-US", { month: "long" })},{" "}
                {selectedMonth.getFullYear()}
              </h3>

              <button className="year-nav-btn right" onClick={goToNextMonth}>
                <span className="icon">
                  <ChevronRight />
                </span>
              </button>
            </div>

            <div className="calendar-modal-days">
              {days.map((d, idx) => {
                const active = duration.some(
                  (item) => new Date(item.date).getDay() === idx,
                );

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
                    disabled={isPastDate(date)}
                    className={`calendar-modal-date ${
                      isPastDate(date) ? "disabled" : ""
                    }`}
                    onClick={() => handleDateClick(date)}
                  >
                    <span className={isSelected(date) ? "selected" : ""}>
                      {date.getDate()}
                    </span>
                  </button>
                ) : (
                  <span key={i} className="calendar-empty-slot" />
                ),
              )}
            </div>
          </div>

          <HidenSelector
            title="Reason for leave"
            value={isVisible.textArea}
            onClick={() => toggleVisibility("textArea")}
            margin="15px 0px 0px"
            style={{
              borderRadius: isVisible.textArea ? "8px 8px 0px 0px" : "8px",
            }}
          />

          <div
            className={`calendar-modal-container admin-add-leave-hidden-item ${
              isVisible.textArea ? "open" : "closed"
            }`}
            style={{
              maxHeight: isVisible.textArea ? "500px" : "0px",
              margin: "0px",
              padding: "0px",
            }}
          >
            <Input
              value={reason}
              setValue={setReason}
              placeholder="Leave reason..."
              type="textArea"
              margin="0px 0px -4px"
              style={{ height: "150px", borderRadius: "0px 0px 8px 8px" }}
            />
          </div>

          <HidenSelector
            title={`Select Users (${selectedUsers?.length || 0})`}
            value={isVisible.userSelector}
            onClick={() => toggleVisibility("userSelector")}
            margin="15px 0px 0px"
            style={{
              borderRadius: isVisible.userSelector ? "8px 8px 0px 0px" : "8px",
            }}
          />

          <div
            className={`group-create-container admin-add-leave-hidden-item ${
              isVisible.userSelector ? "open" : "closed"
            }`}
            style={{
              maxHeight: isVisible.userSelector ? "500px" : "0px",
              margin: "0px",
              padding: "0px",
              borderRadius: "0px 0px 8px 8px",
              borderTop:"0px"
            }}
          >
            <div
              style={{ margin: "10px 5px" }}
              className="chat-search group-create-search"
            >
              <Search size={18} />
              <input
                placeholder="Search users..."
                value={searchTerm}
                disabled={loadingUsers}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {loadingUsers ? (
              <Loader style={{ height: "150px" }} size={40} color="#fff" />
            ) : users?.length > 0 ? (
              users.map((user) => {
                const isSelected = selectedUsers.includes(user.userId);
                const toggleUser = () => {
                  if (isSelected) {
                    setSelectedUsers((prev) =>
                      prev.filter((id) => id !== user.userId),
                    );
                  } else {
                    setSelectedUsers((prev) => [...prev, user.userId]);
                  }
                };

                return (
                  <div
                    key={user?.userId}
                    className={`group-create-item ${isSelected ? "group-create-item-active" : ""}`}
                    onClick={() => toggleUser(user)}
                  >
                    <div className="group-create-left">
                      <ProfileImage
                        Image={user?.ProfileImage || IMAGES.PlaceHolder}
                        className="group-create-avatar"
                      />
                      <div className="group-create-user-info">
                        <h3 className="group-create-name">
                          {user?.fullName || "N/A"}
                        </h3>
                        <p className="group-create-username">
                          {user?.email || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="group-create-right">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectUser(user)}
                        className="group-create-checkbox"
                      />

                      {isSelected && (
                        <div className="group-create-checkmark">✓</div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="empty-data">No users found.</p>
            )}
          </div>

          <div className="submit-modal-container">
            <button
              className="leave-submit-btn"
              disabled={loading}
              onClick={handleSendRequest}
            >
              {loading ? (
                <Loader style={{ width: "88px" }} size={16} color="#fff" />
              ) : (
                "Send Request"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const HidenSelector = ({
  title = "",
  value,
  onClick,
  margin = "",
  style = {},
}) => {
  return (
    <div
      onClick={onClick}
      className="admin-add-leave-hidden-selector"
      style={{ margin, ...style }}
    >
      <span className="elepsis">{title}</span>
      <span className="icon">
        {value ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </span>
    </div>
  );
};
