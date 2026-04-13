/**
 * Role-based tab and feature gating utility for EZTrack mobile app
 *
 * Provides role hierarchy validation and feature access control based on user roles.
 * Roles are arranged in a hierarchy from lowest to highest privilege:
 * staff < lead < supervisor < manager < director < admin < owner
 */

export type UserRole = 'staff' | 'lead' | 'supervisor' | 'manager' | 'director' | 'admin' | 'owner';

type TabName = 'dashboard' | 'daily-log' | 'incidents' | 'dispatch' | 'personnel' | 'analytics' | 'reports' | 'more';

type FeatureName = 'settings' | 'analytics' | 'reports' | 'delete' | 'transfer' | 'create' | 'edit';

/**
 * Maps user roles to their numeric privilege level (0-6)
 * Higher numbers = more privileges
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  staff: 0,
  lead: 1,
  supervisor: 2,
  manager: 3,
  director: 4,
  admin: 5,
  owner: 6,
};

/**
 * Maps roles to accessible tabs
 * Roles inherit tabs from lower privilege levels
 */
const TABS_BY_ROLE: Record<UserRole, TabName[]> = {
  staff: ['dashboard', 'daily-log', 'incidents', 'dispatch', 'more'],
  lead: ['dashboard', 'daily-log', 'incidents', 'dispatch', 'personnel', 'more'],
  supervisor: ['dashboard', 'daily-log', 'incidents', 'dispatch', 'personnel', 'more'],
  manager: ['dashboard', 'daily-log', 'incidents', 'dispatch', 'personnel', 'analytics', 'more'],
  director: ['dashboard', 'daily-log', 'incidents', 'dispatch', 'personnel', 'analytics', 'reports', 'more'],
  admin: ['dashboard', 'daily-log', 'incidents', 'dispatch', 'personnel', 'analytics', 'reports', 'more'],
  owner: ['dashboard', 'daily-log', 'incidents', 'dispatch', 'personnel', 'analytics', 'reports', 'more'],
};

/**
 * Maps features to minimum required role level
 */
const FEATURE_MIN_ROLE: Record<FeatureName, UserRole> = {
  settings: 'manager',
  analytics: 'manager',
  reports: 'director',
  delete: 'supervisor',
  transfer: 'lead',
  create: 'staff',
  edit: 'staff',
};

/**
 * Get numeric privilege level for a role
 * Used for hierarchy comparisons
 */
export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY[role];
}

/**
 * Get all accessible tabs for a given role
 * Includes all tabs for that role and any lower privilege levels
 */
export function getTabsForRole(role: UserRole): TabName[] {
  return TABS_BY_ROLE[role];
}

/**
 * Check if a role can access a specific feature
 */
export function canAccessFeature(role: UserRole, feature: FeatureName): boolean {
  const requiredRole = FEATURE_MIN_ROLE[feature];
  return hasMinimumRole(role, requiredRole);
}

/**
 * Check if a role meets or exceeds the required role level
 * Returns true if userRole >= requiredRole in the hierarchy
 */
export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
}

/**
 * Get a human-readable description of what roles can access a feature
 */
export function getFeatureAccessDescription(feature: FeatureName): string {
  const minRole = FEATURE_MIN_ROLE[feature];
  const minRoleLevel = getRoleLevel(minRole);

  const accessibleRoles = (Object.keys(ROLE_HIERARCHY) as UserRole[])
    .filter((role) => getRoleLevel(role) >= minRoleLevel)
    .map((role) => role.charAt(0).toUpperCase() + role.slice(1))
    .join(', ');

  return `Accessible to: ${accessibleRoles}`;
}

/**
 * Validate tab access for a role
 */
export function canAccessTab(role: UserRole, tab: TabName): boolean {
  return getTabsForRole(role).includes(tab);
}

/**
 * Get all features accessible to a role
 */
export function getAccessibleFeatures(role: UserRole): FeatureName[] {
  return (Object.keys(FEATURE_MIN_ROLE) as FeatureName[])
    .filter((feature) => canAccessFeature(role, feature));
}
