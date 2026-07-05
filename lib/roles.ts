export const USER_ROLES = ["customer", "seller", "coach", "dojo", "admin", "super_admin", "moderator", "support_admin"] as const;
export type UserRole = typeof USER_ROLES[number];

const priority: UserRole[] = ["super_admin", "admin", "moderator", "support_admin", "coach", "dojo", "seller", "customer"];

export function resolveStoredRole(data: Record<string, unknown> | undefined | null): UserRole {
  const values = new Set([String(data?.role || ""), String(data?.userRole || "")]);
  return priority.find((role) => values.has(role)) || "customer";
}

export function dashboardPathForRole(role: string) {
  if (role === "coach") return "/coach-dashboard";
  if (role === "dojo") return "/dojo-dashboard";
  if (["admin", "super_admin", "moderator", "support_admin"].includes(role)) return "/super-admin-dashboard";
  if (role === "seller") return "/seller-dashboard";
  return "/dashboard";
}
