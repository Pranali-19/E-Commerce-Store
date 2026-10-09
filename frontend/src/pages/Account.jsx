import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  Edit,
  Home,
  MapPin,
  Plus,
  Trash2,
  Briefcase,
  Package,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

import Button from "../components/common/Button";
import Input from "../components/common/Input";
import LoadingSpinner from "../components/common/LoadingSpinner";

const emptyForm = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  type: "home",
  isDefault: false,
};

const Account = () => {
  const { user } = useAuth();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchAddresses = async () => {
    try {
      setLoading(true);

      const response = await api.get("/addresses");

      setAddresses(response.data.data);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to load addresses."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchAddresses();
    }, 0);
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } =
      event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const openAddForm = () => {
    setEditingId(null);

    setForm({
      ...emptyForm,
      fullName: user?.name || "",
      phone: user?.phone || "",
    });

    setShowForm(true);
  };

  const openEditForm = (address) => {
    setEditingId(address._id);

    setForm({
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country || "India",
      type: address.type || "home",
      isDefault: address.isDefault,
    });

    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !form.fullName ||
      !form.phone ||
      !form.addressLine1 ||
      !form.city ||
      !form.state ||
      !form.postalCode
    ) {
      toast.error(
        "Please fill all required fields."
      );
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        await api.put(
          `/addresses/${editingId}`,
          form
        );

        toast.success(
          "Address updated successfully."
        );
      } else {
        await api.post("/addresses", form);

        toast.success(
          "Address added successfully."
        );
      }

      closeForm();
      await fetchAddresses();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to save address."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this address?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/addresses/${id}`);

      toast.success(
        "Address deleted successfully."
      );

      await fetchAddresses();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to delete address."
      );
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.patch(
        `/addresses/${id}/default`
      );

      toast.success(
        "Default address updated."
      );

      await fetchAddresses();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to update default address."
      );
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Account Header */}
      <div className="rounded-2xl bg-gray-900 p-6 text-white sm:p-8">
        <p className="text-sm text-gray-400">
          My Account
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          Welcome, {user?.name}
        </h1>

        <p className="mt-2 text-gray-400">
          {user?.email}
        </p>
      </div>

    
      {/* Address Header */}
      <div className="mt-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Delivery Addresses
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Manage your saved delivery addresses.
          </p>
        </div>

        <Button onClick={openAddForm}>
          <Plus size={18} />
          Add Address
        </Button>
      </div>

      {/* Address Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">
              {editingId
                ? "Edit Address"
                : "Add New Address"}
            </h3>

            <button
              type="button"
              onClick={closeForm}
              className="text-sm text-gray-500 hover:text-black"
            >
              Cancel
            </button>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Input
              label="Full Name"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              required
            />

            <Input
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
            />

            <Input
              label="Address Line 1"
              name="addressLine1"
              value={form.addressLine1}
              onChange={handleChange}
              required
            />

            <Input
              label="Address Line 2"
              name="addressLine2"
              value={form.addressLine2}
              onChange={handleChange}
            />

            <Input
              label="City"
              name="city"
              value={form.city}
              onChange={handleChange}
              required
            />

            <Input
              label="State"
              name="state"
              value={form.state}
              onChange={handleChange}
              required
            />

            <Input
              label="Postal Code"
              name="postalCode"
              value={form.postalCode}
              onChange={handleChange}
              required
            />

            <Input
              label="Country"
              name="country"
              value={form.country}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-gray-700">
              Address Type
            </p>

            <div className="flex flex-wrap gap-3">
              {[
                ["home", "Home", Home],
                ["office", "Office", Briefcase],
                ["other", "Other", MapPin],
              ].map(([value, label, Icon]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      type: value,
                    }))
                  }
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${
                    form.type === value
                      ? "border-black bg-black text-white"
                      : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <label className="mt-5 flex items-center gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              name="isDefault"
              checked={form.isDefault}
              onChange={handleChange}
              className="h-4 w-4 rounded"
            />

            Make this my default address
          </label>

          <div className="mt-6 flex gap-3">
            <Button
              type="submit"
              loading={saving}
            >
              {editingId
                ? "Update Address"
                : "Save Address"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={closeForm}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Addresses */}
      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <MapPin
            size={40}
            className="mx-auto text-gray-400"
          />

          <h3 className="mt-4 text-lg font-bold">
            No saved addresses
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Add an address to make checkout faster.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {addresses.map((address) => (
            <div
              key={address._id}
              className={`rounded-2xl border bg-white p-5 shadow-sm ${
                address.isDefault
                  ? "border-black"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    {address.type === "office" ? (
                      <Briefcase size={18} />
                    ) : (
                      <Home size={18} />
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold">
                      {address.fullName}
                    </h3>

                    <p className="text-xs uppercase text-gray-400">
                      {address.type}
                    </p>
                  </div>
                </div>

                {address.isDefault && (
                  <span className="flex items-center gap-1 rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                    <Check size={13} />
                    Default
                  </span>
                )}
              </div>

              <div className="mt-5 space-y-1 text-sm text-gray-600">
                <p>{address.addressLine1}</p>

                {address.addressLine2 && (
                  <p>{address.addressLine2}</p>
                )}

                <p>
                  {address.city}, {address.state}{" "}
                  {address.postalCode}
                </p>

                <p>{address.country}</p>

                <p className="pt-2 font-medium text-gray-900">
                  Phone: {address.phone}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    openEditForm(address)
                  }
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100"
                >
                  <Edit size={15} />
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleDelete(address._id)
                  }
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={15} />
                  Delete
                </button>

                {!address.isDefault && (
                  <button
                    type="button"
                    onClick={() =>
                      handleSetDefault(address._id)
                    }
                    className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100"
                  >
                    Make Default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default Account;