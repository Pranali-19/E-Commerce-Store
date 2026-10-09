import {
  Bell,
  ChevronDown,
  ExternalLink,
  KeyRound,
  LogOut,
  Menu,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const AdminHeader = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    navigate("/login");
  };

  const userInitial = user?.name?.trim()?.charAt(0)?.toUpperCase() || "R";

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm sm:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
      >
        <Menu size={22} />
      </button>

      <div className="hidden lg:block">
        <h1 className="font-semibold text-gray-900">Admin Panel</h1>

        <p className="text-xs text-gray-500">Manage your NOVA store</p>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <Link
          to="/"
          target="_blank"
          className="hidden items-center gap-2 text-sm text-gray-600 hover:text-black sm:flex"
        >
          View Store
          <ExternalLink size={15} />
        </Link>

        <Link
          to="/notifications"
          className="rounded-full p-2 hover:bg-gray-100"
        >
          <Bell size={20} />
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowProfileMenu((prev) => !prev)}
            className="flex items-center gap-2  px-2 py-1.5 text-gray-700 transition hover:border-gray-300 hover:text-black"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
              {userInitial}
            </div>

            <div className="hidden sm:block">
              <p className="text-left text-sm font-semibold text-gray-900">
                {user?.name || "Admin"}
              </p>

              <p className="text-left text-xs text-gray-500">Administrator</p>
            </div>

            {/* <ChevronDown size={16} className="hidden text-gray-500 sm:block" /> */}
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
              <Link
                to="/change-password"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <KeyRound size={15} />
                Change Password
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;