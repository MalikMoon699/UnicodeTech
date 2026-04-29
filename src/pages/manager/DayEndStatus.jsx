import React, { useState } from "react";
import UserDayEndStatus from "../user/DayEndStatus";
import AdminDayEndStatus from "../admin/DayEndStatus";

const DayEndStatus = () => {
  const [tab, setTab] = useState("my");

  return (
    <>
      {tab === "my" ? (
        <UserDayEndStatus isManager={true} tab={tab} setTab={setTab} />
      ) : (
        <AdminDayEndStatus isManager={true} tab={tab} setTab={setTab} />
      )}
    </>
  );
};

export default DayEndStatus;
