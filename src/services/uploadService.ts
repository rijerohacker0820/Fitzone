import * as SecureStore from "expo-secure-store";
import { ENV } from "../config/env";

export const uploadImage = async (imageUri: string) => {
  try {
    const token = await SecureStore.getItemAsync("auth_token");

    const formData = new FormData();

    formData.append("file", {
      uri: imageUri,
      name: "photo.jpg",
      type: "image/jpeg",
    } as any);

    const response = await fetch(`${ENV.API_URL}/upload/image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const json = await response.json();

    if (!json.success) {
      throw new Error("Upload failed");
    }

    return json.data.imageUrl || json.data;
  } catch (error) {
    console.error("[UPLOAD ERROR]", error);
    throw error;
  }
};
