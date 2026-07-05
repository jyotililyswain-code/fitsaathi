export const ADMIN_ROLES = ["admin", "super_admin", "moderator", "support_admin"] as const;
export type AdminRole = typeof ADMIN_ROLES[number];
export function isAdminRole(role: unknown): role is AdminRole { return ADMIN_ROLES.includes(String(role) as AdminRole); }
export function canManageUsers(role: AdminRole) { return role === "admin" || role === "super_admin" || role === "support_admin"; }
export function canDelete(role: AdminRole) { return role === "admin" || role === "super_admin"; }
export function canManageFinance(role: AdminRole) { return role === "admin" || role === "super_admin"; }
export function canModerateMarketplace(role: AdminRole) { return role === "admin" || role === "super_admin" || role === "moderator"; }
export function canManageOrders(role: AdminRole) { return role === "admin" || role === "super_admin" || role === "moderator" || role === "support_admin"; }
