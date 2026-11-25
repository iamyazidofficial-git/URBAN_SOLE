/**
 * Utility to optimize Cloudinary image URLs on the fly
 * Inserts format (auto/webp/avif), quality (auto:good), and max dimension parameters.
 */
export const optimizeCloudinaryUrl = (url, width = 600) => {
  if (!url || typeof url !== "string") return url;

  // Only apply to Cloudinary URLs
  if (url.includes("res.cloudinary.com") && url.includes("/image/upload/")) {
    // Avoid double-transforming if already optimized
    if (url.includes("/image/upload/f_auto") || url.includes("/image/upload/q_auto")) {
      return url;
    }
    // Inject f_auto,q_auto,w_${width},c_limit into the upload path
    return url.replace(
      "/image/upload/",
      `/image/upload/f_auto,q_auto,w_${width},c_limit/`
    );
  }

  return url;
};
