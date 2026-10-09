import {
  Heart,
  ShoppingBag,
  User,
  Menu,
  X,
  
} from "lucide-react";

import { useState } from "react";
import { useCart } from "../../context/CartContext";

import { Link} from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";
import NotificationBell from "../notification/NotificationBell";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  
  
  return (
    <>
      {/* Top Announcement */}
      <div className="bg-black px-4 py-2 text-center text-xs font-medium text-white">
        Free shipping on orders over ₹999
      </div>

      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* Main Header */}
          <div className="flex h-20 items-center justify-between gap-6">

            {/* Mobile Menu */}
            <button
              className="lg:hidden"
              onClick={() =>
                setMobileOpen(!mobileOpen)
              }
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X size={24} />
              ) : (
                <Menu size={24} />
              )}
            </button>

            {/* Logo */}
            <Link
              to="/"
              className="text-2xl font-black tracking-tight"
            >
              NOVA
            </Link>

            <div className="flex-1" />

            {/* Actions */}
            <div className="flex items-center gap-4">
              <NotificationBell />

              <Link
                to="/wishlist"
                className="relative rounded-lg p-2 hover:bg-gray-100"
                aria-label="Wishlist"
              >
                <Heart size={20} />

                {wishlistCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {wishlistCount > 99
                      ? "99+"
                      : wishlistCount}
                  </span>
                )}
              </Link>

              <Link
                to="/cart"
                className="relative rounded-lg p-2 hover:bg-gray-100"
                aria-label="Shopping cart"
              >
                <ShoppingBag size={20} />

                {itemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-white">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </Link>

              {user ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAccountMenu((prev) => !prev)}
                    // className="flex items-center gap-2 rounded-full border border-gray-200 px-2 py-1.5 text-sm font-medium text-gray-700 transition hover:text-black" 
                    className="flex items-center gap-2 px-2 py-1.5 text-bold font-bold text-gray-700 transition hover:text-black" 
                    
                  >
                    <User size={20}  />
                    {/* <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-gray-700">
                      <User size={16} strokeWidth={1.8} />
                    </span> */}
                    <span> {user?.name?.split(" ")[0]}</span>
                  </button>

                  {showAccountMenu && (
                    <div className="absolute right-0 top-full z-10 mt-2 w-40 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                      <Link
                        to="/account"
                        onClick={() => setShowAccountMenu(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Account
                      </Link>

                      <Link
                        to="/orders"
                        onClick={() => setShowAccountMenu(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        My Orders
                      </Link>

                      {/* Change Password */}
                      <Link
                        to="/change-password"
                        onClick={() => setShowAccountMenu(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Change Password
                      </Link>


                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setShowAccountMenu(false);
                        }}
                        className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
                  aria-label="Login"
                >
                  <User size={18} strokeWidth={1.8} />
                </Link>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden h-12 items-center justify-center gap-10 lg:flex">
            <Link
              to="/"
              className="text-sm font-medium hover:text-gray-500"
            >
              Home
            </Link>

            <Link
              to="/shop"
              className="text-sm font-medium hover:text-gray-500"
            >
              Shop
            </Link>

            <Link
              to="/categories"
              className="text-sm font-medium hover:text-gray-500"
            >
              Categories
            </Link>

            <Link
              to="/new-arrivals"
              className="text-sm font-medium hover:text-gray-500"
            >
              New Arrivals
            </Link>

            <Link
              to="/offers"
              className="text-sm font-medium text-red-600 hover:text-red-700"
            >
              Offers
            </Link>
          </nav>

        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="border-t border-gray-200 bg-white lg:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col px-4 py-4">

              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="border-b border-gray-100 py-4 text-sm font-medium"
              >
                Home
              </Link>

              <Link
                to="/shop"
                onClick={() => setMobileOpen(false)}
                className="border-b border-gray-100 py-4 text-sm font-medium"
              >
                Shop
              </Link>

              <Link
                to="/categories"
                onClick={() => setMobileOpen(false)}
                className="border-b border-gray-100 py-4 text-sm font-medium"
              >
                Categories
              </Link>

              <Link
                to="/new-arrivals"
                onClick={() => setMobileOpen(false)}
                className="border-b border-gray-100 py-4 text-sm font-medium"
              >
                New Arrivals
              </Link>

              <Link
                to="/offers"
                onClick={() => setMobileOpen(false)}
                className="py-4 text-sm font-medium text-red-600"
              >
                Offers
              </Link>

            </nav>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;