import { User } from '../types';

export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  STAFF: 'staff',
  USER: 'user',
} as const;

export const PERMISSIONS = {
  MANAGE_ROLES: 'manage_roles',         // Promote/Demote users (Admin+)
  MODERATE_USERS: 'moderate_users',     // Ban/Mute (Staff+)
  MANAGE_CONTENT: 'manage_content',     // Edit/Delete ANY post
  FEATURE_POSTS: 'feature_posts',       // Set posts as featured
  MANAGE_CATEGORIES: 'manage_categories',
  VIEW_ADMIN_DASHBOARD: 'view_admin_dashboard',
} as const;

type Role = typeof ROLES[keyof typeof ROLES];
type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.OWNER]: [
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.MODERATE_USERS,
    PERMISSIONS.MANAGE_CONTENT,
    PERMISSIONS.FEATURE_POSTS,
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.VIEW_ADMIN_DASHBOARD,
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.MODERATE_USERS,
    PERMISSIONS.MANAGE_CONTENT,
    PERMISSIONS.FEATURE_POSTS,
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.VIEW_ADMIN_DASHBOARD,
  ],
  [ROLES.STAFF]: [
    PERMISSIONS.MODERATE_USERS,       // Can ban/mute
    PERMISSIONS.MANAGE_CONTENT,       // Can edit/delete posts
    PERMISSIONS.VIEW_ADMIN_DASHBOARD, // Can view dashboard
  ],
  [ROLES.USER]: [],
};

export const hasPermission = (user: User | null | undefined, permission: Permission): boolean => {
  if (!user) return false;
  return ROLE_PERMISSIONS[user.role]?.includes(permission) || false;
};

export const canEditItem = (user: User | null | undefined, itemAuthorId: string): boolean => {
  if (!user) return false;
  // User can edit their own item
  if (user.uid === itemAuthorId) return true; // Assuming user object has uid attached in runtime context
  // Staff+ can edit any item
  return hasPermission(user, PERMISSIONS.MANAGE_CONTENT);
};