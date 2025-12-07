/**
 * Shared types for Users & Teams components
 */

export interface Role {
    id: string
    name: string
    role_type: string
    description: string
    permission_count: number
    is_system_role: boolean
    is_active: boolean
}

export interface RoleDetails extends Role {
    permissions: Permission[]
}

export interface Permission {
    id: string
    name: string
    resource: string
    action: string
    description: string
}

export interface Group {
    id: string
    name: string
    description?: string
    is_active: boolean
    created_at: string
    user_count?: number
    group_type?: {
        id: string
        name: string
        display_name: string
    }
}

export interface GroupMember {
    id: string
    email: string
    username: string
    full_name?: string
    added_at: string
}

export interface UserAssignment {
    id: string
    user_id: string
    user_email: string
    user_name: string
    role_id: string
    role_name: string
    role_type: string
    assigned_at: string
    assigned_by: string
}

export interface Project {
    id: string
    name: string
    description?: string
}

export interface UsersAndTeamsProps {
    organisationId: string
    projects: Project[]
}
