export const MAX_VIDEO_UPLOAD_BYTES = 10 * 1024 * 1024 * 1024;
export const MAX_VIDEO_UPLOAD_LABEL = "10 GB";
export const ACCEPTED_VIDEO_EXTENSIONS = "MP4, MOV, AVI";

export function isAcceptedVideoFile(file: File): boolean {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const isAcceptedExtension = ["mp4", "mov", "avi"].includes(extension ?? "");
  return isAcceptedExtension && (!file.type || file.type.startsWith("video/"));
}
