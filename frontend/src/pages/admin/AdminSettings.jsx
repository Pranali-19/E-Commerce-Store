import { useEffect, useState } from "react";
import {
  Save,
  Store,
  Mail,
  Phone,
  MapPin,
  Truck,
  Percent,
  Bell,
  Settings,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    storeName: "",
    description: "",
    supportEmail: "",
    contactEmail: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
    },
    currency: "INR",
    currencySymbol: "₹",
    taxEnabled: false,
    taxPercentage: 0,
    shippingEnabled: true,
    shippingCharge: 0,
    freeShippingMinimum: 0,
    minimumOrderAmount: 0,
    lowStockThreshold: 5,
    notificationsEnabled: true,
    emailNotificationsEnabled: true,
    orderNotificationsEnabled: true,
    maintenanceMode: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);

      const response = await api.get("/admin/settings");

      const settings = response.data?.data;

      if (settings) {
        setFormData((prev) => ({
          ...prev,
          ...settings,
          address: {
            ...prev.address,
            ...(settings.address || {}),
          },
        }));
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to load store settings"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value,
      },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const payload = {
        ...formData,
        taxPercentage: Number(formData.taxPercentage),
        shippingCharge: Number(formData.shippingCharge),
        freeShippingMinimum: Number(
          formData.freeShippingMinimum
        ),
        minimumOrderAmount: Number(
          formData.minimumOrderAmount
        ),
        lowStockThreshold: Number(
          formData.lowStockThreshold
        ),
      };

      const response = await api.put(
        "/admin/settings",
        payload
      );

      const updatedSettings = response.data?.data;

      if (updatedSettings) {
        setFormData((prev) => ({
          ...prev,
          ...updatedSettings,
          address: {
            ...prev.address,
            ...(updatedSettings.address || {}),
          },
        }));
      }

      toast.success(
        response.data?.message ||
          "Store settings updated successfully"
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to update store settings"
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900";

  const sectionClass =
    "rounded-xl border border-gray-200 bg-white p-5 shadow-sm";

  if (loading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <div className="text-sm text-gray-500">
          Loading store settings...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Store Settings
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your store configuration and business
            settings.
          </p>
        </div>

        <button
          type="submit"
          form="store-settings-form"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={17} />

          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <form
        id="store-settings-form"
        onSubmit={handleSave}
        className="space-y-6"
      >
        {/* Store Information */}
        <section className={sectionClass}>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2">
              <Store size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Store Information
              </h2>
              <p className="text-xs text-gray-500">
                Basic information displayed across the
                store.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Store Name
              </label>

              <input
                type="text"
                name="storeName"
                value={formData.storeName}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Phone
              </label>

              <div className="relative">
                <Phone
                  size={17}
                  className="absolute left-3 top-3 text-gray-400"
                />

                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Store Description
              </label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className={sectionClass}>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2">
              <Mail size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Contact Information
              </h2>
              <p className="text-xs text-gray-500">
                Customer support and contact details.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Support Email
              </label>

              <input
                type="email"
                name="supportEmail"
                value={formData.supportEmail}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Contact Email
              </label>

              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* Address */}
        <section className={sectionClass}>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2">
              <MapPin size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Store Address
              </h2>
              <p className="text-xs text-gray-500">
                Business address displayed to customers.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Street
              </label>

              <input
                type="text"
                name="street"
                value={formData.address.street}
                onChange={handleAddressChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                City
              </label>

              <input
                type="text"
                name="city"
                value={formData.address.city}
                onChange={handleAddressChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                State
              </label>

              <input
                type="text"
                name="state"
                value={formData.address.state}
                onChange={handleAddressChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Postal Code
              </label>

              <input
                type="text"
                name="postalCode"
                value={formData.address.postalCode}
                onChange={handleAddressChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Country
              </label>

              <input
                type="text"
                name="country"
                value={formData.address.country}
                onChange={handleAddressChange}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* Currency & Tax */}
        <section className={sectionClass}>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2">
              <Percent size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Currency & Tax
              </h2>
              <p className="text-xs text-gray-500">
                Configure pricing and tax settings.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Currency
              </label>

              <input
                type="text"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                maxLength={3}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Currency Symbol
              </label>

              <input
                type="text"
                name="currencySymbol"
                value={formData.currencySymbol}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div className="flex items-center gap-3 pt-7">
              <input
                id="taxEnabled"
                type="checkbox"
                name="taxEnabled"
                checked={formData.taxEnabled}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300"
              />

              <label
                htmlFor="taxEnabled"
                className="text-sm font-medium text-gray-700"
              >
                Enable Tax
              </label>
            </div>

            {formData.taxEnabled && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Tax Percentage
                </label>

                <input
                  type="number"
                  name="taxPercentage"
                  value={formData.taxPercentage}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.01"
                  className={inputClass}
                />
              </div>
            )}
          </div>
        </section>

        {/* Shipping */}
        <section className={sectionClass}>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2">
              <Truck size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Shipping
              </h2>
              <p className="text-xs text-gray-500">
                Configure shipping charges and thresholds.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <input
                id="shippingEnabled"
                type="checkbox"
                name="shippingEnabled"
                checked={formData.shippingEnabled}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300"
              />

              <label
                htmlFor="shippingEnabled"
                className="text-sm font-medium text-gray-700"
              >
                Enable Shipping
              </label>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Shipping Charge
              </label>

              <input
                type="number"
                name="shippingCharge"
                value={formData.shippingCharge}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Free Shipping Above
              </label>

              <input
                type="number"
                name="freeShippingMinimum"
                value={formData.freeShippingMinimum}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Minimum Order Amount
              </label>

              <input
                type="number"
                name="minimumOrderAmount"
                value={formData.minimumOrderAmount}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Low Stock Threshold
              </label>

              <input
                type="number"
                name="lowStockThreshold"
                value={formData.lowStockThreshold}
                onChange={handleChange}
                min="0"
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className={sectionClass}>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2">
              <Bell size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Notifications
              </h2>
              <p className="text-xs text-gray-500">
                Control store notification behavior.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                name: "notificationsEnabled",
                label: "Enable Notifications",
              },
              {
                name: "emailNotificationsEnabled",
                label: "Enable Email Notifications",
              },
              {
                name: "orderNotificationsEnabled",
                label: "Enable Order Notifications",
              },
            ].map((item) => (
              <label
                key={item.name}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-4"
              >
                <span className="text-sm font-medium text-gray-700">
                  {item.label}
                </span>

                <input
                  type="checkbox"
                  name={item.name}
                  checked={formData[item.name]}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </label>
            ))}
          </div>
        </section>

        {/* Maintenance */}
        <section className={sectionClass}>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2">
              <Settings size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Store Status
              </h2>
              <p className="text-xs text-gray-500">
                Control the availability of your storefront.
              </p>
            </div>
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-4">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Maintenance Mode
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Temporarily disable customer access to the
                store.
              </p>
            </div>

            <input
              type="checkbox"
              name="maintenanceMode"
              checked={formData.maintenanceMode}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300"
            />
          </label>
        </section>

        {/* Bottom Save */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={17} />

            {saving
              ? "Saving..."
              : "Save Store Settings"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;