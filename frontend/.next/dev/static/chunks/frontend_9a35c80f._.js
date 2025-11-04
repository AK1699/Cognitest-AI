(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend/lib/utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/components/ui/button.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button,
    "buttonVariants",
    ()=>buttonVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-slot/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/utils.ts [app-client] (ecmascript)");
;
;
;
;
;
const buttonVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cva"])('inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50', {
    variants: {
        variant: {
            default: 'bg-primary text-primary-foreground hover:bg-primary/90',
            destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
            secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
            ghost: 'hover:bg-accent hover:text-accent-foreground',
            link: 'text-primary underline-offset-4 hover:underline'
        },
        size: {
            default: 'h-10 px-4 py-2',
            sm: 'h-9 rounded-md px-3',
            lg: 'h-11 rounded-md px-8',
            icon: 'h-10 w-10'
        }
    },
    defaultVariants: {
        variant: 'default',
        size: 'default'
    }
});
const Button = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c = ({ className, variant, size, asChild = false, ...props }, ref)=>{
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Slot"] : 'button';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(buttonVariants({
            variant,
            size,
            className
        })),
        ref: ref,
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/components/ui/button.tsx",
        lineNumber: 45,
        columnNumber: 7
    }, ("TURBOPACK compile-time value", void 0));
});
_c1 = Button;
Button.displayName = 'Button';
;
var _c, _c1;
__turbopack_context__.k.register(_c, "Button$React.forwardRef");
__turbopack_context__.k.register(_c1, "Button");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/lib/date-utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Date formatting utilities for consistent date display across the application
 */ /**
 * Format date to human-readable format: "01 JAN 2025"
 * @param date - Date string or Date object
 * @returns Formatted date string (e.g., "01 JAN 2025")
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
        }).toUpperCase();
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
        }).toUpperCase();
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/components/layout/sidebar.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Sidebar",
    ()=>Sidebar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/menu.js [app-client] (ecmascript) <export default as Menu>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$folder$2d$open$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FolderOpen$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/folder-open.js [app-client] (ecmascript) <export default as FolderOpen>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bar$2d$chart$2d$3$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart3$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/bar-chart-3.js [app-client] (ecmascript) <export default as BarChart3>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$credit$2d$card$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CreditCard$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/credit-card.js [app-client] (ecmascript) <export default as CreditCard>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/users.js [app-client] (ecmascript) <export default as Users>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$puzzle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Puzzle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/puzzle.js [app-client] (ecmascript) <export default as Puzzle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-client] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$building$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Building2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/building-2.js [app-client] (ecmascript) <export default as Building2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/plus.js [app-client] (ecmascript) <export default as Plus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user.js [app-client] (ecmascript) <export default as User>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-client] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$help$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__HelpCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-help.js [app-client] (ecmascript) <export default as HelpCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/log-out.js [app-client] (ecmascript) <export default as LogOut>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/check.js [app-client] (ecmascript) <export default as Check>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/auth-context.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/api/index.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
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
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$folder$2d$open$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FolderOpen$3e$__["FolderOpen"],
            iconColor: 'text-blue-600',
            bgColor: 'bg-blue-50',
            allowMember: true
        },
        {
            name: 'Enterprise Reporting',
            href: organisationId ? `/organizations/${organisationId}/enterprise-reporting` : '/enterprise-reporting',
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bar$2d$chart$2d$3$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart3$3e$__["BarChart3"],
            iconColor: 'text-purple-600',
            bgColor: 'bg-purple-50',
            allowMember: false
        },
        {
            name: 'Billing & Usage',
            href: organisationId ? `/organizations/${organisationId}/billing` : '/billing',
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$credit$2d$card$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CreditCard$3e$__["CreditCard"],
            iconColor: 'text-green-600',
            bgColor: 'bg-green-50',
            allowMember: false
        },
        {
            name: 'Users & Teams',
            href: organisationId ? `/organizations/${organisationId}/users-teams` : '/users-teams',
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__["Users"],
            iconColor: 'text-orange-600',
            bgColor: 'bg-orange-50',
            allowMember: false
        },
        {
            name: 'Integrations',
            href: organisationId ? `/organizations/${organisationId}/integrations` : '/integrations',
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$puzzle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Puzzle$3e$__["Puzzle"],
            iconColor: 'text-pink-600',
            bgColor: 'bg-pink-50',
            allowMember: false
        },
        {
            name: 'Settings',
            href: organisationId ? `/organizations/${organisationId}/settings` : '/settings',
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"],
            iconColor: 'text-gray-600',
            bgColor: 'bg-gray-50',
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
    _s();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const { user, logout } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const [isCollapsed, setIsCollapsed] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isMobileOpen, setIsMobileOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [currentOrganisation, setCurrentOrganisation] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [organisations, setOrganisations] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isProfileOpen, setIsProfileOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isOwner, setIsOwner] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Sidebar.useEffect": ()=>{
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
        }
    }["Sidebar.useEffect"], [
        user
    ]);
    // Check if current user is the owner of the organization
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Sidebar.useEffect": ()=>{
            if (user && currentOrganisation) {
                setIsOwner(currentOrganisation.owner_id === user.id);
            }
        }
    }["Sidebar.useEffect"], [
        user,
        currentOrganisation
    ]);
    const fetchOrganisations = async ()=>{
        if (!user) return;
        try {
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get('/api/v1/organisations/');
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>setIsMobileOpen(!isMobileOpen),
                className: "lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__["Menu"], {
                    className: "w-5 h-5 text-gray-600 dark:text-gray-400"
                }, void 0, false, {
                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                    lineNumber: 173,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/components/layout/sidebar.tsx",
                lineNumber: 169,
                columnNumber: 7
            }, this),
            isMobileOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "lg:hidden fixed inset-0 bg-black/50 z-40",
                onClick: ()=>setIsMobileOpen(false)
            }, void 0, false, {
                fileName: "[project]/frontend/components/layout/sidebar.tsx",
                lineNumber: 178,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                className: `
          fixed lg:sticky top-0 left-0 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 transition-all duration-300
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
        `,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col h-full",
                    children: [
                        !isCollapsed && user && currentOrganisation && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "p-4 relative",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>{
                                        setIsProfileOpen(!isProfileOpen);
                                        if (!isProfileOpen) {
                                            // Refetch organizations when opening the profile menu
                                            fetchOrganisations();
                                        }
                                    },
                                    className: `w-full flex items-center gap-3 p-3 rounded-lg transition-all ${isProfileOpen ? 'border border-primary bg-primary/5 dark:bg-primary/10' : 'border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm font-semibold text-white",
                                                children: currentOrganisation.name.substring(0, 2).toUpperCase()
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                lineNumber: 212,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                            lineNumber: 211,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex-1 min-w-0 text-left",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-sm font-semibold text-gray-900 dark:text-white leading-tight line-clamp-1",
                                                    children: currentOrganisation.name
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                    lineNumber: 217,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-0.5",
                                                    children: user.username
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                    lineNumber: 220,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                            lineNumber: 216,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                            className: `w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                            lineNumber: 224,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                    lineNumber: 197,
                                    columnNumber: 15
                                }, this),
                                isProfileOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "absolute top-24 left-4 right-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg space-y-4 z-50",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "space-y-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    className: "text-sm font-semibold text-gray-600 dark:text-gray-400",
                                                    children: [
                                                        "Organisations (",
                                                        organisations.length,
                                                        ")"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                    lineNumber: 236,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "space-y-2 max-h-40 overflow-y-auto",
                                                    children: organisations.map((org)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            onClick: ()=>switchOrganisation(org),
                                                            className: "w-full flex items-center gap-2 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$building$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Building2$3e$__["Building2"], {
                                                                    className: "w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                                    lineNumber: 246,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-sm text-gray-900 dark:text-white flex-1 truncate",
                                                                    children: org.name
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                                    lineNumber: 247,
                                                                    columnNumber: 27
                                                                }, this),
                                                                currentOrganisation?.id === org.id && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                                                                    className: "w-4 h-4 text-primary flex-shrink-0"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                                    lineNumber: 251,
                                                                    columnNumber: 29
                                                                }, this)
                                                            ]
                                                        }, org.id, true, {
                                                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                            lineNumber: 241,
                                                            columnNumber: 25
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                    lineNumber: 239,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                            lineNumber: 235,
                                            columnNumber: 19
                                        }, this),
                                        isOwner && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("hr", {
                                                    className: "border-gray-200 dark:border-gray-700"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                    lineNumber: 261,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>{
                                                        router.push('/organizations/new');
                                                        setIsProfileOpen(false);
                                                    },
                                                    className: "w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                                            className: "w-4 h-4 text-gray-600 dark:text-gray-400"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                            lineNumber: 269,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sm text-gray-900 dark:text-white",
                                                            children: "Add Organisation"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                            lineNumber: 270,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                    lineNumber: 262,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("hr", {
                                            className: "border-gray-200 dark:border-gray-700"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                            lineNumber: 275,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>{
                                                router.push('/profile/edit');
                                                setIsProfileOpen(false);
                                            },
                                            className: "w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                                                    className: "w-4 h-4 text-gray-600 dark:text-gray-400"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                    lineNumber: 285,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-sm text-gray-900 dark:text-white",
                                                    children: "Edit profile"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                    lineNumber: 286,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                            lineNumber: 278,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>{
                                                router.push('/account/settings');
                                                setIsProfileOpen(false);
                                            },
                                            className: "w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"], {
                                                    className: "w-4 h-4 text-gray-600 dark:text-gray-400"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                    lineNumber: 297,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-sm text-gray-900 dark:text-white",
                                                    children: "Account settings"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                    lineNumber: 298,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                            lineNumber: 290,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>{
                                                router.push('/support');
                                                setIsProfileOpen(false);
                                            },
                                            className: "w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$help$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__HelpCircle$3e$__["HelpCircle"], {
                                                    className: "w-4 h-4 text-gray-600 dark:text-gray-400"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                    lineNumber: 309,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-sm text-gray-900 dark:text-white",
                                                    children: "Support"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                    lineNumber: 310,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                            lineNumber: 302,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("hr", {
                                            className: "border-gray-200 dark:border-gray-700"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                            lineNumber: 313,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>{
                                                logout();
                                                setIsProfileOpen(false);
                                            },
                                            className: "w-full flex items-center gap-3 p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors text-left",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__["LogOut"], {
                                                    className: "w-4 h-4 text-red-600 dark:text-red-400"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                    lineNumber: 323,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-sm text-red-600 dark:text-red-400 font-medium",
                                                    children: "Sign out"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                    lineNumber: 324,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                            lineNumber: 316,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                    lineNumber: 233,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                            lineNumber: 195,
                            columnNumber: 13
                        }, this),
                        isProfileOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "fixed inset-0 z-40",
                            onClick: ()=>setIsProfileOpen(false)
                        }, void 0, false, {
                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                            lineNumber: 333,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                            className: "flex-1 overflow-y-auto py-6 px-3",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-1 mb-6",
                                children: getMainMenuItems(currentOrganisation?.id, isOwner).map((item)=>{
                                    const isActive = pathname === item.href;
                                    const Icon = item.icon;
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: item.href,
                                        onClick: ()=>setIsMobileOpen(false),
                                        className: `
                      flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group
                      ${isActive ? `${item.bgColor} text-gray-900 dark:text-white` : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
                      ${isCollapsed ? 'justify-center' : ''}
                    `,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                className: `w-5 h-5 flex-shrink-0 ${item.iconColor}`
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                lineNumber: 361,
                                                columnNumber: 21
                                            }, this),
                                            !isCollapsed && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-medium text-sm",
                                                children: item.name
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                                lineNumber: 365,
                                                columnNumber: 23
                                            }, this)
                                        ]
                                    }, item.name, true, {
                                        fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                        lineNumber: 347,
                                        columnNumber: 19
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                lineNumber: 341,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                            lineNumber: 340,
                            columnNumber: 11
                        }, this),
                        !isCollapsed && projectId && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "p-4 border-t border-gray-200 dark:border-gray-700",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-xs text-gray-500 dark:text-gray-400 mb-1",
                                    children: "Current Project"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                    lineNumber: 377,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-sm font-medium text-gray-900 dark:text-white truncate",
                                    children: "Project Name"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                                    lineNumber: 380,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/components/layout/sidebar.tsx",
                            lineNumber: 376,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/components/layout/sidebar.tsx",
                    lineNumber: 192,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/components/layout/sidebar.tsx",
                lineNumber: 185,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
_s(Sidebar, "BwIBK9vITRnF1ev7VKwbo136yQQ=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = Sidebar;
var _c;
__turbopack_context__.k.register(_c, "Sidebar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/lib/api/roles.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "assignRoleToGroup",
    ()=>assignRoleToGroup,
    "assignRoleToUser",
    ()=>assignRoleToUser,
    "createRole",
    ()=>createRole,
    "deleteRole",
    ()=>deleteRole,
    "listGroupRoles",
    ()=>listGroupRoles,
    "listPermissions",
    ()=>listPermissions,
    "listRoles",
    ()=>listRoles,
    "listUserRoles",
    ()=>listUserRoles,
    "removeRoleFromGroup",
    ()=>removeRoleFromGroup,
    "removeRoleFromUser",
    ()=>removeRoleFromUser
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/api/index.ts [app-client] (ecmascript)");
;
async function listRoles(organisationId) {
    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`/api/v1/roles/`, {
        params: {
            organisation_id: organisationId
        }
    });
    return response.data;
}
async function listUserRoles(userId, projectId) {
    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`/api/v1/roles/assignments/users`, {
        params: {
            user_id: userId,
            project_id: projectId
        }
    });
    return response.data.assignments || [];
}
async function listGroupRoles(groupId, projectId) {
    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`/api/v1/roles/assignments/groups`, {
        params: {
            group_id: groupId,
            project_id: projectId
        }
    });
    return response.data.assignments || [];
}
async function assignRoleToUser(userId, roleId, projectId) {
    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].post('/api/v1/roles/assignments/users', {
        user_id: userId,
        role_id: roleId,
        project_id: projectId
    });
    return response.data;
}
async function assignRoleToGroup(groupId, roleId, projectId) {
    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].post('/api/v1/roles/assignments/groups', {
        group_id: groupId,
        role_id: roleId,
        project_id: projectId
    });
    return response.data;
}
async function removeRoleFromUser(assignmentId) {
    await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].delete(`/api/v1/roles/assignments/users/${assignmentId}`);
}
async function removeRoleFromGroup(assignmentId) {
    await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].delete(`/api/v1/roles/assignments/groups/${assignmentId}`);
}
async function createRole(organisationId, name, roleType, description, permissions) {
    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].post('/api/v1/roles/', {
        organisation_id: organisationId,
        name,
        role_type: roleType,
        description,
        permissions: permissions || []
    });
    return response.data;
}
async function deleteRole(roleId) {
    await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].delete(`/api/v1/roles/${roleId}`);
}
async function listPermissions() {
    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get('/api/v1/roles/permissions');
    return response.data.permissions || [];
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/lib/api/users.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "deleteUser",
    ()=>deleteUser,
    "getUserById",
    ()=>getUserById,
    "listOrganisationUsers",
    ()=>listOrganisationUsers,
    "updateUser",
    ()=>updateUser
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/api/index.ts [app-client] (ecmascript)");
;
async function listOrganisationUsers(organisationId) {
    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`/api/v1/organisations/${organisationId}/users`);
    return response.data;
}
async function getUserById(userId) {
    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`/api/v1/users/${userId}`);
    return response.data;
}
async function updateUser(userId, data) {
    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].put(`/api/v1/users/${userId}`, data);
    return response.data;
}
async function deleteUser(userId) {
    await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].delete(`/api/v1/users/${userId}`);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/components/roles/role-assignment-modal.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RoleAssignmentModal",
    ()=>RoleAssignmentModal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/ui/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield.js [app-client] (ecmascript) <export default as Shield>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trash-2.js [app-client] (ecmascript) <export default as Trash2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-alert.js [app-client] (ecmascript) <export default as AlertCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/sonner/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$roles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/api/roles.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
function RoleAssignmentModal({ isOpen, onClose, organisationId, projectId: initialProjectId, entityType, entityId, entityName, availableProjects = [] }) {
    _s();
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [roles, setRoles] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [currentRoles, setCurrentRoles] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectedProjectId, setSelectedProjectId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialProjectId || '');
    const [filterProjectId, setFilterProjectId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialProjectId || '');
    const [selectedRoleId, setSelectedRoleId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [showAddRole, setShowAddRole] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Fetch roles on modal open (independent of project selection)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "RoleAssignmentModal.useEffect": ()=>{
            if (isOpen) {
                fetchRoles();
                fetchAllUserRoles(); // Fetch all roles for this user across all projects
            }
        }
    }["RoleAssignmentModal.useEffect"], [
        isOpen,
        organisationId
    ]);
    // Fetch current assignments when filter project changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "RoleAssignmentModal.useEffect": ()=>{
            if (isOpen && filterProjectId) {
                fetchCurrentRoles();
            }
        }
    }["RoleAssignmentModal.useEffect"], [
        filterProjectId,
        entityId
    ]);
    // Fetch all roles for this user across all projects
    const fetchAllUserRoles = async ()=>{
        try {
            // Fetch from all projects to see where user already has roles
            if (entityType === 'user' && availableProjects.length > 0) {
                let allRoles = [];
                for (const project of availableProjects){
                    try {
                        const userRolesData = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$roles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listUserRoles"])(entityId, project.id);
                        allRoles = [
                            ...allRoles,
                            ...userRolesData
                        ];
                    } catch (e) {
                    // Project might not have any roles for this user
                    }
                }
                setCurrentRoles(allRoles);
            }
        } catch (error) {
            console.error('Error fetching all user roles:', error);
        }
    };
    const fetchRoles = async ()=>{
        setLoading(true);
        try {
            const rolesData = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$roles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listRoles"])(organisationId);
            setRoles(rolesData.roles);
        } catch (error) {
            console.error('Error fetching roles:', error);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error(error.message || 'Failed to load roles');
        } finally{
            setLoading(false);
        }
    };
    const fetchCurrentRoles = async ()=>{
        if (!filterProjectId) return;
        try {
            // Fetch current role assignments for the selected project
            if (entityType === 'user') {
                const userRolesData = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$roles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listUserRoles"])(entityId, filterProjectId);
                setCurrentRoles(userRolesData);
            } else {
                const groupRolesData = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$roles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listGroupRoles"])(entityId, filterProjectId);
                setCurrentRoles(groupRolesData);
            }
        } catch (error) {
            console.error('Error fetching current roles:', error);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error(error.message || 'Failed to load current roles');
        }
    };
    const handleAssignRole = async ()=>{
        const selectedRole = roles.find((r)=>r.id === selectedRoleId);
        const isAdminRole = selectedRole?.role_type === 'administrator';
        // Admin role only needs role selection
        // Other roles require both role and project
        if (!selectedRoleId) return;
        if (!isAdminRole && !selectedProjectId) return;
        try {
            let projectToAssign = selectedProjectId;
            // Get list of projects where user already has roles
            const projectsWithRoles = new Set(currentRoles.map((role)=>{
                // Extract project_id from currentRoles
                return role.project_id;
            }));
            // For admin role, if no project selected, find a project where user doesn't already have a role
            if (isAdminRole && !projectToAssign && availableProjects.length > 0) {
                // Find first project without a role assignment
                const projectWithoutRole = availableProjects.find((p)=>!projectsWithRoles.has(p.id));
                if (projectWithoutRole) {
                    projectToAssign = projectWithoutRole.id;
                } else {
                    // All projects have roles, use the first one and suggest updating
                    projectToAssign = availableProjects[0].id;
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].warning('User already has roles in all projects. Attempting to assign as admin role (may need to remove existing role first).');
                }
            }
            // For non-admin roles, check if selected project already has a role
            if (!isAdminRole && selectedProjectId && projectsWithRoles.has(selectedProjectId)) {
                // User already has a role on this project, try to find alternative
                const projectWithoutRole = availableProjects.find((p)=>!projectsWithRoles.has(p.id));
                if (projectWithoutRole) {
                    // Auto-switch to project without role
                    projectToAssign = projectWithoutRole.id;
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].info(`User already has a role on "${availableProjects.find((p)=>p.id === selectedProjectId)?.name || 'selected project'}". Assigning to "${projectWithoutRole.name}" instead.`);
                } else {
                    // All projects have roles for this user
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error('User already has a role on all projects. Please remove an existing role first, or assign an admin role for organization-wide access.');
                    return;
                }
            }
            if (!projectToAssign) {
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error('Please create a project first before assigning roles');
                return;
            }
            if (entityType === 'user') {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$roles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["assignRoleToUser"])(entityId, selectedRoleId, projectToAssign);
            } else {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$roles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["assignRoleToGroup"])(entityId, selectedRoleId, projectToAssign);
            }
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].success('Role assigned successfully');
            if (isAdminRole) {
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].success('✅ Admin user now has automatic access to all projects in this organization');
            }
            setSelectedRoleId('');
            setSelectedProjectId('');
            setShowAddRole(false);
            // Refresh if viewing that project
            if (filterProjectId === projectToAssign) {
                await fetchCurrentRoles();
            }
        } catch (error) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error(error.response?.data?.detail || error.message || 'Failed to assign role');
        }
    };
    const handleRemoveRole = async (assignmentId)=>{
        if (!confirm('Are you sure you want to remove this role assignment?')) return;
        try {
            if (entityType === 'user') {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$roles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["removeRoleFromUser"])(assignmentId);
            } else {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$roles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["removeRoleFromGroup"])(assignmentId);
            }
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].success('Role removed successfully');
            fetchData();
        } catch (error) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error(error.message || 'Failed to remove role');
        }
    };
    const getRoleBadgeColor = (roleType)=>{
        switch(roleType){
            case 'administrator':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'project_manager':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'developer':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'tester':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'viewer':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-cyan-100 text-cyan-800 border-cyan-200';
        }
    };
    if (!isOpen) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"], {
                                    className: "w-6 h-6 text-primary"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                    lineNumber: 242,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-xl font-bold text-gray-900 dark:text-white",
                                            children: [
                                                "Manage Roles - ",
                                                entityName
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                            lineNumber: 244,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-sm text-gray-500 dark:text-gray-400 mt-1",
                                            children: [
                                                "Assign and manage roles for this ",
                                                entityType
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                            lineNumber: 247,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                    lineNumber: 243,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                            lineNumber: 241,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: "p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                className: "w-5 h-5 text-gray-500"
                            }, void 0, false, {
                                fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                lineNumber: 256,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                            lineNumber: 252,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                    lineNumber: 240,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1 overflow-y-auto p-6 space-y-6",
                    children: loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-center py-12",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-gray-500",
                            children: "Loading roles..."
                        }, void 0, false, {
                            fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                            lineNumber: 264,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                        lineNumber: 263,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-lg font-semibold text-gray-900 dark:text-white mb-4",
                                        children: "Assign Role"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                        lineNumber: 270,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2",
                                                        children: "Select Role"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                        lineNumber: 277,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                        value: selectedRoleId,
                                                        onChange: (e)=>setSelectedRoleId(e.target.value),
                                                        className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                value: "",
                                                                children: "Choose a role..."
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                                lineNumber: 285,
                                                                columnNumber: 23
                                                            }, this),
                                                            roles.map((role)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                    value: role.id,
                                                                    children: [
                                                                        role.name,
                                                                        " (",
                                                                        role.role_type.replace('_', ' '),
                                                                        ")"
                                                                    ]
                                                                }, role.id, true, {
                                                                    fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                                    lineNumber: 287,
                                                                    columnNumber: 25
                                                                }, this))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                        lineNumber: 280,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                lineNumber: 276,
                                                columnNumber: 19
                                            }, this),
                                            selectedRoleId && (()=>{
                                                const selectedRole = roles.find((r)=>r.id === selectedRoleId);
                                                const isAdminRole = selectedRole?.role_type === 'administrator';
                                                if (isAdminRole) {
                                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex items-start gap-3",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"], {
                                                                    className: "w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                                    lineNumber: 303,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                            className: "text-sm font-semibold text-green-800 dark:text-green-200 mb-1",
                                                                            children: "Admin Role - No Project Selection Needed"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                                            lineNumber: 305,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                            className: "text-sm text-green-700 dark:text-green-300",
                                                                            children: "Admin users automatically have full access to all projects in this organization."
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                                            lineNumber: 308,
                                                                            columnNumber: 31
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                                    lineNumber: 304,
                                                                    columnNumber: 29
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                            lineNumber: 302,
                                                            columnNumber: 27
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                        lineNumber: 301,
                                                        columnNumber: 25
                                                    }, this);
                                                }
                                                // Get projects where user already has roles
                                                const projectsWithRoles = new Set(currentRoles.map((role)=>role.project_id));
                                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "space-y-3",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                    className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2",
                                                                    children: "Select Project to Assign To"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                                    lineNumber: 325,
                                                                    columnNumber: 27
                                                                }, this),
                                                                availableProjects.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                                    value: selectedProjectId,
                                                                    onChange: (e)=>setSelectedProjectId(e.target.value),
                                                                    className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                            value: "",
                                                                            children: "Select a project..."
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                                            lineNumber: 334,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        availableProjects.map((project)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                value: project.id,
                                                                                children: [
                                                                                    project.name,
                                                                                    projectsWithRoles.has(project.id) ? ' (already assigned)' : ''
                                                                                ]
                                                                            }, project.id, true, {
                                                                                fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                                                lineNumber: 336,
                                                                                columnNumber: 33
                                                                            }, this))
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                                    lineNumber: 329,
                                                                    columnNumber: 29
                                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "text-sm text-yellow-800 dark:text-yellow-200",
                                                                        children: "⚠️ No projects available. Please create a project first before assigning roles."
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                                        lineNumber: 344,
                                                                        columnNumber: 31
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                                    lineNumber: 343,
                                                                    columnNumber: 29
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                            lineNumber: 324,
                                                            columnNumber: 25
                                                        }, this),
                                                        projectsWithRoles.size > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "text-xs font-semibold text-amber-800 dark:text-amber-200 mb-2",
                                                                    children: "ℹ️ User already has roles on:"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                                    lineNumber: 354,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "flex flex-wrap gap-2",
                                                                    children: availableProjects.filter((p)=>projectsWithRoles.has(p.id)).map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "inline-block px-2 py-1 text-xs bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100 rounded",
                                                                            children: p.name
                                                                        }, p.id, false, {
                                                                            fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                                            lineNumber: 361,
                                                                            columnNumber: 35
                                                                        }, this))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                                    lineNumber: 357,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "text-xs text-amber-700 dark:text-amber-300 mt-2",
                                                                    children: "System will automatically use a different project if you select one with an existing role."
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                                    lineNumber: 369,
                                                                    columnNumber: 29
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                            lineNumber: 353,
                                                            columnNumber: 27
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                    lineNumber: 323,
                                                    columnNumber: 23
                                                }, this);
                                            })(),
                                            selectedRoleId && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4",
                                                children: (()=>{
                                                    const selectedRole = roles.find((r)=>r.id === selectedRoleId);
                                                    if (!selectedRole) return null;
                                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex items-center gap-2 mb-2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"], {
                                                                        className: "w-5 h-5 text-blue-600"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                                        lineNumber: 389,
                                                                        columnNumber: 31
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "font-semibold text-blue-900 dark:text-blue-100",
                                                                        children: selectedRole.name
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                                        lineNumber: 390,
                                                                        columnNumber: 31
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: `px-2 py-0.5 text-xs font-semibold rounded-full border ${getRoleBadgeColor(selectedRole.role_type)}`,
                                                                        children: selectedRole.role_type.replace('_', ' ')
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                                        lineNumber: 393,
                                                                        columnNumber: 31
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                                lineNumber: 388,
                                                                columnNumber: 29
                                                            }, this),
                                                            selectedRole.description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "text-sm text-blue-700 dark:text-blue-200",
                                                                children: selectedRole.description
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                                lineNumber: 398,
                                                                columnNumber: 31
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                        lineNumber: 387,
                                                        columnNumber: 27
                                                    }, this);
                                                })()
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                lineNumber: 381,
                                                columnNumber: 21
                                            }, this),
                                            (()=>{
                                                const selectedRole = roles.find((r)=>r.id === selectedRoleId);
                                                const isAdminRole = selectedRole?.role_type === 'administrator';
                                                // Admin role only needs role selection, others need both role and project
                                                const isEnabled = selectedRoleId && (isAdminRole || selectedProjectId);
                                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                    onClick: handleAssignRole,
                                                    disabled: !isEnabled,
                                                    className: "w-full",
                                                    children: "Assign Role"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                    lineNumber: 416,
                                                    columnNumber: 23
                                                }, this);
                                            })()
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                        lineNumber: 274,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                lineNumber: 269,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "border-t border-gray-200 dark:border-gray-700 pt-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-lg font-semibold text-gray-900 dark:text-white mb-4",
                                        children: "Current Roles"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                        lineNumber: 430,
                                        columnNumber: 17
                                    }, this),
                                    availableProjects.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mb-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2",
                                                children: "Filter by Project"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                lineNumber: 437,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                value: filterProjectId,
                                                onChange: (e)=>{
                                                    setFilterProjectId(e.target.value);
                                                    setCurrentRoles([]);
                                                },
                                                className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: "",
                                                        children: "Select a project to view..."
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                        lineNumber: 448,
                                                        columnNumber: 23
                                                    }, this),
                                                    availableProjects.map((project)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            value: project.id,
                                                            children: project.name
                                                        }, project.id, false, {
                                                            fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                            lineNumber: 450,
                                                            columnNumber: 25
                                                        }, this))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                lineNumber: 440,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                        lineNumber: 436,
                                        columnNumber: 19
                                    }, this),
                                    !filterProjectId ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-col items-center justify-center py-8 text-gray-500",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                                                className: "w-10 h-10 mb-2 text-gray-400"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                lineNumber: 460,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-center text-sm",
                                                children: availableProjects.length > 0 ? 'Select a project to view assigned roles' : 'No projects available'
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                lineNumber: 461,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                        lineNumber: 459,
                                        columnNumber: 19
                                    }, this) : currentRoles.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"], {
                                                className: "w-12 h-12 mx-auto mb-3 text-gray-400"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                lineNumber: 469,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-gray-500 dark:text-gray-400",
                                                children: "No roles assigned yet for this project"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                lineNumber: 470,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                        lineNumber: 468,
                                        columnNumber: 19
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-3",
                                        children: currentRoles.map((assignment)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-3",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"], {
                                                                className: "w-5 h-5 text-gray-400"
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                                lineNumber: 482,
                                                                columnNumber: 27
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "flex items-center gap-2",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "font-medium text-gray-900 dark:text-white",
                                                                            children: assignment.role?.name || assignment.role_name
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                                            lineNumber: 485,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: `px-2 py-0.5 text-xs font-semibold rounded-full border ${getRoleBadgeColor(assignment.role?.role_type || assignment.role_type)}`,
                                                                            children: (assignment.role?.role_type || assignment.role_type).replace('_', ' ')
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                                            lineNumber: 488,
                                                                            columnNumber: 31
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                                    lineNumber: 484,
                                                                    columnNumber: 29
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                                lineNumber: 483,
                                                                columnNumber: 27
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                        lineNumber: 481,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                        variant: "ghost",
                                                        size: "sm",
                                                        onClick: ()=>handleRemoveRole(assignment.id),
                                                        className: "text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                                            className: "w-4 h-4"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                            lineNumber: 500,
                                                            columnNumber: 27
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                        lineNumber: 494,
                                                        columnNumber: 25
                                                    }, this)
                                                ]
                                            }, assignment.id, true, {
                                                fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                                lineNumber: 477,
                                                columnNumber: 23
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                        lineNumber: 475,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                                lineNumber: 429,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true)
                }, void 0, false, {
                    fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                    lineNumber: 261,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-end gap-2 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                        variant: "outline",
                        onClick: onClose,
                        children: "Close"
                    }, void 0, false, {
                        fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                        lineNumber: 513,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
                    lineNumber: 512,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
            lineNumber: 238,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/components/roles/role-assignment-modal.tsx",
        lineNumber: 237,
        columnNumber: 5
    }, this);
}
_s(RoleAssignmentModal, "X88Rp3fuFTgKitglN4zZW59EYuo=");
_c = RoleAssignmentModal;
var _c;
__turbopack_context__.k.register(_c, "RoleAssignmentModal");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/lib/api/invitations.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "acceptInvitation",
    ()=>acceptInvitation,
    "cancelInvitation",
    ()=>cancelInvitation,
    "createInvitation",
    ()=>createInvitation,
    "listInvitations",
    ()=>listInvitations
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/api/index.ts [app-client] (ecmascript)");
;
async function createInvitation(data) {
    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].post('/api/v1/invitations/', data);
    return response.data;
}
async function listInvitations(organisationId) {
    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`/api/v1/invitations/`, {
        params: {
            organisation_id: organisationId
        }
    });
    return response.data;
}
async function cancelInvitation(invitationId) {
    await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].delete(`/api/v1/invitations/${invitationId}`);
}
async function acceptInvitation(token, data) {
    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].post('/api/v1/invitations/accept', {
        token,
        ...data
    });
    return response.data;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/components/roles/role-filter.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RoleFilter",
    ()=>RoleFilter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-client] (ecmascript) <export default as ChevronDown>");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
const DEFAULT_ROLES = [
    {
        id: 'viewer',
        name: 'Viewer',
        description: 'Can see projects assigned to their teams'
    },
    {
        id: 'member',
        name: 'Member',
        description: 'Can create projects and manage configuration'
    },
    {
        id: 'team_admin',
        name: 'Team admin',
        description: 'Can manage projects and team members'
    },
    {
        id: 'org_admin',
        name: 'Org admin',
        description: 'Can manage organization and teams'
    },
    {
        id: 'owner',
        name: 'Owner',
        description: 'Full administrative access'
    }
];
function RoleFilter({ selectedRoles, onRolesChange, roles = DEFAULT_ROLES }) {
    _s();
    const [isOpen, setIsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const toggleRole = (roleId)=>{
        if (selectedRoles.includes(roleId)) {
            onRolesChange(selectedRoles.filter((r)=>r !== roleId));
        } else {
            onRolesChange([
                ...selectedRoles,
                roleId
            ]);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>setIsOpen(!isOpen),
                className: "flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-sm font-medium",
                        children: "Roles"
                    }, void 0, false, {
                        fileName: "[project]/frontend/components/roles/role-filter.tsx",
                        lineNumber: 43,
                        columnNumber: 9
                    }, this),
                    selectedRoles.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center",
                        children: selectedRoles.length
                    }, void 0, false, {
                        fileName: "[project]/frontend/components/roles/role-filter.tsx",
                        lineNumber: 45,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                        className: `w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`
                    }, void 0, false, {
                        fileName: "[project]/frontend/components/roles/role-filter.tsx",
                        lineNumber: 49,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/components/roles/role-filter.tsx",
                lineNumber: 39,
                columnNumber: 7
            }, this),
            isOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-full -right-12 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "p-3 space-y-2",
                    children: roles.map((role)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: "flex items-start gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "checkbox",
                                    checked: selectedRoles.includes(role.id),
                                    onChange: ()=>toggleRole(role.id),
                                    className: "mt-1 w-4 h-4 text-primary rounded focus:ring-primary cursor-pointer flex-shrink-0"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/components/roles/role-filter.tsx",
                                    lineNumber: 57,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex-1 min-w-0",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-sm font-medium text-gray-900 dark:text-white",
                                            children: role.name
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/components/roles/role-filter.tsx",
                                            lineNumber: 64,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-xs text-gray-500 dark:text-gray-400 line-clamp-2",
                                            children: role.description
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/components/roles/role-filter.tsx",
                                            lineNumber: 67,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/components/roles/role-filter.tsx",
                                    lineNumber: 63,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, role.id, true, {
                            fileName: "[project]/frontend/components/roles/role-filter.tsx",
                            lineNumber: 56,
                            columnNumber: 15
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/frontend/components/roles/role-filter.tsx",
                    lineNumber: 54,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/components/roles/role-filter.tsx",
                lineNumber: 53,
                columnNumber: 9
            }, this),
            isOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 z-40",
                onClick: ()=>setIsOpen(false)
            }, void 0, false, {
                fileName: "[project]/frontend/components/roles/role-filter.tsx",
                lineNumber: 79,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/components/roles/role-filter.tsx",
        lineNumber: 38,
        columnNumber: 5
    }, this);
}
_s(RoleFilter, "+sus0Lb0ewKHdwiUhiTAJFoFyQ0=");
_c = RoleFilter;
var _c;
__turbopack_context__.k.register(_c, "RoleFilter");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/components/ui/checkbox.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Checkbox",
    ()=>Checkbox
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/check.js [app-client] (ecmascript) <export default as Check>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/utils.ts [app-client] (ecmascript)");
;
;
;
;
const Checkbox = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c = ({ className, onCheckedChange, checked, onChange, ...props }, ref)=>{
    const handleChange = (e)=>{
        if (onCheckedChange) {
            onCheckedChange(e.target.checked);
        }
        if (onChange) {
            onChange(e);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative inline-flex",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: "checkbox",
                ref: ref,
                checked: checked,
                onChange: handleChange,
                className: "sr-only",
                ...props
            }, void 0, false, {
                fileName: "[project]/frontend/components/ui/checkbox.tsx",
                lineNumber: 23,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('h-5 w-5 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center transition-all', checked ? 'bg-blue-600 border-blue-600 dark:bg-blue-600 dark:border-blue-600' : 'bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500', props.disabled && 'opacity-50 cursor-not-allowed', className),
                children: checked && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                    className: "w-4 h-4 text-white",
                    strokeWidth: 3
                }, void 0, false, {
                    fileName: "[project]/frontend/components/ui/checkbox.tsx",
                    lineNumber: 41,
                    columnNumber: 23
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/frontend/components/ui/checkbox.tsx",
                lineNumber: 31,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/components/ui/checkbox.tsx",
        lineNumber: 22,
        columnNumber: 7
    }, ("TURBOPACK compile-time value", void 0));
});
_c1 = Checkbox;
Checkbox.displayName = 'Checkbox';
;
var _c, _c1;
__turbopack_context__.k.register(_c, "Checkbox$React.forwardRef");
__turbopack_context__.k.register(_c1, "Checkbox");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/components/settings/permission-matrix.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PermissionMatrix",
    ()=>PermissionMatrix
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/ui/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$checkbox$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/ui/checkbox.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/sonner/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/api/index.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-client] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/save.js [app-client] (ecmascript) <export default as Save>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/rotate-ccw.js [app-client] (ecmascript) <export default as RotateCcw>");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
// Group permissions by resource for better organization
const PERMISSION_GROUPS = {
    'User Management': [
        'user_read_access',
        'user_write_access',
        'user_delete_access'
    ],
    'Role Management': [
        'role_read_access',
        'role_write_access',
        'role_delete_access'
    ],
    'Project Management': [
        'project_read_access',
        'project_write_access',
        'project_delete_access'
    ],
    'Test Case Management': [
        'test_case_read_access',
        'test_case_write_access',
        'test_case_delete_access',
        'test_case_execute_access'
    ],
    'API Testing': [
        'api_test_read_access',
        'api_test_write_access',
        'api_test_delete_access',
        'api_test_execute_access'
    ],
    'Automation Hub': [
        'automation_read_access',
        'automation_write_access',
        'automation_delete_access',
        'automation_execute_access'
    ],
    'Security Testing': [
        'security_test_read_access',
        'security_test_write_access',
        'security_test_delete_access',
        'security_test_execute_access'
    ],
    'Performance Testing': [
        'performance_test_read_access',
        'performance_test_write_access',
        'performance_test_delete_access',
        'performance_test_execute_access'
    ],
    'Mobile Testing': [
        'mobile_test_read_access',
        'mobile_test_write_access',
        'mobile_test_delete_access',
        'mobile_test_execute_access'
    ],
    'Settings': [
        'settings_read_access',
        'settings_write_access'
    ],
    'Organization': [
        'organization_manage_access'
    ]
};
function PermissionMatrix({ organisationId, isAdmin = false }) {
    _s();
    const [roles, setRoles] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [permissions, setPermissions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [rolePermissions, setRolePermissions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [originalRolePermissions, setOriginalRolePermissions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [permissionGroups, setPermissionGroups] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(PERMISSION_GROUPS);
    const [enabledModules, setEnabledModules] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PermissionMatrix.useEffect": ()=>{
            fetchData();
        }
    }["PermissionMatrix.useEffect"], [
        organisationId
    ]);
    const fetchData = async ()=>{
        setLoading(true);
        try {
            // Fetch roles
            const rolesResponse = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get('/api/v1/roles/', {
                params: {
                    organisation_id: organisationId
                }
            });
            const rolesList = rolesResponse.data.roles || [];
            setRoles(rolesList);
            // Fetch dynamic permissions based on enabled modules
            try {
                const dynamicResponse = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`/api/v1/roles/dynamic/${organisationId}`);
                const { permission_groups, all_permissions, enabled_modules } = dynamicResponse.data;
                // Use dynamic permission groups if available
                if (permission_groups) {
                    setPermissionGroups(permission_groups);
                }
                // Set enabled modules for reference
                if (enabled_modules) {
                    setEnabledModules(enabled_modules);
                }
                // Use all permissions including dynamic ones
                setPermissions(all_permissions || []);
            } catch (dynamicError) {
                // Fallback to static permissions if dynamic endpoint fails
                console.warn('Could not fetch dynamic permissions, using static permissions:', dynamicError);
                const permsResponse = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get('/api/v1/roles/permissions');
                const permsList = permsResponse.data.permissions || [];
                setPermissions(permsList);
            }
            // Initialize role-permission mapping
            const permMap = {};
            rolesList.forEach((role)=>{
                permMap[role.id] = (role.permissions || []).map((p)=>p.id);
            });
            setRolePermissions(permMap);
            setOriginalRolePermissions(JSON.parse(JSON.stringify(permMap)));
        } catch (error) {
            console.error('Failed to fetch data:', error);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error('Failed to load roles and permissions');
        } finally{
            setLoading(false);
        }
    };
    const togglePermission = (roleId, permissionId)=>{
        if (!isAdmin) return;
        setRolePermissions((prev)=>{
            const newMap = {
                ...prev
            };
            const rolePerms = [
                ...newMap[roleId] || []
            ];
            const index = rolePerms.indexOf(permissionId);
            if (index > -1) {
                rolePerms.splice(index, 1);
            } else {
                rolePerms.push(permissionId);
            }
            newMap[roleId] = rolePerms;
            return newMap;
        });
    };
    const hasChanges = ()=>{
        return Object.keys(rolePermissions).some((roleId)=>{
            const original = Array.from(originalRolePermissions[roleId] || []).sort();
            const current = Array.from(rolePermissions[roleId] || []).sort();
            return JSON.stringify(original) !== JSON.stringify(current);
        });
    };
    const savePermissions = async ()=>{
        setSaving(true);
        try {
            // Update each role with its new permissions
            for (const role of roles){
                const permIds = Array.from(rolePermissions[role.id] || []);
                await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].put(`/api/v1/roles/${role.id}`, {
                    permission_ids: permIds
                });
            }
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].success('Permissions updated successfully!');
            setOriginalRolePermissions(JSON.parse(JSON.stringify(rolePermissions)));
        } catch (error) {
            console.error('Failed to save permissions:', error);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error(error.response?.data?.detail || 'Failed to save permissions');
        } finally{
            setSaving(false);
        }
    };
    const resetChanges = ()=>{
        setRolePermissions(JSON.parse(JSON.stringify(originalRolePermissions)));
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].info('Changes discarded');
    };
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-center py-12",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                    className: "w-6 h-6 animate-spin text-primary"
                }, void 0, false, {
                    fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                    lineNumber: 181,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "ml-2",
                    children: "Loading permission matrix..."
                }, void 0, false, {
                    fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                    lineNumber: 182,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
            lineNumber: 180,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-lg font-semibold text-gray-900 dark:text-white mb-2",
                        children: "Role Permissions Matrix"
                    }, void 0, false, {
                        fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                        lineNumber: 191,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-gray-600 dark:text-gray-400",
                        children: "Configure permissions for each role. Check the boxes to grant permissions."
                    }, void 0, false, {
                        fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                        lineNumber: 194,
                        columnNumber: 9
                    }, this),
                    !isAdmin && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-orange-600 dark:text-orange-400 mt-2",
                        children: "Only administrators can modify role permissions."
                    }, void 0, false, {
                        fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                        lineNumber: 198,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                lineNumber: 190,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-3 justify-end",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                        variant: "outline",
                        onClick: resetChanges,
                        disabled: !hasChanges() || saving || !isAdmin,
                        className: "gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__["RotateCcw"], {
                                className: "w-4 h-4"
                            }, void 0, false, {
                                fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                                lineNumber: 212,
                                columnNumber: 11
                            }, this),
                            "Discard Changes"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                        lineNumber: 206,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                        onClick: savePermissions,
                        disabled: !hasChanges() || saving || !isAdmin,
                        className: "gap-2 bg-blue-600 hover:bg-blue-700",
                        children: saving ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                    className: "w-4 h-4 animate-spin"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                                    lineNumber: 222,
                                    columnNumber: 15
                                }, this),
                                "Saving..."
                            ]
                        }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__["Save"], {
                                    className: "w-4 h-4"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                                    lineNumber: 227,
                                    columnNumber: 15
                                }, this),
                                "Save Changes"
                            ]
                        }, void 0, true)
                    }, void 0, false, {
                        fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                        lineNumber: 215,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                lineNumber: 205,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "overflow-x-auto",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                        className: "w-full text-sm border-collapse",
                        style: {
                            tableLayout: 'fixed'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    className: "bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            className: "px-3 py-3 text-left font-semibold text-gray-900 dark:text-white sticky left-0 bg-gray-50 dark:bg-gray-900 z-10",
                                            style: {
                                                width: '192px'
                                            },
                                            children: "Permission"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                                            lineNumber: 241,
                                            columnNumber: 17
                                        }, this),
                                        roles.map((role)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-2 py-3 text-center font-semibold text-gray-900 dark:text-white whitespace-nowrap align-middle",
                                                style: {
                                                    width: '120px'
                                                },
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "truncate text-xs",
                                                    title: role.name,
                                                    children: role.name
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                                                    lineNumber: 250,
                                                    columnNumber: 21
                                                }, this)
                                            }, role.id, false, {
                                                fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                                                lineNumber: 245,
                                                columnNumber: 19
                                            }, this))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                                    lineNumber: 240,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                                lineNumber: 239,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                children: Object.entries(permissionGroups).map(([groupName, permNames])=>{
                                    const groupPerms = permissions.filter((p)=>permNames.includes(p.name));
                                    if (groupPerms.length === 0) return null;
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                className: "bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    colSpan: roles.length + 1,
                                                    className: "px-3 py-2 text-sm font-bold text-blue-900 dark:text-blue-200 sticky left-0 bg-blue-50 dark:bg-blue-900/20 z-10",
                                                    children: groupName
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                                                lineNumber: 267,
                                                columnNumber: 21
                                            }, this),
                                            groupPerms.map((perm)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                    className: "border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            className: "px-3 py-3 text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 z-10 align-middle",
                                                            style: {
                                                                width: '192px'
                                                            },
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "font-medium text-xs truncate",
                                                                        title: perm.name,
                                                                        children: perm.name
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                                                                        lineNumber: 284,
                                                                        columnNumber: 29
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block truncate",
                                                                        title: perm.description || `${perm.action} ${perm.resource}`,
                                                                        children: perm.description || `${perm.action} ${perm.resource}`
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                                                                        lineNumber: 285,
                                                                        columnNumber: 29
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                                                                lineNumber: 283,
                                                                columnNumber: 27
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                                                            lineNumber: 282,
                                                            columnNumber: 25
                                                        }, this),
                                                        roles.map((role)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-2 py-3 text-center align-middle",
                                                                style: {
                                                                    width: '120px'
                                                                },
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "flex items-center justify-center h-full",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$checkbox$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Checkbox"], {
                                                                        checked: (rolePermissions[role.id] || []).includes(perm.id),
                                                                        onCheckedChange: ()=>togglePermission(role.id, perm.id),
                                                                        className: "w-4 h-4",
                                                                        disabled: saving || !isAdmin
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                                                                        lineNumber: 297,
                                                                        columnNumber: 31
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                                                                    lineNumber: 296,
                                                                    columnNumber: 29
                                                                }, this)
                                                            }, `${role.id}-${perm.id}`, false, {
                                                                fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                                                                lineNumber: 291,
                                                                columnNumber: 27
                                                            }, this))
                                                    ]
                                                }, perm.id, true, {
                                                    fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                                                    lineNumber: 278,
                                                    columnNumber: 23
                                                }, this))
                                        ]
                                    }, groupName, true, {
                                        fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                                        lineNumber: 265,
                                        columnNumber: 19
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                                lineNumber: 259,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                        lineNumber: 237,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                    lineNumber: 236,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                lineNumber: 235,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3",
                children: roles.map((role)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-xs font-semibold text-gray-900 dark:text-white mb-1 truncate",
                                title: role.name,
                                children: role.name
                            }, void 0, false, {
                                fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                                lineNumber: 325,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-xl font-bold text-blue-600 dark:text-blue-400",
                                children: (rolePermissions[role.id] || []).length
                            }, void 0, false, {
                                fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                                lineNumber: 328,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-xs text-gray-500 dark:text-gray-400 mt-1",
                                children: "assigned"
                            }, void 0, false, {
                                fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                                lineNumber: 331,
                                columnNumber: 13
                            }, this)
                        ]
                    }, role.id, true, {
                        fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                        lineNumber: 321,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                lineNumber: 319,
                columnNumber: 7
            }, this),
            hasChanges() && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-sm text-yellow-800 dark:text-yellow-200",
                    children: 'You have unsaved changes. Click "Save Changes" to apply them.'
                }, void 0, false, {
                    fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                    lineNumber: 341,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
                lineNumber: 340,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/components/settings/permission-matrix.tsx",
        lineNumber: 188,
        columnNumber: 5
    }, this);
}
_s(PermissionMatrix, "IL4ZetW5iLVPzBOzit8X8Kg4pX4=");
_c = PermissionMatrix;
var _c;
__turbopack_context__.k.register(_c, "PermissionMatrix");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>UsersTeamsPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/ui/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PlusCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-plus.js [app-client] (ecmascript) <export default as PlusCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user.js [app-client] (ecmascript) <export default as User>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/users.js [app-client] (ecmascript) <export default as Users>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/search.js [app-client] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pencil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Pencil$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/pencil.js [app-client] (ecmascript) <export default as Pencil>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trash-2.js [app-client] (ecmascript) <export default as Trash2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield.js [app-client] (ecmascript) <export default as Shield>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/plus.js [app-client] (ecmascript) <export default as Plus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/sonner/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$date$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/date-utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$layout$2f$sidebar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/layout/sidebar.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$roles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/api/roles.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/api/users.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$roles$2f$role$2d$assignment$2d$modal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/roles/role-assignment-modal.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$invitations$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/api/invitations.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$roles$2f$role$2d$filter$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/roles/role-filter.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$settings$2f$permission$2d$matrix$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/settings/permission-matrix.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/auth-context.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/api/index.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
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
;
;
;
;
;
function UsersTeamsPage() {
    _s();
    const params = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"])();
    const organisationId = params.uuid;
    const { user: currentUser } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('users');
    const [organisation, setOrganisation] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [users, setUsers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [roles, setRoles] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [permissions, setPermissions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [userRoles, setUserRoles] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [searchQuery, setSearchQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [projects, setProjects] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [userProjects, setUserProjects] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [selectedRoleFilters, setSelectedRoleFilters] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isCurrentUserAdmin, setIsCurrentUserAdmin] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Modal states
    const [showInviteModal, setShowInviteModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showProjectAssignModal, setShowProjectAssignModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showAssignRoleModal, setShowAssignRoleModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showCreateRoleModal, setShowCreateRoleModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [rolesView, setRolesView] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('list');
    const [showDeleteRoleDialog, setShowDeleteRoleDialog] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [roleToDelete, setRoleToDelete] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [deletingRoleId, setDeletingRoleId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Selected items
    const [selectedUser, setSelectedUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [selectedUserForProjects, setSelectedUserForProjects] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [roleModalEntity, setRoleModalEntity] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [selectedUserToAdd, setSelectedUserToAdd] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [showAddMemberSection, setShowAddMemberSection] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Form data
    const [userFormData, setUserFormData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        email: '',
        username: '',
        password: '',
        full_name: ''
    });
    const [roleFormData, setRoleFormData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        name: '',
        roleType: '',
        description: '',
        selectedPermissions: []
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "UsersTeamsPage.useEffect": ()=>{
            fetchData();
            fetchProjects();
            fetchPermissions();
        }
    }["UsersTeamsPage.useEffect"], [
        organisationId,
        activeTab
    ]);
    const fetchData = async ()=>{
        setLoading(true);
        try {
            // Fetch organization details
            const orgResponse = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`/api/v1/organisations/${organisationId}`);
            setOrganisation(orgResponse.data);
            // Determine if current user is admin
            const isAdmin = currentUser?.is_superuser || currentUser?.id === orgResponse.data.owner_id;
            setIsCurrentUserAdmin(isAdmin);
            // Fetch users
            const usersData = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listOrganisationUsers"])(organisationId);
            setUsers(usersData);
            // Fetch roles
            const rolesData = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$roles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listRoles"])(organisationId);
            setRoles(rolesData.roles);
            // Fetch user roles across all projects
            await fetchAllUserRoles(usersData);
            // Fetch user projects for each user
            if (usersData.length > 0) {
                fetchAllUserProjects(usersData);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error(error.message || 'Failed to load data');
        } finally{
            setLoading(false);
        }
    };
    const fetchAllUserRoles = async (usersList)=>{
        try {
            let allRoles = [];
            // Fetch roles for each project
            for (const project of projects){
                try {
                    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`/api/v1/roles/assignments/users`, {
                        params: {
                            project_id: project.id
                        }
                    });
                    if (response.data.assignments) {
                        allRoles = [
                            ...allRoles,
                            ...response.data.assignments
                        ];
                    }
                } catch (e) {
                // Project might not have any roles
                }
            }
            setUserRoles(allRoles);
        } catch (error) {
            console.error('Error fetching user roles:', error);
        }
    };
    const getUserRole = (user)=>{
        // If user is the organization owner, return "Owner"
        if (organisation && user.id === organisation.owner_id) {
            return 'Owner';
        }
        // Otherwise return "Member" (you can enhance this to fetch actual roles)
        return 'Member';
    };
    const fetchAllUserProjects = async (usersList)=>{
        try {
            const userProjectsMap = {};
            for (const user of usersList){
                const assignedProjects = [];
                for (const project of projects){
                    try {
                        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`/api/v1/projects/${project.id}/members`);
                        if (response.data.some((m)=>m.id === user.id)) {
                            assignedProjects.push(project);
                        }
                    } catch (e) {
                    // User not assigned to this project, skip
                    }
                }
                userProjectsMap[user.id] = assignedProjects;
            }
            setUserProjects(userProjectsMap);
        } catch (error) {
            console.error('Error fetching user projects:', error);
        }
    };
    const fetchUserProjects = async (userId)=>{
        try {
            const assignedProjects = [];
            for (const project of projects){
                try {
                    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`/api/v1/projects/${project.id}/members`);
                    if (response.data.some((m)=>m.id === userId)) {
                        assignedProjects.push(project);
                    }
                } catch (e) {
                // User not assigned to this project
                }
            }
            setUserProjects((prev)=>({
                    ...prev,
                    [userId]: assignedProjects
                }));
        } catch (error) {
            console.error('Failed to fetch user projects:', error);
        }
    };
    const fetchProjects = async ()=>{
        try {
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get('/api/v1/projects/', {
                params: {
                    organisation_id: organisationId
                }
            });
            console.log('Fetched projects:', response.data);
            setProjects(response.data);
        } catch (error) {
            console.error('Error fetching projects:', error);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error('Failed to fetch projects: ' + (error.response?.data?.detail || error.message));
        }
    };
    const fetchPermissions = async ()=>{
        try {
            const permissionsData = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$roles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listPermissions"])();
            setPermissions(permissionsData);
        } catch (error) {
            console.error('Error fetching permissions:', error);
        }
    };
    const handleInviteUser = async ()=>{
        if (!userFormData.email) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error('Email address is required');
            return;
        }
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$invitations$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createInvitation"])({
                email: userFormData.email,
                full_name: userFormData.full_name || undefined,
                organisation_id: organisationId,
                expiry_days: 7
            });
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].success(`Invitation sent to ${userFormData.email}`);
            setShowInviteModal(false);
            setUserFormData({
                email: '',
                username: '',
                password: '',
                full_name: ''
            });
            // Refresh data to show pending invitations
            fetchData();
        } catch (error) {
            console.error('Failed to send invitation:', error);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error(error.response?.data?.detail || 'Failed to send invitation');
        }
    };
    const openProjectAssignmentModal = (user)=>{
        setSelectedUserForProjects(user);
        setShowProjectAssignModal(true);
    };
    const handleAssignToProject = async (projectId)=>{
        if (!selectedUserForProjects) return;
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].post(`/api/v1/projects/${projectId}/members`, null, {
                params: {
                    user_id: selectedUserForProjects.id
                }
            });
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].success(`${selectedUserForProjects.username} assigned to project`);
            // Refresh user projects
            await fetchUserProjects(selectedUserForProjects.id);
        } catch (error) {
            console.error('Failed to assign user:', error);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error(error.response?.data?.detail || 'Failed to assign user');
        }
    };
    const handleRemoveFromProject = async (projectId)=>{
        if (!selectedUserForProjects) return;
        if (!confirm(`Remove ${selectedUserForProjects.username} from this project?`)) return;
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].delete(`/api/v1/projects/${projectId}/members/${selectedUserForProjects.id}`);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].success('User removed from project');
            // Refresh user projects
            await fetchUserProjects(selectedUserForProjects.id);
        } catch (error) {
            console.error('Failed to remove user:', error);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error(error.response?.data?.detail || 'Failed to remove user');
        }
    };
    const handleCreateRole = async ()=>{
        if (!roleFormData.name || !roleFormData.roleType) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error('Please fill in all required fields');
            return;
        }
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$roles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createRole"])(organisationId, roleFormData.name, roleFormData.roleType, roleFormData.description, roleFormData.selectedPermissions);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].success('Role created successfully');
            setShowCreateRoleModal(false);
            setRoleFormData({
                name: '',
                roleType: '',
                description: '',
                selectedPermissions: []
            });
            fetchData();
        } catch (error) {
            console.error('Failed to create role:', error);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error(error.response?.data?.detail || 'Failed to create role');
        }
    };
    const handleDeleteRole = async (role)=>{
        // Check if it's a system role
        if (role.is_system_role) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error('Cannot delete system roles');
            return;
        }
        setRoleToDelete(role);
        setShowDeleteRoleDialog(true);
    };
    const confirmDeleteRole = async ()=>{
        if (!roleToDelete) return;
        setDeletingRoleId(roleToDelete.id);
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$roles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deleteRole"])(roleToDelete.id);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].success(`Role "${roleToDelete.name}" deleted successfully`);
            setShowDeleteRoleDialog(false);
            setRoleToDelete(null);
            fetchData();
        } catch (error) {
            console.error('Failed to delete role:', error);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error(error.response?.data?.detail || 'Failed to delete role');
        } finally{
            setDeletingRoleId(null);
        }
    };
    const filteredUsers = users.filter((user)=>user.email.toLowerCase().includes(searchQuery.toLowerCase()) || user.username.toLowerCase().includes(searchQuery.toLowerCase()) || user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredRoles = roles.filter((role)=>role.name.toLowerCase().includes(searchQuery.toLowerCase()) || role.role_type.toLowerCase().includes(searchQuery.toLowerCase()) || role.description && role.description.toLowerCase().includes(searchQuery.toLowerCase()));
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex min-h-screen",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$layout$2f$sidebar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Sidebar"], {
                    organisationId: organisationId
                }, void 0, false, {
                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                    lineNumber: 374,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1 flex items-center justify-center bg-white",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-gray-500",
                            children: "Loading..."
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                            lineNumber: 377,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                        lineNumber: 376,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                    lineNumber: 375,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
            lineNumber: 373,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex min-h-screen bg-white",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$layout$2f$sidebar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Sidebar"], {
                organisationId: organisationId
            }, void 0, false, {
                fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                lineNumber: 386,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 p-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-4 mb-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-16 h-16 bg-primary rounded-2xl flex items-center justify-center flex-shrink-0",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__["Users"], {
                                    className: "w-8 h-8 text-white"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                    lineNumber: 390,
                                    columnNumber: 11
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                lineNumber: 389,
                                columnNumber: 9
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-4xl font-bold text-gray-900",
                                children: "Users & Teams"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                lineNumber: 392,
                                columnNumber: 9
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                        lineNumber: 388,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-lg text-gray-600 mb-8 mt-4",
                        children: "Manage user access, teams, and role assignments"
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                        lineNumber: 394,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-end mb-8",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex gap-2",
                            children: [
                                activeTab === 'users' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    onClick: ()=>setShowInviteModal(true),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PlusCircle$3e$__["PlusCircle"], {
                                            className: "mr-2 h-4 w-4"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                            lineNumber: 400,
                                            columnNumber: 15
                                        }, this),
                                        "Invite User"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                    lineNumber: 399,
                                    columnNumber: 13
                                }, this),
                                activeTab === 'roles' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    onClick: ()=>setShowCreateRoleModal(true),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"], {
                                            className: "mr-2 h-4 w-4"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                            lineNumber: 406,
                                            columnNumber: 15
                                        }, this),
                                        "Create Role"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                    lineNumber: 405,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                            lineNumber: 397,
                            columnNumber: 9
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                        lineNumber: 396,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "border-b border-gray-200 mb-6",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                            className: "-mb-px flex space-x-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setActiveTab('users'),
                                    className: `${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                                            className: "w-4 h-4"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                            lineNumber: 424,
                                            columnNumber: 13
                                        }, this),
                                        "Users (",
                                        users.length,
                                        ")"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                    lineNumber: 416,
                                    columnNumber: 11
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setActiveTab('roles'),
                                    className: `${activeTab === 'roles' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"], {
                                            className: "w-4 h-4"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                            lineNumber: 435,
                                            columnNumber: 13
                                        }, this),
                                        "Roles (",
                                        roles.length,
                                        ")"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                    lineNumber: 427,
                                    columnNumber: 11
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                            lineNumber: 415,
                            columnNumber: 9
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                        lineNumber: 414,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-6 flex gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "relative flex-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                        className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                        lineNumber: 444,
                                        columnNumber: 11
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        placeholder: `Search ${activeTab}...`,
                                        value: searchQuery,
                                        onChange: (e)=>setSearchQuery(e.target.value),
                                        className: "w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                        lineNumber: 445,
                                        columnNumber: 11
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                lineNumber: 443,
                                columnNumber: 9
                            }, this),
                            activeTab === 'users' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$roles$2f$role$2d$filter$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RoleFilter"], {
                                selectedRoles: selectedRoleFilters,
                                onRolesChange: setSelectedRoleFilters
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                lineNumber: 454,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                        lineNumber: 442,
                        columnNumber: 7
                    }, this),
                    activeTab === 'users' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "overflow-x-auto",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                className: "w-full text-sm text-left text-gray-500 dark:text-gray-400",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                        className: "text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    scope: "col",
                                                    className: "px-6 py-3",
                                                    children: "User"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                    lineNumber: 468,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    scope: "col",
                                                    className: "px-6 py-3",
                                                    children: "Role"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                    lineNumber: 469,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    scope: "col",
                                                    className: "px-6 py-3",
                                                    children: "Projects"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                    lineNumber: 470,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    scope: "col",
                                                    className: "px-6 py-3",
                                                    children: "Created"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                    lineNumber: 471,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    scope: "col",
                                                    className: "px-6 py-3 text-center",
                                                    children: "Actions"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                    lineNumber: 472,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                            lineNumber: 467,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                        lineNumber: 466,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                        children: filteredUsers.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                colSpan: 5,
                                                className: "px-6 py-8 text-center text-gray-500",
                                                children: "No users found. Invite users to get started."
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                lineNumber: 478,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                            lineNumber: 477,
                                            columnNumber: 19
                                        }, this) : filteredUsers.map((user)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                className: "bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-6 py-4",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex items-center",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "h-10 w-10 flex-shrink-0",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center",
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "text-sm font-semibold text-white",
                                                                            children: user.username.substring(0, 2).toUpperCase()
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                            lineNumber: 489,
                                                                            columnNumber: 31
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                        lineNumber: 488,
                                                                        columnNumber: 29
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                    lineNumber: 487,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "ml-4",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "text-sm font-medium text-gray-900 dark:text-white",
                                                                            children: user.full_name || user.username
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                            lineNumber: 495,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "text-sm text-gray-500 dark:text-gray-400",
                                                                            children: user.email
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                            lineNumber: 496,
                                                                            columnNumber: 29
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                    lineNumber: 494,
                                                                    columnNumber: 27
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                            lineNumber: 486,
                                                            columnNumber: 25
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                        lineNumber: 485,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-6 py-4",
                                                        children: userRoles.filter((ur)=>ur.user_id === user.id).length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex flex-wrap gap-1",
                                                            children: userRoles.filter((ur)=>ur.user_id === user.id).map((ur)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded",
                                                                    children: ur.role?.name || ur.role_name || 'Unknown Role'
                                                                }, ur.id, false, {
                                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                    lineNumber: 506,
                                                                    columnNumber: 33
                                                                }, this))
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                            lineNumber: 502,
                                                            columnNumber: 27
                                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sm text-gray-500 dark:text-gray-400",
                                                            children: "No roles"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                            lineNumber: 515,
                                                            columnNumber: 27
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                        lineNumber: 500,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-6 py-4",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "space-y-1",
                                                            children: [
                                                                (userProjects[user.id] || []).length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "flex flex-wrap gap-1",
                                                                    children: (userProjects[user.id] || []).map((project)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded",
                                                                            children: project.name
                                                                        }, project.id, false, {
                                                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                            lineNumber: 523,
                                                                            columnNumber: 33
                                                                        }, this))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                    lineNumber: 521,
                                                                    columnNumber: 29
                                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-sm text-gray-500 dark:text-gray-400",
                                                                    children: "No projects"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                    lineNumber: 532,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    onClick: ()=>openProjectAssignmentModal(user),
                                                                    className: "text-xs text-primary hover:underline flex items-center gap-1 mt-1",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                                                            className: "w-3 h-3"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                            lineNumber: 538,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        "Manage Projects"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                    lineNumber: 534,
                                                                    columnNumber: 27
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                            lineNumber: 519,
                                                            columnNumber: 25
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                        lineNumber: 518,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-6 py-4 text-sm text-gray-500",
                                                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$date$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatDateHumanReadable"])(user.created_at)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                        lineNumber: 543,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-6 py-4 flex justify-center items-center",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            onClick: ()=>{
                                                                setRoleModalEntity({
                                                                    type: 'user',
                                                                    id: user.id,
                                                                    name: user.full_name || user.username
                                                                });
                                                                setShowAssignRoleModal(true);
                                                            },
                                                            className: "flex items-center gap-1 px-3 py-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 transition-colors",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pencil$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Pencil$3e$__["Pencil"], {
                                                                    className: "w-4 h-4"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                    lineNumber: 558,
                                                                    columnNumber: 27
                                                                }, this),
                                                                "Edit Roles"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                            lineNumber: 547,
                                                            columnNumber: 25
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                        lineNumber: 546,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, user.id, true, {
                                                fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                lineNumber: 484,
                                                columnNumber: 21
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                        lineNumber: 475,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                lineNumber: 465,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                            lineNumber: 464,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                        lineNumber: 463,
                        columnNumber: 9
                    }, this),
                    activeTab === 'roles' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-6 flex gap-4 border-b border-gray-200 dark:border-gray-700",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setRolesView('list'),
                                        className: `py-3 px-4 text-sm font-medium border-b-2 transition-colors ${rolesView === 'list' ? 'border-primary text-primary' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`,
                                        children: "📋 Roles List"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                        lineNumber: 576,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setRolesView('matrix'),
                                        className: `py-3 px-4 text-sm font-medium border-b-2 transition-colors ${rolesView === 'matrix' ? 'border-primary text-primary' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`,
                                        children: "🔐 Permission Matrix"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                        lineNumber: 586,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                lineNumber: 575,
                                columnNumber: 11
                            }, this),
                            rolesView === 'list' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "overflow-x-auto",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                        className: "w-full text-sm text-left text-gray-500 dark:text-gray-400",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                className: "text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            scope: "col",
                                                            className: "px-6 py-3",
                                                            children: "Role Name"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                            lineNumber: 605,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            scope: "col",
                                                            className: "px-6 py-3",
                                                            children: "Type"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                            lineNumber: 606,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            scope: "col",
                                                            className: "px-6 py-3",
                                                            children: "Description"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                            lineNumber: 607,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            scope: "col",
                                                            className: "px-6 py-3",
                                                            children: "Status"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                            lineNumber: 608,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            scope: "col",
                                                            className: "px-6 py-3",
                                                            children: "System Role"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                            lineNumber: 609,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            scope: "col",
                                                            className: "px-6 py-3",
                                                            children: "Created"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                            lineNumber: 610,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            scope: "col",
                                                            className: "px-6 py-3",
                                                            children: "Actions"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                            lineNumber: 611,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                    lineNumber: 604,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                lineNumber: 603,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                children: filteredRoles.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        colSpan: 7,
                                                        className: "px-6 py-8 text-center text-gray-500",
                                                        children: [
                                                            "No roles found. ",
                                                            roles.length === 0 ? 'Initialize default roles or create a custom role to get started.' : 'Try adjusting your search.'
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                        lineNumber: 617,
                                                        columnNumber: 25
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                    lineNumber: 616,
                                                    columnNumber: 23
                                                }, this) : filteredRoles.map((role)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                        className: "bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-6 py-4",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "font-medium text-gray-900 dark:text-white",
                                                                    children: role.name
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                    lineNumber: 625,
                                                                    columnNumber: 29
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                lineNumber: 624,
                                                                columnNumber: 27
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-6 py-4",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800",
                                                                    children: role.role_type.replace(/_/g, ' ')
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                    lineNumber: 628,
                                                                    columnNumber: 29
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                lineNumber: 627,
                                                                columnNumber: 27
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-6 py-4",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate",
                                                                    children: role.description || '-'
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                    lineNumber: 633,
                                                                    columnNumber: 29
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                lineNumber: 632,
                                                                columnNumber: 27
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-6 py-4",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${role.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`,
                                                                    children: role.is_active ? 'Active' : 'Inactive'
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                    lineNumber: 638,
                                                                    columnNumber: 29
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                lineNumber: 637,
                                                                columnNumber: 27
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-6 py-4",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${role.is_system_role ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`,
                                                                    children: role.is_system_role ? 'System' : 'Custom'
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                    lineNumber: 645,
                                                                    columnNumber: 29
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                lineNumber: 644,
                                                                columnNumber: 27
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-6 py-4 text-sm text-gray-500",
                                                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$date$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatDateHumanReadable"])(role.created_at)
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                lineNumber: 651,
                                                                columnNumber: 27
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-6 py-4 text-sm",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    onClick: ()=>handleDeleteRole(role),
                                                                    disabled: role.is_system_role || deletingRoleId === role.id,
                                                                    className: "inline-flex items-center gap-2 text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors",
                                                                    title: role.is_system_role ? 'Cannot delete system roles' : 'Delete role',
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                                                            size: 16
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                            lineNumber: 661,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        deletingRoleId === role.id ? 'Deleting...' : 'Delete'
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                    lineNumber: 655,
                                                                    columnNumber: 29
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                lineNumber: 654,
                                                                columnNumber: 27
                                                            }, this)
                                                        ]
                                                    }, role.id, true, {
                                                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                        lineNumber: 623,
                                                        columnNumber: 25
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                lineNumber: 614,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                        lineNumber: 602,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                    lineNumber: 601,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                lineNumber: 600,
                                columnNumber: 13
                            }, this),
                            rolesView === 'matrix' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-8",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$settings$2f$permission$2d$matrix$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PermissionMatrix"], {
                                    organisationId: organisationId,
                                    isAdmin: isCurrentUserAdmin
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                    lineNumber: 677,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                lineNumber: 676,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                        lineNumber: 573,
                        columnNumber: 9
                    }, this),
                    showInviteModal && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-xl font-bold mb-4",
                                    children: "📧 Invite User"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                    lineNumber: 687,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-gray-500 dark:text-gray-400 mb-6",
                                    children: "Send an invitation email. The user will receive a welcome email with a link to create their account and join your organization."
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                    lineNumber: 688,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                                                    children: [
                                                        "Email Address ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-red-500",
                                                            children: "*"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                            lineNumber: 695,
                                                            columnNumber: 33
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                    lineNumber: 694,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "email",
                                                    value: userFormData.email,
                                                    onChange: (e)=>setUserFormData({
                                                            ...userFormData,
                                                            email: e.target.value
                                                        }),
                                                    className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                                                    placeholder: "user@example.com"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                    lineNumber: 697,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                            lineNumber: 693,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                                                    children: "Full Name (Optional)"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                    lineNumber: 707,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    value: userFormData.full_name,
                                                    onChange: (e)=>setUserFormData({
                                                            ...userFormData,
                                                            full_name: e.target.value
                                                        }),
                                                    className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                                                    placeholder: "John Doe"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                    lineNumber: 710,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs text-gray-500 dark:text-gray-400 mt-1",
                                                    children: "This will be pre-filled in the invitation email"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                    lineNumber: 717,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                            lineNumber: 706,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs text-blue-700 dark:text-blue-300",
                                                children: [
                                                    "💡 The invitation will expire in ",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        children: "7 days"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                        lineNumber: 724,
                                                        columnNumber: 52
                                                    }, this),
                                                    ". The user will choose their username and password when they accept the invitation."
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                lineNumber: 723,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                            lineNumber: 722,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                    lineNumber: 692,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex justify-end gap-2 mt-6",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                            variant: "outline",
                                            onClick: ()=>{
                                                setShowInviteModal(false);
                                                setUserFormData({
                                                    email: '',
                                                    username: '',
                                                    password: '',
                                                    full_name: ''
                                                });
                                            },
                                            children: "Cancel"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                            lineNumber: 730,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                            onClick: handleInviteUser,
                                            disabled: !userFormData.email,
                                            children: "Send Invitation"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                            lineNumber: 739,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                    lineNumber: 729,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                            lineNumber: 686,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                        lineNumber: 685,
                        columnNumber: 9
                    }, this),
                    showCreateRoleModal && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-xl font-bold mb-4",
                                    children: "Create Custom Role"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                    lineNumber: 754,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-gray-500 dark:text-gray-400 mb-6",
                                    children: "Create a custom role with specific permissions for your organization."
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                    lineNumber: 755,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                                                    children: [
                                                        "Role Name ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-red-500",
                                                            children: "*"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                            lineNumber: 762,
                                                            columnNumber: 29
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                    lineNumber: 761,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    value: roleFormData.name,
                                                    onChange: (e)=>setRoleFormData({
                                                            ...roleFormData,
                                                            name: e.target.value
                                                        }),
                                                    className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                                                    placeholder: "e.g., QA Lead"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                    lineNumber: 764,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                            lineNumber: 760,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                                                    children: [
                                                        "Role Type ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-red-500",
                                                            children: "*"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                            lineNumber: 775,
                                                            columnNumber: 29
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                    lineNumber: 774,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    value: roleFormData.roleType,
                                                    onChange: (e)=>setRoleFormData({
                                                            ...roleFormData,
                                                            roleType: e.target.value
                                                        }),
                                                    className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                                                    placeholder: "e.g., qa_lead (lowercase, underscores)"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                    lineNumber: 777,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs text-gray-500 dark:text-gray-400 mt-1",
                                                    children: "Use lowercase letters and underscores only (e.g., qa_lead, senior_qa_engineer)"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                    lineNumber: 784,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                            lineNumber: 773,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                                                    children: "Description"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                    lineNumber: 790,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                    value: roleFormData.description,
                                                    onChange: (e)=>setRoleFormData({
                                                            ...roleFormData,
                                                            description: e.target.value
                                                        }),
                                                    className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                                                    rows: 3,
                                                    placeholder: "Describe the responsibilities and access level of this role..."
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                    lineNumber: 793,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                            lineNumber: 789,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2",
                                                    children: "Permissions (Optional)"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                    lineNumber: 803,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs text-gray-500 dark:text-gray-400 mb-3",
                                                    children: "Select permissions by module. Each module has READ, WRITE, EXECUTE, and MANAGE permission levels."
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                    lineNumber: 806,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "border border-gray-300 dark:border-gray-600 rounded-md p-4 max-h-96 overflow-y-auto",
                                                    children: permissions.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-sm text-gray-500 text-center py-4",
                                                        children: "No permissions available. Run the module permissions initialization script first."
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                        lineNumber: 811,
                                                        columnNumber: 21
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "space-y-4",
                                                        children: (()=>{
                                                            // Group permissions by module
                                                            const moduleGroups = permissions.reduce((acc, permission)=>{
                                                                const module = permission.resource;
                                                                if (!acc[module]) {
                                                                    acc[module] = [];
                                                                }
                                                                acc[module].push(permission);
                                                                return acc;
                                                            }, {});
                                                            // Module display names and icons
                                                            const moduleConfig = {
                                                                automation_hub: {
                                                                    name: 'Automation Hub',
                                                                    icon: '🤖',
                                                                    color: 'blue'
                                                                },
                                                                api_testing: {
                                                                    name: 'API Testing',
                                                                    icon: '🔌',
                                                                    color: 'green'
                                                                },
                                                                test_management: {
                                                                    name: 'Test Management',
                                                                    icon: '📋',
                                                                    color: 'purple'
                                                                },
                                                                security_testing: {
                                                                    name: 'Security Testing',
                                                                    icon: '🔒',
                                                                    color: 'red'
                                                                },
                                                                performance_testing: {
                                                                    name: 'Performance Testing',
                                                                    icon: '⚡',
                                                                    color: 'yellow'
                                                                },
                                                                mobile_testing: {
                                                                    name: 'Mobile Testing',
                                                                    icon: '📱',
                                                                    color: 'indigo'
                                                                }
                                                            };
                                                            // Sort modules
                                                            const sortedModules = Object.keys(moduleGroups).sort((a, b)=>{
                                                                const order = [
                                                                    'automation_hub',
                                                                    'api_testing',
                                                                    'test_management',
                                                                    'security_testing',
                                                                    'performance_testing',
                                                                    'mobile_testing'
                                                                ];
                                                                return order.indexOf(a) - order.indexOf(b);
                                                            });
                                                            return sortedModules.map((module)=>{
                                                                const config = moduleConfig[module] || {
                                                                    name: module,
                                                                    icon: '📦',
                                                                    color: 'gray'
                                                                };
                                                                const modulePerms = moduleGroups[module].sort((a, b)=>{
                                                                    const order = [
                                                                        'read',
                                                                        'write',
                                                                        'execute',
                                                                        'manage'
                                                                    ];
                                                                    return order.indexOf(a.action) - order.indexOf(b.action);
                                                                });
                                                                const colorClasses = {
                                                                    blue: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
                                                                    green: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
                                                                    purple: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800',
                                                                    red: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
                                                                    yellow: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
                                                                    indigo: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800',
                                                                    gray: 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800'
                                                                };
                                                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: `border rounded-lg p-3 ${colorClasses[config.color]}`,
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "flex items-center gap-2 mb-3",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                    className: "text-xl",
                                                                                    children: config.icon
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                                    lineNumber: 863,
                                                                                    columnNumber: 33
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                                                    className: "text-sm font-semibold text-gray-900 dark:text-white",
                                                                                    children: config.name
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                                    lineNumber: 864,
                                                                                    columnNumber: 33
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                    className: "ml-auto text-xs text-gray-500 dark:text-gray-400",
                                                                                    children: [
                                                                                        modulePerms.filter((p)=>roleFormData.selectedPermissions.includes(p.id)).length,
                                                                                        "/",
                                                                                        modulePerms.length,
                                                                                        " selected"
                                                                                    ]
                                                                                }, void 0, true, {
                                                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                                    lineNumber: 867,
                                                                                    columnNumber: 33
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                            lineNumber: 862,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "space-y-2",
                                                                            children: modulePerms.map((permission)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                                    className: "flex items-start gap-2 p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded cursor-pointer",
                                                                                    children: [
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                            type: "checkbox",
                                                                                            checked: roleFormData.selectedPermissions.includes(permission.id),
                                                                                            onChange: (e)=>{
                                                                                                if (e.target.checked) {
                                                                                                    setRoleFormData({
                                                                                                        ...roleFormData,
                                                                                                        selectedPermissions: [
                                                                                                            ...roleFormData.selectedPermissions,
                                                                                                            permission.id
                                                                                                        ]
                                                                                                    });
                                                                                                } else {
                                                                                                    setRoleFormData({
                                                                                                        ...roleFormData,
                                                                                                        selectedPermissions: roleFormData.selectedPermissions.filter((id)=>id !== permission.id)
                                                                                                    });
                                                                                                }
                                                                                            },
                                                                                            className: "mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                                            lineNumber: 877,
                                                                                            columnNumber: 37
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                            className: "flex-1 min-w-0",
                                                                                            children: [
                                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                    className: "text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2",
                                                                                                    children: [
                                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                                            className: "uppercase text-xs px-2 py-0.5 bg-white dark:bg-gray-700 rounded font-semibold",
                                                                                                            children: permission.action
                                                                                                        }, void 0, false, {
                                                                                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                                                            lineNumber: 897,
                                                                                                            columnNumber: 41
                                                                                                        }, this),
                                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                                            className: "truncate text-xs",
                                                                                                            children: permission.name
                                                                                                        }, void 0, false, {
                                                                                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                                                            lineNumber: 900,
                                                                                                            columnNumber: 41
                                                                                                        }, this)
                                                                                                    ]
                                                                                                }, void 0, true, {
                                                                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                                                    lineNumber: 896,
                                                                                                    columnNumber: 39
                                                                                                }, this),
                                                                                                permission.description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                    className: "text-xs text-gray-600 dark:text-gray-400 mt-1",
                                                                                                    children: permission.description
                                                                                                }, void 0, false, {
                                                                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                                                    lineNumber: 903,
                                                                                                    columnNumber: 41
                                                                                                }, this)
                                                                                            ]
                                                                                        }, void 0, true, {
                                                                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                                            lineNumber: 895,
                                                                                            columnNumber: 37
                                                                                        }, this)
                                                                                    ]
                                                                                }, permission.id, true, {
                                                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                                    lineNumber: 873,
                                                                                    columnNumber: 35
                                                                                }, this))
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                            lineNumber: 871,
                                                                            columnNumber: 31
                                                                        }, this)
                                                                    ]
                                                                }, module, true, {
                                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                    lineNumber: 861,
                                                                    columnNumber: 29
                                                                }, this);
                                                            });
                                                        })()
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                        lineNumber: 815,
                                                        columnNumber: 21
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                    lineNumber: 809,
                                                    columnNumber: 17
                                                }, this),
                                                roleFormData.selectedPermissions.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-sm text-gray-600 dark:text-gray-400 mt-2",
                                                    children: [
                                                        "✅ ",
                                                        roleFormData.selectedPermissions.length,
                                                        " permission(s) selected across ",
                                                        new Set(permissions.filter((p)=>roleFormData.selectedPermissions.includes(p.id)).map((p)=>p.resource)).size,
                                                        " module(s)"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                    lineNumber: 919,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                            lineNumber: 802,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                    lineNumber: 759,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex justify-end gap-2 mt-6",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                            variant: "outline",
                                            onClick: ()=>{
                                                setShowCreateRoleModal(false);
                                                setRoleFormData({
                                                    name: '',
                                                    roleType: '',
                                                    description: '',
                                                    selectedPermissions: []
                                                });
                                            },
                                            children: "Cancel"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                            lineNumber: 929,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                            onClick: handleCreateRole,
                                            disabled: !roleFormData.name || !roleFormData.roleType,
                                            children: "Create Role"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                            lineNumber: 938,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                    lineNumber: 928,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                            lineNumber: 753,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                        lineNumber: 752,
                        columnNumber: 9
                    }, this),
                    showProjectAssignModal && selectedUserForProjects && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-between mb-4",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                className: "text-xl font-bold text-gray-900 dark:text-white",
                                                children: [
                                                    "Manage Projects for ",
                                                    selectedUserForProjects.full_name || selectedUserForProjects.username
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                lineNumber: 955,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-sm text-gray-500 dark:text-gray-400 mt-1",
                                                children: "Assign or remove this user from projects in your organization"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                lineNumber: 958,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                        lineNumber: 954,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                    lineNumber: 953,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-3",
                                    children: projects.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-center py-12 text-gray-500",
                                        children: "No projects available. Create a project first."
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                        lineNumber: 966,
                                        columnNumber: 17
                                    }, this) : projects.map((project)=>{
                                        const isAssigned = (userProjects[selectedUserForProjects.id] || []).some((p)=>p.id === project.id);
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: `flex items-center justify-between p-4 border rounded-lg transition-colors ${isAssigned ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex-1",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex items-center gap-2",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "font-medium text-gray-900 dark:text-white",
                                                                    children: project.name
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                    lineNumber: 985,
                                                                    columnNumber: 27
                                                                }, this),
                                                                isAssigned && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 rounded-full",
                                                                    children: "Assigned"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                                    lineNumber: 989,
                                                                    columnNumber: 29
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                            lineNumber: 984,
                                                            columnNumber: 25
                                                        }, this),
                                                        project.description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-sm text-gray-500 dark:text-gray-400 mt-1",
                                                            children: project.description
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                            lineNumber: 995,
                                                            columnNumber: 27
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                    lineNumber: 983,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "ml-4",
                                                    children: isAssigned ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>handleRemoveFromProject(project.id),
                                                        className: "px-4 py-2 text-sm bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors font-medium",
                                                        children: "Remove"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                        lineNumber: 1003,
                                                        columnNumber: 27
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>handleAssignToProject(project.id),
                                                        className: "px-4 py-2 text-sm bg-primary text-white rounded-lg hover:opacity-90 transition-opacity font-medium",
                                                        children: "Assign"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                        lineNumber: 1010,
                                                        columnNumber: 27
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                    lineNumber: 1001,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, project.id, true, {
                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                            lineNumber: 975,
                                            columnNumber: 21
                                        }, this);
                                    })
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                    lineNumber: 964,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-sm text-gray-500 dark:text-gray-400",
                                            children: [
                                                (userProjects[selectedUserForProjects.id] || []).length,
                                                " of ",
                                                projects.length,
                                                " projects assigned"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                            lineNumber: 1025,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>{
                                                setShowProjectAssignModal(false);
                                                setSelectedUserForProjects(null);
                                            },
                                            className: "px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                                            children: "Close"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                            lineNumber: 1028,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                    lineNumber: 1024,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                            lineNumber: 952,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                        lineNumber: 951,
                        columnNumber: 9
                    }, this),
                    showAssignRoleModal && roleModalEntity && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$roles$2f$role$2d$assignment$2d$modal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RoleAssignmentModal"], {
                        isOpen: showAssignRoleModal,
                        onClose: ()=>{
                            setShowAssignRoleModal(false);
                            setRoleModalEntity(null);
                            fetchData(); // Refresh data after role changes
                        },
                        organisationId: organisationId,
                        entityType: roleModalEntity.type,
                        entityId: roleModalEntity.id,
                        entityName: roleModalEntity.name,
                        availableProjects: projects
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                        lineNumber: 1044,
                        columnNumber: 9
                    }, this),
                    showDeleteRoleDialog && roleToDelete && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-3 mb-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                                className: "h-6 w-6 text-red-600 dark:text-red-400"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                lineNumber: 1065,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                            lineNumber: 1064,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "text-lg font-medium text-gray-900 dark:text-white",
                                                children: "Delete Role"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                lineNumber: 1068,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                            lineNumber: 1067,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                    lineNumber: 1063,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-gray-600 dark:text-gray-400 mb-6",
                                    children: [
                                        "Are you sure you want to delete the role ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: roleToDelete.name
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                            lineNumber: 1072,
                                            columnNumber: 56
                                        }, this),
                                        "? This action cannot be undone."
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                    lineNumber: 1071,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex gap-3 justify-end",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>{
                                                setShowDeleteRoleDialog(false);
                                                setRoleToDelete(null);
                                            },
                                            disabled: deletingRoleId !== null,
                                            className: "px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
                                            children: "Cancel"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                            lineNumber: 1075,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: confirmDeleteRole,
                                            disabled: deletingRoleId !== null,
                                            className: "px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2",
                                            children: deletingRoleId === roleToDelete.id ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "animate-spin",
                                                        children: "⏳"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                        lineNumber: 1092,
                                                        columnNumber: 21
                                                    }, this),
                                                    "Deleting..."
                                                ]
                                            }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                                        size: 16
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                                        lineNumber: 1097,
                                                        columnNumber: 21
                                                    }, this),
                                                    "Delete Role"
                                                ]
                                            }, void 0, true)
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                            lineNumber: 1085,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                                    lineNumber: 1074,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                            lineNumber: 1062,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                        lineNumber: 1061,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
                lineNumber: 387,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/app/organizations/[uuid]/users-teams/page.tsx",
        lineNumber: 385,
        columnNumber: 5
    }, this);
}
_s(UsersTeamsPage, "cPJ5Kp1J6XzrJJvsZyyhWFcDM5k=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = UsersTeamsPage;
var _c;
__turbopack_context__.k.register(_c, "UsersTeamsPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=frontend_9a35c80f._.js.map