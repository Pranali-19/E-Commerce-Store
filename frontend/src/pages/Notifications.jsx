import {
  Bell,
  CheckCheck,
  Trash2,
  X,
} from "lucide-react";

import { useNotifications } from "../context/NotificationContext";
import { Link } from "react-router-dom";

const Notifications = () => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearNotifications,
  } = useNotifications();

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-gray-500">
              Account
            </p>

            <h1 className="text-3xl font-bold text-gray-900">
              Notifications
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Stay updated with your orders and account activity.
            </p>
          </div>

          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-100"
              >
                <CheckCheck size={16} />
                Mark all read
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={clearNotifications}
                className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 size={16} />
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell
                size={45}
                className="mx-auto mb-4 text-gray-300"
              />

              <h2 className="text-lg font-semibold text-gray-800">
                No notifications yet
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Your order and payment updates will appear here.
              </p>

              <Link
                to="/shop"
                className="mt-5 inline-block rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification._id}
                className={`relative border-b p-5 last:border-b-0 ${
                  notification.isRead
                    ? "bg-white"
                    : "bg-gray-50"
                }`}
              >
                <div className="flex gap-4">
                  <div
                    className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      notification.isRead
                        ? "bg-gray-100"
                        : "bg-black"
                    }`}
                  >
                    <Bell
                      size={18}
                      className={
                        notification.isRead
                          ? "text-gray-500"
                          : "text-white"
                      }
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {notification.title}
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-gray-600">
                          {notification.message}
                        </p>

                        <p className="mt-2 text-xs text-gray-400">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          deleteNotification(notification._id)
                        }
                        className="text-gray-400 hover:text-red-500"
                        aria-label="Delete notification"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      {!notification.isRead && (
                        <button
                          onClick={() =>
                            markAsRead(notification._id)
                          }
                          className="text-xs font-semibold text-gray-700 hover:text-black"
                        >
                          Mark as read
                        </button>
                      )}

                      {notification.order?._id && (
                        <Link
                          to={`/orders/${notification.order._id}`}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                        >
                          View Order
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
};

export default Notifications;