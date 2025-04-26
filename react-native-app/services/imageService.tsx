import apiClient from "./api";

export interface Image {
  id: string;
  user_id: string;
  image_url: string;
  room_name?: string;
}

export const imageService = {
  getUserImages: async (userId: string): Promise<Image[]> => {
    const response = await apiClient.get(`/images/user/${userId}`);
    return response.data;
  },

  uploadImage: async (
    userId: string,
    imageUri: string,
    roomName?: string
  ): Promise<Image> => {
    const formData = new FormData();

    // Add the image file to form data
    const filename = imageUri.split("/").pop() || "photo.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";

    formData.append("file", {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    formData.append("user_id", userId);
    if (roomName) formData.append("room_name", roomName);

    const response = await apiClient.post("/images/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },
};
