import { useState } from "react";
import { ImageOff } from "lucide-react";
import getImageUrl from "../../utils/getImageUrl.js";

const ProductImage = ({
  image,
  fallbackImage,
  alt,
  className = "",
  imageClassName = "h-full w-full object-cover",
}) => {
  const imageUrls = [image, fallbackImage]
    .map(getImageUrl)
    .filter(
      (url) =>
        url && !/placehold\.co|via\.placeholder\.com/i.test(url)
    );
  const imageKey = imageUrls.join("|");
  const [failedImages, setFailedImages] = useState({
    key: "",
    urls: [],
  });
  const failedUrls =
    failedImages.key === imageKey ? failedImages.urls : [];
  const imageUrl = imageUrls.find((url) => !failedUrls.includes(url));
  const hasImage = Boolean(imageUrl);

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gray-100 ${className}`}
      role={hasImage ? undefined : "img"}
      aria-label={hasImage ? undefined : `${alt} image unavailable`}
    >
      {hasImage ? (
        <img
          src={imageUrl}
          alt={alt}
          className={imageClassName}
          onError={() =>
            setFailedImages((current) => ({
              key: imageKey,
              urls: current.key === imageKey
                ? [...current.urls, imageUrl]
                : [imageUrl],
            }))
          }
        />
      ) : (
        <ImageOff size={20} className="text-gray-400" aria-hidden="true" />
      )}
    </div>
  );
};

export default ProductImage;