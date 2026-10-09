import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Loader2,
  Star,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import ProductImage from "../../components/common/ProductImage";

const AdminReviewDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReview = async () => {
    try {
      setLoading(true);

      const response = await api.get(`/admin/reviews/${id}`);

      setReview(response.data?.data?.review ?? response.data?.data ?? null);
    } catch (error) {
      console.error("Failed to fetch review:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to load review"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReview();
  }, [id]);

  const handleApproval = async (isApproved) => {
    try {
      setActionLoading(true);

      const response = await api.patch(
        `/admin/reviews/${id}/approval`,
        {
          isApproved,
        }
      );

      setReview(response.data?.data?.review ?? response.data?.data ?? null);

      toast.success(
        isApproved
          ? "Review approved successfully"
          : "Review rejected successfully"
      );
    } catch (error) {
      console.error("Failed to update review:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to update review"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this review?"
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);

      await api.delete(`/admin/reviews/${id}`);

      toast.success("Review deleted successfully");

      navigate("/admin/reviews");
    } catch (error) {
      console.error("Failed to delete review:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to delete review"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={22}
            className={
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <Loader2
          size={32}
          className="animate-spin text-gray-500"
        />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Review not found
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          The review may have been deleted or does not exist.
        </p>

        <Link
          to="/admin/reviews"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          <ArrowLeft size={16} />
          Back to Reviews
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/admin/reviews"
            className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            Back to Reviews
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">
            Review Details
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View and manage customer review details.
          </p>
        </div>

        {/* Status */}
        {review.isApproved ? (
          <span className="w-fit rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
            Approved
          </span>
        ) : (
          <span className="w-fit rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-700">
            Pending
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Review */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                {renderStars(review.rating)}

                {review.title && (
                  <h2 className="mt-4 text-xl font-semibold text-gray-900">
                    {review.title}
                  </h2>
                )}
              </div>

              {review.isVerifiedPurchase && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  <Check size={14} />
                  Verified Purchase
                </span>
              )}
            </div>

            <div className="mt-6 border-t border-gray-100 pt-5">
              <p className="whitespace-pre-wrap leading-7 text-gray-700">
                {review.comment || "No comment provided."}
              </p>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-500">
                Submitted:{" "}
                {review.createdAt
                  ? new Date(review.createdAt).toLocaleString("en-IN")
                  : "N/A"}
              </p>

              {review.updatedAt && (
                <p className="mt-1 text-xs text-gray-500">
                  Updated:{" "}
                  {new Date(review.updatedAt).toLocaleString("en-IN")}
                </p>
              )}
            </div>
          </div>

          {/* Product */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Product
            </h2>

            <div className="mt-4 flex items-center gap-4">
              <ProductImage
                image={review.product?.images?.[0]}
                alt={review.product?.name || "Product"}
                className="h-20 w-20 rounded-lg border border-gray-200"
              />

              <div>
                <p className="font-semibold text-gray-900">
                  {review.product?.name || "Unknown Product"}
                </p>

                {review.product?.price !== undefined && (
                  <p className="mt-1 text-sm text-gray-500">
                    ₹
                    {Number(review.product.price).toLocaleString(
                      "en-IN"
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Reviewer */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Reviewer
            </h2>

            <div className="mt-5 flex items-center gap-3">
              {review.user?.avatar ? (
                <img
                  src={review.user.avatar}
                  alt={review.user?.name || "Reviewer"}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 font-semibold text-gray-600">
                  {review.user?.name
                    ?.charAt(0)
                    ?.toUpperCase() || "U"}
                </div>
              )}

              <div className="min-w-0">
                <p className="font-semibold text-gray-900">
                  {review.user?.name || "Unknown User"}
                </p>

                <p className="break-all text-sm text-gray-500">
                  {review.user?.email || "No email"}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Actions
            </h2>

            <div className="mt-5 space-y-3">
              {review.isApproved ? (
                <button
                  onClick={() => handleApproval(false)}
                  disabled={actionLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm font-semibold text-yellow-700 transition hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <X size={17} />
                  )}
                  Reject Review
                </button>
              ) : (
                <button
                  onClick={() => handleApproval(true)}
                  disabled={actionLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Check size={17} />
                  )}
                  Approve Review
                </button>
              )}

              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Trash2 size={17} />
                )}
                Delete Review
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReviewDetails;