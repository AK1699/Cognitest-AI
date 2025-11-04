module.exports = [
"[project]/frontend/lib/store/sidebar-store.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Zustand store for managing global sidebar state
 * Handles collapse/expand state across the entire application
 */ __turbopack_context__.s([
    "useSidebarStore",
    ()=>useSidebarStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/index.mjs [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/middleware.mjs [app-ssr] (ecmascript)");
;
;
const useSidebarStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["persist"])((set)=>({
        isCollapsed: false,
        toggleCollapse: ()=>{
            set((state)=>({
                    isCollapsed: !state.isCollapsed
                }));
        },
        setCollapsed: (collapsed)=>{
            set({
                isCollapsed: collapsed
            });
        }
    }), {
    name: 'sidebar-state',
    storage: ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : undefined
}));
}),
"[project]/frontend/components/sidebar-toggle.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Sidebar Toggle Button Component
 * Floating action button that appears when sidebar is collapsed or in desktop view
 */ __turbopack_context__.s([
    "SidebarToggle",
    ()=>SidebarToggle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-left.js [app-ssr] (ecmascript) <export default as ChevronLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-right.js [app-ssr] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$store$2f$sidebar$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/store/sidebar-store.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
function SidebarToggle() {
    const { isCollapsed, toggleCollapse } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$store$2f$sidebar$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSidebarStore"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        onClick: toggleCollapse,
        className: `
        hidden lg:flex
        fixed top-20 transition-all duration-300 z-30
        items-center justify-center
        w-10 h-10 rounded-full
        bg-primary hover:bg-primary/90
        text-white shadow-lg hover:shadow-xl
        border border-primary/20
        backdrop-blur-sm
      `,
        style: {
            left: isCollapsed ? 'calc(5rem + 1rem)' : 'calc(16rem + 1rem)'
        },
        "aria-label": isCollapsed ? 'Expand sidebar' : 'Collapse sidebar',
        title: isCollapsed ? 'Expand sidebar' : 'Collapse sidebar',
        children: isCollapsed ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
            className: "w-5 h-5 animate-pulse"
        }, void 0, false, {
            fileName: "[project]/frontend/components/sidebar-toggle.tsx",
            lineNumber: 34,
            columnNumber: 9
        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__["ChevronLeft"], {
            className: "w-5 h-5"
        }, void 0, false, {
            fileName: "[project]/frontend/components/sidebar-toggle.tsx",
            lineNumber: 36,
            columnNumber: 9
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/components/sidebar-toggle.tsx",
        lineNumber: 15,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/components/layout/sidebar.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Sidebar",
    ()=>Sidebar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/menu.js [app-ssr] (ecmascript) <export default as Menu>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$folder$2d$open$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FolderOpen$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/folder-open.js [app-ssr] (ecmascript) <export default as FolderOpen>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bar$2d$chart$2d$3$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart3$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/bar-chart-3.js [app-ssr] (ecmascript) <export default as BarChart3>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$credit$2d$card$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CreditCard$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/credit-card.js [app-ssr] (ecmascript) <export default as CreditCard>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/users.js [app-ssr] (ecmascript) <export default as Users>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$puzzle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Puzzle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/puzzle.js [app-ssr] (ecmascript) <export default as Puzzle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-ssr] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$building$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Building2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/building-2.js [app-ssr] (ecmascript) <export default as Building2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/plus.js [app-ssr] (ecmascript) <export default as Plus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user.js [app-ssr] (ecmascript) <export default as User>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-ssr] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$help$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__HelpCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-help.js [app-ssr] (ecmascript) <export default as HelpCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/log-out.js [app-ssr] (ecmascript) <export default as LogOut>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/check.js [app-ssr] (ecmascript) <export default as Check>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/auth-context.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/api/index.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$store$2f$sidebar$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/store/sidebar-store.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$sidebar$2d$toggle$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/sidebar-toggle.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
;
;
;
;
const API_URL = ("TURBOPACK compile-time value", "http://localhost:8000") || 'http://localhost:8000';
const getMainMenuItems = (organisationId, isOwner)=>{
    const allItems = [
        {
            name: 'Projects',
            href: organisationId ? `/organizations/${organisationId}/projects` : '/projects',
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$folder$2d$open$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FolderOpen$3e$__["FolderOpen"],
            iconColor: 'text-blue-600',
            bgColor: 'bg-blue-100',
            allowMember: true
        },
        {
            name: 'Enterprise Reporting',
            href: organisationId ? `/organizations/${organisationId}/enterprise-reporting` : '/enterprise-reporting',
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bar$2d$chart$2d$3$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart3$3e$__["BarChart3"],
            iconColor: 'text-purple-600',
            bgColor: 'bg-purple-100',
            allowMember: false
        },
        {
            name: 'Billing & Usage',
            href: organisationId ? `/organizations/${organisationId}/billing` : '/billing',
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$credit$2d$card$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CreditCard$3e$__["CreditCard"],
            iconColor: 'text-green-600',
            bgColor: 'bg-green-100',
            allowMember: false
        },
        {
            name: 'Users & Teams',
            href: organisationId ? `/organizations/${organisationId}/users-teams` : '/users-teams',
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__["Users"],
            iconColor: 'text-orange-600',
            bgColor: 'bg-orange-100',
            allowMember: false
        },
        {
            name: 'Integrations',
            href: organisationId ? `/organizations/${organisationId}/integrations` : '/integrations',
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$puzzle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Puzzle$3e$__["Puzzle"],
            iconColor: 'text-pink-600',
            bgColor: 'bg-pink-100',
            allowMember: false
        },
        {
            name: 'Settings',
            href: organisationId ? `/organizations/${organisationId}/settings` : '/settings',
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"],
            iconColor: 'text-gray-600',
            bgColor: 'bg-gray-100',
            allowMember: false
        }
    ];
    // Filter items based on user role
    if (isOwner) {
        return allItems;
    } else {
        // Members only see items where allowMember is true
        return allItems.filter((item)=>item.allowMember);
    }
};
const otherMenuItems = [];
function Sidebar({ organisationId, projectId }) {
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const { user, logout } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const { isCollapsed } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$store$2f$sidebar$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSidebarStore"])();
    const [isMobileOpen, setIsMobileOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [currentOrganisation, setCurrentOrganisation] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [organisations, setOrganisations] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isProfileOpen, setIsProfileOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isOwner, setIsOwner] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const currentOrg = localStorage.getItem('current_organisation');
        if (currentOrg) {
            try {
                setCurrentOrganisation(JSON.parse(currentOrg));
            } catch (error) {
                console.error('Failed to parse organisation from localStorage', error);
            }
        }
        if (user) {
            fetchOrganisations();
        }
    }, [
        user
    ]);
    // Check if current user is the owner of the organization
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (user && currentOrganisation) {
            setIsOwner(currentOrganisation.owner_id === user.id);
        }
    }, [
        user,
        currentOrganisation
    ]);
    const fetchOrganisations = async ()=>{
        if (!user) return;
        try {
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].get('/api/v1/organisations/');
            setOrganisations(response.data);
        } catch (error) {
            console.error('Failed to fetch organisations:', error);
        }
    };
    const switchOrganisation = (org)=>{
        setCurrentOrganisation(org);
        localStorage.setItem('current_organisation', JSON.stringify(org));
        window.dispatchEvent(new CustomEvent('organisationChanged', {
            detail: org
        }));
        setIsProfileOpen(false);
        // Refetch organizations after switching
        setTimeout(()=>fetchOrganisations(), 100);
        router.push(`/organizations/${org.id}/projects`);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$sidebar$2d$toggle$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarToggle"], {}, void 0, false, {
                fileName: "[project]/frontend/components/layout/sidebar.tsx",
                lineNumber: 171,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>setIsMobileOpen(!isMobileOpen),
                className: "lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__["Menu"], {
                    className: "w-5 h-5 text-gray-600 dark:text-gray-400"
                }, void 0, false, {
                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                    lineNumber: 178,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/components/layout/sidebar.tsx",
                lineNumber: 174,
                columnNumber: 7
            }, this),
            isMobileOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "lg:hidden fixed inset-0 bg-black/50 z-40",
                onClick: ()=>setIsMobileOpen(false)
            }, void 0, false, {
                fileName: "[project]/frontend/components/layout/sidebar.tsx",
                lineNumber: 183,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                className: `
          fixed lg:sticky top-0 left-0 h-screen border-r border-gray-200 dark:border-gray-700 z-40 transition-all duration-300
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
        `,
                style: {
                    backgroundColor: '#f0f4f7'
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col h-full",
                    children: [
                        !isCollapsed && user && currentOrganisation && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "p-4 relative",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>{
                                        setIsProfileOpen(!isProfileOpen);
                                        if (!isProfileOpen) {
                                            // Refetch organizations when opening the profile menu
                                            fetchOrganisations();
                                        }
                                    },
                                    className: `w-full flex items-center gap-3 p-3 rounded-xl transition-all ${isProfileOpen ? 'border-2 border-gray-400 bg-white/40 shadow-lg' : 'border-2 border-gray-300 hover:bg-white/20'}`,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm font-semibold text-white",
                                                children: currentOrganisation.name.substring(0, 2).toUpperCase()
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                lineNumber: 220,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                            lineNumber: 219,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex-1 min-w-0 text-left",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-sm font-semibold text-gray-800 leading-tight line-clamp-1",
                                                    children: currentOrganisation.name
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                    lineNumber: 225,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs text-gray-600 uppercase tracking-wide mt-0.5",
                                                    children: user.username
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                    lineNumber: 228,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                            lineNumber: 224,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                            className: `w-4 h-4 text-gray-600 flex-shrink-0 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                            lineNumber: 232,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                    lineNumber: 205,
                                    columnNumber: 15
                                }, this),
                                isProfileOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "absolute top-24 left-4 right-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg space-y-4 z-50",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "space-y-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    className: "text-sm font-semibold text-gray-600 dark:text-gray-400",
                                                    children: [
                                                        "Organisations (",
                                                        organisations.length,
                                                        ")"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                    lineNumber: 244,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "space-y-2 max-h-40 overflow-y-auto",
                                                    children: organisations.map((org)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            onClick: ()=>switchOrganisation(org),
                                                            className: "w-full flex items-center gap-2 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$building$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Building2$3e$__["Building2"], {
                                                                    className: "w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                                    lineNumber: 254,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-sm text-gray-900 dark:text-white flex-1 truncate",
                                                                    children: org.name
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                                    lineNumber: 255,
                                                                    columnNumber: 27
                                                                }, this),
                                                                currentOrganisation?.id === org.id && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                                                                    className: "w-4 h-4 text-primary flex-shrink-0"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                                    lineNumber: 259,
                                                                    columnNumber: 29
                                                                }, this)
                                                            ]
                                                        }, org.id, true, {
                                                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                            lineNumber: 249,
                                                            columnNumber: 25
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                    lineNumber: 247,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                            lineNumber: 243,
                                            columnNumber: 19
                                        }, this),
                                        isOwner && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("hr", {
                                                    className: "border-gray-200 dark:border-gray-700"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                    lineNumber: 269,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>{
                                                        router.push('/organizations/new');
                                                        setIsProfileOpen(false);
                                                    },
                                                    className: "w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                                            className: "w-4 h-4 text-gray-600 dark:text-gray-400"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                            lineNumber: 277,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sm text-gray-900 dark:text-white",
                                                            children: "Add Organisation"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                            lineNumber: 278,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                    lineNumber: 270,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("hr", {
                                            className: "border-gray-200 dark:border-gray-700"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                            lineNumber: 283,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>{
                                                router.push('/profile/edit');
                                                setIsProfileOpen(false);
                                            },
                                            className: "w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                                                    className: "w-4 h-4 text-gray-600 dark:text-gray-400"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                    lineNumber: 293,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-sm text-gray-900 dark:text-white",
                                                    children: "Edit profile"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                    lineNumber: 294,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                            lineNumber: 286,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>{
                                                router.push('/account/settings');
                                                setIsProfileOpen(false);
                                            },
                                            className: "w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"], {
                                                    className: "w-4 h-4 text-gray-600 dark:text-gray-400"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                    lineNumber: 305,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-sm text-gray-900 dark:text-white",
                                                    children: "Account settings"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                    lineNumber: 306,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                            lineNumber: 298,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>{
                                                router.push('/support');
                                                setIsProfileOpen(false);
                                            },
                                            className: "w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$help$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__HelpCircle$3e$__["HelpCircle"], {
                                                    className: "w-4 h-4 text-gray-600 dark:text-gray-400"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                    lineNumber: 317,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-sm text-gray-900 dark:text-white",
                                                    children: "Support"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                    lineNumber: 318,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                            lineNumber: 310,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("hr", {
                                            className: "border-gray-200 dark:border-gray-700"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                            lineNumber: 321,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>{
                                                logout();
                                                setIsProfileOpen(false);
                                            },
                                            className: "w-full flex items-center gap-3 p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors text-left",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__["LogOut"], {
                                                    className: "w-4 h-4 text-red-600 dark:text-red-400"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                    lineNumber: 331,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-sm text-red-600 dark:text-red-400 font-medium",
                                                    children: "Sign out"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                    lineNumber: 332,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                            lineNumber: 324,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                    lineNumber: 241,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                            lineNumber: 203,
                            columnNumber: 13
                        }, this),
                        isProfileOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "fixed inset-0 z-40",
                            onClick: ()=>setIsProfileOpen(false)
                        }, void 0, false, {
                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                            lineNumber: 341,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                            className: "flex-1 overflow-y-auto py-6 px-3",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-1 mb-6",
                                children: getMainMenuItems(currentOrganisation?.id, isOwner).map((item)=>{
                                    const isActive = pathname === item.href;
                                    const Icon = item.icon;
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        href: item.href,
                                        onClick: ()=>setIsMobileOpen(false),
                                        className: `
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all group
                      ${isActive ? `${item.bgColor} text-gray-900 shadow-lg border-2 border-gray-400` : 'text-gray-700 hover:bg-white/30 border-2 border-transparent'}
                      ${isCollapsed ? 'justify-center' : ''}
                    `,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                className: `w-5 h-5 flex-shrink-0 ${item.iconColor}`
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                lineNumber: 369,
                                                columnNumber: 21
                                            }, this),
                                            !isCollapsed && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-medium text-sm",
                                                children: item.name
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                lineNumber: 373,
                                                columnNumber: 23
                                            }, this)
                                        ]
                                    }, item.name, true, {
                                        fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                        lineNumber: 355,
                                        columnNumber: 19
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                lineNumber: 349,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                            lineNumber: 348,
                            columnNumber: 11
                        }, this),
                        !isCollapsed && projectId && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "p-4 border-t border-gray-300",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-xs text-gray-600 mb-1",
                                    children: "Current Project"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                    lineNumber: 385,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-sm font-medium text-gray-800 truncate",
                                    children: "Project Name"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                    lineNumber: 388,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                            lineNumber: 384,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                    lineNumber: 200,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/components/layout/sidebar.tsx",
                lineNumber: 190,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
}),
"[project]/frontend/components/projects/create-project-modal.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CreateProjectModal",
    ()=>CreateProjectModal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$folder$2d$open$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FolderOpen$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/folder-open.js [app-ssr] (ecmascript) <export default as FolderOpen>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/sonner/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/api/index.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/auth-context.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
const API_URL = ("TURBOPACK compile-time value", "http://localhost:8000") || 'http://localhost:8000';
function CreateProjectModal({ isOpen, onClose, organisationId, onProjectCreated }) {
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const [projectName, setProjectName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [projectDescription, setProjectDescription] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [selectedModules, setSelectedModules] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isSubmitting, setIsSubmitting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    if (!isOpen) return null;
    const modules = [
        {
            id: 'test-management',
            name: 'Test Management',
            color: 'blue'
        },
        {
            id: 'api-testing',
            name: 'API Testing',
            color: 'green'
        },
        {
            id: 'automation-hub',
            name: 'Automation Hub',
            color: 'purple'
        },
        {
            id: 'security-testing',
            name: 'Security Testing',
            color: 'red'
        },
        {
            id: 'performance-testing',
            name: 'Performance Testing',
            color: 'yellow'
        },
        {
            id: 'mobile-testing',
            name: 'Mobile Testing',
            color: 'indigo'
        }
    ];
    const toggleModule = (moduleId)=>{
        setSelectedModules((prev)=>prev.includes(moduleId) ? prev.filter((id)=>id !== moduleId) : [
                ...prev,
                moduleId
            ]);
    };
    const handleSubmit = async (e)=>{
        e.preventDefault();
        if (!projectName.trim()) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toast"].error('Project name is required');
            return;
        }
        if (!user) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toast"].error('User not authenticated');
            return;
        }
        setIsSubmitting(true);
        try {
            const payload = {
                name: projectName.trim(),
                owner_id: user.id,
                organisation_id: organisationId,
                status: 'active',
                description: projectDescription.trim(),
                team_ids: [],
                settings: {
                    enabled_modules: selectedModules
                }
            };
            console.log('Creating project with payload:', payload);
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].post('/api/v1/projects/', payload);
            console.log('Project created successfully:', response.data);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toast"].success('Project created successfully!');
            setProjectName('');
            setProjectDescription('');
            setSelectedModules([]);
            onProjectCreated();
            onClose();
        } catch (error) {
            console.error('Failed to create project:', error);
            console.error('Error response:', error.response?.data);
            const errorDetail = error.response?.data?.detail;
            const errorMessage = Array.isArray(errorDetail) ? errorDetail.map((e)=>`${e.loc.join('.')}: ${e.msg}`).join(', ') : errorDetail || 'Failed to create project';
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toast"].error(errorMessage);
        } finally{
            setIsSubmitting(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-50 flex items-center justify-center",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 bg-black/50",
                onClick: onClose
            }, void 0, false, {
                fileName: "[project]/frontend/components/projects/create-project-modal.tsx",
                lineNumber: 103,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center pt-12 pb-8 px-8 flex-shrink-0",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-3xl font-semibold text-gray-900 mb-3",
                                children: "Create a new project"
                            }, void 0, false, {
                                fileName: "[project]/frontend/components/projects/create-project-modal.tsx",
                                lineNumber: 112,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-base text-gray-600",
                                children: "Projects help you organize and manage your test plans, test suites, and test cases in one place."
                            }, void 0, false, {
                                fileName: "[project]/frontend/components/projects/create-project-modal.tsx",
                                lineNumber: 115,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/components/projects/create-project-modal.tsx",
                        lineNumber: 111,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                        id: "create-project-form",
                        onSubmit: handleSubmit,
                        className: "px-8 overflow-y-auto flex-1",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-white border border-gray-200 rounded-lg p-8 space-y-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "block text-base font-semibold text-gray-900 mb-2",
                                            children: "Project Name *"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/components/projects/create-project-modal.tsx",
                                            lineNumber: 125,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "relative",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$folder$2d$open$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FolderOpen$3e$__["FolderOpen"], {
                                                    className: "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/projects/create-project-modal.tsx",
                                                    lineNumber: 129,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    value: projectName,
                                                    onChange: (e)=>setProjectName(e.target.value),
                                                    placeholder: "e.g., Payroll Platform",
                                                    className: "w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                                                    disabled: isSubmitting,
                                                    required: true
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/projects/create-project-modal.tsx",
                                                    lineNumber: 130,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/components/projects/create-project-modal.tsx",
                                            lineNumber: 128,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/components/projects/create-project-modal.tsx",
                                    lineNumber: 124,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "block text-base font-semibold text-gray-900 mb-2",
                                            children: "Description"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/components/projects/create-project-modal.tsx",
                                            lineNumber: 144,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                            value: projectDescription,
                                            onChange: (e)=>setProjectDescription(e.target.value),
                                            placeholder: "Brief description of your project...",
                                            rows: 3,
                                            className: "w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none",
                                            disabled: isSubmitting
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/components/projects/create-project-modal.tsx",
                                            lineNumber: 147,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/components/projects/create-project-modal.tsx",
                                    lineNumber: 143,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "block text-base font-semibold text-gray-900 mb-3",
                                            children: "Select Testing Modules"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/components/projects/create-project-modal.tsx",
                                            lineNumber: 159,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-sm text-gray-600 mb-4",
                                            children: "Choose which testing capabilities you want to enable for this project"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/components/projects/create-project-modal.tsx",
                                            lineNumber: 162,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "grid grid-cols-2 gap-3",
                                            children: modules.map((module)=>{
                                                const isSelected = selectedModules.includes(module.id);
                                                const colorClasses = {
                                                    blue: 'border-blue-200 bg-blue-50 text-blue-700',
                                                    green: 'border-green-200 bg-green-50 text-green-700',
                                                    purple: 'border-purple-200 bg-purple-50 text-purple-700',
                                                    red: 'border-red-200 bg-red-50 text-red-700',
                                                    yellow: 'border-yellow-200 bg-yellow-50 text-yellow-700',
                                                    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                                };
                                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    onClick: ()=>toggleModule(module.id),
                                                    disabled: isSubmitting,
                                                    className: `
                        relative p-4 rounded-lg border-2 text-left transition-all
                        ${isSelected ? colorClasses[module.color] : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}
                      `,
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-start gap-3",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: `
                          mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                          ${isSelected ? 'bg-current border-current' : 'border-gray-300'}
                        `,
                                                                children: isSelected && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                    className: "w-3 h-3 text-white",
                                                                    fill: "none",
                                                                    viewBox: "0 0 24 24",
                                                                    stroke: "currentColor",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        strokeLinecap: "round",
                                                                        strokeLinejoin: "round",
                                                                        strokeWidth: 3,
                                                                        d: "M5 13l4 4L19 7"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend/components/projects/create-project-modal.tsx",
                                                                        lineNumber: 198,
                                                                        columnNumber: 31
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/components/projects/create-project-modal.tsx",
                                                                    lineNumber: 197,
                                                                    columnNumber: 29
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/components/projects/create-project-modal.tsx",
                                                                lineNumber: 192,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-sm font-medium",
                                                                children: module.name
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/components/projects/create-project-modal.tsx",
                                                                lineNumber: 202,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/components/projects/create-project-modal.tsx",
                                                        lineNumber: 191,
                                                        columnNumber: 23
                                                    }, this)
                                                }, module.id, false, {
                                                    fileName: "[project]/frontend/components/projects/create-project-modal.tsx",
                                                    lineNumber: 178,
                                                    columnNumber: 21
                                                }, this);
                                            })
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/components/projects/create-project-modal.tsx",
                                            lineNumber: 165,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/components/projects/create-project-modal.tsx",
                                    lineNumber: 158,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/components/projects/create-project-modal.tsx",
                            lineNumber: 122,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/components/projects/create-project-modal.tsx",
                        lineNumber: 121,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-end gap-3 pt-6 pb-6 px-8 bg-gray-50 border-t border-gray-200 flex-shrink-0",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: onClose,
                                disabled: isSubmitting,
                                className: "px-5 py-2.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50",
                                children: "Back"
                            }, void 0, false, {
                                fileName: "[project]/frontend/components/projects/create-project-modal.tsx",
                                lineNumber: 215,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "submit",
                                form: "create-project-form",
                                disabled: isSubmitting || !projectName.trim(),
                                className: "px-5 py-2.5 bg-primary hover:opacity-90 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md",
                                children: isSubmitting ? 'Creating...' : 'Create project'
                            }, void 0, false, {
                                fileName: "[project]/frontend/components/projects/create-project-modal.tsx",
                                lineNumber: 223,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/components/projects/create-project-modal.tsx",
                        lineNumber: 214,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/components/projects/create-project-modal.tsx",
                lineNumber: 109,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/components/projects/create-project-modal.tsx",
        lineNumber: 101,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/lib/date-utils.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Date formatting utilities for consistent date display across the application
 */ /**
 * Format date to human-readable format: "01 Nov 2025"
 * @param date - Date string or Date object
 * @returns Formatted date string (e.g., "01 Nov 2025")
 */ __turbopack_context__.s([
    "formatDateForAPI",
    ()=>formatDateForAPI,
    "formatDateHumanReadable",
    ()=>formatDateHumanReadable,
    "formatDateWithTime",
    ()=>formatDateWithTime,
    "formatRelativeTime",
    ()=>formatRelativeTime
]);
function formatDateHumanReadable(date) {
    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(dateObj.getTime())) {
            return 'Invalid date';
        }
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = dateObj.toLocaleString('en-US', {
            month: 'short'
        }).charAt(0).toUpperCase() + dateObj.toLocaleString('en-US', {
            month: 'short'
        }).slice(1);
        const year = dateObj.getFullYear();
        return `${day} ${month} ${year}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
    }
}
function formatDateWithTime(date) {
    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(dateObj.getTime())) {
            return 'Invalid date';
        }
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = dateObj.toLocaleString('en-US', {
            month: 'short'
        }).charAt(0).toUpperCase() + dateObj.toLocaleString('en-US', {
            month: 'short'
        }).slice(1);
        const year = dateObj.getFullYear();
        const time = dateObj.toLocaleString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        return `${day} ${month} ${year}, ${time}`;
    } catch (error) {
        console.error('Error formatting date with time:', error);
        return 'Invalid date';
    }
}
function formatRelativeTime(date) {
    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(dateObj.getTime())) {
            return 'Invalid date';
        }
        const now = new Date();
        const diffMs = now.getTime() - dateObj.getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffDays / 365);
        if (diffSecs < 60) return 'just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
        if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
        return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
    } catch (error) {
        console.error('Error formatting relative time:', error);
        return 'Invalid date';
    }
}
function formatDateForAPI(date) {
    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(dateObj.getTime())) {
            return '';
        }
        return dateObj.toISOString().split('T')[0];
    } catch (error) {
        console.error('Error formatting date for API:', error);
        return '';
    }
}
}),
"[project]/frontend/app/organizations/[uuid]/projects/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ProjectsPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$layout$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/layout/sidebar.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$projects$2f$create$2d$project$2d$modal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/projects/create-project-modal.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/api/index.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/sonner/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$date$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/date-utils.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/search.js [app-ssr] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/plus.js [app-ssr] (ecmascript) <export default as Plus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$folder$2d$open$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FolderOpen$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/folder-open.js [app-ssr] (ecmascript) <export default as FolderOpen>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$ellipsis$2d$vertical$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MoreVertical$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/ellipsis-vertical.js [app-ssr] (ecmascript) <export default as MoreVertical>");
'use client';
;
;
;
;
;
;
;
;
;
const API_URL = ("TURBOPACK compile-time value", "http://localhost:8000") || 'http://localhost:8000';
const moduleConfig = {
    'test-management': {
        name: 'Test Management',
        color: 'blue'
    },
    'api-testing': {
        name: 'API Testing',
        color: 'green'
    },
    'automation-hub': {
        name: 'Automation Hub',
        color: 'purple'
    },
    'security-testing': {
        name: 'Security Testing',
        color: 'red'
    },
    'performance-testing': {
        name: 'Performance Testing',
        color: 'yellow'
    },
    'mobile-testing': {
        name: 'Mobile Testing',
        color: 'indigo'
    }
};
function ProjectsPage({ params }) {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const [projects, setProjects] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [searchQuery, setSearchQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [isCreateModalOpen, setIsCreateModalOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const { uuid } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["use"])(params);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        fetchProjects();
    }, [
        uuid
    ]);
    const fetchProjects = async ()=>{
        try {
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].get(`/api/v1/projects/?organisation_id=${uuid}`);
            setProjects(response.data);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
            // Handle different error scenarios
            if (error.response?.status === 404) {
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toast"].error('You do not have access to this organization');
            } else if (error.response?.status === 403) {
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toast"].error('You do not have permission to view projects');
            } else {
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toast"].error('Failed to load projects');
            }
            // Set empty array so UI shows "No projects" instead of error
            setProjects([]);
        } finally{
            setLoading(false);
        }
    };
    const filteredProjects = projects.filter((project)=>project.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex min-h-screen",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$layout$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Sidebar"], {
                    organisationId: uuid
                }, void 0, false, {
                    fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                    lineNumber: 80,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1 flex items-center justify-center bg-white",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                lineNumber: 83,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-600",
                                children: "Loading projects..."
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                lineNumber: 84,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                        lineNumber: 82,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                    lineNumber: 81,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
            lineNumber: 79,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex min-h-screen bg-white",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$layout$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Sidebar"], {
                organisationId: uuid
            }, void 0, false, {
                fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                lineNumber: 93,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "flex-1 overflow-auto",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "px-8 py-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-3 mb-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$folder$2d$open$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FolderOpen$3e$__["FolderOpen"], {
                                            className: "w-5 h-5 text-white"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                            lineNumber: 99,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                        lineNumber: 98,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        className: "text-2xl font-bold text-gray-900",
                                        children: "Projects"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                        lineNumber: 101,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                lineNumber: 97,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-gray-600 mt-2 ml-13",
                                children: "Create and manage your testing projects"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                lineNumber: 103,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                        lineNumber: 96,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "px-8 py-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-4 mb-8",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex-1 flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-lg",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                                className: "w-4 h-4 text-gray-400 flex-shrink-0"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                                lineNumber: 110,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "text",
                                                placeholder: "Search projects",
                                                value: searchQuery,
                                                onChange: (e)=>setSearchQuery(e.target.value),
                                                className: "flex-1 text-sm bg-transparent border-0 text-gray-900 placeholder-gray-400 outline-none"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                                lineNumber: 111,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-sm text-gray-400 whitespace-nowrap",
                                                children: [
                                                    filteredProjects.length,
                                                    " project",
                                                    filteredProjects.length !== 1 ? 's' : ''
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                                lineNumber: 118,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                        lineNumber: 109,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setIsCreateModalOpen(true),
                                        className: "inline-flex items-center gap-2 px-4 py-2 bg-primary hover:opacity-90 text-white rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                                className: "w-4 h-4"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                                lineNumber: 126,
                                                columnNumber: 15
                                            }, this),
                                            "New project"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                        lineNumber: 122,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                lineNumber: 108,
                                columnNumber: 11
                            }, this),
                            filteredProjects.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-center py-12",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$folder$2d$open$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FolderOpen$3e$__["FolderOpen"], {
                                        className: "w-12 h-12 text-gray-300 mx-auto mb-3"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                        lineNumber: 134,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-base font-medium text-gray-900 mb-1",
                                        children: searchQuery ? 'No projects found' : 'No projects yet'
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                        lineNumber: 135,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-gray-500 mb-4",
                                        children: searchQuery ? 'Try adjusting your search' : 'Create your first project to get started'
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                        lineNumber: 138,
                                        columnNumber: 15
                                    }, this),
                                    !searchQuery && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setIsCreateModalOpen(true),
                                        className: "inline-flex items-center gap-2 px-4 py-2 bg-primary hover:opacity-90 text-white rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                                className: "w-4 h-4"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                                lineNumber: 146,
                                                columnNumber: 19
                                            }, this),
                                            "Create project"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                        lineNumber: 142,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                lineNumber: 133,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid gap-5 md:grid-cols-2",
                                children: filteredProjects.map((project)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 overflow-hidden group cursor-pointer",
                                        onClick: ()=>router.push(`/organizations/${uuid}/projects/${project.id}`),
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "p-6",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-start justify-between mb-4",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex-1",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                                    className: "text-lg font-semibold text-gray-900 hover:text-primary mb-1 transition-colors",
                                                                    children: project.name
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                                                    lineNumber: 163,
                                                                    columnNumber: 25
                                                                }, this),
                                                                project.description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "text-sm text-gray-500",
                                                                    children: project.description
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                                                    lineNumber: 167,
                                                                    columnNumber: 27
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                                            lineNumber: 162,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            className: "p-1.5 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$ellipsis$2d$vertical$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MoreVertical$3e$__["MoreVertical"], {
                                                                className: "w-4 h-4 text-gray-400"
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                                                lineNumber: 173,
                                                                columnNumber: 25
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                                            lineNumber: 172,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                                    lineNumber: 161,
                                                    columnNumber: 21
                                                }, this),
                                                project.settings?.enabled_modules && project.settings.enabled_modules.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex flex-wrap gap-2 mb-4",
                                                    children: project.settings.enabled_modules.map((moduleId)=>{
                                                        const module = moduleConfig[moduleId];
                                                        if (!module) return null;
                                                        const colorClasses = {
                                                            blue: 'bg-blue-50 text-blue-700',
                                                            green: 'bg-green-50 text-green-700',
                                                            purple: 'bg-purple-50 text-purple-700',
                                                            red: 'bg-red-50 text-red-700',
                                                            yellow: 'bg-yellow-50 text-yellow-700',
                                                            indigo: 'bg-indigo-50 text-indigo-700'
                                                        };
                                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: `px-2 py-1 text-xs font-medium rounded ${colorClasses[module.color]}`,
                                                            children: module.name
                                                        }, moduleId, false, {
                                                            fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                                            lineNumber: 194,
                                                            columnNumber: 29
                                                        }, this);
                                                    })
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                                    lineNumber: 179,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "grid grid-cols-2 gap-4 pt-4 border-t border-gray-100",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-gray-500",
                                                                    children: "Total Artifacts"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                                                    lineNumber: 208,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-2xl font-semibold text-gray-900 mt-1",
                                                                    children: "0"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                                                    lineNumber: 209,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                                            lineNumber: 207,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-gray-500",
                                                                    children: "Last Updated"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                                                    lineNumber: 212,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-gray-900 mt-1",
                                                                    children: project.created_at ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$date$2d$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatDateHumanReadable"])(project.created_at) : 'Just now'
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                                                    lineNumber: 213,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                                            lineNumber: 211,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                                    lineNumber: 206,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: (e)=>{
                                                        e.stopPropagation();
                                                        router.push(`/organizations/${uuid}/projects/${project.id}`);
                                                    },
                                                    className: "w-full mt-4 py-2.5 px-4 bg-primary/5 hover:bg-primary/10 text-primary text-sm font-medium rounded-lg transition-colors",
                                                    children: "Open Project →"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                                    lineNumber: 223,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                            lineNumber: 160,
                                            columnNumber: 19
                                        }, this)
                                    }, project.id, false, {
                                        fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                        lineNumber: 154,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                                lineNumber: 152,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                        lineNumber: 106,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                lineNumber: 94,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$projects$2f$create$2d$project$2d$modal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CreateProjectModal"], {
                isOpen: isCreateModalOpen,
                onClose: ()=>setIsCreateModalOpen(false),
                organisationId: uuid,
                onProjectCreated: fetchProjects
            }, void 0, false, {
                fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
                lineNumber: 241,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/app/organizations/[uuid]/projects/page.tsx",
        lineNumber: 92,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=frontend_e801087c._.js.map