import apiClient, { BASE_URL } from "../api/apiClient";
import { Platform } from "react-native";

/**
 * Upload an image to the backend.
 * Uses multipart/form-data as required by POST /api/upload/image.
 *
 * @param uri - Local URI of the image (from expo-image-picker)
 * @returns Full URL of the uploaded image
 */
export const uploadImage = async (uri: string): Promise<string> => {
  const formData = new FormData();

  // Get filename and extension from URI
  let filename = uri.split("/").pop() || "upload.jpg";
  // Ensure filename has an extension for backend validation
  if (!filename.includes(".")) {
    filename += ".jpg";
  }
  
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : "image/jpeg";

  if (Platform.OS === "web") {
    // On web, fetch the blob from the URI
    const response = await fetch(uri);
    const blob = await response.blob();
    (formData as any).append("file", blob, filename);
  } else {
    // On native, use the special RN FormData format
    formData.append("file", {
      uri,
      name: filename,
      type,
    } as any);
  }

  const response = await apiClient.post("/upload/image", formData, {
    headers: {
      "Content-Type": undefined,
    },
    timeout: 30000,
  });

  // Backend returns { imageUrl: "/uploads/images/..." }
  const imageUrl = response.data?.imageUrl || response.data;

  // Return full URL
  if (typeof imageUrl === "string" && imageUrl.startsWith("/")) {
    // Strip /api from BASE_URL to get server root
    const serverRoot = BASE_URL.replace(/\/api$/, "");
    return `${serverRoot}${imageUrl}`;
  }

  return imageUrl;
};
