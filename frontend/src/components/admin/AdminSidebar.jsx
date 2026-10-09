import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  FolderTree,
  TicketPercent,
  Star,
  Store,
  X,
  Settings,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const menuItems = [
  {
    name: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Products",
    path: "/admin/products",
    icon: Package,
  },
  {
    name: "Orders",
    path: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    name: "Categories",
    path: "/admin/categories",
    icon: FolderTree,
  },
  {
    name: "Users",
    path: "/admin/users",
    icon: Users,
  },
  {
    name: "Coupons",
    path: "/admin/coupons",
    icon: TicketPercent,
  },
  {
    name: "Reviews",
    path: "/admin/reviews",
    icon: Star,
  },
  {
    name: "Inventory",
    path: "/admin/inventory",
    icon: Package,
  },
  {
    name: "Settings",
    path: "/admin/settings",
    icon: Settings,
  }
];

const AdminSidebar = ({
  isOpen,
  onClose,
}) => {
  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-gray-950 text-white transition-transform duration-300 lg:translate-x-0 ${
        isOpen
          ? "translate-x-0"
          : "-translate-x-full"
      }`}
    >
      <div className="flex h-16 items-center justify-between border-b border-gray-800 px-5">
        <div className="flex items-center gap-2">
          <Store size={22} />

          <span className="text-xl font-bold tracking-wide">
            NOVA
          </span>

          <span className="rounded bg-gray-800 px-2 py-0.5 text-[10px] uppercase">
            Admin
          </span>
        </div>

        <button
          onClick={onClose}
          className="lg:hidden"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-white text-gray-950"
                    : "text-gray-400 hover:bg-gray-900 hover:text-white"
                }`
              }
            >
              <Icon size={19} />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-gray-800 p-4">
        <NavLink
          to="/"
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-gray-400 hover:bg-gray-900 hover:text-white"
        >
          <Store size={19} />
          View Store
        </NavLink>
      </div>
    </aside>
  );
};

export default AdminSidebar;