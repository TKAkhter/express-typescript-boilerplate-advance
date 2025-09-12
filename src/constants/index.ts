export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ["USER_CREATE", "USER_DELETE", "USER_UPDATE", "VIEW_REPORTS"],
  user: ["USER_READ", "FILE_UPLOAD"],
  company: ["USER_READ", "FILE_UPLOAD", "VIEW_REPORTS"],
};
