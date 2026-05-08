import React, { useEffect, useState } from "react";
import {
  getUsersHelper,
  updateUserStatus,
  updateUserRole,
  getUserStatesHelper,
} from "../../services/admin/users.serveces";
import {
  Header,
  Input,
  LoadMore,
  Selector,
  StatesCard,
} from "../../components/CustomComponents";
import CustomTable from "../../components/CustomTable";
import { useDebounce } from "../../utils/hooks/useDebounce";
import { toast } from "sonner";
import Loader from "../../components/Loader";
import { formateDate, serializeData, timeAgo } from "../../utils/helper";
import {
  Briefcase,
  User,
  Users as LucideUsers,
  UserCheck,
  UserMinus,
  UserPen,
  UserX,
  RefreshCcw,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useDispatch, useSelector } from "react-redux";
import { setAdminUsersData } from "../../store/features/AdminUsers.reducer";

const Users = () => {
  const dispatch = useDispatch();
  const { usersLocal, lastDocLocal, statesLocal, lastFetchedLocal } =
    useSelector((state) => state.adminUsers);
  const { limit } = useTheme();
  const [loadingStates, setLoadingStates] = useState(true);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [states, setStates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(null);
  const [roleLoading, setRoleLoading] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const debounceSearch = useDebounce(search, 500);
  const FIVE_HOUR = 5 * 60 * 60 * 1000;

  useEffect(() => {
    const isCacheValid =
      lastFetchedLocal && Date.now() - lastFetchedLocal < FIVE_HOUR;
    if (isCacheValid && statesLocal !== null) {
      setLoadingStates(false);
      setStates(statesLocal);
      return;
    }
    fetchUsersStates();
  }, []);

  useEffect(() => {
    const isCacheValid =
      lastFetchedLocal && Date.now() - lastFetchedLocal < FIVE_HOUR;
    const isDefaultFilters =
      !debounceSearch && status === "all" && roleFilter === "all";
    if (isDefaultFilters && isCacheValid && usersLocal?.length > 0) {
      setUsers(usersLocal);
      setLastDoc(lastDocLocal);
      if (lastDocLocal !== null) setHasMore(true);
      setLoading(false);
      return;
    }

    fetchUsers(true);
  }, [debounceSearch, status, roleFilter]);

  const fetchUsersStates = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoadingStates(true);
      const res = await getUserStatesHelper();
      setStates(res);
      dispatch(
        setAdminUsersData({
          statesLocal: res,
        }),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStates(false);
    }
  };

  const fetchUsers = async (reset = false, isRefresh = false) => {
    try {
      if (reset && !isRefresh) {
        setLoading(true);
        setUsers([]);
        setLastDoc(null);
        setHasMore(true);
      } else {
        setLoadMoreLoading(true);
      }

      const res = await getUsersHelper({
        limit,
        search: debounceSearch,
        status: status !== "all" ? status : "",
        role: roleFilter !== "all" ? roleFilter : "",
        lastDoc: reset ? null : lastDoc,
      });

      const newUsers = res?.users || [];
      const newLastDoc = res?.meta?.lastDoc || null;

      const isDefaultFilters =
        !debounceSearch && status === "all" && roleFilter === "all";
      if (reset && isDefaultFilters) {
        const serializedUsers = serializeData(newUsers);
        dispatch(
          setAdminUsersData({
            usersLocal: serializedUsers,
            lastDocLocal: newLastDoc,
            lastFetchedLocal: Date.now(),
          }),
        );
      }

      setUsers((prev) => (reset ? newUsers : [...prev, ...newUsers]));

      setLastDoc(newLastDoc);
      if (newUsers.length < limit || !newLastDoc) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadMoreLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!hasMore || loadMoreLoading) return;
    fetchUsers(false);
  };

  const updateReduxUsersCache = (callback) => {
    const updatedUsers = callback(usersLocal || []);

    dispatch(
      setAdminUsersData({
        usersLocal: updatedUsers,
      }),
    );
  };

  const handleStatusChange = async (user, newStatus) => {
    try {
      setStatusLoading({ status: newStatus, id: user.authId });

      await updateUserStatus({ user, status: newStatus });

      setUsers((prev) =>
        prev
          .map((u) =>
            u.authId === user.authId ? { ...u, status: newStatus } : u,
          )
          .filter((u) => {
            if (roleFilter !== "all" && u.role !== roleFilter) {
              return false;
            }

            if (status !== "all" && u.status !== status) {
              return false;
            }

            return true;
          }),
      );
      updateReduxUsersCache((prev) =>
        prev.map((u) =>
          u.authId === user.authId ? { ...u, status: newStatus } : u,
        ),
      );

      toast.success("Status updated");
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setStatusLoading(null);
    }
  };

  const handleRoleChange = async (userId, currentRole) => {
    try {
      setRoleLoading(userId);

      const newRole = currentRole === "user" ? "manager" : "user";

      await updateUserRole({
        authId: userId,
        newRole,
      });

      setUsers((prev) =>
        prev
          .map((u) => (u.authId === userId ? { ...u, role: newRole } : u))
          .filter((u) => {
            if (roleFilter !== "all" && u.role !== roleFilter) {
              return false;
            }

            if (status !== "all" && u.status !== status) {
              return false;
            }

            return true;
          }),
      );
      updateReduxUsersCache((prev) =>
        prev.map((u) => (u.authId === userId ? { ...u, role: newRole } : u)),
      );
      toast.success(`Role changed to ${newRole}`);
    } catch (err) {
      toast.error(err.message || "Role update failed");
    } finally {
      setRoleLoading(null);
    }
  };

  const columns = [
    {
      name: "User",
      row: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.fullName}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>{row.email}</div>
        </div>
      ),
    },
    {
      name: "Role",
      row: (row) => (row?.role === "user" ? "Employee" : "Manager"),
    },
    {
      name: "Status",
      row: (row) => (
        <span
          style={{
            padding: "4px 10px",
            borderRadius: 6,
            textTransform: "capitalize",
            fontSize: 12,
            background:
              row.status === "active"
                ? "#d1fae5"
                : row.status === "pending"
                  ? "#fef9c3"
                  : "#fee2e2",
            color:
              row.status === "active"
                ? "#065f46"
                : row.status === "pending"
                  ? "#854d0e"
                  : "#991b1b",
          }}
        >
          {row.status}
        </span>
      ),
    },
    {
      name: "last Active",
      row: (row) => (row.lastActive ? timeAgo(row.lastActive) : "-"),
    },
    {
      name: "Joined",
      row: (row) => (row.createdAt ? formateDate(row.createdAt) : "-"),
    },
    {
      name: "Actions",
      width: "250px",
      bothClass: "custom-table-action",
      row: (row) =>
        row.status === "pending" ? (
          <div className="custom-table-action-container">
            <button
              disabled={statusLoading}
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(row, "active");
              }}
              className="custom-table-action-btn active"
            >
              {statusLoading &&
              statusLoading.status === "active" &&
              statusLoading.id === row?.authId ? (
                <Loader color="#fff" size="15" />
              ) : (
                <>
                  <span className="icon">
                    <UserCheck size={16} />
                  </span>
                  Active
                </>
              )}
            </button>
            <button
              disabled={statusLoading}
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(row, "banned");
              }}
              className="custom-table-action-btn inactive"
            >
              {statusLoading &&
              statusLoading.status === "banned" &&
              statusLoading.id === row?.authId ? (
                <Loader color="#fff" size="15" />
              ) : (
                <>
                  <span className="icon">
                    <UserX size={16} />
                  </span>
                  Ban
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="custom-table-action-container">
            <button
              disabled={statusLoading}
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(
                  row,
                  row.status === "active" ? "banned" : "active",
                );
              }}
              className={`custom-table-action-btn ${row?.status === "active" ? "inactive" : "active"}`}
            >
              {statusLoading && statusLoading?.id === row?.authId ? (
                <Loader color="#fff" size="15" />
              ) : row?.status === "active" ? (
                <>
                  <span className="icon">
                    <UserX size={16} />
                  </span>
                  Ban
                </>
              ) : (
                <>
                  <span className="icon">
                    <UserCheck size={16} />
                  </span>
                  Active
                </>
              )}
            </button>
            <button
              disabled={roleLoading}
              onClick={(e) => {
                e.stopPropagation();
                handleRoleChange(row.authId, row.role);
              }}
              className="custom-table-action-btn active"
              style={{ minWidth: "127px" }}
            >
              {roleLoading === row?.authId ? (
                <Loader color="#fff" size="15" />
              ) : row?.role === "user" ? (
                <>
                  <span className="icon">
                    <UserPen size={16} />
                  </span>
                  Make Manager
                </>
              ) : (
                <>
                  <span className="icon">
                    <User size={16} />
                  </span>
                  Make User
                </>
              )}
            </button>
          </div>
        ),
    },
  ];

  const handleRefresh = async () => {
    setRefreshLoading(true);
    await fetchUsersStates(true);
    await fetchUsers(true, true);
    setRefreshLoading(false);
    toast.success("Data refreshed successfully.");
  };

  return (
    <div className="page-container">
      <Header
        title="User Management"
        desc="Manage platform users"
        context={
          <button onClick={handleRefresh} className="leave-submit-btn">
            <span className={`icon ${refreshLoading ? "refresh-loading" : ""}`}>
              <RefreshCcw size={18} />
            </span>
            Refresh
          </button>
        }
      />
      <div
        style={{ margin: "30px 0px" }}
        className="custom-dashboard-stats-container"
      >
        <StatesCard
          icon={LucideUsers}
          iColor="var(--card-foreground)"
          title="Total Users"
          value={states?.totalUsers || 0}
          loading={loadingStates}
        />
        <StatesCard
          icon={Briefcase}
          iColor="var(--primary)"
          title="Total Managers"
          value={states?.totalManagers || 0}
          loading={loadingStates}
        />
        <StatesCard
          icon={UserCheck}
          iColor="var(--status-approved)"
          title="Active"
          value={states?.active || 0}
          loading={loadingStates}
        />
        <StatesCard
          icon={UserMinus}
          iColor="var(--status-rejected)"
          title="Banned"
          value={states?.inactive || 0}
          loading={loadingStates}
        />
      </div>
      <div className="custom-table-card">
        <h3 className="custom-section-title">User Records </h3>
        <div className="custom-table-filters">
          <Input value={search} setValue={setSearch} placeholder="Search..." />

          <Selector
            width="200px"
            filter={status}
            setFilter={setStatus}
            options={[
              { filter: "all", label: "All" },
              { filter: "active", label: "Active" },
              { filter: "pending", label: "Pending" },
              { filter: "banned", label: "Banned" },
            ]}
          />

          <Selector
            width="200px"
            filter={roleFilter}
            setFilter={setRoleFilter}
            options={[
              { filter: "all", label: "All" },
              { filter: "user", label: "Users" },
              { filter: "manager", label: "Managers" },
            ]}
          />
        </div>

        <CustomTable
          columns={columns}
          data={users}
          loading={loading}
          pagination={false}
        />

        <LoadMore
          show={hasMore && !loading}
          loading={loadMoreLoading}
          disabled={loadMoreLoading || loading}
          onLoad={handleLoadMore}
        />
      </div>
    </div>
  );
};

export default Users;
