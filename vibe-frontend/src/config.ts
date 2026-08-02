export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:5000";

// Helper to resolve media URLs from backend storage or Cloudinary
export const resolveUrl = (
  url: string | null | undefined,
  options?: { thumbnail?: boolean }
): string => {
  if (!url) return "";
  let resolved = url;
  if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("data:")) {
    // Remove starting slash if present
    const sanitizedUrl = url.startsWith("/") ? url.substring(1) : url;
    resolved = `${API_BASE_URL}/${sanitizedUrl}`;
  }

  if (options?.thumbnail && resolved.includes("cloudinary.com") && resolved.includes("/upload/")) {
    return resolved.replace("/upload/", "/upload/w_150,h_150,c_fill,q_auto,f_auto/");
  }

  return resolved;
};

export const AGORA_APP_ID = (import.meta.env.VITE_AGORA_APP_ID as string) || "da3d8cb30b3240a5a3a789a5725f18bf"; // Fallback public Agora App ID for testing
