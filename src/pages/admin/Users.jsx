import React, { useEffect, useState } from "react";
import {
  getUsersHelper,
  updateUserStatus,
  updateUserRole,
} from "../../services/admin/users.serveces";
import {
  Header,
  Input,
  LoadMore,
  Selector,
} from "../../components/CustomComponents";
import CustomTable from "../../components/CustomTable";
import { useDebounce } from "../../utils/hooks/useDebounce";
import { limit } from "../../utils/constants";
import { toast } from "sonner";
import Loader from "../../components/Loader";
import { formateDate, timeAgo } from "../../utils/helper";
import { Ban, User, UserCheck, UserPen, UserX } from "lucide-react";

const Users = () => {
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(null);
  const [roleLoading, setRoleLoading] = useState(null);

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [roleFilter, setRoleFilter] = useState("Users");

  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);

  const debounceSearch = useDebounce(search, 500);

  useEffect(() => {
    fetchUsers(true);
  }, [debounceSearch, status, roleFilter]);

  const fetchUsers = async (reset = false) => {
    try {
      if (reset) {
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
        collection: roleFilter,
        lastDoc: reset ? null : lastDoc,
      });

      const newUsers = res?.users || [];
      const newLastDoc = res?.meta?.lastDoc || null;

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

  const handleStatusChange = async (user, newStatus) => {
    try {
      setStatusLoading({ status: newStatus, id: user.authId });
      await updateUserStatus({ user, status: newStatus });

      setUsers((prev) =>
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

      setUsers((prev) => prev.filter((u) => u.authId !== userId));

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
      row: (row) => (row.lastActive?.toDate ? timeAgo(row.lastActive) : "-"),
    },
    {
      name: "Joined",
      row: (row) => (row.createdAt?.toDate ? formateDate(row.createdAt) : "-"),
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

  return (
    <div className="page-container">
      <Header title="User Management" desc="Manage platform users" />
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
              { filter: "Users", label: "Users" },
              { filter: "Managers", label: "Managers" },
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
