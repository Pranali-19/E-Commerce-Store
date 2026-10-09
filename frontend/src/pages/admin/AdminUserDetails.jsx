import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Mail,
  Phone,
  Shield,
  User,
  Calendar,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../services/api";

const AdminUserDetails = () => {
  const { id } = useParams();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        `/admin/users/${id}`
      );

      setUser(response.data?.data?.user ?? response.data?.data ?? null);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to load user"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Never";

    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-100 items-center justify-center text-gray-500">
        Loading user...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-xl border bg-white p-10 text-center">
        <p className="text-gray-500">
          User not found.
        </p>

        <Link
          to="/admin/users"
          className="mt-4 inline-block text-sm font-medium underline"
        >
          Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black"
        >
          <ArrowLeft size={16} />
          Back to Users
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          User Details
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile */}
        <div className="rounded-xl border bg-white p-6 shadow-sm lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gray-100">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User
                  size={40}
                  className="text-gray-400"
                />
              )}
            </div>

            <h2 className="mt-4 text-xl font-bold text-gray-900">
              {user.name}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {user.email}
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                  user.role === "admin"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                <Shield size={13} />
                {user.role}
              </span>

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
            </div>
          </div>
        </div>

        {/* Information */}
        <div className="rounded-xl border bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">
            Account Information
          </h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="flex gap-3">
              <Mail
                size={20}
                className="mt-0.5 text-gray-400"
              />

              <div>
                <p className="text-xs text-gray-500">
                  Email
                </p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Phone
                size={20}
                className="mt-0.5 text-gray-400"
              />

              <div>
                <p className="text-xs text-gray-500">
                  Phone
                </p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {user.phone || "Not provided"}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Calendar
                size={20}
                className="mt-0.5 text-gray-400"
              />

              <div>
                <p className="text-xs text-gray-500">
                  Registered
                </p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {formatDate(user.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Calendar
                size={20}
                className="mt-0.5 text-gray-400"
              />

              <div>
                <p className="text-xs text-gray-500">
                  Last Login
                </p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {formatDate(user.lastLogin)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetails;