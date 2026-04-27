import { ENV } from "../config/env";

/**
 * Helper to construct full image URLs from backend relative paths.
 * Should ONLY be used in new components as requested.
 */
export const getImageUrl = (
  path: string | null | undefined,
): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Use the backend root URL (remove /api if it's there)
  const baseUrl = ENV.API_URL.replace("/api", "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${cleanPath}`;
};
