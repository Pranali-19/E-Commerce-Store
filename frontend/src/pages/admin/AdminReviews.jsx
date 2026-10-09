import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import ProductImage from "../../components/common/ProductImage";

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [approved, setApproved] = useState("");
  const [rating, setRating] = useState("");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const [actionLoading, setActionLoading] = useState(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (search.trim()) {
        params.append("search", search.trim());
      }

      if (approved) {
        params.append("approved", approved);
      }

      if (rating) {
        params.append("rating", rating);
      }

      params.append("page", page);
      params.append("limit", 10);

      const response = await api.get(`/admin/reviews?${params.toString()}`);

      setReviews(
        (response.data?.data?.reviews || []).map((review) => ({
          ...review,
          _id: review._id ?? review.id,
        }))
      );

      setPagination(
        response.data?.data?.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
        }
      );
    } catch (error) {
      console.error("Failed to fetch reviews:", error);

      toast.error(
        error.response?.data?.message || "Failed to load reviews"
      );
    } finally {
      setLoading(false);
    }
  // }, [search, approved, rating, page]);
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReviews();
  };

  const handleApproval = async (reviewId, isApproved) => {
    try {
      setActionLoading(reviewId);

      await api.patch(`/admin/reviews/${reviewId}/approval`, {
        isApproved,
      });

      toast.success(
        isApproved
          ? "Review approved successfully"
          : "Review rejected successfully"
      );

      fetchReviews();
    } catch (error) {
      console.error("Failed to update review:", error);

      toast.error(
        error.response?.data?.message || "Failed to update review"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (reviewId) => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this review?"
    );

    if (!confirmed) return;

    try {
      setActionLoading(reviewId);

      await api.delete(`/admin/reviews/${reviewId}`);

      toast.success("Review deleted successfully");

      if (reviews.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        fetchReviews();
      }
    } catch (error) {
      console.error("Failed to delete review:", error);

      toast.error(
        error.response?.data?.message || "Failed to delete review"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const renderStars = (ratingValue) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={15}
            className={
              star <= ratingValue
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }
          />
        ))}
      </div>
    );
  };

  const getProductImage = (review) => review.product?.images?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Review Management
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Review, approve, reject, and manage customer reviews.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 gap-3 md:grid-cols-4"
        >
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search reviews..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-gray-900"
            />
          </div>

          {/* Approval */}
          <select
            value={approved}
            onChange={(e) => {
              setApproved(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
          >
            <option value="">All Reviews</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
          </select>

          {/* Rating */}
          <select
            value={rating}
            onChange={(e) => {
              setRating(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </form>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {pagination.total} review
          {pagination.total !== 1 ? "s" : ""}
        </p>

        <button
          onClick={fetchReviews}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {/* Reviews */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-75 items-center justify-center">
            <Loader2 className="animate-spin text-gray-500" size={28} />
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex min-h-75 flex-col items-center justify-center px-6 text-center">
            <Star size={40} className="mb-3 text-gray-300" />

            <h3 className="text-lg font-semibold text-gray-900">
              No reviews found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Reviewer
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Product
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Rating / Review
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {reviews.map((review) => (
                    <tr key={review._id} className="hover:bg-gray-50">
                      {/* Reviewer */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {review.user?.avatar ? (
                            <img
                              src={review.user.avatar}
                              alt={review.user?.name || "Reviewer"}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                              {review.user?.name
                                ?.charAt(0)
                                ?.toUpperCase() || "U"}
                            </div>
                          )}

                          <div>
                            <p className="font-medium text-gray-900">
                              {review.user?.name || "Unknown User"}
                            </p>

                            <p className="text-xs text-gray-500">
                              {review.user?.email || "No email"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Product */}
                      <td className="px-5 py-4">
                        <div className="flex max-w-55 items-center gap-3">
                          <ProductImage
                            image={getProductImage(review)}
                            alt={review.product?.name || "Product"}
                            className="h-12 w-12 rounded-lg border border-gray-200"
                          />

                          <div>
                            <p className="line-clamp-2 text-sm font-medium text-gray-900">
                              {review.product?.name || "Unknown Product"}
                            </p>

                            {review.product?.price !== undefined && (
                              <p className="mt-1 text-xs text-gray-500">
                                ₹{Number(review.product.price).toLocaleString("en-IN")}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Review */}
                      <td className="max-w-[320px] px-5 py-4">
                        <div className="space-y-1">
                          {renderStars(review.rating)}

                          {review.title && (
                            <p className="font-medium text-gray-900">
                              {review.title}
                            </p>
                          )}

                          <p className="line-clamp-2 text-sm text-gray-600">
                            {review.comment || "No comment"}
                          </p>

                          {review.isVerifiedPurchase && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                              <Check size={13} />
                              Verified Purchase
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {review.isApproved ? (
                          <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/admin/reviews/${review._id}`}
                            className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50"
                            title="View"
                          >
                            <Eye size={16} />
                          </Link>

                          {review.isApproved ? (
                            <button
                              onClick={() =>
                                handleApproval(review._id, false)
                              }
                              disabled={actionLoading === review._id}
                              className="rounded-lg border border-yellow-200 p-2 text-yellow-600 transition hover:bg-yellow-50 disabled:opacity-50"
                              title="Reject"
                            >
                              <X size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                handleApproval(review._id, true)
                              }
                              disabled={actionLoading === review._id}
                              className="rounded-lg border border-green-200 p-2 text-green-600 transition hover:bg-green-50 disabled:opacity-50"
                              title="Approve"
                            >
                              <Check size={16} />
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(review._id)}
                            disabled={actionLoading === review._id}
                            className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            title="Delete"
                          >
                            {actionLoading === review._id ? (
                              <Loader2
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="divide-y divide-gray-100 md:hidden">
              {reviews.map((review) => (
                <div key={review._id} className="space-y-4 p-4">
                  {/* User */}
                  <div className="flex items-center gap-3">
                    {review.user?.avatar ? (
                      <img
                        src={review.user.avatar}
                        alt={review.user?.name || "Reviewer"}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 font-semibold text-gray-600">
                        {review.user?.name
                          ?.charAt(0)
                          ?.toUpperCase() || "U"}
                      </div>
                    )}

                    <div>
                      <p className="font-medium text-gray-900">
                        {review.user?.name || "Unknown User"}
                      </p>

                      <p className="text-xs text-gray-500">
                        {review.user?.email || "No email"}
                      </p>
                    </div>
                  </div>

                  {/* Product */}
                  <div className="flex gap-3">
                    <ProductImage
                      image={getProductImage(review)}
                      alt={review.product?.name || "Product"}
                      className="h-16 w-16 rounded-lg border"
                    />

                    <div>
                      <p className="font-medium text-gray-900">
                        {review.product?.name || "Unknown Product"}
                      </p>

                      <div className="mt-1">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                  </div>

                  {/* Review */}
                  <div>
                    {review.title && (
                      <p className="font-semibold text-gray-900">
                        {review.title}
                      </p>
                    )}

                    <p className="mt-1 text-sm text-gray-600">
                      {review.comment || "No comment"}
                    </p>

                    {review.isVerifiedPurchase && (
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-green-600">
                        <Check size={13} />
                        Verified Purchase
                      </span>
                    )}
                  </div>

                  {/* Status + actions */}
                  <div className="flex items-center justify-between gap-3">
                    {review.isApproved ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        Approved
                      </span>
                    ) : (
                      <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                        Pending
                      </span>
                    )}

                    <div className="flex gap-2">
                      <Link
                        to={`/admin/reviews/${review._id}`}
                        className="rounded-lg border p-2 text-gray-600"
                      >
                        <Eye size={16} />
                      </Link>

                      {review.isApproved ? (
                        <button
                          onClick={() =>
                            handleApproval(review._id, false)
                          }
                          disabled={actionLoading === review._id}
                          className="rounded-lg border border-yellow-200 p-2 text-yellow-600"
                        >
                          <X size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            handleApproval(review._id, true)
                          }
                          disabled={actionLoading === review._id}
                          className="rounded-lg border border-green-200 p-2 text-green-600"
                        >
                          <Check size={16} />
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(review._id)}
                        disabled={actionLoading === review._id}
                        className="rounded-lg border border-red-200 p-2 text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {!loading && pagination.pages > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.pages}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setPage((prev) => Math.max(prev - 1, 1))
              }
              disabled={page <= 1}
              className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={() =>
                setPage((prev) =>
                  Math.min(prev + 1, pagination.pages)
                )
              }
              disabled={page >= pagination.pages}
              className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;