import { Star } from "lucide-react";

const StarRating = ({
  rating = 0,
  size = 18,
  interactive = false,
  onChange,
}) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          className={
            interactive
              ? "cursor-pointer"
              : "cursor-default"
          }
        >
          <Star
            size={size}
            className={
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;