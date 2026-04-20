import React, { useEffect, useState } from "react";
import "../../assets/style/Leave.css";
import { createLeave, listenUserLeaves } from "../../services/user/leave.services";
import { useAuth } from "../../context/AuthContext";

const Leaves = () => {
  const { currentUser } = useAuth();

  const [dates, setDates] = useState([]);
  const [reason, setReason] = useState("");
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);


const   date= new Date();
console.log("date----->", date);

  // 📌 fetch leaves
  useEffect(() => {
    if (!currentUser?.userId) return;

    const unsub = listenUserLeaves(currentUser.userId, (data) => {
      setLeaves(data);
      setLoading(false);
    });

    return () => unsub && unsub();
  }, [currentUser]);

  // 📌 add date
  const addDate = (date) => {
    if (!date) return;

    if (dates.find((d) => d.date === date)) return;

    setDates([...dates, { date, status: "pending" }]);
  };

  // 📌 remove date
  const removeDate = (date) => {
    setDates(dates.filter((d) => d.date !== date));
  };

  // 📌 submit leave
  const submitLeave = async () => {
    if (!reason || dates.length === 0) return;

    await createLeave({
      userId: currentUser.userId,
      type: "user",
      dates,
      reason,
    });

    setDates([]);
    setReason("");
  };

  return (
    <div className="leave-container">
      {/* FORM */}
      <div className="leave-card">
        <h2 className="leave-title">Apply Leave</h2>

        <input
          type="date"
          className="leave-input"
          onChange={(e) => addDate(e.target.value)}
        />

        <div className="leave-date-list">
          {dates.map((d) => (
            <div key={d.date} className="leave-date-chip">
              {d.date}
              <span onClick={() => removeDate(d.date)}>✕</span>
            </div>
          ))}
        </div>

        <textarea
          className="leave-textarea"
          placeholder="Reason..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <button className="leave-btn" onClick={submitLeave}>
          Submit Leave
        </button>
      </div>

      {/* LIST */}
      <div className="leave-list">
        <h3 className="leave-subtitle">My Leaves</h3>

        {loading ? (
          <div className="leave-loading">Loading...</div>
        ) : (
          leaves.map((l) => (
            <div key={l.id} className="leave-item">
              <div className="leave-item-header">
                <div>
                  <strong>{l.reason}</strong>
                  <p className="leave-status">{l.overallStatus}</p>
                </div>

                <button
                  className="leave-view-btn"
                  onClick={() => setExpanded(expanded === l.id ? null : l.id)}
                >
                  {expanded === l.id ? "Hide" : "View"}
                </button>
              </div>

              {/* SUMMARY */}
              <div className="leave-summary">Total Days: {l.dates?.length}</div>

              {/* EXPAND */}
              {expanded === l.id && (
                <div className="leave-expanded">
                  {l.dates.map((d, i) => (
                    <div key={i} className="leave-date-row">
                      {d.date} - {d.status}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Leaves;
