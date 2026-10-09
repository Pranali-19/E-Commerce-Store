import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CheckCheck,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useNotifications } from "../../context/NotificationContext";

const NotificationBell = () => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    if (notification.order?._id) {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="relative"
    >
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100"
        aria-label="Notifications"
      >
        <Bell size={21} />

        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex min-h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-3 w-90 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h3 className="font-semibold text-gray-900">
                Notifications
              </h3>

              {unreadCount > 0 && (
                <p className="text-xs text-gray-500">
                  {unreadCount} unread
                </p>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-black"
              >
                <CheckCheck size={15} />
                Mark all read
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-105 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-gray-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell
                  size={30}
                  className="mx-auto mb-3 text-gray-300"
                />

                <p className="font-medium text-gray-700">
                  No notifications
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  You're all caught up.
                </p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification._id}
                  className={`group relative border-b px-4 py-3 transition ${
                    notification.isRead
                      ? "bg-white"
                      : "bg-gray-50"
                  }`}
                >
                  <div
                    className="cursor-pointer pr-7"
                    onClick={() =>
                      handleNotificationClick(notification)
                    }
                  >
                    <div className="flex gap-3">
                      <div
                        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                          notification.isRead
                            ? "bg-transparent"
                            : "bg-black"
                        }`}
                      />

                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {notification.title}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-gray-600">
                          {notification.message}
                        </p>

                        <p className="mt-1 text-[11px] text-gray-400">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      deleteNotification(notification._id)
                    }
                    className="absolute right-3 top-3 hidden text-gray-400 hover:text-red-500 group-hover:block"
                    aria-label="Delete notification"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t p-3">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="block text-center text-sm font-medium text-gray-700 hover:text-black"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;