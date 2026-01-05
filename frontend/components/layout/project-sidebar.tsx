'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
    BrainCircuit,
    ChevronLeft,
    ChevronRight,
    FolderOpen,
    Home,
    LayoutDashboard,
    ClipboardList,
    Zap,
    Shield,
    BarChart3,
    Workflow,
    Settings,
    Puzzle,
    Activity,
    Users,
    CreditCard,
    FolderTree,
    ListChecks,
    Bug,
    TrendingUp,
    Link2,
    FileText
} from 'lucide-react'

interface ProjectSidebarProps {
    organisationId: string
    projectId: string
    projectName?: string
    activeModule?: string
}

export function ProjectSidebar({
    organisationId,
    projectId,
    projectName = 'Project Name',
    activeModule
}: ProjectSidebarProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [isCollapsed, setIsCollapsed] = useState(false)

    const modules = [
        {
            id: 'home',
            name: 'Home',
            icon: Home,
            href: `/organizations/${organisationId}/projects/${projectId}`,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
        {
            id: 'test-management',
            name: 'Test Management',
            icon: ClipboardList,
            href: `/organizations/${organisationId}/projects/${projectId}/test-management`,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
        },
        {
            id: 'automation-hub',
            name: 'Automation Hub',
            icon: Zap,
            href: `/organizations/${organisationId}/projects/${projectId}/automation-hub`,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
        },
        {
            id: 'security-testing',
            name: 'Security Testing',
            icon: Shield,
            href: `/organizations/${organisationId}/projects/${projectId}/security-testing`,
            color: 'text-teal-600',
            bgColor: 'bg-teal-100',
        },
        {
            id: 'performance-testing',
            name: 'Performance Testing',
            icon: BarChart3,
            href: `/organizations/${organisationId}/projects/${projectId}/performance-testing`,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
        },
        {
            id: 'reports',
            name: 'Reports & Analytics',
            icon: TrendingUp,
            href: `/organizations/${organisationId}/projects/${projectId}/reports`,
            color: 'text-cyan-600',
            bgColor: 'bg-cyan-100',
        },
        {
            id: 'integrations',
            name: 'Integrations',
            icon: Puzzle,
            href: `/organizations/${organisationId}/projects/${projectId}/integrations`,
            color: 'text-pink-600',
            bgColor: 'bg-pink-100',
        },
        {
            id: 'activity',
            name: 'Activity Log',
            icon: Activity,
            href: `/organizations/${organisationId}/projects/${projectId}/activity`,
            color: 'text-teal-600',
            bgColor: 'bg-teal-100',
        },
        {
            id: 'settings',
            name: 'Settings',
            icon: Settings,
            href: `/organizations/${organisationId}/projects/${projectId}/settings`,
            color: 'text-gray-600',
            bgColor: 'bg-gray-100',
        },
    ]

    return (
        <aside
            className={`relative flex flex-col transition-all duration-300 border-r border-gray-200 h-screen sticky top-0 ${isCollapsed ? 'w-20' : 'w-60'}`}
            style={{ backgroundColor: '#f0fefa' }}
        >
            {/* Collapse Toggle */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1.5 shadow-md hover:bg-gray-50 z-50 transition-transform"
            >
                {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </button>

            {/* Logo Section */}
            <div className="p-4 flex items-center gap-3 border-b border-gray-200 overflow-hidden">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <BrainCircuit className="w-6 h-6 text-white" />
                </div>
                {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-bold text-gray-800 tracking-tight whitespace-nowrap">
                            Cogni<span className="text-primary">Test</span>
                        </h1>
                    </div>
                )}
            </div>

            {/* Project Header */}
            <div className="p-4 border-b border-gray-200 overflow-hidden">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded bg-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <FolderOpen className="w-4 h-4 text-white" />
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold truncate text-gray-900">{projectName}</h3>
                        </div>
                    )}
                </div>
                {!isCollapsed && (
                    <button
                        onClick={() => router.push(`/organizations/${organisationId}/projects`)}
                        className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ChevronLeft className="w-3 h-3" />
                        View all projects
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 overflow-y-auto overflow-x-hidden">
                <div className="space-y-1">
                    {modules.map((item) => {
                        const isActive = pathname === item.href || (item.id !== 'home' && pathname.includes(item.href))
                        const Icon = item.icon

                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group border-2
                  ${isActive
                                        ? `${item.bgColor} text-gray-900 font-semibold border-gray-400 shadow-sm`
                                        : 'text-gray-700 hover:bg-white/50 border-transparent hover:border-gray-200'
                                    }
                  ${isCollapsed ? 'justify-center px-0' : ''}
                `}
                                title={isCollapsed ? item.name : ''}
                            >
                                <Icon className={`w-5 h-5 flex-shrink-0 ${item.color} ${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
                                {!isCollapsed && (
                                    <span className="truncate">{item.name}</span>
                                )}
                            </Link>
                        )
                    })}
                </div>
            </nav>

            {/* Footer info if any */}
            {!isCollapsed && (
                <div className="p-4 mt-auto border-t border-gray-200">
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Status</div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-medium text-gray-700">Project Active</span>
                    </div>
                </div>
            )}
        </aside>
    )
}
