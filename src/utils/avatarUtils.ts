
import { pb } from "@/services/pocketbase";

/**
 * Generate a proper avatar URL with cache-busting for PocketBase avatars
 */
export const getAvatarUrl = (userId?: string): string => {
  if (!userId) return '';
  return `${pb.baseUrl}/api/files/users/${userId}/avatar?t=${Date.now()}`;
};

/**
 * Create a local preview URL for a file object
 */
export const getFilePreviewUrl = (file: File): string => {
  return URL.createObjectURL(file);
};
