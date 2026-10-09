import { useEffect, useState } from "react";
import { Edit3, Trash2, User } from "lucide-react";
import toast from "react-hot-toast";

import api from "../../services/api";
import Button from "../common/Button";
import Input from "../common/Input";
import StarRating from "./StarRating";
import LoadingSpinner from "../common/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";

const ProductReviews = ({ productId, onRatingUpdate }) => {
  const { user } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/reviews/product/${productId}`
      );

      setReviews(response.data.data || []);

      if (user) {
        const myResponse = await api.get(
          `/reviews/product/${productId}/my`
        );

        setMyReview(myResponse.data.data);

        if (myResponse.data.data) {
          setRating(myResponse.data.data.rating);
          setTitle(myResponse.data.data.title || "");
          setComment(myResponse.data.data.comment || "");
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to write a review.");
      return;
    }

    if (!comment.trim()) {
      toast.error("Please write your review.");
      return;
    }

    try {
      setSubmitting(true);

      let response;

      if (myReview) {
        response = await api.put(
          `/reviews/${myReview._id}`,
          {
            rating,
            title,
            comment,
          }
        );

        toast.success("Review updated successfully.");
      } else {
        response = await api.post(
          `/reviews/product/${productId}`,
          {
            rating,
            title,
            comment,
          }
        );

        toast.success(response.data.message);
      }

      setMyReview(response.data.data);

      await fetchReviews();

      onRatingUpdate?.();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to submit review."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!myReview) return;

    const confirmed = window.confirm(
      "Delete your review?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/reviews/${myReview._id}`);

      toast.success("Review deleted.");

      setMyReview(null);
      setRating(5);
      setTitle("");
      setComment("");

      await fetchReviews();

      onRatingUpdate?.();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to delete review."
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="mt-12">

      <h2 className="text-2xl font-bold mb-8">
        Customer Reviews
      </h2>

      {/* Review Form */}
      {user ? (
        <div className="bg-gray-50 rounded-2xl p-6 mb-10">
          <div className="flex items-center gap-2 mb-5">
            {myReview ? (
              <Edit3 className="w-5 h-5" />
            ) : (
              <User className="w-5 h-5" />
            )}

            <h3 className="font-semibold">
              {myReview
                ? "Edit Your Review"
                : "Write a Review"}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-medium mb-2">
                Your Rating
              </label>

              <StarRating
                rating={rating}
                size={28}
                interactive
                onChange={setRating}
              />
            </div>

            <Input
              label="Review Title"
              placeholder="Summarize your experience"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
            />

            <div>
              <label className="block text-sm font-medium mb-2">
                Your Review
              </label>

              <textarea
                value={comment}
                onChange={(e) =>
                  setComment(e.target.value)
                }
                placeholder="Share your experience..."
                rows={5}
                maxLength={1000}
                className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
              />

              <p className="text-xs text-gray-500 mt-1 text-right">
                {comment.length}/1000
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                loading={submitting}
              >
                {myReview
                  ? "Update Review"
                  : "Submit Review"}
              </Button>

              {myReview && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl p-6 mb-10 text-center">
          <p className="text-gray-600">
            Please login to write a review.
          </p>
        </div>
      )}

      {/* Reviews */}
      {reviews.length === 0 ? (
        <div className="text-center py-10 border rounded-2xl">
          <p className="text-gray-500">
            No reviews yet.
          </p>

          <p className="text-sm text-gray-400 mt-1">
            Be the first to review this product.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="border-b pb-6"
            >
              <div className="flex items-start justify-between gap-4">

                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>

                    <div>
                      <p className="font-medium">
                        {review.user?.name ||
                          "Customer"}
                      </p>

                      <p className="text-xs text-gray-500">
                        {new Date(
                          review.createdAt
                        ).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <StarRating
                      rating={review.rating}
                      size={17}
                    />
                  </div>
                </div>

                {review.isVerifiedPurchase && (
                  <span className="text-xs font-medium bg-green-100 text-green-700 px-3 py-1 rounded-full">
                    ✓ Verified Purchase
                  </span>
                )}
              </div>

              {review.title && (
                <h3 className="font-semibold mt-4">
                  {review.title}
                </h3>
              )}

              <p className="text-gray-600 mt-2 whitespace-pre-line">
                {review.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductReviews;