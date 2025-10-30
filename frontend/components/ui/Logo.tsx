'use client';
import React from 'react';
import styled, { keyframes, css } from 'styled-components';

const SvgContainer = styled.div`
  width: 100%;
  max-width: 600px;
  height: 200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// Magnifying glass searches across the screen smoothly
// Logo group is at (250, 120), bugs are at absolute positions
// Bug 1: (200, 70) -> relative (-50, -50)
// Bug 2: (420, 140) -> relative (170, 20)
// Bug 3: (620, 85) -> relative (370, -35)
const searchAnimation = keyframes`
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
const bugDetectedAnimation = keyframes`
  0% { opacity: 1; transform: scale(1) rotate(0deg); }
  20% { opacity: 1; transform: scale(1.3) rotate(10deg); }
  40% { opacity: 1; transform: scale(1.5) rotate(-10deg); }
  60% { opacity: 0.7; transform: scale(1.8) rotate(20deg); }
  80% { opacity: 0.3; transform: scale(2.2) rotate(-15deg); }
  100% { opacity: 0; transform: scale(2.8) rotate(30deg); }
`;

// Success checkmark draws itself then fades
const checkmarkDraw = keyframes`
  0% { stroke-dashoffset: 100; opacity: 0; }
  15% { opacity: 1; }
  40% { stroke-dashoffset: 0; opacity: 1; }
  85% { opacity: 1; }
  100% { stroke-dashoffset: 0; opacity: 0; }
`;

// Success circle appears then fades
const successCircleAppear = keyframes`
  0% { opacity: 0; transform: scale(0); }
  20% { opacity: 1; transform: scale(1.2); }
  30% { transform: scale(0.9); }
  40% { opacity: 1; transform: scale(1); }
  85% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.7); }
`;

// Sparkle particles burst out
const sparkleAnimation = keyframes`
  0% { opacity: 0; transform: translate(0, 0) scale(0); }
  30% { opacity: 1; transform: translate(var(--tx), var(--ty)) scale(1.2); }
  100% { opacity: 0; transform: translate(calc(var(--tx) * 1.8), calc(var(--ty) * 1.8)) scale(0); }
`;

// Radiating lines
const radiateAnimation = keyframes`
  0% { opacity: 0; transform: scale(0.5) rotate(0deg); }
  40% { opacity: 0.9; }
  100% { opacity: 0; transform: scale(1.8) rotate(180deg); }
`;

// Yellow detection pulse
const detectPulseAnimation = keyframes`
  0%, 100% { opacity: 0; transform: scale(0.8); }
  50% { opacity: 0.7; transform: scale(1.2); }
`;

// Text appears
const textAppearAnimation = keyframes`
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
`;

const MagnifyingGlass = styled.g`
  transform: translate(-200px, -100px) scale(0.8) rotate(-25deg);
  animation: ${searchAnimation} 6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  will-change: transform;
`;

const BugIcon = styled.g<{ $detected: boolean }>`
  opacity: 1;

  ${props => props.$detected && css`
    animation: ${bugDetectedAnimation} 1s ease-out forwards;
  `}
`;

const DetectionPulse = styled.circle<{ $show: boolean }>`
  opacity: 0;
  ${props => props.$show && css`
    animation: ${detectPulseAnimation} 0.6s ease-out infinite;
  `}
`;

const SuccessCircle = styled.circle<{ $show: boolean }>`
  opacity: 0;
  ${props => props.$show && css`
    animation: ${successCircleAppear} 1.8s ease-out forwards;
  `}
`;

const SuccessCheckmark = styled.path<{ $show: boolean }>`
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  opacity: 0;
  ${props => props.$show && css`
    animation: ${checkmarkDraw} 1.8s ease-out forwards;
    animation-delay: 0.2s;
  `}
`;

const Sparkle = styled.circle<{ $show: boolean; $delay: number }>`
  opacity: 0;
  ${props => props.$show && css`
    animation: ${sparkleAnimation} 1s ease-out forwards;
    animation-delay: ${props.$delay}s;
  `}
`;

const RadiateLines = styled.g<{ $show: boolean }>`
  opacity: 0;
  ${props => props.$show && css`
    animation: ${radiateAnimation} 1.2s ease-out forwards;
    animation-delay: 0.1s;
  `}
`;

const AnimatedText = styled.text<{ $delay: number; $variant: 'light' | 'dark' }>`
  font-family: Inter, Poppins, Montserrat, Segoe UI, Roboto, system-ui, -apple-system, Arial, sans-serif;
  font-size: 84px;
  font-weight: 600;
  fill: ${props => props.$variant === 'dark' ? '#1F2937' : '#E0F2FE'};
  letter-spacing: 0.5px;
  opacity: 0;
  filter: ${props => props.$variant === 'dark'
    ? 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1))'
    : 'drop-shadow(0 4px 12px rgba(6, 182, 212, 0.3))'};
  ${props => css`
    animation: ${textAppearAnimation} 0.6s ease-out forwards;
    animation-delay: ${props.$delay}s;
  `}
`;

interface BugData {
  id: number;
  cx: number;
  cy: number;
  detected: boolean;
}

interface SuccessIndicator {
  id: number;
  x: number;
  y: number;
  show: boolean;
}

// Bug SVG component
const Bug: React.FC<{ x: number; y: number; detected: boolean }> = ({ x, y, detected }) => (
  <BugIcon transform={`translate(${x}, ${y})`} $detected={detected}>
    {/* Bug body */}
    <ellipse cx="0" cy="0" rx="10" ry="14" fill="#DC2626" stroke="#991B1B" strokeWidth="1.5"/>

    {/* Bug head */}
    <circle cx="0" cy="-12" r="6" fill="#DC2626" stroke="#991B1B" strokeWidth="1.5"/>

    {/* Antennae */}
    <line x1="-2.5" y1="-16" x2="-5" y2="-22" stroke="#991B1B" strokeWidth="2" strokeLinecap="round"/>
    <line x1="2.5" y1="-16" x2="5" y2="-22" stroke="#991B1B" strokeWidth="2" strokeLinecap="round"/>

    {/* Legs - left side */}
    <line x1="-10" y1="-5" x2="-17" y2="-8" stroke="#991B1B" strokeWidth="2" strokeLinecap="round"/>
    <line x1="-10" y1="0" x2="-18" y2="0" stroke="#991B1B" strokeWidth="2" strokeLinecap="round"/>
    <line x1="-10" y1="5" x2="-17" y2="8" stroke="#991B1B" strokeWidth="2" strokeLinecap="round"/>

    {/* Legs - right side */}
    <line x1="10" y1="-5" x2="17" y2="-8" stroke="#991B1B" strokeWidth="2" strokeLinecap="round"/>
    <line x1="10" y1="0" x2="18" y2="0" stroke="#991B1B" strokeWidth="2" strokeLinecap="round"/>
    <line x1="10" y1="5" x2="17" y2="8" stroke="#991B1B" strokeWidth="2" strokeLinecap="round"/>

    {/* Wing line detail */}
    <line x1="0" y1="-7" x2="0" y2="10" stroke="#991B1B" strokeWidth="1.5" opacity="0.5"/>
  </BugIcon>
);

interface LogoProps {
  variant?: 'light' | 'dark';
}

const Logo: React.FC<LogoProps> = ({ variant = 'light' }) => {
  const [bugs, setBugs] = React.useState<BugData[]>([
    { id: 1, cx: 200, cy: 70, detected: false },
    { id: 2, cx: 420, cy: 140, detected: false },
    { id: 3, cx: 620, cy: 85, detected: false },
  ]);
  const [currentDetection, setCurrentDetection] = React.useState<number | null>(null);
  const [successIndicators, setSuccessIndicators] = React.useState<SuccessIndicator[]>([]);

  React.useEffect(() => {
    // Bug 1 detection (15% of 6s = 0.9s)
    const bug1DetectTimer = setTimeout(() => {
      setCurrentDetection(1);
    }, 900);

    const bug1RemoveTimer = setTimeout(() => {
      setBugs(prev => prev.map(b => b.id === 1 ? { ...b, detected: true } : b));
      setSuccessIndicators(prev => [...prev, { id: 1, x: 200, y: 70, show: true }]);
      setCurrentDetection(null);
    }, 1400);

    // Bug 2 detection (35% of 6s = 2.1s)
    const bug2DetectTimer = setTimeout(() => {
      setCurrentDetection(2);
    }, 2100);

    const bug2RemoveTimer = setTimeout(() => {
      setBugs(prev => prev.map(b => b.id === 2 ? { ...b, detected: true } : b));
      setSuccessIndicators(prev => [...prev, { id: 2, x: 420, y: 140, show: true }]);
      setCurrentDetection(null);
    }, 2600);

    // Bug 3 detection (60% of 6s = 3.6s)
    const bug3DetectTimer = setTimeout(() => {
      setCurrentDetection(3);
    }, 3600);

    const bug3RemoveTimer = setTimeout(() => {
      setBugs(prev => prev.map(b => b.id === 3 ? { ...b, detected: true } : b));
      setSuccessIndicators(prev => [...prev, { id: 3, x: 620, y: 85, show: true }]);
      setCurrentDetection(null);
    }, 4100);

    // Clear all success indicators
    const clearSuccessTimer = setTimeout(() => {
      setSuccessIndicators([]);
    }, 5500);

    return () => {
      clearTimeout(bug1DetectTimer);
      clearTimeout(bug1RemoveTimer);
      clearTimeout(bug2DetectTimer);
      clearTimeout(bug2RemoveTimer);
      clearTimeout(bug3DetectTimer);
      clearTimeout(bug3RemoveTimer);
      clearTimeout(clearSuccessTimer);
    };
  }, []);

  return (
    <SvgContainer>
      <svg
        width="100%"
        height="100%"
        viewBox="-50 -20 1000 240"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="CogniTest logo with magnifying glass O"
      >
        <defs>
          <linearGradient id="lensGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A7DDD4"/>
            <stop offset="100%" stopColor="#56B7AB"/>
          </linearGradient>
          <radialGradient id="lensHighlight" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.6)"/>
            <stop offset="60%" stopColor="rgba(255,255,255,0.2)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </radialGradient>
          <clipPath id="lensClip">
            <circle cx="0" cy="0" r="28"/>
          </clipPath>
        </defs>

        {/* Success indicators */}
        {successIndicators.map(indicator => (
          <g key={indicator.id} transform={`translate(${indicator.x}, ${indicator.y})`}>
            <RadiateLines $show={indicator.show}>
              <line x1="0" y1="-28" x2="0" y2="-40" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="20" y1="-20" x2="28" y2="-28" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="28" y1="0" x2="40" y2="0" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="20" y1="20" x2="28" y2="28" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="0" y1="28" x2="0" y2="40" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="-20" y1="20" x2="-28" y2="28" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="-28" y1="0" x2="-40" y2="0" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="-20" y1="-20" x2="-28" y2="-28" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"/>
            </RadiateLines>

            <SuccessCircle
              cx="0"
              cy="0"
              r="22"
              fill="#22C55E"
              stroke="#16A34A"
              strokeWidth="3"
              $show={indicator.show}
            />

            <SuccessCheckmark
              d="M -9,0 L -3,9 L 11,-9"
              fill="none"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              $show={indicator.show}
            />

            <Sparkle cx="0" cy="0" r="2.5" fill="#FCD34D" $show={indicator.show} $delay={0.3} style={{'--tx': '-25px', '--ty': '-18px'} as React.CSSProperties}/>
            <Sparkle cx="0" cy="0" r="3" fill="#FCD34D" $show={indicator.show} $delay={0.35} style={{'--tx': '18px', '--ty': '-25px'} as React.CSSProperties}/>
            <Sparkle cx="0" cy="0" r="2.5" fill="#FCD34D" $show={indicator.show} $delay={0.4} style={{'--tx': '26px', '--ty': '12px'} as React.CSSProperties}/>
            <Sparkle cx="0" cy="0" r="3" fill="#FBBF24" $show={indicator.show} $delay={0.38} style={{'--tx': '-20px', '--ty': '22px'} as React.CSSProperties}/>
            <Sparkle cx="0" cy="0" r="2" fill="#FBBF24" $show={indicator.show} $delay={0.42} style={{'--tx': '10px', '--ty': '26px'} as React.CSSProperties}/>
            <Sparkle cx="0" cy="0" r="2" fill="#FCD34D" $show={indicator.show} $delay={0.33} style={{'--tx': '-12px', '--ty': '-26px'} as React.CSSProperties}/>
          </g>
        ))}

        {/* Bugs */}
        {bugs.map(bug => (
          <Bug
            key={bug.id}
            x={bug.cx}
            y={bug.cy}
            detected={bug.detected}
          />
        ))}

        {/* Main logo group - centered */}
        <g transform="translate(250, 120)">
          {/* Text C */}
          <AnimatedText x="0" y="0" $delay={5.5} $variant={variant}>C</AnimatedText>

          {/* Text after O */}
          <AnimatedText x="175" y="0" $delay={5.8} $variant={variant}>gniTest</AnimatedText>

          {/* Magnifying glass */}
          <MagnifyingGlass>
            <DetectionPulse
              cx="0"
              cy="0"
              r="45"
              fill="rgba(255, 215, 0, 0.4)"
              stroke="#F59E0B"
              strokeWidth="2.5"
              $show={currentDetection !== null}
            />

            <circle cx="0" cy="0" r="33" fill="url(#lensGradient)"/>
            <circle cx="0" cy="0" r="33" fill="none" stroke="#2A8F88" strokeWidth="4"/>

            {/* Magnified bug view */}
            <g clipPath="url(#lensClip)">
              <circle cx="0" cy="0" r="28" fill="rgba(255, 255, 255, 0.92)"/>

              {currentDetection && (
                <g>
                  <ellipse cx="0" cy="0" rx="14" ry="20" fill="#DC2626" stroke="#991B1B" strokeWidth="2"/>
                  <circle cx="0" cy="-17" r="8.5" fill="#DC2626" stroke="#991B1B" strokeWidth="2"/>
                  <line x1="-3.5" y1="-23" x2="-7" y2="-30" stroke="#991B1B" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="3.5" y1="-23" x2="7" y2="-30" stroke="#991B1B" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="-14" y1="-7" x2="-22" y2="-11" stroke="#991B1B" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="-14" y1="0" x2="-25" y2="0" stroke="#991B1B" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="-14" y1="7" x2="-22" y2="11" stroke="#991B1B" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="14" y1="-7" x2="22" y2="-11" stroke="#991B1B" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="14" y1="0" x2="25" y2="0" stroke="#991B1B" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="14" y1="7" x2="22" y2="11" stroke="#991B1B" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="0" y1="-10" x2="0" y2="14" stroke="#991B1B" strokeWidth="2" opacity="0.5"/>
                </g>
              )}
            </g>

            <circle cx="0" cy="0" r="31" fill="url(#lensHighlight)" pointerEvents="none"/>

            {/* Handle */}
            <g transform="translate(23,19) rotate(35)">
              <rect x="0" y="-4.5" width="48" height="9" rx="4.5" fill="#2A8F88"/>
            </g>
          </MagnifyingGlass>
        </g>
      </svg>
    </SvgContainer>
  );
};

export default Logo;
