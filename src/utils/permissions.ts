export const hasPermission = (
  permission: string,
  userPermissions: string[] = []
): boolean => {
  if (userPermissions.includes('*') || userPermissions.includes('admin')) return true;
  return userPermissions.includes(permission);
};
