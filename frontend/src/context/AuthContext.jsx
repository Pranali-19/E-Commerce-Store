import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      const response = await api.get("/auth/me");

      setUser(response.data.data.user);
    } catch (error) {
      console.error("Authentication check failed:", error);

      localStorage.removeItem("token");
      delete api.defaults.headers.common.Authorization;

      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post(
        "/auth/register",
        userData
      );

      const { token, user } = response.data.data;

      localStorage.setItem("token", token);

      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      setUser(user);

      toast.success("Account created successfully!");

      return {
        success: true,
        user,
      };
    } catch (error) {
      const message =
        error.response?.data?.errors?.[0]?.message ||
        error.response?.data?.message ||
        "Registration failed.";

      toast.error(message);

      return {
        success: false,
        message,
      };
    }
  };

  const login = async (credentials) => {
    try {
      const response = await api.post(
        "/auth/login",
        credentials
      );

      const { token, user } = response.data.data;

      localStorage.setItem("token", token);

      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      setUser(user);

      toast.success(`Welcome back, ${user.name}!`);

      return {
        success: true,
        user,
      };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Login failed.";

      toast.error(message);

      return {
        success: false,
        message,
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");

    delete api.defaults.headers.common.Authorization;

    setUser(null);

    toast.success("Logged out successfully.");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};