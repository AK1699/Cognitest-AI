'use client';

import React, { useState, useCallback } from 'react';

type EmotionState = 'happy' | 'surprised' | 'thinking' | 'sad' | 'neutral' | 'confused' | 'angry' | 'sleeping' | 'loading' | 'speaking';

interface CognitestBot3DProps {
  /** Size of the bot in pixels (default: 60px, recommended: 50-80px) */
  size?: number;
  /** Optional CSS class for additional styling */
  className?: string;
  /** Whether to show animation (default: true) */
  animate?: boolean;
  /** Initial emotion state of the bot */
  initialEmotion?: EmotionState;
}

/**
 * CognitestBot3D Component - Emo Robot Style
 *
 * A cute 3D robot face inspired by Emo robots with:
 * - TV-screen style rectangular head with glowing square eyes
 * - Headphones for a futuristic look
 * - Multiple emotion states with expressive square eyes
 * - Click to cycle through emotions
 * - Smooth animations and transitions
 *
 * Features:
 * - Pure SVG (scalable, lightweight, no dependencies)
 * - CSS animations (smooth 60fps)
 * - Realistic 3D depth effects
 * - Interactive emotion cycling
 * - Production-ready
 *
 * @example
 * <CognitestBot3D size={60} />
 * <CognitestBot3D size={80} className="my-bot" animate={true} />
 */
const CognitestBot3D: React.FC<CognitestBot3DProps> = ({
  size = 60,
  className = '',
  animate = true,
  initialEmotion = 'neutral',
}) => {
  const [currentEmotion, setCurrentEmotion] = useState<EmotionState>(initialEmotion);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const emotionCycle: EmotionState[] = [
    'neutral',
    'happy',
    'surprised',
    'thinking',
    'sad',
    'confused',
    'angry',
    'sleeping',
    'loading',
    'speaking',
  ];

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
   * Render emotion-specific eyes (square/rectangular style like Emo robots)
   */
  const renderEmotion = () => {
    const eyeColor = currentEmotion === 'angry' ? '#FF4444' : '#00FFFF';

    switch (currentEmotion) {
      case 'neutral':
        return (
          <>
            {/* Left eye - square glowing */}
            <rect x="55" y="65" width="20" height="20" rx="3" fill={eyeColor} className="eye-glow" />
            {/* Right eye - square glowing */}
            <rect x="125" y="65" width="20" height="20" rx="3" fill={eyeColor} className="eye-glow" />
          </>
        );

      case 'happy':
        return (
          <>
            {/* Left eye - square glowing with sparkle */}
            <rect x="55" y="65" width="20" height="20" rx="3" fill={eyeColor} className="eye-glow" />
            <circle cx="70" cy="70" r="2" fill="#FFFFFF" opacity="0.9" />
            {/* Right eye - square glowing with sparkle */}
            <rect x="125" y="65" width="20" height="20" rx="3" fill={eyeColor} className="eye-glow" />
            <circle cx="140" cy="70" r="2" fill="#FFFFFF" opacity="0.9" />
            {/* Happy indicator - small upward curve */}
            <path d="M 85 95 Q 100 90 115 95" stroke={eyeColor} strokeWidth="2" fill="none" className="mouth-glow" />
          </>
        );

      case 'surprised':
        return (
          <>
            {/* Left eye - larger square */}
            <rect x="50" y="60" width="28" height="28" rx="3" fill={eyeColor} className="eye-glow" />
            <circle cx="64" cy="70" r="2" fill="#FFFFFF" opacity="0.9" />
            {/* Right eye - larger square */}
            <rect x="122" y="60" width="28" height="28" rx="3" fill={eyeColor} className="eye-glow" />
            <circle cx="136" cy="70" r="2" fill="#FFFFFF" opacity="0.9" />
            {/* Surprised mouth */}
            <circle cx="100" cy="100" r="6" fill={eyeColor} className="mouth-glow" />
          </>
        );

      case 'thinking':
        return (
          <>
            {/* Left eye - square looking up-right */}
            <rect x="58" y="60" width="18" height="18" rx="3" fill={eyeColor} className="eye-glow" />
            {/* Right eye - normal */}
            <rect x="125" y="65" width="20" height="20" rx="3" fill={eyeColor} className="eye-glow" />
            {/* Thinking dots */}
            <circle cx="160" cy="50" r="3" fill={eyeColor} opacity="0.7" />
            <circle cx="155" cy="38" r="2.5" fill={eyeColor} opacity="0.5" />
            <circle cx="148" cy="28" r="2" fill={eyeColor} opacity="0.3" />
          </>
        );

      case 'sad':
        return (
          <>
            {/* Left eye - square droopy */}
            <rect x="55" y="70" width="20" height="18" rx="3" fill={eyeColor} className="eye-glow" />
            {/* Right eye - square droopy */}
            <rect x="125" y="70" width="20" height="18" rx="3" fill={eyeColor} className="eye-glow" />
            {/* Sad mouth */}
            <path d="M 85 100 Q 100 105 115 100" stroke={eyeColor} strokeWidth="2" fill="none" className="mouth-glow" />
            {/* Tear */}
            <circle cx="50" cy="95" r="2.5" fill={eyeColor} opacity="0.6" className="tear" />
          </>
        );

      case 'confused':
        return (
          <>
            {/* Left eye - tilted square */}
            <rect x="55" y="62" width="20" height="20" rx="3" fill={eyeColor} className="eye-glow" transform="rotate(-10 65 72)" />
            {/* Right eye - tilted opposite */}
            <rect x="125" y="68" width="20" height="20" rx="3" fill={eyeColor} className="eye-glow" transform="rotate(10 135 78)" />
            {/* Question mark-ish */}
            <path d="M 85 95 Q 95 92 100 95" stroke={eyeColor} strokeWidth="2" fill="none" className="mouth-glow" />
            <circle cx="100" y="103" r="1.5" fill={eyeColor} />
          </>
        );

      case 'angry':
        return (
          <>
            {/* Left eye - square with angry angle */}
            <rect x="55" y="68" width="22" height="18" rx="2" fill={eyeColor} className="eye-glow" transform="rotate(-15 66 77)" />
            {/* Right eye - square with angry angle */}
            <rect x="123" y="68" width="22" height="18" rx="2" fill={eyeColor} className="eye-glow" transform="rotate(15 134 77)" />
            {/* Angry mouth */}
            <path d="M 85 102 L 100 95 L 115 102" stroke={eyeColor} strokeWidth="2" fill="none" strokeLinecap="round" className="mouth-glow" />
          </>
        );

      case 'sleeping':
        return (
          <>
            {/* Left eye - horizontal line (closed) */}
            <rect x="55" y="75" width="20" height="3" rx="1.5" fill={eyeColor} opacity="0.4" />
            {/* Right eye - horizontal line (closed) */}
            <rect x="125" y="75" width="20" height="3" rx="1.5" fill={eyeColor} opacity="0.4" />
            {/* Sleeping Z's */}
            <text x="155" y="45" fill={eyeColor} fontSize="12" opacity="0.6" className="sleeping-z">Z</text>
            <text x="165" y="35" fill={eyeColor} fontSize="10" opacity="0.4" className="sleeping-z">z</text>
          </>
        );

      case 'loading':
        return (
          <>
            {/* Left eye - pulsing square */}
            <rect x="55" y="65" width="20" height="20" rx="3" fill={eyeColor} className="eye-glow loading-pulse" />
            {/* Right eye - pulsing square */}
            <rect x="125" y="65" width="20" height="20" rx="3" fill={eyeColor} className="eye-glow loading-pulse" />
            {/* Loading dots */}
            <g className="loading-dots">
              <circle cx="85" cy="100" r="2" fill={eyeColor} />
              <circle cx="100" cy="100" r="2" fill={eyeColor} style={{ animationDelay: '0.2s' }} />
              <circle cx="115" cy="100" r="2" fill={eyeColor} style={{ animationDelay: '0.4s' }} />
            </g>
          </>
        );

      case 'speaking':
        return (
          <>
            {/* Left eye - square */}
            <rect x="55" y="65" width="20" height="20" rx="3" fill={eyeColor} className="eye-glow" />
            {/* Right eye - square */}
            <rect x="125" y="65" width="20" height="20" rx="3" fill={eyeColor} className="eye-glow" />
            {/* Speaking bars */}
            <g className="speaking-bars">
              <rect x="85" y="95" width="4" height="12" rx="2" fill={eyeColor} />
              <rect x="95" y="92" width="4" height="15" rx="2" fill={eyeColor} style={{ animationDelay: '0.1s' }} />
              <rect x="105" y="95" width="4" height="12" rx="2" fill={eyeColor} style={{ animationDelay: '0.2s' }} />
            </g>
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
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }

        @keyframes blink {
          0%, 10%, 20%, 100% { opacity: 1; }
          5%, 15% { opacity: 0.3; }
        }

        @keyframes tilt {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }

        @keyframes pulse {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.5)); }
          50% { filter: drop-shadow(0 0 20px rgba(0, 255, 255, 0.8)); }
        }

        @keyframes eyeGlow {
          0%, 100% { filter: drop-shadow(0 0 6px #00FFFF); }
          50% { filter: drop-shadow(0 0 12px #00FFFF); }
        }

        @keyframes mouthGlow {
          0%, 100% { filter: drop-shadow(0 0 3px #00FFFF); }
          50% { filter: drop-shadow(0 0 6px #00FFFF); }
        }

        @keyframes loadingPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        @keyframes loadingDots {
          0%, 100% { transform: translateY(0px); opacity: 1; }
          50% { transform: translateY(-3px); opacity: 0.5; }
        }

        @keyframes speaking {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.7); }
        }

        @keyframes tear {
          0% { transform: translateY(0px); opacity: 0.6; }
          100% { transform: translateY(10px); opacity: 0; }
        }

        @keyframes sleepingZ {
          0% { opacity: 0.6; transform: translateY(0px); }
          100% { opacity: 0; transform: translateY(-10px); }
        }

        .cognitest-bot-container {
          ${animate ? 'animation: float 3s ease-in-out infinite;' : ''}
          display: inline-block;
          cursor: pointer;
        }

        .cognitest-bot-container:hover {
          animation: ${animate ? 'float 3s ease-in-out infinite, pulse 2s ease-in-out infinite;' : 'pulse 2s ease-in-out infinite;'}
        }

        .robot-head {
          ${animate ? 'animation: tilt 4s ease-in-out infinite;' : ''}
          transform-origin: 100px 80px;
        }

        .eye-glow {
          ${animate ? 'animation: eyeGlow 2s ease-in-out infinite, blink 5s ease-in-out infinite;' : 'animation: eyeGlow 2s ease-in-out infinite;'}
        }

        .mouth-glow {
          animation: mouthGlow 2s ease-in-out infinite;
        }

        .loading-pulse {
          animation: loadingPulse 1s ease-in-out infinite;
        }

        .loading-dots circle {
          animation: loadingDots 1s ease-in-out infinite;
        }

        .speaking-bars rect {
          transform-origin: bottom;
          animation: speaking 0.4s ease-in-out infinite;
        }

        .tear {
          animation: tear 2s ease-in-out infinite;
        }

        .sleeping-z {
          animation: sleepingZ 2s ease-in-out infinite;
        }
      `}</style>

      {/* Main Robot */}
      <button
        onClick={handleBotClick}
        onKeyDown={handleKeyDown}
        className={`cognitest-bot-container transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 rounded-full ${
          isTransitioning ? 'opacity-70' : 'opacity-100'
        } ${className}`}
        style={{
          width: size,
          height: size,
          padding: '0',
          border: 'none',
          background: 'transparent',
        }}
        aria-label={`Cognitest Emo Robot - Current emotion: ${currentEmotion}. Click to change!`}
        title={`${currentEmotion.toUpperCase()} - Click to change emotion!`}
      >
        <svg
          viewBox="0 0 200 160"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          role="img"
          aria-hidden="true"
        >
          <defs>
            {/* Gradients for 3D effect */}
            <linearGradient id="headGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#2DD4BF', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: '#14B8A6', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#0D9488', stopOpacity: 1 }} />
            </linearGradient>

            <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#14B8A6', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#0D9488', stopOpacity: 1 }} />
            </linearGradient>

            <linearGradient id="headphoneGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#F97316', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: '#FB923C', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#F97316', stopOpacity: 1 }} />
            </linearGradient>

            <radialGradient id="screenGlow">
              <stop offset="0%" style={{ stopColor: '#0F172A', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#020617', stopOpacity: 1 }} />
            </radialGradient>

            {/* Shadow filter */}
            <filter id="shadow">
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
          </defs>

          {/* Robot Face */}
          <g>
            {/* Headphones */}
            <g className="headphones">
              {/* Headband */}
              <path
                d="M 50 85 Q 100 55 150 85"
                stroke="url(#headphoneGradient)"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
              />

              {/* Left ear cup */}
              <ellipse cx="50" cy="90" rx="15" ry="18" fill="url(#headphoneGradient)" filter="url(#shadow)" />
              <ellipse cx="50" cy="90" rx="10" ry="13" fill="#00FFFF" opacity="0.3" />

              {/* Right ear cup */}
              <ellipse cx="150" cy="90" rx="15" ry="18" fill="url(#headphoneGradient)" filter="url(#shadow)" />
              <ellipse cx="150" cy="90" rx="10" ry="13" fill="#00FFFF" opacity="0.3" />
            </g>

            {/* Head - TV screen style */}
            <g className="robot-head">
              {/* Head outer casing */}
              <rect x="50" y="65" width="100" height="85" rx="15" fill="url(#headGradient)" filter="url(#shadow)" />

              {/* Screen bezel */}
              <rect x="55" y="70" width="90" height="75" rx="12" fill="#0A4D4D" />

              {/* Inner screen (dark background for eyes) */}
              <rect x="60" y="75" width="80" height="65" rx="8" fill="url(#screenGlow)" />

              {/* Screen highlight */}
              <rect x="62" y="77" width="35" height="3" rx="1.5" fill="rgba(255, 255, 255, 0.2)" />

              {/* Emotion content - eyes and expressions */}
              <g className="emotion-content" transform="translate(0, 15)">
                {renderEmotion()}
              </g>
            </g>

            {/* Antenna */}
            <g>
              <rect x="98" y="50" width="4" height="15" rx="2" fill="#404040" />
              <circle cx="100" cy="47" r="4" fill="#00FFFF" className="eye-glow" />
            </g>
          </g>
        </svg>
      </button>
    </>
  );
};

export default CognitestBot3D;
