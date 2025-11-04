/**
 * Zustand store for managing global sidebar state
 * Handles collapse/expand state across the entire application
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SidebarState {
  isCollapsed: boolean
  toggleCollapse: () => void
  setCollapsed: (collapsed: boolean) => void
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,

      toggleCollapse: () => {
        set((state) => ({ isCollapsed: !state.isCollapsed }))
      },

      setCollapsed: (collapsed: boolean) => {
        set({ isCollapsed: collapsed })
      },
    }),
    {
      name: 'sidebar-state',
      storage: typeof window !== 'undefined' ? localStorage : undefined,
    }
  )
)
