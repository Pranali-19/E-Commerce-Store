import { useEffect, useState } from "react";
import {
  Edit,
  Eye,
  Power,
  RefreshCw,
  Search,
  Shield,
  User,
  UserCog,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../services/api";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [togglingId, setTogglingId] = useState(null);
  const [roleUpdatingId, setRoleUpdatingId] = useState(null);

  const fetchUsers = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams({
        search,
        role,
        status,
        page,
        limit: 10,
      });

      const response = await api.get(
        `/admin/users?${params.toString()}`
      );

      const data = response.data?.data;

      setUsers(
        (data?.users || []).map((user) => ({
          ...user,
          _id: user._id ?? user.id,
        }))
      );

      setPagination(
        data?.pagination || {
          page: 1,
          pages: 1,
          total: 0,
        }
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to load users"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, role, status]);

  const handleSearch = (e) => {
    e.preventDefault();

    setPage(1);
    fetchUsers();
  };

  const handleClearFilters = () => {
    setSearch("");
    setRole("");
    setStatus("");
    setPage(1);
  };

  const handleToggleStatus = async (user) => {
    try {
      setTogglingId(user._id);

      await api.patch(
        `/admin/users/${user._id}/status`
      );

      toast.success(
        `User ${
          user.isActive ? "deactivated" : "activated"
        } successfully`
      );

      fetchUsers(true);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to update user status"
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleRoleChange = async (user) => {
    const newRole =
      user.role === "admin" ? "customer" : "admin";

    const confirmed = window.confirm(
      `Change ${user.name}'s role to ${newRole}?`
    );

    if (!confirmed) return;

    try {
      setRoleUpdatingId(user._id);

      await api.patch(
        `/admin/users/${user._id}/role`,
        {
          role: newRole,
        }
      );

      toast.success(
        `User role changed to ${newRole}`
      );

      fetchUsers(true);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to update user role"
      );
    } finally {
      setRoleUpdatingId(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Never";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatDateTime = (date) => {
    if (!date) return "Never";

    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Users
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage customers, administrators and account access.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <form
            onSubmit={handleSearch}
            className="flex flex-1 gap-2"
          >
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search by name or email..."
                className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm outline-none focus:border-black"
              />
            </div>

            <button
              type="submit"
              className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              Search
            </button>
          </form>

          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border bg-white px-4 py-2.5 text-sm outline-none focus:border-black"
          >
            <option value="">All Roles</option>
            <option value="customer">Customers</option>
            <option value="admin">Admins</option>
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border bg-white px-4 py-2.5 text-sm outline-none focus:border-black"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            onClick={handleClearFilters}
            className="rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
          >
            Clear
          </button>

          <button
            onClick={() => fetchUsers(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={
                refreshing ? "animate-spin" : ""
              }
            />

            Refresh
          </button>
        </div>
      </div>

      {/* Count */}
      <div className="text-sm text-gray-500">
        Showing {users.length} of{" "}
        {pagination.total || 0} users
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-xl border bg-white shadow-sm lg:block">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                    User
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                    Role
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                    Joined
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                    Last Login
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {users.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User
                              size={20}
                              className="text-gray-400"
                            />
                          )}
                        </div>

                        <div>
                          <p className="font-medium text-gray-900">
                            {user.name}
                          </p>

                          <p className="text-sm text-gray-500">
                            {user.email}
                          </p>

                          {user.phone && (
                            <p className="text-xs text-gray-400">
                              {user.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {user.role === "admin" ? (
                          <Shield size={13} />
                        ) : (
                          <User size={13} />
                        )}

                        {user.role}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          user.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {user.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600">
                      {formatDate(user.createdAt)}
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600">
                      {formatDateTime(user.lastLogin)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/users/${user._id}`}
                          className="rounded-lg border p-2 text-gray-600 hover:bg-gray-100"
                          title="View"
                        >
                          <Eye size={17} />
                        </Link>

                        <button
                          onClick={() =>
                            handleRoleChange(user)
                          }
                          disabled={
                            roleUpdatingId ===
                            user._id
                          }
                          className="rounded-lg border p-2 text-purple-600 hover:bg-purple-50 disabled:opacity-50"
                          title="Change Role"
                        >
                          <UserCog size={17} />
                        </button>

                        <button
                          onClick={() =>
                            handleToggleStatus(user)
                          }
                          disabled={
                            togglingId === user._id
                          }
                          className={`rounded-lg border p-2 ${
                            user.isActive
                              ? "text-orange-500 hover:bg-orange-50"
                              : "text-green-600 hover:bg-green-50"
                          } disabled:opacity-50`}
                          title={
                            user.isActive
                              ? "Deactivate"
                              : "Activate"
                          }
                        >
                          <Power size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="space-y-3 lg:hidden">
        {loading ? (
          <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
            No users found.
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user._id}
              className="rounded-xl border bg-white p-4 shadow-sm"
            >
              <div className="flex gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User
                      size={22}
                      className="text-gray-400"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {user.name}
                  </h3>

                  <p className="truncate text-sm text-gray-500">
                    {user.email}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {user.role}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        user.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.isActive
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-3 text-xs text-gray-500">
                <div>
                  <p>Joined</p>
                  <p className="mt-1 font-medium text-gray-700">
                    {formatDate(user.createdAt)}
                  </p>
                </div>

                <div>
                  <p>Last Login</p>
                  <p className="mt-1 font-medium text-gray-700">
                    {formatDateTime(user.lastLogin)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2 border-t pt-3">
                <Link
                  to={`/admin/users/${user._id}`}
                  className="rounded-lg border p-2 text-gray-600"
                >
                  <Eye size={16} />
                </Link>

                <button
                  onClick={() =>
                    handleRoleChange(user)
                  }
                  disabled={
                    roleUpdatingId === user._id
                  }
                  className="rounded-lg border p-2 text-purple-600 disabled:opacity-50"
                >
                  <UserCog size={16} />
                </button>

                <button
                  onClick={() =>
                    handleToggleStatus(user)
                  }
                  disabled={
                    togglingId === user._id
                  }
                  className={`rounded-lg border p-2 ${
                    user.isActive
                      ? "text-orange-500"
                      : "text-green-600"
                  } disabled:opacity-50`}
                >
                  <Power size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between rounded-xl border bg-white px-4 py-3 shadow-sm">
          <button
            disabled={page <= 1}
            onClick={() =>
              setPage((prev) => prev - 1)
            }
            className="rounded-lg border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <span className="text-sm text-gray-600">
            Page {pagination.page} of{" "}
            {pagination.pages}
          </span>

          <button
            disabled={page >= pagination.pages}
            onClick={() =>
              setPage((prev) => prev + 1)
            }
            className="rounded-lg border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;