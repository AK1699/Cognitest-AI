'use client';

import React, { useState, useCallback } from 'react';

type EmotionState = 'happy' | 'surprised' | 'thinking' | 'sad';

interface CognitestBot3DProps {
  /** Size of the bot in pixels (default: 50px, recommended: 40-60px) */
  size?: number;
  /** Optional CSS class for additional styling */
  className?: string;
  /** Whether to show animation (default: true) */
  animate?: boolean;
}

/**
 * CognitestBot3D Component with Emotions
 *
 * A beautiful 3D animated logo inspired by Cognitest with:
 * - Glossy spherical shape with realistic 3D lighting
 * - Four emotion states: Happy, Surprised, Thinking, Sad
 * - Click to cycle through emotions
 * - Smooth animations and transitions
 * - Perfect for navbar/header placement
 *
 * Features:
 * - Pure SVG (scalable, lightweight, no dependencies)
 * - CSS animations (smooth 60fps)
 * - Realistic 3D depth effects
 * - Interactive emotion cycling
 * - Production-ready with comprehensive comments
 *
 * @example
 * <CognitestBot3D size={50} />
 * <CognitestBot3D size={60} className="my-logo" animate={true} />
 */
const CognitestBot3D: React.FC<CognitestBot3DProps> = ({
  size = 50,
  className = '',
  animate = true,
}) => {
  // State for emotion cycling
  const [currentEmotion, setCurrentEmotion] = useState<EmotionState>('happy');
  const [isTransitioning, setIsTransitioning] = useState(false);

  /**
   * Emotion cycle: happy -> surprised -> thinking -> sad -> happy
   */
  const emotionCycle: EmotionState[] = ['happy', 'surprised', 'thinking', 'sad'];

  /**
   * Handle bot click to cycle to next emotion
   */
  const handleBotClick = useCallback(() => {
    if (isTransitioning) return;

    setIsTransitioning(true);

    const currentIndex = emotionCycle.indexOf(currentEmotion);
    const nextIndex = (currentIndex + 1) % emotionCycle.length;
    const nextEmotion = emotionCycle[nextIndex];

    setCurrentEmotion(nextEmotion);

    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [currentEmotion, isTransitioning]);

  /**
   * Handle keyboard activation (Enter or Space)
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleBotClick();
      }
    },
    [handleBotClick]
  );

  /**
   * Render emotion-specific facial features
   */
  const renderEmotion = () => {
    switch (currentEmotion) {
      case 'happy':
        return (
          <>
            {/* Left eye - glowing line */}
            <rect x="60" y="85" width="30" height="4" rx="1" ry="1" fill="#00FFFF" className="eye-glow" />
            {/* Right eye - glowing line */}
            <rect x="110" y="85" width="30" height="4" rx="1" ry="1" fill="#00FFFF" className="eye-glow" />
            {/* Happy mouth - segmented line */}
            <path d="M 80 135 L 90 138 L 110 138 L 120 135" stroke="#00FFFF" strokeWidth="2" fill="none" strokeLinecap="round" className="mouth-glow" />
          </>
        );

      case 'surprised':
        return (
          <>
            {/* Left eye - glowing line (wider) */}
            <rect x="55" y="83" width="40" height="6" rx="1" ry="1" fill="#00FFFF" className="eye-glow" />
            {/* Right eye - glowing line (wider) */}
            <rect x="105" y="83" width="40" height="6" rx="1" ry="1" fill="#00FFFF" className="eye-glow" />
            {/* Surprised mouth - open rectangle */}
            <rect x="90" y="130" width="20" height="15" rx="2" ry="2" fill="#00FFFF" className="mouth-glow" />
          </>
        );

      case 'thinking':
        return (
          <>
            {/* Left eye - glowing line (looking up) */}
            <rect x="60" y="75" width="30" height="4" rx="1" ry="1" fill="#00FFFF" className="eye-glow" />
            {/* Right eye - glowing line (normal) */}
            <rect x="110" y="85" width="30" height="4" rx="1" ry="1" fill="#00FFFF" className="eye-glow" />
            {/* Thinking mouth - subtle line */}
            <rect x="85" y="135" width="30" height="2" rx="1" ry="1" fill="#00FFFF" className="mouth-glow" />
            {/* Thinking bubbles - small glowing circles */}
            <circle cx="155" cy="50" r="4" fill="#00FFFF" opacity="0.6" />
            <circle cx="145" cy="35" r="3" fill="#00FFFF" opacity="0.4" />
          </>
        );

      case 'sad':
        return (
          <>
            {/* Left eye - glowing line (droopy) */}
            <rect x="60" y="90" width="30" height="4" rx="1" ry="1" fill="#00FFFF" className="eye-glow" />
            {/* Right eye - glowing line (droopy) */}
            <rect x="110" y="90" width="30" height="4" rx="1" ry="1" fill="#00FFFF" className="eye-glow" />
            {/* Sad mouth - downward segmented line */}
            <path d="M 80 140 L 90 137 L 110 137 L 120 140" stroke="#00FFFF" strokeWidth="2" fill="none" strokeLinecap="round" className="mouth-glow" />
            {/* Tear drops - small glowing circles */}
            <circle cx="65" cy="110" r="3" fill="#00FFFF" opacity="0.6" />
            <circle cx="135" cy="110" r="3" fill="#00FFFF" opacity="0.6" />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Animation styles */}
      <style>{`
        /* Gentle floating animation for lively feel */
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        /* Blinking animation for the eyes (dimming effect) */
        @keyframes blink {
          0%, 10%, 20%, 100% {
            opacity: 1;
          }
          5%, 15% {
            opacity: 0.2; /* Dim the glowing lines */
          }
        }

        /* Subtle rotation/wobble for personality */
        @keyframes wobble {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(0.5deg); /* Less wobble for futuristic feel */
          }
          75% {
            transform: rotate(-0.5deg);
          }
        }

        /* Pulse on hover for interactivity */
        @keyframes pulse {
          0%, 100% {
            filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.4)); /* Cyan glow */
          }
          50% {
            filter: drop-shadow(0 0 15px rgba(0, 255, 255, 0.7));
          }
        }

        /* Emotion transition fade */
        @keyframes emotionFade {
          0% {
            opacity: 0.7;
          }
          100% {
            opacity: 1;
          }
        }

        /* Eye glow effect */
        @keyframes eyeGlow {
          0%, 100% {
            filter: drop-shadow(0 0 3px #00FFFF);
          }
          50% {
            filter: drop-shadow(0 0 6px #00FFFF);
          }
        }

        /* Mouth glow effect */
        @keyframes mouthGlow {
          0%, 100% {
            filter: drop-shadow(0 0 2px #00FFFF);
          }
          50% {
            filter: drop-shadow(0 0 4px #00FFFF);
          }
        }

        .cognitest-bot-3d-container {
          ${animate ? 'animation: float 3s ease-in-out infinite;' : ''}
          display: inline-block;
        }

        .cognitest-bot-3d-container:hover {
          animation: ${animate ? 'float 3s ease-in-out infinite, pulse 2s ease-in-out infinite;' : 'pulse 2s ease-in-out infinite;'}
        }

        .eye-glow {
          animation: eyeGlow 3s ease-in-out infinite alternate;
          ${animate ? 'animation: eyeGlow 3s ease-in-out infinite alternate, blink 5s ease-in-out infinite;' : ''}
        }

        .mouth-glow {
          animation: mouthGlow 3s ease-in-out infinite alternate;
        }

        .cognitest-bot-3d-sphere {
          ${animate ? 'animation: wobble 6s ease-in-out infinite;' : ''}
          transform-origin: center;
          animation-fill-mode: both;
        }

        .cognitest-emotion-content {
          animation: emotionFade 0.3s ease-in-out forwards;
        }
      `}</style>

      {/* Main SVG */}
      <button
        onClick={handleBotClick}
        onKeyDown={handleKeyDown}
        className={`cognitest-bot-3d-container cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded-full ${
          isTransitioning ? 'opacity-70' : 'opacity-100'
        } ${className}`}
        style={{
          width: size,
          height: size,
          padding: '0',
          border: 'none',
background: 'transparent',
        }}
        aria-label={`Cognitest 3D bot - Current emotion: ${currentEmotion}. Click to change emotion!`}
        title={`Current: ${currentEmotion} | Click to change emotion!`}
      >
        <svg
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          role="img"
          aria-hidden="true"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Main sphere gradient - creates 3D bulge effect (brushed metallic) */}
            <radialGradient id="sphereGradient" cx="35%" cy="35%" r="60%">
              {/* Bright highlight for metallic sheen */}
              <stop offset="0%" style={{ stopColor: '#A0A0A0', stopOpacity: 1 }} />
              {/* Main dark grey metallic color */}
              <stop offset="40%" style={{ stopColor: '#404040', stopOpacity: 1 }} />
              {/* Darker grey for depth on edges */}
              <stop offset="100%" style={{ stopColor: '#202020', stopOpacity: 1 }} />
            </radialGradient>

            {/* Secondary gradient for additional depth (subtle) */}
            <radialGradient id="depthGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style={{ stopColor: 'rgba(255, 255, 255, 0.05)', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: 'rgba(0, 0, 0, 0.3)', stopOpacity: 1 }} />
            </radialGradient>

            {/* Filter for soft shadow/glow effect (sharper) */}
            <filter id="softShadow">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
              <feOffset dx="0" dy="1" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.2" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Filter for strong highlight (sharper) */}
            <filter id="brighten">
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" />
            </filter>
          </defs>

          {/* Drop shadow for floating effect */}
          <ellipse
            cx="100"
            cy="165"
            rx="50"
            ry="12"
            fill="rgba(0, 0, 0, 0.2)"
            filter="url(#softShadow)"
          />

          {/* Main metallic sphere - 3D effect */}
          <g className="cognitest-bot-3d-sphere">
            {/* Base sphere with main gradient */}
            <circle
              cx="100"
              cy="100"
              r="85"
              fill="url(#sphereGradient)"
              filter="url(#softShadow)"
            />

            {/* Depth enhancement - subtle second gradient */}
            <circle cx="100" cy="100" r="85" fill="url(#depthGradient)" />

            {/* Top-left sharp highlight for metallic sheen */}
            <rect
              x="40"
              y="30"
              width="40"
              height="5"
              rx="2"
              ry="2"
              fill="rgba(255, 255, 255, 0.6)"
              filter="url(#brighten)"
              transform="rotate(-20 60 32.5)"
            />

            {/* Smaller bright spot for ultra-sharp reflection */}
            <circle
              cx="60"
              cy="40"
              r="5"
              fill="rgba(255, 255, 255, 0.8)"
              filter="url(#brighten)"
            />

            {/* Bottom-right sharp shadow for depth and dimension */}
            <rect
              x="120"
              y="130"
              width="40"
              height="5"
              rx="2"
              ry="2"
              fill="rgba(0, 0, 0, 0.3)"
              transform="rotate(20 140 132.5)"
            />

            {/* Emotion-specific facial features */}
            <g className="cognitest-emotion-content">
              {renderEmotion()}
            </g>
          </g>
        </svg>
      </button>
    </>
  );
};

export default CognitestBot3D;
