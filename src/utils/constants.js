import SiteLogo from "../assets/images/SiteLogo.png";
import SiteLogoRed from "../assets/images/SiteLogoRed.png";
import SiteLogoWhite from "../assets/images/SiteLogoWhite.png";
// import PlaceHolder from "../assets/images/PlaceHolder.jpg";
import NotFound from "../assets/images/NotFound.png";
import auth1 from "../assets/images/auth1.png";
import auth2 from "../assets/images/auth2.png";
import auth3 from "../assets/images/auth3.png";
import PlaceHolder from "../assets/images/PlaceHolder/Placeholder.png";
import P1 from "../assets/images/PlaceHolder/Placeholder1.png";
import P2 from "../assets/images/PlaceHolder/Placeholder2.png";
import P3 from "../assets/images/PlaceHolder/Placeholder3.png";
import P4 from "../assets/images/PlaceHolder/Placeholder4.png";
import P5 from "../assets/images/PlaceHolder/Placeholder5.png";
import P6 from "../assets/images/PlaceHolder/Placeholder6.png";
import P7 from "../assets/images/PlaceHolder/Placeholder7.png";
import P8 from "../assets/images/PlaceHolder/Placeholder8.png";
import P9 from "../assets/images/PlaceHolder/Placeholder9.png";
import P10 from "../assets/images/PlaceHolder/Placeholder10.png";

export const IMAGES = {
  SiteLogo,
  SiteLogoRed,
  SiteLogoWhite,
  NotFound,
  auth1,
  auth2,
  auth3,
  PlaceHolder,
  P1,
  P2,
  P3,
  P4,
  P5,
  P6,
  P7,
  P8,
  P9,
  P10,
};

export const AdminSidebarMenu = [
  {
    name: "Dashboard",
    icon: "LayoutGrid",
    route: "/admin/dashboard",
    activeAt: "/admin/dashboard",
  },
  {
    name: "Users",
    icon: "Users",
    route: "/admin/users",
    activeAt: "/admin/users",
  },
  {
    name: "Attendance",
    icon: "Clock",
    route: "/admin/attendance",
    activeAt: "/admin/attendance",
  },
  {
    name: "Leaves",
    icon: "CalendarDays",
    route: "/admin/leaves",
    activeAt: "/admin/leaves",
  },
  {
    name: "Day End Status",
    icon: "FileText",
    route: "/admin/day-end-status",
    activeAt: "/admin/day-end-status",
  },
  {
    name: "Chats",
    icon: "MessageCircle",
    route: "/chats",
    activeAt: "/chats",
  },
  {
    name: "Settings",
    icon: "Settings",
    route: "/settings",
    activeAt: "/settings",
  },
];

export const ManagerSidebarMenu = [
  {
    name: "Dashboard",
    icon: "LayoutGrid",
    route: "/manager/dashboard",
    activeAt: "/manager/dashboard",
  },
  {
    name: "Attendance",
    icon: "Clock",
    route: "/manager/attendance",
    activeAt: "/manager/attendance",
  },
  {
    name: "Leaves",
    icon: "CalendarDays",
    route: "/manager/leaves",
    activeAt: "/manager/leaves",
  },
  {
    name: "Day End Status",
    icon: "FileText",
    route: "/manager/day-end-status",
    activeAt: "/manager/day-end-status",
  },
  {
    name: "Chats",
    icon: "MessageCircle",
    route: "/chats",
    activeAt: "/chats",
  },
  {
    name: "Settings",
    icon: "Settings",
    route: "/settings",
    activeAt: "/settings",
  },
];

export const UserSidebarMenu = [
  {
    name: "Dashboard",
    icon: "LayoutGrid",
    route: "/dashboard",
    activeAt: "/dashboard",
  },
  {
    name: "Attendance",
    icon: "Clock",
    route: "/attendance",
    activeAt: "/attendance",
  },
  {
    name: "Leaves",
    icon: "CalendarDays",
    route: "/leaves",
    activeAt: "/leaves",
  },
  {
    name: "Day End Status",
    icon: "FileText",
    route: "/day-end-status",
    activeAt: "/day-end-status",
  },
  {
    name: "Chats",
    icon: "MessageCircle",
    route: "/chats",
    activeAt: "/chats",
  },
  {
    name: "Settings",
    icon: "Settings",
    route: "/settings",
    activeAt: "/settings",
  },
];

export const AttendanceHelp = [
  { className: "attendance-no-record", Label: "No Found Attendance" },
  { className: "attendance-present", Label: "Present" },
  { className: "attendance-late", Label: "Late Attendance" },
  { className: "attendance-absent", Label: "Absent" },
  { className: "attendance-leave", Label: "At Leave" },
  { className: "attendance-leave-boss", Label: "Leave By Office" },
  { className: "attendance-leave-weekend", Label: "Weekend" },
];

export const Push_Notification_Api = import.meta.env.VITE_Push_Notification;