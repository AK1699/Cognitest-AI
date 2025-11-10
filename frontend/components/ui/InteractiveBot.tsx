'use client';

import React, { useState, useEffect, useCallback } from 'react';

/**
 * Emotion types for the interactive bot
 * Cycles through: Happy → Surprised → Thinking → Sad → Happy
 */
type EmotionState = 'happy' | 'surprised' | 'thinking' | 'sad';

interface InteractiveBotProps {
  /** Optional CSS class for additional styling */
  className?: string;
  /** Bot height in pixels (default: 50px, recommended: 40-60px) */
  size?: number;
}

/**
 * InteractiveBot Component
 *
 * A minimal Kimi-style bot with moving eyes
 * Features:
 * - Eyes that move around naturally
 * - Clean, minimal design
 * - Smooth emotion cycling on click
 * - Responsive sizing
 */
const InteractiveBot: React.FC<InteractiveBotProps> = ({
  className = '',
  size = 50,
}) => {
  // State management
  const [currentEmotion, setCurrentEmotion] = useState<EmotionState>('happy');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  /**
   * Emotion cycle: happy -> surprised -> thinking -> sad -> happy
   */
  const emotionCycle: EmotionState[] = ['happy', 'surprised', 'thinking', 'sad'];

  /**
   * Map emotion state to image path
   */
  const getEmotionImagePath = useCallback((emotion: EmotionState): string => {
    return `/bot-emotions/bot-${emotion}.svg`;
  }, []);

  /**
   * Preload all emotion images on component mount
   */
  useEffect(() => {
    const preloadImages = async () => {
      const imagePromises = emotionCycle.map((emotion) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => reject(false);
          img.src = getEmotionImagePath(emotion);
        });
      });

      try {
        await Promise.all(imagePromises);
        setImagesLoaded(true);
      } catch (error) {
        console.error('Failed to preload bot emotion images:', error);
        setImagesLoaded(true);
      }
    };

    preloadImages();
  }, [emotionCycle, getEmotionImagePath]);

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
  }, [currentEmotion, emotionCycle, isTransitioning]);

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

  // Show fallback while images load
  if (!imagesLoaded) {
    return (
      <div
        className={`rounded-lg bg-blue-400 flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
        aria-label="Loading bot..."
      />
    );
  }

  return (
    <button
      onClick={handleBotClick}
      onKeyDown={handleKeyDown}
      className={`
        relative rounded-full transition-all duration-200
        hover:scale-110 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        dark:focus:ring-offset-gray-900
        cursor-pointer
        ${isTransitioning ? 'opacity-70' : 'opacity-100'}
        ${className}
      `}
      style={{
        width: size,
        height: size,
        padding: '0',
      }}
      aria-label={`CogniTest bot - Current emotion: ${currentEmotion}. Click to change emotion!`}
      title="Click to change my emotion! 👀"
    >
      <img
        src={getEmotionImagePath(currentEmotion)}
        alt={`Bot feeling ${currentEmotion}`}
        className="w-full h-full object-contain transition-all duration-300"
        style={{
          opacity: isTransitioning ? 0.6 : 1,
        }}
        draggable={false}
      />
    </button>
  );
};

export default InteractiveBot;
