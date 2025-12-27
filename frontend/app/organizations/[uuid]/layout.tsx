'use client'

import { use } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useOrganizationStore } from '@/lib/store/organization-store'
import { usePathname } from 'next/navigation'

interface LayoutParams {
    uuid: string
}

export default function OrganizationLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<LayoutParams>
}) {
    const { uuid } = use(params)
    const { user } = useAuth()
    const { fetchOrganisations, initialized } = useOrganizationStore()
    const pathname = usePathname()

    // Fetch organisations when user is available and not yet initialized
    useEffect(() => {
        if (user && !initialized) {
            fetchOrganisations(user.id)
        }
    }, [user, initialized, fetchOrganisations])

    // Check if we're on a project detail page (has projectId in path)
    // Pattern: /organizations/[uuid]/projects/[projectId]
    const isProjectDetailPage = pathname.match(/\/organizations\/[^/]+\/projects\/[^/]+/)

    // Project pages have their own sidebar, so don't wrap them
    if (isProjectDetailPage) {
        return <>{children}</>
    }

    // For org-level pages, show the sidebar
    return (
        <div className="flex min-h-screen bg-white">
            <Sidebar organisationId={uuid} />
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    )
}

