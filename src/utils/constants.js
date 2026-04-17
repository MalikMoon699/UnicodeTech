import SiteLogo from "../assets/images/SiteLogo.png";
import SiteLogoRed from "../assets/images/SiteLogoRed.png";
import SiteLogoWhite from "../assets/images/SiteLogoWhite.png";
import PlaceHolder from "../assets/images/PlaceHolder.jpg";
import NotFound from "../assets/images/NotFound.png";
import auth1 from "../assets/images/auth1.png";
import auth2 from "../assets/images/auth2.png";
import auth3 from "../assets/images/auth3.png";

export const IMAGES = {
  SiteLogo,
  SiteLogoRed,
  SiteLogoWhite,
  PlaceHolder,
  NotFound,
  auth1,
  auth2,
  auth3,
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
    route: "/admin/chats",
    activeAt: "/admin/chats",
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
    route: "/manager/chats",
    activeAt: "/manager/chats",
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

export const limit = 2;