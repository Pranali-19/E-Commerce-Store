import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route} from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext.jsx";
import { WishlistProvider } from "./context/WishlistContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";

import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import AdminRoute from "./components/auth/AdminRoute.jsx";

import Contact from "./components/layout/Contact.jsx";
import ChangePassword from "./components/layout/ChangePassword.jsx";
import CustomerLayout from "./components/layout/CustomerLayout.jsx";
import AdminLayout from "./components/admin/AdminLayout.jsx";

const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));

const Home = lazy(() => import("./pages/Home.jsx"));
const Shop = lazy(() => import("./pages/Shop.jsx"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Cart = lazy(() => import("./pages/Cart.jsx"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Account = lazy(() => import("./pages/Account.jsx"));
const Checkout = lazy(() => import("./pages/Checkout.jsx"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation.jsx"));
const Orders = lazy(() => import("./pages/Orders.jsx"));
const OrderDetails = lazy(() => import("./pages/OrderDetails.jsx"));
const Notifications = lazy(() => import("./pages/Notifications.jsx"));
const Categories = lazy(() => import("./pages/Categories.jsx"));
const NewArrivals = lazy(() => import("./pages/NewArrivals.jsx"));
const Offers = lazy(() => import("./pages/Offers.jsx"));

const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminOrderDetails = lazy(() => import("./pages/admin/AdminOrderDetails.jsx"));
const AdminProductForm = lazy(() => import("./pages/admin/AdminProductForm.jsx"));
const AdminUserDetails = lazy(() => import("./pages/admin/AdminUserDetails.jsx"));
const AdminReviewDetails = lazy(() => import("./pages/admin/AdminReviewDetails.jsx"));
const AdminInventory = lazy(() => import("./pages/admin/AdminInventory.jsx"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings.jsx"));



const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <CartProvider>
            <WishlistProvider>
              <Toaster position="top-right" />

              <main>
                <Suspense
                  fallback={
                    <div className="flex min-h-screen items-center justify-center text-slate-600">
                      Loading...
                    </div>
                  }
                >
                  <Routes>
                    {/* Customer path */}
                    <Route element={<CustomerLayout />} >
                      <Route path="/" element={<Home />} />
                      <Route path="/shop" element={<Shop />} />
                      <Route path="/categories" element={<Categories />} />
                      <Route path="/new-arrivals" element={<NewArrivals />} />
                      <Route path="/offers" element={<Offers />} />
                      <Route path="/products/:id" element={<ProductDetails />} />

                      <Route 
                        path="/cart" 
                        element={
                          <ProtectedRoute>
                            <Cart />
                        </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/wishlist"
                        element={
                          <ProtectedRoute>
                            <Wishlist />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/account"
                        element={
                          <ProtectedRoute>
                            <Account />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/checkout"
                        element={
                          <ProtectedRoute>
                            <Checkout />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/order-confirmation"
                        element={
                          <ProtectedRoute>
                            <OrderConfirmation />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/orders"
                        element={
                          <ProtectedRoute>
                            <Orders />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/orders/:id"
                        element={
                          <ProtectedRoute>
                            <OrderDetails />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/notifications"
                        element={
                          <ProtectedRoute>
                            <Notifications />
                          </ProtectedRoute>
                        }
                      />
                    </Route>


                    {/* Auth pages */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/change-password" element={<ChangePassword />} />


                    {/* Admin path */}
                    <Route
                      path="/admin"
                      element={
                        <AdminRoute>
                          <AdminLayout />
                        </AdminRoute>
                      }
                    >
                      <Route index element={<AdminDashboard />} />
                      <Route path="products" element={<AdminProducts />} />
                      <Route path="products/new" element={<AdminProductForm />} />
                      <Route path="products/edit/:id" element={<AdminProductForm />} />
                      <Route path="orders" element={<AdminOrders />} />
                      <Route path="orders/:id" element={<AdminOrderDetails />} />
                      <Route path="categories" element={<AdminCategories />} />
                      <Route path="users" element={<AdminUsers />} />
                      <Route path="users/:id" element={<AdminUserDetails />} />
                      <Route path="coupons" element={<AdminCoupons />} />
                      <Route path="reviews" element={<AdminReviews />} />
                      <Route path="reviews/:id" element={<AdminReviewDetails />} />
                      <Route path="inventory" element={<AdminInventory />} />
                      <Route path="settings" element={<AdminSettings />} />
                    </Route>

                  </Routes>
                </Suspense>
              </main>


            </WishlistProvider>
          </CartProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
};
    
export default App;