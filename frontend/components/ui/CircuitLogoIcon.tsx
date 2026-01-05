'use client';

import React from 'react';

interface CircuitLogoIconProps {
    className?: string;
}

/**
 * CT logo with normal 'C' and styled slanted 'T', balanced spacing.
 */
export const CircuitLogoIcon: React.FC<CircuitLogoIconProps> = ({ className }) => {
    return (
        <svg
            viewBox="0 0 62 42"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className || "w-10 h-10"}
        >
            {/* Normal 'C' as text */}
            <text
                x="0"
                y="36"
                fontFamily="Arial, sans-serif"
                fontSize="44"
                fontWeight="bold"
                fill="#2D3648"
            >
                C
            </text>

            {/* Styled slanted 'T' - balanced spacing */}
            <g transform="translate(30, 2)">
                {/* Top bar */}
                <path
                    d="M0 2H28V10H0V2Z"
                    fill="#48A19F"
                />

                {/* Slanted stem */}
                <path
                    d="M10 10L5 38H14L19 10H10Z"
                    fill="#48A19F"
                />
            </g>
        </svg>
    );
};
