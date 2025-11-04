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
        invitation_token: token,
        ...data
    });
    return response.data;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/components/ui/Logo.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/styled-components/dist/styled-components.browser.esm.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
const SvgContainer = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].div`
  width: 100%;
  max-width: 600px;
  height: 200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
`;
_c = SvgContainer;
// Magnifying glass searches across the screen smoothly
// Logo group is at (250, 120), bugs are at absolute positions
// Bug 1: (200, 70) -> relative (-50, -50)
// Bug 2: (420, 140) -> relative (170, 20)
// Bug 3: (620, 85) -> relative (370, -35)
const searchAnimation = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keyframes"]`
  0% {
    transform: translate(-200px, -100px) scale(0.8) rotate(-25deg);
  }
  15% {
    transform: translate(-50px, -50px) rotate(-8deg) scale(1);
  }
  35% {
    transform: translate(170px, 20px) rotate(12deg) scale(1.05);
  }
  60% {
    transform: translate(370px, -35px) rotate(-12deg) scale(1);
  }
  80% {
    transform: translate(105px, -30px) rotate(0deg) scale(0.88);
  }
  100% {
    transform: translate(105px, -30px) rotate(0deg) scale(0.88);
  }
`;
// Bug pulse when detected
const bugDetectedAnimation = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keyframes"]`
  0% { opacity: 1; transform: scale(1) rotate(0deg); }
  20% { opacity: 1; transform: scale(1.3) rotate(10deg); }
  40% { opacity: 1; transform: scale(1.5) rotate(-10deg); }
  60% { opacity: 0.7; transform: scale(1.8) rotate(20deg); }
  80% { opacity: 0.3; transform: scale(2.2) rotate(-15deg); }
  100% { opacity: 0; transform: scale(2.8) rotate(30deg); }
`;
// Success checkmark draws itself then fades
const checkmarkDraw = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keyframes"]`
  0% { stroke-dashoffset: 100; opacity: 0; }
  15% { opacity: 1; }
  40% { stroke-dashoffset: 0; opacity: 1; }
  85% { opacity: 1; }
  100% { stroke-dashoffset: 0; opacity: 0; }
`;
// Success circle appears then fades
const successCircleAppear = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keyframes"]`
  0% { opacity: 0; transform: scale(0); }
  20% { opacity: 1; transform: scale(1.2); }
  30% { transform: scale(0.9); }
  40% { opacity: 1; transform: scale(1); }
  85% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.7); }
`;
// Sparkle particles burst out
const sparkleAnimation = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keyframes"]`
  0% { opacity: 0; transform: translate(0, 0) scale(0); }
  30% { opacity: 1; transform: translate(var(--tx), var(--ty)) scale(1.2); }
  100% { opacity: 0; transform: translate(calc(var(--tx) * 1.8), calc(var(--ty) * 1.8)) scale(0); }
`;
// Radiating lines
const radiateAnimation = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keyframes"]`
  0% { opacity: 0; transform: scale(0.5) rotate(0deg); }
  40% { opacity: 0.9; }
  100% { opacity: 0; transform: scale(1.8) rotate(180deg); }
`;
// Yellow detection pulse
const detectPulseAnimation = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keyframes"]`
  0%, 100% { opacity: 0; transform: scale(0.8); }
  50% { opacity: 0.7; transform: scale(1.2); }
`;
// Text appears
const textAppearAnimation = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["keyframes"]`
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
`;
const MagnifyingGlass = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].g`
  transform: translate(-200px, -100px) scale(0.8) rotate(-25deg);
  animation: ${searchAnimation} 6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  will-change: transform;
`;
_c1 = MagnifyingGlass;
const BugIcon = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].g`
  opacity: 1;

  ${(props)=>props.$detected && __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["css"]`
    animation: ${bugDetectedAnimation} 1s ease-out forwards;
  `}
`;
_c2 = BugIcon;
const DetectionPulse = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].circle`
  opacity: 0;
  ${(props)=>props.$show && __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["css"]`
    animation: ${detectPulseAnimation} 0.6s ease-out infinite;
  `}
`;
_c3 = DetectionPulse;
const SuccessCircle = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].circle`
  opacity: 0;
  ${(props)=>props.$show && __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["css"]`
    animation: ${successCircleAppear} 1.8s ease-out forwards;
  `}
`;
_c4 = SuccessCircle;
const SuccessCheckmark = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].path`
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  opacity: 0;
  ${(props)=>props.$show && __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["css"]`
    animation: ${checkmarkDraw} 1.8s ease-out forwards;
    animation-delay: 0.2s;
  `}
`;
_c5 = SuccessCheckmark;
const Sparkle = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].circle`
  opacity: 0;
  ${(props)=>props.$show && __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["css"]`
    animation: ${sparkleAnimation} 1s ease-out forwards;
    animation-delay: ${props.$delay}s;
  `}
`;
_c6 = Sparkle;
const RadiateLines = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].g`
  opacity: 0;
  ${(props)=>props.$show && __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["css"]`
    animation: ${radiateAnimation} 1.2s ease-out forwards;
    animation-delay: 0.1s;
  `}
`;
_c7 = RadiateLines;
const AnimatedText = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].text`
  font-family: Inter, Poppins, Montserrat, Segoe UI, Roboto, system-ui, -apple-system, Arial, sans-serif;
  font-size: 84px;
  font-weight: 600;
  fill: ${(props)=>props.$variant === 'dark' ? '#1F2937' : '#E0F2FE'};
  letter-spacing: 0.5px;
  opacity: 0;
  filter: ${(props)=>props.$variant === 'dark' ? 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1))' : 'drop-shadow(0 4px 12px rgba(6, 182, 212, 0.3))'};
  ${(props)=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$components$2f$dist$2f$styled$2d$components$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["css"]`
    animation: ${textAppearAnimation} 0.6s ease-out forwards;
    animation-delay: ${props.$delay}s;
  `}
`;
_c8 = AnimatedText;
// Bug SVG component
const Bug = ({ x, y, detected })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(BugIcon, {
        transform: `translate(${x}, ${y})`,
        $detected: detected,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ellipse", {
                cx: "0",
                cy: "0",
                rx: "10",
                ry: "14",
                fill: "#DC2626",
                stroke: "#991B1B",
                strokeWidth: "1.5"
            }, void 0, false, {
                fileName: "[project]/frontend/components/ui/Logo.tsx",
                lineNumber: 184,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "0",
                cy: "-12",
                r: "6",
                fill: "#DC2626",
                stroke: "#991B1B",
                strokeWidth: "1.5"
            }, void 0, false, {
                fileName: "[project]/frontend/components/ui/Logo.tsx",
                lineNumber: 187,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                x1: "-2.5",
                y1: "-16",
                x2: "-5",
                y2: "-22",
                stroke: "#991B1B",
                strokeWidth: "2",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/frontend/components/ui/Logo.tsx",
                lineNumber: 190,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                x1: "2.5",
                y1: "-16",
                x2: "5",
                y2: "-22",
                stroke: "#991B1B",
                strokeWidth: "2",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/frontend/components/ui/Logo.tsx",
                lineNumber: 191,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                x1: "-10",
                y1: "-5",
                x2: "-17",
                y2: "-8",
                stroke: "#991B1B",
                strokeWidth: "2",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/frontend/components/ui/Logo.tsx",
                lineNumber: 194,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                x1: "-10",
                y1: "0",
                x2: "-18",
                y2: "0",
                stroke: "#991B1B",
                strokeWidth: "2",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/frontend/components/ui/Logo.tsx",
                lineNumber: 195,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                x1: "-10",
                y1: "5",
                x2: "-17",
                y2: "8",
                stroke: "#991B1B",
                strokeWidth: "2",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/frontend/components/ui/Logo.tsx",
                lineNumber: 196,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                x1: "10",
                y1: "-5",
                x2: "17",
                y2: "-8",
                stroke: "#991B1B",
                strokeWidth: "2",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/frontend/components/ui/Logo.tsx",
                lineNumber: 199,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                x1: "10",
                y1: "0",
                x2: "18",
                y2: "0",
                stroke: "#991B1B",
                strokeWidth: "2",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/frontend/components/ui/Logo.tsx",
                lineNumber: 200,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                x1: "10",
                y1: "5",
                x2: "17",
                y2: "8",
                stroke: "#991B1B",
                strokeWidth: "2",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/frontend/components/ui/Logo.tsx",
                lineNumber: 201,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                x1: "0",
                y1: "-7",
                x2: "0",
                y2: "10",
                stroke: "#991B1B",
                strokeWidth: "1.5",
                opacity: "0.5"
            }, void 0, false, {
                fileName: "[project]/frontend/components/ui/Logo.tsx",
                lineNumber: 204,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/components/ui/Logo.tsx",
        lineNumber: 182,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
_c9 = Bug;
const Logo = ({ variant = 'light' })=>{
    _s();
    const [bugs, setBugs] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useState([
        {
            id: 1,
            cx: 200,
            cy: 70,
            detected: false
        },
        {
            id: 2,
            cx: 420,
            cy: 140,
            detected: false
        },
        {
            id: 3,
            cx: 620,
            cy: 85,
            detected: false
        }
    ]);
    const [currentDetection, setCurrentDetection] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useState(null);
    const [successIndicators, setSuccessIndicators] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useState([]);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useEffect({
        "Logo.useEffect": ()=>{
            // Bug 1 detection (15% of 6s = 0.9s)
            const bug1DetectTimer = setTimeout({
                "Logo.useEffect.bug1DetectTimer": ()=>{
                    setCurrentDetection(1);
                }
            }["Logo.useEffect.bug1DetectTimer"], 900);
            const bug1RemoveTimer = setTimeout({
                "Logo.useEffect.bug1RemoveTimer": ()=>{
                    setBugs({
                        "Logo.useEffect.bug1RemoveTimer": (prev)=>prev.map({
                                "Logo.useEffect.bug1RemoveTimer": (b)=>b.id === 1 ? {
                                        ...b,
                                        detected: true
                                    } : b
                            }["Logo.useEffect.bug1RemoveTimer"])
                    }["Logo.useEffect.bug1RemoveTimer"]);
                    setSuccessIndicators({
                        "Logo.useEffect.bug1RemoveTimer": (prev)=>[
                                ...prev,
                                {
                                    id: 1,
                                    x: 200,
                                    y: 70,
                                    show: true
                                }
                            ]
                    }["Logo.useEffect.bug1RemoveTimer"]);
                    setCurrentDetection(null);
                }
            }["Logo.useEffect.bug1RemoveTimer"], 1400);
            // Bug 2 detection (35% of 6s = 2.1s)
            const bug2DetectTimer = setTimeout({
                "Logo.useEffect.bug2DetectTimer": ()=>{
                    setCurrentDetection(2);
                }
            }["Logo.useEffect.bug2DetectTimer"], 2100);
            const bug2RemoveTimer = setTimeout({
                "Logo.useEffect.bug2RemoveTimer": ()=>{
                    setBugs({
                        "Logo.useEffect.bug2RemoveTimer": (prev)=>prev.map({
                                "Logo.useEffect.bug2RemoveTimer": (b)=>b.id === 2 ? {
                                        ...b,
                                        detected: true
                                    } : b
                            }["Logo.useEffect.bug2RemoveTimer"])
                    }["Logo.useEffect.bug2RemoveTimer"]);
                    setSuccessIndicators({
                        "Logo.useEffect.bug2RemoveTimer": (prev)=>[
                                ...prev,
                                {
                                    id: 2,
                                    x: 420,
                                    y: 140,
                                    show: true
                                }
                            ]
                    }["Logo.useEffect.bug2RemoveTimer"]);
                    setCurrentDetection(null);
                }
            }["Logo.useEffect.bug2RemoveTimer"], 2600);
            // Bug 3 detection (60% of 6s = 3.6s)
            const bug3DetectTimer = setTimeout({
                "Logo.useEffect.bug3DetectTimer": ()=>{
                    setCurrentDetection(3);
                }
            }["Logo.useEffect.bug3DetectTimer"], 3600);
            const bug3RemoveTimer = setTimeout({
                "Logo.useEffect.bug3RemoveTimer": ()=>{
                    setBugs({
                        "Logo.useEffect.bug3RemoveTimer": (prev)=>prev.map({
                                "Logo.useEffect.bug3RemoveTimer": (b)=>b.id === 3 ? {
                                        ...b,
                                        detected: true
                                    } : b
                            }["Logo.useEffect.bug3RemoveTimer"])
                    }["Logo.useEffect.bug3RemoveTimer"]);
                    setSuccessIndicators({
                        "Logo.useEffect.bug3RemoveTimer": (prev)=>[
                                ...prev,
                                {
                                    id: 3,
                                    x: 620,
                                    y: 85,
                                    show: true
                                }
                            ]
                    }["Logo.useEffect.bug3RemoveTimer"]);
                    setCurrentDetection(null);
                }
            }["Logo.useEffect.bug3RemoveTimer"], 4100);
            // Clear all success indicators
            const clearSuccessTimer = setTimeout({
                "Logo.useEffect.clearSuccessTimer": ()=>{
                    setSuccessIndicators([]);
                }
            }["Logo.useEffect.clearSuccessTimer"], 5500);
            return ({
                "Logo.useEffect": ()=>{
                    clearTimeout(bug1DetectTimer);
                    clearTimeout(bug1RemoveTimer);
                    clearTimeout(bug2DetectTimer);
                    clearTimeout(bug2RemoveTimer);
                    clearTimeout(bug3DetectTimer);
                    clearTimeout(bug3RemoveTimer);
                    clearTimeout(clearSuccessTimer);
                }
            })["Logo.useEffect"];
        }
    }["Logo.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SvgContainer, {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            width: "100%",
            height: "100%",
            viewBox: "-50 -20 1000 240",
            preserveAspectRatio: "xMidYMid meet",
            fill: "none",
            xmlns: "http://www.w3.org/2000/svg",
            role: "img",
            "aria-label": "CogniTest logo with magnifying glass O",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("defs", {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("linearGradient", {
                            id: "lensGradient",
                            x1: "0",
                            y1: "0",
                            x2: "1",
                            y2: "1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                    offset: "0%",
                                    stopColor: "#A7DDD4"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/components/ui/Logo.tsx",
                                    lineNumber: 285,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                    offset: "100%",
                                    stopColor: "#56B7AB"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/components/ui/Logo.tsx",
                                    lineNumber: 286,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/components/ui/Logo.tsx",
                            lineNumber: 284,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("radialGradient", {
                            id: "lensHighlight",
                            cx: "30%",
                            cy: "30%",
                            r: "70%",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                    offset: "0%",
                                    stopColor: "rgba(255,255,255,0.6)"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/components/ui/Logo.tsx",
                                    lineNumber: 289,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                    offset: "60%",
                                    stopColor: "rgba(255,255,255,0.2)"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/components/ui/Logo.tsx",
                                    lineNumber: 290,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                    offset: "100%",
                                    stopColor: "rgba(255,255,255,0)"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/components/ui/Logo.tsx",
                                    lineNumber: 291,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/components/ui/Logo.tsx",
                            lineNumber: 288,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("clipPath", {
                            id: "lensClip",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                cx: "0",
                                cy: "0",
                                r: "28"
                            }, void 0, false, {
                                fileName: "[project]/frontend/components/ui/Logo.tsx",
                                lineNumber: 294,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/frontend/components/ui/Logo.tsx",
                            lineNumber: 293,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/components/ui/Logo.tsx",
                    lineNumber: 283,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                successIndicators.map((indicator)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                        transform: `translate(${indicator.x}, ${indicator.y})`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(RadiateLines, {
                                $show: indicator.show,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                        x1: "0",
                                        y1: "-28",
                                        x2: "0",
                                        y2: "-40",
                                        stroke: "#22C55E",
                                        strokeWidth: "2.5",
                                        strokeLinecap: "round"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/components/ui/Logo.tsx",
                                        lineNumber: 302,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                        x1: "20",
                                        y1: "-20",
                                        x2: "28",
                                        y2: "-28",
                                        stroke: "#22C55E",
                                        strokeWidth: "2.5",
                                        strokeLinecap: "round"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/components/ui/Logo.tsx",
                                        lineNumber: 303,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                        x1: "28",
                                        y1: "0",
                                        x2: "40",
                                        y2: "0",
                                        stroke: "#22C55E",
                                        strokeWidth: "2.5",
                                        strokeLinecap: "round"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/components/ui/Logo.tsx",
                                        lineNumber: 304,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                        x1: "20",
                                        y1: "20",
                                        x2: "28",
                                        y2: "28",
                                        stroke: "#22C55E",
                                        strokeWidth: "2.5",
                                        strokeLinecap: "round"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/components/ui/Logo.tsx",
                                        lineNumber: 305,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                        x1: "0",
                                        y1: "28",
                                        x2: "0",
                                        y2: "40",
                                        stroke: "#22C55E",
                                        strokeWidth: "2.5",
                                        strokeLinecap: "round"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/components/ui/Logo.tsx",
                                        lineNumber: 306,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                        x1: "-20",
                                        y1: "20",
                                        x2: "-28",
                                        y2: "28",
                                        stroke: "#22C55E",
                                        strokeWidth: "2.5",
                                        strokeLinecap: "round"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/components/ui/Logo.tsx",
                                        lineNumber: 307,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                        x1: "-28",
                                        y1: "0",
                                        x2: "-40",
                                        y2: "0",
                                        stroke: "#22C55E",
                                        strokeWidth: "2.5",
                                        strokeLinecap: "round"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/components/ui/Logo.tsx",
                                        lineNumber: 308,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                        x1: "-20",
                                        y1: "-20",
                                        x2: "-28",
                                        y2: "-28",
                                        stroke: "#22C55E",
                                        strokeWidth: "2.5",
                                        strokeLinecap: "round"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/components/ui/Logo.tsx",
                                        lineNumber: 309,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/components/ui/Logo.tsx",
                                lineNumber: 301,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SuccessCircle, {
                                cx: "0",
                                cy: "0",
                                r: "22",
                                fill: "#22C55E",
                                stroke: "#16A34A",
                                strokeWidth: "3",
                                $show: indicator.show
                            }, void 0, false, {
                                fileName: "[project]/frontend/components/ui/Logo.tsx",
                                lineNumber: 312,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SuccessCheckmark, {
                                d: "M -9,0 L -3,9 L 11,-9",
                                fill: "none",
                                stroke: "white",
                                strokeWidth: "4",
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                                $show: indicator.show
                            }, void 0, false, {
                                fileName: "[project]/frontend/components/ui/Logo.tsx",
                                lineNumber: 322,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Sparkle, {
                                cx: "0",
                                cy: "0",
                                r: "2.5",
                                fill: "#FCD34D",
                                $show: indicator.show,
                                $delay: 0.3,
                                style: {
                                    '--tx': '-25px',
                                    '--ty': '-18px'
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/components/ui/Logo.tsx",
                                lineNumber: 332,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Sparkle, {
                                cx: "0",
                                cy: "0",
                                r: "3",
                                fill: "#FCD34D",
                                $show: indicator.show,
                                $delay: 0.35,
                                style: {
                                    '--tx': '18px',
                                    '--ty': '-25px'
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/components/ui/Logo.tsx",
                                lineNumber: 333,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Sparkle, {
                                cx: "0",
                                cy: "0",
                                r: "2.5",
                                fill: "#FCD34D",
                                $show: indicator.show,
                                $delay: 0.4,
                                style: {
                                    '--tx': '26px',
                                    '--ty': '12px'
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/components/ui/Logo.tsx",
                                lineNumber: 334,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Sparkle, {
                                cx: "0",
                                cy: "0",
                                r: "3",
                                fill: "#FBBF24",
                                $show: indicator.show,
                                $delay: 0.38,
                                style: {
                                    '--tx': '-20px',
                                    '--ty': '22px'
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/components/ui/Logo.tsx",
                                lineNumber: 335,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Sparkle, {
                                cx: "0",
                                cy: "0",
                                r: "2",
                                fill: "#FBBF24",
                                $show: indicator.show,
                                $delay: 0.42,
                                style: {
                                    '--tx': '10px',
                                    '--ty': '26px'
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/components/ui/Logo.tsx",
                                lineNumber: 336,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Sparkle, {
                                cx: "0",
                                cy: "0",
                                r: "2",
                                fill: "#FCD34D",
                                $show: indicator.show,
                                $delay: 0.33,
                                style: {
                                    '--tx': '-12px',
                                    '--ty': '-26px'
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/components/ui/Logo.tsx",
                                lineNumber: 337,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, indicator.id, true, {
                        fileName: "[project]/frontend/components/ui/Logo.tsx",
                        lineNumber: 300,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))),
                bugs.map((bug)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Bug, {
                        x: bug.cx,
                        y: bug.cy,
                        detected: bug.detected
                    }, bug.id, false, {
                        fileName: "[project]/frontend/components/ui/Logo.tsx",
                        lineNumber: 343,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                    transform: "translate(250, 120)",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AnimatedText, {
                            x: "0",
                            y: "0",
                            $delay: 5.5,
                            $variant: variant,
                            children: "C"
                        }, void 0, false, {
                            fileName: "[project]/frontend/components/ui/Logo.tsx",
                            lineNumber: 354,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AnimatedText, {
                            x: "175",
                            y: "0",
                            $delay: 5.8,
                            $variant: variant,
                            children: "gniTest"
                        }, void 0, false, {
                            fileName: "[project]/frontend/components/ui/Logo.tsx",
                            lineNumber: 357,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MagnifyingGlass, {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DetectionPulse, {
                                    cx: "0",
                                    cy: "0",
                                    r: "45",
                                    fill: "rgba(255, 215, 0, 0.4)",
                                    stroke: "#F59E0B",
                                    strokeWidth: "2.5",
                                    $show: currentDetection !== null
                                }, void 0, false, {
                                    fileName: "[project]/frontend/components/ui/Logo.tsx",
                                    lineNumber: 361,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                    cx: "0",
                                    cy: "0",
                                    r: "33",
                                    fill: "url(#lensGradient)"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/components/ui/Logo.tsx",
                                    lineNumber: 371,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                    cx: "0",
                                    cy: "0",
                                    r: "33",
                                    fill: "none",
                                    stroke: "#2A8F88",
                                    strokeWidth: "4"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/components/ui/Logo.tsx",
                                    lineNumber: 372,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                    clipPath: "url(#lensClip)",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                            cx: "0",
                                            cy: "0",
                                            r: "28",
                                            fill: "rgba(255, 255, 255, 0.92)"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/components/ui/Logo.tsx",
                                            lineNumber: 376,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        currentDetection && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ellipse", {
                                                    cx: "0",
                                                    cy: "0",
                                                    rx: "14",
                                                    ry: "20",
                                                    fill: "#DC2626",
                                                    stroke: "#991B1B",
                                                    strokeWidth: "2"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/ui/Logo.tsx",
                                                    lineNumber: 380,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                    cx: "0",
                                                    cy: "-17",
                                                    r: "8.5",
                                                    fill: "#DC2626",
                                                    stroke: "#991B1B",
                                                    strokeWidth: "2"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/ui/Logo.tsx",
                                                    lineNumber: 381,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                    x1: "-3.5",
                                                    y1: "-23",
                                                    x2: "-7",
                                                    y2: "-30",
                                                    stroke: "#991B1B",
                                                    strokeWidth: "2.5",
                                                    strokeLinecap: "round"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/ui/Logo.tsx",
                                                    lineNumber: 382,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                    x1: "3.5",
                                                    y1: "-23",
                                                    x2: "7",
                                                    y2: "-30",
                                                    stroke: "#991B1B",
                                                    strokeWidth: "2.5",
                                                    strokeLinecap: "round"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/ui/Logo.tsx",
                                                    lineNumber: 383,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                    x1: "-14",
                                                    y1: "-7",
                                                    x2: "-22",
                                                    y2: "-11",
                                                    stroke: "#991B1B",
                                                    strokeWidth: "2.5",
                                                    strokeLinecap: "round"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/ui/Logo.tsx",
                                                    lineNumber: 384,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                    x1: "-14",
                                                    y1: "0",
                                                    x2: "-25",
                                                    y2: "0",
                                                    stroke: "#991B1B",
                                                    strokeWidth: "2.5",
                                                    strokeLinecap: "round"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/ui/Logo.tsx",
                                                    lineNumber: 385,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                    x1: "-14",
                                                    y1: "7",
                                                    x2: "-22",
                                                    y2: "11",
                                                    stroke: "#991B1B",
                                                    strokeWidth: "2.5",
                                                    strokeLinecap: "round"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/ui/Logo.tsx",
                                                    lineNumber: 386,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                    x1: "14",
                                                    y1: "-7",
                                                    x2: "22",
                                                    y2: "-11",
                                                    stroke: "#991B1B",
                                                    strokeWidth: "2.5",
                                                    strokeLinecap: "round"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/ui/Logo.tsx",
                                                    lineNumber: 387,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                    x1: "14",
                                                    y1: "0",
                                                    x2: "25",
                                                    y2: "0",
                                                    stroke: "#991B1B",
                                                    strokeWidth: "2.5",
                                                    strokeLinecap: "round"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/ui/Logo.tsx",
                                                    lineNumber: 388,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                    x1: "14",
                                                    y1: "7",
                                                    x2: "22",
                                                    y2: "11",
                                                    stroke: "#991B1B",
                                                    strokeWidth: "2.5",
                                                    strokeLinecap: "round"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/ui/Logo.tsx",
                                                    lineNumber: 389,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                    x1: "0",
                                                    y1: "-10",
                                                    x2: "0",
                                                    y2: "14",
                                                    stroke: "#991B1B",
                                                    strokeWidth: "2",
                                                    opacity: "0.5"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/components/ui/Logo.tsx",
                                                    lineNumber: 390,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/components/ui/Logo.tsx",
                                            lineNumber: 379,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/components/ui/Logo.tsx",
                                    lineNumber: 375,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                    cx: "0",
                                    cy: "0",
                                    r: "31",
                                    fill: "url(#lensHighlight)",
                                    pointerEvents: "none"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/components/ui/Logo.tsx",
                                    lineNumber: 395,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                    transform: "translate(23,19) rotate(35)",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                        x: "0",
                                        y: "-4.5",
                                        width: "48",
                                        height: "9",
                                        rx: "4.5",
                                        fill: "#2A8F88"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/components/ui/Logo.tsx",
                                        lineNumber: 399,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/frontend/components/ui/Logo.tsx",
                                    lineNumber: 398,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/components/ui/Logo.tsx",
                            lineNumber: 360,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/components/ui/Logo.tsx",
                    lineNumber: 352,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/components/ui/Logo.tsx",
            lineNumber: 273,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/frontend/components/ui/Logo.tsx",
        lineNumber: 272,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(Logo, "QMkUdHvZxguwOBG/rEnthrAgfDg=");
_c10 = Logo;
const __TURBOPACK__default__export__ = Logo;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10;
__turbopack_context__.k.register(_c, "SvgContainer");
__turbopack_context__.k.register(_c1, "MagnifyingGlass");
__turbopack_context__.k.register(_c2, "BugIcon");
__turbopack_context__.k.register(_c3, "DetectionPulse");
__turbopack_context__.k.register(_c4, "SuccessCircle");
__turbopack_context__.k.register(_c5, "SuccessCheckmark");
__turbopack_context__.k.register(_c6, "Sparkle");
__turbopack_context__.k.register(_c7, "RadiateLines");
__turbopack_context__.k.register(_c8, "AnimatedText");
__turbopack_context__.k.register(_c9, "Bug");
__turbopack_context__.k.register(_c10, "Logo");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/app/auth/accept-invitation/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AcceptInvitationPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/ui/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$invitations$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/api/invitations.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/sonner/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/eye.js [app-client] (ecmascript) <export default as Eye>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2d$off$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__EyeOff$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/eye-off.js [app-client] (ecmascript) <export default as EyeOff>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mail$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mail$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/mail.js [app-client] (ecmascript) <export default as Mail>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user.js [app-client] (ecmascript) <export default as User>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Lock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/lock.js [app-client] (ecmascript) <export default as Lock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-check-big.js [app-client] (ecmascript) <export default as CheckCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$Logo$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/ui/Logo.tsx [app-client] (ecmascript)");
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
function AcceptInvitationContent() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const token = searchParams.get('token');
    const [formData, setFormData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        username: '',
        password: '',
        confirmPassword: '',
        full_name: ''
    });
    const [showPassword, setShowPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AcceptInvitationContent.useEffect": ()=>{
            if (!token) {
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error('Invalid invitation link');
                router.push('/auth/signin');
            }
        }
    }["AcceptInvitationContent.useEffect"], [
        token
    ]);
    const handleSubmit = async (e)=>{
        e.preventDefault();
        if (!token) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error('Invalid invitation token');
            return;
        }
        if (!formData.username || !formData.password) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error('Please fill in all required fields');
            return;
        }
        if (formData.password.length < 8) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error('Password must be at least 8 characters');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2f$invitations$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["acceptInvitation"])(token, {
                username: formData.username,
                password: formData.password
            });
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].success('🎉 Account created successfully! Please sign in.');
            router.push('/auth/signin');
        } catch (error) {
            console.error('Failed to accept invitation:', error);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error(error.response?.data?.detail || 'Failed to create account');
        } finally{
            setLoading(false);
        }
    };
    if (!token) {
        return null;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-full max-w-md",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-white rounded-2xl shadow-xl p-8 border border-gray-100",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-center mb-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex justify-center mb-4",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$Logo$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        variant: "dark"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                        lineNumber: 84,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                    lineNumber: 83,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                    className: "text-3xl font-bold text-gray-900 mb-2",
                                    children: "🎉 Welcome to CogniTest!"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                    lineNumber: 86,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-gray-600",
                                    children: "Complete your account setup to get started"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                    lineNumber: 89,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                            lineNumber: 82,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-green-50 border border-green-200 rounded-lg p-4 mb-6",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-start gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"], {
                                        className: "w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                        lineNumber: 97,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-sm font-medium text-green-900",
                                                children: "Invitation Accepted"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                                lineNumber: 99,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs text-green-700 mt-1",
                                                children: "Your organization is ready. Just create your account below!"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                                lineNumber: 100,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                        lineNumber: 98,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                lineNumber: 96,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                            lineNumber: 95,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                            onSubmit: handleSubmit,
                            className: "space-y-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "block text-sm font-medium text-gray-700 mb-1",
                                            children: [
                                                "Username ",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-red-500",
                                                    children: "*"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                                    lineNumber: 111,
                                                    columnNumber: 26
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                            lineNumber: 110,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "relative",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                                                    className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                                    lineNumber: 114,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    value: formData.username,
                                                    onChange: (e)=>setFormData({
                                                            ...formData,
                                                            username: e.target.value
                                                        }),
                                                    className: "w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                                                    placeholder: "Choose a username",
                                                    required: true,
                                                    minLength: 3,
                                                    maxLength: 50
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                                    lineNumber: 115,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                            lineNumber: 113,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs text-gray-500 mt-1",
                                            children: "3-50 characters, letters, numbers, and underscores"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                            lineNumber: 126,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                    lineNumber: 109,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "block text-sm font-medium text-gray-700 mb-1",
                                            children: "Full Name (Optional)"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                            lineNumber: 132,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "relative",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mail$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mail$3e$__["Mail"], {
                                                    className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                                    lineNumber: 136,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    value: formData.full_name,
                                                    onChange: (e)=>setFormData({
                                                            ...formData,
                                                            full_name: e.target.value
                                                        }),
                                                    className: "w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                                                    placeholder: "John Doe"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                                    lineNumber: 137,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                            lineNumber: 135,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                    lineNumber: 131,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "block text-sm font-medium text-gray-700 mb-1",
                                            children: [
                                                "Password ",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-red-500",
                                                    children: "*"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                                    lineNumber: 149,
                                                    columnNumber: 26
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                            lineNumber: 148,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "relative",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Lock$3e$__["Lock"], {
                                                    className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                                    lineNumber: 152,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: showPassword ? 'text' : 'password',
                                                    value: formData.password,
                                                    onChange: (e)=>setFormData({
                                                            ...formData,
                                                            password: e.target.value
                                                        }),
                                                    className: "w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                                                    placeholder: "Create a strong password",
                                                    required: true,
                                                    minLength: 8
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                                    lineNumber: 153,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    onClick: ()=>setShowPassword(!showPassword),
                                                    className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600",
                                                    children: showPassword ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2d$off$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__EyeOff$3e$__["EyeOff"], {
                                                        className: "w-5 h-5"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                                        lineNumber: 167,
                                                        columnNumber: 35
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__["Eye"], {
                                                        className: "w-5 h-5"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                                        lineNumber: 167,
                                                        columnNumber: 68
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                                    lineNumber: 162,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                            lineNumber: 151,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs text-gray-500 mt-1",
                                            children: "Minimum 8 characters"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                            lineNumber: 170,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                    lineNumber: 147,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "block text-sm font-medium text-gray-700 mb-1",
                                            children: [
                                                "Confirm Password ",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-red-500",
                                                    children: "*"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                                    lineNumber: 177,
                                                    columnNumber: 34
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                            lineNumber: 176,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "relative",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Lock$3e$__["Lock"], {
                                                    className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                                    lineNumber: 180,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: showPassword ? 'text' : 'password',
                                                    value: formData.confirmPassword,
                                                    onChange: (e)=>setFormData({
                                                            ...formData,
                                                            confirmPassword: e.target.value
                                                        }),
                                                    className: "w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                                                    placeholder: "Confirm your password",
                                                    required: true,
                                                    minLength: 8
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                                    lineNumber: 181,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                            lineNumber: 179,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                    lineNumber: 175,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    type: "submit",
                                    className: "w-full py-6 text-base font-semibold",
                                    disabled: loading,
                                    children: loading ? 'Creating Account...' : 'Create Account & Get Started'
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                    lineNumber: 193,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                            lineNumber: 108,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-6 text-center",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-gray-600",
                                children: [
                                    "Already have an account?",
                                    ' ',
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "/auth/signin",
                                        className: "text-primary font-medium hover:underline",
                                        children: "Sign in"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                        lineNumber: 206,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                                lineNumber: 204,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                            lineNumber: 203,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                    lineNumber: 80,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-6 bg-white/60 backdrop-blur-sm rounded-lg p-4 text-center",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-gray-600",
                        children: "By creating an account, you agree to CogniTest's Terms of Service and Privacy Policy"
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                        lineNumber: 215,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                    lineNumber: 214,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
            lineNumber: 79,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
        lineNumber: 78,
        columnNumber: 5
    }, this);
}
_s(AcceptInvitationContent, "QydsGIXIS3V1frhIU4CuZa3YY/4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"]
    ];
});
_c = AcceptInvitationContent;
function AcceptInvitationPage() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Suspense"], {
        fallback: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
            }, void 0, false, {
                fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
                lineNumber: 228,
                columnNumber: 9
            }, void 0)
        }, void 0, false, {
            fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
            lineNumber: 227,
            columnNumber: 7
        }, void 0),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AcceptInvitationContent, {}, void 0, false, {
            fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
            lineNumber: 231,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/app/auth/accept-invitation/page.tsx",
        lineNumber: 226,
        columnNumber: 5
    }, this);
}
_c1 = AcceptInvitationPage;
var _c, _c1;
__turbopack_context__.k.register(_c, "AcceptInvitationContent");
__turbopack_context__.k.register(_c1, "AcceptInvitationPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=frontend_37e96c3e._.js.map