const getImageUrl = (image) => {
  if (typeof image === "string") {
    return image.trim();
  }

  return typeof image?.url === "string" ? image.url.trim() : "";
};

export default getImageUrl;
