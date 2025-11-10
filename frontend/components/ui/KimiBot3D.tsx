'use client';

import React, { useState, useCallback } from 'react';

type EmotionState = 'happy' | 'surprised' | 'thinking' | 'sad';

interface KimiBot3DProps {
  /** Size of the bot in pixels (default: 50px, recommended: 40-60px) */
  size?: number;
  /** Optional CSS class for additional styling */
  className?: string;
  /** Whether to show animation (default: true) */
  animate?: boolean;
}

/**
 * KimiBot3D Component with Emotions
 *
 * A beautiful 3D animated logo inspired by Kimi with:
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
 * <KimiBot3D size={50} />
 * <KimiBot3D size={60} className="my-logo" animate={true} />
 */
const KimiBot3D: React.FC<KimiBot3DProps> = ({
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
            {/* Left eye - normal */}
            <ellipse cx="75" cy="90" rx="22" ry="28" fill="rgba(255, 255, 255, 0.95)" opacity="0.9" />
            {/* Right eye - normal */}
            <ellipse cx="125" cy="90" rx="22" ry="28" fill="rgba(255, 255, 255, 0.95)" opacity="0.9" />
            {/* Left eye blink */}
            <ellipse className="emotion-blink" cx="75" cy="90" rx="20" ry="26" fill="#4A90E2" />
            {/* Right eye blink */}
            <ellipse className="emotion-blink" cx="125" cy="90" rx="20" ry="26" fill="#4A90E2" style={{ animationDelay: '0.3s' }} />
            {/* Eye shine left */}
            <ellipse cx="70" cy="82" rx="6" ry="8" fill="rgba(255, 255, 255, 0.6)" />
            {/* Eye shine right */}
            <ellipse cx="120" cy="82" rx="6" ry="8" fill="rgba(255, 255, 255, 0.6)" />
            {/* Happy smile */}
            <path d="M 80 135 Q 100 145 120 135" stroke="rgba(74, 144, 226, 0.4)" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        );

      case 'surprised':
        return (
          <>
            {/* Left eye - bigger for surprise */}
            <ellipse cx="75" cy="85" rx="26" ry="32" fill="rgba(255, 255, 255, 0.95)" opacity="0.9" />
            {/* Right eye - bigger for surprise */}
            <ellipse cx="125" cy="85" rx="26" ry="32" fill="rgba(255, 255, 255, 0.95)" opacity="0.9" />
            {/* Eye shine left */}
            <ellipse cx="70" cy="75" rx="7" ry="10" fill="rgba(255, 255, 255, 0.6)" />
            {/* Eye shine right */}
            <ellipse cx="120" cy="75" rx="7" ry="10" fill="rgba(255, 255, 255, 0.6)" />
            {/* Surprised O mouth */}
            <circle cx="100" cy="140" r="12" fill="rgba(255, 255, 255, 0.8)" stroke="rgba(74, 144, 226, 0.5)" strokeWidth="2" />
          </>
        );

      case 'thinking':
        return (
          <>
            {/* Left eye - looking up */}
            <ellipse cx="75" cy="75" rx="22" ry="28" fill="rgba(255, 255, 255, 0.95)" opacity="0.9" />
            {/* Right eye - normal */}
            <ellipse cx="125" cy="90" rx="22" ry="28" fill="rgba(255, 255, 255, 0.95)" opacity="0.9" />
            {/* Eye shine left (looking up) */}
            <ellipse cx="70" cy="67" rx="6" ry="8" fill="rgba(255, 255, 255, 0.6)" />
            {/* Eye shine right */}
            <ellipse cx="120" cy="82" rx="6" ry="8" fill="rgba(255, 255, 255, 0.6)" />
            {/* Thinking mouth (small line) */}
            <line x1="90" y1="135" x2="110" y2="135" stroke="rgba(74, 144, 226, 0.4)" strokeWidth="2" strokeLinecap="round" />
            {/* Thinking bubbles */}
            <circle cx="155" cy="50" r="6" fill="rgba(74, 144, 226, 0.3)" />
            <circle cx="145" cy="35" r="4" fill="rgba(74, 144, 226, 0.2)" />
          </>
        );

      case 'sad':
        return (
          <>
            {/* Left eye - droopy */}
            <ellipse cx="75" cy="98" rx="22" ry="28" fill="rgba(255, 255, 255, 0.95)" opacity="0.9" />
            {/* Right eye - droopy */}
            <ellipse cx="125" cy="98" rx="22" ry="28" fill="rgba(255, 255, 255, 0.95)" opacity="0.9" />
            {/* Eye shine left */}
            <ellipse cx="70" cy="90" rx="5" ry="7" fill="rgba(255, 255, 255, 0.5)" />
            {/* Eye shine right */}
            <ellipse cx="120" cy="90" rx="5" ry="7" fill="rgba(255, 255, 255, 0.5)" />
            {/* Sad frown */}
            <path d="M 80 145 Q 100 135 120 145" stroke="rgba(74, 144, 226, 0.4)" strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Tear drop left */}
            <ellipse cx="65" cy="115" rx="3" ry="8" fill="rgba(135, 206, 235, 0.6)" />
            {/* Tear drop right */}
            <ellipse cx="135" cy="115" rx="3" ry="8" fill="rgba(135, 206, 235, 0.6)" />
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

        /* Blinking animation for the eyes */
        @keyframes blink {
          0%, 10%, 20%, 100% {
            transform: scaleY(1);
          }
          5%, 15% {
            transform: scaleY(0.05);
          }
        }

        /* Subtle rotation/wobble for personality */
        @keyframes wobble {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(1deg);
          }
          75% {
            transform: rotate(-1deg);
          }
        }

        /* Pulse on hover for interactivity */
        @keyframes pulse {
          0%, 100% {
            filter: drop-shadow(0 4px 12px rgba(74, 144, 226, 0.3));
          }
          50% {
            filter: drop-shadow(0 8px 20px rgba(74, 144, 226, 0.5));
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

        .kimi-bot-3d-container {
          ${animate ? 'animation: float 3s ease-in-out infinite;' : ''}
          display: inline-block;
        }

        .kimi-bot-3d-container:hover {
          animation: ${animate ? 'float 3s ease-in-out infinite, pulse 2s ease-in-out infinite;' : 'pulse 2s ease-in-out infinite;'}
        }

        .emotion-blink {
          ${animate ? 'animation: blink 5s ease-in-out infinite;' : ''}
          transform-origin: center;
        }

        .kimi-bot-3d-sphere {
          ${animate ? 'animation: wobble 6s ease-in-out infinite;' : ''}
          transform-origin: center;
          animation-fill-mode: both;
        }

        .kimi-emotion-content {
          animation: emotionFade 0.3s ease-in-out forwards;
        }
      `}</style>

      {/* Main SVG */}
      <button
        onClick={handleBotClick}
        onKeyDown={handleKeyDown}
        className={`kimi-bot-3d-container cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded-full ${
          isTransitioning ? 'opacity-70' : 'opacity-100'
        } ${className}`}
        style={{
          width: size,
          height: size,
          padding: '0',
          border: 'none',
          background: 'transparent',
        }}
        aria-label={`CogniTest 3D bot - Current emotion: ${currentEmotion}. Click to change emotion!`}
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
            {/* Main sphere gradient - creates 3D bulge effect */}
            <radialGradient id="sphereGradient" cx="35%" cy="35%" r="60%">
              {/* Bright highlight for glossy effect */}
              <stop offset="0%" style={{ stopColor: '#E8F4F8', stopOpacity: 1 }} />
              {/* Main blue color */}
              <stop offset="40%" style={{ stopColor: '#4A90E2', stopOpacity: 1 }} />
              {/* Darker blue for depth on edges */}
              <stop offset="100%" style={{ stopColor: '#2E5C8A', stopOpacity: 1 }} />
            </radialGradient>

            {/* Secondary gradient for additional depth */}
            <radialGradient id="depthGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style={{ stopColor: 'rgba(255, 255, 255, 0.1)', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: 'rgba(0, 0, 0, 0.2)', stopOpacity: 1 }} />
            </radialGradient>

            {/* Filter for soft shadow/glow effect */}
            <filter id="softShadow">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
              <feOffset dx="0" dy="2" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Filter for strong highlight */}
            <filter id="brighten">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
            </filter>
          </defs>

          {/* Drop shadow for floating effect */}
          <ellipse
            cx="100"
            cy="165"
            rx="50"
            ry="12"
            fill="rgba(0, 0, 0, 0.15)"
            filter="url(#softShadow)"
          />

          {/* Main glossy sphere - 3D effect */}
          <g className="kimi-bot-3d-sphere">
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

            {/* Top-left highlight for glossy, shiny effect */}
            <ellipse
              cx="65"
              cy="55"
              rx="28"
              ry="32"
              fill="rgba(255, 255, 255, 0.4)"
              filter="url(#brighten)"
            />

            {/* Smaller bright spot for ultra-glossy appearance */}
            <circle
              cx="62"
              cy="48"
              r="12"
              fill="rgba(255, 255, 255, 0.7)"
              filter="url(#brighten)"
            />

            {/* Bottom-right shadow for depth and dimension */}
            <ellipse
              cx="130"
              cy="140"
              rx="35"
              ry="30"
              fill="rgba(20, 40, 80, 0.2)"
            />

            {/* Emotion-specific facial features */}
            <g className="kimi-emotion-content">
              {renderEmotion()}
            </g>
          </g>
        </svg>
      </button>
    </>
  );
};

export default KimiBot3D;
