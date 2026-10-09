
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LockKeyhole,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api.js";

const PasswordInput = ({
  label,
  name,
  field,
  value,
  placeholder,
  showPasswords,
  onTogglePassword,
  onChange,
}) => (
  <div>
    <label
      htmlFor={name}
      className="mb-2 block text-sm font-medium text-gray-700"
    >
      {label}
    </label>

    <div className="relative">
      <input
        id={name}
        type={showPasswords[field] ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="current-password"
        required
        className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />

      <button
        type="button"
        onClick={() => onTogglePassword(field)}
        aria-label={showPasswords[field] ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-600"
      >
        {showPasswords[field] ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  </div>
);

const ChangePassword = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const togglePassword = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const passwordChecks = [
    {
      label: "At least 8 characters",
      valid: formData.newPassword.length >= 8,
    },
    {
      label: "One uppercase letter",
      valid: /[A-Z]/.test(formData.newPassword),
    },
    {
      label: "One lowercase letter",
      valid: /[a-z]/.test(formData.newPassword),
    },
    {
      label: "One number",
      valid: /\d/.test(formData.newPassword),
    },
    {
      label: "One special character",
      valid: /[^A-Za-z0-9]/.test(formData.newPassword),
    },
  ];

  const isPasswordStrong = passwordChecks.every((check) => check.valid);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { currentPassword, newPassword, confirmPassword } = formData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (!isPasswordStrong) {
      toast.error("Please meet all password requirements.");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("Your new password must be different.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await api.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      toast.success("Password changed successfully!");

      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      navigate("/account");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to change password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate("/admin")}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
        >
          <ArrowLeft size={18} />
          Back to My Account
        </button>

        {/* Main Card */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {/* Header */}
          {/* <div className="bg-linear-to-r from-indigo-700 to-purple-700 px-6 py-8 text-white sm:px-8"> */}
            <div className="bg-linear-to-r bg-gray-800 px-6 py-8 text-white sm:px-8">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white/15">
              <LockKeyhole size={28} />
            </div>

            <h1 className="text-2xl font-bold sm:text-3xl">
              Change Password
            </h1>

            <p className="mt-2 text-sm leading-6 text-indigo-100">
              Update your password regularly to help keep your account secure.
            </p>
          </div>

          {/* Form */}
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <PasswordInput
                label="Current Password"
                name="currentPassword"
                field="current"
                value={formData.currentPassword}
                placeholder="Enter your current password"
                showPasswords={showPasswords}
                onTogglePassword={togglePassword}
                onChange={handleChange}
              />

              <div>
                <PasswordInput
                  label="New Password"
                  name="newPassword"
                  field="new"
                  value={formData.newPassword}
                  placeholder="Enter your new password"
                  showPasswords={showPasswords}
                  onTogglePassword={togglePassword}
                  onChange={handleChange}
                />

                {/* Password Requirements */}
                <div className="mt-4 rounded-xl bg-gray-50 p-4">
                  <p className="mb-3 text-sm font-semibold text-gray-700">
                    Password requirements
                  </p>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {passwordChecks.map((check) => (
                      <div
                        key={check.label}
                        className="flex items-center gap-2 text-sm"
                      >
                        <CheckCircle2
                          size={16}
                          className={
                            check.valid ? "text-green-600" : "text-gray-300"
                          }
                        />
                        <span
                          className={
                            check.valid ? "text-green-700" : "text-gray-500"
                          }
                        >
                          {check.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <PasswordInput
                label="Confirm New Password"
                name="confirmPassword"
                field="confirm"
                value={formData.confirmPassword}
                placeholder="Re-enter your new password"
                showPasswords={showPasswords}
                onTogglePassword={togglePassword}
                onChange={handleChange}
              />

              {formData.confirmPassword &&
                formData.newPassword !== formData.confirmPassword && (
                  <p className="text-sm text-red-600">
                    Passwords do not match.
                  </p>
                )}

              {formData.confirmPassword &&
                formData.newPassword === formData.confirmPassword && (
                  <p className="text-sm text-green-600">
                    Passwords match.
                  </p>
                )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ShieldCheck size={19} />
                {loading ? "Updating Password..." : "Update Password"}
              </button>
            </form>

            <div className="mt-6 flex gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <ShieldCheck
                size={21}
                className="mt-0.5 shrink-0 text-indigo-600"
              />
              <p className="text-sm leading-6 text-indigo-800">
                Never share your password with anyone. Use a unique password
                that you don't use on other websites.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;