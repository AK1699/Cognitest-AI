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
        <img
            src="/logo.svg"
            alt="CogniTest Logo"
            className={className || "w-10 h-10"}
        />
    );
};
