/**
 * Centralized utility for role display names and type mappings
 * This ensures consistency across all UI components when displaying roles
 */

export interface RoleDisplayInfo {
  displayName: string
  type: string
  description: string
}

/**
 * Map from role_type to display information
 * This is the single source of truth for how roles are displayed throughout the application
 */
export const ROLE_DISPLAY_MAP: Record<string, RoleDisplayInfo> = {
  owner: {
    displayName: 'Owner',
    type: 'Super Administrator',
    description: 'Has full control — can manage billing, delete the organization, assign roles, and configure SSO'
  },
  admin: {
    displayName: 'Admin',
    type: 'Administration',
    description: 'Manages organization settings, users, integrations, and platform operations'
  },
  qa_manager: {
    displayName: 'QA Manager',
    type: 'Quality Assurance',
    description: 'Manages QA teams, assigns testers, oversees test execution, and reviews results'
  },
  qa_lead: {
    displayName: 'QA Lead',
    type: 'Quality Assurance',
    description: 'Leads QA engineers, approves test cases, and validates AI-generated fixes'
  },
  qa_engineer: {
    displayName: 'QA Engineer',
    type: 'Quality Assurance',
    description: 'Creates, executes, and maintains automated and manual tests'
  },
  product_owner: {
    displayName: 'Product Owner',
    type: 'Stakeholder',
    description: 'Represents business interests, reviews reports and KPIs, ensures testing aligns with product goals'
  },
  viewer: {
    displayName: 'Viewer',
    type: 'Read Only',
    description: 'Has view-only access to dashboards, reports, and analytics'
  }
}

/**
 * Get display name for a role type
 * Example: 'qa_engineer' -> 'QA Engineer (Tester)'
 */
export function getRoleDisplayName(roleType: string): string {
  const info = ROLE_DISPLAY_MAP[roleType.toLowerCase()]
  if (info) {
    return info.displayName
  }
  // Fallback for unknown types
  return roleType.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

/**
 * Get type/category for a role type
 * Example: 'qa_engineer' -> 'Quality Assurance'
 */
export function getRoleType(roleType: string): string {
  const info = ROLE_DISPLAY_MAP[roleType.toLowerCase()]
  if (info) {
    return info.type
  }
  return 'Unknown'
}

/**
 * Get description for a role type
 * Example: 'qa_engineer' -> 'Creates, executes, and maintains automated and manual tests'
 */
export function getRoleDescription(roleType: string): string {
  const info = ROLE_DISPLAY_MAP[roleType.toLowerCase()]
  if (info) {
    return info.description
  }
  return ''
}

/**
 * Get display info with dropdown-friendly format
 * Example: 'qa_engineer' -> 'QA Engineer (Quality Assurance)'
 */
export function getRoleDisplayWithType(roleType: string): string {
  const info = ROLE_DISPLAY_MAP[roleType.toLowerCase()]
  if (info) {
    return `${info.displayName} (${info.type})`
  }
  return getRoleDisplayName(roleType)
}

/**
 * Get all role display options for dropdown/select lists
 */
export function getAllRoleDisplayOptions() {
  return Object.entries(ROLE_DISPLAY_MAP).map(([roleType, info]) => ({
    roleType,
    displayName: info.displayName,
    type: info.type,
    description: info.description,
    displayWithType: `${info.displayName} (${info.type})`
  }))
}
