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
 * Updated to Enterprise Project Roles (based on role-based.md)
 */
export const ROLE_DISPLAY_MAP: Record<string, RoleDisplayInfo> = {
  // Enterprise Project Roles
  project_admin: {
    displayName: 'Project Admin',
    type: 'Administration',
    description: 'Full project control - manages all test artifacts, approvals, automation, and security scans'
  },
  qa_lead: {
    displayName: 'QA Lead',
    type: 'Quality Assurance',
    description: 'Test strategy owner — designs test plans, manages QA assignments, and reviews technical execution'
  },
  qa_engineer: {
    displayName: 'QA Engineer',
    type: 'Quality Assurance',
    description: 'Creates and executes tests, records evidence, runs automation flows'
  },
  auto_eng: {
    displayName: 'Automation Engineer',
    type: 'Quality Assurance',
    description: 'Manages automation flows, k6 scripts, accepts self-healing suggestions'
  },
  technical_lead: {
    displayName: 'Technical Lead',
    type: 'Development',
    description: 'Technical reviewer — validates testing approach, environment readiness, and technical strategy'
  },
  product_owner: {
    displayName: 'Product Owner',
    type: 'Business',
    description: 'Business stakeholder — validates scenarios, reviews requirements coverage, and performs business sign-off'
  },
  developer: {
    displayName: 'Developer',
    type: 'Development',
    description: 'Read-only access to test artifacts, can record evidence and view dashboards'
  },
  viewer: {
    displayName: 'Viewer',
    type: 'Read Only',
    description: 'Read-only access to view tests, results, and dashboards'
  },

  // Legacy role mappings for backwards compatibility
  tester: {
    displayName: 'QA Engineer',
    type: 'Quality Assurance',
    description: 'Creates and executes tests, records evidence, runs automation flows'
  },
  dev_ro: {
    displayName: 'Developer',
    type: 'Development',
    description: 'Read-only access to test artifacts, can record evidence and view dashboards'
  },
  owner: {
    displayName: 'Project Admin',
    type: 'Administration',
    description: 'Full project control - manages all test artifacts, approvals, automation, and security scans'
  },
  admin: {
    displayName: 'Project Admin',
    type: 'Administration',
    description: 'Manages organization settings, users, integrations, and platform operations'
  },
  qa_manager: {
    displayName: 'QA Lead',
    type: 'Quality Assurance',
    description: 'Manages QA teams, assigns testers, oversees test execution, and reviews results'
  },
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
