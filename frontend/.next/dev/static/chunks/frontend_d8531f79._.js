(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
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
"[project]/frontend/lib/google-oauth.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Google OAuth utilities for frontend
 */ __turbopack_context__.s([
    "getGoogleClientId",
    ()=>getGoogleClientId,
    "handleAppleSignIn",
    ()=>handleAppleSignIn,
    "handleGoogleCallback",
    ()=>handleGoogleCallback,
    "handleGoogleSignIn",
    ()=>handleGoogleSignIn,
    "handleGoogleSignUp",
    ()=>handleGoogleSignUp,
    "handleMicrosoftSignIn",
    ()=>handleMicrosoftSignIn,
    "initializeGoogleSignIn",
    ()=>initializeGoogleSignIn,
    "loadGoogleScript",
    ()=>loadGoogleScript,
    "promptGoogleSignIn",
    ()=>promptGoogleSignIn,
    "renderGoogleSignInButton",
    ()=>renderGoogleSignInButton
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/axios/lib/axios.js [app-client] (ecmascript)");
;
const API_URL = ("TURBOPACK compile-time value", "http://localhost:8000") || 'http://localhost:8000';
async function getGoogleClientId() {
    try {
        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`${API_URL}/api/v1/auth/google/client-id`);
        return response.data.client_id;
    } catch (error) {
        console.error('Failed to get Google Client ID:', error);
        throw new Error('Failed to initialize Google OAuth');
    }
}
async function handleGoogleCallback(code, state) {
    try {
        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].post(`${API_URL}/api/v1/auth/google/callback`, {
            code,
            state
        });
        return response.data;
    } catch (error) {
        console.error('Google callback failed:', error);
        throw error;
    }
}
async function handleGoogleSignIn(idToken, accessToken) {
    try {
        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].post(`${API_URL}/api/v1/auth/google/signin`, {
            id_token: idToken,
            access_token: accessToken
        });
        return response.data;
    } catch (error) {
        console.error('Google sign in failed:', error);
        throw error;
    }
}
async function handleGoogleSignUp(idToken, username, accessToken) {
    try {
        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].post(`${API_URL}/api/v1/auth/google/signup`, {
            id_token: idToken,
            username,
            access_token: accessToken
        });
        return response.data;
    } catch (error) {
        console.error('Google sign up failed:', error);
        throw error;
    }
}
async function handleMicrosoftSignIn(idToken, accessToken) {
    try {
        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].post(`${API_URL}/api/v1/auth/microsoft/signin`, {
            id_token: idToken,
            access_token: accessToken
        });
        return response.data;
    } catch (error) {
        console.error('Microsoft sign in failed:', error);
        throw error;
    }
}
async function handleAppleSignIn(idToken, accessToken) {
    try {
        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].post(`${API_URL}/api/v1/auth/apple/signin`, {
            id_token: idToken,
            access_token: accessToken
        });
        return response.data;
    } catch (error) {
        console.error('Apple sign in failed:', error);
        throw error;
    }
}
function loadGoogleScript() {
    return new Promise((resolve, reject)=>{
        if (window.google) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = ()=>{
            resolve();
        };
        script.onerror = ()=>{
            reject(new Error('Failed to load Google Sign-In script'));
        };
        document.head.appendChild(script);
    });
}
function initializeGoogleSignIn(clientId, callback) {
    if (!window.google) {
        console.error('Google Sign-In script not loaded');
        return;
    }
    window.google.accounts.id.initialize({
        client_id: clientId,
        callback: callback,
        auto_select: false,
        ux_mode: 'popup'
    });
}
function renderGoogleSignInButton(elementId, options) {
    if (!window.google) {
        console.error('Google Sign-In script not loaded');
        return;
    }
    const defaultOptions = ({
        theme: 'outline',
        size: 'large',
        width: '100%'
    })(window).google.accounts.id.renderButton(document.getElementById(elementId), {
        ...defaultOptions,
        ...options
    });
}
function promptGoogleSignIn() {
    if (!window.google) {
        console.error('Google Sign-In script not loaded');
        return;
    }
    window.google.accounts.id.prompt();
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/components/auth/google-signin-button.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GoogleSignInButton",
    ()=>GoogleSignInButton
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/sonner/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$google$2d$oauth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/google-oauth.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/auth-context.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
function GoogleSignInButton({ onSuccess, onError }) {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const { checkAuth } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GoogleSignInButton.useEffect": ()=>{
            // Load Google script in background
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = ({
                "GoogleSignInButton.useEffect": ()=>{
                // Script loaded, initialize will happen on button click
                }
            })["GoogleSignInButton.useEffect"];
            document.head.appendChild(script);
        }
    }["GoogleSignInButton.useEffect"], []);
    const handleClick = async ()=>{
        try {
            setIsLoading(true);
            const API_URL = ("TURBOPACK compile-time value", "http://localhost:8000") || 'http://localhost:8000';
            // Get client ID from backend
            const response = await fetch(`${API_URL}/api/v1/auth/google/client-id`);
            const { client_id } = await response.json();
            if (!window.google) {
                // If Google library not loaded yet, try loading it
                await new Promise((resolve)=>{
                    const checkGoogle = setInterval(()=>{
                        if (window.google) {
                            clearInterval(checkGoogle);
                            resolve(true);
                        }
                    }, 100);
                    // Timeout after 5 seconds
                    setTimeout(()=>{
                        clearInterval(checkGoogle);
                        resolve(false);
                    }, 5000);
                });
            }
            if (!window.google) {
                throw new Error('Google Sign-In library not available');
            }
            // Initialize and show the one-tap UI
            window.google.accounts.id.initialize({
                client_id: client_id,
                callback: handleCredentialResponse,
                ux_mode: 'popup',
                auto_select: false
            });
            // Show the one-tap prompt or sign-in flow
            window.google.accounts.id.prompt((notification)=>{
                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                    // If one-tap is not displayed, manually trigger sign-in
                    window.google.accounts.id.renderButton(document.createElement('div'), {
                        type: 'icon',
                        size: 'large'
                    });
                }
            });
        } catch (error) {
            console.error('Error initiating Google Sign-In:', error);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error('Failed to initiate Google Sign-In');
        } finally{
            setIsLoading(false);
        }
    };
    const handleCredentialResponse = async (response)=>{
        try {
            setIsLoading(true);
            if (!response.credential) {
                throw new Error('No credential received from Google');
            }
            // Sign in with Google
            const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$google$2d$oauth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["handleGoogleSignIn"])(response.credential);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].success(result.message || 'Successfully signed in with Google!');
            // Call success callback
            onSuccess?.(result.user);
            // Update auth context
            await checkAuth();
            // Redirect to dashboard
            router.push('/dashboard');
        } catch (error) {
            console.error('Google sign-in error:', error);
            const errorMessage = error.response?.data?.detail || error.message || 'Google sign-in failed';
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error(errorMessage);
            onError?.(error);
        } finally{
            setIsLoading(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        onClick: handleClick,
        disabled: isLoading,
        className: "w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                src: "/google-logo.svg",
                alt: "Google",
                width: 20,
                height: 20,
                className: "mr-2"
            }, void 0, false, {
                fileName: "[project]/frontend/components/auth/google-signin-button.tsx",
                lineNumber: 139,
                columnNumber: 7
            }, this),
            isLoading ? 'Signing in...' : 'Continue with Google'
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/components/auth/google-signin-button.tsx",
        lineNumber: 134,
        columnNumber: 5
    }, this);
}
_s(GoogleSignInButton, "h5HAbDszt0UPNBP5AKkrgq7fUIc=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = GoogleSignInButton;
var _c;
__turbopack_context__.k.register(_c, "GoogleSignInButton");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
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
"[project]/frontend/components/auth/oauth-button.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "OAuthButton",
    ()=>OAuthButton
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/sonner/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/utils.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
function OAuthButton({ provider, onClick, isLoading = false, disabled = false, variant = 'default', size = 'md', className }) {
    _s();
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const providerConfig = {
        google: {
            label: 'Google',
            icon: '/google-logo.svg',
            color: 'text-gray-700 dark:text-gray-200',
            bgHover: 'hover:bg-gray-50 dark:hover:bg-gray-600'
        },
        microsoft: {
            label: 'Microsoft',
            icon: '/microsoft-logo.svg',
            color: 'text-gray-700 dark:text-gray-200',
            bgHover: 'hover:bg-gray-50 dark:hover:bg-gray-600'
        },
        apple: {
            label: 'Apple',
            icon: '/apple-logo.svg',
            color: 'text-gray-700 dark:text-gray-200',
            bgHover: 'hover:bg-gray-50 dark:hover:bg-gray-600'
        }
    };
    const config = providerConfig[provider];
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
    };
    const variantClasses = {
        default: `border border-gray-300 rounded-md shadow-sm font-medium bg-white dark:bg-gray-700 dark:border-gray-600 ${config.bgHover} dark:hover:bg-gray-600`,
        outline: `border border-gray-300 dark:border-gray-600 rounded-md shadow-sm font-medium bg-transparent ${config.bgHover}`,
        minimal: `font-medium rounded-md ${config.bgHover} transition-colors`
    };
    const handleClick = async ()=>{
        try {
            setLoading(true);
            await onClick();
        } catch (error) {
            console.error(`${provider} sign-in error:`, error);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error(error.message || `Failed to sign in with ${config.label}`);
        } finally{
            setLoading(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        onClick: handleClick,
        disabled: isLoading || loading || disabled,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('w-full flex items-center justify-center gap-2', sizeClasses[size], variantClasses[variant], config.color, disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer', 'transition-all duration-200', className),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                src: config.icon,
                alt: config.label,
                width: size === 'sm' ? 16 : size === 'md' ? 20 : 24,
                height: size === 'sm' ? 16 : size === 'md' ? 20 : 24
            }, void 0, false, {
                fileName: "[project]/frontend/components/auth/oauth-button.tsx",
                lineNumber: 90,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: loading || isLoading ? `Signing in...` : `Continue with ${config.label}`
            }, void 0, false, {
                fileName: "[project]/frontend/components/auth/oauth-button.tsx",
                lineNumber: 96,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/components/auth/oauth-button.tsx",
        lineNumber: 77,
        columnNumber: 5
    }, this);
}
_s(OAuthButton, "/Rjh5rPqCCqf0XYnTUk9ZNavw3Q=");
_c = OAuthButton;
var _c;
__turbopack_context__.k.register(_c, "OAuthButton");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/components/auth/microsoft-signin-button.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MicrosoftSignInButton",
    ()=>MicrosoftSignInButton
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/sonner/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/auth-context.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$auth$2f$oauth$2d$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/auth/oauth-button.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
const API_URL = ("TURBOPACK compile-time value", "http://localhost:8000") || 'http://localhost:8000';
function MicrosoftSignInButton({ onSuccess, onError, variant = 'default', size = 'md' }) {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const { checkAuth } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const handleClick = async ()=>{
        try {
            setIsLoading(true);
            // Get authorization URL from backend
            const response = await fetch(`${API_URL}/api/v1/auth/microsoft/authorize`);
            const { authorization_url } = await response.json();
            // Redirect to Microsoft authorization
            window.location.href = authorization_url;
        } catch (error) {
            console.error('Error initiating Microsoft Sign-In:', error);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error('Failed to initiate Microsoft Sign-In');
            onError?.(error);
        } finally{
            setIsLoading(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$auth$2f$oauth$2d$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OAuthButton"], {
        provider: "microsoft",
        onClick: handleClick,
        isLoading: isLoading,
        variant: variant,
        size: size
    }, void 0, false, {
        fileName: "[project]/frontend/components/auth/microsoft-signin-button.tsx",
        lineNumber: 54,
        columnNumber: 5
    }, this);
}
_s(MicrosoftSignInButton, "5JIQUbd0JW0fAkp1nc3OoEkq+K4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = MicrosoftSignInButton;
var _c;
__turbopack_context__.k.register(_c, "MicrosoftSignInButton");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/components/auth/apple-signin-button.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AppleSignInButton",
    ()=>AppleSignInButton
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/sonner/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/auth-context.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$auth$2f$oauth$2d$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/auth/oauth-button.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
const API_URL = ("TURBOPACK compile-time value", "http://localhost:8000") || 'http://localhost:8000';
function AppleSignInButton({ onSuccess, onError, variant = 'default', size = 'md' }) {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const { checkAuth } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const handleClick = async ()=>{
        try {
            setIsLoading(true);
            // Get authorization URL from backend
            const response = await fetch(`${API_URL}/api/v1/auth/apple/authorize`);
            const { authorization_url } = await response.json();
            // Redirect to Apple authorization
            window.location.href = authorization_url;
        } catch (error) {
            console.error('Error initiating Apple Sign-In:', error);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error('Failed to initiate Apple Sign-In');
            onError?.(error);
        } finally{
            setIsLoading(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$auth$2f$oauth$2d$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OAuthButton"], {
        provider: "apple",
        onClick: handleClick,
        isLoading: isLoading,
        variant: variant,
        size: size
    }, void 0, false, {
        fileName: "[project]/frontend/components/auth/apple-signin-button.tsx",
        lineNumber: 48,
        columnNumber: 5
    }, this);
}
_s(AppleSignInButton, "5JIQUbd0JW0fAkp1nc3OoEkq+K4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = AppleSignInButton;
var _c;
__turbopack_context__.k.register(_c, "AppleSignInButton");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/app/auth/signin/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SignInPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/auth-context.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/sonner/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/eye.js [app-client] (ecmascript) <export default as Eye>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2d$off$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__EyeOff$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/eye-off.js [app-client] (ecmascript) <export default as EyeOff>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$Logo$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/ui/Logo.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$auth$2f$google$2d$signin$2d$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/auth/google-signin-button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$auth$2f$microsoft$2d$signin$2d$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/auth/microsoft-signin-button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$auth$2f$apple$2d$signin$2d$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/auth/apple-signin-button.tsx [app-client] (ecmascript)");
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
function SignInPage() {
    _s();
    const [email, setEmail] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [password, setPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [showPassword, setShowPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [rememberMe, setRememberMe] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const { login } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const handleSubmit = async (e)=>{
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password, rememberMe);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].success('Welcome back!');
        } catch (error) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error(error.message || 'Invalid email or password');
        } finally{
            setLoading(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen grid grid-cols-1 md:grid-cols-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "hidden md:flex flex-col items-center justify-center relative p-8 bg-gradient-to-br from-slate-900 via-teal-900 to-cyan-900 dark:from-black dark:via-teal-950 dark:to-cyan-950 overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-0 overflow-hidden",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-teal-400/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                lineNumber: 43,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-gradient-to-tl from-emerald-400/20 to-teal-500/20 rounded-full blur-3xl animate-pulse",
                                style: {
                                    animationDelay: '1s'
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                lineNumber: 44,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute top-1/3 right-1/4 w-72 h-72 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 rounded-full blur-2xl animate-pulse",
                                style: {
                                    animationDelay: '2s'
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                lineNumber: 45,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute top-20 left-12 opacity-10 animate-float",
                                style: {
                                    animationDelay: '0s',
                                    animationDuration: '8s'
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    width: "24",
                                    height: "24",
                                    viewBox: "0 0 24 24",
                                    fill: "currentColor",
                                    className: "text-emerald-300",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ellipse", {
                                            cx: "12",
                                            cy: "13",
                                            rx: "5",
                                            ry: "7"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                            lineNumber: 50,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                            cx: "12",
                                            cy: "7",
                                            r: "3"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                            lineNumber: 51,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                            x1: "7",
                                            y1: "10",
                                            x2: "4",
                                            y2: "8",
                                            stroke: "currentColor",
                                            strokeWidth: "1.5"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                            lineNumber: 52,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                            x1: "17",
                                            y1: "10",
                                            x2: "20",
                                            y2: "8",
                                            stroke: "currentColor",
                                            strokeWidth: "1.5"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                            lineNumber: 53,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                    lineNumber: 49,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                lineNumber: 48,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute bottom-32 right-20 opacity-10 animate-float",
                                style: {
                                    animationDelay: '3s',
                                    animationDuration: '10s'
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    width: "20",
                                    height: "20",
                                    viewBox: "0 0 24 24",
                                    fill: "currentColor",
                                    className: "text-teal-300",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ellipse", {
                                            cx: "12",
                                            cy: "13",
                                            rx: "5",
                                            ry: "7"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                            lineNumber: 59,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                            cx: "12",
                                            cy: "7",
                                            r: "3"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                            lineNumber: 60,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                    lineNumber: 58,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                lineNumber: 57,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute top-1/2 left-16 opacity-10 animate-float",
                                style: {
                                    animationDelay: '5s',
                                    animationDuration: '12s'
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    width: "18",
                                    height: "18",
                                    viewBox: "0 0 24 24",
                                    fill: "currentColor",
                                    className: "text-cyan-300",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ellipse", {
                                            cx: "12",
                                            cy: "13",
                                            rx: "5",
                                            ry: "7"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                            lineNumber: 66,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                            cx: "12",
                                            cy: "7",
                                            r: "3"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                            lineNumber: 67,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                    lineNumber: 65,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                lineNumber: 64,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute top-40 right-16 opacity-10 animate-float",
                                style: {
                                    animationDelay: '1s',
                                    animationDuration: '9s'
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    width: "28",
                                    height: "28",
                                    viewBox: "0 0 24 24",
                                    fill: "none",
                                    stroke: "currentColor",
                                    strokeWidth: "2",
                                    className: "text-emerald-400",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                        points: "20 6 9 17 4 12"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                        lineNumber: 74,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                    lineNumber: 73,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                lineNumber: 72,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute bottom-24 left-24 opacity-10 animate-float",
                                style: {
                                    animationDelay: '4s',
                                    animationDuration: '11s'
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    width: "22",
                                    height: "22",
                                    viewBox: "0 0 24 24",
                                    fill: "none",
                                    stroke: "currentColor",
                                    strokeWidth: "2",
                                    className: "text-teal-400",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                        points: "20 6 9 17 4 12"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                        lineNumber: 80,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                    lineNumber: 79,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                lineNumber: 78,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "absolute inset-0 w-full h-full opacity-5",
                                xmlns: "http://www.w3.org/2000/svg",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("defs", {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pattern", {
                                            id: "circuit",
                                            x: "0",
                                            y: "0",
                                            width: "100",
                                            height: "100",
                                            patternUnits: "userSpaceOnUse",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    d: "M 10 50 L 30 50 L 30 30 M 30 70 L 30 50 M 50 10 L 50 30 L 70 30 M 70 50 L 50 50 L 50 70 M 50 90 L 50 70",
                                                    stroke: "currentColor",
                                                    strokeWidth: "1",
                                                    fill: "none",
                                                    className: "text-teal-300"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                                    lineNumber: 88,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                    cx: "30",
                                                    cy: "30",
                                                    r: "2",
                                                    fill: "currentColor",
                                                    className: "text-teal-400"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                                    lineNumber: 90,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                    cx: "70",
                                                    cy: "30",
                                                    r: "2",
                                                    fill: "currentColor",
                                                    className: "text-cyan-400"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                                    lineNumber: 91,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                    cx: "50",
                                                    cy: "70",
                                                    r: "2",
                                                    fill: "currentColor",
                                                    className: "text-emerald-400"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                                    lineNumber: 92,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                            lineNumber: 87,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                        lineNumber: 86,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                        width: "100%",
                                        height: "100%",
                                        fill: "url(#circuit)"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                        lineNumber: 95,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                lineNumber: 85,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute top-16 left-1/3 w-32 h-32 border border-teal-400/10 rotate-45 animate-spin-slow"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                lineNumber: 99,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute bottom-20 right-1/3 w-24 h-24 border border-cyan-400/10 -rotate-12 animate-spin-slower"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                lineNumber: 100,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/app/auth/signin/page.tsx",
                        lineNumber: 41,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative z-10",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$Logo$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                            fileName: "[project]/frontend/app/auth/signin/page.tsx",
                            lineNumber: 105,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/auth/signin/page.tsx",
                        lineNumber: 104,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "relative z-10 mt-8 text-xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-cyan-200 to-emerald-200 text-center max-w-md drop-shadow-lg",
                        children: "AI-Powered Testing Platform"
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/auth/signin/page.tsx",
                        lineNumber: 109,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/app/auth/signin/page.tsx",
                lineNumber: 39,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-center p-8",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-full max-w-md",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-white dark:bg-gray-800 rounded-lg shadow-md p-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-2xl font-semibold text-center text-gray-900 dark:text-white mb-6",
                                    children: "Log in to CogniTest"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                    lineNumber: 118,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-4 mb-6",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$auth$2f$google$2d$signin$2d$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GoogleSignInButton"], {}, void 0, false, {
                                            fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                            lineNumber: 122,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$auth$2f$microsoft$2d$signin$2d$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MicrosoftSignInButton"], {}, void 0, false, {
                                            fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                            lineNumber: 123,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$auth$2f$apple$2d$signin$2d$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AppleSignInButton"], {}, void 0, false, {
                                            fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                            lineNumber: 124,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                    lineNumber: 121,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "relative my-6",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "absolute inset-0 flex items-center",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "w-full border-t border-gray-300"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                                lineNumber: 129,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                            lineNumber: 128,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "relative flex justify-center text-sm",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "px-2 bg-white dark:bg-gray-800 text-gray-500",
                                                children: "Or"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                                lineNumber: 132,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                            lineNumber: 131,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                    lineNumber: 127,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                    onSubmit: handleSubmit,
                                    className: "space-y-6",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    htmlFor: "email",
                                                    className: "block text-sm font-medium text-gray-700",
                                                    children: "Email address"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                                    lineNumber: 138,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    id: "email",
                                                    name: "email",
                                                    type: "email",
                                                    autoComplete: "email",
                                                    required: true,
                                                    value: email,
                                                    onChange: (e)=>setEmail(e.target.value),
                                                    className: "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm",
                                                    placeholder: "you@example.com"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                                    lineNumber: 141,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                            lineNumber: 137,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    htmlFor: "password",
                                                    className: "block text-sm font-medium text-gray-700",
                                                    children: "Password"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                                    lineNumber: 155,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mt-1 relative",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            id: "password",
                                                            name: "password",
                                                            type: showPassword ? 'text' : 'password',
                                                            autoComplete: "current-password",
                                                            required: true,
                                                            value: password,
                                                            onChange: (e)=>setPassword(e.target.value),
                                                            className: "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm",
                                                            placeholder: "Enter your password"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                                            lineNumber: 159,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            type: "button",
                                                            onClick: ()=>setShowPassword(!showPassword),
                                                            className: "absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5",
                                                            children: showPassword ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2d$off$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__EyeOff$3e$__["EyeOff"], {
                                                                className: "h-5 w-5 text-gray-500"
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                                                lineNumber: 175,
                                                                columnNumber: 37
                                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__["Eye"], {
                                                                className: "h-5 w-5 text-gray-500"
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                                                lineNumber: 175,
                                                                columnNumber: 84
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                                            lineNumber: 170,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                                    lineNumber: 158,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                            lineNumber: 154,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center justify-between",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            id: "remember-me",
                                                            name: "remember-me",
                                                            type: "checkbox",
                                                            checked: rememberMe,
                                                            onChange: (e)=>setRememberMe(e.target.checked),
                                                            className: "h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                                            lineNumber: 182,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            htmlFor: "remember-me",
                                                            className: "ml-2 block text-sm text-gray-900",
                                                            children: "Remember me"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                                            lineNumber: 190,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                                    lineNumber: 181,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-sm",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                        href: "/auth/forgot-password",
                                                        className: "font-medium text-primary hover:text-primary/90",
                                                        children: "Forgot your password?"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                                        lineNumber: 196,
                                                        columnNumber: 19
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                                    lineNumber: 195,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                            lineNumber: 180,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "submit",
                                                disabled: loading,
                                                className: "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50",
                                                children: loading ? 'Signing in...' : 'Log in'
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                                lineNumber: 203,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                            lineNumber: 202,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                    lineNumber: 136,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/app/auth/signin/page.tsx",
                            lineNumber: 117,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "mt-6 text-center text-sm text-gray-500",
                            children: [
                                "Don't have an account?",
                                ' ',
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/auth/signup",
                                    className: "font-medium text-primary hover:text-primary/90",
                                    children: "Sign up"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/auth/signin/page.tsx",
                                    lineNumber: 216,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/app/auth/signin/page.tsx",
                            lineNumber: 214,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/app/auth/signin/page.tsx",
                    lineNumber: 116,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/app/auth/signin/page.tsx",
                lineNumber: 115,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/app/auth/signin/page.tsx",
        lineNumber: 37,
        columnNumber: 5
    }, this);
}
_s(SignInPage, "yU89MZpHTUH2C85Wn7bINcLJPBM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = SignInPage;
var _c;
__turbopack_context__.k.register(_c, "SignInPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=frontend_d8531f79._.js.map